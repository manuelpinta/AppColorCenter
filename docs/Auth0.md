## Auth0 – login, roles y Organizations

Este documento resume **cómo usa la app Auth0**: configuración básica, variables de entorno, roles y Organizations por empresa (Gallco, Pintacomex, etc.). Sustituye a los docs antiguos `Auth0Setup.md`, `Auth0Code.md`, `Authroles.md`, `Auth0RolesYOrganizaciones.md` y `Auth0OrganizationsPasos.md`.

---

## 1. Qué rol tiene Auth0 en esta app

- **Identidad y sesión**: toda la autenticación está en Auth0 (`@auth0/nextjs-auth0` con sesión en servidor). La app ya **no usa tabla `usuarios` para login** en las bases de MySQL.
- **Roles y permisos**: se gestionan en Auth0 (RBAC). En la app se pueden usar los claims de roles para decidir qué rutas/acciones permitir.
- **Multi‑empresa**: cada **Organization** de Auth0 representa una **empresa** (Pintacomex, Gallco, etc.). La app solo consulta las bases de las empresas a las que el usuario pertenece por Organization.

---

## 2. Configuración base de Auth0

### 2.1. Dashboard – Application (Regular Web)

En Auth0 Dashboard, en tu aplicación de Color Center:

- **Application Type**: `Regular Web Application`.
- **Token Endpoint Auth Method**: `client_secret_post`.

URLs típicas (ajusta dominio/puerto según tu entorno):

- **Allowed Callback URLs**
  - `http://localhost:3000/auth/callback`
- **Allowed Logout URLs**
  - `http://localhost:3000`
- **Allowed Web Origins**
  - `http://localhost:3000`

Mientras uses las rutas que monta el SDK (`/auth/login`, `/auth/logout`, `/auth/callback`), no necesitas tocar código para los redirects; solo asegurarte de que las URLs anteriores están en la app de Auth0.

### 2.2. Variables de entorno básicas

En `.env` (solo servidor, nunca subir a git):

```env
APP_BASE_URL=http://localhost:3000
AUTH0_DOMAIN=tu-tenant.us.auth0.com
AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
AUTH0_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 64 caracteres hex aleatorios para cifrar la cookie de sesión
AUTH0_SECRET=tu_secret_de_64_chars
```

La librería `@auth0/nextjs-auth0` usa estos valores en `lib/auth0.ts` y en el `middleware.ts`.

---

## 3. Roles y varias apps (visión rápida)

- **Roles**: se definen en Auth0 → **User Management → Roles** (ej. `admin`, `editor`, `viewer`).
- **Asignación**: en **Users**, asignas roles a cada usuario. Opcionalmente puedes exponerlos en el ID token o en `app_metadata`.
- **Varias aplicaciones**: el mismo tenant puede servir a varias apps; compartirás usuarios y roles, pero cada app puede tener sus propias callback/logout URLs y Organizations asociadas.

En esta app, los roles viven en Auth0; las tablas de MySQL no gestionan permisos de usuario (solo datos de negocio).

---

## 4. Organizations por empresa

La app ya está preparada para filtrar datos por **Organizations** de Auth0. Cada Organization ≈ una **empresa** (`emp-1`…`emp-5` en código).

### 4.1. Variables de entorno para Organizations

En `.env`:

| Variable | Descripción |
|----------|-------------|
| `AUTH0_ORGANIZATIONS_ENABLED` | `true` para activar el filtro por Organizations. Si no está o es distinto de `"true"`, la app se comporta como antes (todas las empresas configuradas). |
| `AUTH0_DEFAULT_ORGANIZATION_ID` | **Solo si en Auth0 usas "Only organization"**. Organization ID (ej. `org_xxx`) de una org por defecto para el login. Se ve en Auth0 → Organizations → [nombre] → Overview. Sin esto, Auth0 devuelve `parameter organization is required`. |
| `AUTH0_M2M_CLIENT_ID` | Client ID de la aplicación **Machine-to-Machine** que el backend usa para el Management API. Si no la usas, puede usarse el mismo `AUTH0_CLIENT_ID` de la app de login. |
| `AUTH0_M2M_CLIENT_SECRET` | Client Secret de esa M2M (o el de la app de login si usas la misma). |
| `AUTH0_MANAGEMENT_AUDIENCE` | *(Opcional)* Por defecto `https://{AUTH0_DOMAIN}/api/v2/`. Solo definir si tu tenant usa otro audience. |

Ejemplo mínimo:

