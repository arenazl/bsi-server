import { Response } from 'express';

interface StandardResponse {
  estado: number;
  descripcion: string;
  data: any;
}

export class ResponseHelper {
  
  public static sendError(res: Response, message?: string): void {
    res.json({
      estado: 0,
      descripcion: message || "Error interno del servidor",
      data: null
    });
  }

  public static throwMethodError(error: any, methodName?: string): never {
    const finalMethodName = methodName || ResponseHelper.getCallerMethodName();
    const finalMessage = error.message || "Error interno del servidor";
    throw new Error(`${finalMessage} durante ${finalMethodName}`);
  }

  private static getCallerMethodName(): string {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      // Buscar la línea que contiene el método del controller
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Controller.') && !line.includes('ResponseHelper')) {
          const match = line.match(/Controller\.(\w+)/);
          return match ? match[1] : 'método desconocido';
        }
      }
    }
    return 'método desconocido';
  }

  public static sendSuccess(res: Response, data: any = null, message: string = 'Operación exitosa'): void {
    res.json({
      estado: 1,
      descripcion: message,
      data: data
    });
  }


  public static createErrorResponse(message: string): StandardResponse {
    return {
      estado: 0,
      descripcion: message,
      data: null
    };
  }

  public static createSuccessResponse(data: any = null, message: string = 'Operación exitosa'): StandardResponse {
    return {
      estado: 1,
      descripcion: message,
      data: data
    };
  }

  /**
   * Método auxiliar para procesar respuestas de base de datos y enviarlas de forma estandarizada
   * Analiza automáticamente el formato de la respuesta del SP
   * Maneja las 4 propiedades: ID, ESTADO, DESCRIPCION, DATA
   */
  public static sendDatabaseResponse(res: Response, dbResult: any): void {
    try {
      let response: any = {};

      // Caso 1: Resultado de executeJsonInsert - Array anidado
      if (Array.isArray(dbResult) && dbResult.length > 0 && Array.isArray(dbResult[0]) && dbResult[0].length > 0) {
        const result = dbResult[0][0][0]; // Estructura típica de executeJsonInsert
        
        if (result && typeof result === 'object') {
          response = ResponseHelper.processResultObject(result);
        } else {
          response = ResponseHelper.createErrorResponse('Formato de respuesta de base de datos no válido');
        }
      }
      // Caso 2: Resultado directo con propiedades
      else if (dbResult && typeof dbResult === 'object' && !Array.isArray(dbResult)) {
        response = ResponseHelper.processResultObject(dbResult);
      }
      // Caso 3: Array directo (executeSpJsonReturn)
      else if (Array.isArray(dbResult) && dbResult.length > 0) {
        const result = dbResult[0];
        if (result && typeof result === 'object') {
          // Verificar si tiene solo campo RESULT
          if (result.RESULT !== undefined && Object.keys(result).length === 1) {
            let parsedResult;
            try {
              parsedResult = typeof result.RESULT === 'string' ? JSON.parse(result.RESULT) : result.RESULT;
            } catch (error) {
              parsedResult = result.RESULT;
            }
            
            response = {
              estado: 1,
              descripcion: 'Datos obtenidos correctamente',
              data: parsedResult
            };
          }
          // Si tiene propiedades de respuesta estándar
          else if (result.estado !== undefined || result.ESTADO !== undefined) {
            response = ResponseHelper.processResultObject(result, true);
          }
          // Si es una lista directa, poner todo el array en data
          else {
            response = {
              estado: 1,
              descripcion: 'Datos obtenidos correctamente',
              data: dbResult
            };
          }
        } else {
          // Si es una lista directa, poner todo el array en data
          response = {
            estado: 1,
            descripcion: 'Datos obtenidos correctamente',
            data: dbResult
          };
        }
      }
      // Caso 4: Resultado desconocido o error
      else {
        response = ResponseHelper.createErrorResponse('Respuesta de base de datos no válida');
      }

      res.json(response);
      
    } catch (error) {
      console.error('Error procesando respuesta de base de datos:', error);
      ResponseHelper.sendError(res, 'Error interno del servidor');
    }
  }




  /**
   * Método auxiliar que analiza automáticamente el formato del objeto resultado
   */
  private static processResultObject(result: any, isArrayResult: boolean = false): any {
    // Nuevo: Caso especial para SP que devuelven solo campo RESULT
    if (result.RESULT !== undefined && Object.keys(result).length === 1) {
      let parsedResult;
      try {
        // Intentar parsear el RESULT como JSON
        parsedResult = typeof result.RESULT === 'string' ? JSON.parse(result.RESULT) : result.RESULT;
      } catch (error) {
        // Si no es JSON válido, usar el valor tal como está
        parsedResult = result.RESULT;
      }
      
      return {
        estado: 1,
        descripcion: 'Datos obtenidos correctamente',
        data: parsedResult
      };
    }


    // Formato 1: {ID, ESTADO, DESCRIPCION} - típico de INSERT simples
    if (result.ID !== undefined && result.ESTADO !== undefined && result.DESCRIPCION !== undefined) {
      return {
        id: result.ID,
        estado: result.ESTADO,
        descripcion: result.DESCRIPCION,
        data: null
      };
    }
    // Formato 2: {estado, descripcion, data} - típico de validaciones/SELECT
    else {
      return {
        estado: result.estado !== undefined ? result.estado : (result.ESTADO !== undefined ? result.ESTADO : 1),
        descripcion: result.descripcion || result.DESCRIPCION || 'Operación completada',
        data: result.data || result.Data || result.DATA || (isArrayResult ? result : null)
      };
    }
  }

  /**
   * Versión que retorna el objeto sin enviarlo (para casos donde se necesita procesar antes de enviar)
   */
  public static processDatabaseResult(dbResult: any): StandardResponse {
    try {
      // Caso 1: Resultado de executeJsonInsert - Array anidado
      if (Array.isArray(dbResult) && dbResult.length > 0 && Array.isArray(dbResult[0]) && dbResult[0].length > 0) {
        const result = dbResult[0][0][0]; // Estructura típica de executeJsonInsert
        
        if (result && typeof result === 'object') {
          return {
            estado: result.estado !== undefined ? result.estado : (result.ESTADO !== undefined ? result.ESTADO : 0),
            descripcion: result.descripcion || result.DESCRIPCION || 'Operación completada',
            data: result.data || result.Data || result.DATA || null
          };
        } else {
          return ResponseHelper.createErrorResponse('Formato de respuesta de base de datos no válido');
        }
      }
      // Caso 2: Resultado directo con propiedades ESTADO/estado
      else if (dbResult && typeof dbResult === 'object' && !Array.isArray(dbResult)) {
        return {
          estado: dbResult.estado !== undefined ? dbResult.estado : (dbResult.ESTADO !== undefined ? dbResult.ESTADO : 0),
          descripcion: dbResult.descripcion || dbResult.DESCRIPCION || 'Operación completada',
          data: dbResult.data || dbResult.Data || dbResult.DATA || null
        };
      }
      // Caso 3: Array directo (executeSpJsonReturn)
      else if (Array.isArray(dbResult) && dbResult.length > 0) {
        const result = dbResult[0];
        if (result && typeof result === 'object') {
          return {
            estado: result.estado !== undefined ? result.estado : (result.ESTADO !== undefined ? result.ESTADO : 1),
            descripcion: result.descripcion || result.DESCRIPCION || 'Operación completada',
            data: result.data || result.Data || result.DATA || result
          };
        } else {
          return ResponseHelper.createSuccessResponse(dbResult, 'Datos obtenidos correctamente');
        }
      }
      // Caso 4: Resultado desconocido o error
      else {
        return ResponseHelper.createErrorResponse('Respuesta de base de datos no válida');
      }
      
    } catch (error) {
      console.error('Error procesando respuesta de base de datos:', error);
      return ResponseHelper.createErrorResponse('Error interno del servidor');
    }
  }
}

export default ResponseHelper;
