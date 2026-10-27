# Sistema Web Unificado para la Gestión de Préstamos de Laptops

Sistema web que gestiona el ciclo completo de préstamo de laptops en un entorno universitario: solicitud, reserva con validación de disponibilidad, entrega, devolución, incidencias y reportes, con autenticación por roles y registro de trazabilidad.

> Proyecto de titulación · Ingeniería en Tecnologías de la Información · Universidad Estatal de Milagro (UNEMI)
> **Autor:** JOAN ANDRÉS CHEME PITA · **Tutora:** MSC. MIRELLA AZUCENA CORREA PERALTA / MSC. MARIA GABRIELA ESPINOZA BRAVO

## Contexto

El préstamo de laptops se gestionaba por correo electrónico y una hoja de cálculo compartida, sin validar la disponibilidad de los equipos, sin identificar quién entregaba o recibía cada laptop y sin métricas de uso. Este sistema centraliza el proceso en una sola plataforma.

## Funcionalidades

**Docente**
- Crear reservas indicando aula, fecha, horario y cantidad de laptops.
- Consultar sus reservas y cancelar las pendientes que aún no han iniciado.

**Personal de soporte**
- Ver las reservas por fecha y estado.
- Registrar entregas y devoluciones (indicando el rack) y reportar incidencias.
- Varios usuarios de soporte pueden operar: cada movimiento guarda quién lo ejecutó.

**Administrador**
- Gestionar usuarios (crear y desactivar), aulas, racks y laptops (alta individual o en lote).
- Consultar reportes de uso por docente, aula, franja horaria, rack y usuario de soporte, y exportarlos a CSV y PDF.

**Transversales**
- Autenticación con JWT con expiración y contraseñas cifradas con bcrypt.
- Control de acceso por rol validado en cada ruta del servidor.
- Validación de disponibilidad dentro de una transacción con bloqueo a nivel de fila, para evitar reservas simultáneas que superen el stock.
- Registro de auditoría de las acciones críticas.
- Interfaz responsiva (computador y teléfono).

## Tecnologías

| Capa | Tecnología |
|---|---|
| Servidor | Node.js 20, Express |
| Base de datos | PostgreSQL 15 o superior (driver `pg`) |
| Seguridad | jsonwebtoken (JWT), bcrypt |
| Reportes | json2csv, PDFKit |
| Interfaz | HTML5, CSS3, JavaScript (sin frameworks) |

## Estructura del repositorio

```
sistema-prestamos-laptops/
├── backend/
│   ├── config/          Conexión a PostgreSQL
│   ├── controladores/   Reciben las solicitudes HTTP y devuelven respuestas
│   ├── middlewares/     Autenticación JWT, control de roles y auditoría
│   ├── rutas/           Definición de las rutas de la API
│   ├── servicios/       Lógica de negocio (reservas, entregas, reportes)
│   ├── .env.example     Plantilla de variables de entorno
│   └── index.js         Punto de entrada del servidor
├── frontend/
│   ├── css/             Estilos
│   ├── js/              Scripts de cada pantalla
│   └── *.html           Pantallas: login, docente, soporte y administración
├── database/
│   ├── schema.sql       Creación de las 9 tablas
│   └── datos_demo.sql   Datos de ejemplo (opcional)
└── README.md
```

## Requisitos previos

