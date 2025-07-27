import { Request, Response, NextFunction } from 'express';
import DatabaseService from '../services/DatabaseService';
import DatabaseHelper from '../DB/databaseHelper';
import NominaService from '../services/NominaService';
import PagoService from '../services/PagoService';
import CuentaService from '../services/CuentaService';
import * as fs from 'fs';
import * as path from 'path';

export class ArchivoController {
  private dbService = DatabaseService;
  private nominaService = NominaService;
  private pagoService = PagoService;
  private cuentaService = CuentaService;

  /**
   * POST /api/archivos/subir
   * Endpoint general para subir archivos de cualquier tipo
   */
  async subir(req: Request, res: Response): Promise<void> {
    const upload = await DatabaseHelper.TempUploadProcess();

    upload(req, res, async () => {
      try {
        if (!req.file) {
          throw new Error('Archivo es requerido');
        }

        const { tipoModulo, organismo, contrato, usuario } = req.body;

        if (!tipoModulo || !organismo || !contrato || !usuario) {
          throw new Error('Faltan parámetros requeridos: tipoModulo, organismo, contrato, usuario');
        }

        // Registrar archivo en BD
        const archivoData = {
          nombre_original: req.file.originalname,
          nombre_archivo: req.file.filename,
          ruta: req.file.path,
          tamaño: req.file.size,
          tipo_modulo: tipoModulo,
          id_organismo: organismo,
          id_contrato: contrato,
          id_usuario: usuario,
          estado: 'SUBIDO',
          fecha_subida: new Date().toISOString()
        };

        const result = await this.dbService.executeInsertSP('ARCHIVO_REGISTRAR_SUBIDA', archivoData);

        this.dbService.sendResponse(res, {
          success: true,
          archivoId: result[0]?.insertId || result[0]?.[0]?.id,
          mensaje: 'Archivo subido correctamente',
          archivo: archivoData
        });

      } catch (error: any) {
        console.error("Error subiendo archivo:", error);
        if (req.file?.path) {
          this.cleanupTempFile(req.file.path);
        }
        this.dbService.throwError(error);
      }
    });
  }

