## ADDED Requirements

### Requirement: Catálogo de beneficios
El sistema SHALL mantener un catálogo de beneficios. Cada beneficio tiene `nombre`, `descripcion`, `imagen_url`, `costo_puntos` (> 0), `porcentaje_descuento` (> 0 y ≤ 100), `tope_descuento` opcional en $, `dias_validez_cupon` (> 0), `limite_por_socio` opcional, `stock` opcional (nulo = ilimitado), `vigente_desde`, `vigente_hasta` opcional y `activo`.

#### Scenario: Catálogo visible al socio
- **WHEN** el socio consulta `GET /recompensas/beneficios`
- **THEN** recibe solo los beneficios activos, vigentes y con stock disponible, cada uno con un indicador `canjeable` según su saldo y su límite por socio

#### Scenario: Sección "Canjear puntos" en la home
- **WHEN** el socio abre la home de recompensas
- **THEN** ve el catálogo con nombre, % de descuento, costo en puntos y un botón "Canjear" que se deshabilita si no le alcanza el saldo

### Requirement: Canje de beneficio con descuento de puntos
Al canjear un beneficio (`POST /recompensas/beneficios/{id}/canjear`), el sistema SHALL, en una única transacción: validar vigencia, stock, límite por socio y saldo; crear un canje (cupón) con código único y un snapshot de `costo_puntos`, `porcentaje_descuento` y `tope_descuento`; registrar un movimiento `CANJE` por `-costo_puntos`; y decrementar el stock. Las validaciones MUST hacerse con el socio bloqueado, para impedir canjes concurrentes sobre el mismo saldo.

#### Scenario: Canje exitoso
- **WHEN** un socio con 600 puntos canjea un beneficio de 500 puntos con 15% de descuento
- **THEN** se crea un cupón en estado `EMITIDO` que vence a los `dias_validez_cupon` días, se registra `CANJE` por -500 y el saldo queda en 100

#### Scenario: Saldo insuficiente
- **WHEN** el saldo del socio es menor que `costo_puntos`
- **THEN** el canje se rechaza con `SALDO_INSUFICIENTE` y no se crea el cupón

#### Scenario: Límite por socio alcanzado
- **WHEN** el socio ya canjeó el beneficio `limite_por_socio` veces
- **THEN** el canje se rechaza con `LIMITE_ALCANZADO`

#### Scenario: Sin stock
- **WHEN** el stock del beneficio es 0
- **THEN** el canje se rechaza con `SIN_STOCK`

#### Scenario: Canjes simultáneos
- **WHEN** el mismo socio envía dos canjes concurrentes cuyo costo total supera su saldo
- **THEN** solo uno se completa y el otro se rechaza con `SALDO_INSUFICIENTE`

#### Scenario: Cambio posterior del beneficio
- **WHEN** un administrador modifica el % o el costo de un beneficio después de un canje
- **THEN** los cupones ya emitidos conservan los valores del snapshot

### Requirement: Vencimiento de cupones sin devolución
Un proceso diario SHALL marcar como `EXPIRADO` todo cupón `EMITIDO` cuya fecha `expira_en` haya pasado. Los puntos de un cupón vencido MUST NOT devolverse.

#### Scenario: Cupón vencido
- **WHEN** un cupón `EMITIDO` llega a su fecha de vencimiento sin usarse
- **THEN** pasa a `EXPIRADO` y no se registra ningún movimiento de puntos

### Requirement: Aplicación de un único cupón por compra
Al registrar una compra, el sistema SHALL aceptar como máximo un código de cupón. El cupón MUST pertenecer al socio de la compra, estar `EMITIDO` y no estar vencido. El descuento es `min(monto_bruto × porcentaje / 100, tope_descuento)`. El cupón pasa a `USADO` con `compra_id`, `monto_descontado` y `usado_en`.

#### Scenario: Aplicación válida
- **WHEN** se registra una compra de $10.000 con un cupón del 15% con tope de $1.000
- **THEN** el descuento es $1.000, el cupón queda `USADO` y la compra se registra con un monto neto de $9.000

#### Scenario: Más de un cupón
- **WHEN** la solicitud de compra incluye más de un cupón
- **THEN** se rechaza con `UN_CUPON_POR_COMPRA`

#### Scenario: Cupón inválido
- **WHEN** el cupón es de otro socio, ya se usó o está vencido
- **THEN** se rechaza con `CUPON_INVALIDO` y la compra no se registra

#### Scenario: Validación previa en caja
- **WHEN** el operador consulta `GET /canjes/{codigo}?socio_id=X&monto=Y`
- **THEN** recibe si el cupón es válido y el descuento calculado, sin modificar su estado

### Requirement: Wallet de cupones del socio
`GET /recompensas/cupones` SHALL devolver los canjes del socio con su estado (`EMITIDO` se muestra como ACTIVE, `USADO` como USED y `EXPIRADO` como EXPIRED), título, %, vencimiento y código para el QR.

#### Scenario: Cupón recién canjeado
- **WHEN** el socio canjea un beneficio
- **THEN** el nuevo cupón aparece en la sección de cupones con estado ACTIVE y su QR disponible
