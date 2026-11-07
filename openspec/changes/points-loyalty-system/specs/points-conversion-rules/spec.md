## ADDED Requirements

### Requirement: Tabla de conversión versionada
El sistema SHALL mantener las reglas de conversión en `reglas_puntos`. Cada regla tiene `monto_por_punto` (> 0), `multiplicador` (por defecto 1), `tope_por_compra` opcional, `vigente_desde`, `vigente_hasta` (nulo = vigente), `motivo` y el usuario que la creó. Los períodos de vigencia MUST NOT superponerse.

#### Scenario: Alta de nueva regla
- **WHEN** un administrador crea una regla con `vigente_desde` = T
- **THEN** la regla vigente anterior se cierra con `vigente_hasta` = T y la nueva queda vigente desde T

#### Scenario: Regla con fecha pasada
- **WHEN** un administrador intenta crear una regla con `vigente_desde` anterior a la fecha actual
- **THEN** el sistema la rechaza con error `VIGENCIA_RETROACTIVA`

#### Scenario: Regla en uso no editable
- **WHEN** un administrador intenta editar `monto_por_punto`, `multiplicador` o `tope_por_compra` de una regla que ya generó movimientos
- **THEN** el sistema rechaza la edición; solo se permite crear una regla nueva

### Requirement: Generación de puntos a partir de la compra registrada
Cuando se registra una compra (`POST /ventas/`), el sistema SHALL generar los puntos con la regla vigente a la fecha de la compra, mediante la fórmula `puntos = floor(monto / monto_por_punto × multiplicador)`, limitada por `tope_por_compra` si existe. El monto base es el monto registrado de la compra (neto de cualquier descuento por cupón). El movimiento `ACUMULACION` MUST guardar `regla_id` y `monto_base`.

#### Scenario: Compra estándar
- **WHEN** se registra una compra de $2.550 y la regla vigente es $100 por punto, multiplicador 1
- **THEN** se registra un movimiento `ACUMULACION` de +25 puntos con referencia a la regla y monto base 2550

#### Scenario: Compra con tope
- **WHEN** la fórmula da 800 puntos y `tope_por_compra` es 500
- **THEN** se acumulan 500 puntos

#### Scenario: Compra menor al monto por punto
- **WHEN** el monto de la compra es menor que `monto_por_punto`
- **THEN** no se genera movimiento (0 puntos)

#### Scenario: Cambio de regla no afecta compras anteriores
- **WHEN** se crea una regla nueva con un `monto_por_punto` mayor
- **THEN** los puntos de compras anteriores no se recalculan

#### Scenario: Sin regla vigente
- **WHEN** no existe una regla vigente a la fecha de la compra
- **THEN** la compra se registra igual, no se generan puntos y el evento queda en el log para su revisión

### Requirement: Vista previa de la regla vigente
El sistema SHALL exponer la regla vigente para que la UI pueda informar al socio cuántos puntos genera cada compra.

#### Scenario: Consulta de regla vigente
- **WHEN** se consulta `GET /recompensas/regla-vigente`
- **THEN** la respuesta contiene `monto_por_punto`, `multiplicador` y `vigente_desde` de la regla actual
