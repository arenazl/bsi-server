import FileProcessorService from './FileProcessorService';
import StoredProcedureService, { SPResult } from './StoredProcedureService';
import { TipoModulo } from '../utils/enums';

export interface NominaData {
  CONCEPTO?: string;
  FECHAPAGO?: string;
  ORGANISMO?: string;
  CONTRATO?: string;
  ITEMS: any[];
}

export class NominaService {
  private fileProcessor = FileProcessorService;
  private spService = StoredProcedureService;

  /**
   * Procesa archivo de nómina (TXT o Excel)
   */
  async procesarArchivo(filePath: string, fileName: string): Promise<SPResult> {
    try {
      // Procesar archivo
      const fileData = await this.fileProcessor.processFile(filePath, fileName);
      
      // Validar tipo de módulo
      if (!fileData.tipoModulo.includes('NOMINA')) {
        throw new Error('El archivo debe ser de tipo NOMINA');
      }
      
      // Construir datos para SP
      const nominaData: NominaData = {
        ...fileData.fields,
        ITEMS: fileData.items
      };
      
      // Ejecutar validación e inserción
      const spName = 'NOMINA_VALIDAD_INSERTAR_FULL_VALIDATION';
      const result = await this.spService.executeInsertSP(spName, nominaData);
      
      // Limpiar archivo temporal
      await this.fileProcessor.cleanupTempFile(filePath);
      
      return result;
      
    } catch (error) {
      // Asegurar limpieza en caso de error
      await this.fileProcessor.cleanupTempFile(filePath);
      throw error;
    }
  }

  /**
   * Valida e inserta nómina desde datos JSON
   */
  async validarInsertar(data: NominaData): Promise<SPResult> {
    if (!data || !data.ITEMS || data.ITEMS.length === 0) {
      throw new Error('Datos de nómina inválidos o vacíos');
    }
    
    const spName = 'NOMINA_VALIDAR_INSERTAR_ENTRADA_JSON';
    return await this.spService.executeInsertSP(spName, data);
  }

  /**
   * Lista nóminas con filtros
   */
  async listar(filtros: {
    organismo?: string;
    contrato?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<any> {
    // Por ahora mock, cuando exista el SP:
    // return await this.spService.executeSelectSP('NOMINA_LIST_FILTERED', filtros);
    
    return {
      estado: 1,
      descripcion: "Nóminas obtenidas correctamente",
      data: [
        { id: 1, concepto: "SUELDO-202501", organismo: "MUNICIPIO A", fecha: "2025-01-15", estado: "PROCESADO" },
        { id: 2, concepto: "AGUINALDO-202412", organismo: "MUNICIPIO B", fecha: "2024-12-20", estado: "PENDIENTE" }
      ]
    };
  }

  /**
   * Obtiene resumen de una nómina
   */
  async obtenerResumen(nominaId: string | number): Promise<any> {
    if (!nominaId) {
      throw new Error('ID de nómina es requerido');
    }
    
    return await this.spService.getData(
      TipoModulo.NOMINA,
      'LIST' as any, // Ajustar cuando TipoData esté definido correctamente
      [nominaId]
    );
  }

  /**
   * Valida datos de nómina antes de procesamiento
   */
  private validarDatosNomina(data: NominaData): void {
    if (!data.CONCEPTO) {
      throw new Error('CONCEPTO es requerido');
    }
    
    if (!data.FECHAPAGO) {
      throw new Error('FECHA DE PAGO es requerida');
    }
    
    if (!data.ITEMS || data.ITEMS.length === 0) {
      throw new Error('La nómina debe contener al menos un ítem');
    }
    
    // Validar estructura de items
    const invalidItems = data.ITEMS.filter(item => 
      !item.CBU || !item.CUIL || !item.NOMBRE
    );
    
    if (invalidItems.length > 0) {
      throw new Error(`${invalidItems.length} items tienen datos incompletos (CBU, CUIL o NOMBRE faltantes)`);
    }
  }
}

export default new NominaService();