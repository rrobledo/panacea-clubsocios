## 1. Contrato y coordinación con backend

- [x] 1.1 Compartir con el equipo de backend la tabla de endpoints de design.md (D10), el modelo de datos (D1–D8) y las preguntas abiertas (implementado directamente en `panacea-socios-backend`, ver D11)
- [x] 1.2 Confirmar que `GET /socios/me` expone `es_admin` y que los endpoints `/admin/*` validan el rol (403) (`es_admin` según `ADMIN_EMAILS`)
- [ ] 1.3 Definir con negocio la estrategia de migración histórica, los meses de expiración y la regla inicial (monto por punto)

## 2. Backend (`panacea-socios-backend`)

- [x] 2.1 Crear las tablas `reglas_puntos`, `movimientos_puntos` (con índices únicos parciales), `beneficios`, `canjes`, `config_programa` y la columna `socios.saldo_puntos`
- [x] 2.2 Generar `ACUMULACION` en `POST /ventas/` con la regla vigente, aplicar `cupon_codigo` (un solo cupón) y devolver `puntos_generados`
- [x] 2.3 Implementar el canje transaccional con `FOR UPDATE` y los errores `SALDO_INSUFICIENTE`, `LIMITE_ALCANZADO` y `SIN_STOCK`
- [x] 2.4 Agregar `REVERSO_COMPRA` al anular o devolver compras
- [x] 2.5 Crear los jobs diarios de vencimiento de cupones (sin devolución) y de expiración de puntos FIFO, y el job semanal de conciliación de saldo (Vercel Cron diario en `/jobs/diario`; la conciliación también corre a diario)
- [x] 2.6 Hacer que la máquina de premios registre `JUEGO` con `costo_juego_maquina`
- [x] 2.7 Implementar los endpoints `/recompensas/*`, `/canjes/{codigo}` y `/admin/*` según el contrato
- [x] 2.8 Escribir los scripts de migración: compras históricas y créditos temporales → `MIGRACION` (`scripts/migrar_puntos_historicos.py`; los créditos temporales no tenían datos en el backend)
- [x] 2.9 Pruebas de integración (`tests/test_puntos.py`, 26 casos) contra un PostgreSQL local

## 3. Servicios y autenticación en el frontend

- [x] 3.1 Agregar a `src/services/rewardsApi.js` las funciones `getBenefits`, `redeemBenefit(id)` y `getCurrentRule`, y adaptar `getCredits`/`getActivity` a la nueva forma de respuesta
- [x] 3.2 Crear `src/services/adminApi.js` con las funciones de beneficios (list, create, update), reglas de puntos (list, create), configuración (get, put) y `createAdjustment`
- [x] 3.3 Agregar `validateCoupon(codigo, socioId, monto)` en `sociosApi.js` y aceptar `cupon_codigo` en `registrarVenta`
- [x] 3.4 Exponer `user.es_admin` en `AuthContext` (desde `getMe`) y crear el guard `AdminRoute`

## 4. Navegación "Maestro"

- [x] 4.1 Agregar en `AppLayout.jsx` el grupo "Maestro" (Beneficios, Tabla de conversión, Configuración, Ajustes de puntos), visible solo si `es_admin`
- [x] 4.2 Registrar las rutas `/maestro/beneficios`, `/maestro/conversion`, `/maestro/configuracion` y `/maestro/ajustes` en `App.jsx` con `AdminRoute` (redirigir a `/` si no es admin)

## 5. Pantallas Maestro

- [x] 5.1 `BeneficiosPage`: grilla con `DataGrid` (nombre, puntos, %, tope, stock, vigencia, estado, canjes) y botón "Nuevo beneficio"
- [x] 5.2 Modal de alta y edición de beneficio con `react-hook-form`: validar % en (0, 100], puntos > 0, días > 0 y fechas coherentes; mostrar toasts de éxito y error
- [x] 5.3 Activar o desactivar un beneficio con `ConfirmDialog` (sin borrado físico)
- [x] 5.4 `ConversionPage`: tarjeta de la regla vigente (con aviso si tiene más de 90 días), historial de solo lectura y formulario de nueva regla (fecha ≥ hoy, motivo obligatorio)
- [x] 5.5 Simulador en `ConversionPage`: monto de ejemplo → puntos con la regla vigente y con la nueva
- [x] 5.6 `ConfiguracionPage`: formulario de `meses_expiracion_puntos`, `costo_juego_maquina` y `programa_activo`
- [x] 5.7 `AjustesPage`: buscar socio por DNI o nombre (reutilizar `buscarPorDni`/`buscarPorNombre`), ver su saldo y registrar un ajuste ± con motivo obligatorio

## 6. Home de recompensas (socio)

- [x] 6.1 `CreditsCard`: cambiar "Créditos" por "Puntos", usar `saldo` y `proxima_recompensa` y mostrar el aviso de `por_vencer`
- [x] 6.2 Nuevo `BenefitsSection` (carrusel en mobile, grilla en desktop) con tarjeta de beneficio: %, puntos y botón "Canjear" deshabilitado si `!canjeable`
- [x] 6.3 Modal de confirmación de canje: llamar a `redeemBenefit`, refrescar saldo, cupones y actividad, y mostrar mensajes para `SALDO_INSUFICIENTE`, `LIMITE_ALCANZADO` y `SIN_STOCK`
- [x] 6.4 `CouponsSection`/`CouponCard`: mapear los estados del canje y mostrar el % de descuento y el código en el QR
- [x] 6.5 `ActivitySection`/`Timeline`: mostrar puntos con signo y color según el tipo de movimiento
- [x] 6.6 `RewardMachineCard`: textos en "puntos" y costo obtenido de la configuración

## 7. Registro de compra con cupón

- [x] 7.1 (en `panacea-socios`, `VentasPage`) En el flujo que usa `registrarVenta`, agregar un campo opcional "Código de cupón" (uno solo) con validación previa mediante `validateCoupon` y vista del descuento
- [x] 7.2 Mostrar el monto neto y los `puntos_generados` en la confirmación de la compra

## 8. Verificación

- [x] 8.1 `npm run lint` y `npm run build` sin errores (sin errores nuevos de lint; los 17 errores y 9 advertencias preexistentes quedan fuera del alcance)
- [ ] 8.2 (requiere el backend desplegado en un entorno de prueba) Probar manualmente como admin: crear beneficio, crear regla futura, editar configuración y registrar un ajuste
- [ ] 8.3 Probar manualmente como socio: ver saldo, canjear con y sin saldo suficiente y ver el cupón y la actividad; verificar que "Maestro" no aparece y que `/maestro/*` redirige
