function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function calcularTamanosDeGrupo(totalAlumnos, tamanoGrupo) {
  const numGrupos = Math.max(1, Math.floor(totalAlumnos / tamanoGrupo));
  const base = Math.floor(totalAlumnos / numGrupos);
  const remainder = totalAlumnos % numGrupos;
  const sizes = [];
  for (let i = 0; i < numGrupos; i++) {
    sizes.push(base + (i < remainder ? 1 : 0));
  }
  return sizes;
}

function buildForbiddenMap(restricciones) {
  const map = new Map();
  for (const { alumno_id_1, alumno_id_2 } of restricciones) {
    if (!map.has(alumno_id_1)) map.set(alumno_id_1, new Set());
    if (!map.has(alumno_id_2)) map.set(alumno_id_2, new Set());
    map.get(alumno_id_1).add(alumno_id_2);
    map.get(alumno_id_2).add(alumno_id_1);
  }
  return map;
}

function intentarAsignacion(alumnoIds, groupSizes, forbiddenMap, maxSteps) {
  const order = shuffle(alumnoIds).sort((a, b) => {
    const da = forbiddenMap.get(a)?.size || 0;
    const db = forbiddenMap.get(b)?.size || 0;
    return db - da;
  });

  const groups = groupSizes.map(() => []);
  let steps = 0;

  function backtrack(index) {
    if (index === order.length) return true;
    steps++;
    if (steps > maxSteps) return false;

    const alumnoId = order[index];
    const forbidden = forbiddenMap.get(alumnoId) || new Set();
    const groupIndices = shuffle(groups.map((_, i) => i));

    for (const gi of groupIndices) {
      if (groups[gi].length >= groupSizes[gi]) continue;
      if (groups[gi].some((otherId) => forbidden.has(otherId))) continue;

      groups[gi].push(alumnoId);
      if (backtrack(index + 1)) return true;
      groups[gi].pop();
    }
    return false;
  }

  const ok = backtrack(0);
  return ok ? groups : null;
}

/**
 * Genera grupos aleatorios respetando restricciones de "no juntos".
 * @param {Array<{id:number, nombre:string}>} alumnos
 * @param {Array<{alumno_id_1:number, alumno_id_2:number}>} restricciones
 * @param {number} tamanoGrupo tamaño deseado por grupo
 */
function generarGrupos(alumnos, restricciones, tamanoGrupo) {
  if (alumnos.length === 0) {
    return { ok: true, grupos: [] };
  }

  const alumnoIds = alumnos.map((a) => a.id);
  const alumnoPorId = new Map(alumnos.map((a) => [a.id, a]));
  const groupSizes = calcularTamanosDeGrupo(alumnos.length, tamanoGrupo);
  const forbiddenMap = buildForbiddenMap(restricciones);

  const MAX_ATTEMPTS = 300;
  const MAX_STEPS_PER_ATTEMPT = 20000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = intentarAsignacion(alumnoIds, groupSizes, forbiddenMap, MAX_STEPS_PER_ATTEMPT);
    if (result) {
      const grupos = result.map((grupo) => grupo.map((id) => alumnoPorId.get(id)));
      return { ok: true, grupos };
    }
  }

  return {
    ok: false,
    error:
      'No fue posible generar grupos respetando todas las restricciones configuradas. Prueba con un tamaño de grupo distinto o revisa las restricciones.',
  };
}

module.exports = { generarGrupos, calcularTamanosDeGrupo };
