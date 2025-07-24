import { Request, Response } from 'express';
import DatabaseService from '../services-v2/DatabaseService';

export class OrganismoController {
  private dbService = DatabaseService;

  /**
   * GET /api/organismos
   * Lista todos los organismos/municipios
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { activos_solamente = 'true', buscar = '' } = req.query;
      
      const filtros = {
        activos_solamente: activos_solamente === 'true',
        buscar: buscar as string
      };

      const result = await this.dbService.executeSelectSP('ORGANISMO_LIST_FILTERED', filtros);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error listando organismos:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/organismos/:id
   * Obtiene detalle de un organismo específico
   */
  async obtenerDetalle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const result = await this.dbService.executeSpSelect('ORGANISMO_GET_DETALLE', [id]);
      
      if (!result || result.length === 0) {
        res.status(404).json({ error: 'Organismo no encontrado' });
        return;
      }
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo detalle de organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/organismos/:id/archivos
   * Lista archivos procesados para un organismo específico
   */
  async listarArchivos(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        tipoModulo, 
        fechaDesde, 
        fechaHasta,
        limite = 20,
        offset = 0 
      } = req.query;

      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const filtros = {
        id_organismo: id,
        tipo_modulo: tipoModulo || null,
        fecha_desde: fechaDesde || null,
        fecha_hasta: fechaHasta || null,
        limite: parseInt(limite as string),
        offset: parseInt(offset as string)
      };

      const result = await this.dbService.executeSelectSP('ORGANISMO_GET_ARCHIVOS', filtros);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error listando archivos de organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/organismos/:id/contratos
   * Lista contratos de un organismo
   */
  async listarContratos(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const result = await this.dbService.executeSpSelect('ORGANISMO_GET_CONTRATOS', [id]);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error listando contratos de organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/organismos/:id/usuarios
   * Lista usuarios de un organismo
   */
  async listarUsuarios(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const result = await this.dbService.executeSpSelect('ORGANISMO_GET_USUARIOS', [id]);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error listando usuarios de organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/organismos/:id/estadisticas
   * Obtiene estadísticas de procesamiento de un organismo
   */
  async obtenerEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { periodo = '30' } = req.query;

      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const result = await this.dbService.executeSpSelect('ORGANISMO_GET_ESTADISTICAS', [id, periodo]);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo estadísticas de organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * POST /api/organismos
   * Crea un nuevo organismo (solo admins)
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { 
        nombre, 
        nombre_corto, 
        cuit, 
        direccion_calle,
        direccion_numero,
        localidad,
        cp,
        sucursal_bapro,
        tipo_organismo 
      } = req.body;

      if (!nombre || !cuit) {
        throw new Error('Nombre y CUIT son requeridos');
      }

      const organismoData = {
        nombre,
        nombre_corto: nombre_corto || nombre,
        cuit,
        direccion_calle: direccion_calle || null,
        direccion_numero: direccion_numero || null,
        localidad: localidad || null,
        cp: cp || null,
        sucursal_bapro: sucursal_bapro || null,
        tipo_organismo: tipo_organismo || 1,
        fecha_alta: new Date().toISOString()
      };

      const result = await this.dbService.executeInsertSP('ORGANISMO_CREAR', organismoData);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error creando organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * PUT /api/organismos/:id
   * Actualiza datos de un organismo
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const updateData = {
        id_organismo: id,
        ...req.body,
        fecha_modificacion: new Date().toISOString()
      };

      const result = await this.dbService.executeInsertSP('ORGANISMO_ACTUALIZAR', updateData);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error actualizando organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * DELETE /api/organismos/:id
   * Desactiva un organismo (baja lógica)
   */
  async desactivar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new Error('ID de organismo es requerido');
      }

      const result = await this.dbService.executeInsertSP('ORGANISMO_DESACTIVAR', {
        id_organismo: id,
        fecha_baja: new Date().toISOString()
      });
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error desactivando organismo:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * POST /api/organismos/contratos/:id
   * Obtiene un contrato específico por ID (helper legacy)
   */
  async obtenerContratoPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { id_user, id_organismo, id_contrato } = req.body;

      if (!id_user || !id_organismo || !id_contrato) {
        throw new Error('id_user, id_organismo e id_contrato son requeridos');
      }

      const result = await this.dbService.executeSpSelect('ObtenerContratoById', [
        id_user,
        id_organismo,
        id_contrato
      ]);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo contrato por ID:", error);
      this.dbService.throwError(error);
    }
  }

  /**
   * GET /api/organismos/combo/:tipoModulo
   * Obtiene lista para combos/dropdowns (helper legacy)
   */
  async obtenerListaParaCombo(req: Request, res: Response): Promise<void> {
    try {
      const { tipoModulo } = req.params;

      if (!tipoModulo) {
        throw new Error('tipoModulo es requerido');
      }

      const result = await this.dbService.executeSpSelect('GET_LIST_FOR_COMBO', [tipoModulo]);
      
      this.dbService.sendResponse(res, result);
    } catch (error: any) {
      console.error("Error obteniendo lista para combo:", error);
      this.dbService.throwError(error);
    }
  }
}

export default new OrganismoController();