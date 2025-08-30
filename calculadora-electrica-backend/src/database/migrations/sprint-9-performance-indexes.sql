-- Sprint 9: Índices de Performance
-- Ejecutar después de las migraciones existentes

-- Índices para tabla projects
ALTER TABLE projects ADD INDEX idx_projects_name_owner (name, owner);
ALTER TABLE projects ADD INDEX idx_projects_status_created (status, creation_date);
ALTER TABLE projects ADD INDEX idx_projects_metadata_location (metadata->>'$.location');

-- Índices para tabla project_versions
ALTER TABLE project_versions ADD INDEX idx_project_versions_project_version (project_id, version_number);
ALTER TABLE project_versions ADD INDEX idx_project_versions_created (creation_date);

-- Índices para tabla users (si existe)
-- ALTER TABLE users ADD INDEX idx_users_email (email);
-- ALTER TABLE users ADD INDEX idx_users_roles (roles);

-- Índices para futuras tablas de exportaciones
-- CREATE TABLE IF NOT EXISTS exports (
--   id VARCHAR(36) PRIMARY KEY,
--   project_id VARCHAR(36) NOT NULL,
--   type ENUM('PDF', 'EXCEL', 'JSON') NOT NULL,
--   status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
--   scope VARCHAR(255) NOT NULL,
--   filename VARCHAR(255),
--   file_size BIGINT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   completed_at TIMESTAMP NULL,
--   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
-- );

-- ALTER TABLE exports ADD INDEX idx_exports_project_status (project_id, status);
-- ALTER TABLE exports ADD INDEX idx_exports_created (created_at);
-- ALTER TABLE exports ADD INDEX idx_exports_type_status (type, status);

-- Índices para futuras tablas de normativas
-- CREATE TABLE IF NOT EXISTS normatives (
--   id VARCHAR(36) PRIMARY KEY,
--   code VARCHAR(50) NOT NULL UNIQUE,
--   description VARCHAR(255) NOT NULL,
--   source ENUM('RIE', 'NEC', 'REBT') NOT NULL,
--   content TEXT NOT NULL,
--   last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- ALTER TABLE normatives ADD INDEX idx_normatives_source (source);
-- ALTER TABLE normatives ADD INDEX idx_normatives_code (code);
-- ALTER TABLE normatives ADD INDEX idx_normatives_search (code, description);

-- Comentarios sobre optimizaciones adicionales:
-- 1. Considerar particionamiento por fecha para tablas grandes
-- 2. Implementar cache Redis para consultas frecuentes
-- 3. Usar EXPLAIN para analizar consultas lentas
-- 4. Monitorear métricas de latencia con Prometheus
