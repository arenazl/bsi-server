import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { config } from '@config/index';

/**
 * DatabaseHelper con soporte Multi-Tenant
 * Gestiona conexiones por organismo/tenant
 */
class MultiTenantDatabaseHelper {
  private static instance: MultiTenantDatabaseHelper;
  private pools: Map<string, Pool> = new Map();
  private defaultPool: Pool;

  private constructor() {
    // Pool por defecto para operaciones generales
    this.defaultPool = createPool({
      ...config.database.primary,
      connectionLimit: 5 // Menos conexiones para el pool default
    });
  }

  public static getInstance(): MultiTenantDatabaseHelper {
    if (!MultiTenantDatabaseHelper.instance) {
      MultiTenantDatabaseHelper.instance = new MultiTenantDatabaseHelper();
    }
    return MultiTenantDatabaseHelper.instance;
  }

  /**
   * Obtiene un pool específico para un tenant
   * En tu caso, podría ser por organismo
   */
  private getTenantPool(tenantId: string): Pool {
    // Si ya existe el pool para este tenant, lo devuelve
    if (this.pools.has(tenantId)) {
      return this.pools.get(tenantId)!;
    }

    // Crear nuevo pool para el tenant
    const tenantPool = this.createTenantPool(tenantId);
    this.pools.set(tenantId, tenantPool);
    
    // Limitar cantidad de pools activos
    if (this.pools.size > 10) {
      this.cleanupOldPools();
    }

    return tenantPool;
  }

  /**
   * Crea un pool específico para un tenant
   */
  private createTenantPool(tenantId: string): Pool {
    // Opción 1: Mismo servidor, diferentes configuraciones
    return createPool({
      ...config.database.primary,
      connectionLimit: 3, // Menos conexiones por tenant
      // Podríamos agregar prefijos o configuraciones específicas
      namedPlaceholders: true,
      // Tag para identificar conexiones en logs
      connectionAttributes: {
        program_name: `BSI_Tenant_${tenantId}`
      }
    });

    // Opción 2: Diferentes bases de datos por tenant
    // const tenantConfig = this.getTenantDatabaseConfig(tenantId);
    // return createPool(tenantConfig);
  }

  /**
   * Ejecuta un query con contexto de tenant
   */
  public async executeWithTenant(
    tenantId: string,
    spName: string,
    params: any[]
  ): Promise<any> {
    const pool = this.getTenantPool(tenantId);
    let connection: PoolConnection | undefined;

    try {
      connection = await pool.getConnection();
      
      // Setear el contexto del tenant en la sesión
      await this.setTenantContext(connection, tenantId);
      
      // Ejecutar el SP
      const placeholders = params.map(() => "?").join(",");
      const sql = `CALL ${spName}(${placeholders})`;
      const [results] = await connection.execute(sql, params);
      
      return results;
      
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Configura el contexto del tenant en la conexión
   */
  private async setTenantContext(
    connection: PoolConnection, 
    tenantId: string
  ): Promise<void> {
    // Opción 1: Variable de sesión MySQL
    await connection.query('SET @tenant_id = ?', [tenantId]);
    
    // Opción 2: Usar Row Level Security (si MySQL 8.0+)
    // await connection.query('SET @current_organismo_id = ?', [tenantId]);
    
    // Opción 3: Cambiar el search_path (PostgreSQL style)
    // No aplica directamente en MySQL
  }

  /**
   * Limpia pools antiguos no utilizados
   */
  private cleanupOldPools(): void {
    // Implementar lógica de limpieza basada en:
    // - Último uso
    // - Cantidad de conexiones activas
    // - Memoria disponible
    
    console.log('Limpiando pools antiguos...');
    // Por ahora, eliminar el más antiguo (FIFO)
    const firstKey = this.pools.keys().next().value;
    if (firstKey) {
      const pool = this.pools.get(firstKey);
      pool?.end();
      this.pools.delete(firstKey);
    }
  }

  /**
   * Cierra todos los pools
   */
  public async closeAll(): Promise<void> {
    // Cerrar pool default
    await this.defaultPool.end();
    
    // Cerrar todos los pools de tenants
    for (const [tenantId, pool] of this.pools) {
      console.log(`Cerrando pool para tenant ${tenantId}`);
      await pool.end();
    }
    
    this.pools.clear();
  }

  /**
   * Obtiene estadísticas de uso
   */
  public getStats() {
    const stats = {
      totalPools: this.pools.size + 1, // +1 por el default
      tenantPools: [] as any[]
    };

    for (const [tenantId, pool] of this.pools) {
      stats.tenantPools.push({
        tenantId,
        // Estas propiedades dependen de la implementación del driver
        connections: (pool as any)._allConnections?.length || 0,
        free: (pool as any)._freeConnections?.length || 0,
        queued: (pool as any)._connectionQueue?.length || 0
      });
    }

    return stats;
  }
}

// Ejemplo de uso con Row Level Security (RLS)
export class TenantAwareDatabaseHelper {
  /**
   * Wrapper para asegurar que todas las queries incluyan el tenant
   */
  static async executeSecureQuery(
    organismoId: number,
    spName: string,
    params: any[]
  ): Promise<any> {
    // Siempre incluir el organismoId como primer parámetro
    const secureParams = [organismoId, ...params];
    
    // El SP debe validar que el organismoId coincida
    return DatabaseHelper.executeSpSelect(spName, secureParams);
  }
}

// Middleware para inyectar tenant context
export function injectTenantContext(req: any, res: any, next: any) {
  // Obtener el organismo del usuario autenticado
  const user = req.user;
  const organismoId = user?.organismoId;
  
  if (!organismoId) {
    return res.status(403).json({ 
      error: 'No se pudo determinar el contexto del organismo' 
    });
  }
  
  // Agregar al request para uso posterior
  req.tenantId = organismoId;
  req.organismoId = organismoId;
  
  next();
}

export default MultiTenantDatabaseHelper.getInstance();