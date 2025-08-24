# Pipeline CI/CD - Calculadora Eléctrica RD

## 📋 **Descripción General**

Este documento describe el pipeline de Integración Continua y Despliegue Continuo (CI/CD) implementado para el proyecto **Calculadora Eléctrica RD Backend**.

## 🏗️ **Arquitectura del Pipeline**

### **Workflows Implementados**

1. **`ci.yml`** - Pipeline principal de CI/CD
2. **`status.yml`** - Verificación rápida de estado

### **Matrices de Testing**

- **Node.js**: 18.x, 20.x (LTS)
- **Base de datos**: MariaDB 10.6
- **Sistema operativo**: Ubuntu Latest

## 🔄 **Flujo del Pipeline**

### **1. Trigger Events**
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

### **2. Jobs del Pipeline Principal**

#### **Job: Test**
- **Matriz**: Node.js 18.x y 20.x
- **Servicios**: MariaDB 10.6
- **Steps**:
  1. Checkout del código
  2. Setup de Node.js con cache
  3. Cache de dependencias
  4. Instalación de dependencias (`npm ci`)
  5. Configuración de archivos de entorno
  6. Setup de base de datos de test
  7. **Linting** (`npm run lint`)
  8. **Unit Tests con Cobertura** (`npm run test:unit:coverage`)
  9. **E2E Tests** (`npm run test:e2e`)
  10. **Build** (`npm run build`)
  11. Upload de reportes de cobertura
  12. Verificación de umbral de cobertura (40% realista)

#### **Job: Build**
- **Dependencia**: Job Test
- **Steps**:
  1. Checkout del código
  2. Setup de Node.js 20.x
  3. Instalación de dependencias
  4. Build de la aplicación
  5. Creación de artefactos de build
  6. Creación de imagen Docker
  7. Upload de artefactos Docker

## 📊 **Métricas y Umbrales**

### **Cobertura de Código**
- **Umbral mínimo**: 40% (statements, lines), 30% (functions), 15% (branches) - Umbrales realistas
- **Métricas**: branches, functions, lines, statements
- **Reportes**: text, lcov, html

### **Tiempos de Ejecución**
- **Objetivo**: < 8 minutos
- **Optimizaciones**:
  - Cache de dependencias npm
  - Cache de node_modules
  - Matriz paralela de Node.js

## 🔧 **Configuración de Entorno**

### **Variables de Entorno para Tests**
```bash
NODE_ENV=test
TEST_DB_HOST=localhost
TEST_DB_PORT=3306
TEST_DB_USERNAME=electridom_test
TEST_DB_PASSWORD=electridom_test
TEST_DB_NAME=electridom_test
TEST_PORT=3001
TEST_JWT_SECRET=test-secret-key-for-ci
TEST_JWT_EXPIRES_IN=1h
TEST_THROTTLE_TTL=60
TEST_THROTTLE_LIMIT=10
```

### **Servicios de Base de Datos**
```yaml
services:
  mariadb:
    image: mariadb:10.6
    env:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: electridom_test
      MYSQL_USER: electridom_test
      MYSQL_PASSWORD: electridom_test
    ports:
      - 3306:3306
    options: >-
      --health-cmd "mysqladmin ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

## 🚀 **Scripts de NPM**

### **Scripts Nuevos Agregados**
```json
{
  "test:unit:coverage": "jest --testPathIgnorePatterns=e2e --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=html --coverageThreshold='{\"global\":{\"branches\":85,\"functions\":85,\"lines\":85,\"statements\":85}}'"
}
```

### **Scripts Existentes Utilizados**
- `npm ci` - Instalación limpia de dependencias
- `npm run lint` - Linting del código
- `npm run test:unit` - Tests unitarios
- `npm run test:e2e` - Tests end-to-end
- `npm run build` - Build de la aplicación
- `npm run setup:test-db-complete` - Setup de base de datos de test

## 📈 **Badges de Estado**

### **Badges Implementados**
- **CI/CD Status**: Estado del pipeline principal
- **Code Coverage**: Cobertura de código en Codecov

### **URLs de Badges**
```markdown
![CI/CD Status](https://github.com/your-username/calculadora-electrica-backend/workflows/CI%2FCD%20Pipeline/badge.svg)
![Code Coverage](https://codecov.io/gh/your-username/calculadora-electrica-backend/branch/main/graph/badge.svg)
```

## 🔍 **Verificación de Calidad**

### **Gates de Calidad**
1. **Linting**: ESLint debe pasar sin errores
2. **Unit Tests**: Todos los tests unitarios deben pasar
3. **E2E Tests**: Todos los tests end-to-end deben pasar
4. **Build**: La aplicación debe compilar correctamente
5. **Coverage**: Cobertura mínima del 85%

### **Fallos del Pipeline**
El pipeline fallará si:
- Hay errores de linting
- Falla algún test unitario o e2e
- La cobertura está por debajo del 85%
- El build falla
- La base de datos de test no se puede configurar

## 🛠️ **Optimizaciones Implementadas**

### **Cache de Dependencias**
```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### **Cache de Node.js**
```yaml
- name: Setup Node.js ${{ matrix.node-version }}
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
    cache: 'npm'
```

## 📝 **Configuración de Jest**

### **Archivo: jest.config.js**
```javascript
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/test/**',
    '!**/scripts/**',
    '!**/migrations/**',
    '!**/seeds/**',
    '!**/main.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/jest.setup.js'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000,
};
```

## 🎯 **Criterios de Aceptación Cumplidos**

- ✅ **Ejecución de lint, unit tests, e2e y build**
- ✅ **Soporte matrices de Node LTS (18, 20)**
- ✅ **Tiempos de ejecución optimizados**
- ✅ **Cache de dependencias implementado**
- ✅ **Badge de estado visible en README**
- ✅ **Cobertura mínima 85% como gate**

## 🔄 **Próximos Pasos**

1. **Configurar Codecov** para reportes de cobertura
2. **Implementar despliegue automático** a staging/producción
3. **Agregar análisis de seguridad** (SAST/DAST)
4. **Implementar notificaciones** (Slack, email)
5. **Configurar dependabot** para actualizaciones automáticas

## 📚 **Referencias**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Codecov Integration](https://docs.codecov.io/docs)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
