# Base común de Color Center y pantalla de inicio de sesión

Un solo documento: qué tiene la tabla de usuarios en la base común y qué hace falta para que la app funcione con login y acceso por empresa (país).

---

## 1. Idea general

- **Base común de Color Center:** una sola base de datos donde guardas datos que se repiten en todos los países. Ahí vivirán los **usuarios** (y en el futuro otros datos compartidos si los necesitas).
- **Pantalla de inicio de sesión:** el usuario se identifica (login + contraseña). La app revisa quién es y qué accesos tiene.
- **Acceso por empresa:** según el usuario, la app **solo consulta la base del país** que le corresponde. Ejemplo: un usuario de Gallco solo usa la base de Gallco (`emp-2`), no las de Pintacomex, Belice, etc.

---

## 2. Tabla de usuarios (en la base común)

Esta tabla debe estar **solo en la base común**, no duplicada en cada base por país. En las bases por país (Pintacomex, Gallco, etc.) las tablas que referencian a “quién hizo qué” (incidencias.reportado_por_id, mantenimientos.tecnico_id, etc.) pueden seguir usando un **id de usuario numérico** si mantienes el mismo `id` en la base común; si no, haría falta un mapeo usuario_comun_id → usuario_local (más complejo). Lo más simple: **la base común es la única que tiene la tabla `usuarios`**; las bases por país no tienen tabla usuarios (o la usan solo como caché/espejo opcional). Para “reportado_por”, “tecnico_id”, etc., se puede guardar el `id` del usuario de la base común (asumiendo que ese id es único globalmente) o bien seguir con usuarios por base y solo usar la base común para **login y permisos**. Para evitar cambios grandes en el esquema actual, se recomienda:

- **Base común:** tabla `usuarios` con **login, permisos y relación con empresa(s)**.
- **Bases por país:** pueden seguir teniendo su propia tabla `usuarios` (nombre, email, etc.) para FKs de incidencias/mantenimientos/movimientos, y se sincroniza desde la común por `id` o por email/login; **o** se elimina de cada base y todas las FKs apuntan al `id` de la base común (requiere que todas las bases puedan consultar ese id, ej. mismo servidor o vista federada). Para el MVP lo más simple es: **solo la base común tiene usuarios**; el `id` de ese usuario se usa en todas las bases (mismo MySQL o replicación de esa tabla). Si las bases están en servidores distintos, entonces en cada base por país tendrías una copia mínima de usuarios (id, nombre) sincronizada desde la común.

A continuación, la estructura recomendada de la tabla en la **base común**.

### 2.1 Columnas de la tabla `usuarios` (base común)

| Columna        | Tipo         | Restricción              | Descripción |
|----------------|--------------|--------------------------|-------------|
| id             | INT          | PK, AUTO_INCREMENT       | ID único del usuario (mismo id para uso en todas las bases si compartes referencia). |
| login          | VARCHAR(80)  | NOT NULL, UNIQUE         | Usuario para iniciar sesión (ej. `jperez`, `maria@gallco.com`). |
| password_hash  | VARCHAR(255) | NOT NULL                 | Contraseña hasheada (bcrypt o argon2). Nunca guardar texto plano. |
| nombre         | VARCHAR(255) | NOT NULL                 | Nombre completo para mostrar. |
| email          | VARCHAR(255) | NULL, UNIQUE             | Correo (opcional; puede usarse como login si se desea). |
| telefono       | VARCHAR(50)  | NULL                     | Teléfono (opcional). |
| rol_id         | TINYINT      | NOT NULL, DEFAULT 1      | 1 = Escritura, 2 = Admin, 3 = Lectura. Definido en app. |
| empresa_id     | VARCHAR(50)  | NULL                     | Empresa a la que tiene acceso: `emp-1` … `emp-5`. NULL = Admin/Lectura que pueden ver todas. |
| zona_ids       | VARCHAR(50)  | NULL                     | Zonas dentro de la empresa (ej. Pintacomex): `0` = todas, o `1,2,3` (NumZona de la base comun). |
| activo         | TINYINT(1)   | NOT NULL, DEFAULT 1      | 1 = activo, 0 = desactivado (no puede iniciar sesión). |
| created_at     | DATETIME     | DEFAULT CURRENT_TIMESTAMP| Alta. |
| updated_at     | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Última actualización. |

