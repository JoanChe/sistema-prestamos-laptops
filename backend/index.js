require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ estado: 'ok' }));

app.use(require('./rutas/auth.routes'));
app.use(require('./rutas/reservas.routes'));
app.use(require('./rutas/aulas.routes'));
app.use(require('./rutas/usuarios.routes'));
app.use(require('./rutas/inventario.routes'));
app.use(require('./rutas/entregas.routes'));
app.use(require('./rutas/reportes.routes'));

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => console.log(`Servidor corriendo en http://localhost:${PUERTO}`));

