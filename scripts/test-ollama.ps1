# Script de prueba para Ollama - Descarga un modelo pequeño
Write-Host "=== Prueba de Ollama ===" -ForegroundColor Green

# Verificar que Ollama esté ejecutándose
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama no está ejecutándose" -ForegroundColor Red
    exit 1
}

# Intentar descargar un modelo muy pequeño
$model = "llama3.1:1b-instruct-q4_K_M"
Write-Host "`nDescargando modelo de prueba: $model" -ForegroundColor Yellow

try {
    $pullBody = @{
        name = $model
        stream = $false
    } | ConvertTo-Json
    
    Write-Host "Iniciando descarga..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/pull" -Method Post -Body $pullBody -ContentType "application/json" -TimeoutSec 900
    
    Write-Host "✓ Modelo descargado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Verificar si hay modelos disponibles
    try {
        $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
        if ($tags.models.Count -gt 0) {
            Write-Host "`nModelos disponibles:" -ForegroundColor Green
            foreach ($m in $tags.models) {
                Write-Host "  - $($m.name)" -ForegroundColor Cyan
            }
        }
    } catch {
        Write-Host "No se pudieron listar los modelos" -ForegroundColor Red
    }
}
