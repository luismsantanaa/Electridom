# Start Development Environment - Calculadora Eléctrica RD
# Inicia Backend (3000), Frontend (4200) y Plan Service (8000)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Calculadora Eléctrica RD - Dev Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $PSScriptRoot
$rootPath = Split-Path -Parent $rootPath
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"
$planServicePath = Join-Path $rootPath "plan-service"

# Verificar que existen las carpetas
$paths = @{
    "Backend" = $backendPath
    "Frontend" = $frontendPath
    "Plan Service" = $planServicePath
}

foreach ($service in $paths.Keys) {
    if (-not (Test-Path $paths[$service])) {
        Write-Host "ERROR: No se encontró la carpeta de $service en $($paths[$service])" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Iniciando servicios..." -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "→ Iniciando Backend (puerto 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend NestJS - Puerto 3000' -ForegroundColor Cyan; npm run start:dev"

# Iniciar Frontend
Write-Host "→ Iniciando Frontend (puerto 4200)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend React - Puerto 4200' -ForegroundColor Cyan; npm run dev"

# Iniciar Plan Service
Write-Host "→ Iniciando Plan Service (puerto 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$planServicePath'; Write-Host 'Plan Service FastAPI - Puerto 8000' -ForegroundColor Cyan; uvicorn app.main:app --reload --port 8000"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Servicios iniciados correctamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:       http://localhost:3000" -ForegroundColor White
Write-Host "Frontend:      http://localhost:4200" -ForegroundColor White
Write-Host "Plan Service:  http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Para detener todos los servicios, ejecuta: .\infrastructure\scripts\stop-dev.ps1" -ForegroundColor Gray
Write-Host ""
