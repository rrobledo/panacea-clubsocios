## Why

Hoy se registra el monto de cada compra y los "créditos" que muestra la home de recompensas son una implementación temporal sin reglas de negocio. Con la inflación, cualquier conversión monto→puntos calculada "en vivo" desvirtúa los saldos históricos. Necesitamos un sistema de puntos real: los puntos se generan **una sola vez** a partir de la compra registrada, según una tabla de conversión versionada, y se descuentan al canjear beneficios configurables (descuento porcentual), todo registrado en un mismo ledger auditable.

## What Changes

- **BREAKING**: Los "créditos" pasan a ser **puntos** respaldados por un ledger inmutable de movimientos. `GET /recompensas/creditos` y `GET /recompensas/actividad` cambian de forma de respuesta (saldo y puntos por vencer; movimientos del ledger). La UI renombra "Créditos" → "Puntos".
- Nueva **tabla de conversión versionada** (`reglas_puntos`): monto por punto, multiplicador, tope por compra y vigencia. Al registrarse una compra, el backend genera los puntos con la regla vigente a la fecha de la compra; nunca se recalculan.
- Nuevo **catálogo de beneficios**: nombre, descripción, imagen, costo en puntos, % de descuento, tope de descuento en $, días de validez del cupón, límite por socio, stock, vigencia y estado activo.
- Nuevo flujo de **canje**: el socio canjea un beneficio y los puntos se descuentan en ese momento (movimiento `CANJE` en el ledger). Se emite un cupón con un snapshot del costo y el porcentaje. **Los cupones vencidos sin usar se pierden** (no devuelven puntos).
- **Aplicación de cupón en compra**: como máximo **un cupón por compra**. El descuento es `min(monto × % / 100, tope)`.
- **Expiración de puntos** configurable (movimiento `EXPIRACION`, FIFO) y **reverso** de puntos ante anulación o devolución de compra.
- Nueva sección de menú **"Maestro"** (solo administradores) con pantallas de alta, baja y modificación de beneficios, gestión de la tabla de conversión y configuración general del programa.
- La home de recompensas agrega un catálogo "Canjear puntos". La wallet de cupones existente pasa a mostrar los canjes reales.
- La máquina de premios existente consume puntos del mismo ledger (movimiento `JUEGO`), en lugar de un saldo propio.

## Capabilities

### New Capabilities
- `points-ledger`: ledger inmutable de movimientos de puntos (tipos, saldo, idempotencia, expiración, reversos, historial de actividad).
- `points-conversion-rules`: tabla de conversión versionada y generación de puntos a partir de la compra registrada.
- `benefits-redemption`: catálogo de beneficios, canje con descuento de puntos, emisión de cupones, vencimiento sin devolución y aplicación de un cupón por compra.
- `master-admin`: menú "Maestro" restringido a administradores, con pantallas de beneficios, tabla de conversión y configuración del programa.

### Modified Capabilities
(ninguna: `openspec/specs/` está vacío. El change `rewards-home-redesign` todavía no se archivó; en este change se ajustan sus pantallas de créditos, cupones y máquina para que usen el ledger.)

## Impact

- **Backend (servicio separado)**: nuevas tablas (`reglas_puntos`, `movimientos_puntos`, `beneficios`, `canjes`, `config_programa`), hook en el registro de compras (`POST /ventas/`), jobs diarios de expiración y nuevos endpoints. Este repo define el **contrato de API** que el backend debe implementar.
- **Frontend**:
  - `src/services/rewardsApi.js`: nuevas llamadas para beneficios y canje.
  - Nuevo `src/services/adminApi.js`.
  - `src/components/rewards/*`: `CreditsCard` pasa a mostrar puntos, `CouponsSection` y `ActivitySection` se adaptan, y se agrega `BenefitsSection`.
  - Nuevas páginas en `src/pages/maestro/*`.
  - `App.jsx`: rutas `/maestro/*` con guard de rol.
  - `AppLayout.jsx`: grupo de menú "Maestro".
- **Autenticación**: requiere que `GET /socios/me` exponga el rol del usuario (p. ej. `es_admin`) para mostrar u ocultar "Maestro". El backend debe validar el rol de forma independiente.
- **Datos existentes**: migración única de las compras históricas a puntos y de los créditos temporales al ledger (estrategia en `design.md`).
- **Dependencias**: ninguna nueva.
