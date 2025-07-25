import { Request, Response } from 'express';
import { DatabaseService } from '@services-v2/DatabaseService';
import ResponseHelper from '@utils/responseHelper';

export class NavigationController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * GET /api/v2/navigation/config/:module
   * Obtiene la configuración de navegación para un módulo específico
   */
  public getModuleConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { module } = req.params;
      
      if (!module) {
        ResponseHelper.error(res, 'Módulo es requerido', 400);
        return;
      }

      // Obtener configuración del módulo
      const config = await this.databaseService.executeStoredProcedure(
        'sp_get_navigation_config',
        { moduleCode: module }
      );

      // Log de acceso
      const userId = (req as any).user?.id;
      if (userId) {
        this.logNavigationAccess(userId, module, 'view_module', req);
      }

      ResponseHelper.success(res, config);
    } catch (error) {
      console.error('Error obteniendo configuración de navegación:', error);
      ResponseHelper.error(res, 'Error al obtener configuración de navegación');
    }
  };

  /**
   * GET /api/v2/navigation/menu
   * Obtiene el menú principal basado en los contratos del usuario
   */
  public getMainMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      // Por ahora devolvemos un menú estático, pero esto debería venir de BD
      const menuItems = [
        {
          id: 'pagos',
          title: 'Pagos Múltiples',
          description: 'Gestión de pagos por modalidad',
          icon: 'fa-money-check-alt',
          link: '/dinamicModule/pagos',
          enabled: true
        },
        {
          id: 'nominas',
          title: 'Nóminas',
          description: 'Administración de nóminas',
          icon: 'fa-users',
          link: '/dinamicModule/nominas',
          enabled: true
        },
        {
          id: 'cuentas',
          title: 'Cuentas',
          description: 'Gestión de cuentas bancarias',
          icon: 'fa-university',
          link: '/dinamicModule/cuentas',
          enabled: true
        },
        {
          id: 'reportes',
          title: 'Reportes',
          description: 'Informes y estadísticas',
          icon: 'fa-chart-bar',
          link: '/dinamicModule/reportes',
          enabled: false // Deshabilitado por ahora
        }
      ];

      ResponseHelper.success(res, menuItems);
    } catch (error) {
      console.error('Error obteniendo menú principal:', error);
      ResponseHelper.error(res, 'Error al obtener menú principal');
    }
  };

  /**
   * POST /api/v2/navigation/log
   * Registra acceso a una pantalla
   */
  public logAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { module, contractId, action } = req.body;

      await this.logNavigationAccess(userId, module, action, req, contractId);

      ResponseHelper.success(res, { logged: true });
    } catch (error) {
      console.error('Error registrando acceso:', error);
      // No fallar si el log falla
      ResponseHelper.success(res, { logged: false });
    }
  };

  /**
   * Helper para registrar accesos
   */
  private async logNavigationAccess(
    userId: number,
    module: string,
    action: string,
    req: Request,
    contractId?: number
  ): Promise<void> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      await this.databaseService.executeStoredProcedure('sp_log_navigation_access', {
        userId,
        moduleCode: module,
        contractId: contractId || null,
        action,
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error('Error en log de navegación:', error);
      // No propagar el error
    }
  }
}

export default new NavigationController();