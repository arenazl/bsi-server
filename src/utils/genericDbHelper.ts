import DatabaseHelper from '../DB/databaseHelper';
import { TipoModulo, TipoMetada, TipoData } from './enums';

/**
 * Helper para operaciones genéricas de base de datos
 * Encapsula lógica reutilizable sin ser un controller
 */
export class GenericDbHelper {
  
  /**
   * Configuración de mapeos para importación
   */
  static importMappings = {
    [TipoModulo.NOMINA]: {
      spName: 'sp_import_nomina',
      fields: ['cuil', 'nombre', 'cbu', 'importe']
    },
    [TipoModulo.CUENTA]: {
      spName: 'sp_import_cuenta',
      fields: ['cuil', 'cbu', 'tipoCuenta', 'banco']
    },
    [TipoModulo.PAGO]: {
      spName: 'sp_import_pago',
      fields: ['cuil', 'concepto', 'importe', 'fechaPago']
    }
  };

  /**
   * Ejecuta un SP de forma genérica con validaciones básicas
   */
  static async executeSP(spName: string, params: any, options: { jsonUnify?: boolean } = {}) {
    if (!spName) {
      throw new Error('Nombre del SP es requerido');
    }

    let values: Record<string, any> = {};

    if (options.jsonUnify) {
      // Enviar todos los parámetros como un único JSON
      values = { p_json: JSON.stringify(params) };
    } else {
      // Convertir cada parámetro según su tipo
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          values[key] = null;
        } else if (typeof value === 'object') {
          values[key] = JSON.stringify(value);
        } else {
          values[key] = value;
        }
      });
    }

    return await DatabaseHelper.executeSpJsonReturn(spName, values);
  }

  /**
   * Ejecuta un SP de inserción con manejo de transacciones
   */
  static async executeInsert(spName: string, data: any) {
    if (!spName || !data) {
      throw new Error('SP y datos son requeridos');
    }

    // Si es un array, ejecutar en batch
    if (Array.isArray(data)) {
      return await this.executeBatch(spName, data);
    }

    return await DatabaseHelper.executeJsonInsert(spName, data);
  }

  /**
   * Ejecuta múltiples inserciones en una transacción
   */
  static async executeBatch(spName: string, dataArray: any[]) {
    const results = [];

    // TODO: Implementar transacción real
    for (const data of dataArray) {
      try {
        const result = await DatabaseHelper.executeJsonInsert(spName, data);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Obtiene el SP correcto para metadata según módulo y tipo
   */
  static getMetadataSP(module: TipoModulo, type: TipoMetada): string | null {
    // Mapeo centralizado de SPs de metadata
    const metadataMap = {
      [TipoModulo.NOMINA]: {
        [TipoMetada.IMPORT]: 'sp_get_metadata_nomina_import',
        [TipoMetada.VERIFY]: 'sp_get_metadata_nomina_verify',
        [TipoMetada.COMBO]: 'sp_get_metadata_nomina_combo'
      },
      [TipoModulo.CUENTA]: {
        [TipoMetada.IMPORT]: 'sp_get_metadata_cuenta_import',
        [TipoMetada.VERIFY]: 'sp_get_metadata_cuenta_verify',
        [TipoMetada.COMBO]: 'sp_get_metadata_cuenta_combo'
      },
      [TipoModulo.PAGO]: {
        [TipoMetada.IMPORT]: 'sp_get_metadata_pago_import',
        [TipoMetada.VERIFY]: 'sp_get_metadata_pago_verify',
        [TipoMetada.COMBO]: 'sp_get_metadata_pago_combo'
      }
    };

    return metadataMap[module]?.[type] || null;
  }

  /**
   * Obtiene el SP correcto para datos según módulo y tipo
   */
  static getDataSP(module: TipoModulo, type: TipoData): string | null {
    const dataMap = {
      [TipoModulo.NOMINA]: {
        [TipoData.LIST]: 'sp_get_nominas_list',
        [TipoData.DETAIL]: 'sp_get_nomina_detail',
        [TipoData.EXPORT]: 'sp_export_nomina_data'
      },
      [TipoModulo.CUENTA]: {
        [TipoData.LIST]: 'sp_get_cuentas_list',
        [TipoData.DETAIL]: 'sp_get_cuenta_detail',
        [TipoData.EXPORT]: 'sp_export_cuenta_data'
      },
      [TipoModulo.PAGO]: {
        [TipoData.LIST]: 'sp_get_pagos_list',
        [TipoData.DETAIL]: 'sp_get_pago_detail',
        [TipoData.EXPORT]: 'sp_export_pago_data'
      }
    };

    return dataMap[module]?.[type] || null;
  }

  /**
   * Construye parámetros comunes para SPs
   */
  static buildCommonParams(userId?: number, contractId?: number, orgId?: number) {
    const params: any = {};

    if (userId) params.idUsuario = userId;
    if (contractId) params.idContrato = contractId;
    if (orgId) params.idOrganismo = orgId;

    params.fechaOperacion = new Date();

    return params;
  }

  /**
   * Parsea resultados de SPs que devuelven JSON
   */
  static parseJsonResult(result: any): any {
    if (!result || result.length === 0) return null;

    const row = result[0];

    // Si tiene estructura estándar (estado, descripcion, data)
    if (row.estado !== undefined && row.data) {
      if (typeof row.data === 'string') {
        try {
          row.data = JSON.parse(row.data);
        } catch (e) {
          console.warn('No se pudo parsear data como JSON:', e);
        }
      }
      return row;
    }

    // Si es un resultado simple
    return result;
  }

  /**
   * Valida parámetros según reglas de negocio
   */
  static validateParams(params: any, rules: any) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules) as [string, any][]) {
      const value = params[field];

      // Requerido
      if (rule.required && !value) {
        errors.push(`${field} es requerido`);
      }

      // Tipo
      if (value && rule.type) {
        const actualType = typeof value;
        if (actualType !== rule.type) {
          errors.push(`${field} debe ser tipo ${rule.type}`);
        }
      }

      // Rango
      if (value && rule.min !== undefined && value < rule.min) {
        errors.push(`${field} debe ser mayor a ${rule.min}`);
      }

      if (value && rule.max !== undefined && value > rule.max) {
        errors.push(`${field} debe ser menor a ${rule.max}`);
      }

      // Patrón
      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} tiene formato inválido`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Errores de validación: ${errors.join(', ')}`);
    }
  }
}

/**
 * Configuración de mapeos para importación de archivos
 */
export const importMappings: Record<string, { startRow: number; fields: string[]; spName: string }> = {
  PAGO: {
    startRow: 3,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO'],
    spName: 'sp_import_pagos'
  },
  CUENTA: {
    startRow: 4,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'ROTULO', 'ENTE', 'CBU'],
    spName: 'sp_import_cuentas'
  },
  NOMINA: {
    startRow: 0,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'LEGAJO', 'NOMBRE', 'IMPORTE'],
    spName: 'sp_import_nomina'
  }
};

export default GenericDbHelper;