```env
AUTH0_ORGANIZATIONS_ENABLED=true
AUTH0_M2M_CLIENT_ID=tu_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=tu_m2m_client_secret
# Si en Auth0 pusiste "Only organization", descomenta y pon el Organization ID:
# AUTH0_DEFAULT_ORGANIZATION_ID=org_xxx
```

### 4.2. Crear y configurar Organizations

1. **Crear una Organization por empresa**  
   Auth0 Dashboard → **Organizations** → **Create Organization**.  
   Ejemplos:
   - `Pinta` / `Pintacomex` → `emp-1`
   - `Gallco` → `emp-2`
   - `Belice` → `emp-3`
   - `Salvador` → `emp-4`
   - `Honduras` → `emp-5`

2. **Asignar la app a cada Organization**  
   En cada Organization → pestaña **Applications** o **Connections** (según UI) → activa la aplicación de Color Center.

3. **Organization usage**  
   En la aplicación de Auth0 → **Login Experience**:
   - **Both**: recomendado, no hace falta enviar `organization` en el login.
   - **Only organization**: la app envía un `organization` por defecto en cada login. En este caso define `AUTH0_DEFAULT_ORGANIZATION_ID` en `.env`.

4. **Asignar usuarios a Organizations**  
   En cada Organization → pestaña **Members** → **Add member**:
   - Asigna tu usuario a todas las empresas que deba ver (ej. Pintacomex + Gallco).
   - Asigna otros usuarios solo a su empresa (ej. un usuario solo en Pintacomex).

---

## 5. Management API: qué hace el backend

Para saber a qué empresas puede acceder un usuario, el backend llama al **Auth0 Management API**:

1. Usa `AUTH0_M2M_CLIENT_ID` / `AUTH0_M2M_CLIENT_SECRET` (o la app de login con grant Client Credentials) para pedir un **access token** para el Management API.
2. Llama a `GET /api/v2/users/{user_id}/organizations` (el `user_id` viene de `session.user.sub`).
3. Convierte los nombres de Organization en `EmpresaId` usando `lib/auth0-organizations.ts` (mapa nombre → `emp-1` … `emp-5`).
4. Guarda esa lista de `EmpresaId[]` en un cache por request (`getCachedAllowedEmpresaIds`) y la usa en:
   - `getEmpresaIdsForDataLayer()` (`lib/db.ts`) para todas las consultas “all bases”.
   - `isEmpresaAllowedForRequest(empresaId)` para validar rutas API y Server Actions (nadie puede forzar otra empresa por parámetro).

Si `AUTH0_ORGANIZATIONS_ENABLED` es `false`, la app usa todas las empresas configuradas (`EMPRESA_IDS`) como antes.

---

## 6. Comportamiento en la app

Con Organizations activas:

- **Login único**: el usuario entra por `/login` (no se pasa `organization` desde el frontend).
- Tras el callback, el **layout protegido** (`app/(protected)/layout.tsx`) llama a `getCachedAllowedEmpresaIds()`:
  - Si la lista de empresas del usuario está **vacía** → redirige a `/sin-empresa` con el mensaje “No tienes empresa asignada. Contacta al administrador.”.
  - Si hay una o varias empresas → el resto de la app solo consulta esas bases.
- Los listados “todas las bases” (`getColorCentersAllBases`, `getEquiposAllBases`, etc.) usan `getEmpresaIdsForDataLayer()` para limitarse a esas empresas.
- Las rutas API que reciben `empresaId` validan con `isEmpresaAllowedForRequest(empresaId)` antes de abrir un pool MySQL.

Resultado:

- Usuario en **1 org (Pinta)** → ve solo Pintacomex.
- Usuario en **2 orgs (Pinta + Gallco)** → ve datos combinados de ambas empresas (respetando futuras vistas/selector de empresa que quieras añadir).

---

## 7. Resumen rápido

1. En Auth0 Dashboard:
   - Configura Callback / Logout / Web Origins de la app.
   - Crea Organizations por empresa y asigna tus usuarios.
   - Si usas “Only organization”, copia el Organization ID y ponlo en `AUTH0_DEFAULT_ORGANIZATION_ID`.
2. En `.env`:
   - Asegúrate de tener `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`.
   - Activa `AUTH0_ORGANIZATIONS_ENABLED=true` y configura la M2M (`AUTH0_M2M_CLIENT_ID` / `AUTH0_M2M_CLIENT_SECRET`).
3. La app:
   - Usa `@auth0/nextjs-auth0` para sesión.
   - Llama al Management API para saber tus orgs.
   - Filtra todas las lecturas/escrituras de datos a solo esas empresas.
