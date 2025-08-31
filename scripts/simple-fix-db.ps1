# Script simple para solucionar problemas de base de datos
# Electridom - Simple Database Fix

Write-Host "🔧 Solución simple para problemas de base de datos..." -ForegroundColor Yellow

# 1. Detener todo
Write-Host "🛑 Deteniendo servicios..." -ForegroundColor Blue
docker-compose down

# 2. Limpiar volumen de MariaDB
Write-Host "🧹 Limpiando volumen MariaDB..." -ForegroundColor Blue
try {
    docker volume rm electridom_mariadb_data -f
    Write-Host "✅ Volumen eliminado" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Volumen no existía" -ForegroundColor Yellow
}

# 3. Crear configuración simple
Write-Host "🔧 Creando configuración simple..." -ForegroundColor Blue
$mariadbConfig = @"
[mysqld]
bind-address = 0.0.0.0
port = 3306
default_authentication_plugin = mysql_native_password
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
"@

$mariadbConfig | Out-File -FilePath "mariadb-custom.cnf" -Encoding UTF8
Write-Host "✅ Configuración creada" -ForegroundColor Green

# 4. Iniciar solo MariaDB
Write-Host "🚀 Iniciando MariaDB..." -ForegroundColor Green
docker-compose up -d mariadb

# 5. Esperar
Write-Host "⏳ Esperando inicio de MariaDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 6. Verificar conexión
Write-Host "🔍 Verificando conexión..." -ForegroundColor Blue
$attempts = 0
$maxAttempts = 15

do {
    $attempts++
    Write-Host "Intento $attempts/$maxAttempts..." -ForegroundColor Yellow
    
    try {
        $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MariaDB conectado" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "❌ Error en intento $attempts" -ForegroundColor Red
    }
    
    if ($attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 10
    }
} while ($attempts -lt $maxAttempts)

if ($attempts -eq $maxAttempts) {
    Write-Host "❌ No se pudo conectar a MariaDB" -ForegroundColor Red
    Write-Host "🔍 Logs de MariaDB:" -ForegroundColor Yellow
    docker logs electridom-mariadb --tail 20
    exit 1
}

# 7. Configurar base de datos
Write-Host "👤 Configurando base de datos..." -ForegroundColor Blue
docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS electridom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE USER IF NOT EXISTS 'electridom'@'%' IDENTIFIED BY 'electridom123';"
docker exec electridom-mariadb mariadb -u root -prootpassword -e "GRANT ALL PRIVILEGES ON electridom.* TO 'electridom'@'%';"
docker exec electridom-mariadb mariadb -u root -prootpassword -e "FLUSH PRIVILEGES;"
Write-Host "✅ Base de datos configurada" -ForegroundColor Green

# 8. Iniciar Adminer
Write-Host "🌐 Iniciando Adminer..." -ForegroundColor Blue
docker-compose up -d adminer
Start-Sleep -Seconds 5

# 9. Iniciar API
Write-Host "🔌 Iniciando API..." -ForegroundColor Blue
docker-compose up -d api
Start-Sleep -Seconds 10

# 10. Verificar estado
Write-Host "📊 Estado de servicios:" -ForegroundColor Blue
docker-compose ps

# 11. Información de conexión
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

Write-Host "`n✅ Solución simple completada!" -ForegroundColor Green
Write-Host "🎯 URLs de verificación:" -ForegroundColor Yellow
Write-Host "- Adminer: http://localhost:8080" -ForegroundColor White
Write-Host "- API Health: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "- API Docs: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "- Aplicación: http://localhost:8082" -ForegroundColor White
