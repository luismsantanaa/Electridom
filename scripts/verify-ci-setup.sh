#!/bin/bash

# Script de verificación de configuración CI/CD para Calculadora Eléctrica RD
# Este script verifica que todos los componentes necesarios estén en su lugar

set -e

echo "🔍 Verificando configuración CI/CD para Calculadora Eléctrica RD..."
echo "================================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - NO ENCONTRADO${NC}"
        return 1
    fi
}

# Función para verificar directorios
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - NO ENCONTRADO${NC}"
        return 1
    fi
}

# Función para verificar comandos
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 - NO INSTALADO${NC}"
        return 1
    fi
}

echo ""
echo "📁 Verificando estructura del monorepo..."
echo "----------------------------------------"

errors=0

# Verificar estructura básica
check_dir "calculadora-electrica-backend" || ((errors++))
check_dir "calculadora-electrica-frontend" || ((errors++))
check_dir "docs" || ((errors++))
check_dir ".github" || ((errors++))
check_dir ".github/workflows" || ((errors++))

echo ""
echo "🔧 Verificando archivos de configuración CI/CD..."
echo "------------------------------------------------"

# Verificar archivos de CI/CD
check_file ".github/workflows/ci.yml" || ((errors++))
check_file ".github/workflows/status.yml" || ((errors++))
check_file ".github/workflows/dependabot.yml" || ((errors++))
check_file ".github/dependabot.yml" || ((errors++))
check_file ".gitignore" || ((errors++))
check_file "README.md" || ((errors++))

echo ""
echo "📦 Verificando archivos de configuración del proyecto..."
echo "------------------------------------------------------"

# Verificar archivos de configuración del backend
check_file "calculadora-electrica-backend/package.json" || ((errors++))
check_file "calculadora-electrica-backend/env.example" || ((errors++))
check_file "calculadora-electrica-backend/jest.config.js" || ((errors++))

# Verificar archivos de configuración del frontend
check_file "calculadora-electrica-frontend/package.json" || ((errors++))
check_file "calculadora-electrica-frontend/angular.json" || ((errors++))
check_file "calculadora-electrica-frontend/proxy.conf.json" || ((errors++))

echo ""
echo "📚 Verificando documentación..."
echo "-----------------------------"

# Verificar documentación
check_file "ESTADO_PROYECTO.md" || ((errors++))
check_file "docs/CI_CD_PIPELINE.md" || ((errors++))
check_file "docs/CONFIGURATION.md" || ((errors++))
check_file "docs/SECURITY_PASSWORD_POLICY.md" || ((errors++))
check_file "docs/TESTING.md" || ((errors++))

echo ""
echo "🛠️ Verificando herramientas de desarrollo..."
echo "-------------------------------------------"

# Verificar herramientas necesarias
check_command "node" || ((errors++))
check_command "npm" || ((errors++))
check_command "git" || ((errors++))

# Verificar versiones
echo ""
echo "📋 Verificando versiones..."
echo "--------------------------"

NODE_VERSION=$(node --version 2>/dev/null || echo "NO INSTALADO")
NPM_VERSION=$(npm --version 2>/dev/null || echo "NO INSTALADO")
GIT_VERSION=$(git --version 2>/dev/null || echo "NO INSTALADO")

echo -e "${GREEN}Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}npm: $NPM_VERSION${NC}"
echo -e "${GREEN}Git: $GIT_VERSION${NC}"

echo ""
echo "🔍 Verificando scripts de npm..."
echo "-------------------------------"

# Verificar scripts del backend
cd calculadora-electrica-backend
if npm run --silent 2>/dev/null | grep -q "test:unit:coverage"; then
    echo -e "${GREEN}✅ Backend: test:unit:coverage${NC}"
else
    echo -e "${RED}❌ Backend: test:unit:coverage - NO ENCONTRADO${NC}"
    ((errors++))
fi

if npm run --silent 2>/dev/null | grep -q "test:e2e"; then
    echo -e "${GREEN}✅ Backend: test:e2e${NC}"
else
    echo -e "${RED}❌ Backend: test:e2e - NO ENCONTRADO${NC}"
    ((errors++))
fi

if npm run --silent 2>/dev/null | grep -q "lint"; then
    echo -e "${GREEN}✅ Backend: lint${NC}"
else
    echo -e "${RED}❌ Backend: lint - NO ENCONTRADO${NC}"
    ((errors++))
fi

if npm run --silent 2>/dev/null | grep -q "build"; then
    echo -e "${GREEN}✅ Backend: build${NC}"
else
    echo -e "${RED}❌ Backend: build - NO ENCONTRADO${NC}"
    ((errors++))
fi

cd ../calculadora-electrica-frontend

if npm run --silent 2>/dev/null | grep -q "test"; then
    echo -e "${GREEN}✅ Frontend: test${NC}"
else
    echo -e "${RED}❌ Frontend: test - NO ENCONTRADO${NC}"
    ((errors++))
fi

if npm run --silent 2>/dev/null | grep -q "lint"; then
    echo -e "${GREEN}✅ Frontend: lint${NC}"
else
    echo -e "${RED}❌ Frontend: lint - NO ENCONTRADO${NC}"
    ((errors++))
fi

if npm run --silent 2>/dev/null | grep -q "build"; then
    echo -e "${GREEN}✅ Frontend: build${NC}"
else
    echo -e "${RED}❌ Frontend: build - NO ENCONTRADO${NC}"
    ((errors++))
fi

cd ..

echo ""
echo "📊 Resumen de verificación..."
echo "---------------------------"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todas las verificaciones pasaron exitosamente!${NC}"
    echo -e "${GREEN}✅ El proyecto está listo para CI/CD${NC}"
    echo ""
    echo -e "${YELLOW}📝 Próximos pasos:${NC}"
    echo "1. Hacer commit y push de los cambios"
    echo "2. Verificar que los workflows se ejecuten en GitHub"
    echo "3. Revisar los badges en el README"
    echo "4. Configurar Codecov si es necesario"
    exit 0
else
    echo -e "${RED}❌ Se encontraron $errors error(es)${NC}"
    echo -e "${YELLOW}⚠️  Por favor, corrija los errores antes de continuar${NC}"
    exit 1
fi
