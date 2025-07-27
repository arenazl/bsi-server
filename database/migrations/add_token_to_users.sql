-- Agregar columna de token JWT a la tabla Users
-- Esta tabla es la del panel de administración, diferente a la de login

-- Verificar si la columna ya existe antes de agregarla
SELECT COUNT(*) INTO @column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'Users' 
AND column_name = 'auth_token';

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE Users ADD COLUMN auth_token VARCHAR(500) NULL AFTER email',
    'SELECT "La columna auth_token ya existe" AS mensaje');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar columna para el refresh token
SELECT COUNT(*) INTO @refresh_column_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'Users' 
AND column_name = 'refresh_token';

SET @sql2 = IF(@refresh_column_exists = 0,
    'ALTER TABLE Users ADD COLUMN refresh_token VARCHAR(500) NULL AFTER auth_token',
    'SELECT "La columna refresh_token ya existe" AS mensaje');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Agregar columna para la fecha de último login
SELECT COUNT(*) INTO @last_login_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'Users' 
AND column_name = 'ultimo_login';

SET @sql3 = IF(@last_login_exists = 0,
    'ALTER TABLE Users ADD COLUMN ultimo_login DATETIME NULL AFTER refresh_token',
    'SELECT "La columna ultimo_login ya existe" AS mensaje');

PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Agregar índice en el token para búsquedas más rápidas
SELECT COUNT(*) INTO @index_exists
FROM information_schema.statistics
WHERE table_schema = DATABASE()
AND table_name = 'Users'
AND index_name = 'idx_auth_token';

SET @sql4 = IF(@index_exists = 0,
    'CREATE INDEX idx_auth_token ON Users(auth_token)',
    'SELECT "El índice idx_auth_token ya existe" AS mensaje');

PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;