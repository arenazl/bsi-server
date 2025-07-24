import FileProcessorService from './FileProcessorService';
import StoredProcedureService, { SPResult } from './StoredProcedureService';
import NominaService from './NominaService';

export interface PagoData {
  CONCEPTO?: string;
  FECHAPAGO?: string;
  ORGANISMO?: string;
  CONTRATO?: string;
  ITEMS: Array<{
    CBU: string;
    CUIL: string;
    NOMBRE: string;
    IMPORTE: number;
  }>;
}

export class PagoService {
  private fileProcessor = FileProcessorService;
  private spService = StoredProcedureService;
  private nominaService = NominaService;

  /**
   * Procesa archivo Excel de pagos con validación de nómina
   */
  async procesarExcel(filePath: string, fileName: string): Promise<SPResult> {
    try {
      // Procesar archivo
      const fileData = await this.fileProcessor.processFile(filePath, fileName);
      
      // Validar tipo
      if (fileData.tipoModulo !== 'PAGO') {
        throw new Error('El archivo debe ser de tipo PAGO');
      }
      
      // Preparar datos base
      const baseData = fileData.fields;
      
      // Primero validar como nómina (sin importes)
      const nominaData = {
        ...baseData,
        ITEMS: fileData.items.map(item => ({
          CBU: item.CBU,
          CUIL: item.CUIL,
          NOMBRE: item.NOMBRE
        }))
      };
      
      const resultNomina = await this.validarNomina(nominaData);
      
      // Si la nómina falla, retornar el error
      if (resultNomina.estado === 0) {
        await this.fileProcessor.cleanupTempFile(filePath);
        return { ...resultNomina, tipo_modulo: 'NOMINA' };
      }
      
      // Si nómina OK, procesar pagos con importes
      const pagoData: PagoData = {
        ...baseData,
        ITEMS: fileData.items
      };
      
      const result = await this.procesarPago(pagoData);
      
      // Limpiar archivo
      await this.fileProcessor.cleanupTempFile(filePath);
      
      return result;
      
    } catch (error) {
      await this.fileProcessor.cleanupTempFile(filePath);
      throw error;
    }
  }

  /**
   * Valida la nómina asociada al pago
   */
  private async validarNomina(nominaData: any): Promise<SPResult> {
    const spName = 'NOMINA_VALIDAD_INSERTAR_FULL_VALIDATION';
    const result = await this.spService.executeInsertSP(spName, nominaData);
    
    console.log("Validación NOMINA:", result);
    return result;
  }

  /**
   * Procesa el pago después de validar la nómina
   */
  private async procesarPago(pagoData: PagoData): Promise<SPResult> {
    this.validarDatosPago(pagoData);
    
    const spName = 'PAGO_VALIDAR_INSERTAR_ENTRADA';
    return await this.spService.executeInsertSP(spName, pagoData);
  }

  /**
   * Valida e inserta pago desde JSON
   */
  async validarInsertar(data: PagoData): Promise<SPResult> {
    this.validarDatosPago(data);
    
    const spName = 'PAGO_VALIDAR_INSERTAR_ENTRADA';
    return await this.spService.executeInsertSP(spName, data);
  }

  /**
   * Genera archivo de salida para pagos
   */
  async generarArchivo(pagoId: number, formato: 'TXT' | 'EXCEL' = 'TXT'): Promise<any> {
    if (!pagoId) {
      throw new Error('ID de pago es requerido');
    }
    
    const spName = `PAGO_GENERAR_ARCHIVO_${formato}`;
    return await this.spService.executeSelectSP(spName, [pagoId]);
  }

  /**
   * Envía archivo por FTP
   */
  async enviarFtp(params: {
    pagoId: number;
    servidor: string;
    usuario: string;
    directorio: string;
  }): Promise<SPResult> {
    if (!params.pagoId) {
      throw new Error('ID de pago es requerido para envío FTP');
    }
    
    // TODO: Implementar lógica real de FTP
    
    // Por ahora, marcar como enviado en BD
    return await this.spService.executeInsertSP('PAGO_MARCAR_ENVIADO_FTP', {
      pago_id: params.pagoId,
      servidor: params.servidor,
      usuario: params.usuario,
      directorio: params.directorio,
      fecha_envio: new Date().toISOString()
    });
  }

  /**
   * Lista pagos con filtros
   */
  async listar(filtros: {
    organismo?: string;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<any> {
    const params = {
      organismo: filtros.organismo || null,
      estado: filtros.estado || null,
      fecha_desde: filtros.fecha_desde || null,
      fecha_hasta: filtros.fecha_hasta || null
    };
    
    return await this.spService.executeSelectSP('PAGO_LIST_FILTERED', params);
  }

  /**
   * Obtiene detalle de un pago
   */
  async obtenerDetalle(pagoId: string | number): Promise<any> {
    if (!pagoId) {
      throw new Error('ID de pago es requerido');
    }
    
    return await this.spService.executeSelectSP('PAGO_GET_DETALLE', [pagoId]);
  }

  /**
   * Obtiene estadísticas de pagos
   */
  async obtenerEstadisticas(): Promise<any> {
    return await this.spService.executeSelectSP('PAGO_GET_ESTADISTICAS', []);
  }

  /**
   * Valida datos de pago
   */
  private validarDatosPago(data: PagoData): void {
    if (!data.ITEMS || data.ITEMS.length === 0) {
      throw new Error('El pago debe contener al menos un ítem');
    }
    
    // Validar que todos los items tengan importe
    const invalidItems = data.ITEMS.filter(item => 
      !item.CBU || !item.CUIL || !item.NOMBRE || 
      item.IMPORTE === undefined || item.IMPORTE === null || item.IMPORTE <= 0
    );
    
    if (invalidItems.length > 0) {
      throw new Error(`${invalidItems.length} items tienen datos incompletos o importe inválido`);
    }
  }
}

export default new PagoService();