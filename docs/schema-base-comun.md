# Esquema de la base común de Color Center

Esquema de la **base común** (una sola base de datos compartida por todos los países): login, empresas, usuarios y tablas opcionales. Para el flujo de login y acceso por empresa ver **BASE-COMUN-Y-LOGIN.md**.

- **Variable de entorno:** `COLORCENTER_COMUN_DB_URL` (ej. `mysql://user:pass@host:port/colorcenter_comun`).
- **Motor:** MySQL 8.0+.
- **Script para generar las tablas:** ejecutar **`schema-base-comun.sql`** contra la base común (crea empresas, usuarios y opcionales cat_roles, app_config, login_log).

---

## 1. Tablas obligatorias

### 1.1 `empresas`

Listado de empresas (países); usada para desplegables, validación y FK de `usuarios`. El `id` es el mismo que usa la app en `getPool(empresaId)` (ej. `emp-1`, `emp-2`).

| Columna     | Tipo         | Restricción     | Descripción |
|-------------|--------------|-----------------|-------------|
| id          | VARCHAR(50)  | PK              | Identificador app: emp-1, emp-2, … |
| codigo      | VARCHAR(50)  | NOT NULL, UNIQUE| Código corto: GALLCO, PINTA, … |
| nombre      | VARCHAR(255) | NOT NULL        | Nombre para mostrar. |
| pais        | VARCHAR(100) | NULL            | País (opcional). |
| env_key     | VARCHAR(50)  | NOT NULL        | Clave para `COLORCENTER_DB_URL_` + env_key. |
| activo      | TINYINT(1)   | NOT NULL DEFAULT 1 | 1 = visible y asignable. |
| created_at  | DATETIME     | DEFAULT CURRENT_TIMESTAMP | |
| updated_at  | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | |

**Índices:** UNIQUE(codigo), INDEX(activo).

---

### 1.2 `usuarios`

Usuarios de la app: login, permisos y empresa asignada.

| Columna        | Tipo         | Restricción     | Descripción |
|----------------|--------------|-----------------|-------------|
| id             | INT          | PK, AUTO_INCREMENT | ID único (uso global en FKs si aplica). |
| login          | VARCHAR(80)  | NOT NULL, UNIQUE   | Usuario para iniciar sesión. |
| password_hash  | VARCHAR(255) | NOT NULL           | Hash (bcrypt/argon2). |
| nombre         | VARCHAR(255) | NOT NULL           | Nombre completo. |
| email          | VARCHAR(255) | NULL, UNIQUE       | Correo (opcional). |
| telefono       | VARCHAR(50)  | NULL              | Teléfono (opcional). |
| rol_id         | TINYINT      | NOT NULL DEFAULT 1 | 1=Escritura 2=Admin 3=Lectura. |
| empresa_id     | VARCHAR(50)  | NULL, FK(empresas) | Empresa permitida; NULL = ver todas. |
| zona_ids       | VARCHAR(50)  | NULL              | 0=Todas; o 1,2,3 (NumZona base comun). |
| activo         | TINYINT(1)   | NOT NULL DEFAULT 1 | 1=activo 0=no puede entrar. |
| created_at     | DATETIME     | DEFAULT CURRENT_TIMESTAMP | |
| updated_at     | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | |

**Índices:** UNIQUE(login), UNIQUE(email), INDEX(empresa_id), INDEX(activo), INDEX(empresa_id, activo).  
**FK:** empresa_id REFERENCES empresas(id) ON DELETE SET NULL.

---

## 2. Tablas opcionales

### 2.1 `cat_roles`

Roles editables (opcional). Si no se usa, `usuarios.rol_id` sigue siendo 1,2,3 en app.

| Columna     | Tipo         | Restricción | Descripción |
|-------------|--------------|-------------|-------------|
| id          | TINYINT      | PK          | 1, 2, 3, … |
| nombre      | VARCHAR(50)  | NOT NULL    | Escritura, Admin, Lectura. |
| descripcion | VARCHAR(255) | NULL        | Opcional. |
| activo      | TINYINT(1)   | NOT NULL DEFAULT 1 | |
| created_at  | DATETIME     | DEFAULT CURRENT_TIMESTAMP | |

**Índice:** INDEX(activo). Si se usa: usuarios.rol_id FK a cat_roles.id.

---

### 2.2 `app_config`

Configuración global clave/valor (moneda, feature flags, etc.) sin redeploy.

