## Context

- Este repo (`panacea-clubsocios`) es el frontend React + Vite. El backend es un servicio separado que se consume en `VITE_BACKEND_API_URL` (`src/services/*.js`).
- Hoy existe `POST /ventas/` (`registrarVenta`), que registra compras con su monto. La home de recompensas (change `rewards-home-redesign`) consume `/recompensas/creditos`, `/maquina`, `/cupones`, `/promociones` y `/actividad`. Los créditos eran temporales.
- No existe un concepto de rol en el frontend. El menú lateral (`AppLayout.jsx`, `NAV`) ya soporta grupos con `children`.
- Restricción de negocio: la inflación hace que los montos crezcan, así que los puntos deben fijarse al momento de la compra con una tasa ajustable hacia adelante.

## Goals / Non-Goals

**Goals:**
- Un único ledger auditable para toda la economía de puntos: acumulación, canje, juego, expiración, reversos y ajustes.
- Una conversión monto→puntos versionada que nunca recalcula el pasado.
- Un catálogo de beneficios con descuento porcentual, canje con descuento inmediato de puntos y un cupón por compra.
- Pantallas "Maestro" para que el negocio administre beneficios, tasas y configuración sin depender de desarrollo.
- Un contrato de API claro para el backend.

**Non-Goals:**
- Niveles de socio (oro, plata) o multiplicadores por categoría de producto. El campo `multiplicador` queda disponible para una etapa futura.
- Indexación automática de la tasa por inflación. Por ahora el ajuste es manual desde "Maestro".
- Beneficios que no sean un descuento porcentual (productos gratis, monto fijo).
- Implementar el backend en este repo.

## Decisions

### D1. Ledger append-only con saldo derivado
`movimientos_puntos(id, socio_id, tipo, puntos, compra_id, canje_id, regla_id, monto_base, descripcion, creado_por, creado_en)` con índices únicos parciales `(compra_id, tipo)` y `(canje_id, tipo)`. Para que leer el saldo sea rápido, se mantiene `socios.saldo_puntos` actualizado en la misma transacción que cada movimiento.
*Alternativa descartada*: solo una columna de saldo. Pierde auditoría y hace imposible reconstruir el saldo o resolver reclamos.

### D2. Reglas de conversión con vigencia y sin edición retroactiva
`reglas_puntos(id, monto_por_punto, multiplicador, tope_por_compra, vigente_desde, vigente_hasta, motivo, creado_por)`. Crear una regla cierra la anterior. Solo se aceptan fechas `>= hoy`, para no alterar la lógica de compras ya procesadas. Fórmula: `floor(monto / monto_por_punto × multiplicador)`, con tope.
*Por qué "monto por punto" y no "puntos por peso"*: es entero y legible ("$100 = 1 punto"), y con inflación se ajusta subiéndolo.
*Alternativa descartada*: puntos relativos al ticket promedio. Es menos predecible para el socio y para el negocio.

### D3. Generación de puntos en el backend, en la misma transacción que la compra
El handler de `POST /ventas/` registra la compra, aplica el cupón si viene uno y luego inserta `ACUMULACION` sobre el **monto registrado** (el neto, después del descuento). Si la generación falla por falta de regla, la compra no se revierte; el error queda en el log.
*Alternativa*: un evento o job asíncrono. Es más desacoplado, pero exige outbox y reintentos. Si el volumen crece se puede migrar, y la idempotencia por `(compra_id, tipo)` ya lo soporta.

### D4. Los puntos se descuentan al canjear, no al usar el cupón
Esto evita que el socio emita varios cupones con el mismo saldo. El canje bloquea la fila del socio (`SELECT … FOR UPDATE`), valida, inserta el canje y el `CANJE` y actualiza el saldo y el stock. Los cupones vencidos **se pierden** (decisión de negocio): el job diario solo cambia el estado a `EXPIRADO`.

### D5. Snapshot en el canje
`canjes` copia `costo_puntos`, `porcentaje_descuento` y `tope_descuento` del beneficio. Así, editar un beneficio nunca afecta los cupones ya emitidos. Los beneficios no se borran; solo se desactivan.

### D6. Un cupón por compra
`POST /ventas/` acepta `cupon_codigo` como string (no como array). Además, `canjes.compra_id` es único, y la combinación de ambas cosas impide aplicar dos cupones a la misma compra.

### D7. Expiración de puntos FIFO
Un job diario calcula, por socio, `acumulado_vencido − consumido` (los consumos se imputan primero a lo más antiguo) y registra `EXPIRACION` si el resultado es mayor que 0. El parámetro es `config_programa.meses_expiracion_puntos`.

### D8. La máquina de premios usa el mismo ledger
Jugar registra `JUEGO` por `-costo_juego_maquina` (configurable en "Maestro"). Si sale premio, se emite un cupón en `canjes` con `costo_puntos = 0` y origen `MAQUINA`.

