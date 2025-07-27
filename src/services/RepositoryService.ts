import { DatabaseService } from './DatabaseService';
import { Request } from 'express';

/**
 * Servicio de repositorio que encapsula operaciones de datos comunes
 * Mejor práctica que un controller genérico
 */
export class RepositoryService {
  private databaseService: DatabaseService;
  
  // Configuración de entidades y sus operaciones permitidas
  private entityConfig = {
    contratos: {
      table: 'BSI_CONTRATOS',
      primaryKey: 'IdContrato',
      operations: {
        list: 'sp_get_contratos_usuario',
        get: 'sp_get_contrato_detalle',
        create: 'sp_insert_contrato',
        update: 'sp_update_contrato',
        delete: null // No permitir delete
      },
      requiredFields: {
        create: ['NombreContrato', 'IdModalidad', 'IdOrganismo'],
        update: ['IdContrato']
      }
    },
    modalidades: {
      table: 'BSI_MODALIDADES',
      primaryKey: 'IdModalidad',
      operations: {
        list: 'sp_get_modalidades',
        get: 'sp_get_modalidad_detalle',
        create: null,
        update: null,
        delete: null
      },
      requiredFields: {}
    },
    nominas: {
      table: 'BSI_NOMINAS',
      primaryKey: 'IdNomina',
      operations: {
        list: 'sp_get_nominas_contrato',
        get: 'sp_get_nomina_detalle',
        create: 'sp_insert_nomina',
        update: 'sp_update_nomina',
        delete: 'sp_delete_nomina'
      },
      requiredFields: {
        create: ['IdContrato', 'Concepto', 'FechaPago'],
        update: ['IdNomina'],
        delete: ['IdNomina']
      }
    }
  };

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Lista entidades con filtros opcionales
   */
  async list(entityType: string, filters: any = {}, userId?: number) {
    const config = this.entityConfig[entityType];
    if (!config || !config.operations.list) {
      throw new Error(`Operación list no permitida para ${entityType}`);
    }

    // Agregar userId a los filtros si es necesario
    if (userId) {
      filters.userId = userId;
    }

    return await this.databaseService.executeStoredProcedure(
      config.operations.list,
      filters
    );
  }

  /**
   * Obtiene una entidad por ID
   */
  async get(entityType: string, id: number, userId?: number) {
    const config = this.entityConfig[entityType];
    if (!config || !config.operations.get) {
      throw new Error(`Operación get no permitida para ${entityType}`);
    }

    const params: any = { [config.primaryKey]: id };
    if (userId) {
      params.userId = userId;
    }

    return await this.databaseService.executeStoredProcedure(
      config.operations.get,
      params
    );
  }

  /**
   * Crea una nueva entidad
   */
  async create(entityType: string, data: any, userId?: number) {
    const config = this.entityConfig[entityType];
    if (!config || !config.operations.create) {
      throw new Error(`Operación create no permitida para ${entityType}`);
    }

    // Validar campos requeridos
    this.validateRequiredFields(entityType, 'create', data);

    // Agregar metadata
    const enrichedData = {
      ...data,
      usuarioAlta: userId,
      fechaAlta: new Date()
    };

    return await this.databaseService.executeStoredProcedure(
      config.operations.create,
      enrichedData
    );
  }

  /**
   * Actualiza una entidad existente
   */
  async update(entityType: string, id: number, data: any, userId?: number) {
    const config = this.entityConfig[entityType];
    if (!config || !config.operations.update) {
      throw new Error(`Operación update no permitida para ${entityType}`);
    }

    // Validar campos requeridos
    this.validateRequiredFields(entityType, 'update', data);

    // Agregar metadata
    const enrichedData = {
      ...data,
      [config.primaryKey]: id,
      usuarioModificacion: userId,
      fechaModificacion: new Date()
    };

    return await this.databaseService.executeStoredProcedure(
      config.operations.update,
      enrichedData
    );
  }

  /**
   * Elimina una entidad (soft delete preferentemente)
   */
  async delete(entityType: string, id: number, userId?: number) {
    const config = this.entityConfig[entityType];
    if (!config || !config.operations.delete) {
      throw new Error(`Operación delete no permitida para ${entityType}`);
    }

    const params = {
      [config.primaryKey]: id,
      usuarioBaja: userId,
      fechaBaja: new Date()
    };

    return await this.databaseService.executeStoredProcedure(
      config.operations.delete,
      params
    );
  }

  /**
   * Ejecuta una operación custom definida
   */
  async executeCustomOperation(operationName: string, params: any, userId?: number) {
    // Lista de operaciones custom permitidas
    const allowedOperations = [
      'sp_procesar_nomina_masiva',
      'sp_generar_archivo_pago',
      'sp_validar_cbu_masivo'
    ];

    if (!allowedOperations.includes(operationName)) {
      throw new Error(`Operación ${operationName} no permitida`);
    }

    // Enriquecer con userId si está disponible
    const enrichedParams = userId ? { ...params, userId } : params;

    return await this.databaseService.executeStoredProcedure(
      operationName,
      enrichedParams
    );
  }

  /**
   * Obtiene metadata para formularios dinámicos
   */
  async getFormMetadata(entityType: string, operation: 'create' | 'update') {
    const metadataSp = `sp_get_form_metadata_${entityType}_${operation}`;
    
    try {
      return await this.databaseService.executeStoredProcedure(metadataSp, {});
    } catch (error) {
      // Si no existe SP específico, devolver configuración básica
      const config = this.entityConfig[entityType];
      if (!config) {
        throw new Error(`Entidad ${entityType} no configurada`);
      }

      return {
        estado: 1,
        descripcion: 'Metadata básica',
        data: {
          fields: config.requiredFields[operation] || [],
          entity: entityType,
          operation
        }
      };
    }
  }

  /**
   * Valida campos requeridos
   */
  private validateRequiredFields(entityType: string, operation: string, data: any) {
    const config = this.entityConfig[entityType];
    const requiredFields = config.requiredFields[operation] || [];

    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Registra una nueva entidad en el sistema
   */
  registerEntity(name: string, config: any) {
    if (this.entityConfig[name]) {
      throw new Error(`Entidad ${name} ya está registrada`);
    }

    this.entityConfig[name] = config;
  }
}