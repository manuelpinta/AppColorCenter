# Planificación funcional – Color Center Management

Documento de diseño y criterios de manejo de la información. Sirve como referencia antes de implementar; no sustituye el esquema de base de datos ni los flujos ya construidos.

---

## 1. Historial de cambios (movimientos de equipo)

**Contexto:** Un Color Center puede pasar a otra sucursal y a partir de ahí tener varios movimientos. Hace falta trazabilidad completa.

**Qué debe quedar claro:**

- **Qué se registra:** Cada movimiento de un equipo de una sucursal (origen) a otra (destino), con fecha (y hora si aplica) y, opcionalmente, motivo o nota.
- **Qué se consulta:** Para cualquier equipo: lista de movimientos (desde dónde → hacia dónde, cuándo). Para una sucursal: equipos que entraron/salieron y cuándo.
- **Responsable del dato:** Quién registra el movimiento (usuario o rol) puede guardarse para auditoría.
- **Relación con el modelo actual:** El equipo tiene `color_center_id` (sucursal actual). El historial sería una tabla de eventos (movimientos) que no borra ni reemplaza la sucursal actual, solo la actualiza y deja registro.

**Criterios de manejo:**

- Al cambiar la sucursal de un equipo, se crea un registro de “movimiento” (origen, destino, fecha, opcionalmente motivo y usuario) y se actualiza `color_center_id`.
- Las consultas de “historial del equipo” y “movimientos por sucursal” se resuelven leyendo esa tabla de movimientos.

---

## 2. Reporte de incidencias (vs mantenimiento)

**Contexto:** No es lo mismo un mantenimiento programado o correctivo que “reportar un problema”. La incidencia debe disparar alertas a responsables.

**Qué debe quedar claro:**

- **Diferencia conceptual:**
  - **Mantenimiento:** Actividad planificada o correctiva (reparación, calibración, etc.) con técnico, fecha, descripción, costo.
  - **Incidencia:** Reporte de un problema (falla, avería, riesgo). Puede derivar después en uno o más mantenimientos, pero el origen es el reporte y la alerta.
- **Flujo deseado:** Al reportar una incidencia → se genera una **alerta** dirigida a las **personas responsables** (por sucursal, regional, o rol). Ellas ven que hay algo que atender.
- **Datos útiles de una incidencia:** Quién reporta, cuándo, sucursal/equipo afectado, descripción del problema, severidad/urgencia (opcional), estado (reportada / en atención / resuelta / cerrada), y si se vinculó a un mantenimiento posterior.
- **Alertas por usuario:** El sistema debe poder “saber” a quién notificar (por sucursal, por empresa, por rol) y registrar que se envió la alerta (y opcionalmente si fue leída o reconocida).

**Criterios de manejo:**

- Incidencias y mantenimientos son entidades distintas; una incidencia puede tener N mantenimientos asociados (o ninguno aún).
- El registro de una incidencia activa el flujo de alertas según responsables configurados (regionales, sucursal, etc.).
- En listados y reportes, poder filtrar “solo mantenimientos” vs “solo incidencias” y ver el vínculo incidencia → mantenimiento(s).

---

## 3. Equipos obsoletos y análisis de costo de reparaciones

**Contexto:** Poder evaluar si un equipo ya no conviene seguir reparando y sería mejor reemplazarlo.

**Qué debe quedar claro:**

- **Dato necesario:** Por equipo, suma (o listado) de **costos de reparaciones** (mantenimientos correctivos, o todos los que tengan costo). Con eso se puede comparar costo acumulado vs precio de equipo nuevo o de reemplazo.
- **Consultas útiles:** Reporte o vista “equipos por costo acumulado de reparación” (ordenado o filtrado por umbral), y poder ver detalle de cada equipo: historial de mantenimientos con costo, total gastado, antigüedad (fecha de compra).
- **Estado “obsoleto” o “candidato a baja”:** Definir si es solo una etiqueta/categoría para filtrar, o un estado en el flujo (ej. “En evaluación de reemplazo” → “Dado de baja” / “En deshuesadero”). Eso se puede decidir después; lo importante es tener los datos de costos para tomar la decisión.

