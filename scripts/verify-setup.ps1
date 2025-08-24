Write-Host "🔍 Verificando configuración CI/CD para Calculadora Eléctrica RD..." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$errors = 0

# Verificar estructura básica
Write-Host "`n📁 Verificando estructura del monorepo..." -ForegroundColor Yellow

if (Test-Path "calculadora-electrica-backend" -PathType Container) {
    Write-Host "✅ calculadora-electrica-backend" -ForegroundColor Green
} else {
    Write-Host "❌ calculadora-electrica-backend - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

if (Test-Path "calculadora-electrica-frontend" -PathType Container) {
    Write-Host "✅ calculadora-electrica-frontend" -ForegroundColor Green
} else {
    Write-Host "❌ calculadora-electrica-frontend - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

if (Test-Path ".github" -PathType Container) {
    Write-Host "✅ .github" -ForegroundColor Green
} else {
    Write-Host "❌ .github - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

# Verificar archivos de CI/CD
Write-Host "`n🔧 Verificando archivos de configuración CI/CD..." -ForegroundColor Yellow

if (Test-Path ".github/workflows/ci.yml" -PathType Leaf) {
    Write-Host "✅ .github/workflows/ci.yml" -ForegroundColor Green
} else {
    Write-Host "❌ .github/workflows/ci.yml - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

if (Test-Path ".github/workflows/status.yml" -PathType Leaf) {
    Write-Host "✅ .github/workflows/status.yml" -ForegroundColor Green
} else {
    Write-Host "❌ .github/workflows/status.yml - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

if (Test-Path ".github/dependabot.yml" -PathType Leaf) {
    Write-Host "✅ .github/dependabot.yml" -ForegroundColor Green
} else {
    Write-Host "❌ .github/dependabot.yml - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

if (Test-Path "README.md" -PathType Leaf) {
    Write-Host "✅ README.md" -ForegroundColor Green
} else {
    Write-Host "❌ README.md - NO ENCONTRADO" -ForegroundColor Red
    $errors++
}

# Verificar herramientas
Write-Host "`n🛠️ Verificando herramientas de desarrollo..." -ForegroundColor Yellow

if (Get-Command "node" -ErrorAction SilentlyContinue) {
    Write-Host "✅ Node.js" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js - NO INSTALADO" -ForegroundColor Red
    $errors++
}

if (Get-Command "npm" -ErrorAction SilentlyContinue) {
    Write-Host "✅ npm" -ForegroundColor Green
} else {
    Write-Host "❌ npm - NO INSTALADO" -ForegroundColor Red
    $errors++
}

if (Get-Command "git" -ErrorAction SilentlyContinue) {
    Write-Host "✅ Git" -ForegroundColor Green
} else {
    Write-Host "❌ Git - NO INSTALADO" -ForegroundColor Red
    $errors++
}

# Resumen
Write-Host "`n📊 Resumen de verificación..." -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

if ($errors -eq 0) {
    Write-Host "🎉 ¡Todas las verificaciones pasaron exitosamente!" -ForegroundColor Green
    Write-Host "✅ El proyecto está listo para CI/CD" -ForegroundColor Green
    Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Hacer commit y push de los cambios"
    Write-Host "2. Verificar que los workflows se ejecuten en GitHub"
    Write-Host "3. Revisar los badges en el README"
} else {
    Write-Host "❌ Se encontraron $errors error(es)" -ForegroundColor Red
    Write-Host "⚠️  Por favor, corrija los errores antes de continuar" -ForegroundColor Yellow
}
