import DatabaseHelper from '../DB/databaseHelper';
import ResponseHelper from '../utils/responseHelper';

export class DatabaseService {
  
  /**
   * Ejecuta un Stored Procedure de selección con parámetros JSON
   * Encapsula la lógica de postSelectGenericSP
   */
  async executeSelectSP(spName: string, body: any, jsonUnify: boolean = false): Promise<any> {
    try {
      if (!spName || !body) {
        throw new Error('Faltan parámetros requeridos: sp_name y body son obligatorios');
      }

      let values: Record<string, string | number> = {};

      if (jsonUnify) {
        values = { p_json: JSON.stringify(body) };
      } else {
        Object.entries(body).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            values[key] = value;
          } else {
            values[key] = JSON.stringify(value);
          }
        });
      }

      const rows = await DatabaseHelper.executeSpJsonReturn(spName, values);
      return rows;
      
    } catch (error: any) {
      console.error(`Error ejecutando SP ${spName}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta un Stored Procedure de inserción con parámetros JSON  
   * Encapsula la lógica de postInsertGenericSP
   */
  async executeInsertSP(spName: string, body: any): Promise<any> {
    try {
      if (!spName || !body) {
        throw new Error('Faltan parámetros requeridos: sp_name y body son obligatorios');
      }

      const rows = await DatabaseHelper.executeJsonInsert(spName, body);
      return rows;
      
    } catch (error: any) {
      console.error(`Error ejecutando SP ${spName}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta un SP simple con parámetros array (para compatibilidad)
   */
  async executeSpSelect(spName: string, params: any[]): Promise<any> {
    try {
      const rows = await DatabaseHelper.executeSpSelect(spName, params);
      return rows;
    } catch (error: any) {
      console.error(`Error ejecutando SP ${spName}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta un Stored Procedure genérico (alias para executeSelectSP)
   */
  async executeStoredProcedure(spName: string, params: any): Promise<any> {
    return this.executeSelectSP(spName, params);
  }

  /**
   * Ejecuta un SP que retorna JSON
   */
  async executeSpJsonReturn(spName: string, params: any): Promise<any> {
    try {
      const rows = await DatabaseHelper.executeSpJsonReturn(spName, params);
      return rows;
    } catch (error: any) {
      console.error(`Error ejecutando SP ${spName}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una inserción JSON (alias para compatibilidad)
   */
  async executeJsonInsert(spName: string, body: any): Promise<any> {
    return this.executeInsertSP(spName, body);
  }

  /**
   * Helper para enviar respuesta HTTP consistente
   */
  sendResponse(res: any, data: any): void {
    ResponseHelper.sendDatabaseResponse(res, data);
  }

  /**
   * Helper para manejar errores HTTP consistente  
   */
  throwError(error: any): void {
    ResponseHelper.throwMethodError(error);
  }
}

export default new DatabaseService();