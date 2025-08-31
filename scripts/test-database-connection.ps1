# Script para verificar conexión a la base de datos
# Electridom - Test Database Connection

Write-Host "🔍 Verificando conexión a la base de datos..." -ForegroundColor Yellow

# 1. Verificar estado de contenedores
Write-Host "📊 Estado de contenedores:" -ForegroundColor Blue
docker-compose ps

# 2. Verificar que MariaDB esté corriendo
Write-Host "`n🔍 Verificando MariaDB..." -ForegroundColor Blue
$mariadbStatus = docker-compose ps mariadb | Select-String "Up"
if ($mariadbStatus) {
    Write-Host "✅ MariaDB está corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ MariaDB no está corriendo" -ForegroundColor Red
    Write-Host "🚀 Iniciando MariaDB..." -ForegroundColor Yellow
    docker-compose up -d mariadb
    Start-Sleep -Seconds 30
}

# 3. Probar conexión directa a MariaDB
Write-Host "`n🔌 Probando conexión directa a MariaDB..." -ForegroundColor Blue
try {
    $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1 as test;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión root exitosa" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en conexión root: $result" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error al conectar como root: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Probar conexión con usuario electridom
Write-Host "`n👤 Probando conexión con usuario electridom..." -ForegroundColor Blue
try {
    $result = docker exec electridom-mariadb mariadb -u electridom -pelectridom123 -e "SELECT 1 as test;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión electridom exitosa" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en conexión electridom: $result" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error al conectar como electridom: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Verificar base de datos
Write-Host "`n📋 Verificando base de datos..." -ForegroundColor Blue
try {
    $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SHOW DATABASES;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos disponible:" -ForegroundColor Green
        $result | Where-Object { $_ -match "electridom" } | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    }
}
catch {
    Write-Host "❌ Error al verificar base de datos: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Verificar usuarios
Write-Host "`n👥 Verificando usuarios..." -ForegroundColor Blue
try {
    $result = docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT User, Host FROM mysql.user WHERE User IN ('root', 'electridom');" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Usuarios configurados:" -ForegroundColor Green
        $result | Where-Object { $_ -match "root|electridom" } | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    }
}
catch {
    Write-Host "❌ Error al verificar usuarios: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Verificar Adminer
Write-Host "`n🌐 Verificando Adminer..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Adminer está funcionando en http://localhost:8080" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error al acceder a Adminer: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Verificar API
Write-Host "`n🔌 Verificando API..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API está funcionando en http://localhost:3000" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "  - Status: $($healthData.status)" -ForegroundColor Gray
        Write-Host "  - Database: $($healthData.database.status)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Error al acceder a la API: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Mostrar información de conexión
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

Write-Host "`n✅ Verificación completada!" -ForegroundColor Green
