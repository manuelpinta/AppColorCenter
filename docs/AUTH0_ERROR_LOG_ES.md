## Log de errores Auth0 (sesion, roles y Organizations)

### Fecha
2026-03-19

### Entorno
Local (localhost:3000)

---

## Error 1: Loop despues del login (dashboard se ve rapido y luego se recarga en ciclo)

### Sintoma reportado
1. Iniciar sesion con Auth0.
2. Se redirige al dashboard.
3. El dashboard se ve por menos de 1 segundo.
4. La app entra en un ciclo de recarga (antes de mostrar "cargando empresas", luego vuelve a rutas de autenticacion como `/login`).

### Causa (resumen)
La verificacion manual de cookies/sesion dentro de `middleware.ts` podia provocar redirects a `/login` aunque el SDK de `@auth0/nextjs-auth0` ya estaba manejando la sesion correctamente. Ademas, el calculo de Organizations podia interrumpir el render si fallaba.

### Como se soluciono
1. Se elimino la validacion manual de cookie en `middleware.ts` y se dejo que `auth0.middleware(request)` maneje la sesion/redirects.
2. Se agrego un blindaje en `app/(protected)/layout.tsx` alrededor de `auth0.getSession()` para redirigir/controlar el caso en que no exista sesion valida (y evitar que el render quedara inconsistente).
3. Se agrego timeout + manejo de error en llamadas a Management API/Organizations:
   - `lib/auth0-organizations.ts`
   - `lib/allowed-empresas-context.ts`

### Resultado
El loop infinito quedo resuelto en local.

---

## Error 2: Falta el claim de roles en la sesion (`roles_claim_missing`)

### Sintoma reportado
Al entrar a rutas que requieren permisos de escritura:
- Aparece `/sin-rol` con:
  - `reason=roles_claim_missing`
  - `roles claim presente: false`
  - `roles: []`

### Causa (resumen)
El claim esperado en `session.user`:
`https://colorcenter.app/roles`
no estaba llegando (no estaba poblado en `session.user`).

### Como se soluciono
Se implemento fallback para permisos (temporal) cuando el claim de roles no este presente, para poder desbloquear la app mientras se encontraba la causa real:
1. Se agrego `getUserRolesFromManagementAPI(userId)` para pedir roles via Management API:
   - `GET /api/v2/users/{user_id}/roles`
2. En `lib/auth-roles.ts`, si el claim de roles falta, el backend consulta roles por Management API y decide lectura/escritura con esos roles.

### Resultado
La app ya no dependia exclusivamente del claim para decidir permisos mientras se depuraba el problema. Finalmente, la causa real se corrigio en el SDK (Error 4) y el fallback quedo como respaldo opcional.

---

## Error 3 (nuevo hallazgo): claim sigue ausente aun con RBAC/permissions configurados en Auth0

### Evidencia
- En Auth0 el API tiene:
  - `Enable RBAC` activado.
  - `Add Permissions in the Access Token` activado.
- El rol `soporte` tiene permissions asignadas para el API del proyecto (ej. `read:data` y `write:data`).

### Estado en la app
- Aunque el claim `https://colorcenter.app/roles` sigue sin aparecer en `session.user` (`roles claim presente: false`),
  la app podia autorizar mediante fallback consultando roles por Management API (respaldo temporal).

### Observacion
- Esto sugiere que `event.authorization.roles` (usado por la Action Post Login) está llegando vacío para el `audience`/API que está solicitando el login, o que el cálculo de autorización en el Post Login no está evaluando roles para el recurso correcto.

## Error 4 (causa raíz real): `@auth0/nextjs-auth0` filtraba custom claims en `session.user`

### Hallazgo
Aunque la Action pudiera setear `https://colorcenter.app/roles`, el SDK por defecto filtra los claims del ID token al construir `session.user`, dejando solo un set de claims “default”. Por eso en la app aparecía:
- `roles claim presente: false`

### Solución aplicada
En `lib/auth0.ts` se configuró `beforeSessionSaved` para conservar los custom ID token claims dentro de `session.user`.

Resultado: la app debería volver a ver `https://colorcenter.app/roles` en `session.user` y ya no depender del fallback.

Estado actual
- Con `beforeSessionSaved` el claim aparece en `session.user`.
- El fallback por Management API queda desactivado por defecto (puede reactivarse con `AUTH0_ROLES_FALLBACK_MANAGEMENT_API=true` si alguna vez lo necesitas).

### Hallazgo adicional (por lo que me compartiste)
- En tu Auth0 Action “exponer roles en el claim”, el claim `https://colorcenter.app/roles` en la sesión sigue saliendo ausente (`roles claim presente: false`).
- En la UI de Auth0 no te aparece el apartado de `Executions`/`Execution logs` como tal.

En los siguientes pasos para corroborar qué está pasando en la Action:
- Verificar que en el runtime del Post Login exista `event.authorization` y que contenga `event.authorization.roles` (o lo que tu Action usa).
- Confirmar que el login está solicitando el `audience` correcto (API Identifier) para que Auth0 compute roles/authorization para el recurso esperado.

