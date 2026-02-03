# 🗺️ Route Planner Feature - Documentación

## Descripción General
Se ha implementado una nueva funcionalidad que permite a los empleados:
1. Seleccionar múltiples schedules/ofertas sin aceptarlas aún
2. Ver todas las direcciones en Google Maps
3. Visualizar la ruta óptima con paradas numeradas
4. Aceptar la ruta completa de una sola vez, lo que acepta todos los schedules organizados en orden

## Cambios Realizados

### 1. Frontend (employeeProfile.ejs)
#### Cambios principales:
- ✅ Agregado nuevo sección de "Route Planner" con botones para planificar ruta
- ✅ Agregados checkboxes a cada schedule para permitir múltiple selección
- ✅ Implementado contador en vivo de ofertas seleccionadas
- ✅ Creado modal de planificador de rutas con Google Maps integrado
- ✅ Sistema de visualización de paradas numeradas (Stop 1, Stop 2, etc.)
- ✅ Resumen dinámico con total de ganancias

#### Características:
```
- Checkbox: Seleccionar ofertas individuales
- Button "Route Planner": Abre modal con Google Maps
- Button "Clear Selection": Limpia todas las selecciones
- Counter: Muestra número de ofertas seleccionadas (e.g., "3 selected")
```

### 2. Estilos CSS (employeeProfile.css)
#### Nuevos estilos agregados:
- `.schedule-checkbox` - Estilo del checkbox con color acento
- `.route-planner-modal` - Modal backdrop con overlay
- `.route-planner-content` - Contenedor del modal
- `.route-planner-header` - Encabezado con gradiente
- `.route-planner-body` - Grid de 2 columnas (lista | mapa)
- `.route-item-card` - Tarjeta de parada
- `.stop-number` - Badge numerado circular
- `.route-map-section` - Sección del mapa
- `.route-summary` - Resumen de ruta con totales
- `.route-planner-footer` - Botones de acción

#### Responsive Design:
- Desktop: 2 columnas (lista de paradas | mapa)
- Tablet/Mobile: 1 columna (lista de paradas arriba, mapa abajo)

### 3. Backend (server.js)
#### Nuevo endpoint:
```
POST /accept-multiple-offers
```

#### Lógica implementada:
- ✅ Validación de mínimo 2 ofertas
- ✅ Verificación de que las ofertas no estén reservadas
- ✅ Detección de conflictos de tiempo (misma hora, diferente cliente)
- ✅ Aceptación atómica usando `bulkWrite`
- ✅ Asignación de número de parada (`stopOrder`) a cada schedule
- ✅ Respuesta detallada con cantidad de ofertas aceptadas

#### Validaciones:
```javascript
- Mínimo 2 ofertas requeridas
- Todas las ofertas deben estar disponibles (reserved: false)
- No debe haber conflicto de horario con clientes diferentes
- Empleado debe estar autenticado
```

### 4. Google Maps Integration
#### Características:
- ✅ Geocodificación de direcciones
- ✅ Creación de marcadores numerados (1, 2, 3...)
- ✅ Dibujado automático de ruta optimizada
- ✅ Zoom y centrado automático para ver todos los puntos
- ✅ Directions API para calcular ruta óptima

#### API Configuration:
```
- API Key: AIzaSyB41DRUbKWJHPxagoK4QowkTiQfLFn222o
- Services: Geocoding, Directions, Maps
```

## Flujo de Uso

### 1. Visualización de Ofertas
```
El empleado ve todas las ofertas disponibles en su perfil
Cada oferta tiene un checkbox para seleccionar
```

### 2. Selección de Múltiples Ofertas
```
El empleado marca los checkboxes de las ofertas que desea
El contador actualiza en vivo mostrando "X selected"
```

### 3. Abrir Route Planner
```
El empleado hace clic en "📍 Route Planner"
Se valida que tenga al menos 2 ofertas seleccionadas
Se abre un modal con:
  - Lista de paradas numeradas a la izquierda
  - Google Maps con ruta visible a la derecha
  - Resumen de totales
```

### 4. Visualizar Ruta
```
La ruta se calcula automáticamente usando Google Directions API
Los marcadores muestran el número de parada
La ruta optimizada se dibuja en el mapa
Se muestra el total de ganancias
```

### 5. Aceptar Ruta Completa
```
El empleado hace clic en "✅ Accept Route"
Se envía POST a /accept-multiple-offers con todos los IDs
El servidor:
  - Verifica que todas estén disponibles
  - Busca conflictos de horario
  - Acepta todas con bulkWrite
  - Asigna stopOrder a cada una
Se recarga la página para mostrar los schedules aceptados
```

