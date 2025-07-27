import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { config } from '@config/index';
import { performance } from 'perf_hooks';

/**
 * DatabaseHelper mejorado con mejor manejo de errores,
 * monitoreo y gestión de conexiones
 */
class DatabaseHelperImproved {
  private static instance: DatabaseHelperImproved;
  private pool: Pool;
  private activeConnections = 0;
  private totalQueries = 0;
  private slowQueryThreshold = 1000; // ms

  private constructor() {
    // Configuración mejorada del pool
    this.pool = createPool({
      ...config.database.primary,
      // Mejoras de rendimiento
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Manejo de timeouts
      connectTimeout: 10000,
      // Mejor manejo de conexiones
      connectionLimit: config.database.primary.connectionLimit || 10,
      waitForConnections: true,
      queueLimit: 0,
      // Reconexión automática
      maxIdle: 10,
      idleTimeout: 60000,
      // Zona horaria consistente
      timezone: 'Z',
      // Formato de fechas
      dateStrings: false,
      // Debug en desarrollo
      debug: config.isDevelopment,
    });

    // Monitoreo del pool
    this.setupPoolMonitoring();
    
    // Healthcheck periódico
    if (config.isProduction) {
      setInterval(() => this.healthCheck(), 30000);
    }
  }

  /**
   * Obtiene la instancia singleton
   */
  public static getInstance(): DatabaseHelperImproved {
    if (!DatabaseHelperImproved.instance) {
      DatabaseHelperImproved.instance = new DatabaseHelperImproved();
    }
    return DatabaseHelperImproved.instance;
  }

  /**
   * Obtiene una conexión del pool con retry
   */
  public async getConnection(retries = 3): Promise<PoolConnection> {
    for (let i = 0; i < retries; i++) {
      try {
        const connection = await this.pool.getConnection();
        this.activeConnections++;
        
        // Wrapper para tracking
        const originalRelease = connection.release.bind(connection);
        connection.release = () => {
          this.activeConnections--;
          originalRelease();
        };
        
        return connection;
      } catch (err) {
        console.error(`Error obteniendo conexión (intento ${i + 1}/${retries}):`, err);
        
        if (i === retries - 1) {
          // Último intento falló
          throw new Error(`No se pudo obtener conexión después de ${retries} intentos: ${err.message}`);
        }
        
        // Esperar antes de reintentar
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
    
    throw new Error('No se pudo obtener conexión');
  }

  /**
   * Ejecuta un SP con manejo mejorado de errores y métricas
   */
  public async executeSP(
    spName: string,
    params: any[],
    options: { 
      timeout?: number;
      logSlowQueries?: boolean;
      transaction?: PoolConnection;
    } = {}
  ): Promise<any> {
    const startTime = performance.now();
    let connection: PoolConnection | undefined = options.transaction;
    const shouldReleaseConnection = !options.transaction;
    
    try {
      // Validar nombre del SP
      if (!this.isValidSPName(spName)) {
        throw new Error(`Nombre de SP inválido: ${spName}`);
      }
      
      // Obtener conexión si no viene en transacción
      if (!connection) {
        connection = await this.getConnection();
      }
      
      // Configurar timeout si se especifica
      if (options.timeout) {
        await connection.query(`SET SESSION max_execution_time = ${options.timeout}`);
      }
      
      // Construir y ejecutar query
      const placeholders = params.map(() => "?").join(",");
      const sql = `CALL ${spName}(${placeholders})`;
      
      // Log en desarrollo
      if (config.isDevelopment) {
        console.log(`Ejecutando SP: ${spName}`, { params });
      }
      
      const [results] = await connection.execute(sql, params);
      
      // Métricas
      const duration = performance.now() - startTime;
      this.totalQueries++;
      
      // Log queries lentas
      if (options.logSlowQueries !== false && duration > this.slowQueryThreshold) {
        console.warn(`Query lenta detectada: ${spName} tomó ${duration.toFixed(2)}ms`);
      }
      
      return this.processResults(results);
      
    } catch (error: any) {
      // Manejo específico de errores MySQL
      const enhancedError = this.enhanceError(error, spName, params);
      throw enhancedError;
      
    } finally {
      // Solo liberar si no es transacción
      if (connection && shouldReleaseConnection) {
        connection.release();
      }
    }
  }

  /**
   * Ejecuta múltiples operaciones en una transacción
   */
  public async executeTransaction(
    operations: Array<{
      spName: string;
      params: any[];
    }>
  ): Promise<any[]> {
    const connection = await this.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const op of operations) {
        const result = await this.executeSP(op.spName, op.params, { 
          transaction: connection 
        });
        results.push(result);
      }
      
      await connection.commit();
      return results;
      
    } catch (error) {
      await connection.rollback();
      console.error('Error en transacción, rollback ejecutado:', error);
      throw error;
      
    } finally {
      connection.release();
    }
  }