### D9. Frontend
- Rol: `AuthContext` expone `user.es_admin` a partir de `GET /socios/me`. Se agrega un `AdminRoute` como guard y `NAV` agrega el grupo "Maestro" (icono `Settings2`) filtrado por rol.
- Páginas: `src/pages/maestro/BeneficiosPage.jsx`, `ConversionPage.jsx`, `ConfiguracionPage.jsx` y `AjustesPage.jsx`. Reutilizan `DataGrid`, `Modal`, `Field`, `ConfirmDialog`, `useToast` y `react-hook-form`, que ya se usan en `MasterDetailForm`.
- Servicios: `src/services/adminApi.js` (nuevo) y extensiones de `rewardsApi.js`.
- Home: `CreditsCard` cambia "Créditos" por "Puntos" y muestra `por_vencer`; se agrega `BenefitsSection` con un modal de confirmación de canje; `CouponsSection` mapea los estados del canje.

### D10. Contrato de API

| Método | Ruta | Request | Response |
|---|---|---|---|
| GET | `/recompensas/creditos` | – | `{ saldo, por_vencer: { puntos, fecha } \| null, proxima_recompensa }` |
| GET | `/recompensas/actividad` | `?limit` | `[{ id, tipo, puntos, descripcion, fecha }]` |
| GET | `/recompensas/regla-vigente` | – | `{ monto_por_punto, multiplicador, vigente_desde }` |
| GET | `/recompensas/beneficios` | – | `[{ id, nombre, descripcion, imagen_url, costo_puntos, porcentaje_descuento, tope_descuento, dias_validez_cupon, canjeable }]` |
| POST | `/recompensas/beneficios/{id}/canjear` | – | `201 { cupon, saldo }` · `409 { code: SALDO_INSUFICIENTE \| LIMITE_ALCANZADO \| SIN_STOCK }` |
| GET | `/recompensas/cupones` | – | `[{ id, codigo, title, porcentaje_descuento, status: ACTIVE\|USED\|EXPIRED, expires }]` |
| GET | `/canjes/{codigo}` | `?socio_id&monto` | `{ valido, descuento, motivo? }` |
| POST | `/ventas/` | `{ …actual, cupon_codigo? }` (con cupón, `importe` = monto antes del descuento) | venta (plana, compatible con la respuesta anterior) + `descuento`, `puntos_generados` · `409 CUPON_INVALIDO` · `422` si `cupon_codigo` no es un string |
| GET/POST | `/admin/beneficios` | beneficio | beneficio (el GET incluye `canjes_realizados`) |
| PUT | `/admin/beneficios/{id}` | beneficio parcial (incluye `activo`) | beneficio |
| GET/POST | `/admin/reglas-puntos` | `{ monto_por_punto, multiplicador, tope_por_compra, vigente_desde, motivo }` | regla (incluye `vigente_hasta`, `creado_por`) · `422 VIGENCIA_RETROACTIVA` · `409 CONFLICTO_VIGENCIA` si ya hay una regla que empieza ese día o después |
| DELETE | `/admin/reglas-puntos/{id}` | – | `204` (solo reglas programadas a futuro; reabre la anterior) · `409 REGLA_EN_USO` |
| GET | `/recompensas/maquina` | – | `{ cost, enabled }` (`enabled` = programa activo y hay beneficios disponibles) |
| POST | `/recompensas/maquina/jugar` | – | `{ coupon, saldo }` · `409 SALDO_INSUFICIENTE \| SIN_PREMIOS \| PROGRAMA_INACTIVO` |
| GET | `/jobs/diario` | header `Authorization: Bearer $CRON_SECRET` | `{ cupones_vencidos, socios_con_puntos_expirados, saldos_corregidos }` |
| GET/PUT | `/admin/configuracion` | `{ meses_expiracion_puntos, costo_juego_maquina, programa_activo }` | config |
| GET | `/admin/socios/{id}/puntos` | – | `{ saldo }` (pantalla de ajustes) |
| POST | `/admin/ajustes-puntos` | `{ socio_id, puntos, motivo }` | movimiento |

Todos los endpoints `/admin/*` exigen rol de administrador (403 en caso contrario).

Errores de negocio: el frontend lee el código desde `{ code }`, `{ detail: { code } }` o `{ detail: "CODE" }` (`src/services/apiErrors.js`). Mientras dure la transición, `GET /recompensas/creditos` también acepta la forma anterior (`current`, `nextReward`), que se normaliza en `rewardsApi.js`.

