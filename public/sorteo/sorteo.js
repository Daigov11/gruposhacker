let grados = [];
let ultimoResultado = null;

const ACCENTS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

async function cargarGrados() {
  const res = await fetch('/api/grados');
  grados = await res.json();
  const select = document.getElementById('select-grado');
  select.innerHTML = '';

  if (grados.length === 0) {
    select.innerHTML = '<option value="">No hay grados creados</option>';
    return;
  }

  for (const grado of grados) {
    const option = document.createElement('option');
    option.value = grado.id;
    option.textContent = `${grado.nombre} (${grado.total_alumnos} alumnos)`;
    select.appendChild(option);
  }
  actualizarInfoGrado();
}

function actualizarInfoGrado() {
  const select = document.getElementById('select-grado');
  const grado = grados.find((g) => String(g.id) === select.value);
  const info = document.getElementById('info-grado');
  info.textContent = grado ? `Total de alumnos en este grado: ${grado.total_alumnos}` : '';
}

document.getElementById('select-grado').addEventListener('change', actualizarInfoGrado);

function showError(message) {
  const el = document.getElementById('error-sorteo');
  el.textContent = message;
  el.style.display = 'block';
}

function hideError() {
  document.getElementById('error-sorteo').style.display = 'none';
}

// ---------- Stepper de tamaño de grupo ----------

const inputTamano = document.getElementById('tamano-grupo');

document.getElementById('btn-decrement').addEventListener('click', () => {
  const valor = Math.max(1, (Number(inputTamano.value) || 1) - 1);
  inputTamano.value = valor;
});

document.getElementById('btn-increment').addEventListener('click', () => {
  const valor = (Number(inputTamano.value) || 0) + 1;
  inputTamano.value = valor;
});

// ---------- Sorteo ----------

async function sortear() {
  const gradoId = document.getElementById('select-grado').value;
  const tamanoGrupo = Number(inputTamano.value);

  hideError();
  document.getElementById('resultado-wrap').style.display = 'none';

  if (!gradoId) {
    showError('Selecciona un grado');
    return;
  }
  if (!Number.isInteger(tamanoGrupo) || tamanoGrupo < 1) {
    showError('El tamaño de grupo debe ser un número entero mayor a 0');
    return;
  }

  try {
    const res = await fetch(`/api/grados/${gradoId}/sorteo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tamanoGrupo }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'No se pudo generar el sorteo');
      return;
    }
    ultimoResultado = data;
    renderResultado(data);
  } catch (err) {
    showError('Error de conexión con el servidor');
  }
}

function renderResultado(data) {
  document.getElementById('resumen-resultado').textContent = `${data.numGrupos} grupos · ${data.totalAlumnos} estudiantes`;
  const container = document.getElementById('grupos-container');
  container.innerHTML = '';

  data.grupos.forEach((grupo, index) => {
    const accent = ACCENTS[index % ACCENTS.length];

    const div = document.createElement('div');
    div.className = 'group-card-v2';
    div.style.setProperty('--accent', accent);

    const header = document.createElement('div');
    header.className = 'group-card-header';
    header.innerHTML = `
      <span class="group-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </span>
      <h3></h3>
      <span class="pill pill-accent"></span>
    `;
    header.querySelector('h3').textContent = `Grupo ${index + 1}`;
    header.querySelector('.pill-accent').textContent = `${grupo.length} alumnos`;
    div.appendChild(header);

    const ol = document.createElement('ol');
    ol.className = 'group-members';
    grupo.forEach((alumno, i) => {
      const li = document.createElement('li');
      const badge = document.createElement('span');
      badge.className = 'member-badge';
      badge.textContent = String(i + 1);
      const nombre = document.createElement('span');
      nombre.textContent = alumno.nombre;
      li.appendChild(badge);
      li.appendChild(nombre);
      ol.appendChild(li);
    });
    div.appendChild(ol);

    container.appendChild(div);
  });

  document.getElementById('resultado-wrap').style.display = 'block';
}

// ---------- Copiar / Imprimir ----------

function textoResultado() {
  if (!ultimoResultado) return '';
  return ultimoResultado.grupos
    .map((grupo, index) => {
      const nombres = grupo.map((a) => `  - ${a.nombre}`).join('\n');
      return `Grupo ${index + 1} (${grupo.length}):\n${nombres}`;
    })
    .join('\n\n');
}

document.getElementById('btn-copiar').addEventListener('click', async () => {
  const btn = document.getElementById('btn-copiar');
  try {
    await navigator.clipboard.writeText(textoResultado());
    const original = btn.innerHTML;
    btn.textContent = 'Copiado ✓';
    setTimeout(() => {
      btn.innerHTML = original;
    }, 1500);
  } catch (err) {
    showError('No se pudo copiar al portapapeles');
  }
});

document.getElementById('btn-imprimir').addEventListener('click', () => {
  window.print();
});

document.getElementById('btn-sortear').addEventListener('click', sortear);
document.getElementById('btn-resortear').addEventListener('click', sortear);

cargarGrados();
