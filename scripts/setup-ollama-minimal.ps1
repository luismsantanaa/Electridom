# Script para configurar Ollama con configuración mínima
Write-Host "=== Configuración Mínima de Ollama ===" -ForegroundColor Green

# Detener contenedores existentes
Write-Host "`nDeteniendo contenedores existentes..." -ForegroundColor Yellow
docker stop electridom-ollama electridom-ollama-optimized 2>$null
docker rm electridom-ollama electridom-ollama-optimized 2>$null

# Limpiar volúmenes
Write-Host "Limpiando volúmenes..." -ForegroundColor Yellow
docker volume rm ollama 2>$null

# Crear configuración mínima
$minimalConfig = @"
# Configuración mínima para memoria limitada
OLLAMA_HOST=0.0.0.0
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=1
OLLAMA_KEEP_ALIVE=1m
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_LOAD_TIMEOUT=2m
"@

$minimalConfig | Out-File -FilePath "ollama-minimal.env" -Encoding UTF8

Write-Host "✓ Configuración mínima guardada" -ForegroundColor Green

# Crear contenedor con configuración mínima
Write-Host "`nCreando contenedor con configuración mínima..." -ForegroundColor Yellow
docker run -d --name electridom-ollama-minimal `
  --env-file ollama-minimal.env `
  -p 11434:11434 `
  -v ollama:/root/.ollama `
  --memory=2g `
  --cpus=1 `
  ollama/ollama:latest

# Esperar a que inicie
Write-Host "Esperando a que Ollama inicie..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Verificar estado
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama mínimo está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama mínimo no responde" -ForegroundColor Red
    exit 1
}

# Intentar descargar modelo muy pequeño
Write-Host "`nIntentando descargar modelo muy pequeño..." -ForegroundColor Yellow
$model = "tinyllama:1b-chat-q4_K_M"

try {
    $pullBody = @{
        name = $model
        stream = $false
    } | ConvertTo-Json
    
    Write-Host "Descargando $model..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/pull" -Method Post -Body $pullBody -ContentType "application/json" -TimeoutSec 600
    
    if ($response.status -eq "success") {
        Write-Host "✓ Modelo $model descargado exitosamente!" -ForegroundColor Green
    } else {
        Write-Host "✗ Error descargando modelo" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar estado final
Write-Host "`n=== Estado Final ===" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    if ($response.models.Count -gt 0) {
        Write-Host "✓ Modelos disponibles:" -ForegroundColor Green
        foreach ($model in $response.models) {
            Write-Host "  - $($model.name)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "✗ No hay modelos disponibles" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error verificando modelos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Configuración Mínima Completada ===" -ForegroundColor Green
Write-Host "Ollama API: http://localhost:11434" -ForegroundColor Cyan
Write-Host "Open WebUI: http://localhost:3001" -ForegroundColor Cyan
