# Script para descargar modelos de Ollama optimizados para Electridom
# Usando modelos más pequeños y eficientes

Write-Host "=== Descarga de Modelos Ollama para Electridom ===" -ForegroundColor Green

# Verificar que Ollama esté ejecutándose
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama no está ejecutándose en http://localhost:11434" -ForegroundColor Red
    Write-Host "Ejecuta: docker-compose up -d ollama" -ForegroundColor Yellow
    exit 1
}

# Lista de modelos optimizados (más pequeños y rápidos)
$models = @(
    "llama3.1:1b-instruct-q4_K_M",      # Modelo muy pequeño y rápido
    "llama3.1:3b-instruct-q4_K_M",      # Modelo pequeño balanceado
    "mistral:7b-instruct-v0.2-q4_K_M",  # Modelo eficiente para instrucciones
    "phi3:mini-4k-instruct-q4_K_M"      # Modelo Microsoft optimizado
)

Write-Host "`nDescargando modelos optimizados..." -ForegroundColor Cyan

foreach ($model in $models) {
    Write-Host "`nDescargando modelo: $model" -ForegroundColor Yellow
    
    try {
        # Usar API REST de Ollama
        $pullBody = @{
            name = $model
            stream = $false
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/pull" -Method Post -Body $pullBody -ContentType "application/json" -TimeoutSec 600
        
        if ($response.status -eq "success") {
            Write-Host "✓ Modelo $model descargado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "✗ Error descargando modelo $model" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Error descargando modelo $model : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verificar modelos descargados
Write-Host "`n=== Verificando modelos descargados ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    if ($response.models.Count -gt 0) {
        Write-Host "✓ Modelos disponibles:" -ForegroundColor Green
        foreach ($model in $response.models) {
            Write-Host "  - $($model.name)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ No se encontraron modelos descargados" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error verificando modelos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Proceso completado ===" -ForegroundColor Green
