# 🔧 Solución de Problemas - Base de Datos

## 🚨 Problema: Error de Conexión a MariaDB

### Síntomas

- Error en Adminer: "Host '172.18.0.6' is not allowed to connect to this MariaDB server"
- API no puede conectarse a la base de datos
- Contenedores no pueden comunicarse entre sí

---

## 🛠️ Solución Automática

### Opción 1: Script de Reparación Completo (Recomendado)

```powershell
# Ejecutar script de reparación automática completo
.\scripts\fix-database-connection-v2.ps1
```

### Opción 2: Solución Rápida (Para problemas simples)

```powershell
# Ejecutar solución rápida
.\scripts\quick-fix-db.ps1
```

### Opción 3: Solución Simple (Para problemas básicos)

```powershell
# Ejecutar solución simple
.\scripts\simple-fix-db.ps1
```

### Opción 4: Script Original (Si las anteriores fallan)

```powershell
# Ejecutar script original
.\scripts\fix-database-connection.ps1
```

### Verificar Reparación

```powershell
# Verificar que todo esté funcionando
.\scripts\test-database-connection.ps1
```

---

## 🔍 Solución Manual

### Paso 1: Detener Contenedores

```bash
docker-compose down
```

### Paso 2: Limpiar Volúmenes (Opcional)

```bash
# Solo si hay problemas persistentes
docker volume rm electridom_mariadb_data
docker volume rm electridom_ollama_data
docker volume rm electridom_prometheus_data
```

### Paso 3: Reconstruir Configuración

```bash
# Reconstruir sin caché
docker-compose build --no-cache

# Iniciar solo MariaDB primero
docker-compose up -d mariadb
```

### Paso 4: Verificar MariaDB

```bash
# Esperar a que MariaDB esté listo
sleep 30

# Verificar conexión
docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;"
```

### Paso 5: Configurar Usuario

```bash
# Crear usuario y permisos
docker exec -i electridom-mariadb mariadb -u root -prootpassword << EOF
CREATE DATABASE IF NOT EXISTS electridom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'electridom'@'%' IDENTIFIED BY 'electridom123';
GRANT ALL PRIVILEGES ON electridom.* TO 'electridom'@'%';
FLUSH PRIVILEGES;
EOF
```

### Paso 6: Iniciar Todos los Servicios

```bash
docker-compose up -d
```

---

## 🔧 Configuración de Adminer

### Credenciales Correctas

- **System**: MySQL / MariaDB
- **Server**: `mariadb`
- **Username**: `root`
- **Password**: `rootpassword`
- **Database**: `electridom`

### Credenciales Alternativas

- **System**: MySQL / MariaDB
- **Server**: `mariadb`
- **Username**: `electridom`
- **Password**: `electridom123`
- **Database**: `electridom`

---

## 📊 Verificación de Estado

### Verificar Contenedores

```bash
docker-compose ps
```

### Verificar Logs de MariaDB

```bash
docker logs electridom-mariadb
```

### Verificar Logs del API

```bash
docker logs electridom-api
```

### Verificar Conexión Directa

```bash
# Como root
docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;"

# Como electridom
docker exec electridom-mariadb mariadb -u electridom -pelectridom123 -e "SELECT 1;"
```

---

## 🌐 URLs de Verificación

### Adminer

- **URL**: http://localhost:8080
- **Estado**: Debe mostrar formulario de login

### API Health Check

- **URL**: http://localhost:3000/api/health
- **Estado**: Debe devolver JSON con status "ok"

### API Documentation

- **URL**: http://localhost:3000/api/docs
- **Estado**: Debe mostrar Swagger UI

---

## 🚨 Problemas Comunes

### Error: "Access denied for user"

**Causa**: Credenciales incorrectas o usuario no existe
**Solución**:

```bash
# Verificar usuarios existentes
docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT User, Host FROM mysql.user;"
```

### Error: "Can't connect to MySQL server"

**Causa**: MariaDB no está corriendo
**Solución**:

```bash
# Verificar estado
docker-compose ps mariadb

# Reiniciar si es necesario
docker-compose restart mariadb
```

### Error: "Host not allowed"

**Causa**: Configuración de red Docker
**Solución**:

```bash
# Recrear red Docker
docker-compose down
docker network prune
docker-compose up -d
```

---

## 📋 Checklist de Verificación

- [ ] **MariaDB está corriendo**: `docker-compose ps mariadb`
- [ ] **Conexión root funciona**: `docker exec electridom-mariadb mariadb -u root -prootpassword -e "SELECT 1;"`
- [ ] **Conexión electridom funciona**: `docker exec electridom-mariadb mariadb -u electridom -pelectridom123 -e "SELECT 1;"`
- [ ] **Base de datos existe**: `docker exec electridom-mariadb mariadb -u root -prootpassword -e "SHOW DATABASES;"`
- [ ] **Adminer accesible**: http://localhost:8080
- [ ] **API health check**: http://localhost:3000/api/health
- [ ] **API documentation**: http://localhost:3000/api/docs

---

## 🔄 Reinicio Completo

Si nada funciona, ejecutar reinicio completo:

```bash
# 1. Detener todo
docker-compose down

# 2. Limpiar volúmenes
docker volume rm electridom_mariadb_data electridom_ollama_data electridom_prometheus_data

# 3. Limpiar redes
docker network prune

# 4. Reconstruir
docker-compose build --no-cache

# 5. Iniciar
docker-compose up -d

# 6. Verificar
.\scripts\test-database-connection.ps1
```

---

## 📞 Soporte

Si los problemas persisten:

1. **Revisar logs completos**:

   ```bash
   docker logs electridom-mariadb --tail 100
   docker logs electridom-api --tail 100
   ```

2. **Verificar configuración Docker**:

   ```bash
   docker version
   docker-compose version
   ```

3. **Contactar soporte** con:
   - Logs de error
   - Versión de Docker
   - Sistema operativo
   - Pasos realizados

---

**¡Con estos pasos deberías resolver el problema de conexión a la base de datos!** ✅
