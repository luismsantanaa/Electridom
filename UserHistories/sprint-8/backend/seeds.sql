-- Seeds de ejemplo para proyectos (MariaDB)
INSERT INTO projects (id, name, owner, apparent_power_kva, circuits, updated_at)
VALUES
(UUID(), 'Residencial Alba I', 'Propietario A', 12.5, 14, NOW() - INTERVAL 2 DAY),
(UUID(), 'Residencial Alba II', 'Propietario B', 9.8, 10, NOW() - INTERVAL 1 DAY);
-- Generar 20–50 filas adicionales en script o con factory del ORM.
