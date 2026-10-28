
// sesion.js — protección de página y cierre de sesión (cargar después de ui.js)
(function () {
  const payload = decodificarToken(localStorage.getItem('token_sesion'));

  // Sin token, o token vencido: volver al login
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    cerrarSesion('Inicia sesión para continuar.');
    return;
  }

  // La página declara qué roles pueden verla: <body data-roles="docente">
  const permitidos = (document.body.dataset.roles || '').split(',').filter(Boolean);
  if (permitidos.length && !permitidos.includes(payload.rol)) {
    window.location.href = ROLES_INICIO[payload.rol] || 'index.html';
    return;
  }

  const etiqueta = document.getElementById('rol-usuario');
  if (etiqueta) etiqueta.textContent = ETIQUETAS_ROL[payload.rol] || payload.rol;

  // El administrador puede moverse entre su panel y el de soporte
  const navegacion = document.getElementById('navegacion');
  if (navegacion && payload.rol === 'administrador') {
    const actual = window.location.pathname.split('/').pop();
    const enlaces = [['admin.html', 'Administración'], ['soporte.html', 'Panel de soporte']];
    navegacion.innerHTML = enlaces.map(([ruta, texto]) =>
      `<a href="${ruta}"${actual === ruta ? ' aria-current="page"' : ''}>${texto}</a>`
    ).join('');
  }

  const botonCerrar = document.getElementById('btn-cerrar-sesion');
  if (botonCerrar) botonCerrar.addEventListener('click', () => cerrarSesion());
})();