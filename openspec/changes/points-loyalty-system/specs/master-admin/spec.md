## ADDED Requirements

### Requirement: Menú "Maestro" restringido a administradores
El menú lateral SHALL mostrar un grupo "Maestro" con las opciones "Beneficios", "Tabla de conversión" y "Configuración" solo a usuarios con rol de administrador (`es_admin` en `GET /socios/me`). Las rutas `/maestro/*` MUST redirigir a `/` a los usuarios sin ese rol. El backend MUST rechazar con 403 todo endpoint `/admin/*` invocado sin rol de administrador.

#### Scenario: Administrador ve el menú
- **WHEN** inicia sesión un usuario con `es_admin = true`
- **THEN** el menú lateral muestra el grupo "Maestro" con sus tres opciones

#### Scenario: Socio no ve el menú
- **WHEN** inicia sesión un usuario sin rol de administrador
- **THEN** el grupo "Maestro" no se muestra y, si navega a `/maestro/beneficios`, se lo redirige a `/`

### Requirement: Pantalla de beneficios
La pantalla `/maestro/beneficios` SHALL listar los beneficios en una grilla (nombre, costo en puntos, % de descuento, tope, stock, vigencia, estado y canjes realizados) y permitir crearlos, editarlos y activarlos o desactivarlos mediante un formulario modal con validación.

#### Scenario: Alta de beneficio
- **WHEN** el administrador completa el formulario con nombre, costo en puntos, % de descuento y días de validez, y guarda
- **THEN** se llama a `POST /admin/beneficios`, el beneficio aparece en la grilla y se muestra un toast de éxito

#### Scenario: Validación de formulario
- **WHEN** el % de descuento está fuera de (0, 100] o el costo en puntos es ≤ 0
- **THEN** el formulario muestra el error en el campo y no se envía

#### Scenario: Desactivar en lugar de borrar
- **WHEN** el administrador desactiva un beneficio que tiene canjes
- **THEN** el beneficio deja de mostrarse a los socios y los cupones ya emitidos siguen siendo válidos; no existe borrado físico

### Requirement: Pantalla de tabla de conversión
La pantalla `/maestro/conversion` SHALL mostrar la regla vigente destacada y el historial de reglas (monto por punto, multiplicador, tope, vigencia, motivo y autor), y permitir crear una nueva regla con fecha de inicio igual o posterior a hoy y un motivo obligatorio. Las reglas existentes son de solo lectura.

#### Scenario: Nueva regla por inflación
- **WHEN** el administrador crea una regla con $150 por punto, desde el 01/12 y con el motivo "Ajuste inflación"
- **THEN** se llama a `POST /admin/reglas-puntos`, la regla anterior se muestra cerrada al 01/12 y la nueva figura como programada o vigente

#### Scenario: Simulador
- **WHEN** el administrador ingresa un monto de ejemplo en el formulario
- **THEN** la pantalla muestra cuántos puntos generaría ese monto con la regla vigente y con la nueva

### Requirement: Pantalla de configuración del programa
La pantalla `/maestro/configuracion` SHALL permitir editar los parámetros globales del programa: `meses_expiracion_puntos`, `costo_juego_maquina` y `programa_activo`.

#### Scenario: Guardar configuración
- **WHEN** el administrador cambia `meses_expiracion_puntos` a 12 y guarda
- **THEN** se llama a `PUT /admin/configuracion` y se muestra un toast de éxito

### Requirement: Ajuste manual de puntos
Desde "Maestro", el administrador SHALL poder registrar un ajuste de puntos (positivo o negativo) para un socio, buscándolo por DNI o por nombre, con un motivo obligatorio.

#### Scenario: Ajuste positivo
- **WHEN** el administrador registra +200 puntos a un socio con el motivo "Compensación reclamo"
- **THEN** se llama a `POST /admin/ajustes-puntos` y se registra un movimiento `AJUSTE` de +200
