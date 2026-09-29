let currentGradoId = null;
let alumnosCache = [];

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = '/admin/login.html';
    throw new Error('No autenticado');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error inesperado');
  }
  return data;
}

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

async function checkSession() {
  const res = await fetch('/api/auth/session');
  const data = await res.json();
  if (!data.isAdmin) {
    window.location.href = '/admin/login.html';
  }
}

document.getElementById('btn-logout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/admin/login.html';
});

// ---------- Grados ----------

async function loadGrados() {
  const grados = await api('/api/grados');
  renderGrados(grados);
}

function renderGrados(grados) {
  const ul = document.getElementById('lista-grados');
  ul.innerHTML = '';

  if (grados.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="muted">Aún no hay grados. Crea el primero arriba.</span>';
    ul.appendChild(li);
    return;
  }

  for (const grado of grados) {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.style.cursor = 'pointer';
    left.style.flex = '1';
    left.textContent = `${grado.nombre} (${grado.total_alumnos} alumnos)`;
    if (grado.id === currentGradoId) {
      left.style.fontWeight = '700';
      left.style.color = 'var(--primary)';
    }
    left.addEventListener('click', () => selectGrado(grado.id, grado.nombre));

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    const btnRename = document.createElement('button');
    btnRename.className = 'secondary';
    btnRename.textContent = 'Renombrar';
    btnRename.addEventListener('click', async () => {
      const nuevoNombre = prompt('Nuevo nombre del grado:', grado.nombre);
      if (nuevoNombre && nuevoNombre.trim()) {
        await api(`/api/grados/${grado.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre: nuevoNombre.trim() }),
        });
        loadGrados();
        if (currentGradoId === grado.id) {
          document.getElementById('titulo-grado-alumnos').textContent = `— ${nuevoNombre.trim()}`;
        }
      }
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'danger';
    btnDelete.textContent = 'Eliminar';
    btnDelete.addEventListener('click', async () => {
      if (confirm(`¿Eliminar el grado "${grado.nombre}" y todos sus alumnos/restricciones?`)) {
        await api(`/api/grados/${grado.id}`, { method: 'DELETE' });
        if (currentGradoId === grado.id) {
          currentGradoId = null;
          document.getElementById('panel-alumnos').style.display = 'none';
          document.getElementById('panel-restricciones').style.display = 'none';
        }
        loadGrados();
      }
    });

    actions.appendChild(btnRename);
    actions.appendChild(btnDelete);
    li.appendChild(left);
    li.appendChild(actions);
    ul.appendChild(li);
  }
}

document.getElementById('form-grado').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('nombre-grado');
  try {
    await api('/api/grados', { method: 'POST', body: JSON.stringify({ nombre: input.value }) });
    input.value = '';
    loadGrados();
  } catch (err) {
    showError('error-grado', err.message);
  }
});

// ---------- Alumnos ----------

async function selectGrado(id, nombre) {
  currentGradoId = id;
  document.getElementById('panel-alumnos').style.display = 'block';
  document.getElementById('panel-restricciones').style.display = 'block';
  document.getElementById('titulo-grado-alumnos').textContent = `— ${nombre}`;
  await loadGrados();
  await loadAlumnos();
  await loadRestricciones();
}

async function loadAlumnos() {
  if (!currentGradoId) return;
  alumnosCache = await api(`/api/grados/${currentGradoId}/alumnos`);
  renderAlumnos();
  renderCheckboxAlumnos();
}

function renderAlumnos() {
  const ul = document.getElementById('lista-alumnos');
  ul.innerHTML = '';

  if (alumnosCache.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="muted">Aún no hay alumnos en este grado.</span>';
    ul.appendChild(li);
    return;
  }

  for (const alumno of alumnosCache) {
    const li = document.createElement('li');

    const nameEl = document.createElement('span');
    nameEl.textContent = alumno.nombre;

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    const btnRename = document.createElement('button');
    btnRename.className = 'secondary';
    btnRename.textContent = 'Renombrar';
    btnRename.addEventListener('click', async () => {
      const nuevoNombre = prompt('Nuevo nombre del alumno:', alumno.nombre);
      if (nuevoNombre && nuevoNombre.trim()) {
        await api(`/api/alumnos/${alumno.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre: nuevoNombre.trim() }),
        });
        loadAlumnos();
      }
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'danger';
    btnDelete.textContent = 'Eliminar';
    btnDelete.addEventListener('click', async () => {
      if (confirm(`¿Eliminar a "${alumno.nombre}"?`)) {
        await api(`/api/alumnos/${alumno.id}`, { method: 'DELETE' });
        loadAlumnos();
        loadRestricciones();
      }
    });

    actions.appendChild(btnRename);
    actions.appendChild(btnDelete);
    li.appendChild(nameEl);
    li.appendChild(actions);
    ul.appendChild(li);
  }
}

