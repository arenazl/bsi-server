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
      console.log("🚀 DEBUGGING PagoService.procesarExcel iniciado:");
      console.log("📁 File Path:", filePath);
      console.log("📄 File Name:", fileName);
      
      // Procesar archivo
      const fileData = await this.fileProcessor.processFile(filePath, fileName);
      console.log("✅ FileData recibido en PagoService:", {
        tipoModulo: fileData.tipoModulo,
        fieldsKeys: Object.keys(fileData.fields),
        itemsCount: fileData.items.length
      });
      
      // Validar tipo
      if (fileData.tipoModulo !== 'PAGO') {
        throw new Error('El archivo debe ser de tipo PAGO');
      }
      
      // Preparar datos base
      const baseData = fileData.fields;
      console.log("📋 Base Data keys:", Object.keys(baseData));
      
      // Primero validar como nómina (sin importes)
      const nominaData = {
        ...baseData,
        ITEMS: fileData.items.map(item => ({
          CBU: item.CBU,
          CUIL: item.CUIL,
          NOMBRE: item.NOMBRE
        }))
      };
      
      console.log("📤 Preparando validación NOMINA:");
      console.log("🔧 BaseData completo:", JSON.stringify(baseData, null, 2));
      console.log("👥 NominaData ITEMS sample:", JSON.stringify(nominaData.ITEMS.slice(0, 3), null, 2));
      
      const resultNomina = await this.validarNomina(nominaData);
      
      // Si la nómina falla, retornar el error con más detalle
      if (resultNomina.estado === 0) {
        await this.fileProcessor.cleanupTempFile(filePath);
        
        // Mejorar el mensaje de error
        let descripcionMejorada = resultNomina.descripcion;
        if (descripcionMejorada === 'Archivo contiene errores' || !descripcionMejorada || descripcionMejorada.trim() === '') {
          descripcionMejorada = 'El archivo contiene datos inválidos en la nómina. Verifique que los CUIL, CBU y nombres estén correctos y complete los datos requeridos.';
        }
        
        return { 
          estado: 0, 
          descripcion: descripcionMejorada,
          data: resultNomina.data,
          tipo_modulo: 'NOMINA',
          error_details: {
            step: 'VALIDACION_NOMINA',
            message: 'Error en validación de nómina antes del procesamiento de pagos',
            original_error: resultNomina.descripcion
          }
        };
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
    
    console.log("🔍 DEBUGGING validarNomina:");
    console.log("📄 SP Name:", spName);
    console.log("📊 Input Data:", JSON.stringify(nominaData, null, 2));
    console.log("📋 Items count:", nominaData.ITEMS?.length || 0);
    
    const result = await this.spService.executeInsertSP(spName, nominaData);
    
    console.log("📥 SP Result:", JSON.stringify(result, null, 2));
    console.log("🎯 Estado:", result.estado);
    console.log("📝 Descripción:", result.descripcion);
    console.log("📊 Data:", result.data);
    
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
    
    return await this.spService.executeSelectSP('PAGO_LIST_FILTERED', [params.organismo, params.estado, params.fecha_desde, params.fecha_hasta]);
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