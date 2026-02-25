# Bundle cliente vs servidor (por qué hay `lib/data/ids` y `lib/empresas-config`)

El build fallaba con **UnhandledSchemeError: node:buffer** porque componentes con `"use client"` importaban desde `@/lib/data`. Eso hacía que Webpack incluyera en el bundle del cliente la cadena:

`@/lib/data` → `lib/data/sucursales` o `equipos` → `lib/db` → `mysql2` → módulos Node (`node:buffer`, etc.)

**Solución:** El código que solo necesita **IDs compuestos** (sucursal, equipo) o **tipos** no debe depender de `lib/db`. Por eso:

- **`lib/empresas-config.ts`**: Solo constantes (`EMPRESA_IDS`, `EmpresaId`, `EMPRESA_TO_ENV_KEY`). Sin MySQL.
- **`lib/data/ids.ts`**: Funciones puras `buildSucursalCompositeId`, `buildEquipoCompositeId`, `parseEquipoId`, `parseSucursalId`. Solo importa de `empresas` y `empresas-config`.
- **`lib/data/empresas.ts`**: Importa de `empresas-config` (no de `lib/db`).
- **Tipos `EquipoWithEmpresa`, etc.**: Definidos en `lib/types` para que el cliente pueda importarlos sin cargar módulos de BD.

**Regla para componentes cliente:** Importar helpers de IDs desde `@/lib/data/ids` y tipos WithEmpresa desde `@/lib/types`. No importar desde `@/lib/data` cosas que arrastren `lib/db` (el barrel de `@/lib/data` sigue exportando todo para uso en servidor y API routes).