document.getElementById('form-alumno').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentGradoId) return;
  const input = document.getElementById('nombre-alumno');
  try {
    await api(`/api/grados/${currentGradoId}/alumnos`, {
      method: 'POST',
      body: JSON.stringify({ nombre: input.value }),
    });
    input.value = '';
    loadAlumnos();
  } catch (err) {
    showError('error-alumno', err.message);
  }
});

// ---------- Restricciones ----------

function renderCheckboxAlumnos() {
  const container = document.getElementById('checkbox-alumnos');
  container.innerHTML = '';

  if (alumnosCache.length === 0) {
    container.innerHTML = '<span class="muted">Agrega alumnos primero.</span>';
    return;
  }

  for (const alumno of alumnosCache) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = alumno.id;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(alumno.nombre));
    container.appendChild(label);
  }
}

document.getElementById('btn-crear-restriccion').addEventListener('click', async () => {
  if (!currentGradoId) return;
  const checked = Array.from(document.querySelectorAll('#checkbox-alumnos input[type=checkbox]:checked')).map(
    (cb) => Number(cb.value)
  );

  if (checked.length < 2) {
    showError('error-restriccion', 'Selecciona al menos 2 alumnos');
    return;
  }

  try {
    await api(`/api/grados/${currentGradoId}/restricciones`, {
      method: 'POST',
      body: JSON.stringify({ alumnoIds: checked }),
    });
    document.querySelectorAll('#checkbox-alumnos input[type=checkbox]:checked').forEach((cb) => (cb.checked = false));
    loadRestricciones();
  } catch (err) {
    showError('error-restriccion', err.message);
  }
});

async function loadRestricciones() {
  if (!currentGradoId) return;
  const grupos = await api(`/api/grados/${currentGradoId}/restricciones`);
  renderRestricciones(grupos);
}

function renderRestricciones(grupos) {
  const container = document.getElementById('lista-restricciones');
  const sinRestricciones = document.getElementById('sin-restricciones');
  container.innerHTML = '';

  if (grupos.length === 0) {
    sinRestricciones.style.display = 'block';
    return;
  }
  sinRestricciones.style.display = 'none';

  for (const grupo of grupos) {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';

    const pillList = document.createElement('div');
    pillList.className = 'pill-list';
    pillList.style.marginBottom = '0';
    for (const alumno of grupo.alumnos) {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = alumno.nombre;
      pillList.appendChild(pill);
    }

    const btnDelete = document.createElement('button');
    btnDelete.className = 'danger';
    btnDelete.textContent = 'Quitar';
    btnDelete.addEventListener('click', async () => {
      await api(`/api/restricciones/${grupo.batchId}`, { method: 'DELETE' });
      loadRestricciones();
    });

    row.appendChild(pillList);
    row.appendChild(btnDelete);
    container.appendChild(row);
  }
}

// ---------- Init ----------

(async function init() {
  await checkSession();
  await loadGrados();
})();
