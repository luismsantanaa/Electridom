# Script simple para probar Ollama
Write-Host "=== Prueba Simple de Ollama ===" -ForegroundColor Green

# Verificar estado
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    Write-Host "✓ Ollama responde correctamente" -ForegroundColor Green
    Write-Host "Modelos disponibles: $($response.models.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Error conectando a Ollama: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Intentar con un modelo más simple
Write-Host "`nIntentando descargar modelo simple..." -ForegroundColor Yellow

$body = @{
    name = "llama3.1:1b-instruct-q4_K_M"
    stream = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/pull" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
    Write-Host "✓ Descarga exitosa" -ForegroundColor Green
} catch {
    Write-Host "✗ Error en descarga: $($_.Exception.Message)" -ForegroundColor Red
    
    # Verificar logs
    Write-Host "`nVerificando logs de Ollama..." -ForegroundColor Yellow
    docker logs electridom-ollama --tail 10
}
