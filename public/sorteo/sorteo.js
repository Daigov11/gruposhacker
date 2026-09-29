let grados = [];

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

async function sortear() {
  const gradoId = document.getElementById('select-grado').value;
  const tamanoGrupo = Number(document.getElementById('tamano-grupo').value);

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
    renderResultado(data);
  } catch (err) {
    showError('Error de conexión con el servidor');
  }
}

function renderResultado(data) {
  document.getElementById('resumen-resultado').textContent = `${data.numGrupos} grupos, ${data.totalAlumnos} alumnos`;
  const container = document.getElementById('grupos-container');
  container.innerHTML = '';

  data.grupos.forEach((grupo, index) => {
    const div = document.createElement('div');
    div.className = 'group-card';

    const title = document.createElement('h3');
    title.textContent = `Grupo ${index + 1} (${grupo.length})`;
    div.appendChild(title);

    const ol = document.createElement('ol');
    for (const alumno of grupo) {
      const li = document.createElement('li');
      li.textContent = alumno.nombre;
      ol.appendChild(li);
    }
    div.appendChild(ol);
    container.appendChild(div);
  });

  document.getElementById('resultado-wrap').style.display = 'block';
}

document.getElementById('btn-sortear').addEventListener('click', sortear);
document.getElementById('btn-resortear').addEventListener('click', sortear);

cargarGrados();
