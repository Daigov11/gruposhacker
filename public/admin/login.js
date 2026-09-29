(async function init() {
  const res = await fetch('/api/auth/session');
  const data = await res.json();
  if (data.isAdmin) {
    window.location.href = '/admin/';
  }
})();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('error');
  errorEl.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'No se pudo iniciar sesión';
      errorEl.style.display = 'block';
      return;
    }
    window.location.href = '/admin/';
  } catch (err) {
    errorEl.textContent = 'Error de conexión con el servidor';
    errorEl.style.display = 'block';
  }
});
