import FileProcessorService from './FileProcessorService';
import StoredProcedureService, { SPResult } from './StoredProcedureService';

export interface CuentaData {
  CONCEPTO?: string;
  FECHAPAGO?: string;
  ORGANISMO?: string;
  CONTRATO?: string;
  ITEMS: Array<{
    CUIL: string;
    Tipo_Doc: string;
    Nro_Doc: string;
    Apellidos: string;
    Nombres: string;
    Fecha_Nacimiento: string;
    Sexo: string;
  }>;
}

export class CuentaService {
  private fileProcessor = FileProcessorService;
  private spService = StoredProcedureService;

  /**
   * Procesa archivo Excel de cuentas
   */
  async procesarExcel(filePath: string, fileName: string): Promise<SPResult> {
    try {
      // Procesar archivo
      const fileData = await this.fileProcessor.processFile(filePath, fileName);
      
      // Validar tipo
      if (fileData.tipoModulo !== 'CUENTA') {
        throw new Error('El archivo debe ser de tipo CUENTA');
      }
      
      // Construir datos para SP
      const cuentaData: CuentaData = {
        ...fileData.fields,
        ITEMS: fileData.items
      };
      
      // Validar datos
      this.validarDatosCuenta(cuentaData);
      
      // Ejecutar SP
      const spName = 'CUENTA_VALIDAR_INSERTAR_ENTRADA';
      const result = await this.spService.executeInsertSP(spName, cuentaData);
      
      // Limpiar archivo
      await this.fileProcessor.cleanupTempFile(filePath);
      
      return result;
      
    } catch (error) {
      await this.fileProcessor.cleanupTempFile(filePath);
      throw error;
    }
  }

  /**
   * Valida e inserta cuenta desde JSON
   */
  async validarInsertar(data: CuentaData): Promise<SPResult> {
    this.validarDatosCuenta(data);
    
    const spName = 'CUENTA_VALIDAR_INSERTAR_ENTRADA';
    return await this.spService.executeInsertSP(spName, data);
  }

  /**
   * Lista cuentas con filtros
   */
  async listar(filtros: {
    organismo?: string;
    tipo_doc?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<any> {
    const params = {
      organismo: filtros.organismo || null,
      tipo_doc: filtros.tipo_doc || null,
      fecha_desde: filtros.fecha_desde || null,
      fecha_hasta: filtros.fecha_hasta || null
    };
    
    return await this.spService.executeSelectSP('CUENTA_LIST_FILTERED', [params.organismo, params.tipo_doc, params.fecha_desde, params.fecha_hasta]);
  }

  /**
   * Obtiene detalle de una cuenta
   */
  async obtenerDetalle(cuentaId: string | number): Promise<any> {
    if (!cuentaId) {
      throw new Error('ID de cuenta es requerido');
    }
    
    return await this.spService.executeSelectSP('CUENTA_GET_DETALLE', [cuentaId]);
  }

  /**
   * Genera archivo de alta masiva
   */
  async generarAltaMasiva(data: any): Promise<any> {
    return await this.spService.executeSelectSP('CUENTA_GENERAR_ALTA_MASIVA', data);
  }

  /**
   * Obtiene estado de procesamiento
   */
  async obtenerEstado(id: string | number): Promise<any> {
    if (!id) {
      throw new Error('ID es requerido');
    }
    
    return await this.spService.executeSelectSP('CUENTA_GET_ESTADO', [id]);
  }

  /**
   * Valida datos de cuenta
   */
  private validarDatosCuenta(data: CuentaData): void {
    if (!data.ITEMS || data.ITEMS.length === 0) {
      throw new Error('La cuenta debe contener al menos un ítem');
    }
    
    // Validar estructura de items
    const invalidItems = data.ITEMS.filter(item => 
      !item.CUIL || !item.Tipo_Doc || !item.Nro_Doc || 
      !item.Apellidos || !item.Nombres
    );
    
    if (invalidItems.length > 0) {
      throw new Error(`${invalidItems.length} items tienen datos incompletos`);
    }
  }
}

export default new CuentaService();