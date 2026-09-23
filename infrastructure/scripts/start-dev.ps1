# Start Development Environment - Calculadora Electrica RD
# Inicia Backend (3000), Plan Service (8000), Celery worker y Frontend (4200)
# Requiere Docker: postgres, redis, minio (infrastructure/docker/docker-compose.yml)
# El frontend espera a que el backend responda en /api/health

param(
    [int]$BackendTimeoutSec = 300
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Calculadora Electrica RD - Dev Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backendPath = Join-Path $rootPath "backend"
$frontendPath = Join-Path $rootPath "frontend"
$planServicePath = Join-Path $rootPath "plan-service"
$venvPython = Join-Path $planServicePath ".venv\Scripts\python.exe"
$venvUvicorn = Join-Path $planServicePath ".venv\Scripts\uvicorn.exe"
$venvCelery = Join-Path $planServicePath ".venv\Scripts\celery.exe"
$backendHealthUrl = "http://localhost:3000/api/health"

$requiredPaths = @(
    @{ Name = "Backend"; Path = $backendPath },
    @{ Name = "Frontend"; Path = $frontendPath },
    @{ Name = "Plan Service"; Path = $planServicePath }
)

foreach ($item in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $item.Path)) {
        Write-Host ("ERROR: No se encontro la carpeta de {0} en {1}" -f $item.Name, $item.Path) -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Host "ERROR: No existe el venv de plan-service (.venv)." -ForegroundColor Red
    Write-Host "Crea el entorno e instala deps:" -ForegroundColor Yellow
    Write-Host "  cd plan-service" -ForegroundColor Gray
    Write-Host "  python -m venv .venv" -ForegroundColor Gray
    Write-Host "  .\.venv\Scripts\Activate.ps1" -ForegroundColor Gray
    Write-Host "  pip install -r requirements\dev.txt" -ForegroundColor Gray
    exit 1
}

$shellExe = if (Get-Command powershell.exe -ErrorAction SilentlyContinue) {
    (Get-Command powershell.exe).Source
} else {
    "powershell.exe"
}

function Free-Port {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) { return }

    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        if ($procId -eq 0) { continue }
        try {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host ("  Liberando puerto {0} (PID {1} - {2})..." -f $Port, $procId, $proc.ProcessName) -ForegroundColor Gray
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # proceso ya termino
        }
    }
}

function Start-DevWindow {
    param(
        [Parameter(Mandatory)][string]$Title,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$Command
    )

    $script = @"
`$Host.UI.RawUI.WindowTitle = '$Title'
Set-Location -LiteralPath '$WorkingDirectory'
Write-Host '$Title' -ForegroundColor Cyan
$Command
"@

    Start-Process -FilePath $shellExe -WorkingDirectory $WorkingDirectory -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-Command', $script
    )
}

function Wait-BackendReady {
    param(
        [string]$Url,
        [int]$TimeoutSec
    )

    Write-Host ("Esperando backend listo ({0}) - max {1}s..." -f $Url, $TimeoutSec) -ForegroundColor Yellow
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $attempt = 0

    while ((Get-Date) -lt $deadline) {
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host ("  Backend listo (intento {0}, HTTP {1})" -f $attempt, $response.StatusCode) -ForegroundColor Green
                return $true
            }
        } catch {
            # aun compilando / no escucha
        }

        if (($attempt % 5) -eq 0) {
            $left = [math]::Max(0, [int]($deadline - (Get-Date)).TotalSeconds)
            Write-Host ("  Aun compilando/arrancando... ({0}s restantes)" -f $left) -ForegroundColor Gray
        }
        Start-Sleep -Seconds 2
    }

    Write-Host "  TIMEOUT: el backend no respondio a tiempo." -ForegroundColor Red
    return $false
}

Write-Host "Comprobando Redis (Celery broker) en localhost:6379..." -ForegroundColor Yellow
try {
    $tcp = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if (-not $tcp.TcpTestSucceeded) {
        Write-Host "AVISO: Redis no responde en :6379. Los planos quedaran en 'pending'." -ForegroundColor Red
        Write-Host "  Arranca infra: docker compose -f infrastructure/docker/docker-compose.yml up -d postgres redis minio" -ForegroundColor Yellow
    } else {
        Write-Host "  Redis OK" -ForegroundColor Green
    }
} catch {
    Write-Host "AVISO: no se pudo verificar Redis. Asegurate de que este corriendo." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Liberando puertos 3000 / 4200 / 8000 si estan ocupados..." -ForegroundColor Yellow
Free-Port -Port 3000
Free-Port -Port 4200
Free-Port -Port 8000
Start-Sleep -Seconds 1
Write-Host ""

Write-Host "1/4 Backend (puerto 3000)..." -ForegroundColor Yellow
Start-DevWindow -Title "Backend NestJS - Puerto 3000" -WorkingDirectory $backendPath -Command "npm run start:dev"
Start-Sleep -Milliseconds 500

Write-Host "2/4 Plan Service (puerto 8000)..." -ForegroundColor Yellow
if (Test-Path -LiteralPath $venvUvicorn) {
    $planCmd = "& '$venvUvicorn' app.main:app --reload --port 8000"
} else {
    $planCmd = "& '$venvPython' -m uvicorn app.main:app --reload --port 8000"
}
Start-DevWindow -Title "Plan Service FastAPI - Puerto 8000" -WorkingDirectory $planServicePath -Command $planCmd
Start-Sleep -Milliseconds 500

# Celery worker: procesa planos PDF/DXF/PNG. Sin esto el upload queda en pending forever.
# --pool=solo es obligatorio en Windows (prefork no funciona bien).
Write-Host "3/4 Celery Worker (procesamiento de planos)..." -ForegroundColor Yellow
if (Test-Path -LiteralPath $venvCelery) {
    $celeryCmd = "& '$venvCelery' -A app.core.celery_app worker --loglevel=info --pool=solo"
} else {
    $celeryCmd = "& '$venvPython' -m celery -A app.core.celery_app worker --loglevel=info --pool=solo"
}
Start-DevWindow -Title "Celery Worker - Plan Processing" -WorkingDirectory $planServicePath -Command $celeryCmd
Write-Host ""

$ready = Wait-BackendReady -Url $backendHealthUrl -TimeoutSec $BackendTimeoutSec
if (-not $ready) {
    Write-Host ""
    Write-Host "Se abrira el frontend igual, pero veras errores de proxy hasta que el backend termine." -ForegroundColor Yellow
    Write-Host "Revisa la consola 'Backend NestJS'." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "4/4 Frontend (puerto 4200)..." -ForegroundColor Yellow
Start-DevWindow -Title "Frontend React - Puerto 4200" -WorkingDirectory $frontendPath -Command "npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Consolas lanzadas" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:       http://localhost:3000" -ForegroundColor White
Write-Host "Frontend:      http://localhost:4200" -ForegroundColor White
Write-Host "Plan Service:  http://localhost:8000" -ForegroundColor White
Write-Host "Celery Worker: consola 'Celery Worker - Plan Processing'" -ForegroundColor White
Write-Host ""
Write-Host "Compilacion backend: Nest watch (tsc). El frontend espera /api/health." -ForegroundColor Gray
Write-Host "Sin Celery worker los planos se quedan en 'pending' (tarea en Redis sin consumidor)." -ForegroundColor Gray
Write-Host "Para detener: .\infrastructure\scripts\stop-dev.ps1" -ForegroundColor Gray
Write-Host ""
