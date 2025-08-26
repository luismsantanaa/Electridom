# Script para verificar la configuración CORS del backend
# Ejecutar desde la raíz del proyecto backend

param(
    [string]$BackendUrl = "http://localhost:3000",
    [string]$FrontendOrigin = "http://localhost:4200"
)

Write-Host "🔍 Verificando configuración CORS del backend..." -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Yellow
Write-Host "Frontend Origin: $FrontendOrigin" -ForegroundColor Yellow
Write-Host ""

# Función para hacer requests HTTP
function Test-CorsRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )
    
    try {
        $webRequest = [System.Net.WebRequest]::Create($Url)
        $webRequest.Method = $Method
        
        foreach ($header in $Headers.GetEnumerator()) {
            $webRequest.Headers.Add($header.Key, $header.Value)
        }
        
        if ($Body -and $Method -eq "POST") {
            $webRequest.ContentType = "application/json"
            $webRequest.ContentLength = $Body.Length
            $stream = $webRequest.GetRequestStream()
            $writer = New-Object System.IO.StreamWriter($stream)
            $writer.Write($Body)
            $writer.Close()
        }
        
        $response = $webRequest.GetResponse()
        $statusCode = [int]$response.StatusCode
        
        $corsHeaders = @{
            "Access-Control-Allow-Origin" = $response.Headers["Access-Control-Allow-Origin"]
            "Access-Control-Allow-Methods" = $response.Headers["Access-Control-Allow-Methods"]
            "Access-Control-Allow-Headers" = $response.Headers["Access-Control-Allow-Headers"]
            "Access-Control-Allow-Credentials" = $response.Headers["Access-Control-Allow-Credentials"]
        }
        
        $response.Close()
        
        return @{
            Success = $true
            StatusCode = $statusCode
            CorsHeaders = $corsHeaders
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Verificar endpoints principales
$endpoints = @(
    @{ Path = "/api/calc/rooms/preview"; Method = "POST" },
    @{ Path = "/api/calc/demand/preview"; Method = "POST" },
    @{ Path = "/api/calc/circuits/preview"; Method = "POST" },
    @{ Path = "/api/calc/feeder/preview"; Method = "POST" },
    @{ Path = "/api/calc/grounding/preview"; Method = "POST" },
    @{ Path = "/api/calc/report"; Method = "POST" },
    @{ Path = "/api/docs"; Method = "GET" }
)

$testPayload = @{
    superficies = @(
        @{ nombre = "Sala"; area_m2 = 20 }
    )
    consumos = @(
        @{ nombre = "TV"; ambiente = "Sala"; potencia_w = 100 }
    )
} | ConvertTo-Json -Compress

$allTestsPassed = $true

foreach ($endpoint in $endpoints) {
    $url = "$BackendUrl$($endpoint.Path)"
    $method = $endpoint.Method
    
    Write-Host "Testing: $method $($endpoint.Path)" -ForegroundColor White
    
    # Test 1: Preflight OPTIONS request
    $preflightHeaders = @{
        "Origin" = $FrontendOrigin
        "Access-Control-Request-Method" = $method
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $preflightResult = Test-CorsRequest -Url $url -Method "OPTIONS" -Headers $preflightHeaders
    
    if ($preflightResult.Success) {
        Write-Host "  ✅ Preflight OPTIONS: $($preflightResult.StatusCode)" -ForegroundColor Green
        
        if ($preflightResult.CorsHeaders["Access-Control-Allow-Origin"] -eq $FrontendOrigin) {
            Write-Host "  ✅ CORS Origin: $($preflightResult.CorsHeaders["Access-Control-Allow-Origin"])" -ForegroundColor Green
        } else {
            Write-Host "  ❌ CORS Origin: $($preflightResult.CorsHeaders["Access-Control-Allow-Origin"])" -ForegroundColor Red
            $allTestsPassed = $false
        }
        
        if ($preflightResult.CorsHeaders["Access-Control-Allow-Methods"] -match $method) {
            Write-Host "  ✅ CORS Methods: $($preflightResult.CorsHeaders["Access-Control-Allow-Methods"])" -ForegroundColor Green
        } else {
            Write-Host "  ❌ CORS Methods: $($preflightResult.CorsHeaders["Access-Control-Allow-Methods"])" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "  ❌ Preflight OPTIONS failed: $($preflightResult.Error)" -ForegroundColor Red
        $allTestsPassed = $false
    }
    
    # Test 2: Actual request
    $requestHeaders = @{
        "Origin" = $FrontendOrigin
        "Content-Type" = "application/json"
    }
    
    $body = if ($method -eq "POST") { $testPayload } else { "" }
    $actualResult = Test-CorsRequest -Url $url -Method $method -Headers $requestHeaders -Body $body
    
    if ($actualResult.Success) {
        Write-Host "  ✅ Actual $method`: $($actualResult.StatusCode)" -ForegroundColor Green
        
        if ($actualResult.CorsHeaders["Access-Control-Allow-Origin"] -eq $FrontendOrigin) {
            Write-Host "  ✅ CORS Origin in response: $($actualResult.CorsHeaders["Access-Control-Allow-Origin"])" -ForegroundColor Green
        } else {
            Write-Host "  ❌ CORS Origin in response: $($actualResult.CorsHeaders["Access-Control-Allow-Origin"])" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } else {
        Write-Host "  ❌ Actual $method failed: $($actualResult.Error)" -ForegroundColor Red
        $allTestsPassed = $false
    }
    
    Write-Host ""
}

# Verificar configuración de Swagger
Write-Host "🔍 Verificando documentación Swagger..." -ForegroundColor Cyan

$swaggerResult = Test-CorsRequest -Url "$BackendUrl/api/docs" -Method "GET"

if ($swaggerResult.Success) {
    Write-Host "  ✅ Swagger UI accessible: $($swaggerResult.StatusCode)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Swagger UI failed: $($swaggerResult.Error)" -ForegroundColor Red
    $allTestsPassed = $false
}

$swaggerJsonResult = Test-CorsRequest -Url "$BackendUrl/api/docs-json" -Method "GET"

if ($swaggerJsonResult.Success) {
    Write-Host "  ✅ Swagger JSON accessible: $($swaggerJsonResult.StatusCode)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Swagger JSON failed: $($swaggerJsonResult.Error)" -ForegroundColor Red
    $allTestsPassed = $false
}

Write-Host ""
Write-Host "📊 Resumen de verificación CORS:" -ForegroundColor Cyan

if ($allTestsPassed) {
    Write-Host "  ✅ Todos los tests de CORS pasaron correctamente" -ForegroundColor Green
    Write-Host "  ✅ El backend está configurado correctamente para el frontend Angular" -ForegroundColor Green
} else {
    Write-Host "  ❌ Algunos tests de CORS fallaron" -ForegroundColor Red
    Write-Host "  ❌ Revisar la configuración CORS en main.ts" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 Configuración recomendada en main.ts:" -ForegroundColor Yellow
Write-Host "  app.enableCors({"
Write-Host "    origin: 'http://localhost:4200',"
Write-Host "    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],"
Write-Host "    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-trace-id'],"
Write-Host "    credentials: true,"
Write-Host "    maxAge: 86400"
Write-Host "  });"

Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Si hay errores, revisar la configuración CORS en src/main.ts"
Write-Host "  2. Verificar que el frontend Angular esté corriendo en http://localhost:4200"
Write-Host "  3. Ejecutar los tests E2E: npm run test:e2e"
Write-Host "  4. Verificar la documentación Swagger en http://localhost:3000/api/docs"
