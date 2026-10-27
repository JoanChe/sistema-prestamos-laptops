const formLogin = document.getElementById('form-login');
const mensajeError = document.getElementById('mensaje-error');
const mensajeInfo = document.getElementById('mensaje-info');
const botonIngresar = document.getElementById('btn-ingresar');
const campoContrasena = document.getElementById('contrasena');

// Si ya hay una sesión vigente, ir directo a la página del rol
(function () {
  const payload = decodificarToken(localStorage.getItem('token_sesion'));
  if (payload && payload.exp * 1000 > Date.now() && ROLES_INICIO[payload.rol]) {
    window.location.href = ROLES_INICIO[payload.rol];
  }
})();

// Aviso dejado por cerrarSesion() (sesión expirada, etc.)
const aviso = sessionStorage.getItem('aviso_login');
if (aviso) {
  mensajeInfo.textContent = aviso;
  sessionStorage.removeItem('aviso_login');
}

document.getElementById('ver-contrasena').addEventListener('change', (evento) => {
  campoContrasena.type = evento.target.checked ? 'text' : 'password';
});

formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensajeError.textContent = '';
  botonIngresar.disabled = true;
  botonIngresar.textContent = 'Ingresando…';

  try {
    const respuesta = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: document.getElementById('correo').value.trim(),
        contrasena: campoContrasena.value
      })
    });

    if (respuesta.ok) {
      const { token } = await respuesta.json();
      const payload = decodificarToken(token);
      localStorage.setItem('token_sesion', token);
      localStorage.setItem('rol_usuario', payload.rol);
      window.location.href = ROLES_INICIO[payload.rol] || 'reservas.html';
      return;
    }

    mensajeError.textContent = respuesta.status === 401
      ? 'Correo o contraseña incorrectos.'
      : 'No fue posible iniciar sesión. Intenta nuevamente.';
  } catch (error) {
    mensajeError.textContent = 'No se pudo conectar con el servidor.';
  }

  botonIngresar.disabled = false;
  botonIngresar.textContent = 'Ingresar';
});