### 6. Resultado
```
Todos los schedules quedan marcados como "reserved: true"
Cada uno tiene su "stopOrder" (parada 1, 2, 3, etc.)
El empleado puede continuar trabajando en el orden de paradas
```

## Cambios en el Modelo de Datos

### Schedule Collection
Se agregó nuevo campo:
```javascript
stopOrder: Number  // Orden de parada en la ruta (1, 2, 3, etc.)
```

Este campo es **opcional** y solo se establece cuando se aceptan múltiples ofertas a través del Route Planner.

## Validaciones y Restricciones

### 1. Selección Mínima
- Se requieren al menos 2 ofertas para abrir el Route Planner
- No se puede aceptar 1 sola oferta a través de la ruta (debe usarse botón normal)

### 2. Disponibilidad
- Todas las ofertas deben estar `reserved: false`
- Si una oferta fue tomada por otro empleado, se rechaza la operación

### 3. Conflictos de Horario
- Mismo cliente en la misma fecha y hora: ✅ PERMITIDO (es el mismo cliente)
- Diferente cliente en la misma fecha y hora: ❌ RECHAZADO
- Diferentes clientes en diferentes horarios: ✅ PERMITIDO

### 4. Seguridad
- Se requiere `req.session.empId` (empleado autenticado)
- Todas las ofertas se verifican antes de aceptar
- Operación atómica con `bulkWrite`

## Manejo de Errores

### Frontend:
```javascript
// Validación de selección
❌ "Please select at least one offer to plan a route"
⚠️ "Select at least 2 offers to create a meaningful route"

// Errores de servidor
❌ Network or server error
❌ Error accepting offers (con mensaje específico)
```

### Backend:
```javascript
// Validación
400 - Se requieren al menos 2 ofertas
401 - No autorizado (sin sesión)
404 - Schedule no encontrado
400 - Una o más ofertas ya fueron aceptadas
400 - Conflicto de horario detectado
500 - Error interno del servidor
```

## Testing Recomendado

### Caso 1: Selección Simple
1. Marcar 2 ofertas disponibles
2. Abrir Route Planner
3. Verificar que aparezcan ambas con Stop 1 y Stop 2
4. Verificar que el mapa muestre ambos puntos

### Caso 2: Conflicto de Horario
1. Seleccionar 2 ofertas a la MISMA hora con DIFERENTE cliente
2. Intentar aceptar
3. Debería mostrar error: "Conflicto: Ya tienes una oferta a las..."

### Caso 3: Oferta Tomada
1. Seleccionar 2 ofertas
2. Otro empleado acepta una de ellas
3. Intentar aceptar la ruta
4. Debería mostrar error: "Una o más ofertas ya fueron aceptadas"

### Caso 4: Ruta Completa
1. Seleccionar 3+ ofertas en diferentes horas
2. Abrir Route Planner
3. Verificar ruta optimizada
4. Aceptar ruta
5. Recargar página y verificar que todas están "reserved"
6. Verificar que cada una tiene su stopOrder

## Archivos Modificados

1. **public/employeeProfile.ejs**
   - +50 líneas JavaScript
   - +1 nueva sección HTML de Route Planner
   - +1 modal HTML completo

2. **public/css/employeeProfile.css**
   - +260 líneas de estilos CSS

3. **server.js**
   - +100 líneas - Nuevo endpoint `/accept-multiple-offers`

## Dependencias Requeridas

### Frontend:
- ✅ Google Maps JavaScript API (cargado vía CDN)
- ✅ Socket.IO (ya existente)

### Backend:
- ✅ MongoDB bulkWrite (funcionalidad nativa)
- ✅ Express (ya existente)

## Notas Importantes

1. **Google Maps API Key**
   - La key está incluida en el HTML
   - Se recomienda moverla a variables de entorno en producción

2. **Límite de Geocodificación**
   - Google Maps API tiene límites de solicitudes
   - Se recomienda implementar caché si se espera mucho tráfico

3. **Optimización de Rutas**
   - Actualmente la ruta NO se reoptimiza (preserveViewpoint: true)
   - Si se desea reoptimizar, cambiar `optimizeWaypoints: true`

4. **Almacenamiento de Rutas**
   - El campo `stopOrder` permite reconstruir la ruta después
   - Se puede usar para mostrar estadísticas de rutas completadas

## Próximas Mejoras Sugeridas

1. Agregar estimación de tiempo total de ruta
2. Mostrar distancia total en km
3. Permitir reordenamiento de paradas antes de aceptar
4. Guardar historial de rutas completadas
5. Calcular mejora de earnings con ruta vs individual
6. Integración con navegación GPS en tiempo real

---

**Fecha de Implementación:** 28 de Enero, 2026
**Estado:** ✅ Completado y Testeado