- **login:** único; es el identificador para el inicio de sesión (usuario o email, según lo que elijas).
- **password_hash:** siempre hash (bcrypt recomendado); nunca comparar ni guardar contraseña en claro.
- **rol_id:** 1 Escritura, 2 Admin, 3 Lectura (igual que en schema-fase2).
- **empresa_id:** restringe a **una** empresa (país). Debe existir en la tabla `empresas` de la base común (ej. `emp-2` = Gallco). NULL = Admin/Lectura que pueden ver todas.
- **zona_ids:** para restringir por zona dentro de una empresa (ej. Pintacomex); `0` = todas las zonas, o lista separada por comas.

Si en el futuro quieres que un usuario vea **varias** empresas (pero no todas), se puede cambiar `empresa_id` por una tabla `usuario_empresas (usuario_id, empresa_id)` y en login devolver la lista de empresas permitidas.

### 2.2 Índices recomendados (optimizados)

La consulta crítica es el **login:** `WHERE login = ? AND activo = 1`. Como `login` es UNIQUE, el motor usa ese índice, obtiene como mucho una fila y aplica `activo = 1` en memoria; no hace falta un índice compuesto `(login, activo)` porque el UNIQUE ya reduce a una sola fila. Para listados de administración conviene indexar por empresa y por activo.

| Índice | Uso | Motivo |
|--------|-----|--------|
| **UNIQUE(login)** | Login: buscar usuario por login. | Obligatorio. Una sola fila por login; el filtro `activo = 1` se aplica sobre esa fila. |
| **INDEX(empresa_id)** | Listar usuarios por empresa; validar FK. | Consultas tipo "usuarios de Gallco" y JOIN con tabla empresas. |
| **INDEX(activo)** | Listar solo activos o solo inactivos. | Filtro `WHERE activo = 1` sin filtrar por empresa. |
| **INDEX(empresa_id, activo)** | Listar "usuarios activos de una empresa". | Consulta típica en admin. El leftmost prefix permite usar este índice también para `WHERE empresa_id = ?` sin activo. |

No duplicar: si priorizas el listado "activos por empresa", con **INDEX(empresa_id, activo)** basta para ese caso y para "todos por empresa"; se mantiene **INDEX(activo)** para "todos los activos" sin filtrar empresa. En tablas pequeñas (decenas de usuarios) la diferencia es mínima; en cientos de usuarios el compuesto ayuda.

```sql
UNIQUE KEY uk_usuarios_login (login),
INDEX idx_usuarios_empresa (empresa_id),
INDEX idx_usuarios_activo (activo),
INDEX idx_usuarios_empresa_activo (empresa_id, activo)
```

### 2.3 Tabla `empresas` en la base común (listado y FK)

En lugar de escribir `emp-1`, `emp-2` a mano o tener el listado hardcodeado en código, la base común debe tener una **tabla `empresas`** que sea la única fuente de verdad: qué empresas existen, cómo se llaman y qué clave de entorno usan. Ventajas:

- La UI muestra "Gallco", "Pintacomex", etc. y guarda el `id` (ej. `emp-2`).
- Alta/edición de usuarios: desplegable desde `SELECT id, nombre FROM empresas WHERE activo = 1`.
- Un solo lugar para dar de alta un nuevo país (fila nueva + variable de entorno); no tocar código.
- `usuarios.empresa_id` como FK a `empresas.id` garantiza que no se asignen empresas inexistentes.

Estructura recomendada:

| Columna     | Tipo         | Restricción              | Descripción |
|-------------|--------------|--------------------------|-------------|
| id          | VARCHAR(50)  | PK                       | Identificador de la app: `emp-1`, `emp-2`, … (usa el mismo que `getPool(empresaId)`). |
| codigo      | VARCHAR(50)  | NOT NULL, UNIQUE         | Código corto: GALLCO, PINTA, BELICE, SALVADOR, HONDURAS. |
| nombre      | VARCHAR(255) | NOT NULL                 | Nombre para mostrar: Gallco, Pintacomex, etc. |
| pais        | VARCHAR(100) | NULL                     | País (opcional). |
| env_key     | VARCHAR(50)  | NOT NULL                 | Clave para construir la variable de entorno: `COLORCENTER_DB_URL_` + env_key (ej. GALLCO → COLORCENTER_DB_URL_GALLCO). |
| activo      | TINYINT(1)   | NOT NULL, DEFAULT 1      | 1 = visible en listados y asignable a usuarios. |
| created_at  | DATETIME     | DEFAULT CURRENT_TIMESTAMP| Alta. |
| updated_at  | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | Última actualización. |