  /**
   * GET /api/archivos/:id/descargar
   * Descarga archivo procesado por ID
   */
  async descargar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de archivo es requerido');
      }

      // Obtener info del archivo
      const archivoInfo = await this.dbService.executeSpSelect('ARCHIVO_GET_INFO', [id]);

      if (!archivoInfo || archivoInfo.length === 0) {
        res.status(404).json({ error: 'Archivo no encontrado' });
        return;
      }

      const archivo = archivoInfo[0];
      const filePath = archivo.ruta_salida || archivo.ruta;

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Archivo físico no encontrado' });
        return;
      }

      // Enviar archivo
      res.setHeader('Content-Disposition', `attachment; filename="${archivo.nombre_salida || archivo.nombre_original}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Registrar descarga
      await this.dbService.executeInsertSP('ARCHIVO_REGISTRAR_DESCARGA', {
        archivo_id: id,
        fecha_descarga: new Date().toISOString(),
        ip_descarga: req.ip
      });

    } catch (error: any) {
      console.error("Error descargando archivo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/archivos/:id/estado
   * Obtiene estado de procesamiento de un archivo
   */
  async obtenerEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de archivo es requerido');
      }

      const result = await this.dbService.executeSpSelect('ARCHIVO_GET_ESTADO_PROCESAMIENTO', [id]);

      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo estado de archivo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/archivos/historial
   * Lista historial de archivos con filtros
   */
  async historial(req: Request, res: Response): Promise<void> {
    try {
      const {
        organismo,
        tipoModulo,
        estado,
        fechaDesde,
        fechaHasta,
        limite = 50,
        offset = 0
      } = req.query;

      const filtros = {
        organismo: organismo || null,
        tipo_modulo: tipoModulo || null,
        estado: estado || null,
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        limite: parseInt(limite as string),
        offset: parseInt(offset as string)
      };

      const result = await this.dbService.executeSelectSP('ARCHIVO_LIST_HISTORIAL', filtros);

      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo historial de archivos:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * DELETE /api/archivos/:id
   * Elimina archivo (lógicamente)
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de archivo es requerido');
      }

      const result = await this.dbService.executeInsertSP('ARCHIVO_ELIMINAR_LOGICO', {
        archivo_id: id,
        fecha_eliminacion: new Date().toISOString(),
        eliminado_por: req.body.usuario || 'SISTEMA'
      });

      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error eliminando archivo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/archivos/estadisticas
   * Obtiene estadísticas generales de archivos
   */
  async estadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { periodo = '30' } = req.query;

      const result = await this.dbService.executeSpSelect('ARCHIVO_GET_ESTADISTICAS', [periodo]);

      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo estadísticas de archivos:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * POST /api/archivos/:id/reprocesar
   * Reprocessa un archivo que falló
   */
  async reprocesar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de archivo es requerido');
      }

      // Marcar como reprocesando
      await this.dbService.executeInsertSP('ARCHIVO_MARCAR_REPROCESANDO', {
        archivo_id: id,
        fecha_reproceso: new Date().toISOString()
      });

      // Aquí iría la lógica específica de reprocesamiento
      // Por ahora simulamos éxito
      const result = await this.dbService.executeInsertSP('ARCHIVO_MARCAR_PROCESADO', {
        archivo_id: id,
        estado: 'PROCESADO',
        fecha_procesamiento: new Date().toISOString()
      });

      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error reprocesando archivo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * POST /api/archivos/validar-insertar
   * Endpoint unificado que el front siempre llama
   * Delega según el tipo de módulo (NOMINA, PAGO, CUENTA)
   */
  async validarInsertar(req: Request, res: Response, next: NextFunction): Promise<void> {
    const upload = await DatabaseHelper.TempUploadProcess();

    upload(req, res, async (err: any) => {
      try {
        // Si multer tuvo un error, pasarlo al errorHandler
        if (err) {
          return next(err);
        }

        if (!req.file) {
          const error = new Error('Archivo requerido');
          return next(error);
        }

        // Extraer tipo de módulo del nombre del archivo
        const dataFromUI = req.file.originalname.split("-");
        if (!dataFromUI || dataFromUI.length === 0) {
          const error = new Error('Formato de archivo inválido');
          return next(error);
        }

        const TIPO_MODULO = dataFromUI[0];

        // Delegar según tipo de módulo
        let result;

        switch (TIPO_MODULO) {
          case 'NOMINA':
            result = await this.procesarNomina(req.file);
            break;

          case 'PAGO':
            result = await this.procesarPago(req.file);
            break;

          case 'CUENTA':
            result = await this.procesarCuenta(req.file);
            break;

          default:
            const error = new Error(`Tipo de módulo no soportado: ${TIPO_MODULO}`);
            return next(error);
        }

        this.dbService.sendResponse(res, result);

      } catch (error: any) {
        console.error("Error durante la operación:", error);
        
        // Pasar el error al errorHandler middleware correctamente
        next(error);
      }
    });
  }

  /**
   * Procesa archivo de NOMINA (TXT)
   */
  private async procesarNomina(file: Express.Multer.File): Promise<any> {
    return await this.nominaService.procesarArchivo(
      file.path,
      file.filename
    );
  }

  /**
   * Procesa archivo de PAGO (Excel)
   * Primero valida la nómina, si falla no continúa
   */
  private async procesarPago(file: Express.Multer.File): Promise<any> {
    // Usar el filename (que tiene extensión) en lugar del originalname
    // El originalname viene del frontend sin extensión
    return await this.pagoService.procesarExcel(
      file.path,
      file.filename
    );
  }

  /**
   * Procesa archivo de CUENTA (Excel)
   */
  private async procesarCuenta(file: Express.Multer.File): Promise<any> {
    return await this.cuentaService.procesarExcel(
      file.path,
      file.filename
    );
  }

  /**
   * Helper: Limpia archivos temporales
   */
  private cleanupTempFile(filePath: string): void {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error eliminando archivo temporal:", err);
      } else {
        console.log("Archivo temporal eliminado correctamente:", filePath);
      }
    });
  }
}

export const mappings: Record<string, { startRow: number; fields: string[] }> = {
  PAGO: {
    startRow: 3,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO']
  },
  CUENTA: {
    startRow: 4,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'ROTULO', 'ENTE']
  },
  NOMINA: {
    startRow: 0,
    fields: ['IDUSER', 'IDORG', 'IDCONT']
  },
  NOMINA_XSL: {
    startRow: 3,
    fields: ['IDUSER', 'IDORG', 'IDCONT', 'CONCEPTO', 'FECHAPAGO']
  }
};

export default new ArchivoController();