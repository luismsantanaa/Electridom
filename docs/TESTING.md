# 🧪 GUÍA DE TESTING - CALCULADORA ELÉCTRICA RD

## 📋 **INFORMACIÓN GENERAL**

Este documento describe cómo configurar y ejecutar los tests para el proyecto Calculadora Eléctrica RD.

## 🏗️ **ARQUITECTURA DE TESTING**

### **Base de Datos de Prueba**

- **Estrategia**: Copia de la base de datos de producción
- **Nombre**: `electridom_test` (configurable)
- **Usuario**: Mismo que producción (configurable)
- **Sincronización**: Automática durante tests (`synchronize: true`)

### **Tipos de Tests**

1. **Tests Unitarios**: Pruebas de funciones individuales
2. **Tests E2E**: Pruebas de integración completa
3. **Tests de Performance**: Pruebas de rendimiento

## ⚙️ **CONFIGURACIÓN INICIAL**

### **1. Configurar Variables de Entorno**

```bash
# Copiar archivo de ejemplo
cp env.test.example .env.test

# Editar variables según tu entorno
nano .env.test
```

### **2. Configurar Base de Datos de Prueba**

```bash
# Configurar base de datos de prueba (copia de producción)
npm run setup:test-db
```

### **3. Verificar Configuración**

```bash
# Verificar que la base de datos de prueba existe
mysql -u electridom -p -e "SHOW DATABASES LIKE 'electridom_test';"
```

## 🚀 **COMANDOS DE TESTING**

### **Scripts Principales**

```bash
# Configurar base de datos de prueba
npm run setup:test-db

# Limpiar base de datos de prueba
npm run cleanup:test-db

# Ejecutar todos los tests unitarios
npm run test:unit

# Ejecutar todos los tests e2e
npm run test:e2e

# Ejecutar todos los tests (unitarios + e2e)
npm run test:all

# Ejecutar tests con configuración limpia
npm run test:all:clean
```

### **Scripts Específicos**

```bash
# Tests unitarios en modo watch
npm run test:unit:watch

# Tests e2e en modo watch
npm run test:e2e:watch

# Tests de cálculos específicos
npm run test:calculations

# Tests de proyectos específicos
npm run test:projects

# Tests de performance
npm run test:performance

# Generar reporte de cobertura
npm run test:coverage
```

### **Scripts Combinados**

```bash
# Configurar BD + ejecutar tests e2e
npm run test:e2e:setup

# Configurar BD + ejecutar todos los tests
npm run test:all:clean
```

## 📊 **ESTRUCTURA DE ARCHIVOS DE TESTING**

```
test/
├── e2e/                          # Tests end-to-end
│   ├── app.e2e-spec.ts          # Tests básicos de la aplicación
│   ├── calculations.e2e-spec.ts # Tests de cálculos
│   ├── projects.e2e-spec.ts     # Tests de proyectos
│   ├── fixtures/                # Datos de prueba
│   ├── utils/                   # Utilidades para tests
│   └── test-config.ts           # Configuración de tests
├── unit/                        # Tests unitarios
├── jest-e2e.json               # Configuración Jest para e2e
└── jest.config.js              # Configuración Jest principal
```

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Variables de Entorno de Testing**

```bash
# Base de datos de prueba
TEST_DB_HOST=localhost
TEST_DB_PORT=3306
TEST_DB_USERNAME=electridom
TEST_DB_PASSWORD=electridom
TEST_DB_NAME=electridom_test

# Configuración de la aplicación
TEST_PORT=3001
NODE_ENV=test
LOG_LEVEL=error

# JWT para testing
TEST_JWT_SECRET=test-jwt-secret-key-for-testing-only
TEST_JWT_EXPIRES_IN=1h

# Rate limiting (más permisivo)
TEST_RATE_LIMIT_TTL=60
TEST_RATE_LIMIT_LIMIT=1000
TEST_AUTH_THROTTLE_LIMIT=10
```

### **Configuración de Jest**

```json
{
  "testTimeout": 30000,
  "verbose": true,
  "setupFilesAfterEnv": ["<rootDir>/e2e/jest-e2e.setup.ts"],
  "collectCoverageFrom": [
    "src/**/*.{ts,js}",
    "!src/**/*.dto.ts",
    "!src/**/*.entity.ts"
  ]
}
```

## 🧪 **ESCRIBIENDO TESTS**

### **Tests Unitarios**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### **Tests E2E**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test', password: 'test' })
      .expect(401);
  });
});
```

## 📈 **REPORTES Y COBERTURA**

### **Generar Reporte de Cobertura**

```bash
npm run test:coverage
```

### **Ver Reporte HTML**

```bash
# Abrir en navegador
open coverage/lcov-report/index.html
```

### **Métricas de Cobertura**

- **Líneas**: > 80%
- **Funciones**: > 80%
- **Branches**: > 70%
- **Statements**: > 80%

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Error: Base de datos no existe**

```bash
# Verificar que la base de datos de producción existe
mysql -u electridom -p -e "SHOW DATABASES LIKE 'electridom';"

# Reconfigurar base de datos de prueba
npm run setup:test-db
```

### **Error: Puerto en uso**

```bash
# Cambiar puerto en .env.test
TEST_PORT=3002

# O matar proceso que usa el puerto
lsof -ti:3001 | xargs kill -9
```

### **Error: Timeout en tests**

```bash
# Aumentar timeout en jest-e2e.json
{
  "testTimeout": 60000
}
```

### **Error: Conexión a base de datos**

```bash
# Verificar credenciales
mysql -u electridom -p

# Verificar que MariaDB está corriendo
sudo systemctl status mariadb
```

## 🔄 **FLUJO DE TRABAJO RECOMENDADO**

### **Para Desarrollo Diario**

1. **Configurar entorno** (una sola vez)
   ```bash
   cp env.test.example .env.test
   npm run setup:test-db
   ```

2. **Ejecutar tests antes de commit**
   ```bash
   npm run test:all
   ```

3. **Ejecutar tests específicos durante desarrollo**
   ```bash
   npm run test:unit:watch
   ```

### **Para CI/CD**

1. **Configurar base de datos de prueba**
   ```bash
   npm run setup:test-db
   ```

2. **Ejecutar todos los tests**
   ```bash
   npm run test:all
   ```

3. **Generar reporte de cobertura**
   ```bash
   npm run test:coverage
   ```

4. **Limpiar recursos**
   ```bash
   npm run cleanup:test-db
   ```

## 📚 **RECURSOS ADICIONALES**

- [Documentación de Jest](https://jestjs.io/docs/getting-started)
- [Documentación de Supertest](https://github.com/visionmedia/supertest)
- [Testing en NestJS](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/testing)

## 🤝 **CONTRIBUCIÓN**

Al contribuir al proyecto:

1. **Escribir tests** para nuevas funcionalidades
2. **Mantener cobertura** de código > 80%
3. **Ejecutar tests** antes de hacer pull request
4. **Documentar** casos de prueba complejos
