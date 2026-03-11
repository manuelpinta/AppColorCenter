# Manual de usuario – Color Center Management

Pasos para cada acción en la aplicación. Rutas y menús según la versión actual.

---

## Inicio de sesión

- **Dónde:** pantalla de inicio de sesión (ruta `/login`).
- **Cómo:** abrir la app; si no hay sesión, ir a **Inicio de sesión** o escribir en el navegador la URL de login. Ingresar **usuario o correo** y **contraseña**, luego **Iniciar sesión**.
- **Nota:** si el inicio de sesión aún no está configurado (base común sin datos), la app mostrará un aviso.

---

## Dashboard (inicio)

- **Dónde:** menú lateral **Dashboard** (Inicio) o ruta `/`.
- **Qué hace:** muestra vista general de sucursales/Color Centers y equipos. Puedes filtrar por empresa (país). Desde cada tarjeta de sucursal puedes entrar al detalle de esa sucursal.

---

## Sucursales / Color Centers

### Ver lista de sucursales

- **Dónde:** menú lateral **Sucursales** → ruta `/sucursales`.
- **Qué hace:** listado de todas las sucursales (Color Centers) con búsqueda y filtros. Clic en una fila o en el nombre para ir al detalle.

### Ver detalle de una sucursal

- **Dónde:** desde la lista de Sucursales, clic en la sucursal; o desde el Dashboard, clic en la tarjeta de la sucursal. Ruta: `/sucursales/[id]`.
- **Qué hace:** muestra datos de la sucursal, equipos asignados, incidencias y accesos rápidos para **Registrar mantenimiento**, **Agregar equipo** y **Reportar incidencia** en esa sucursal.

---

## Equipos

### Ver lista de equipos

- **Dónde:** menú lateral **Equipos** → ruta `/equipos`.
- **Qué hace:** listado de equipos de todas las sucursales (o filtrado por empresa). Clic en un equipo para ver su detalle.

### Subir / dar de alta un equipo nuevo

- **Dónde:**  
  - Menú **Equipos** → botón **Agregar equipo** (arriba) → ruta `/equipos/crear`.  
  - O desde el **detalle de una sucursal** → botón **Agregar equipo** → se abre `/equipos/crear` con la sucursal ya preseleccionada.
- **Cómo:** completar el formulario (sucursal, tipo de equipo, marca, modelo, número de serie, tipo de propiedad, estado, fechas, etc.). Opcional: datos de equipo de cómputo si el tipo es “Equipo de Computo”. Al guardar, el equipo queda dado de alta y puedes ir al detalle del equipo o a la sucursal.

### Ver detalle de un equipo

- **Dónde:** desde la lista de **Equipos**, clic en el equipo; o desde el detalle de una **Sucursal**, clic en un equipo. Ruta: `/equipos/[id]`.
- **Qué hace:** muestra datos del equipo, sucursal asignada, mantenimientos, incidencias, movimientos y fotos. Desde aquí puedes **Editar**, **Mover a otra sucursal** y **Registrar mantenimiento**.

### Editar un equipo

- **Dónde:** en el **detalle del equipo** → botón **Editar** (arriba a la derecha) → ruta `/equipos/[id]/editar`.
- **Cómo:** modificar los campos que necesites y guardar. Puedes volver al detalle del equipo o a la sucursal según el botón que uses al terminar.

### Mover un equipo a otra sucursal

- **Dónde:** en el **detalle del equipo** → botón **Mover a otra sucursal** → ruta `/equipos/[id]/mover`.
- **Cómo:** elegir la **sucursal de destino**, opcionalmente indicar **motivo** y **quién registra**. Al confirmar, se registra el movimiento y el equipo queda asignado a la nueva sucursal. Luego puedes volver al detalle del equipo.

### Fotos de un equipo

- **Dónde:** en el **detalle del equipo**, sección de fotos. Ahí se listan las fotos y se pueden **agregar** nuevas (subida a Supabase Storage según configuración).
- **Cómo:** usar el botón o zona de “Agregar foto” / subir imagen; rellenar fecha y descripción si aplica y guardar.

---

## Mantenimientos

### Ver lista de mantenimientos

- **Dónde:** menú lateral **Mantenimientos** → ruta `/mantenimientos`.
- **Qué hace:** listado de mantenimientos con filtros. Clic en uno para ver detalle.

