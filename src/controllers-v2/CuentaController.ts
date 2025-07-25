import { Request, Response } from 'express';
import DatabaseService from '../services-v2/DatabaseService';
import DatabaseHelper from '../DB/databaseHelper';
import CuentaService from '../services-v2/CuentaService';
import { TipoModulo, TipoMetada } from '../utils/enums';

export class CuentaController {
  private dbService = DatabaseService;
  private cuentaService = CuentaService;

  /**
   * POST /api/cuentas/procesar-excel
   * Procesa archivo Excel de cuentas y lo valida/inserta
   */
  async procesarExcel(req: Request, res: Response): Promise<void> {
    const upload = await DatabaseHelper.TempUploadProcess();

    upload(req, res, async () => {
      try {
        if (!req.file) {
          throw new Error('Archivo Excel es requerido para procesar cuentas');
        }

        // Asegurar que el nombre indica CUENTA
        const fileName = req.file.originalname.replace(/^[^-]+/, 'CUENTA');
        
        const result = await this.cuentaService.procesarExcel(
          req.file.path,
          fileName
        );
        
        this.dbService.sendResponse(res, result);

      } catch (error: any) {
        console.error("Error procesando Excel de cuentas:", error);
        this.dbService.throwError(error);
      }
    });
  }

  /**
   * POST /api/cuentas/validar-insertar
   * Valida e inserta datos de cuenta desde JSON
   */
  async validarInsertar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.cuentaService.validarInsertar(req.body);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error validando/insertando cuentas:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/cuentas/:id
   * Obtiene detalle de una cuenta específica
   */
  async obtenerDetalle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.cuentaService.obtenerDetalle(id);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo detalle de cuenta:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/cuentas/metadata/:tipoMetadata
   * Obtiene metadata para renderizar grillas/formularios de cuentas
   */
  async obtenerMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { tipoMetadata } = req.params;
      const { contrato } = req.query;

      let params: (string | number)[] = [];
      if (contrato && contrato !== 'NONE') {
        params.push(Number(contrato));
      }

      const spName = DatabaseHelper.getSpNameForMetada(
        TipoModulo.CUENTA, 
        tipoMetadata as TipoMetada
      );

      if (!spName) {
        throw new Error(`No se encontró SP de metadata para: CUENTA/${tipoMetadata}`);
      }

      const metadata = await this.dbService.executeSpSelect(spName, params);
      this.dbService.sendResponse(res, metadata);
      
    } catch (error: any) {
      console.error("Error obteniendo metadata de cuentas:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/cuentas
   * Lista cuentas con filtros opcionales
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { 
        organismo, 
        tipo_doc,
        fecha_desde, 
        fecha_hasta,
        includeMetadata = false
      } = req.query;
      
      const filtros = {
        organismo: organismo as string,
        tipo_doc: tipo_doc as string,
        fecha_desde: fecha_desde as string,
        fecha_hasta: fecha_hasta as string
      };

      const data = await this.cuentaService.listar(filtros);
      
      // Si piden metadata también
      if (includeMetadata === 'true') {
        const metadata = await this.obtenerMetadataHelper(
          TipoMetada.LIST,
          req.query.contrato as string
        );
        res.json({ data, metadata });
      } else {
        this.dbService.sendResponse(res, data);
      }
      
    } catch (error: any) {
      console.error("Error listando cuentas:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/cuentas/:id
   * Obtiene una cuenta específica (alias para obtenerDetalle)
   */
  async obtener(req: Request, res: Response): Promise<void> {
    return this.obtenerDetalle(req, res);
  }

  /**
   * POST /api/cuentas/generar-alta-masiva
   * Genera archivo de alta masiva
   */
  async generarAltaMasiva(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.cuentaService.generarAltaMasiva(req.body);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error generando alta masiva:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/cuentas/estado/:id
   * Obtiene estado de procesamiento
   */
  async obtenerEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.cuentaService.obtenerEstado(id);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo estado:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * Helper: Obtiene metadata usando DatabaseHelper
   */
  private async obtenerMetadataHelper(
    tipoMetadata: TipoMetada,
    contrato?: string
  ): Promise<any> {
    const params = contrato && contrato !== 'NONE' ? [Number(contrato)] : [];
    const spName = DatabaseHelper.getSpNameForMetada(TipoModulo.CUENTA, tipoMetadata);
    
    if (!spName) {
      throw new Error(`No se encontró SP de metadata para: CUENTA/${tipoMetadata}`);
    }
    
    return await this.dbService.executeSpSelect(spName, params);
  }
}

export default new CuentaController();