### D11. Implementación del backend (`panacea-socios-backend`)
- Modelos en `app/models/puntos.py`, migración Alembic `0004_sistema_puntos`, lógica en `app/services/puntos.py` y routers `recompensas`, `canjes`, `admin_puntos` y `jobs`.
- **Fechas**: la vigencia de reglas y beneficios usa la fecha local `America/Argentina/Cordoba`. En reglas `vigente_hasta` es exclusivo (= inicio de la siguiente); en beneficios es inclusivo. Los timestamps se guardan en UTC naive (igual que `registro_ventas.fecha`) y se exponen con sufijo `Z`.
- **Rol**: `es_admin` = email en `ADMIN_EMAILS` (mismo criterio que `require_admin`).
- **Jobs**: el backend corre en Vercel (serverless), así que el job diario es un Vercel Cron (`vercel.json`, 06:00 UTC = 03:00 AR) contra `GET /jobs/diario`: vence cupones, expira puntos y concilia `saldo_puntos` contra el ledger (diario en lugar de semanal: es una sola consulta agregada).
- **Expiración**: se calcula con `meses_expiracion_puntos` vigente al correr el job (cambiar el parámetro afecta también a los puntos ya acumulados). Los créditos (`ACUMULACION`, `AJUSTE` positivo, `MIGRACION`) vencen a los N meses de su `creado_en`.
- **Máquina**: cada jugada descuenta `costo_juego_maquina` y siempre emite un cupón de un beneficio disponible elegido al azar (consume stock).
- **Canje**: además del snapshot de costo y %, se guarda `titulo` (nombre del beneficio).
- **Migración histórica**: `scripts/migrar_puntos_historicos.py` (simula por defecto; `--aplicar` para confirmar). Modo `historico`: carga reglas pasadas desde un CSV y genera la `ACUMULACION` de cada venta con su regla. Modo `bono`: un `MIGRACION` fijo por socio con compras. Los movimientos quedan con fecha del día de la migración para que no venzan de inmediato. Los "créditos" temporales no tenían datos en el backend (eran el total comprado calculado en el frontend), así que no hay saldo que migrar.
- **Registro de compras con cupón**: se hace en `panacea-socios` (`VentasPage`), con validación previa (`GET /canjes/{codigo}`) y vista del total con descuento.

## Risks / Trade-offs

- [`POST /ventas/` solo exige un JWT de cualquier socio: con puntos de por medio, un socio podría registrarse compras y acumular puntos] → Restringir el registro de ventas a operadores (`require_admin` u otro rol) antes de habilitar el programa en producción.
- [Editar el importe de una venta (`PUT /ventas/{id}`) no recalcula sus puntos] → Es coherente con "nunca se recalculan"; para corregir, anular la venta (revierte puntos) y registrarla de nuevo, o hacer un ajuste.

- [El frontend oculta "Maestro", pero eso no es seguridad] → El backend valida el rol en todos los endpoints `/admin/*`.
- [Pasivo creciente de puntos no canjeados] → Expiración configurable y reportes de saldo total en circulación (fase 2).
- [Si alguien olvida actualizar la tasa, los puntos se vuelven "baratos"] → La pantalla de conversión muestra la antigüedad de la regla vigente y un aviso si tiene más de 90 días.
- [El `saldo_puntos` cacheado se desincroniza del ledger] → Se actualiza en la misma transacción, con un job semanal de conciliación que alerta si hay diferencias.
- [Un reverso de compra deja el saldo negativo] → Se acepta y se bloquean canjes y juegos mientras el saldo sea menor o igual a 0.
- [Los cupones vencidos se pierden y eso puede generar reclamos] → Se muestran los días restantes en la wallet; recordatorio push o email en fase 2.

## Migration Plan

1. Backend: crear las tablas y cargar una regla inicial y `config_programa`.
2. Compras históricas: crear reglas retroactivas por período (solo por script, no desde la UI) y generar `ACUMULACION` para cada compra según su fecha. Alternativa: un único `MIGRACION` con un bono por socio. **A definir con negocio.**
3. Créditos temporales: convertir el saldo actual de cada socio en un movimiento `MIGRACION`.
4. Desplegar el backend con los endpoints nuevos y, en paralelo, mantener la forma anterior de `/recompensas/creditos` (`current`, `nextReward`) hasta desplegar el frontend.
5. Desplegar el frontend.
6. Rollback: el frontend vuelve a la versión anterior; las tablas nuevas no afectan las compras existentes.

## Open Questions

- ¿Se migran las compras históricas con tasas por período o con un bono único?
- ¿Cuántos meses de vigencia tienen los puntos? (12 sugerido)
- ¿Qué ocurre con el cupón cuando se anula una compra que lo usó? Se propone que se pierda.
- ~~¿El rol de administrador ya existe en el backend?~~ Sí: `ADMIN_EMAILS`.
- ¿Quién puede registrar ventas? Hoy cualquier socio autenticado (ver riesgos).
- ¿Las promociones existentes (`/recompensas/promociones`) se unifican con los beneficios o siguen siendo solo informativas?
