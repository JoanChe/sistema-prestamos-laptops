
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles (nombre_rol) VALUES ('administrador'), ('soporte'), ('docente');

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    id_rol INTEGER REFERENCES roles(id_rol),
    auth_provider VARCHAR(20) DEFAULT 'local',
    intentos_fallidos INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE aulas (
    id_aula SERIAL PRIMARY KEY,
    nombre_aula VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(100)
);

CREATE TABLE racks (
    id_rack SERIAL PRIMARY KEY,
    nombre_rack VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    capacidad_total INTEGER NOT NULL,
    id_aula_asociada INTEGER REFERENCES aulas(id_aula)
);

CREATE TABLE laptops (
    id_laptop SERIAL PRIMARY KEY,
    codigo_inventario VARCHAR(30) UNIQUE NOT NULL,
    id_rack INTEGER REFERENCES racks(id_rack),
    estado VARCHAR(20) DEFAULT 'disponible'
);

CREATE TABLE reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_docente INTEGER REFERENCES usuarios(id_usuario),
    id_aula INTEGER REFERENCES aulas(id_aula),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    cantidad_laptops INTEGER NOT NULL CHECK (cantidad_laptops > 0),
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE entregas_devoluciones (
    id_movimiento SERIAL PRIMARY KEY,
    id_reserva INTEGER REFERENCES reservas(id_reserva),
    tipo VARCHAR(10) CHECK (tipo IN ('entrega','devolucion')),
    id_usuario_soporte INTEGER REFERENCES usuarios(id_usuario),
    id_rack INTEGER REFERENCES racks(id_rack),
    fecha_hora_real TIMESTAMP DEFAULT NOW()
);

CREATE TABLE incidencias (
    id_incidencia SERIAL PRIMARY KEY,
    id_reserva INTEGER REFERENCES reservas(id_reserva),
    id_laptop INTEGER REFERENCES laptops(id_laptop),
    id_usuario_reporta INTEGER REFERENCES usuarios(id_usuario),
    tipo_incidencia VARCHAR(20) NOT NULL,
    descripcion TEXT,
    fecha_reporte TIMESTAMP DEFAULT NOW()
);

CREATE TABLE auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    accion VARCHAR(50) NOT NULL,
    entidad_afectada VARCHAR(50) NOT NULL,
    id_entidad INTEGER NOT NULL,
    fecha_hora TIMESTAMP DEFAULT NOW()
);