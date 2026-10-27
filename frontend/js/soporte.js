const filtroFecha = document.getElementById('f-fecha');
const filtroEstado = document.getElementById('f-estado');
const cuerpoTabla = document.querySelector('#tabla-dashboard tbody');
const dialogoMovimiento = document.getElementById('dialogo-movimiento');
const dialogoIncidencia = document.getElementById('dialogo-incidencia');
const selectRack = document.getElementById('mov-rack');

function hoyLocal() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}
filtroFecha.value = hoyLocal(); // por defecto, las reservas de hoy

// --- Racks (para elegir de dónde se entrega / adónde se devuelve) ---
async function cargarRacks() {
  try {
    const respuesta = await apiFetch('/api/racks');
    if (!respuesta.ok) throw new Error('racks');
    const racks = await respuesta.json();
    selectRack.innerHTML = racks.length
      ? racks.map((r) => `<option value="${esc(r.id_rack)}">${esc(r.nombre_rack)}${r.nombre_aula ? ' — ' + esc(r.nombre_aula) : ''}</option>`).join('')
      : '<option value="">No hay racks configurados</option>';
  } catch (error) {
    if (error.message !== '401') mostrarToast('No se pudieron cargar los racks.', 'error');
  }
}

// --- Dashboard (RF-12) ---
function filaReserva(r) {
  const botones = [];
  if (r.estado === 'pendiente') {
    botones.push(`<button type="button" class="btn btn-primario btn-sm" data-accion="entrega" data-id="${r.id_reserva}">Entregar</button>`);
  }
  if (r.estado === 'entregada') {
    botones.push(`<button type="button" class="btn btn-primario btn-sm" data-accion="devolucion" data-id="${r.id_reserva}">Devolver</button>`);
  }
  if (['pendiente', 'entregada'].includes(r.estado)) {
    botones.push(`<button type="button" class="btn btn-secundario btn-sm" data-accion="incidencia" data-id="${r.id_reserva}">Incidencia</button>`);
  }
  return `<tr>
    <td data-label="ID">#${r.id_reserva}</td>
    <td data-label="Docente">${esc(r.docente)}</td>
    <td data-label="Aula">${esc(r.nombre_aula)}</td>
    <td data-label="Fecha">${formatearFecha(r.fecha)}</td>
    <td data-label="Horario">${hhmm(r.hora_inicio)} – ${hhmm(r.hora_fin)}</td>
    <td data-label="Laptops">${r.cantidad_laptops}</td>
    <td data-label="Estado">${insignia(r.estado)}</td>
    <td data-label="Acciones"><div class="acciones">${botones.join('') || '—'}</div></td>
  </tr>`;
}

function actualizarResumen(reservas) {
  const contar = (estado) => reservas.filter((r) => r.estado === estado).length;
  document.getElementById('res-total').textContent = reservas.length;
  document.getElementById('res-pendientes').textContent = contar('pendiente');
  document.getElementById('res-entregadas').textContent = contar('entregada');
  document.getElementById('res-devueltas').textContent = contar('devuelta');
}

async function cargarDashboard() {
  const parametros = new URLSearchParams();
  if (filtroFecha.value) parametros.append('fecha', filtroFecha.value);
  if (filtroEstado.value) parametros.append('estado', filtroEstado.value);

  try {
    const respuesta = await apiFetch(`/api/reservas/dashboard?${parametros}`);
    if (!respuesta.ok) throw new Error('dashboard');
    const reservas = await respuesta.json();
    actualizarResumen(reservas);
    cuerpoTabla.innerHTML = reservas.length
      ? reservas.map(filaReserva).join('')
      : filaVacia(8, 'No hay reservas para los filtros seleccionados.');
  } catch (error) {
    if (error.message !== '401') cuerpoTabla.innerHTML = filaVacia(8, 'No se pudo cargar el panel.');
  }
}

// --- Clic en los botones de cada fila ---
cuerpoTabla.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;
  const { accion, id } = boton.dataset;

  if (accion === 'incidencia') {
    document.getElementById('inc-reserva').value = id;
    document.getElementById('inc-titulo').textContent = `Reportar incidencia — reserva #${id}`;
    dialogoIncidencia.showModal();
    return;
  }

  // entrega o devolución: pedir el rack en un diálogo
  document.getElementById('mov-reserva').value = id;
  document.getElementById('mov-tipo').value = accion;
  document.getElementById('mov-titulo').textContent =
    `${accion === 'entrega' ? 'Registrar entrega' : 'Registrar devolución'} — reserva #${id}`;
  document.getElementById('mov-etiqueta').textContent =
    accion === 'entrega' ? 'Rack de origen' : 'Rack de destino';
  dialogoMovimiento.showModal();
});

document.getElementById('btn-cancelar-mov').addEventListener('click', () => dialogoMovimiento.close());
document.getElementById('btn-cancelar-inc').addEventListener('click', () => dialogoIncidencia.close());

// --- Confirmar entrega / devolución (RF-13, RF-14) ---
document.getElementById('form-movimiento').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!selectRack.value) {
    mostrarToast('Selecciona un rack.', 'error');
    return;
  }
  const tipo = document.getElementById('mov-tipo').value;
  const endpoint = tipo === 'entrega' ? 'entregas' : 'devoluciones';
  const boton = evento.target.querySelector('button[type="submit"]');
  boton.disabled = true;

  try {
    const respuesta = await apiFetch(`/api/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({
        id_reserva: Number(document.getElementById('mov-reserva').value),
        id_rack: Number(selectRack.value)
      })
    });
    if (respuesta.ok) {
      mostrarToast(tipo === 'entrega' ? 'Entrega registrada.' : 'Devolución registrada.', 'exito');
      dialogoMovimiento.close();
      cargarDashboard();
    } else {
      mostrarToast(await errorApi(respuesta, 'No se pudo registrar el movimiento.'), 'error');
    }
  } catch (error) {
    if (error.message !== '401') mostrarToast('No fue posible conectar con el servidor.', 'error');
  }
  boton.disabled = false;
});

// --- Registrar incidencia (RF-15) ---
document.getElementById('form-incidencia').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const boton = evento.target.querySelector('button[type="submit"]');
  boton.disabled = true;

  try {
    const respuesta = await apiFetch('/api/incidencias', {
      method: 'POST',
      body: JSON.stringify({
        id_reserva: Number(document.getElementById('inc-reserva').value),
        id_laptop: null,
        tipo_incidencia: document.getElementById('inc-tipo').value,
        descripcion: document.getElementById('inc-descripcion').value.trim()
      })
    });
    if (respuesta.ok) {
      mostrarToast('Incidencia registrada.', 'exito');
      evento.target.reset();
      dialogoIncidencia.close();
      cargarDashboard();
    } else {
      mostrarToast(await errorApi(respuesta, 'No se pudo registrar la incidencia.'), 'error');
    }
  } catch (error) {
    if (error.message !== '401') mostrarToast('No fue posible conectar con el servidor.', 'error');
  }
  boton.disabled = false;
});

// --- Filtros ---
document.getElementById('form-filtros').addEventListener('submit', (evento) => {
  evento.preventDefault();
  cargarDashboard();
});
document.getElementById('btn-limpiar').addEventListener('click', () => {
  filtroFecha.value = '';
  filtroEstado.value = '';
  cargarDashboard();
});
document.getElementById('btn-actualizar').addEventListener('click', cargarDashboard);

cargarRacks();
cargarDashboard();
setInterval(cargarDashboard, 60000); // refresco automático cada minuto