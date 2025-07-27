import { Request, Response } from 'express';
import DatabaseService from '../services/DatabaseService';
import DatabaseHelper from '../DB/databaseHelper';
import PagoService from '../services/PagoService';
import { TipoModulo, TipoMetada } from '../utils/enums';

export class PagoController {
  private dbService = DatabaseService;
  private pagoService = PagoService;

  /**
   * POST /api/pagos/procesar-excel
   * Procesa archivo Excel de pagos y lo valida/inserta
   */
  async procesarExcel(req: Request, res: Response): Promise<void> {
    const upload = await DatabaseHelper.TempUploadProcess();

    upload(req, res, async () => {
      try {
        if (!req.file) {
          throw new Error('Archivo Excel es requerido para procesar pagos');
        }

        // Asegurar que el nombre indica PAGO
        const fileName = req.file.originalname.replace(/^[^-]+/, 'PAGO');

        const result = await this.pagoService.procesarExcel(
          req.file.path,
          fileName
        );

        this.dbService.sendResponse(res, result);

      } catch (error: any) {
        console.error("Error procesando Excel de pagos:", error);
        this.dbService.throwError(error);
      }
    });
  }

  /**
   * POST /api/pagos/validar-insertar
   * Valida e inserta datos de pago desde JSON
   */
  async validarInsertar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.pagoService.validarInsertar(req.body);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error validando/insertando pagos:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * POST /api/pagos/generar-archivo
   * Genera archivo de salida para pagos procesados
   */
  async generarArchivo(req: Request, res: Response): Promise<void> {
    try {
      const { pagoId, formato = 'TXT' } = req.body;
      const result = await this.pagoService.generarArchivo(pagoId, formato);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error generando archivo de pago:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * POST /api/pagos/enviar-ftp
   * Envía archivo de pago por FTP
   */
  async enviarFtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.pagoService.enviarFtp(req.body);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error enviando por FTP:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/pagos/:id
   * Obtiene detalle de un pago específico
   */
  async obtenerDetalle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.pagoService.obtenerDetalle(id);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo detalle de pago:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/pagos/metadata/:tipoMetadata
   * Obtiene metadata para renderizar grillas/formularios de pagos
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
        TipoModulo.PAGO,
        tipoMetadata as TipoMetada
      );

      if (!spName) {
        throw new Error(`No se encontró SP de metadata para: PAGO/${tipoMetadata}`);
      }

      const metadata = await this.dbService.executeSpSelect(spName, params);
      this.dbService.sendResponse(res, metadata);

    } catch (error: any) {
      console.error("Error obteniendo metadata de pagos:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/pagos
   * Lista pagos con filtros opcionales
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        organismo,
        estado,
        fecha_desde,
        fecha_hasta,
        includeMetadata = false
      } = req.query;

      const filtros = {
        organismo: organismo as string,
        estado: estado as string,
        fecha_desde: fecha_desde as string,
        fecha_hasta: fecha_hasta as string
      };

      const data = await this.pagoService.listar(filtros);

      // Si piden metadata también
      if (includeMetadata === 'true') {
        const metadata = await this.obtenerMetadataHelper(TipoMetada.LIST);
        res.json({ data, metadata });
      } else {
        this.dbService.sendResponse(res, data);
      }

    } catch (error: any) {
      console.error("Error listando pagos:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/pagos/estado
   * Obtiene estado general de pagos (pendientes, procesados, enviados)
   */
  async obtenerEstado(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.pagoService.obtenerEstadisticas();
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo estado de pagos:", error);
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
    const spName = DatabaseHelper.getSpNameForMetada(TipoModulo.PAGO, tipoMetadata);

    if (!spName) {
      throw new Error(`No se encontró SP de metadata para: PAGO/${tipoMetadata}`);
    }

    return await this.dbService.executeSpSelect(spName, params);
  }
}

export default new PagoController();