### Registrar un mantenimiento nuevo

- **Dónde:**  
  - Menú **Mantenimientos** → botón **Registrar mantenimiento** (arriba) → ruta `/mantenimientos/crear`.  
  - O desde el **detalle de un equipo** → **Registrar Mantenimiento**.  
  - O desde el **detalle de una sucursal** → **Registrar mantenimiento**.
- **Cómo:** elegir **equipo** (y sucursal si aplica), tipo (preventivo/correctivo), técnico, fecha, descripción, estado, etc. Al guardar quedas en el detalle del equipo, en la sucursal o en la lista de mantenimientos según la opción elegida.

### Ver detalle de un mantenimiento

- **Dónde:** desde la lista de **Mantenimientos**, clic en una fila. Ruta: `/mantenimientos/[id]`.
- **Qué hace:** muestra los datos del mantenimiento y del equipo. Desde aquí puedes **Editar** el mantenimiento si está permitido.

### Editar un mantenimiento

- **Dónde:** en el **detalle del mantenimiento** → botón **Editar** → ruta `/mantenimientos/[id]/editar`.
- **Cómo:** modificar campos y guardar. Al terminar puedes volver al detalle del mantenimiento o a la lista.

---

## Incidencias

### Ver lista de incidencias

- **Dónde:** menú lateral **Incidencias** → ruta `/incidencias`.
- **Qué hace:** listado de incidencias con filtros. Clic en una para ver detalle.

### Reportar una incidencia nueva

- **Dónde:**  
  - Menú **Incidencias** → botón **Reportar incidencia** (arriba) → ruta `/incidencias/crear`.  
  - O desde el **detalle de una sucursal** → **Reportar incidencia** (sucursal ya preseleccionada).
- **Cómo:** elegir **sucursal**, opcionalmente **equipo** afectado, descripción, severidad, estado. Al guardar puedes ir al detalle de la incidencia o a la lista.

### Ver detalle de una incidencia

- **Dónde:** desde la lista de **Incidencias**, clic en una fila. Ruta: `/incidencias/[id]`.
- **Qué hace:** muestra datos de la incidencia, sucursal, equipo (si aplica) y mantenimientos relacionados.

---

## Reportes

- **Dónde:** menú lateral **Reportes** → ruta `/reportes`.
- **Qué hace:** pantalla de reportes (vista general por sucursales, equipos y mantenimientos según lo implementado). Puedes filtrar por empresa o sucursal si hay selectores.

---

## Admin catálogos

- **Dónde:** menú lateral **Admin catálogos** (Admin) → ruta `/admin/catalogos`.
- **Qué hace:** gestión de catálogos (tipos de equipo, marcas, modelos, arrendadores, estados, etc.) por pestañas. Permite crear, editar y desactivar valores que luego se usan en equipos, mantenimientos e incidencias. Los cambios en catálogos maestros se replican a las demás bases según la configuración del sistema.

---

## Resumen rápido por acción

| Quiero… | Ir a… |
|--------|--------|
| Iniciar sesión | `/login` |
| Ver resumen general | **Dashboard** (menú) |
| Ver sucursales | **Sucursales** (menú) |
| Ver detalle de una sucursal | **Sucursales** → clic en la sucursal |
| **Subir un equipo nuevo** | **Equipos** → **Agregar equipo**; o desde detalle de sucursal → **Agregar equipo** |
| Ver / editar un equipo | **Equipos** → clic en el equipo |
| **Mover un equipo** | Detalle del equipo → **Mover a otra sucursal** |
| Registrar un mantenimiento | **Mantenimientos** → **Registrar mantenimiento**; o desde detalle de equipo/sucursal → **Registrar Mantenimiento** |
| Ver / editar un mantenimiento | **Mantenimientos** → clic en el mantenimiento |
| Reportar una incidencia | **Incidencias** → **Reportar incidencia**; o desde detalle de sucursal → **Reportar incidencia** |
| Ver una incidencia | **Incidencias** → clic en la incidencia |
| Ver reportes | **Reportes** (menú) |
| Gestionar catálogos | **Admin catálogos** (menú) |

---

*Manual según la estructura de rutas y menús actual. Si se añaden o cambian pantallas, conviene actualizar este documento.*
