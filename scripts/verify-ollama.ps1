# ========================================
# SCRIPT DE VERIFICACIÓN DE OLLAMA
# ========================================

Write-Host "Verificando estado de Ollama..." -ForegroundColor Green

try {
    # Verificar si Ollama responde
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    
    Write-Host "✅ Ollama está ejecutándose correctamente" -ForegroundColor Green
    Write-Host "URL: http://localhost:11434" -ForegroundColor White
    
    # Mostrar modelos disponibles
    if ($response.models -and $response.models.Count -gt 0) {
        Write-Host "Modelos disponibles:" -ForegroundColor Cyan
        foreach ($model in $response.models) {
            Write-Host "  - $($model.name)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  No hay modelos descargados" -ForegroundColor Yellow
        Write-Host "Ejecuta: scripts/pull-models.ps1" -ForegroundColor Yellow
    }
    
    # Verificar Open WebUI si está disponible
    try {
        $webuiResponse = Invoke-RestMethod -Uri "http://localhost:3001" -Method Get -TimeoutSec 5
        Write-Host "✅ Open WebUI está disponible en: http://localhost:3001" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️  Open WebUI no está ejecutándose (opcional)" -ForegroundColor Gray
    }
    
    exit 0
    
} catch {
    Write-Host "❌ Error: Ollama no está ejecutándose" -ForegroundColor Red
    Write-Host "Detalles: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para iniciar Ollama:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.ia.yml up -d" -ForegroundColor White
    exit 1
}
