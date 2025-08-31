# Script de emergencia para problemas de base de datos
# Electridom - Emergency Database Fix

Write-Host "🚨 Solución de emergencia para problemas de base de datos..." -ForegroundColor Red

# 1. Detener todo completamente
Write-Host "🛑 Deteniendo todos los servicios..." -ForegroundColor Blue
docker-compose down --remove-orphans

# 2. Limpiar completamente
Write-Host "🧹 Limpieza completa..." -ForegroundColor Blue

# Eliminar contenedores huérfanos
try {
    docker container prune -f
    Write-Host "✅ Contenedores huérfanos eliminados" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ No hay contenedores huérfanos" -ForegroundColor Yellow
}

# Eliminar volúmenes
try {
    docker volume rm electridom_mariadb_data -f
    Write-Host "✅ Volumen mariadb_data eliminado" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Volumen mariadb_data no existía" -ForegroundColor Yellow
}

# Eliminar redes
try {
    docker network prune -f
    Write-Host "✅ Redes limpiadas" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ No hay redes para limpiar" -ForegroundColor Yellow
}

# 3. Crear configuración mínima y funcional
Write-Host "🔧 Creando configuración mínima..." -ForegroundColor Blue

$mariadbConfig = @"
[mysqld]
bind-address = 0.0.0.0
port = 3306
default_authentication_plugin = mysql_native_password
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
skip-name-resolve = 0
max_connections = 100
max_allowed_packet = 32M
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO
"@

$mariadbConfig | Out-File -FilePath "mariadb-custom.cnf" -Encoding UTF8
Write-Host "✅ Configuración creada" -ForegroundColor Green

# 4. Modificar docker-compose temporalmente para MariaDB
Write-Host "📝 Modificando docker-compose temporalmente..." -ForegroundColor Blue

# Crear backup
Copy-Item "docker-compose.yml" "docker-compose.yml.backup.emergency"

# 5. Iniciar MariaDB con configuración mínima
Write-Host "🚀 Iniciando MariaDB con configuración mínima..." -ForegroundColor Green

# Usar docker run directamente para mayor control
docker run -d --name electridom-mariadb --network electridom-network -p 3306:3306 -e MARIADB_ROOT_PASSWORD=rootpassword -e MARIADB_DATABASE=electridom -e MARIADB_USER=electridom -e MARIADB_PASSWORD=electridom123 -e MARIADB_ALLOW_EMPTY_PASSWORD=no -e MARIADB_AUTO_UPGRADE=true -v mariadb_data:/var/lib/mysql -v "${PWD}/mariadb-custom.cnf:/etc/mysql/conf.d/custom.cnf:ro" mariadb:11 --default-authentication-plugin=mysql_native_password --bind-address=0.0.0.0

# 6. Esperar a que MariaDB esté completamente listo
Write-Host "⏳ Esperando a que MariaDB esté completamente listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 7. Verificar conexión con múltiples intentos
Write-Host "🔍 Verificando conexión..." -ForegroundColor Blue
$maxAttempts = 20
$attempt = 0
$connectionSuccess = $false

do {
    $attempt++
    Write-Host "Intento $attempt de $maxAttempts..." -ForegroundColor Yellow
    
    try {
        $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MariaDB conectado exitosamente" -ForegroundColor Green
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
    Write-Host "❌ No se pudo conectar a MariaDB" -ForegroundColor Red
    Write-Host "🔍 Logs de MariaDB:" -ForegroundColor Yellow
    docker logs electridom-mariadb --tail 30
    
    Write-Host "🔄 Intentando reinicio..." -ForegroundColor Yellow
    docker restart electridom-mariadb
    Start-Sleep -Seconds 30
    
    # Último intento
    try {
        $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MariaDB conectado después del reinicio" -ForegroundColor Green
            $connectionSuccess = $true
        } else {
            Write-Host "❌ Error persistente" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Error persistente: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 8. Configurar base de datos paso a paso
Write-Host "👤 Configurando base de datos..." -ForegroundColor Blue

# Verificar que la base de datos existe
try {
    $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SHOW DATABASES;" 2>&1
    if ($result -match "electridom") {
        Write-Host "✅ Base de datos 'electridom' ya existe" -ForegroundColor Green
    } else {
        Write-Host "📋 Creando base de datos..." -ForegroundColor Yellow
        docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS electridom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        Write-Host "✅ Base de datos creada" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error al verificar/crear base de datos" -ForegroundColor Red
}

# Verificar usuario electridom
try {
    $result = docker exec electridom-mariadb mariadb -u electridom -pelectridom123 -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Usuario 'electridom' funciona" -ForegroundColor Green
    } else {
        Write-Host "📋 Configurando usuario electridom..." -ForegroundColor Yellow
        docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE USER IF NOT EXISTS 'electridom'@'%' IDENTIFIED BY 'electridom123';"
        docker exec electridom-mariadb mariadb -u root -prootpassword -e "GRANT ALL PRIVILEGES ON electridom.* TO 'electridom'@'%';"
        docker exec electridom-mariadb mariadb -u root -prootpassword -e "FLUSH PRIVILEGES;"
        Write-Host "✅ Usuario configurado" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error al configurar usuario" -ForegroundColor Red
}

# 9. Iniciar Adminer
Write-Host "🌐 Iniciando Adminer..." -ForegroundColor Blue
docker-compose up -d adminer
Start-Sleep -Seconds 10

# 10. Verificar Adminer
Write-Host "🔍 Verificando Adminer..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Adminer está funcionando en http://localhost:8080" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error al acceder a Adminer: $($_.Exception.Message)" -ForegroundColor Red
}

# 11. Iniciar API
Write-Host "🔌 Iniciando API..." -ForegroundColor Blue
docker-compose up -d api
Start-Sleep -Seconds 15

# 12. Verificar API
Write-Host "🔍 Verificando API..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API está funcionando en http://localhost:3000" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "  - Status: $($healthData.status)" -ForegroundColor Gray
        if ($healthData.database) {
            Write-Host "  - Database: $($healthData.database.status)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "❌ Error al acceder a la API: $($_.Exception.Message)" -ForegroundColor Red
}

# 13. Estado final
Write-Host "📊 Estado final de servicios:" -ForegroundColor Blue
docker-compose ps

# 14. Información de conexión
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

Write-Host "`n✅ Solución de emergencia completada!" -ForegroundColor Green
Write-Host "🎯 URLs de verificación:" -ForegroundColor Yellow
Write-Host "- Adminer: http://localhost:8080" -ForegroundColor White
Write-Host "- API Health: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "- API Docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "- Aplicación: http://localhost:8082" -ForegroundColor White

Write-Host "`n⚠️ Nota: Se creó un backup del docker-compose original como 'docker-compose.yml.backup.emergency'" -ForegroundColor Yellow
