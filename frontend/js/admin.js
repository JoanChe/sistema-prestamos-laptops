// admin.js — panel de administración (usuarios, aulas, racks, laptops y reportes)
const PANELES = ['usuarios', 'aulas', 'racks', 'laptops', 'reportes'];
const yo = decodificarToken(localStorage.getItem('token_sesion'));

// --- Pestañas ---
function activarPanel(nombre) {
  PANELES.forEach((p) => { document.getElementById(`panel-${p}`).hidden = p !== nombre; });
  document.querySelectorAll('.pestana').forEach((boton) => {
    boton.setAttribute('aria-selected', String(boton.dataset.panel === nombre));
  });
}
document.querySelectorAll('.pestana').forEach((boton) => {
  boton.addEventListener('click', () => activarPanel(boton.dataset.panel));
});

// --- Envío genérico de formularios de alta ---
async function enviarFormulario(formulario, ruta, cuerpo, mensajeExito, recargar) {
  const boton = formulario.querySelector('button[type="submit"]');
  boton.disabled = true;
  try {
    const respuesta = await apiFetch(ruta, { method: 'POST', body: JSON.stringify(cuerpo) });
    if (respuesta.ok) {
      mostrarToast(mensajeExito, 'exito');
      formulario.reset();
      await recargar();
    } else {
      mostrarToast(await errorApi(respuesta, 'No se pudo completar la acción.'), 'error');
    }
  } catch (error) {
    if (error.message !== '401') mostrarToast('No fue posible conectar con el servidor.', 'error');
  }
  boton.disabled = false;
}

// --- Acción de borrado / desactivación con confirmación ---
async function ejecutarAccion(ruta, metodo, pregunta, mensajeExito, recargar) {
  if (!confirm(pregunta)) return;
  try {
    const respuesta = await apiFetch(ruta, { method: metodo });
    if (respuesta.ok) {
      mostrarToast(mensajeExito, 'exito');
      await recargar();
    } else {
      mostrarToast(await errorApi(respuesta, 'No se pudo completar la acción.'), 'error');
    }
  } catch (error) {
    if (error.message !== '401') mostrarToast('No fue posible conectar con el servidor.', 'error');
  }
}

// ================= USUARIOS =================
async function cargarUsuarios() {
  const cuerpo = document.querySelector('#tabla-usuarios tbody');
  try {
    const respuesta = await apiFetch('/api/usuarios');
    if (!respuesta.ok) throw new Error('usuarios');
    const usuarios = await respuesta.json();
    cuerpo.innerHTML = usuarios.length ? usuarios.map((u) => {
      let accion = '—';
      if (u.id_usuario === yo?.id_usuario) accion = '<span class="texto-suave">Tu cuenta</span>';
      else if (u.activo) accion = `<button type="button" class="btn btn-secundario btn-sm" data-desactivar="${u.id_usuario}">Desactivar</button>`;
      return `<tr>
        <td data-label="Nombre">${esc(u.nombre_completo)}</td>
        <td data-label="Correo">${esc(u.correo)}</td>
        <td data-label="Rol">${esc(ETIQUETAS_ROL[u.nombre_rol] || u.nombre_rol)}</td>
        <td data-label="Estado">${insignia(u.activo ? 'activo' : 'inactivo')}</td>
        <td data-label="Acciones">${accion}</td>
      </tr>`;
    }).join('') : filaVacia(5, 'No hay usuarios registrados.');
  } catch (error) {
    if (error.message !== '401') cuerpo.innerHTML = filaVacia(5, 'No se pudieron cargar los usuarios.');
  }
}

document.getElementById('form-usuario').addEventListener('submit', (e) => {
  e.preventDefault();
  enviarFormulario(e.target, '/api/usuarios', {
    nombre_completo: document.getElementById('u-nombre').value.trim(),
    correo: document.getElementById('u-correo').value.trim(),
    contrasena: document.getElementById('u-contrasena').value,
    id_rol: Number(document.getElementById('u-rol').value)
  }, 'Usuario creado.', cargarUsuarios);
});

