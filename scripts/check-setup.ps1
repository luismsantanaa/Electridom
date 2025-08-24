Write-Host "Verificando configuracion CI/CD para Calculadora Electrica RD..." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$errors = 0

# Verificar estructura basica
Write-Host "`nVerificando estructura del monorepo..." -ForegroundColor Yellow

if (Test-Path "calculadora-electrica-backend" -PathType Container) {
    Write-Host "OK - calculadora-electrica-backend" -ForegroundColor Green
} else {
    Write-Host "ERROR - calculadora-electrica-backend no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path "calculadora-electrica-frontend" -PathType Container) {
    Write-Host "OK - calculadora-electrica-frontend" -ForegroundColor Green
} else {
    Write-Host "ERROR - calculadora-electrica-frontend no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path ".github" -PathType Container) {
    Write-Host "OK - .github" -ForegroundColor Green
} else {
    Write-Host "ERROR - .github no encontrado" -ForegroundColor Red
    $errors++
}

# Verificar archivos de CI/CD
Write-Host "`nVerificando archivos de configuracion CI/CD..." -ForegroundColor Yellow

if (Test-Path ".github/workflows/ci.yml" -PathType Leaf) {
    Write-Host "OK - .github/workflows/ci.yml" -ForegroundColor Green
} else {
    Write-Host "ERROR - .github/workflows/ci.yml no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path ".github/workflows/status.yml" -PathType Leaf) {
    Write-Host "OK - .github/workflows/status.yml" -ForegroundColor Green
} else {
    Write-Host "ERROR - .github/workflows/status.yml no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path ".github/dependabot.yml" -PathType Leaf) {
    Write-Host "OK - .github/dependabot.yml" -ForegroundColor Green
} else {
    Write-Host "ERROR - .github/dependabot.yml no encontrado" -ForegroundColor Red
    $errors++
}

if (Test-Path "README.md" -PathType Leaf) {
    Write-Host "OK - README.md" -ForegroundColor Green
} else {
    Write-Host "ERROR - README.md no encontrado" -ForegroundColor Red
    $errors++
}

# Verificar herramientas
Write-Host "`nVerificando herramientas de desarrollo..." -ForegroundColor Yellow

if (Get-Command "node" -ErrorAction SilentlyContinue) {
    Write-Host "OK - Node.js" -ForegroundColor Green
} else {
    Write-Host "ERROR - Node.js no instalado" -ForegroundColor Red
    $errors++
}

if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    Write-Host "OK - npm" -ForegroundColor Green
} else {
    Write-Host "ERROR - npm no instalado" -ForegroundColor Red
    $errors++
}

if (Get-Command "git" -ErrorAction SilentlyContinue) {
    Write-Host "OK - Git" -ForegroundColor Green
} else {
    Write-Host "ERROR - Git no instalado" -ForegroundColor Red
    $errors++
}

# Resumen
Write-Host "`nResumen de verificacion..." -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

if ($errors -eq 0) {
    Write-Host "Todas las verificaciones pasaron exitosamente!" -ForegroundColor Green
    Write-Host "El proyecto esta listo para CI/CD" -ForegroundColor Green
    Write-Host "`nProximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Hacer commit y push de los cambios"
    Write-Host "2. Verificar que los workflows se ejecuten en GitHub"
    Write-Host "3. Revisar los badges en el README"
} else {
    Write-Host "Se encontraron $errors error(es)" -ForegroundColor Red
    Write-Host "Por favor, corrija los errores antes de continuar" -ForegroundColor Yellow
}
