# Script de verificación de configuración CI/CD para Calculadora Eléctrica RD
# Este script verifica que todos los componentes necesarios estén en su lugar

Write-Host "🔍 Verificando configuración CI/CD para Calculadora Eléctrica RD..." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Variables para control de errores
$errors = 0

# Función para verificar archivos
function Test-File {
    param([string]$Path)
    if (Test-Path $Path -PathType Leaf) {
        Write-Host "✅ $Path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Path - NO ENCONTRADO" -ForegroundColor Red
        return $false
    }
}

# Función para verificar directorios
function Test-Directory {
    param([string]$Path)
    if (Test-Path $Path -PathType Container) {
        Write-Host "✅ $Path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Path - NO ENCONTRADO" -ForegroundColor Red
        return $false
    }
}

# Función para verificar comandos
function Test-Command {
    param([string]$Command)
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Host "✅ $Command" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Command - NO INSTALADO" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "📁 Verificando estructura del monorepo..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Verificar estructura básica
if (-not (Test-Directory "calculadora-electrica-backend")) { $errors++ }
if (-not (Test-Directory "calculadora-electrica-frontend")) { $errors++ }
if (-not (Test-Directory "docs")) { $errors++ }
if (-not (Test-Directory ".github")) { $errors++ }
if (-not (Test-Directory ".github/workflows")) { $errors++ }

Write-Host ""
Write-Host "🔧 Verificando archivos de configuración CI/CD..." -ForegroundColor Yellow
Write-Host "------------------------------------------------" -ForegroundColor Yellow

# Verificar archivos de CI/CD
if (-not (Test-File ".github/workflows/ci.yml")) { $errors++ }
if (-not (Test-File ".github/workflows/status.yml")) { $errors++ }
if (-not (Test-File ".github/workflows/dependabot.yml")) { $errors++ }
if (-not (Test-File ".github/dependabot.yml")) { $errors++ }
if (-not (Test-File ".gitignore")) { $errors++ }
if (-not (Test-File "README.md")) { $errors++ }

Write-Host ""
Write-Host "📦 Verificando archivos de configuración del proyecto..." -ForegroundColor Yellow
Write-Host "------------------------------------------------------" -ForegroundColor Yellow

# Verificar archivos de configuración del backend
if (-not (Test-File "calculadora-electrica-backend/package.json")) { $errors++ }
if (-not (Test-File "calculadora-electrica-backend/env.example")) { $errors++ }
if (-not (Test-File "calculadora-electrica-backend/jest.config.js")) { $errors++ }

# Verificar archivos de configuración del frontend
if (-not (Test-File "calculadora-electrica-frontend/package.json")) { $errors++ }
if (-not (Test-File "calculadora-electrica-frontend/angular.json")) { $errors++ }
if (-not (Test-File "calculadora-electrica-frontend/proxy.conf.json")) { $errors++ }

Write-Host ""
Write-Host "📚 Verificando documentación..." -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

# Verificar documentación
if (-not (Test-File "ESTADO_PROYECTO.md")) { $errors++ }
if (-not (Test-File "docs/CI_CD_PIPELINE.md")) { $errors++ }
if (-not (Test-File "docs/CONFIGURATION.md")) { $errors++ }
if (-not (Test-File "docs/SECURITY_PASSWORD_POLICY.md")) { $errors++ }
if (-not (Test-File "docs/TESTING.md")) { $errors++ }

Write-Host ""
Write-Host "🛠️ Verificando herramientas de desarrollo..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

# Verificar herramientas necesarias
if (-not (Test-Command "node")) { $errors++ }
if (-not (Test-Command "npm")) { $errors++ }
if (-not (Test-Command "git")) { $errors++ }

# Verificar versiones
Write-Host ""
Write-Host "📋 Verificando versiones..." -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Yellow

try {
    $NODE_VERSION = node --version 2>$null
    Write-Host "Node.js: $NODE_VERSION" -ForegroundColor Green
} catch {
    Write-Host "Node.js: NO INSTALADO" -ForegroundColor Red
}

try {
    $NPM_VERSION = npm --version 2>$null
    Write-Host "npm: $NPM_VERSION" -ForegroundColor Green
} catch {
    Write-Host "npm: NO INSTALADO" -ForegroundColor Red
}

try {
    $GIT_VERSION = git --version 2>$null
    Write-Host "Git: $GIT_VERSION" -ForegroundColor Green
} catch {
    Write-Host "Git: NO INSTALADO" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Verificando scripts de npm..." -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

# Verificar scripts del backend
Push-Location "calculadora-electrica-backend"
try {
    $backendScripts = npm run --silent 2>$null
    if ($backendScripts -match "test:unit:coverage") {
        Write-Host "✅ Backend: test:unit:coverage" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: test:unit:coverage - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
    
    if ($backendScripts -match "test:e2e") {
        Write-Host "✅ Backend: test:e2e" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: test:e2e - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
    
    if ($backendScripts -match "lint") {
        Write-Host "✅ Backend: lint" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: lint - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
    
    if ($backendScripts -match "build") {
        Write-Host "✅ Backend: build" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: build - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "❌ Error verificando scripts del backend" -ForegroundColor Red
    $errors++
}
Pop-Location

# Verificar scripts del frontend
Push-Location "calculadora-electrica-frontend"
try {
    $frontendScripts = npm run --silent 2>$null
    if ($frontendScripts -match "test") {
        Write-Host "✅ Frontend: test" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: test - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
    
    if ($frontendScripts -match "lint") {
        Write-Host "✅ Frontend: lint" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: lint - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
    
    if ($frontendScripts -match "build") {
        Write-Host "✅ Frontend: build" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: build - NO ENCONTRADO" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "❌ Error verificando scripts del frontend" -ForegroundColor Red
    $errors++
}
Pop-Location

Write-Host ""
Write-Host "📊 Resumen de verificación..." -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

if ($errors -eq 0) {
    Write-Host "🎉 ¡Todas las verificaciones pasaron exitosamente!" -ForegroundColor Green
    Write-Host "✅ El proyecto está listo para CI/CD" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Hacer commit y push de los cambios"
    Write-Host "2. Verificar que los workflows se ejecuten en GitHub"
    Write-Host "3. Revisar los badges en el README"
    Write-Host "4. Configurar Codecov si es necesario"
    exit 0
} else {
    Write-Host "❌ Se encontraron $errors error(es)" -ForegroundColor Red
    Write-Host "⚠️  Por favor, corrija los errores antes de continuar" -ForegroundColor Yellow
    exit 1
}
