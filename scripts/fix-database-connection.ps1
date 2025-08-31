# Script para solucionar problemas de conexión a la base de datos
# Electridom - Fix Database Connection Issues

Write-Host "🔧 Solucionando problemas de conexión a la base de datos..." -ForegroundColor Yellow

# 1. Detener todos los contenedores
Write-Host "📦 Deteniendo contenedores..." -ForegroundColor Blue
docker-compose down

# 2. Limpiar volúmenes de base de datos (opcional - solo si hay problemas persistentes)
$cleanVolumes = Read-Host "¿Deseas limpiar los volúmenes de base de datos? (s/n)"
if ($cleanVolumes -eq "s" -or $cleanVolumes -eq "S") {
    Write-Host "🧹 Limpiando volúmenes de base de datos..." -ForegroundColor Red
    docker volume rm electridom_mariadb_data
    docker volume rm electridom_ollama_data
    docker volume rm electridom_prometheus_data
}

# 3. Reconstruir la imagen de MariaDB con configuración correcta
Write-Host "🔨 Reconstruyendo configuración de MariaDB..." -ForegroundColor Blue

# Crear archivo de configuración personalizado para MariaDB
$mariadbConfig = @"
[mysqld]
bind-address = 0.0.0.0
port = 3306
default_authentication_plugin = mysql_native_password

# Configuración de permisos
skip-name-resolve = 0

# Configuración de red
max_connections = 200
max_allowed_packet = 64M

# Configuración de logs
log_error = /var/log/mysql/error.log
general_log = 1
general_log_file = /var/log/mysql/general.log

# Configuración de seguridad
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO
"@

# Guardar configuración
$mariadbConfig | Out-File -FilePath "mariadb-custom.cnf" -Encoding UTF8

# 4. Actualizar docker-compose.yml con configuración mejorada
Write-Host "📝 Actualizando configuración de docker-compose..." -ForegroundColor Blue

# Crear backup del docker-compose original
Copy-Item "docker-compose.yml" "docker-compose.yml.backup"

# 5. Iniciar solo MariaDB primero
Write-Host "🚀 Iniciando MariaDB..." -ForegroundColor Green
docker-compose up -d mariadb

# Esperar a que MariaDB esté listo
Write-Host "⏳ Esperando a que MariaDB esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 6. Verificar conexión a MariaDB
Write-Host "🔍 Verificando conexión a MariaDB..." -ForegroundColor Blue
$maxAttempts = 10
$attempt = 0

do {
    $attempt++
    Write-Host "Intento $attempt de $maxAttempts..." -ForegroundColor Yellow
    
    try {
        $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MariaDB está funcionando correctamente" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "❌ Error en intento $attempt" -ForegroundColor Red
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 10
    }
} while ($attempt -lt $maxAttempts)

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ No se pudo conectar a MariaDB después de $maxAttempts intentos" -ForegroundColor Red
    Write-Host "🔍 Revisando logs de MariaDB..." -ForegroundColor Yellow
    docker logs electridom-mariadb
    exit 1
}

# 7. Crear usuario y base de datos si no existen
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
$setupSQL | docker exec -i electridom-mariadb mariadb -u root -prootpassword

# 8. Iniciar Adminer para verificar
Write-Host "🌐 Iniciando Adminer..." -ForegroundColor Blue
docker-compose up -d adminer

Start-Sleep -Seconds 5

# 9. Verificar que Adminer esté funcionando
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

# 10. Iniciar el resto de servicios
Write-Host "🚀 Iniciando todos los servicios..." -ForegroundColor Green
docker-compose up -d

# 11. Verificar estado de todos los servicios
Write-Host "📊 Estado de los servicios:" -ForegroundColor Blue
docker-compose ps

# 12. Mostrar información de conexión
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

# 13. Verificar logs del API
Write-Host "`n📋 Verificando logs del API..." -ForegroundColor Blue
Start-Sleep -Seconds 10
docker logs electridom-api --tail 20

Write-Host "`n✅ Proceso completado!" -ForegroundColor Green
Write-Host "🎯 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Acceder a Adminer: http://localhost:8080" -ForegroundColor White
Write-Host "2. Verificar conexión con las credenciales mostradas arriba" -ForegroundColor White
Write-Host "3. Acceder a la API: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "4. Si hay problemas, revisar logs: docker logs electridom-api" -ForegroundColor White