document.querySelector('#tabla-usuarios tbody').addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-desactivar]');
  if (boton) {
    ejecutarAccion(`/api/usuarios/${boton.dataset.desactivar}/desactivar`, 'PATCH',
      '¿Desactivar este usuario? Ya no podrá iniciar sesión.', 'Usuario desactivado.', cargarUsuarios);
  }
});

// ================= AULAS =================
async function cargarAulas() {
  const cuerpo = document.querySelector('#tabla-aulas tbody');
  const selectAula = document.getElementById('r-aula');
  try {
    const respuesta = await apiFetch('/api/aulas');
    if (!respuesta.ok) throw new Error('aulas');
    const aulas = await respuesta.json();

    cuerpo.innerHTML = aulas.length ? aulas.map((a) => `<tr>
      <td data-label="Nombre">${esc(a.nombre_aula)}</td>
      <td data-label="Ubicación">${esc(a.ubicacion)}</td>
      <td data-label="Acciones"><button type="button" class="btn btn-peligro btn-sm" data-eliminar-aula="${a.id_aula}">Eliminar</button></td>
    </tr>`).join('') : filaVacia(3, 'No hay aulas registradas.');

    selectAula.innerHTML = aulas.length
      ? aulas.map((a) => `<option value="${esc(a.id_aula)}">${esc(a.nombre_aula)}</option>`).join('')
      : '<option value="">Primero crea un aula</option>';
  } catch (error) {
    if (error.message !== '401') cuerpo.innerHTML = filaVacia(3, 'No se pudieron cargar las aulas.');
  }
}

document.getElementById('form-aula').addEventListener('submit', (e) => {
  e.preventDefault();
  enviarFormulario(e.target, '/api/aulas', {
    nombre_aula: document.getElementById('a-nombre').value.trim(),
    ubicacion: document.getElementById('a-ubicacion').value.trim()
  }, 'Aula creada.', cargarAulas);
});

document.querySelector('#tabla-aulas tbody').addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-eliminar-aula]');
  if (boton) {
    ejecutarAccion(`/api/aulas/${boton.dataset.eliminarAula}`, 'DELETE',
      '¿Eliminar esta aula?', 'Aula eliminada.', cargarAulas);
  }
});

// ================= RACKS =================
async function cargarRacks() {
  const cuerpo = document.querySelector('#tabla-racks tbody');
  const selectRack = document.getElementById('l-rack');
  try {
    const respuesta = await apiFetch('/api/racks');
    if (!respuesta.ok) throw new Error('racks');
    const racks = await respuesta.json();

    cuerpo.innerHTML = racks.length ? racks.map((r) => `<tr>
      <td data-label="Nombre">${esc(r.nombre_rack)}</td>
      <td data-label="Ubicación">${esc(r.ubicacion)}</td>
      <td data-label="Capacidad">${esc(r.capacidad_total)}</td>
      <td data-label="Aula">${esc(r.nombre_aula ?? '—')}</td>
    </tr>`).join('') : filaVacia(4, 'No hay racks registrados.');

    selectRack.innerHTML = racks.length
      ? racks.map((r) => `<option value="${esc(r.id_rack)}">${esc(r.nombre_rack)}</option>`).join('')
      : '<option value="">Primero crea un rack</option>';
  } catch (error) {
    if (error.message !== '401') cuerpo.innerHTML = filaVacia(4, 'No se pudieron cargar los racks.');
  }
}

document.getElementById('form-rack').addEventListener('submit', (e) => {
  e.preventDefault();
  enviarFormulario(e.target, '/api/racks', {
    nombre_rack: document.getElementById('r-nombre').value.trim(),
    ubicacion: document.getElementById('r-ubicacion').value.trim(),
    capacidad_total: Number(document.getElementById('r-capacidad').value),
    id_aula_asociada: Number(document.getElementById('r-aula').value)
  }, 'Rack creado.', cargarRacks);
});