- [Node.js](https://nodejs.org) 20 LTS o superior
- [PostgreSQL](https://www.postgresql.org/download/) 15 o superior (incluye pgAdmin)
- [Git](https://git-scm.com)
- [Visual Studio Code](https://code.visualstudio.com) con la extensión **Live Server**

## Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/JoanChe/sistema-prestamos-laptops.git
cd sistema-prestamos-laptops
```

### 2. Crear la base de datos
En pgAdmin: clic derecho en *Databases* → *Create* → *Database*, con el nombre `prestamos_laptops`. Luego abre su *Query Tool*, pega el contenido de `database/schema.sql` y ejecútalo (F5).

Con `psql` (si está en tu PATH):
```bash
psql -U postgres -c "CREATE DATABASE prestamos_laptops;"
psql -U postgres -d prestamos_laptops -f database/schema.sql
```

### 3. Configurar y ejecutar el backend
```bash
cd backend
npm install
```
Copia la plantilla de variables de entorno (`copy .env.example .env` en Windows, `cp .env.example .env` en Linux/macOS) y edita `.env` con la contraseña de tu PostgreSQL y una clave secreta propia para `JWT_SECRET`. Después:
```bash
npm run dev
```
Debe mostrar `Servidor corriendo en http://localhost:3000`. Comprueba en `http://localhost:3000/health`: debe responder `{"estado":"ok"}`.

### 4. Abrir el frontend
Abre la carpeta del proyecto en Visual Studio Code, haz clic derecho sobre `frontend/index.html` y elige **Open with Live Server** (se abre en `http://127.0.0.1:5500`). El frontend llama al backend en el mismo equipo, puerto 3000 (se configura en `frontend/js/config.js`).

### 5. Crear el primer administrador
El sistema inicia sin usuarios. Con Postman (o similar), envía:

```
POST http://localhost:3000/api/auth/registro
Content-Type: application/json

{
  "nombre_completo": "Administrador General",
  "correo": "admin@universidad.edu",
  "contrasena": "Admin123",
  "id_rol": 1
}
```
Los roles son: `1` administrador, `2` soporte, `3` docente. Después inicia sesión en la pantalla de acceso y crea el resto de usuarios desde el **panel de administración**.

> El endpoint de registro está abierto para facilitar el desarrollo. Antes de cualquier uso real debe restringirse.

### 6. Datos de demostración (opcional)
Ejecuta `database/datos_demo.sql` para crear un aula, un rack de capacidad 10 y 10 laptops. También puedes crearlos desde el panel de administración.

## Variables de entorno (`backend/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (3000 por defecto) |
| `DB_USER`, `DB_PASSWORD` | Credenciales de PostgreSQL |
| `DB_HOST`, `DB_PORT` | Servidor y puerto de PostgreSQL |
| `DB_NAME` | Nombre de la base de datos (`prestamos_laptops`) |
| `JWT_SECRET` | Clave con la que se firman los tokens |
| `JWT_EXPIRES_IN` | Duración del token (por ejemplo, `2h`) |

## Uso por rol

1. **Docente:** inicia sesión → completa el formulario de reserva → revisa o cancela en *Mis reservas*.
2. **Soporte:** inicia sesión → en el panel, registra la entrega al iniciar la franja, y la devolución al terminar; reporta incidencias si las hay.
3. **Administrador:** gestiona usuarios, aulas, racks y laptops, y consulta o exporta reportes.

## API REST

Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servidor |
| POST | `/api/auth/registro` | Público (solo desarrollo) | Registra un usuario |
| POST | `/api/auth/login` | Público | Inicia sesión y devuelve el token |
| GET | `/api/aulas` | Autenticado | Lista las aulas |
| POST / PUT / DELETE | `/api/aulas`, `/api/aulas/:id` | Administrador | Crea, edita y elimina aulas |
| GET / POST | `/api/usuarios` | Administrador | Lista y crea usuarios |
| PUT | `/api/usuarios/:id` | Administrador | Edita un usuario |
| PATCH | `/api/usuarios/:id/desactivar` | Administrador | Desactiva un usuario |
| GET | `/api/racks` | Administrador, soporte | Lista los racks |
| POST / PUT | `/api/racks`, `/api/racks/:id` | Administrador | Crea y edita racks |
| GET / POST | `/api/laptops` | Administrador | Lista y da de alta laptops |
| POST | `/api/laptops/lote` | Administrador | Alta de laptops en lote |
| DELETE | `/api/laptops/:id` | Administrador | Elimina una laptop |
| POST | `/api/reservas` | Docente | Crea una reserva validando disponibilidad |
| GET | `/api/reservas/mias` | Docente | Reservas del docente |
| PATCH | `/api/reservas/:id/cancelar` | Docente | Cancela una reserva pendiente que no ha iniciado |
| GET | `/api/reservas/dashboard` | Soporte, administrador | Reservas filtradas por `fecha`, `id_aula`, `estado` |
| POST | `/api/entregas` | Soporte | Registra una entrega |
| POST | `/api/devoluciones` | Soporte | Registra una devolución |
| POST | `/api/incidencias` | Soporte | Reporta una incidencia |
| GET | `/api/reportes` | Administrador, soporte | Reporte por `agrupar_por` (docente, aula, franja, rack, soporte), con `fecha_inicio`, `fecha_fin` y `formato` (csv, pdf) |

## Modelo de datos

Nueve tablas: `roles`, `usuarios`, `aulas`, `racks`, `laptops`, `reservas`, `entregas_devoluciones`, `incidencias` y `auditoria`. El script completo está en `database/schema.sql`.

## Seguridad

- Contraseñas almacenadas como hash bcrypt.
- Sesiones con JWT con expiración.
- Permisos por rol verificados en cada ruta del servidor, además de la protección de las pantallas.
- Todo texto que proviene de la base de datos se escapa antes de mostrarse en pantalla.
- Las agrupaciones de los reportes usan una lista cerrada de columnas.

## Alcance y limitaciones

El proyecto cubre el **diseño y desarrollo** del sistema. No incluye despliegue en producción ni validación con usuarios finales.

Mejoras pendientes: bloqueo de cuenta por intentos fallidos, vista semanal del panel de soporte, HTTPS, restringir el endpoint de registro, pruebas automatizadas e integración con el directorio institucional (el campo `auth_provider` ya lo contempla).

## Licencia

Proyecto académico desarrollado como trabajo de titulación. Su uso está sujeto a las normas de la Universidad Estatal de Milagro.