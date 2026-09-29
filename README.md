# Armador de grupos

App para crear grados y alumnos, configurar restricciones ("estos alumnos no deben quedar juntos") y sortear grupos aleatorios respetando esas restricciones.

## Interfaces

- **Panel de administración** (`/admin/`, requiere login): crear/editar/eliminar grados, alumnos, y restricciones de "no juntos".
- **Sorteador de grupos** (`/sorteo/`, público, sin login): elegir un grado, indicar cuántos alumnos por grupo, y generar los grupos al azar respetando las restricciones. Pensado para proyectar en clase.

## Cómo funciona el sorteo

Tú eliges el **tamaño de grupo** (alumnos por grupo), no la cantidad de grupos: si hay 15 alumnos y pones grupos de 3, se generan 5 grupos automáticamente. Si el total no es divisible exacto, algunos grupos quedan con un alumno más para repartir el resto de forma pareja.

Las restricciones se configuran seleccionando 2 o más alumnos que **no deben cruzarse entre sí** en ningún grupo. El sorteo usa backtracking con reintentos aleatorios para encontrar una combinación válida; si las restricciones son imposibles de cumplir con el tamaño de grupo elegido (por ejemplo, demasiados alumnos mutuamente incompatibles para caber en grupos separados), se muestra un error pidiendo ajustar el tamaño de grupo o las restricciones.

## Requisitos

- Node.js 18+
- MySQL o MariaDB (ambos funcionan, el driver `mysql2` es compatible con los dos)

## Configuración local

1. Instala dependencias:
   ```
   npm install
   ```
2. Crea la base de datos y aplica el esquema:
   ```
   mysql -u root -p -e "CREATE DATABASE random_picker CHARACTER SET utf8mb4;"
   mysql -u root -p random_picker < schema.sql
   ```
3. Copia `.env.example` a `.env` y completa los datos de conexión:
   ```
   cp .env.example .env
   ```
4. Genera el hash del password de administrador y pégalo en `ADMIN_PASSWORD_HASH` dentro de `.env`:
   ```
   npm run hash-password -- "tu_password_elegido"
   ```
   Define también `ADMIN_USER` en `.env` (usuario de acceso al panel).
5. Levanta el servidor:
   ```
   npm start
   ```
   o en modo desarrollo (reinicia solo al guardar cambios):
   ```
   npm run dev
   ```
6. Abre `http://localhost:3000` — desde ahí hay enlaces al panel de administración y al sorteador.

## Despliegue en tu VPS

1. Sube el proyecto al servidor (`git clone`, `scp`, o similar) e instala dependencias con `npm install --omit=dev` (no hay devDependencies, pero por si acaso).
2. Crea la base de datos y el usuario en tu MySQL del VPS, y aplica `schema.sql` igual que en local.
3. Crea un `.env` en el servidor con los datos de conexión de ese MySQL, un `SESSION_SECRET` distinto y largo, y el `ADMIN_PASSWORD_HASH` generado con `npm run hash-password`.
4. Corre la app con un gestor de procesos (por ejemplo `pm2 start server/index.js --name random-picker`) y ponla detrás de tu proxy (nginx/caddy) apuntando al `PORT` configurado.
5. Sirve el sitio por HTTPS — las cookies de sesión son `httpOnly`, pero para producción conviene forzar HTTPS en tu proxy.

## Notas de seguridad y alcance

- Es un admin único (usuario/password en `.env`), pensado para una sola persona administrando. No hay gestión de múltiples cuentas.
- Las rutas de **lectura** (`GET /api/grados`, `GET /api/grados/:id/alumnos`, `POST /api/grados/:id/sorteo`) son públicas a propósito, porque el sorteador no requiere login. Si necesitas que nadie externo vea nombres de alumnos, restringe el acceso a nivel de red (VPN, IP allowlist) en tu proxy.
- Las rutas de **escritura** (crear/editar/eliminar grados, alumnos, restricciones) están protegidas por sesión de admin.
