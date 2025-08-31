# Script para solucionar problemas de conexión a la base de datos - V2
# Electridom - Fix Database Connection Issues

Write-Host "🔧 Solucionando problemas de conexión a la base de datos (V2)..." -ForegroundColor Yellow

# 1. Detener todos los contenedores
Write-Host "📦 Deteniendo contenedores..." -ForegroundColor Blue
docker-compose down

# 2. Limpiar volúmenes de base de datos
Write-Host "🧹 Limpiando volúmenes de base de datos..." -ForegroundColor Red
try {
    docker volume rm electridom_mariadb_data -f
    Write-Host "✅ Volumen mariadb_data eliminado" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Volumen mariadb_data no existía o ya fue eliminado" -ForegroundColor Yellow
}

# 3. Crear archivo de configuración personalizado para MariaDB
Write-Host "🔨 Creando configuración de MariaDB..." -ForegroundColor Blue

$mariadbConfig = @"
[mysqld]
# Configuración básica
bind-address = 0.0.0.0
port = 3306
default_authentication_plugin = mysql_native_password

# Configuración de red y permisos
skip-name-resolve = 0
max_connections = 200
max_allowed_packet = 64M

# Configuración de caracteres
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Configuración de logs
log_error = /var/log/mysql/error.log
general_log = 0
slow_query_log = 0

# Configuración de seguridad
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO

# Configuración de performance
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
"@

# Guardar configuración
$mariadbConfig | Out-File -FilePath "mariadb-custom.cnf" -Encoding UTF8
Write-Host "✅ Archivo de configuración creado" -ForegroundColor Green

# 4. Crear backup del docker-compose original
Write-Host "📝 Creando backup del docker-compose..." -ForegroundColor Blue
if (Test-Path "docker-compose.yml.backup") {
    Remove-Item "docker-compose.yml.backup" -Force
}
Copy-Item "docker-compose.yml" "docker-compose.yml.backup"
Write-Host "✅ Backup creado" -ForegroundColor Green

# 5. Iniciar solo MariaDB primero
Write-Host "🚀 Iniciando MariaDB..." -ForegroundColor Green
docker-compose up -d mariadb

# Esperar a que MariaDB esté listo
Write-Host "⏳ Esperando a que MariaDB esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# 6. Verificar conexión a MariaDB con múltiples intentos
Write-Host "🔍 Verificando conexión a MariaDB..." -ForegroundColor Blue
$maxAttempts = 15
$attempt = 0
$connectionSuccess = $false

do {
    $attempt++
    Write-Host "Intento $attempt de $maxAttempts..." -ForegroundColor Yellow
    
    try {
        $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MariaDB está funcionando correctamente" -ForegroundColor Green
            $connectionSuccess = $true
            break
        } else {
            Write-Host "❌ Error en intento $attempt: $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error en intento $attempt: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 10
    }
} while ($attempt -lt $maxAttempts)

