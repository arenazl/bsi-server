import { Request, Response } from 'express';
import { DatabaseService } from '@services/DatabaseService';
import CacheService from '@services/CacheService';
import ResponseHelper from '@utils/responseHelper';

/**
 * Ejemplo de cómo usar Cache en un controller
 */
export class PagoControllerWithCache {
  private databaseService: DatabaseService;
  
  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Obtener pagos con cache
   */
  public getPagos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organismoId, contratoId } = req.params;
      
      // Generar key única
      const cacheKey = `org:${organismoId}:cont:${contratoId}:pagos:list`;
      
      // Usar patrón Cache-Aside
      const pagos = await CacheService.getOrSet(
        cacheKey,
        async () => {
          // Si no está en cache, buscar en BD
          const result = await this.databaseService.executeStoredProcedure(
            'sp_get_pagos_contrato',
            {
              IdOrganismo: parseInt(organismoId),
              IdContrato: parseInt(contratoId)
            }
          );
          return result;
        },
        300 // 5 minutos de cache
      );
      
      ResponseHelper.success(res, pagos);
      
    } catch (error) {
      console.error('Error obteniendo pagos:', error);
      ResponseHelper.error(res, 'Error al obtener pagos');
    }
  };

  /**
   * Crear pago (invalida cache)
   */
  public createPago = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organismoId, contratoId } = req.params;
      const pagoData = req.body;
      
      // Crear pago
      const result = await this.databaseService.executeStoredProcedure(
        'sp_insert_pago',
        {
          IdOrganismo: parseInt(organismoId),
          IdContrato: parseInt(contratoId),
          ...pagoData
        }
      );
      
      // IMPORTANTE: Invalidar cache después de crear
      await CacheService.invalidate(
        parseInt(organismoId),
        parseInt(contratoId),
        'pagos'
      );
      
      ResponseHelper.success(res, result, 'Pago creado exitosamente');
      
    } catch (error) {
      console.error('Error creando pago:', error);
      ResponseHelper.error(res, 'Error al crear pago');
    }
  };
}