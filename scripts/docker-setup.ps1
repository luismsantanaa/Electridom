# ========================================
# SCRIPT DE CONFIGURACIÓN DOCKER - ELECTRIDOM
# ========================================

Write-Host "Configurando Electridom con Docker..." -ForegroundColor Green

# Verificar si Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar si Docker Compose está disponible
try {
    docker-compose --version | Out-Null
    Write-Host "Docker Compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está disponible." -ForegroundColor Red
    exit 1
}

# Crear archivo .env si no existe
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creando archivo .env..." -ForegroundColor Yellow
    
    $envContent = @"
# ========================================
# VARIABLES DE ENTORNO PARA DOCKER
# ========================================

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Database Configuration
DATABASE_HOST=mariadb
DATABASE_PORT=3306
DATABASE_USERNAME=electridom
DATABASE_PASSWORD=electridom
DATABASE_NAME=electridom

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=900s

# Application Configuration
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Cache Configuration
RULE_CACHE_TTL_MS=60000

# Metrics Configuration
METRICS_ENABLED=true

# Refresh Tokens
REFRESH_TTL=30d
REFRESH_ROTATE=true
REFRESH_SALT=your-refresh-salt-here-make-it-long-and-random
REFRESH_COOKIE_ENABLED=false

# AI Configuration
AI_TIMEOUT_MS=30000
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "Archivo .env creado. Por favor configura tu OPENAI_API_KEY." -ForegroundColor Green
}

# Verificar si las variables de entorno están configuradas
$envContent = Get-Content $envFile -Raw
if ($envContent -match "your-openai-api-key-here") {
    Write-Host "ADVERTENCIA: OPENAI_API_KEY no está configurada en .env" -ForegroundColor Yellow
    Write-Host "   La funcionalidad de IA no estará disponible." -ForegroundColor Yellow
}

# Construir y ejecutar los contenedores
    Write-Host "Construyendo contenedores..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Contenedores construidos exitosamente" -ForegroundColor Green
    
    Write-Host "Iniciando servicios..." -ForegroundColor Yellow
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Servicios iniciados exitosamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs de acceso:" -ForegroundColor Cyan
        Write-Host "   Frontend: http://localhost" -ForegroundColor White
        Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
        Write-Host "   API Docs: http://localhost:3000/api/docs" -ForegroundColor White
        Write-Host "   Adminer (DB): http://localhost:8080" -ForegroundColor White
        Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White
        Write-Host ""
        Write-Host "Para ver logs: docker-compose logs -f" -ForegroundColor Gray
        Write-Host "Para detener: docker-compose down" -ForegroundColor Gray
    } else {
        Write-Host "❌ Error al iniciar servicios" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Error al construir contenedores" -ForegroundColor Red
    exit 1
}
