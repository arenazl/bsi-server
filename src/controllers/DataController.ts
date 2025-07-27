import { Request, Response } from 'express';
import { DatabaseService } from '@services/DatabaseService';
import ResponseHelper from '@utils/responseHelper';
import GenericDbHelper from '@utils/genericDbHelper';
import { TipoModulo, TipoMetada } from '@utils/enums';

/**
 * Controller específico que usa el GenericDbHelper
 * Mantiene la responsabilidad de manejar HTTP
 */
export class DataController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * GET /api/v2/data/metadata/:module/:type/:contractId?
   * Obtiene metadata para formularios dinámicos
   */
  public getMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const { module, type, contractId } = req.params;
      const userId = (req as any).user?.id;

      // Validar enums
      if (!Object.values(TipoModulo).includes(module as TipoModulo)) {
        return ResponseHelper.error(res, 'Módulo inválido', 400);
      }

      if (!Object.values(TipoMetada).includes(type as TipoMetada)) {
        return ResponseHelper.error(res, 'Tipo de metadata inválido', 400);
      }

      // Obtener SP usando el helper
      const spName = GenericDbHelper.getMetadataSP(
        module as TipoModulo,
        type as TipoMetada
      );

      if (!spName) {
        return ResponseHelper.error(res, 'Configuración no disponible', 404);
      }

      // Construir parámetros comunes
      const params = GenericDbHelper.buildCommonParams(
        userId,
        contractId ? parseInt(contractId) : undefined
      );

      // Ejecutar SP
      const result = await GenericDbHelper.executeSP(spName, params);

      // Parsear y responder
      const parsedResult = GenericDbHelper.parseJsonResult(result);
      this.databaseService.sendResponse(res, parsedResult);

    } catch (error) {
      console.error('Error obteniendo metadata:', error);
      ResponseHelper.error(res, 'Error al obtener configuración');
    }
  };

  /**
   * POST /api/v2/data/execute
   * Ejecuta operaciones de datos con validaciones
   */
  public executeOperation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { operation, module, data } = req.body;
      const userId = (req as any).user?.id;

      // Definir operaciones permitidas por módulo
      const allowedOperations = {
        [TipoModulo.NOMINA]: ['import', 'verify', 'export', 'process'],
        [TipoModulo.CUENTA]: ['import', 'verify', 'validate_cbu'],
        [TipoModulo.PAGO]: ['generate', 'authorize', 'export']
      };

      // Validar operación permitida
      if (!allowedOperations[module]?.includes(operation)) {
        return ResponseHelper.error(res, 'Operación no permitida', 403);
      }

      // Mapear a SP específico
      const spName = this.getOperationSP(module, operation);

      // Agregar metadata común
      const enrichedData = {
        ...data,
        ...GenericDbHelper.buildCommonParams(userId)
      };

      // Ejecutar
      const result = await GenericDbHelper.executeSP(spName, enrichedData);

      // Responder
      const parsedResult = GenericDbHelper.parseJsonResult(result);
      this.databaseService.sendResponse(res, parsedResult);

    } catch (error) {
      console.error('Error ejecutando operación:', error);
      ResponseHelper.error(res, error.message || 'Error en la operación');
    }
  };

  /**
   * POST /api/v2/data/import
   * Importación masiva con validaciones
   */
  public importData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { module, records, validateFirst = true } = req.body;
      const userId = (req as any).user?.id;

      // Validar módulo
      if (!Object.values(TipoModulo).includes(module)) {
        return ResponseHelper.error(res, 'Módulo inválido', 400);
      }

      // TODO: Implementar configuración de importación
      // const config = GenericDbHelper.importMappings[module];
      // if (!config) {
      //   return ResponseHelper.error(res, 'Importación no configurada para este módulo', 400);
      // }
      const config = { fields: [] }; // Temporal

      // Validar estructura de datos
      if (validateFirst) {
        const validationErrors = this.validateImportData(records, config.fields);
        if (validationErrors.length > 0) {
          return ResponseHelper.error(res, 'Errores de validación', 400);
        }
      }

      // Ejecutar importación
      const result = await GenericDbHelper.executeBatch(
        //@ts-ignore
        config.spName,
        records.map(record => ({
          ...record,
          usuarioAlta: userId,
          fechaAlta: new Date()
        }))
      );

      // Contar éxitos y errores
      const summary = {
        total: result.length,
        exitosos: result.filter(r => r.success).length,
        errores: result.filter(r => !r.success).length,
        detalles: result
      };

      ResponseHelper.success(res, summary, 'Importación completada');

    } catch (error) {
      console.error('Error en importación:', error);
      ResponseHelper.error(res, 'Error al importar datos');
    }
  };

  /**
   * Mapea operación a SP específico
   */
  private getOperationSP(module: string, operation: string): string {
    const operationMap = {
      [`${TipoModulo.NOMINA}_import`]: 'sp_import_nomina_batch',
      [`${TipoModulo.NOMINA}_verify`]: 'sp_verify_nomina',
      [`${TipoModulo.NOMINA}_process`]: 'sp_process_nomina',
      [`${TipoModulo.CUENTA}_import`]: 'sp_import_cuenta_batch',
      [`${TipoModulo.CUENTA}_validate_cbu`]: 'sp_validate_cbu_masivo',
      [`${TipoModulo.PAGO}_generate`]: 'sp_generate_archivo_pago',
      [`${TipoModulo.PAGO}_authorize`]: 'sp_authorize_pago'
    };

    const sp = operationMap[`${module}_${operation}`];
    if (!sp) {
      throw new Error(`No se encontró SP para ${module}/${operation}`);
    }

    return sp;
  }

  /**
   * Valida datos de importación
   */
  private validateImportData(records: any[], requiredFields: string[]): string[] {
    const errors: string[] = [];

    records.forEach((record, index) => {
      requiredFields.forEach(field => {
        if (!record[field]) {
          errors.push(`Registro ${index + 1}: campo ${field} es requerido`);
        }
      });
    });

    return errors;
  }
}

export default new DataController();