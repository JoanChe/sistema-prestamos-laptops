const formReserva = document.getElementById('form-reserva');
const mensajeError = document.getElementById('mensaje-error');
const botonReservar = document.getElementById('btn-reservar');
const cuerpoMisReservas = document.querySelector('#tabla-mis-reservas tbody');

// No permitir fechas pasadas en el calendario
(function () {
  const h = new Date();
  formReserva.fecha.min = `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
})();

// --- Aulas en el <select> ---
async function cargarAulas() {
  const selectAula = document.getElementById('aula');
  try {
    const respuesta = await apiFetch('/api/aulas');
    if (!respuesta.ok) throw new Error('aulas');
    const aulas = await respuesta.json();

    selectAula.innerHTML = aulas.length
      ? '<option value="">Seleccione un aula</option>' +
        aulas.map((a) => `<option value="${esc(a.id_aula)}">${esc(a.nombre_aula)}${a.ubicacion ? ` (${esc(a.ubicacion)})` : ''}</option>`).join('')
      : '<option value="">No hay aulas registradas</option>';
  } catch (error) {
    if (error.message !== '401') selectAula.innerHTML = '<option value="">No se pudieron cargar las aulas</option>';
  }
}

// --- Mis reservas (RF-07) con botón Cancelar (RF-08) ---
function filaReserva(r) {
  const accion = r.estado === 'pendiente'
    ? `<button type="button" class="btn btn-peligro btn-sm" data-cancelar="${r.id_reserva}">Cancelar</button>`
    : '—';
  return `<tr>
    <td data-label="ID">#${r.id_reserva}</td>
    <td data-label="Aula">${esc(r.nombre_aula)}</td>
    <td data-label="Fecha">${formatearFecha(r.fecha)}</td>
    <td data-label="Horario">${hhmm(r.hora_inicio)} – ${hhmm(r.hora_fin)}</td>
    <td data-label="Laptops">${r.cantidad_laptops}</td>
    <td data-label="Estado">${insignia(r.estado)}</td>
    <td data-label="Acción">${accion}</td>
  </tr>`;
}

async function cargarMisReservas() {
  cuerpoMisReservas.innerHTML = filaVacia(7, 'Cargando…');
  try {
    const respuesta = await apiFetch('/api/reservas/mias');
    if (!respuesta.ok) throw new Error('reservas');
    const reservas = await respuesta.json();
    cuerpoMisReservas.innerHTML = reservas.length
      ? reservas.map(filaReserva).join('')
      : filaVacia(7, 'Aún no tienes reservas.');
  } catch (error) {
    if (error.message !== '401') cuerpoMisReservas.innerHTML = filaVacia(7, 'No se pudieron cargar tus reservas.');
  }
}

cuerpoMisReservas.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('button[data-cancelar]');
  if (!boton) return;

  const id = boton.dataset.cancelar;
  if (!confirm(`¿Seguro que deseas cancelar la reserva #${id}?`)) return;

  boton.disabled = true;
  try {
    const respuesta = await apiFetch(`/api/reservas/${id}/cancelar`, { method: 'PATCH' });
    if (respuesta.ok) {
      mostrarToast('Reserva cancelada.', 'exito');
      cargarMisReservas();
    } else {
      mostrarToast(await errorApi(respuesta, 'No se pudo cancelar la reserva.'), 'error');
      boton.disabled = false;
    }
  } catch (error) {
    if (error.message !== '401') mostrarToast('No fue posible conectar con el servidor.', 'error');
    boton.disabled = false;
  }
});

// --- Envío del formulario (RF-06, RF-09) ---
formReserva.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensajeError.textContent = '';

  const horaInicio = formReserva.hora_inicio.value;
  const horaFin = formReserva.hora_fin.value;
  if (horaFin <= horaInicio) {
    mensajeError.textContent = 'La hora de fin debe ser posterior a la hora de inicio.';
    return;
  }

  botonReservar.disabled = true;
  botonReservar.textContent = 'Reservando…';

  try {
    const respuesta = await apiFetch('/api/reservas', {
      method: 'POST',
      body: JSON.stringify({
        id_aula: formReserva.id_aula.value,
        fecha: formReserva.fecha.value,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        cantidad_laptops: Number(formReserva.cantidad_laptops.value)
      })
    });

    if (respuesta.status === 201) {
      const reserva = await respuesta.json();
      mostrarToast(`Reserva #${reserva.id_reserva} confirmada.`, 'exito');
      formReserva.reset();
      cargarMisReservas();
    } else if (respuesta.status === 409) {
      mensajeError.textContent = 'No hay laptops disponibles en esa franja horaria.';
    } else if (respuesta.status === 422) {
      mensajeError.textContent = await errorApi(respuesta, 'El aula no tiene racks configurados.');
    } else {
      mensajeError.textContent = 'Ocurrió un error al procesar la reserva.';
    }
  } catch (error) {
    if (error.message !== '401') mensajeError.textContent = 'No fue posible conectar con el servidor.';
  }

  botonReservar.disabled = false;
  botonReservar.textContent = 'Reservar';
});

document.addEventListener('DOMContentLoaded', () => {
  cargarAulas();
  cargarMisReservas();
});
