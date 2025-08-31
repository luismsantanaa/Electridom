# Script de solución rápida para problemas de base de datos
# Electridom - Quick Database Fix

Write-Host "⚡ Solución rápida para problemas de base de datos..." -ForegroundColor Yellow

# 1. Verificar estado actual
Write-Host "📊 Estado actual:" -ForegroundColor Blue
docker-compose ps

# 2. Detener solo MariaDB
Write-Host "🛑 Deteniendo MariaDB..." -ForegroundColor Blue
docker-compose stop mariadb

# 3. Eliminar contenedor de MariaDB
Write-Host "🗑️ Eliminando contenedor MariaDB..." -ForegroundColor Blue
docker rm -f electridom-mariadb

# 4. Eliminar volumen de MariaDB
Write-Host "🧹 Eliminando volumen MariaDB..." -ForegroundColor Blue
try {
    docker volume rm electridom_mariadb_data -f
    Write-Host "✅ Volumen eliminado" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Volumen no existía" -ForegroundColor Yellow
}

# 5. Recrear configuración de MariaDB
Write-Host "🔧 Recreando configuración..." -ForegroundColor Blue

# Crear configuración mínima
$mariadbConfig = @"
[mysqld]
bind-address = 0.0.0.0
port = 3306
default_authentication_plugin = mysql_native_password
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
"@

$mariadbConfig | Out-File -FilePath "mariadb-custom.cnf" -Encoding UTF8

# 6. Iniciar MariaDB
Write-Host "🚀 Iniciando MariaDB..." -ForegroundColor Green
docker-compose up -d mariadb

# 7. Esperar y verificar
Write-Host "⏳ Esperando inicio de MariaDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 8. Verificar conexión
Write-Host "🔍 Verificando conexión..." -ForegroundColor Blue
$attempts = 0
$maxAttempts = 10

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
        Start-Sleep -Seconds 5
    }
} while ($attempts -lt $maxAttempts)

if ($attempts -eq $maxAttempts) {
    Write-Host "❌ No se pudo conectar a MariaDB" -ForegroundColor Red
    Write-Host "🔍 Logs de MariaDB:" -ForegroundColor Yellow
    docker logs electridom-mariadb --tail 20
    exit 1
}

# 9. Configurar base de datos
Write-Host "👤 Configurando base de datos..." -ForegroundColor Blue

# Comandos SQL individuales
docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS electridom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec electridom-mariadb mariadb -u root -prootpassword -e "CREATE USER IF NOT EXISTS 'electridom'@'%' IDENTIFIED BY 'electridom123';"
docker exec electridom-mariadb mariadb -u root -prootpassword -e "GRANT ALL PRIVILEGES ON electridom.* TO 'electridom'@'%';"
docker exec electridom-mariadb mariadb -u root -prootpassword -e "FLUSH PRIVILEGES;"

Write-Host "✅ Base de datos configurada" -ForegroundColor Green

# 10. Iniciar Adminer
Write-Host "🌐 Iniciando Adminer..." -ForegroundColor Blue
docker-compose up -d adminer

# 11. Iniciar API
Write-Host "🔌 Iniciando API..." -ForegroundColor Blue
docker-compose up -d api

# 12. Verificar estado final
Write-Host "📊 Estado final:" -ForegroundColor Blue
Start-Sleep -Seconds 10
docker-compose ps

Write-Host "`n✅ Solución rápida completada!" -ForegroundColor Green
Write-Host "🎯 URLs de verificación:" -ForegroundColor Yellow
Write-Host "- Adminer: http://localhost:8080" -ForegroundColor White
Write-Host "- API Health: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "- API Docs: http://localhost:3000/api/docs" -ForegroundColor White