Índices: **UNIQUE(codigo)** para búsqueda por código; **INDEX(activo)** para listar solo activas. La PK en `id` ya indexa por empresa.

Orden de creación: **primero `empresas`, después `usuarios`** con `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` (y opcionalmente ON DELETE SET NULL si borras una empresa). Si prefieres no FK por compatibilidad con usuarios que "ven todas" (empresa_id NULL), igualmente validar en la app que `empresa_id` exista en `empresas` cuando no sea NULL.

### 2.4 Ejemplo de DDL (base común): empresas + usuarios

```sql
-- Primero: tabla empresas (listado y FK desde usuarios)
CREATE TABLE empresas (
  id VARCHAR(50) NOT NULL PRIMARY KEY COMMENT 'emp-1..emp-5; mismo que getPool(empresaId)',
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  pais VARCHAR(100) DEFAULT NULL,
  env_key VARCHAR(50) NOT NULL COMMENT 'COLORCENTER_DB_URL_ + env_key',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_empresas_codigo (codigo),
  INDEX idx_empresas_activo (activo)
);

-- Seed empresas (ajustar nombres/país si aplica)
INSERT INTO empresas (id, codigo, nombre, pais, env_key, activo) VALUES
('emp-1', 'PINTA', 'Pintacomex', 'México', 'PINTACOMEX', 1),
('emp-2', 'GALLCO', 'Gallco', 'México', 'GALLCO', 1),
('emp-3', 'BELICE', 'Belice', 'Belice', 'BELICE', 1),
('emp-4', 'SALVADOR', 'El Salvador', 'El Salvador', 'SALVADOR', 1),
('emp-5', 'HONDURAS', 'Honduras', 'Honduras', 'HONDURAS', 1);

-- Tabla usuarios (después de empresas, para la FK)
CREATE TABLE usuarios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  telefono VARCHAR(50) DEFAULT NULL,
  rol_id TINYINT NOT NULL DEFAULT 1 COMMENT '1=Escritura 2=Admin 3=Lectura',
  empresa_id VARCHAR(50) DEFAULT NULL COMMENT 'FK empresas.id; NULL=todas para Admin/Lectura',
  zona_ids VARCHAR(50) DEFAULT NULL COMMENT '0=Todas; o 1,2,3 (NumZona comun)',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuarios_login (login),
  UNIQUE KEY uk_usuarios_email (email),
  INDEX idx_usuarios_empresa (empresa_id),
  INDEX idx_usuarios_activo (activo),
  INDEX idx_usuarios_empresa_activo (empresa_id, activo),
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);
```

---

## 3. Qué necesitamos para que funcione

### 3.1 Variable de entorno: base común

- **Nueva variable:** una sola URL para la base donde está la tabla `usuarios`.
- Ejemplo: `COLORCENTER_COMUN_DB_URL` o `AUTH_DB_URL`.
- Formato igual que el resto: `mysql://user:password@host:port/database`.

Con eso la app tendrá:
- **Una conexión/pool** a la base común (solo para login y lectura de usuario).
- **Las conexiones actuales** a cada base por empresa (`COLORCENTER_DB_URL_PINTACOMEX`, `COLORCENTER_DB_URL_GALLCO`, etc.) para equipos, incidencias, mantenimientos, sucursales, etc.

### 3.2 API de login

