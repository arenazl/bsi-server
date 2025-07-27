# Multi-Tenant en BSI: Explicación Simple

## ¿Qué es Multi-Tenant?

Imagina un edificio de departamentos:
- **Single-Tenant**: Cada cliente tiene su propia casa (servidor + BD)
- **Multi-Tenant**: Todos viven en el mismo edificio pero en departamentos separados

En tu sistema BSI, cada **organismo/municipio** es un "tenant" (inquilino).

## 3 Estrategias Principales

### 1. **Base de Datos Compartida + Columna Discriminadora** ✅ (Tu caso actual)
```sql
-- Todas las tablas tienen IdOrganismo
SELECT * FROM Contratos 
WHERE IdOrganismo = 123  -- Filtro por tenant
```

**Ventajas:**
- Más económico
- Fácil mantenimiento
- Una sola BD para backups

**Desventajas:**
- Riesgo de filtración entre tenants
- Performance puede degradarse

### 2. **Esquemas Separados**
```sql
-- Cada organismo tiene su schema
USE organismo_123;
SELECT * FROM Contratos;  -- Sin WHERE, ya está aislado
```

**Ventajas:**
- Mejor aislamiento
- Backup por organismo
- Personalización por schema

### 3. **Bases de Datos Separadas**
```javascript
// Conexión dinámica por organismo
const pool = getPoolForOrganismo(organismoId);
```

**Ventajas:**
- Aislamiento total
- Performance garantizada
- Cumplimiento regulatorio

## Tu Implementación Actual

En BSI usas **estrategia 1** con algunas características:

```sql
-- Todos tus SPs reciben IdOrganismo
EXEC sp_get_contratos @IdOrganismo = 123, @IdUsuario = 456
```

### Mejoras que podrías implementar:

#### 1. **Row Level Security (Seguridad a nivel de fila)**
```sql
-- Vista que filtra automáticamente
CREATE VIEW v_contratos_tenant AS
SELECT * FROM Contratos 
WHERE IdOrganismo = CAST(SESSION_CONTEXT(N'OrganismoId') AS INT)
```

#### 2. **Pool de Conexiones por Organismo**
```typescript
class TenantConnectionManager {
  private pools = new Map<number, Pool>();
  
  getConnection(organismoId: number) {
    // Pool dedicado con límites por organismo
    if (!this.pools.has(organismoId)) {
      this.pools.set(organismoId, createPool({
        ...baseConfig,
        connectionLimit: this.getLimitForOrganismo(organismoId)
      }));
    }
    return this.pools.get(organismoId);
  }
}
```

#### 3. **Interceptor de Seguridad**
```typescript
// Middleware que inyecta el contexto
app.use((req, res, next) => {
  const organismoId = req.user.organismoId;
  
  // Sobrescribir DatabaseHelper para este request
  req.db = {
    execute: (sp, params) => {
      // Siempre incluir organismoId
      return db.execute(sp, { organismoId, ...params });
    }
  };
  
  next();
});
```

#### 4. **Caché por Tenant**
```typescript
// Cache separado por organismo
const cacheKey = `${organismoId}:contratos:${contratoId}`;
const cached = await redis.get(cacheKey);
```

## Consideraciones de Seguridad

### 1. **Validación en TODOS los SPs**
```sql
CREATE PROCEDURE sp_get_contrato_detalle
  @IdOrganismo INT,
  @IdContrato INT,
  @IdUsuario INT
AS
BEGIN
  -- SIEMPRE validar que el contrato pertenece al organismo
  IF NOT EXISTS (
    SELECT 1 FROM Contratos 
    WHERE IdContrato = @IdContrato 
    AND IdOrganismo = @IdOrganismo
  )
  BEGIN
    RAISERROR('Acceso denegado', 16, 1)
    RETURN
  END
  
  -- Luego hacer la query
  SELECT * FROM Contratos WHERE IdContrato = @IdContrato
END
```

### 2. **Auditoría por Tenant**
```typescript
// Log con contexto de organismo
logger.info('Acceso a contrato', {
  organismoId,
  usuarioId,
  contratoId,
  ip: req.ip,
  timestamp: new Date()
});
```

### 3. **Límites por Tenant**
```typescript
// Rate limiting por organismo
const rateLimiter = rateLimit({
  keyGenerator: (req) => `${req.user.organismoId}:${req.ip}`,
  max: getMaxRequestsForOrganismo(req.user.organismoId)
});
```

## Ejemplo Práctico en tu Sistema

```typescript
// Controller mejorado con tenant awareness
export class ContratoController {
  async getContratos(req: Request, res: Response) {
    const { organismoId, userId } = req.user;
    
    try {
      // El SP ya filtra por organismo internamente
      const result = await this.db.executeSecure(
        'sp_get_contratos_usuario',
        { 
          idOrganismo: organismoId,  // Siempre del token
          idUsuario: userId 
        }
      );
      
      // Cache por organismo
      await this.cache.set(
        `org:${organismoId}:user:${userId}:contratos`,
        result,
        300 // 5 minutos
      );
      
      res.json(result);
      
    } catch (error) {
      // Log con contexto
      logger.error('Error obteniendo contratos', {
        organismoId,
        userId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Error interno' });
    }
  }
}
```

## Recomendaciones para BSI

1. **Mantén tu estrategia actual** (BD compartida) pero refuerza:
   - Validación en TODOS los SPs
   - Logs detallados por organismo
   - Monitoreo de uso por tenant

2. **Si creces mucho**, considera:
   - Sharding por organismo (ej: organismos 1-100 en servidor A)
   - Read replicas por organismos grandes
   - Cache distribuido con Redis

3. **Para cumplimiento regulatorio**:
   - Encriptación por columna con keys por organismo
   - Backup selectivo por organismo
   - Logs de auditoría inmutables

¿Necesitas que profundice en algún aspecto específico?