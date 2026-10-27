-- Datos de demostración: 1 aula, 1 rack de capacidad 10 y 10 laptops
INSERT INTO aulas (nombre_aula, ubicacion) VALUES ('Aula 101', 'Bloque A');

INSERT INTO racks (nombre_rack, ubicacion, capacidad_total, id_aula_asociada)
VALUES ('Rack-A1', 'Bloque A', 10, (SELECT id_aula FROM aulas WHERE nombre_aula = 'Aula 101'));

INSERT INTO laptops (codigo_inventario, id_rack, estado)
SELECT 'LAP-' || LPAD(g::text, 3, '0'),
       (SELECT id_rack FROM racks WHERE nombre_rack = 'Rack-A1'),
       'disponible'
FROM generate_series(1, 10) AS g;