# Script para descargar modelo muy pequeño optimizado para memoria limitada
Write-Host "=== Descarga de Modelo Pequeño ===" -ForegroundColor Green

# Verificar que Ollama esté ejecutándose
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama no está ejecutándose" -ForegroundColor Red
    exit 1
}

# Lista de modelos muy pequeños (menos de 1GB)
$smallModels = @(
    "tinyllama:1b-chat-q4_K_M",      # ~500MB
    "phi3:mini-4k-instruct-q4_K_M",  # ~1GB
    "llama3.1:1b-instruct-q4_K_M"    # ~1GB
)

Write-Host "`nIntentando descargar modelo pequeño..." -ForegroundColor Yellow

foreach ($model in $smallModels) {
    Write-Host "`nProbando modelo: $model" -ForegroundColor Cyan
    
    try {
        # Usar timeout más corto
        $pullBody = @{
            name = $model
            stream = $false
        } | ConvertTo-Json
        
        Write-Host "Descargando $model..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/pull" -Method Post -Body $pullBody -ContentType "application/json" -TimeoutSec 300
        
        if ($response.status -eq "success") {
            Write-Host "✓ Modelo $model descargado exitosamente!" -ForegroundColor Green
            break
        } else {
            Write-Host "✗ Error descargando modelo $model" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error con $model : $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
}

# Verificar modelos disponibles
Write-Host "`n=== Verificando modelos disponibles ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    if ($response.models.Count -gt 0) {
        Write-Host "✓ Modelos disponibles:" -ForegroundColor Green
        foreach ($model in $response.models) {
            Write-Host "  - $($model.name)" -ForegroundColor Cyan
        }
        
        # Probar el primer modelo disponible
        $firstModel = $response.models[0].name
        Write-Host "`nProbando modelo: $firstModel" -ForegroundColor Yellow
        
        $testBody = @{
            model = $firstModel
            prompt = "Hola, ¿cómo estás?"
            stream = $false
        } | ConvertTo-Json
        
        $testResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testBody -ContentType "application/json" -TimeoutSec 30
        
        if ($testResponse.response) {
            Write-Host "✓ Modelo $firstModel funciona correctamente!" -ForegroundColor Green
            Write-Host "Respuesta: $($testResponse.response)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ No hay modelos disponibles" -ForegroundColor Red
        Write-Host "`nRecomendaciones:" -ForegroundColor Yellow
        Write-Host "1. Usar Open WebUI en http://localhost:3001" -ForegroundColor Cyan
        Write-Host "2. Verificar conectividad de red" -ForegroundColor Cyan
        Write-Host "3. Verificar espacio en disco" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Error verificando modelos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Proceso completado ===" -ForegroundColor Green