**Criterios de manejo:**

- Todo mantenimiento con costo registrado debe poder sumarse por equipo.
- Reportes o pantallas deben permitir: ver por equipo el total gastado en reparaciones y, si aplica, marcar o filtrar equipos “obsoletos” o “candidatos a reemplazo” según criterio (ej. costo > X o antigüedad > Y).

---

## 4. Equipos en arrendamiento – renovación o no

**Contexto:** Cuando termina la renta, decidir si renovar o no. Para eso hace falta ver vencimiento, estado e historial.

**Qué debe quedar claro:**

- **Datos que ya se tienen (o se extienden):** Tipo de propiedad (propio / arrendado), arrendador. Falta (o hay que destacar): **fecha de vencimiento del contrato** (o “fin de renta”).
- **Qué debe verse para decidir renovación:**
  - **Cuándo vence** el arrendamiento.
  - **Estado actual del equipo** (operativo, en mantenimiento, etc.).
  - **Historial:** Mantenimientos, incidencias, costos asociados a ese equipo en el periodo de renta.
- **Opcional:** Recordatorios o alertas “próximo vencimiento de arrendamiento” (por ejemplo 30/60/90 días antes) para responsables.
- **Renovación:** Puede manejarse como decisión externa (en la vida real) y en el sistema solo registrar: “se renovó” (nueva fecha de vencimiento) o “no se renovó” (baja, venta, devolución al arrendador). Si se quiere, más adelante se puede agregar un módulo “Renovaciones” con estado (pendiente de decisión / renovado / no renovado).

**Criterios de manejo:**

- Modelo de datos: al menos `fecha_vencimiento_arrendamiento` (o similar) para equipos con tipo_propiedad = Arrendado.
- Pantallas/reportes: filtro “equipos en arrendamiento”, columnas o vista detalle con vencimiento, estado e historial (mantenimientos + costos + incidencias).
- Alertas opcionales de vencimiento según política (ej. por sucursal o regional).

---

## 5. Deshuesadero / equipos como refacciones

**Contexto:** Equipos obsoletos que se guardan para sacar piezas. Evitar acumular equipo o partes que ya no sirven.

**Qué debe quedar claro:**

- **Concepto:** Un equipo dado de baja puede pasar a “deshuesadero” (o “refacciones”): ya no opera como equipo completo, pero sus partes se usan para otros. Hay que saber qué se le quita, en qué estado está cada parte y tener control de qué sigue siendo útil y qué no.
- **Qué registrar:**
  - **Equipo en deshuesadero:** Origen (qué equipo fue), fecha de ingreso, sucursal o ubicación del “deshuesadero” (si aplica).
  - **Piezas/refacciones extraídas:** Qué pieza es (nombre o código), condición (buena / regular / desecho), en qué fecha se extrajo, de qué equipo (el que está en deshuesadero), y si se asignó a otro equipo o sucursal (opcional).
  - **Bajas de piezas:** Cuándo se desecha una pieza o un equipo completo del deshuesadero para no acumular lo que ya no sirve.
- **Consultas útiles:** Qué hay en deshuesadero (por sucursal o global), qué piezas se han extraído y su estado; listado de piezas disponibles para reutilización; historial de extracciones y bajas.

**Criterios de manejo:**

- Equipos “dados de baja” pueden tener un destino: “Deshuesadero” (o “Refacciones”). No es lo mismo que “Inactivo” operativo; es un estado/uso distinto.
- Se necesita un modelo para “piezas/refacciones”: al menos identificador, descripción, condición, equipo de origen, fecha de extracción, y opcionalmente a qué equipo/sucursal se asignó después.
- Flujo: Equipo → Baja → Ingreso a deshuesadero → Registro de piezas extraídas y su condición → Posible reutilización o desecho de piezas. Todo con fechas y, si aplica, responsable.

