import Redis from 'ioredis';
import { config } from '@config/index';

/**
 * Servicio de Cache con Redis
 * Optimizado para la arquitectura Organismo + Contrato
 */
export class CacheService {
  private redis: Redis | null = null;
  private ttlDefault = 300; // 5 minutos por defecto
  
  constructor() {
    // Solo inicializar si hay config de Redis
    if (config.redis) {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        keyPrefix: 'bsi:', // Prefijo para todas las keys
        lazyConnect: true
      });
      
      this.redis.on('error', (err) => {
        console.error('Redis error:', err);
        // No fallar la app si Redis falla
        this.redis = null;
      });
    }
  }

  /**
   * Genera una key única basada en Organismo + Contrato
   */
  private generateKey(organismo: number, contrato: number, tipo: string): string {
    return `org:${organismo}:cont:${contrato}:${tipo}`;
  }

  /**
   * Guarda datos en cache
   */
  async set(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.redis) return; // Si no hay Redis, no hacer nada
    
    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(key, ttl || this.ttlDefault, serialized);
    } catch (error) {
      console.warn('Error guardando en cache:', error);
    }
  }

  /**
   * Obtiene datos del cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Error leyendo cache:', error);
      return null;
    }
  }

  /**
   * Cache específico para Pagos
   */
  async cachePagos(
    organismoId: number, 
    contratoId: number, 
    data: any,
    ttl = 300 // 5 minutos
  ): Promise<void> {
    const key = this.generateKey(organismoId, contratoId, 'pagos');
    await this.set(key, data, ttl);
  }

  /**
   * Obtener Pagos del cache
   */
  async getPagosFromCache(
    organismoId: number, 
    contratoId: number
  ): Promise<any | null> {
    const key = this.generateKey(organismoId, contratoId, 'pagos');
    return await this.get(key);
  }

  /**
   * Cache para metadata (dura más porque cambia poco)
   */
  async cacheMetadata(
    organismoId: number,
    contratoId: number,
    tipo: string,
    data: any
  ): Promise<void> {
    const key = this.generateKey(organismoId, contratoId, `meta:${tipo}`);
    await this.set(key, data, 3600); // 1 hora
  }

  /**
   * Invalida cache cuando hay cambios
   */
  async invalidate(organismoId: number, contratoId: number, tipo?: string): Promise<void> {
    if (!this.redis) return;
    
    try {
      if (tipo) {
        // Invalidar tipo específico
        const key = this.generateKey(organismoId, contratoId, tipo);
        await this.redis.del(key);
      } else {
        // Invalidar todo del contrato
        const pattern = `bsi:org:${organismoId}:cont:${contratoId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.warn('Error invalidando cache:', error);
    }
  }

  /**
   * Cache con patrón Cache-Aside
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await this.get<T>(key);
    if (cached) {
      console.log(`Cache HIT: ${key}`);
      return cached;
    }
    
    // Si no está en cache, ejecutar factory
    console.log(`Cache MISS: ${key}`);
    const data = await factory();
    
    // Guardar en cache para próxima vez
    await this.set(key, data, ttl);
    
    return data;
  }

  /**
   * Estadísticas del cache
   */
  async getStats(): Promise<any> {
    if (!this.redis) return { enabled: false };
    
    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();
      
      return {
        enabled: true,
        keys: dbSize,
        info: info
      };
    } catch (error) {
      return { enabled: false, error: error.message };
    }
  }
}

// Singleton
export default new CacheService();