| Columna     | Tipo         | Restricción | Descripción |
|-------------|--------------|-------------|-------------|
| clave       | VARCHAR(100) | PK         | Ej. BASE_CURRENCY, FEATURE_X. |
| valor       | TEXT         | NULL        | Valor. |
| updated_at  | DATETIME     | ON UPDATE CURRENT_TIMESTAMP | |

---

### 2.3 `login_log`

Auditoría de inicios de sesión (opcional).

| Columna     | Tipo         | Restricción | Descripción |
|-------------|--------------|-------------|-------------|
| id          | BIGINT       | PK, AUTO_INCREMENT | |
| usuario_id  | INT          | NOT NULL, FK(usuarios) | |
| fecha       | DATETIME     | NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| ip          | VARCHAR(45)  | NULL        | IPv4/IPv6. |
| user_agent  | VARCHAR(500) | NULL       | Opcional. |

**Índices:** INDEX(usuario_id), INDEX(fecha).

---

## 3. Script para generar las tablas

Usar el archivo **`schema-base-comun.sql`** en esta misma carpeta: crea en orden empresas (con seed), usuarios y las tablas opcionales (cat_roles, app_config, login_log). Las opcionales usan `CREATE TABLE IF NOT EXISTS` para poder ejecutar el script más de una vez sin error.

Referencia del DDL obligatorio (empresas + usuarios):

```sql
-- =====================================================================
-- Base común Color Center - Tablas obligatorias (MySQL 8.0+)
-- =====================================================================
-- Variable de entorno: COLORCENTER_COMUN_DB_URL
-- =====================================================================

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

INSERT INTO empresas (id, codigo, nombre, pais, env_key, activo) VALUES
('emp-1', 'PINTA', 'Pintacomex', 'México', 'PINTACOMEX', 1),
('emp-2', 'GALLCO', 'Gallco', 'México', 'GALLCO', 1),
('emp-3', 'BELICE', 'Belice', 'Belice', 'BELICE', 1),
('emp-4', 'SALVADOR', 'El Salvador', 'El Salvador', 'SALVADOR', 1),
('emp-5', 'HONDURAS', 'Honduras', 'Honduras', 'HONDURAS', 1);

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

## 4. DDL opcionales (incluidos en schema-base-comun.sql)

El mismo script `schema-base-comun.sql` crea estas tablas al final (sección 3). Referencia:

```sql
-- =====================================================================
-- Base común - Opcionales: cat_roles, app_config, login_log
-- =====================================================================

CREATE TABLE cat_roles (
  id TINYINT NOT NULL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) DEFAULT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO cat_roles (id, nombre, activo) VALUES
(1, 'Escritura', 1),
(2, 'Admin', 1),
(3, 'Lectura', 1);

-- Si usas cat_roles, añadir FK en usuarios (ejecutar después de tener usuarios):
-- ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES cat_roles(id);

CREATE TABLE app_config (
  clave VARCHAR(100) NOT NULL PRIMARY KEY,
  valor TEXT DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE login_log (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  INDEX idx_login_log_usuario (usuario_id),
  INDEX idx_login_log_fecha (fecha),
  CONSTRAINT fk_login_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

---

## 5. Catálogos estáticos (opcional)

Si centralizas en la base común los catálogos que hoy están en cada base por país (cat_tipos_equipo, cat_estados_equipo, cat_estados_sucursal, cat_estados_incidencia, cat_estados_mantenimiento, cat_severidades, cat_tipos_mantenimiento, cat_tipos_propiedad), las bases por país ya no tendrían esas tablas y la app leería solo de la común. Los IDs deben coincidir en todas las empresas. Ver **BASE-COMUN-Y-LOGIN.md** §4. El DDL de esos cat_* es el mismo que en **schema.sql** (SECCIÓN 1: CATÁLOGOS); copiar esas sentencias CREATE + INSERT a esta base común si decides centralizarlos.

---

## Resumen

| Tabla       | Obligatoria | Uso |
|-------------|-------------|-----|
| empresas    | Sí          | Listado de empresas; FK desde usuarios. |
| usuarios    | Sí          | Login, permisos, empresa_id, zona_ids. |
| cat_roles   | No          | Roles editables (opcional). |
| app_config  | No          | Config global clave/valor. |
| login_log   | No          | Auditoría de accesos. |
| cat_*       | No          | Catálogos estáticos centralizados (opcional). |
