# Stop Development Environment - Calculadora Eléctrica RD
# Detiene todos los servicios y libera los puertos 3000, 4200, 8000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Calculadora Eléctrica RD - Stop Dev" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(3000, 4200, 8000)
$stopped = 0

foreach ($port in $ports) {
    Write-Host "Buscando procesos en puerto $port..." -ForegroundColor Yellow
    
    # Buscar procesos que estén escuchando en el puerto
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        
        foreach ($pid in $pids) {
            if ($pid -eq 0) { continue }
            
            try {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Deteniendo proceso $($process.ProcessName) (PID: $pid)..." -ForegroundColor Gray
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
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
