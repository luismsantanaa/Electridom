
-- Esquema mínimo Sprint 10 (ajustar si ya existe)
CREATE TABLE IF NOT EXISTS proyectos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS ambientes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id BIGINT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  superficie_m2 DECIMAL(10,2) DEFAULT 0,
  nivel VARCHAR(50) NULL,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
);

CREATE TABLE IF NOT EXISTS cargas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ambiente_id BIGINT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  potencia_w INT NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- IUG/TUG/IUE/TUE
  FOREIGN KEY (ambiente_id) REFERENCES ambientes(id)
);

CREATE TABLE IF NOT EXISTS circuitos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  proyecto_id BIGINT NOT NULL,
  ambiente_id BIGINT NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- IUG/TUG/IUE/TUE
  potencia_va INT NOT NULL,
  corriente_a DECIMAL(10,2) NOT NULL,
  observaciones VARCHAR(255) NULL,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id),
  FOREIGN KEY (ambiente_id) REFERENCES ambientes(id)
);

CREATE TABLE IF NOT EXISTS protecciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  circuito_id BIGINT NOT NULL,
  tipo VARCHAR(30) NOT NULL, -- MCB/MCB-Térmico, etc.
  capacidad_a INT NOT NULL,
  curva VARCHAR(5) NULL,
  FOREIGN KEY (circuito_id) REFERENCES circuitos(id)
);

CREATE TABLE IF NOT EXISTS conductores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  circuito_id BIGINT NOT NULL,
  calibre_awg VARCHAR(10) NOT NULL,
  material VARCHAR(20) NOT NULL DEFAULT 'Cu',
  capacidad_a INT NOT NULL,
  FOREIGN KEY (circuito_id) REFERENCES circuitos(id)
);

CREATE TABLE IF NOT EXISTS normativas_ampacidad (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  calibre_awg VARCHAR(10) NOT NULL,
  material VARCHAR(20) NOT NULL,
  capacidad_a INT NOT NULL
);

CREATE TABLE IF NOT EXISTS normativas_breakers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  capacidad_a INT NOT NULL,
  curva VARCHAR(5) NULL
);
