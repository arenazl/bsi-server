-- =============================================
-- Índices de Optimización para BSI
-- Basados en la clave Organismo + Contrato
-- =============================================

-- 1. ÍNDICES PRINCIPALES (Los más importantes)
-- =============================================

-- Para la tabla de Pagos
CREATE NONCLUSTERED INDEX IX_Pagos_Organismo_Contrato_Fecha
ON Pagos(IdOrganismo, IdContrato, FechaPago DESC)
INCLUDE (Concepto, Importe, Estado);
-- Este índice acelera: "Dame todos los pagos del contrato X del municipio Y ordenados por fecha"

-- Para la tabla de Nominas
CREATE NONCLUSTERED INDEX IX_Nominas_Organismo_Contrato_Estado
ON Nominas(IdOrganismo, IdContrato, Estado)
INCLUDE (FechaProceso, MontoTotal);
-- Acelera: "Dame todas las nóminas pendientes del contrato X"

-- Para la tabla de Cuentas
CREATE NONCLUSTERED INDEX IX_Cuentas_Organismo_Contrato_CBU
ON Cuentas(IdOrganismo, IdContrato, CBU)
INCLUDE (Titular, Activo);
-- Acelera: "Buscar una cuenta por CBU en un contrato específico"

-- 2. ÍNDICES PARA BÚSQUEDAS FRECUENTES
-- =====================================

-- Si buscan mucho por fecha
CREATE NONCLUSTERED INDEX IX_Pagos_Fecha_Organismo
ON Pagos(FechaPago, IdOrganismo, IdContrato)
WHERE Estado = 'PENDIENTE'; -- Índice filtrado, solo pagos pendientes

-- Para auditoría y logs
CREATE NONCLUSTERED INDEX IX_Auditoria_Organismo_Fecha
ON AuditoriaOperaciones(IdOrganismo, FechaOperacion DESC)
INCLUDE (IdUsuario, Operacion);

-- 3. ESTADÍSTICAS PARA VER SI FUNCIONAN
-- =====================================

-- Ver índices de una tabla
EXEC sp_helpindex 'Pagos';

-- Ver uso de índices
SELECT 
    OBJECT_NAME(S.[OBJECT_ID]) AS [Table],
    I.[NAME] AS [Index],
    S.USER_SEEKS,
    S.USER_SCANS,
    S.USER_LOOKUPS,
    S.USER_UPDATES
FROM SYS.DM_DB_INDEX_USAGE_STATS S
INNER JOIN SYS.INDEXES I ON I.[OBJECT_ID] = S.[OBJECT_ID] AND I.INDEX_ID = S.INDEX_ID
WHERE OBJECTPROPERTY(S.[OBJECT_ID],'IsUserTable') = 1;

-- 4. MANTENIMIENTO DE ÍNDICES
-- ===========================

-- Reorganizar índices fragmentados (ejecutar semanalmente)
ALTER INDEX ALL ON Pagos REORGANIZE;
ALTER INDEX ALL ON Nominas REORGANIZE;

-- Reconstruir índices muy fragmentados (ejecutar mensualmente)
-- ALTER INDEX ALL ON Pagos REBUILD WITH (ONLINE = ON);

-- 5. EJEMPLO DE QUERY OPTIMIZADA
-- ==============================

-- ANTES (sin índice - lento)
SELECT * FROM Pagos 
WHERE IdOrganismo = 123 AND IdContrato = 456
ORDER BY FechaPago DESC;
-- Tiempo: ~500ms con 1 millón de registros

-- DESPUÉS (con índice - rápido)
-- Mismo query
-- Tiempo: ~5ms con 1 millón de registros

-- 6. ÍNDICES PARA JOINS COMUNES
-- =============================

-- Si frecuentemente hacen JOIN entre Contratos y Pagos
CREATE NONCLUSTERED INDEX IX_Contratos_Organismo_Id
ON Contratos(IdOrganismo, IdContrato)
INCLUDE (NombreContrato, IdModalidad);

-- Esto acelera queries como:
/*
SELECT c.NombreContrato, p.*
FROM Pagos p
INNER JOIN Contratos c ON p.IdOrganismo = c.IdOrganismo 
                       AND p.IdContrato = c.IdContrato
WHERE p.IdOrganismo = @IdOrganismo
*/

PRINT 'Índices de optimización creados correctamente';