## Auth0 – Roles de Soporte

Este documento define **cómo usamos los roles de Auth0** para controlar permisos en la app.

Roles definidos (nombres EXACTOS):

- `soporte`
- `gerente-regional`
- `soporte-central`

---

### 0. Lo que espera la app (muy importante)

La app lee los roles desde este claim (dentro de la sesión):

- Claim: `https://colorcenter.app/roles`
- Formato esperado: arreglo de strings, por ejemplo: `["soporte","gerente-regional"]`

Con esos roles, la app define:
- `soporte` y `soporte-central` => tienen escritura
- `gerente-regional` => solo lectura
- `soporte-central` => además actúa como admin para datos (escritura/lectura en todas las empresas configuradas)

---

### 1. Definir roles en Auth0

En tu tenant de Auth0:

1. **Crear roles**  
   Auth0 Dashboard → **User Management → Roles**:

   - `soporte`
   - `gerente-regional`
   - `soporte-central`

2. **Asignar roles a usuarios**  
   Auth0 Dashboard → **User Management → Users → [usuario] → Roles**  
   Asigna los roles según corresponda.

3. **Asegurar que los roles se envían en los tokens**

   En la API / Application de Auth0:

   - Activa **Enable RBAC**.
   - Activa **Add Permissions in the Access Token** (aunque uses solo roles).

4. **Crear una Action para exponer roles en el claim**

   Usamos un claim personalizado `https://colorcenter.app/roles` para leer los roles desde la app.

   Pasos (UI típica de Auth0):
   1. Ve a **Actions** (menú lateral izquierdo).
   2. Clic en **Library** o **Create** / **Create Action** (según tu UI).
   3. Crea una Action con Trigger **Post Login**.
   4. Pega el código y guarda.
   5. Presiona **Deploy**.

   ```js
   // Auth0 Action (Trigger: Post Login)
   exports.onExecutePostLogin = async (event, api) => {
     const roles = (event.authorization || {}).roles || [];
     api.idToken.setCustomClaim("https://colorcenter.app/roles", roles);
     api.accessToken.setCustomClaim("https://colorcenter.app/roles", roles);
   };
   ```

   Con esto, en `session.user` veremos algo como:

   ```ts
   session.user["https://colorcenter.app/roles"]; // ["soporte", "gerente-regional", ...]
   ```

---

### 2. Cómo encaja con Organizations (empresas / zonas)

La app ya limita empresas por **Auth0 Organizations**:

- Un usuario solo ve datos de las empresas (Organizations) donde es **miembro**.
- Eso cubre la parte de *“importa la zona que tengan”*.

Comportamiento por rol:

- **Soporte**
  - Rol: `soporte`.
  - Miembro solo de las Organizations de su zona.
  - Puede **leer y escribir** en esas empresas.

- **Gerente Regional**
  - Rol: `gerente-regional`.
  - Miembro de las Organizations de su región.
  - Tiene **solo lectura** en esas empresas.

- **Soporte Central** (dos opciones)
  - **Opción simple (recomendada)**:  
    Hacerlo **miembro de todas las Organizations** → ve y escribe todo usando el rol para permitir escritura.
    - Nota: si te manda a `/sin-empresa`, es porque el usuario no aparece como miembro de ninguna Organization; en ese caso, debes asignarlo como miembro (o asignarlo a las Organizations correspondientes).
  - **Opción avanzada**:  
    En el código, si tiene rol `soporte-central`, ignorar el filtro de Organizations y darle todas las `EMPRESA_IDS`.  
    (Más flexible pero complica un poco la lógica.)

---

### 3. Lógica de roles en el backend (Next.js / server)

La lógica de permisos se basa siempre en la sesión de Auth0.

Ejemplo de helpers (pueden vivir en algo como `lib/auth-roles.ts`):

```ts
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";

const ROLES_CLAIM = "https://colorcenter.app/roles";

export async function getUserRoles(): Promise<string[]> {
  const session = await auth0.getSession();
  if (!session) return [];
  return (session.user[ROLES_CLAIM] as string[]) ?? [];
}

export async function userCanWrite(): Promise<boolean> {
  const roles = await getUserRoles();
  return roles.includes("soporte") || roles.includes("soporte-central");
}

export async function userCanRead(): Promise<boolean> {
  const roles = await getUserRoles();
  // Aquí puedes ser más estricto si lo necesitas
  return roles.length > 0;
}

export async function requireRead(): Promise<void> {
  const canRead = await userCanRead();
  if (!canRead) {
    redirect("/"); // o /login o /403
  }
}

export async function requireWrite(): Promise<void> {
  const canWrite = await userCanWrite();
  if (!canWrite) {
    redirect("/"); // o página específica de "no tienes permisos"
  }
}
```

Uso en una página solo de escritura (ejemplo `CrearEquipoPage`):

```ts
import { requireWrite } from "@/lib/auth-roles";

export default async function CrearEquipoPage() {
  await requireWrite(); // Solo Soporte / Soporte Central

  // resto de la página
}
```

En **rutas API** o **Server Actions**, se aplica el mismo patrón: antes de tocar la base de datos, llamas a `requireRead` / `requireWrite` o a `userCanWrite()` / `userCanRead()`.

---

### 4. Lógica de roles en el frontend (menús, botones)

En el layout protegido (`app/(protected)/layout.tsx`) ya se construye un objeto `sessionForClient`:

```ts
const sessionForClient = {
  user: {
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
  },
};
```

Lo natural es añadir los roles:

```ts
const sessionForClient = {
  user: {
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
    roles: (session.user["https://colorcenter.app/roles"] as string[]) ?? [],
  },
};
```

Y luego pasarlo a `AppShell`:

```tsx
return (
  <AppShell session={sessionForClient}>
    {children}
  </AppShell>
);
```

En `AppShell` / `sidebar`:

- **Soporte / Soporte Central**
  - Ven botones de **Crear**, **Editar**, **Cerrar incidencia**, etc.
- **Gerente Regional**
  - Solo ve **listados**; sin botones de edición/borrado.
- **Menús de administración**
  - Por ejemplo, solo mostrar el menú de “Admin” si `roles` incluye `soporte-central`.

---

### 5. Resumen concreto

- **En Auth0**
  - Crear roles: `soporte`, `gerente-regional`, `soporte-central`.
  - Asignar roles a usuarios.
  - Crear una Action / Rule que ponga `event.authorization.roles` en el claim `https://colorcenter.app/roles`.

- **En la app**
  - Leer el claim `https://colorcenter.app/roles` desde `session.user`.
  - Crear helpers tipo `getUserRoles`, `userCanWrite`, `requireWrite`.
  - Usarlos en páginas y APIs de escritura.
  - Pasar roles al cliente para esconder/mostrar menús y botones.
