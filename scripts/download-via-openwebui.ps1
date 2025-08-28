# Script para descargar modelos usando Open WebUI
Write-Host "=== Descarga de Modelos via Open WebUI ===" -ForegroundColor Green

# Verificar que Open WebUI esté ejecutándose
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001" -Method Get -TimeoutSec 10
    Write-Host "✓ Open WebUI está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Open WebUI no está ejecutándose" -ForegroundColor Red
    exit 1
}

# Verificar que Ollama esté conectado a Open WebUI
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/models" -Method Get -TimeoutSec 10
    Write-Host "✓ Open WebUI conectado a Ollama" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Open WebUI no puede conectar con Ollama" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Instrucciones para Descargar Modelo ===" -ForegroundColor Yellow
Write-Host "1. Abre tu navegador y ve a: http://localhost:3001" -ForegroundColor Cyan
Write-Host "2. Inicia sesión o crea una cuenta" -ForegroundColor Cyan
Write-Host "3. Ve a la sección 'Models'" -ForegroundColor Cyan
Write-Host "4. Busca y descarga uno de estos modelos:" -ForegroundColor Cyan
Write-Host "   - tinyllama:1b-chat-q4_K_M (recomendado)" -ForegroundColor Green
Write-Host "   - phi3:mini-4k-instruct-q4_K_M" -ForegroundColor Green
Write-Host "   - llama3.1:1b-instruct-q4_K_M" -ForegroundColor Green
Write-Host "5. Espera a que se complete la descarga" -ForegroundColor Cyan

Write-Host "`n=== Verificación Automática ===" -ForegroundColor Yellow
Write-Host "Este script verificará automáticamente cuando el modelo esté disponible." -ForegroundColor Cyan

# Función para verificar modelos
function Test-Models {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
        if ($response.models.Count -gt 0) {
            Write-Host "`n✓ ¡Modelos disponibles!" -ForegroundColor Green
            foreach ($model in $response.models) {
                Write-Host "  - $($model.name)" -ForegroundColor Cyan
            }
            return $true
        } else {
            Write-Host "`n⏳ Esperando modelos..." -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "`n✗ Error verificando modelos" -ForegroundColor Red
        return $false
    }
}

# Verificar cada 30 segundos
$maxAttempts = 20
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "`nIntento $attempt de $maxAttempts..." -ForegroundColor Gray
    
    if (Test-Models) {
        Write-Host "`n=== ¡Éxito! ===" -ForegroundColor Green
        Write-Host "Los modelos están disponibles en Ollama." -ForegroundColor Cyan
        
        # Probar el primer modelo
        try {
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
        } catch {
            Write-Host "✗ Error probando modelo: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        break
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "Esperando 30 segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host "`n✗ Tiempo de espera agotado" -ForegroundColor Red
    Write-Host "Por favor, verifica manualmente en Open WebUI." -ForegroundColor Yellow
}

Write-Host "`n=== Proceso Completado ===" -ForegroundColor Green
Write-Host "Open WebUI: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Ollama API: http://localhost:11434" -ForegroundColor Cyan