// ================= LAPTOPS =================
async function cargarLaptops() {
  const cuerpo = document.querySelector('#tabla-laptops tbody');
  try {
    const respuesta = await apiFetch('/api/laptops');
    if (!respuesta.ok) throw new Error('laptops');
    const laptops = await respuesta.json();
    cuerpo.innerHTML = laptops.length ? laptops.map((l) => `<tr>
      <td data-label="Código">${esc(l.codigo_inventario)}</td>
      <td data-label="Rack">${esc(l.nombre_rack ?? '—')}</td>
      <td data-label="Estado">${insignia(l.estado)}</td>
      <td data-label="Acciones"><button type="button" class="btn btn-peligro btn-sm" data-eliminar-laptop="${l.id_laptop}">Eliminar</button></td>
    </tr>`).join('') : filaVacia(4, 'No hay laptops registradas.');
  } catch (error) {
    if (error.message !== '401') cuerpo.innerHTML = filaVacia(4, 'No se pudieron cargar las laptops.');
  }
}

document.getElementById('form-laptops-lote').addEventListener('submit', (e) => {
  e.preventDefault();
  enviarFormulario(e.target, '/api/laptops/lote', {
    id_rack: Number(document.getElementById('l-rack').value),
    cantidad: Number(document.getElementById('l-cantidad').value),
    prefijo_codigo: document.getElementById('l-prefijo').value.trim()
  }, 'Laptops agregadas.', cargarLaptops);
});

document.querySelector('#tabla-laptops tbody').addEventListener('click', (e) => {
  const boton = e.target.closest('button[data-eliminar-laptop]');
  if (boton) {
    ejecutarAccion(`/api/laptops/${boton.dataset.eliminarLaptop}`, 'DELETE',
      '¿Eliminar esta laptop del inventario?', 'Laptop eliminada.', cargarLaptops);
  }
});

// ================= REPORTES =================
function parametrosReporte() {
  const parametros = new URLSearchParams();
  parametros.append('agrupar_por', document.getElementById('rep-agrupar').value);
  const inicio = document.getElementById('rep-inicio').value;
  const fin = document.getElementById('rep-fin').value;
  if (inicio) parametros.append('fecha_inicio', inicio);
  if (fin) parametros.append('fecha_fin', fin);
  return parametros;
}

async function consultarReporte() {
  const cuerpo = document.querySelector('#tabla-reporte tbody');
  try {
    const respuesta = await apiFetch(`/api/reportes?${parametrosReporte()}`);
    if (!respuesta.ok) throw new Error('reporte');
    const reporte = await respuesta.json();
    document.getElementById('encabezado-reporte').textContent = reporte.etiquetaColumna;
    cuerpo.innerHTML = reporte.filas.length ? reporte.filas.map((f) => `<tr>
      <td data-label="${esc(reporte.etiquetaColumna)}">${esc(f.etiqueta)}</td>
      <td data-label="Reservas">${esc(f.total_reservas)}</td>
      <td data-label="Laptops prestadas">${esc(f.total_laptops_prestadas)}</td>
    </tr>`).join('') : filaVacia(3, 'No hay datos para el período seleccionado.');
  } catch (error) {
    if (error.message !== '401') mostrarToast('No se pudo generar el reporte.', 'error');
  }
}

async function descargarReporte(formato) {
  const parametros = parametrosReporte();
  parametros.append('formato', formato);
  try {
    const respuesta = await apiFetch(`/api/reportes?${parametros}`);
    if (!respuesta.ok) throw new Error('descarga');
    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte.${formato}`;
    enlace.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.message !== '401') mostrarToast('No se pudo descargar el archivo.', 'error');
  }
}

document.getElementById('form-reporte').addEventListener('submit', (e) => {
  e.preventDefault();
  consultarReporte();
});
document.getElementById('btn-exportar-csv').addEventListener('click', () => descargarReporte('csv'));
document.getElementById('btn-exportar-pdf').addEventListener('click', () => descargarReporte('pdf'));

// ================= Carga inicial =================
cargarUsuarios();
cargarAulas();
cargarRacks();
cargarLaptops();