if (-not $connectionSuccess) {
    Write-Host "❌ No se pudo conectar a MariaDB después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "🔍 Revisando logs de MariaDB..." -ForegroundColor Yellow
    docker logs electridom-mariadb --tail 50
    Write-Host "🔄 Intentando reiniciar MariaDB..." -ForegroundColor Yellow
    docker-compose restart mariadb
    Start-Sleep -Seconds 30
    
    # Último intento
    try {
        $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MariaDB conectado después del reinicio" -ForegroundColor Green
            $connectionSuccess = $true
        } else {
            Write-Host "❌ Error persistente en MariaDB" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Error persistente en MariaDB: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 7. Crear usuario y base de datos
Write-Host "👤 Configurando usuario y base de datos..." -ForegroundColor Blue

$setupSQL = @"
-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS electridom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario electridom si no existe
CREATE USER IF NOT EXISTS 'electridom'@'%' IDENTIFIED BY 'electridom123';

-- Otorgar permisos al usuario
GRANT ALL PRIVILEGES ON electridom.* TO 'electridom'@'%';
GRANT ALL PRIVILEGES ON electridom.* TO 'root'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Mostrar usuarios y permisos
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'electridom');
SHOW GRANTS FOR 'electridom'@'%';
"@

# Ejecutar configuración SQL
try {
    $setupSQL | docker exec -i electridom-mariadb mariadb -u root -prootpassword
    Write-Host "✅ Usuario y base de datos configurados" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error al configurar usuario: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 Intentando configuración manual..." -ForegroundColor Yellow
    
    # Configuración manual paso a paso
    docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS electridom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE USER IF NOT EXISTS 'electridom'@'%' IDENTIFIED BY 'electridom123';"
    docker exec electridom-mariadb mariadb -u root -prootpassword -e "GRANT ALL PRIVILEGES ON electridom.* TO 'electridom'@'%';"
    docker exec electridom-mariadb mariadb -u root -prootpassword -e "FLUSH PRIVILEGES;"
    Write-Host "✅ Configuración manual completada" -ForegroundColor Green
}

# 8. Verificar configuración
Write-Host "🔍 Verificando configuración..." -ForegroundColor Blue

# Verificar base de datos
try {
    $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SHOW DATABASES;" 2>&1
    if ($result -match "electridom") {
        Write-Host "✅ Base de datos 'electridom' existe" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error al verificar base de datos" -ForegroundColor Red
}

# Verificar usuario electridom
try {
    $result = docker exec electridom-mariadb mariadb -u electridom -pelectridom123 -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Usuario 'electridom' funciona correctamente" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error con usuario 'electridom'" -ForegroundColor Red
}

# 9. Iniciar Adminer
Write-Host "🌐 Iniciando Adminer..." -ForegroundColor Blue
docker-compose up -d adminer
Start-Sleep -Seconds 5

# 10. Verificar Adminer
Write-Host "🔍 Verificando Adminer..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Adminer está funcionando en http://localhost:8080" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error al acceder a Adminer: $($_.Exception.Message)" -ForegroundColor Red
}

# 11. Iniciar el resto de servicios
Write-Host "🚀 Iniciando todos los servicios..." -ForegroundColor Green
docker-compose up -d

# 12. Verificar estado de todos los servicios
Write-Host "📊 Estado de los servicios:" -ForegroundColor Blue
Start-Sleep -Seconds 10
docker-compose ps

# 13. Mostrar información de conexión
Write-Host "`n📋 Información de conexión:" -ForegroundColor Cyan
Write-Host "MariaDB:" -ForegroundColor White
Write-Host "  - Host: mariadb (interno) o localhost (externo)" -ForegroundColor Gray
Write-Host "  - Puerto: 3306" -ForegroundColor Gray
Write-Host "  - Usuario root: rootpassword" -ForegroundColor Gray
Write-Host "  - Usuario electridom: electridom123" -ForegroundColor Gray
Write-Host "  - Base de datos: electridom" -ForegroundColor Gray

Write-Host "`nAdminer:" -ForegroundColor White
Write-Host "  - URL: http://localhost:8080" -ForegroundColor Gray
Write-Host "  - Servidor: mariadb" -ForegroundColor Gray
Write-Host "  - Usuario: root o electridom" -ForegroundColor Gray

Write-Host "`n🔧 Configuración para Adminer:" -ForegroundColor Yellow
Write-Host "System: MySQL / MariaDB" -ForegroundColor Gray
Write-Host "Server: mariadb" -ForegroundColor Gray
Write-Host "Username: root" -ForegroundColor Gray
Write-Host "Password: rootpassword" -ForegroundColor Gray
Write-Host "Database: electridom" -ForegroundColor Gray

# 14. Verificar logs del API
Write-Host "`n📋 Verificando logs del API..." -ForegroundColor Blue
Start-Sleep -Seconds 15
try {
    $apiLogs = docker logs electridom-api --tail 10 2>&1
    Write-Host "📋 Últimos logs del API:" -ForegroundColor Gray
    $apiLogs | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
}
catch {
    Write-Host "⚠️ No se pudieron obtener logs del API" -ForegroundColor Yellow
}

Write-Host "`n✅ Proceso completado!" -ForegroundColor Green
Write-Host "🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Acceder a Adminer: http://localhost:8080" -ForegroundColor White
Write-Host "2. Verificar conexión con las credenciales mostradas arriba" -ForegroundColor White
Write-Host "3. Acceder a la API: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "4. Si hay problemas, ejecutar: .\scripts\test-database-connection.ps1" -ForegroundColor White
