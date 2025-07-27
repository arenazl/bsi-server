# Sistema de Seguridad BSI - 3 Niveles

## Los 3 Datos Fundamentales

El sistema BSI se basa en una arquitectura de seguridad de 3 niveles:

```
1. IdUsuario    - QUIÉN eres
2. IdOrganismo  - DÓNDE trabajas (tenant)
3. IdContrato   - QUÉ puedes gestionar
```

## Modelo de Datos

```sql
-- Relación jerárquica
Organismos (1) ──── (N) Contratos (N) ──── (N) Usuarios

-- Un usuario puede tener múltiples contratos
-- Pero SOLO dentro de su organismo
```

## Implementación en la Base de Datos

### Tabla de Relaciones Usuario-Contrato
```sql
CREATE TABLE UsuarioContratos (
    IdUsuario INT,
    IdContrato INT,
    IdOrganismo INT,  -- Redundante pero útil para validación
    FechaAsignacion DATETIME DEFAULT GETDATE(),
    Activo BIT DEFAULT 1,
    PRIMARY KEY (IdUsuario, IdContrato),
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario),
    FOREIGN KEY (IdContrato) REFERENCES Contratos(IdContrato),
    FOREIGN KEY (IdOrganismo) REFERENCES Organismos(IdOrganismo)
)
```

### Validación en Stored Procedures
```sql
CREATE PROCEDURE sp_validar_acceso_completo
    @IdUsuario INT,
    @IdOrganismo INT,
    @IdContrato INT,
    @Resultado BIT OUTPUT
AS
BEGIN
    SET @Resultado = 0
    
    -- Validar que el contrato pertenece al organismo
    -- Y que el usuario tiene acceso a ese contrato
    IF EXISTS (
        SELECT 1 
        FROM UsuarioContratos uc
        INNER JOIN Contratos c ON uc.IdContrato = c.IdContrato
        WHERE uc.IdUsuario = @IdUsuario
          AND uc.IdContrato = @IdContrato
          AND c.IdOrganismo = @IdOrganismo
          AND uc.Activo = 1
    )
    BEGIN
        SET @Resultado = 1
    END
END
```

## Implementación en el Backend

### Middleware de Validación Triple
```typescript
export const validateTripleAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, organismoId } = req.user; // Del JWT
    const { contratoId } = req.params; // De la URL
    
    // Validar en base de datos
    const hasAccess = await db.executeStoredProcedure('sp_validar_acceso_completo', {
      IdUsuario: userId,
      IdOrganismo: organismoId,
      IdContrato: contratoId
    });
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Acceso denegado',
        details: 'No tiene permisos para este contrato'
      });
    }
    
    // Agregar al request para uso posterior
    req.validatedAccess = {
      userId,
      organismoId,
      contratoId
    };
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error validando acceso' });
  }
};
```

### Uso en Rutas
```typescript
// Todas las rutas que requieren contrato específico
router.get('/contratos/:contratoId/nominas', 
  authenticateToken,
  validateTripleAccess,
  NominaController.getNominasByContrato
);

router.post('/contratos/:contratoId/pagos',
  authenticateToken,
  validateTripleAccess,
  PagoController.createPago
);
```

## JWT Token Structure

```typescript
interface JWTPayload {
  userId: number;
  username: string;
  organismoId: number;
  organismoNombre: string;
  contratos: Array<{
    IdContrato: number;
    NombreContrato: string;
    IdModalidad: number;
  }>;
  iat: number;
  exp: number;
}
```

## Flujo de Autenticación

```mermaid
sequenceDiagramhi red 
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    
    U->>F: Login (usuario, password)
    F->>B: POST /auth/login
    B->>DB: sp_login_usuario
    DB-->>B: userData + contratos[]
    B-->>F: JWT con 3 niveles
    F->>F: Guardar token
    
    U->>F: Acceder a Nómina
    F->>B: GET /contratos/123/nominas (JWT)
    B->>B: Validar JWT
    B->>B: Extraer userId, organismoId
    B->>DB: sp_validar_acceso_completo
    DB-->>B: Acceso OK/Denegado
    B->>DB: sp_get_nominas (si OK)
    DB-->>B: Datos nómina
    B-->>F: Response
```

## Queries Seguras

### Siempre incluir los 3 filtros
```sql
-- ✅ CORRECTO - Validación triple
SELECT n.* 
FROM Nominas n
INNER JOIN Contratos c ON n.IdContrato = c.IdContrato
INNER JOIN UsuarioContratos uc ON c.IdContrato = uc.IdContrato
WHERE uc.IdUsuario = @IdUsuario
  AND c.IdOrganismo = @IdOrganismo
  AND c.IdContrato = @IdContrato
  AND uc.Activo = 1

-- ❌ INCORRECTO - Falta validación de usuario
SELECT * FROM Nominas 
WHERE IdContrato = @IdContrato
```

## Auditoría con 3 Niveles

```sql
CREATE TABLE AuditoriaAccesos (
    IdAuditoria INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL,
    IdOrganismo INT NOT NULL,
    IdContrato INT NULL, -- Puede ser NULL para accesos generales
    Accion VARCHAR(100) NOT NULL,
    FechaAcceso DATETIME DEFAULT GETDATE(),
    IP VARCHAR(45),
    UserAgent VARCHAR(500),
    Exitoso BIT DEFAULT 1,
    MotivoFallo VARCHAR(200) NULL
)
```

## Mejores Prácticas

1. **Nunca confiar en el cliente**: Siempre validar en backend
2. **Fail-safe**: Si falta algún dato, denegar acceso
3. **Logs detallados**: Registrar todos los intentos de acceso
4. **Cache con cuidado**: Las keys de cache deben incluir los 3 IDs
5. **Timeouts cortos**: Tokens JWT con expiración de 15-30 minutos

## Ejemplo Completo

```typescript
export class SecureController {
  async getNominaData(req: Request, res: Response) {
    try {
      // 1. Obtener datos del token (ya validado por middleware)
      const { userId, organismoId } = req.user;
      const { contratoId } = req.params;
      
      // 2. Log de acceso
      await this.auditService.logAccess({
        userId,
        organismoId,
        contratoId,
        action: 'VIEW_NOMINA',
        ip: req.ip
      });
      
      // 3. Ejecutar query segura
      const result = await this.db.executeStoredProcedure(
        'sp_get_nomina_secure',
        {
          IdUsuario: userId,
          IdOrganismo: organismoId,
          IdContrato: contratoId
        }
      );
      
      // 4. Cache con key compuesta
      const cacheKey = `nomina:${organismoId}:${contratoId}:${userId}`;
      await this.cache.set(cacheKey, result, 300);
      
      // 5. Responder
      res.json({
        success: true,
        data: result,
        context: {
          organismo: req.user.organismoNombre,
          contrato: req.user.contratos.find(c => c.IdContrato === contratoId)?.NombreContrato
        }
      });
      
    } catch (error) {
      // 6. Log de error con contexto completo
      logger.error('Error en getNominaData', {
        userId,
        organismoId,
        contratoId,
        error: error.message
      });
      
      res.status(500).json({ error: 'Error obteniendo datos' });
    }
  }
}
```

Este sistema de 3 niveles garantiza que:
- Un usuario solo ve datos de su organismo
- Solo accede a contratos asignados
- Todas las operaciones son trazables