import DatabaseService from './DatabaseService';
import DatabaseHelper from '../DB/databaseHelper';
import { TipoModulo, TipoMetada, TipoData } from '../utils/enums';

export interface SPResult {
  estado: number;
  descripcion: string;
  data?: any;
  tipo_modulo?: string;
  [key: string]: any;
}

export class StoredProcedureService {
  private dbService = DatabaseService;

  /**
   * Ejecuta un SP de inserción/validación
   */
  async executeInsertSP(spName: string, data: any): Promise<SPResult> {
    const result = await this.dbService.executeInsertSP(spName, data);
    
    // Normalizar respuesta
    if (result && result[0] && result[0][0] && result[0][0][0]) {
      return result[0][0][0];
    }
    
    throw new Error('Respuesta inesperada del SP');
  }

  /**
   * Ejecuta un SP de selección
   */
  async executeSelectSP(spName: string, params: any[] = []): Promise<any> {
    return await this.dbService.executeSpSelect(spName, params);
  }

  /**
   * Obtiene metadata según tipo
   */
  async getMetadata(tipoModulo: TipoModulo, tipoMetadata: TipoMetada, contrato?: number): Promise<any> {
    const spName = DatabaseHelper.getSpNameForMetada(tipoModulo, tipoMetadata);
    
    if (!spName) {
      throw new Error(`No se encontró SP de metadata para: ${tipoModulo}/${tipoMetadata}`);
    }
    
    const params = contrato ? [contrato] : [];
    return await this.executeSelectSP(spName, params);
  }

  /**
   * Obtiene datos según tipo
   */
  async getData(tipoModulo: TipoModulo, tipoData: TipoData, params: any[] = []): Promise<any> {
    const spName = DatabaseHelper.getSpNameForData(tipoModulo, tipoData);
    
    if (!spName) {
      throw new Error(`No se encontró SP de datos para: ${tipoModulo}/${tipoData}`);
    }
    
    return await this.executeSelectSP(spName, params);
  }

  /**
   * Valida resultado de SP y lanza error si falló
   */
  validateSPResult(result: SPResult, errorMessage?: string): void {
    if (result.estado === 0) {
      throw new Error(errorMessage || result.descripcion || 'Error en operación');
    }
  }

  /**
   * Ejecuta múltiples SPs en secuencia con manejo de errores
   */
  async executeSequentialSPs(operations: Array<{
    spName: string;
    data: any;
    validateResult?: boolean;
    onSuccess?: (result: SPResult) => void;
    onError?: (error: any) => void;
  }>): Promise<SPResult[]> {
    const results: SPResult[] = [];
    
    for (const operation of operations) {
      try {
        const result = await this.executeInsertSP(operation.spName, operation.data);
        
        if (operation.validateResult) {
          this.validateSPResult(result);
        }
        
        if (operation.onSuccess) {
          operation.onSuccess(result);
        }
        
        results.push(result);
        
        // Si un SP falla con estado 0, detener la secuencia
        if (result.estado === 0) {
          break;
        }
      } catch (error) {
        if (operation.onError) {
          operation.onError(error);
        }
        throw error;
      }
    }
    
    return results;
  }
}

export default new StoredProcedureService();