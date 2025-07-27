import { Request, Response } from 'express';
import { DatabaseService } from '@services/DatabaseService';
import ResponseHelper from '@utils/responseHelper';

export class NavigationController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * Obtiene la configuración de navegación para un módulo específico
   */
  public getModuleConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const { module } = req.params;
      const userId = req.user?.id || 1;
      const orgId = req.user?.idOrganismo || 1;

      const result = await this.databaseService.executeStoredProcedure(
        'sp_get_navigation_config',
        { p_modulo: module, p_idUsuario: userId, p_idOrganismo: orgId }
      );

      ResponseHelper.success(res, result);
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      ResponseHelper.error(res, 'Error al obtener configuración de navegación');
    }
  };

  /**
   * Obtiene el menú principal en formato JSON compatible con el frontend
   */
  public getMainMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || 1;
      const orgId = req.user?.idOrganismo || 1;

      // Obtener todos los registros relevantes del menú
      const allItems = await this.databaseService.executeQuery(`
        SELECT 
          n.IdConfiguracion as id,
          n.modulo,
          n.titulo,
          n.descripcion,
          n.ruta,
          n.componente,
          n.activo,
          n.padre_id,
          n.metadatos
        FROM BSI_CONFIGURACION_MODULOS n
        WHERE JSON_EXTRACT(n.metadatos, '$.nivel') IN (2, 3)
        ORDER BY n.orden
      `);

      // Construir la estructura del menú principal
      const menuPrincipal = {
        header: "Menú Principal",
        description: "Gestión de pagos diversos",
        enabled: true,
        icono: "fa-home",
        items: [] as any[]
      };

      // Agrupar items por nivel
      const nivel2Items = [];
      const nivel3Items = [];
      
      for (const item of allItems) {
        const meta = typeof item.metadatos === 'string' ? JSON.parse(item.metadatos) : item.metadatos;
        if (meta.nivel === 2) {
          nivel2Items.push(item);
        } else if (meta.nivel === 3) {
          nivel3Items.push(item);
        }
      }
      
      // Construir la estructura jerárquica
      for (const actividad of nivel2Items) {
        const metadatos = typeof actividad.metadatos === 'string' 
          ? JSON.parse(actividad.metadatos) 
          : actividad.metadatos;

        // Buscar las opciones (nivel 3) de esta actividad
        const opciones = nivel3Items
          .filter(opcion => opcion.padre_id === actividad.id)
          .map(opcion => {
            const opcionMeta = typeof opcion.metadatos === 'string' 
              ? JSON.parse(opcion.metadatos) 
              : opcion.metadatos;
            
            return {
              description: opcion.titulo,
              link: opcion.ruta,
              icono: opcionMeta.icono || 'fa-circle'
            };
          });

        // Agregar la actividad con sus opciones
        menuPrincipal.items.push({
          title: actividad.titulo,
          description: actividad.descripcion,
          enabled: Boolean(actividad.activo),
          icono: metadatos.icono || 'fa-folder',
          items: opciones
        });
      }

      console.log('Menú generado:', JSON.stringify(menuPrincipal, null, 2));
      // Devolver en el formato que espera el frontend
      res.json({
        estado: 1,
        mensaje: 'Menú obtenido correctamente',
        data: menuPrincipal
      });
    } catch (error) {
      console.error('Error al obtener menú principal:', error);
      ResponseHelper.error(res, 'Error al obtener menú principal');
    }
  };

  /**
   * Obtiene la configuración de pagos múltiples
   */
  public getPagosMultiplesConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      // Obtener configuración de pagos múltiples
      const pagosItems = await this.databaseService.executeQuery(`
        SELECT 
          titulo,
          descripcion,
          ruta,
          activo,
          metadatos
        FROM BSI_CONFIGURACION_MODULOS
        WHERE modulo = 'pagosmultiples'
        ORDER BY orden
      `);

      // Formatear en la estructura esperada
      const pagosMultiplesConfig = {
        header: "Pagos Múltiples",
        description: "Gestión de pagos diversos de la empresa",
        enabled: true,
        icono: "fa-money-check-alt",
        items: pagosItems.map(item => {
          const meta = typeof item.metadatos === 'string' 
            ? JSON.parse(item.metadatos) 
            : item.metadatos;
          
          return {
            title: item.titulo,
            description: item.descripcion || "",
            icono: meta.icono || "fa-file",
            enabled: Boolean(item.activo),
            items: [{
              description: item.titulo,
              link: item.ruta,
              icono: meta.icono || "fa-file"
            }]
          };
        })
      };

      ResponseHelper.success(res, pagosMultiplesConfig);
    } catch (error) {
      console.error('Error al obtener configuración de pagos múltiples:', error);
      ResponseHelper.error(res, 'Error al obtener configuración de pagos múltiples');
    }
  };

  /**
   * Obtiene la estructura completa del árbol de navegación
   */
  public getNavigationTree = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.databaseService.executeQuery(`
        WITH RECURSIVE NavigationTree AS (
          -- Nodos raíz
          SELECT 
            IdConfiguracion,
            modulo,
            titulo,
            descripcion,
            ruta,
            componente,
            activo,
            orden,
            padre_id,
            metadatos,
            0 as nivel
          FROM BSI_CONFIGURACION_MODULOS
          WHERE padre_id IS NULL
          
          UNION ALL
          
          -- Nodos hijos recursivos
          SELECT 
            n.IdConfiguracion,
            n.modulo,
            n.titulo,
            n.descripcion,
            n.ruta,
            n.componente,
            n.activo,
            n.orden,
            n.padre_id,
            n.metadatos,
            nt.nivel + 1
          FROM BSI_CONFIGURACION_MODULOS n
          INNER JOIN NavigationTree nt ON n.padre_id = nt.IdConfiguracion
        )
        SELECT * FROM NavigationTree
        ORDER BY nivel, orden
      `);

      ResponseHelper.success(res, result);
    } catch (error) {
      console.error('Error al obtener árbol de navegación:', error);
      ResponseHelper.error(res, 'Error al obtener árbol de navegación');
    }
  };

  /**
   * Registra el acceso a una pantalla
   */
  public logAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { modulo, ruta } = req.body;
      const userId = req.user?.id || 1;
      const orgId = req.user?.idOrganismo || 1;

      // Aquí podrías registrar el acceso en una tabla de auditoría
      console.log(`Usuario ${userId} accedió a ${modulo} - ${ruta}`);

      ResponseHelper.success(res, { mensaje: 'Acceso registrado' });
    } catch (error) {
      console.error('Error al registrar acceso:', error);
      ResponseHelper.error(res, 'Error al registrar acceso');
    }
  };
}

export default NavigationController;