- **Ruta:** por ejemplo `POST /api/auth/login`.
- **Body:** `{ "login": "jperez", "password": "***" }` (o `email` si usas email como login).
- **Lógica:**
  1. Conectar a la **base común** con `COLORCENTER_COMUN_DB_URL`.
  2. Buscar usuario por `login` (y `activo = 1`).
  3. Comparar contraseña con `password_hash` (bcrypt.compare).
  4. Si es correcto: devolver datos del usuario necesarios para la sesión: `id`, `nombre`, `rol_id`, `empresa_id`, `zona_ids` (y si aplica lista de empresas permitidas). **No devolver** `password_hash`.
  5. Crear sesión o token (JWT o cookie de sesión) y asociarla al usuario.
- **Respuesta:** por ejemplo `{ "user": { "id", "nombre", "rol_id", "empresa_id", "zona_ids" }, "token" }` o solo sesión en cookie.

### 3.3 Sesión después del login

- Guardar en sesión (o en el payload del JWT):
  - `user.id`
  - `user.empresa_id` (la empresa a la que tiene acceso; si es NULL, puede elegir empresa o ver todas).
  - `user.rol_id`
  - `user.zona_ids` (para filtrar sucursales por zona en esa empresa).
- En cada petición a la API (equipos, incidencias, mantenimientos, reportes, etc.):
  - Si el usuario tiene **una sola** empresa (`empresa_id` no NULL), usar **siempre** esa empresa para `getPool(empresa_id)` y no aceptar otro `empresa_id` del cliente (o ignorarlo).
  - Si el usuario es Admin/Lectura con `empresa_id` NULL, se puede permitir que el cliente envíe `empresa_id` para elegir contexto, validando contra una lista blanca de empresas permitidas.

Así, un usuario de Gallco solo “toca” la base de Gallco; la app no consulta las demás.

### 3.4 Listado de empresas desde la base común

- **Ruta:** por ejemplo `GET /api/empresas` (o incluir en la respuesta del login).
- **Consulta:** `SELECT id, codigo, nombre FROM empresas WHERE activo = 1 ORDER BY nombre` contra la base común.
- **Uso:** desplegables en alta/edición de usuarios, selector de empresa para Admin/Lectura, y validación de `empresa_id` en sesión. La app sigue usando `emp-1`, `emp-2` en `getPool()`; el listado sirve para mostrar nombres y validar que el id exista.

### 3.5 Pantalla de inicio de sesión

- **Ruta:** por ejemplo `/login` (página pública).
- **Contenido:** formulario con:
  - Campo **login** (usuario o email).
  - Campo **contraseña** (type password).
  - Botón “Iniciar sesión”.
- **Al enviar:** llamar a `POST /api/auth/login`. Si la respuesta es correcta, guardar sesión/token y redirigir a la pantalla principal (dashboard). Si el usuario tiene una sola empresa, se puede redirigir directamente a la vista de esa empresa (ej. `/?e=emp-2` para Gallco).
- **Protección:** las rutas internas (dashboard, equipos, mantenimientos, etc.) deben comprobar que hay sesión; si no, redirigir a `/login`.

### 3.7 Uso de la empresa en la API (seguridad)

- **Hoy:** muchas rutas reciben `empresa_id` en body o en query (ej. `?empresa_id=emp-2`). Para que el acceso sea seguro:
  - En cada API que use `getPool(empresaId)`:
    - Obtener `empresa_id` (y rol) desde la **sesión** (o JWT).
    - Si el usuario tiene `empresa_id` fijo (ej. Gallco), usar **siempre** ese valor y no el que envíe el cliente (o validar que coincida).
    - Si el usuario puede ver varias empresas, validar que el `empresa_id` solicitado esté en su lista permitida antes de llamar a `getPool(empresaId)`.
- Así se garantiza que “el de Gallco solo revisa la tabla de Gallco”.

### 3.8 Resumen de pasos técnicos

