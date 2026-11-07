## ADDED Requirements

### Requirement: Ledger inmutable de movimientos de puntos
El sistema SHALL registrar todo cambio en los puntos de un socio como un movimiento en el ledger `movimientos_puntos`, con tipo, cantidad de puntos con signo (positivo acumula, negativo descuenta), referencia de origen (compra, canje, juego o ajuste), descripción visible para el socio y fecha. Los movimientos MUST NOT modificarse ni eliminarse; las correcciones se registran como movimientos nuevos.

#### Scenario: Tipos de movimiento soportados
- **WHEN** se registra un movimiento
- **THEN** su tipo es uno de `ACUMULACION`, `CANJE`, `JUEGO`, `REVERSO_COMPRA`, `EXPIRACION`, `AJUSTE` o `MIGRACION`

#### Scenario: Corrección sin edición
- **WHEN** un administrador necesita corregir un saldo
- **THEN** el sistema registra un movimiento `AJUSTE` con un motivo obligatorio y no altera los movimientos existentes

### Requirement: Saldo derivado del ledger
El saldo de puntos de un socio SHALL ser igual a la suma de los puntos de todos sus movimientos. El saldo MUST NOT ser negativo como resultado de un canje o un juego.

#### Scenario: Consulta de saldo
- **WHEN** el socio consulta `GET /recompensas/creditos`
- **THEN** la respuesta incluye `saldo` igual a la suma de sus movimientos, `por_vencer` con los puntos que vencen en los próximos 30 días y su fecha más próxima, y `proxima_recompensa` con el costo del beneficio activo más barato que aún no alcanza

#### Scenario: Saldo insuficiente
- **WHEN** una operación de descuento dejaría el saldo por debajo de cero
- **THEN** la operación se rechaza con error `SALDO_INSUFICIENTE` y no se registra ningún movimiento

### Requirement: Idempotencia por origen
El sistema SHALL garantizar como máximo un movimiento por combinación (origen, tipo). Por ejemplo, una compra genera como máximo un movimiento `ACUMULACION` y un `REVERSO_COMPRA`.

#### Scenario: Reintento de acumulación
- **WHEN** el proceso de generación de puntos se ejecuta dos veces para la misma compra
- **THEN** existe un único movimiento `ACUMULACION` para esa compra

### Requirement: Expiración de puntos
Los puntos acumulados SHALL vencer después de la cantidad de meses configurada en `config_programa.meses_expiracion_puntos`. Un proceso diario MUST registrar un movimiento `EXPIRACION` por los puntos vencidos que no se consumieron. Los consumos se imputan primero a los puntos que vencen antes (FIFO).

#### Scenario: Puntos vencidos sin consumir
- **WHEN** un socio acumuló 100 puntos hace más de N meses y consumió 30 desde entonces
- **THEN** el proceso diario registra `EXPIRACION` por -70 puntos

#### Scenario: Expiración deshabilitada
- **WHEN** `meses_expiracion_puntos` es nulo o 0
- **THEN** no se generan movimientos de expiración

### Requirement: Reverso de puntos por anulación de compra
Cuando una compra que generó puntos se anula o se devuelve, el sistema SHALL registrar un movimiento `REVERSO_COMPRA` por el negativo exacto de los puntos acumulados originalmente, sin recalcularlos con la regla actual.

#### Scenario: Devolución de compra
- **WHEN** se anula una compra que generó +120 puntos
- **THEN** se registra un `REVERSO_COMPRA` de -120 puntos que referencia esa compra

#### Scenario: Reverso con saldo insuficiente
- **WHEN** el socio ya gastó esos puntos y el reverso dejaría su saldo negativo
- **THEN** el reverso se registra igualmente y el saldo puede quedar negativo; ese socio no puede canjear ni jugar hasta que su saldo vuelva a ser positivo

### Requirement: Historial de actividad
El sistema SHALL exponer los movimientos del socio, ordenados del más reciente al más antiguo, a través de `GET /recompensas/actividad`.

#### Scenario: Visualización en la home
- **WHEN** el socio abre la home de recompensas
- **THEN** la sección de actividad muestra cada movimiento con su descripción, sus puntos con signo (verde si suman, rojo si restan) y su fecha
