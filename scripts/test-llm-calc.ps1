# ========================================
# SCRIPT DE PRUEBA PARA EL MÓDULO LLM
# ========================================

Write-Host "Probando el módulo LLM de Electridom..." -ForegroundColor Green

# Datos de prueba para un cálculo eléctrico simple
$testData = @{
    system = @{
        voltage = 120
        phases = 1
        frequency = 60
    }
    superficies = @(
        @{
            nombre = "Sala de estar"
            area_m2 = 25.5
            tipo = "residencial"
        }
    )
    consumos = @(
        @{
            nombre = "Lámpara LED"
            ambiente = "Sala de estar"
            potencia_w = 15
            tipo = "iluminacion"
        },
        @{
            nombre = "Televisor"
            ambiente = "Sala de estar"
            potencia_w = 100
            tipo = "entretenimiento"
        }
    )
    temperature = 0.3
} | ConvertTo-Json -Depth 10

Write-Host "Enviando solicitud de cálculo..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/llm/calc" -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "Error en la solicitud: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalles del error: $responseBody" -ForegroundColor Red
    }
}

Write-Host "Prueba completada" -ForegroundColor Green
