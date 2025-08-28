# Script para configurar Open WebUI y guiar descarga de modelos
Write-Host "=== Configuración de Open WebUI ===" -ForegroundColor Green

# Verificar servicios
Write-Host "`nVerificando servicios..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001" -Method Get -TimeoutSec 10
    Write-Host "✓ Open WebUI está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Open WebUI no está ejecutándose" -ForegroundColor Red
    exit 1
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 10
    Write-Host "✓ Ollama está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: Ollama no está ejecutándose" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Configuración de Open WebUI ===" -ForegroundColor Yellow
Write-Host "Open WebUI necesita configuración inicial." -ForegroundColor Cyan

Write-Host "`n=== Pasos para Configurar Open WebUI ===" -ForegroundColor Yellow
Write-Host "1. Abre tu navegador y ve a: http://localhost:3001" -ForegroundColor Cyan
Write-Host "2. Verás la pantalla de configuración inicial" -ForegroundColor Cyan
Write-Host "3. Configura lo siguiente:" -ForegroundColor Cyan
Write-Host "   - Backend URL: http://ollama:11434" -ForegroundColor Green
Write-Host "   - O si no funciona, usa: http://localhost:11434" -ForegroundColor Green
Write-Host "   - Crea un usuario y contraseña" -ForegroundColor Green
Write-Host "4. Guarda la configuración" -ForegroundColor Cyan

Write-Host "`n=== Después de Configurar ===" -ForegroundColor Yellow
Write-Host "Una vez configurado, sigue estos pasos:" -ForegroundColor Cyan
Write-Host "1. Ve a la sección 'Models'" -ForegroundColor Cyan
Write-Host "2. Busca 'tinyllama'" -ForegroundColor Cyan
Write-Host "3. Descarga 'tinyllama:1b-chat-q4_K_M'" -ForegroundColor Cyan
Write-Host "4. Espera a que se complete la descarga" -ForegroundColor Cyan

Write-Host "`n=== Verificación Automática ===" -ForegroundColor Yellow
Write-Host "Este script verificará cuando el modelo esté disponible." -ForegroundColor Cyan

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

Write-Host "`n=== Iniciando Verificación ===" -ForegroundColor Yellow
Write-Host "El script verificará cada 30 segundos si hay modelos disponibles." -ForegroundColor Cyan
Write-Host "Puedes continuar con la configuración de Open WebUI mientras tanto." -ForegroundColor Cyan

# Verificar cada 30 segundos
$maxAttempts = 40  # 20 minutos
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
