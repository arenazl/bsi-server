import { Request, Response } from 'express';
import DatabaseService from '../services/DatabaseService';
import DatabaseHelper from '../DB/databaseHelper';
import NominaService from '../services/NominaService';
import FileProcessorService from '../services/FileProcessorService';
import { TipoModulo, TipoMetada, TipoData } from '../utils/enums';

export class NominaController {
  private dbService = DatabaseService;
  private nominaService = NominaService;
  private fileProcessor = FileProcessorService;


  /**
   * POST /api/nominas/procesar
   * Procesa archivo de nómina (TXT o Excel) y lo valida/inserta
   */
  async procesar(req: Request, res: Response): Promise<void> {
    const upload = await DatabaseHelper.TempUploadProcess();

    upload(req, res, async () => {
      try {
        if (!req.file) {
          throw new Error('Archivo es requerido para procesar nómina');
        }

        const result = await this.nominaService.procesarArchivo(
          req.file.path,
          req.file.originalname
        );

        this.dbService.sendResponse(res, result);

      } catch (error: any) {
        console.error("Error procesando nómina:", error);
        this.dbService.throwError(error);
      }
    });
  }

  /**
   * POST /api/nominas/procesar-excel  
   * Procesa nómina desde archivo Excel
   */
  async procesarExcel(req: Request, res: Response): Promise<void> {
    const upload = await DatabaseHelper.TempUploadProcess();

    upload(req, res, async () => {
      try {
        if (!req.file) {
          throw new Error('Archivo Excel es requerido');
        }

        // Cambiar el nombre para indicar que es NOMINA_XSL
        const fileName = req.file.originalname.replace(/^[^-]+/, 'NOMINA_XSL');

        const result = await this.nominaService.procesarArchivo(
          req.file.path,
          fileName
        );

        this.dbService.sendResponse(res, result);

      } catch (error: any) {
        console.error("Error procesando Excel de nómina:", error);
        this.dbService.throwError(error);
      }
    });
  }

  /**
   * POST /api/nominas/validar-insertar
   * Valida e inserta datos de nómina desde JSON
   */
  async validarInsertar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.nominaService.validarInsertar(req.body);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error validando/insertando nómina:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/nominas/:id
   * Obtiene resumen de una nómina específica
   */
  async obtenerResumen(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.nominaService.obtenerResumen(id);
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo resumen de nómina:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/nominas/metadata/:tipoMetadata
   * Obtiene metadata para renderizar grillas/formularios de nóminas
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
        TipoModulo.NOMINA,
        tipoMetadata as TipoMetada
      );

      if (!spName) {
        throw new Error(`No se encontró SP de metadata para: NOMINA/${tipoMetadata}`);
      }

      const metadata = await this.dbService.executeSpSelect(spName, params);
      this.dbService.sendResponse(res, metadata);

    } catch (error: any) {
      console.error("Error obteniendo metadata de nóminas:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/nominas
   * Lista nóminas con filtros opcionales
   */
  async listar(req: Request, res: Response): Promise<void> {
    console.log('=== LLEGÓ A NOMINA CONTROLLER LISTAR ===');
    try {
      const {
        organismo,
        contrato,
        fecha_desde,
        fecha_hasta,
        includeMetadata = false
      } = req.query;

      const filtros = {
        organismo: organismo as string,
        contrato: contrato as string,
        fecha_desde: fecha_desde as string,
        fecha_hasta: fecha_hasta as string
      };

      const data = await this.nominaService.listar(filtros);

      // Si piden metadata también
      if (includeMetadata === 'true') {
        const metadata = await this.obtenerMetadataHelper(
          TipoMetada.LIST,
          contrato as string
        );
        res.json({ data, metadata });
      } else {
        this.dbService.sendResponse(res, data);
      }

    } catch (error: any) {
      console.error("Error listando nóminas:", error);
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
    const spName = DatabaseHelper.getSpNameForMetada(TipoModulo.NOMINA, tipoMetadata);

    if (!spName) {
      throw new Error(`No se encontró SP de metadata para: NOMINA/${tipoMetadata}`);
    }

    return await this.dbService.executeSpSelect(spName, params);
  }
}

export default new NominaController();