  /**
   * Ejecuta un SP que retorna JSON con parsing automático
   */
  public async executeJsonSP(spName: string, params: any): Promise<any> {
    const result = await this.executeSP(spName, Object.values(params));
    
    // Intentar parsear JSON en campos que lo contengan
    if (result && result.length > 0) {
      return this.parseJsonFields(result);
    }
    
    return result;
  }

  /**
   * Ejecuta queries directas (solo para casos especiales)
   */
  public async executeQuery(sql: string, params: any[] = []): Promise<any> {
    // Solo permitir SELECT en producción
    if (config.isProduction && !sql.trim().toUpperCase().startsWith('SELECT')) {
      throw new Error('Solo queries SELECT están permitidas en producción');
    }
    
    const connection = await this.getConnection();
    
    try {
      const [results] = await connection.execute(sql, params);
      return results;
    } finally {
      connection.release();
    }
  }

  /**
   * Health check del pool
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      const connection = await this.getConnection();
      
      try {
        // Query simple para verificar conectividad
        await connection.query('SELECT 1');
        
        const poolStats = {
          activeConnections: this.activeConnections,
          totalQueries: this.totalQueries,
          poolSize: (this.pool as any)._allConnections?.length || 0,
          freeConnections: (this.pool as any)._freeConnections?.length || 0,
        };
        
        return {
          status: 'healthy',
          details: poolStats
        };
        
      } finally {
        connection.release();
      }
      
    } catch (error) {
      console.error('Health check falló:', error);
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  /**
   * Cierra el pool de conexiones
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('Pool de conexiones cerrado correctamente');
    } catch (error) {
      console.error('Error cerrando pool:', error);
      throw error;
    }
  }

  /**
   * Configura monitoreo del pool
   */
  private setupPoolMonitoring(): void {
    // Event listeners para debugging
    this.pool.on('acquire', () => {
      if (config.isDevelopment) {
        console.log('Conexión adquirida del pool');
      }
    });
    
    this.pool.on('release', () => {
      if (config.isDevelopment) {
        console.log('Conexión liberada al pool');
      }
    });
    
    this.pool.on('connection', (connection) => {
      // Configurar cada nueva conexión
      connection.config.namedPlaceholders = true;
    });
    
    this.pool.on('enqueue', () => {
      console.warn('Esperando por conexión disponible en el pool');
    });
  }

  /**
   * Valida nombre de SP para prevenir inyección
   */
  private isValidSPName(spName: string): boolean {
    // Solo permitir caracteres alfanuméricos y underscore
    return /^[a-zA-Z0-9_]+$/.test(spName);
  }

  /**
   * Procesa resultados de MySQL
   */
  private processResults(results: any): any {
    // MySQL devuelve array de arrays para SPs
    if (Array.isArray(results) && results.length > 0) {
      // Si es un SELECT simple
      if (Array.isArray(results[0])) {
        return results[0];
      }
      return results;
    }
    return results;
  }

  /**
   * Mejora mensajes de error con contexto
   */
  private enhanceError(error: any, spName: string, params: any[]): Error {
    const enhancedError = new Error(
      `Error ejecutando SP '${spName}': ${error.message}`
    );
    
    // Agregar contexto
    (enhancedError as any).code = error.code;
    (enhancedError as any).sqlState = error.sqlState;
    (enhancedError as any).sp = spName;
    (enhancedError as any).paramCount = params.length;
    
    // No incluir valores de parámetros en producción por seguridad
    if (config.isDevelopment) {
      (enhancedError as any).params = params;
    }
    
    return enhancedError;
  }

  /**
   * Parsea campos JSON automáticamente
   */
  private parseJsonFields(data: any[]): any[] {
    return data.map(row => {
      const parsed = { ...row };
      
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string' && 
            (value.startsWith('{') || value.startsWith('['))) {
          try {
            parsed[key] = JSON.parse(value);
          } catch {
            // Mantener como string si no es JSON válido
          }
        }
      }
      
      return parsed;
    });
  }

  /**
   * Helper para delay en reintentos
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene estadísticas del pool
   */
  public getStats() {
    return {
      activeConnections: this.activeConnections,
      totalQueries: this.totalQueries,
      poolConfig: {
        connectionLimit: config.database.primary.connectionLimit,
        host: config.database.primary.host,
        database: config.database.primary.database
      }
    };
  }
}

export default DatabaseHelperImproved.getInstance();