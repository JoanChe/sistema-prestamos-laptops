// ui.js — utilidades compartidas (se carga después de config.js)

const ROLES_INICIO = {
  administrador: 'admin.html',
  soporte: 'soporte.html',
  docente: 'reservas.html'
};

const ETIQUETAS_ROL = {
  administrador: 'Administrador',
  soporte: 'Personal de soporte',
  docente: 'Docente'
};

// Lee el contenido (payload) de un JWT sin librerías externas
function decodificarToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function cerrarSesion(mensaje) {
  localStorage.removeItem('token_sesion');
  localStorage.removeItem('rol_usuario');
  if (mensaje) sessionStorage.setItem('aviso_login', mensaje);
  window.location.href = 'index.html';
}

// Escapa HTML para mostrar de forma segura datos que vienen de la base de datos
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatearFecha(fechaIso) {
  const [anio, mes, dia] = String(fechaIso).substring(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function hhmm(hora) {
  return String(hora).substring(0, 5);
}

function insignia(estado) {
  const texto = String(estado).replace('_', ' ');
  return `<span class="insignia estado-${esc(estado)}">${esc(texto)}</span>`;
}

function filaVacia(columnas, texto) {
  return `<tr><td colspan="${columnas}" class="vacio">${esc(texto)}</td></tr>`;
}

function mostrarToast(mensaje, tipo = 'info') {
  let contenedor = document.getElementById('toasts');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toasts';
    contenedor.setAttribute('aria-live', 'polite');
    document.body.appendChild(contenedor);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// fetch con token; si el servidor responde 401, la sesión expiró
async function apiFetch(ruta, opciones = {}) {
  const token = localStorage.getItem('token_sesion');
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opciones.headers || {})
    }
  });
  if (respuesta.status === 401) {
    cerrarSesion('Tu sesión expiró. Inicia sesión nuevamente.');
    throw new Error('401');
  }
  return respuesta;
}

async function errorApi(respuesta, mensajePorDefecto) {
  try {
    const cuerpo = await respuesta.json();
    return cuerpo.error || mensajePorDefecto;
  } catch (error) {
    return mensajePorDefecto;
  }
}