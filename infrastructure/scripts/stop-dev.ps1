# Stop Development Environment - Calculadora Eléctrica RD
# Detiene Backend, Frontend, Plan Service y Celery worker (puertos 3000, 4200, 8000)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Calculadora Eléctrica RD - Stop Dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(3000, 4200, 4201, 8000)
$stopped = 0

foreach ($port in $ports) {
    Write-Host "Buscando procesos en puerto $port..." -ForegroundColor Yellow

    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique

        foreach ($procId in $pids) {
            if ($procId -eq 0) { continue }

            try {
                $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Deteniendo $($process.ProcessName) (PID: $procId)..." -ForegroundColor Gray
                    # Matar árbol de procesos (node/npm hijos)
                    & taskkill.exe /PID $procId /T /F 2>$null | Out-Null
                    if (-not $?) {
                        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    }
                    $stopped++
                }
            } catch {
                # Proceso ya terminó
            }
        }

        Write-Host "  Puerto $port liberado" -ForegroundColor Green
    } else {
        Write-Host "  Puerto $port ya está libre" -ForegroundColor Gray
    }
}

# Celery worker no escucha puerto fijo: matar por CommandLine
Write-Host "Buscando Celery worker (plan-service)..." -ForegroundColor Yellow
$celeryProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.CommandLine -and (
            $_.CommandLine -match 'celery.*app\.core\.celery_app' -or
            $_.CommandLine -match 'celery\.exe.*worker'
        )
    }

if ($celeryProcs) {
    foreach ($proc in $celeryProcs) {
        try {
            Write-Host "  Deteniendo Celery (PID: $($proc.ProcessId))..." -ForegroundColor Gray
            & taskkill.exe /PID $proc.ProcessId /T /F 2>$null | Out-Null
            if (-not $?) {
                Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
            }
            $stopped++
        } catch {
            # ya terminó
        }
    }
    Write-Host "  Celery worker detenido" -ForegroundColor Green
} else {
    Write-Host "  No había Celery worker activo" -ForegroundColor Gray
}

Write-Host ""

if ($stopped -gt 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  $stopped proceso(s) detenido(s)" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  No había procesos activos" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}

Write-Host ""
