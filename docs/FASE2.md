# Fase 2 – Estado, plan y decisiones

**MVP:** Subir inventario inicial (equipos/sucursales); usuarios y roles; marcas por tipo de equipo. Mantenimientos/incidencias no prioritarios al inicio.

---

## 1. Estado por bloque

| Bloque | Hecho | Pendiente |
|--------|--------|-----------|
| **(a) Catálogos compartidos** | Maestro Pintacomex, sync al resto (`lib/data/catalogos-sync.ts`) | Opcional: script sync inicial |
| **(b) Marcas por tipo** | DDL en schema-fase2 (`marca_tipo_equipo`) | Sync, `getMarcasEquipoPorTipo`, formulario + admin tipos |
| **(c) Auth y roles** | DDL + seed en schema-fase2 (usuarios.rol, empresa_id, subzona) | En app: filtro por rol/alcance, solo Admin edita catálogos, Lectura solo lectura, login |
| **(d) Alcance por subzona** | DDL + seed (6 Editors Pintacomex por subzona) | En app: filtrar por región/subzona (comun) para Editor emp-1 |
| **(e) Gasto y reportes** | Mantenimientos/reportes con datos reales | Rentas: modelo de pagos (tabla y reportes) |
| **(f) Fotos Supabase Storage** | Hecho (API, bucket, equipo_fotos) | — |

**Orden de implementación:** (a) → (b) → (c) → (d) → (e). (f) ya está.

---

## 2. Checklists por bloque

**(a) Catálogos:** [x] Maestro = Pintacomex (`CATALOGO_MAESTRO_EMPRESA_ID`); [x] Tablas: cat_tipos_equipo, marcas_equipo, modelos_equipo, arrendadores; [x] Escritura en maestro + sync; [ ] Sincronización inicial (opcional).

**(b) Marcas por tipo:** [ ] Regla: sin filas en `marca_tipo_equipo` = no mostrar (o = todos); [x] DDL en schema-fase2; [ ] Incluir en sync catálogos; [ ] `getMarcasEquipoPorTipo`; [ ] Formulario equipo: marcas por tipo; [ ] Admin: asignar tipos a marcas y poblar datos.

**(c) Auth y roles:** Admin (todo + catálogos), Lectura (solo consulta), Editor (por empresa o subzona). [x] DDL y seed (1 Admin, 1 Lectura, 10 Editors); [ ] En app: filtros por rol/alcance, login, middleware/helpers.

**(d) Subzona:** [x] usuarios.subzona + seed 6 Editors Pintacomex (Gro Norte, Gro Centro, Gro Costa, Coatza-Mina, Acapulco, Metro); [ ] En app: filtrar sucursales/equipos por región = usuario.subzona cuando empresa_id=emp-1.

**(e) Gasto:** [x] Mantenimientos con costo, reportes; [ ] Rentas: ver §5 (opciones A/B/C).

**(f) Fotos:** [x] Supabase Storage, path empresa/SUC/equipo, equipo_fotos con URL.

---

## 3. Plan de ejecución (resumen)

**Arquitectura:** No hay BD global. Cada empresa tiene su base Color Center y su base comun. Catálogos se replican desde un maestro (Pintacomex) al resto.

**URLs/IDs:** Sucursal `CODIGO-SUC<id>` (`lib/data/sucursales.ts`). Equipo `CODIGO-sucursal-equipo` (`lib/data/equipos.ts`). Path fotos: `CODIGO_EMPRESA/SUC<id>/<equipo_id>/...`. Empresas con `codigo` en `lib/data/empresas.ts`.

**(a) Catálogos:** Escribir solo en maestro; tras cada INSERT/UPDATE, sync a las demás BDs con el mismo `id`. Tablas: cat_tipos_equipo, marcas_equipo, modelos_equipo, arrendadores.

**(b) Marcas por tipo:** Tabla N:M `marca_tipo_equipo` (marca_id, tipo_equipo_id). `getMarcasEquipoPorTipo(pool, tipoEquipoId)`; formulario filtra marcas por tipo elegido. Incluir `marca_tipo_equipo` en sync de catálogos.

**(c) Auth:** Login en MySQL (tabla usuarios con rol, empresa_id, subzona; contraseña hasheada cuando se añada login). Supabase solo Storage. Middleware y helpers para filtrar por alcance.

**(d) Subzonas:** Filtro por `comun.subzonas` / `IdSubZona`; implementar junto con (c).

**(e) Rentas:** Pendiente decidir modelo (solo tabla de pagos vs contrato+pagos); ver §5.

---

## 4. Ya hecho (fuera de bloques)

- IDs compuestos sucursal/equipo; path Supabase empresa → sucursal → equipo.
- `getEmpresaByCodigo`; APP_EMPRESAS con codigo.
- Reintento en getSucursalesFromComun ante Pool closed / ECONNRESET.

---

## 5. Decisiones (resumen)

- **Auth:** MySQL (usuario, rol, alcance en nuestra BD); Supabase solo para Storage.
- **Catálogos:** Sincronización desde maestro (Pintacomex); no BD única de catálogos.
- **Marcas por tipo:** N:M `marca_tipo_equipo`; sin filas = no mostrar en formulario (o definir “mostrar en todos”).
- **Rentas:** Por definir. Opciones: (A) solo tabla de pagos; (B) contrato + pagos; (C) monto mensual en equipo + tabla pagos. Ver criterios en diseño cuando se implemente.
- **Alcance Editor:** Por empresa (4: Gallco, Honduras, Belice, El Salvador) o por subzona Pintacomex (6: Gro Norte, Gro Centro, Gro Costa, Coatza-Mina, Acapulco, Metro).
