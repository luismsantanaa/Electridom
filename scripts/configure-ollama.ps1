# Script para configurar Ollama optimizado para memoria limitada
Write-Host "=== Configuración de Ollama Optimizada ===" -ForegroundColor Green

# Verificar estado actual
Write-Host "`nVerificando estado actual de Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama está ejecutándose" -ForegroundColor Green
    Write-Host "Modelos disponibles: $($response.models.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Error: Ollama no está ejecutándose" -ForegroundColor Red
    exit 1
}

# Configurar Ollama para memoria limitada
Write-Host "`nConfigurando Ollama para memoria limitada..." -ForegroundColor Yellow

# Parar el contenedor actual
Write-Host "Deteniendo contenedor actual..." -ForegroundColor Cyan
docker stop electridom-ollama

# Crear configuración optimizada
$ollamaConfig = @"
# Configuración optimizada para memoria limitada
OLLAMA_HOST=0.0.0.0
OLLAMA_ORIGINS=*
OLLAMA_NUM_PARALLEL=1
OLLAMA_KEEP_ALIVE=5m
"@

# Guardar configuración
$ollamaConfig | Out-File -FilePath "ollama.env" -Encoding UTF8

Write-Host "✓ Configuración guardada en ollama.env" -ForegroundColor Green

# Reiniciar con nueva configuración
Write-Host "`nReiniciando Ollama con configuración optimizada..." -ForegroundColor Yellow
docker run -d --name electridom-ollama-optimized `
  --env-file ollama.env `
  -p 11434:11434 `
  -v ollama:/root/.ollama `
  ollama/ollama:latest

# Esperar a que inicie
Write-Host "Esperando a que Ollama inicie..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Verificar nuevo estado
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama optimizado está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama optimizado no responde" -ForegroundColor Red
    exit 1
}

# Intentar descargar modelo pequeño
Write-Host "`nIntentando descargar modelo pequeño..." -ForegroundColor Yellow
$model = "llama3.1:1b-instruct-q4_K_M"

try {
    $pullBody = @{
        name = $model
        stream = $false
    } | ConvertTo-Json
    
    Write-Host "Descargando $model..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/pull" -Method Post -Body $pullBody -ContentType "application/json" -TimeoutSec 900
    
    if ($response.status -eq "success") {
        Write-Host "✓ Modelo $model descargado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "✗ Error descargando modelo" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar modelos disponibles
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
        Write-Host "`nRecomendación: Usar Open WebUI en http://localhost:3001 para descargar modelos manualmente" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Error verificando modelos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Configuración Completada ===" -ForegroundColor Green
Write-Host "Open WebUI disponible en: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Ollama API disponible en: http://localhost:11434" -ForegroundColor Cyan