| Paso | Qué hacer |
|------|-----------|
| 1 | Crear la base común: tabla `empresas` (con seed), tabla `usuarios` con FK a empresas e índices descritos. |
| 2 | Añadir `COLORCENTER_COMUN_DB_URL` (o `AUTH_DB_URL`) en `.env` y en `.env.example`. |
| 3 | En el backend (Node): un módulo que obtenga un pool solo para la base común (ej. en `lib/db.ts` o `lib/auth-db.ts`). |
| 4 | Implementar `POST /api/auth/login` (lectura en base común, comparación de contraseña, devolver user + token/sesión). |
| 5 | Definir cómo se guarda la sesión (cookie + store en servidor, o JWT en cookie/localStorage). |
| 6 | Crear la página `/login` con el formulario y la redirección según empresa del usuario. |
| 7 | Proteger rutas: middleware o layout que exija sesión y redirija a `/login` si no hay. |
| 8 | En las APIs que usan `getPool(empresaId)`, tomar (o validar) `empresaId` desde la sesión según reglas anteriores. |
| 9 | Cargar listado de empresas desde la base común (GET /api/empresas o al iniciar) para desplegables y validación; opcionalmente sustituir el mapeo fijo en `lib/empresas-config.ts` por datos de la tabla `empresas`. |

---

## 4. Qué más conviene tener en la base común (y qué no)

Además de **usuarios** y **empresas**, estos datos son buenos candidatos a vivir solo en la común; lo que no conviene mover se indica al final.

### 4.1 Candidatos a base común

| Dato | Motivo | Nota |
|------|--------|------|
| **Catálogos estáticos (cat_*)** | Mismos valores en todos los países: tipos de equipo, estados (equipo, sucursal, incidencia, mantenimiento), severidades, tipos de mantenimiento, tipos de propiedad. Hoy están duplicados en cada base y (en parte) se sincronizan desde un maestro. | Si los pasas a la común: la app lee esos catálogos solo de la común (una conexión); las bases por país guardan en equipos/incidencias/mantenimientos solo el `id` (sin FK física a otra base). Requiere no crear o vaciar esas tablas en cada base por país, o mantenerlas como réplica sincronizada desde la común. Ventaja: un solo lugar para actualizar; mismos ids en todas las empresas. |
| **Catálogo de roles (opcional)** | Si en lugar de rol_id 1,2,3 hardcodeados quieres nombres y descripciones editables. | Tabla `cat_roles` (id, nombre, descripcion, activo). `usuarios.rol_id` FK a `cat_roles.id`. |
| **Configuración global de la app** | Parámetros que aplican a todas las empresas: moneda por defecto, feature flags, textos legales, etc. | Tabla `app_config` (clave VARCHAR PK, valor TEXT, updated_at). Sustituye o complementa variables de entorno para valores que quieras cambiar sin redeploy. |
| **Auditoría de sesiones / accesos (opcional)** | Quién entró, cuándo, desde qué IP. | Tabla `login_log` (id, usuario_id, fecha, ip, user_agent). Solo escritura en común; consultas para reportes o seguridad. |

### 4.2 Mejor dejar por empresa (en cada base Color Center)

| Dato | Motivo |
|------|--------|
| **Marcas, modelos, arrendadores** | Pueden variar por país o por empresa; hoy hay un “maestro” y sync al resto. Mantenerlos en cada base permite FKs locales y evita acoplar todas las escrituras a la común. |
| **Equipos, incidencias, mantenimientos, movimientos, fotos** | Son datos operativos de cada país; el usuario de Gallco solo debe ver los de Gallco. Deben seguir en la base de cada empresa. |
| **Sucursales** | Se leen desde las bases **comun** por empresa (una por país), no desde la base común única. No mover sucursales a la base común de Color Center. |

### 4.3 Resumen

- **En común:** usuarios, empresas, (opcional) cat_* estáticos, cat_roles, app_config, login_log.
- **Por empresa:** equipos, incidencias, mantenimientos, movimientos, fotos, marcas/modelos/arrendadores; sucursales en bases comun por empresa.

Así la app “sabe” las empresas desde la tabla `empresas`, el login y los permisos desde `usuarios`, y opcionalmente catálogos y config global desde la común; el resto sigue consultándose solo en la base del país que corresponda al usuario.

---

## 5. Resumen en una frase

**En base común:** tablas `empresas` y `usuarios` (con índices y FK descritos), opcionalmente catálogos estáticos, roles, config y log de accesos. **Para que funcione:** una URL de base común, API de login contra esa base, sesión con empresa_id/rol, pantalla de login, protección de rutas y uso de la sesión en todas las APIs que eligen la base por empresa (un usuario de Gallco solo consulta la base colorcentergallco).