---

## 6. Fotos de equipos (Supabase Storage)

**Contexto:** La app usará **MySQL** como base de datos principal. Las **imágenes de los equipos** se almacenarán en **Supabase Storage** para no guardar binarios en MySQL y aprovechar CDN y control de acceso.

**Qué debe quedar claro:**

- **Varias fotos por equipo:** No es una sola “foto de perfil”, sino una **galería** para documentar el estado del equipo (vistas por todos los lados). Cada foto debe tener **fecha** (cuándo se tomó) y opcionalmente descripción (ej. "Vista frontal", "Lateral derecho").
- **Dónde se guarda:** Archivos en Supabase Storage (bucket `equipos-fotos`). En MySQL, tabla **`equipo_fotos`** con `equipo_id`, `url`, `fecha_foto`, `descripcion` (una fila por foto).
- **Flujo:** (1) Usuario sube una o más fotos desde el detalle del equipo. (2) La app sube cada archivo a Supabase Storage. (3) Se guarda en `equipo_fotos` la URL y la fecha (y descripción). (4) En el detalle del equipo se muestra la galería ordenada por fecha.

**Criterios de manejo:**

- MySQL no almacena el binario; la tabla `equipo_fotos` guarda solo la URL (o path) de cada imagen en Supabase.
- Cada foto tiene **fecha_foto** obligatoria para saber de cuándo es y poder ver evolución del estado.
- Configuración: variables de entorno para Supabase; bucket con política de acceso según necesidad.
- Al dar de baja un equipo, decidir si se borran también los archivos en Storage (opcional).

---

## Resumen por proceso (alineado al diagrama)

| Proceso / tema           | Objetivo de información                                      |
|--------------------------|--------------------------------------------------------------|
| **Alta**                 | Ya cubierto (registro de equipos y sucursal).                |
| **Baja**                 | Dar de baja equipo; opción “a deshuesadero” y trazabilidad.  |
| **Mantenimientos**       | Ya cubierto; con costos para análisis de obsolescencia.      |
| **Cambios de sucursal**  | Historial de movimientos (origen, destino, fecha).           |
| **Reporte incidencias**  | Entidad distinta a mantenimiento; dispara alertas.           |
| **Renovación (arrendamiento)** | Fecha vencimiento, estado, historial para decidir renovar. |
| **Deshuesadero**         | Equipos y piezas en refacciones; condición y control de bajas. |
| **Fotos de equipos**     | Varias fotos por equipo (galería con fecha); Supabase Storage + tabla `equipo_fotos` en MySQL. |

---

## Responsables y alertas

- **Regionales / Sucursales:** Definir quién recibe alertas de incidencias por sucursal o por región (y, si aplica, por tipo de equipo o criticidad).
- **Alertas por usuario:** Que cada usuario (o rol) tenga una bandeja o notificaciones de “incidencias asignadas” o “incidencias de mis sucursales” para no depender solo de correo externo.

---

## Próximos pasos (cuando se programe)

1. Modelo de datos: tablas o campos para movimientos, incidencias, alertas, vencimiento de arrendamiento, deshuesadero y piezas; y uso de `foto_url` en equipos para Supabase Storage.
2. Fotos de equipos: galería con tabla `equipo_fotos` (url, fecha_foto, descripcion); integración con Supabase Storage para subir archivos y guardar URL.
3. Flujos de pantalla: alta de incidencia → asignación de responsables → alertas; consulta de historial de movimientos; reportes de costo por equipo; vista de arrendamientos por vencer; alta y seguimiento de piezas en deshuesadero.
4. Definir reglas de negocio: quién puede reportar incidencias, quién puede dar de baja equipos, quién registra piezas extraídas, etc.

Este documento se puede ir actualizando con decisiones concretas (nombres de tablas, estados, roles) sin tocar código hasta que se decida implementar cada parte.
