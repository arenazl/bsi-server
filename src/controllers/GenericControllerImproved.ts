import { Request, Response } from "express";
import DatabaseHelper from "../DB/databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../utils/enums";
import ResponseHelper from "../utils/responseHelper";
import { DatabaseService } from "@services/DatabaseService";

/**
 * GenericController mejorado con validaciones y seguridad
 */
class GenericControllerImproved {
  private databaseService: DatabaseService;
  
  // Lista blanca de SPs permitidos para evitar inyección
  private allowedSelectSPs = new Set([
    'sp_get_contratos_usuario',
    'sp_get_modalidades',
    'sp_get_organismos',
    // Agregar más SPs permitidos aquí
  ]);
  
  private allowedInsertSPs = new Set([
    'sp_insert_nomina_manual',
    'sp_insert_cuenta_masiva',
    // Agregar más SPs permitidos aquí
  ]);

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Ejecuta un SP de selección con validaciones
   */
  public executeSelect = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spName, parameters = {}, options = {} } = req.body;
      
      // Validaciones
      if (!spName) {
        return ResponseHelper.error(res, 'El nombre del SP es requerido', 400);
      }
      
      // Validar contra lista blanca
      if (!this.allowedSelectSPs.has(spName)) {
        console.warn(`Intento de ejecutar SP no autorizado: ${spName}`);
        return ResponseHelper.error(res, 'Operación no permitida', 403);
      }
      
      // Log de auditoría
      const userId = (req as any).user?.id;
      console.log(`Usuario ${userId} ejecutando ${spName}`, { parameters });
      
      // Ejecutar con el servicio estándar
      const result = await this.databaseService.executeStoredProcedure(spName, parameters);
      
      // Respuesta estándar
      this.databaseService.sendResponse(res, result);
      
    } catch (error) {
      console.error("Error en executeSelect:", error);
      ResponseHelper.error(res, 'Error al ejecutar la consulta');
    }
  };

  /**
   * Ejecuta un SP de inserción/actualización con validaciones
   */
  public executeInsert = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spName, data, validateSchema = true } = req.body;
      
      // Validaciones básicas
      if (!spName || !data) {
        return ResponseHelper.error(res, 'SP y datos son requeridos', 400);
      }
      
      // Validar contra lista blanca
      if (!this.allowedInsertSPs.has(spName)) {
        console.warn(`Intento de ejecutar SP no autorizado: ${spName}`);
        return ResponseHelper.error(res, 'Operación no permitida', 403);
      }
      
      // Validar esquema si está habilitado
      if (validateSchema) {
        const validationError = this.validateDataSchema(spName, data);
        if (validationError) {
          return ResponseHelper.error(res, validationError, 400);
        }
      }
      
      // Log de auditoría
      const userId = (req as any).user?.id;
      console.log(`Usuario ${userId} ejecutando ${spName}`, { dataKeys: Object.keys(data) });
      
      // Ejecutar
      const result = await this.databaseService.executeStoredProcedure(spName, data);
      
      // Respuesta estándar
      this.databaseService.sendResponse(res, result);
      
    } catch (error) {
      console.error("Error en executeInsert:", error);
      ResponseHelper.error(res, 'Error al ejecutar la operación');
    }
  };

  /**
   * Obtiene metadata con caché y validaciones
   */
  public getMetadata = async (req: Request, res: Response): Promise<void> => {
    try {
      const { module, type, contractId } = req.params;
      
      // Validar parámetros
      if (!module || !type) {
        return ResponseHelper.error(res, 'Módulo y tipo son requeridos', 400);
      }
      
      // Validar enums
      if (!Object.values(TipoModulo).includes(module as TipoModulo)) {
        return ResponseHelper.error(res, 'Módulo inválido', 400);
      }
      
      if (!Object.values(TipoMetada).includes(type as TipoMetada)) {
        return ResponseHelper.error(res, 'Tipo de metadata inválido', 400);
      }
      
      // Construir SP name de forma segura
      const spName = this.getMetadataSpName(module as TipoModulo, type as TipoMetada);
      
      if (!spName) {
        return ResponseHelper.error(res, 'Configuración no disponible', 404);
      }
      
      // Parámetros
      const params: any = {};
      if (contractId && contractId !== 'NONE') {
        params.contractId = parseInt(contractId);
      }
      
      // Ejecutar
      const result = await this.databaseService.executeStoredProcedure(spName, params);
      
      // Respuesta con caché headers
      res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutos
      this.databaseService.sendResponse(res, result);
      
    } catch (error) {
      console.error("Error en getMetadata:", error);
      ResponseHelper.error(res, 'Error al obtener metadata');
    }
  };

  /**
   * Endpoint para consultas dinámicas con SQL builder seguro
   */
  public query = async (req: Request, res: Response): Promise<void> => {
    try {
      const { table, fields = '*', conditions = {}, orderBy, limit } = req.body;
      
      // Validar tabla contra lista blanca
      const allowedTables = ['BSI_CONTRATOS', 'BSI_MODALIDADES', 'BSI_ORGANISMOS'];
      if (!allowedTables.includes(table)) {
        return ResponseHelper.error(res, 'Tabla no permitida', 403);
      }
      
      // Construir query de forma segura
      const query = this.buildSecureQuery({
        table,
        fields: Array.isArray(fields) ? fields : [fields],
        conditions,
        orderBy,
        limit
      });
      
      // Ejecutar query
      const result = await DatabaseHelper.executeQuery(query.text, query.params);
      
      ResponseHelper.success(res, result, 'Consulta ejecutada exitosamente');
      
    } catch (error) {
      console.error("Error en query:", error);
      ResponseHelper.error(res, 'Error al ejecutar consulta');
    }
  };

  /**
   * Validación de esquema según el SP
   */
  private validateDataSchema(spName: string, data: any): string | null {
    const schemas: Record<string, string[]> = {
      'sp_insert_nomina_manual': ['idUsuario', 'idOrganismo', 'idContrato', 'datos'],
      'sp_insert_cuenta_masiva': ['idUsuario', 'cuentas'],
      // Agregar más esquemas aquí
    };
    
    const requiredFields = schemas[spName];
    if (!requiredFields) return null;
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        return `Campo requerido faltante: ${field}`;
      }
    }
    
    return null;
  }

  /**
   * Obtiene el nombre del SP de metadata de forma segura
   */
  private getMetadataSpName(module: TipoModulo, type: TipoMetada): string | null {
    const mapping: Record<string, string> = {
      [`${TipoModulo.NOMINA}_${TipoMetada.IMPORT}`]: 'sp_get_metadata_nomina_import',
      [`${TipoModulo.NOMINA}_${TipoMetada.VERIFY}`]: 'sp_get_metadata_nomina_verify',
      [`${TipoModulo.CUENTA}_${TipoMetada.IMPORT}`]: 'sp_get_metadata_cuenta_import',
      // Agregar más mapeos aquí
    };
    
    return mapping[`${module}_${type}`] || null;
  }

  /**
   * Construye una query SQL de forma segura
   */
  private buildSecureQuery(options: any): { text: string; params: any[] } {
    const { table, fields, conditions, orderBy, limit } = options;
    const params: any[] = [];
    let paramIndex = 1;
    
    // SELECT clause
    const fieldList = fields.map((f: string) => `[${f}]`).join(', ');
    let query = `SELECT ${fieldList} FROM [${table}]`;
    
    // WHERE clause
    if (Object.keys(conditions).length > 0) {
      const whereClauses = Object.entries(conditions).map(([key, value]) => {
        params.push(value);
        return `[${key}] = @p${paramIndex++}`;
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // ORDER BY clause
    if (orderBy) {
      const [field, direction = 'ASC'] = orderBy.split(' ');
      query += ` ORDER BY [${field}] ${direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    // LIMIT clause (SQL Server usa TOP)
    if (limit && Number.isInteger(limit) && limit > 0) {
      query = query.replace('SELECT', `SELECT TOP ${limit}`);
    }
    
    return { text: query, params };
  }
}

export default new GenericControllerImproved();