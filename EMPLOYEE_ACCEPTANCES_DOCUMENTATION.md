# 📊 Reporte de Aceptaciones de Empleados - Documentación

## Descripción General

Se ha implementado un sistema completo para registrar y reportar todas las aceptaciones de ofertas y horarios que realizan los empleados en la plataforma Luber. Esto permite a los administradores monitorear y gestionar quién acepta qué ordenes, cuándo, y en qué estado se encuentran.

## Cambios Implementados

### 1. Nuevo Modelo: EmployeeAcceptance
**Archivo:** `models/EmployeeAcceptance.js`

Este modelo almacena un registro detallado cada vez que un empleado acepta una oferta:

```javascript
{
  employeeId: ObjectId,           // ID del empleado
  scheduleId: ObjectId,           // ID del schedule aceptado
  employeeInfo: {                 // Snapshot de la info del empleado al aceptar
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    state: String
  },
  scheduleInfo: {                 // Detalles completos de la oferta
    date: String,
    time: String,
    customerName: String,
    vehicleType: String,
    price: Number,
    location: String,
    pickupAddress: String,
    dropoffAddress: String,
    stopOrder: Number              // Para rutas (planner)
  },
  acceptedAt: Date,               // Fecha/hora de aceptación
  acceptanceType: String,         // 'single', 'multiple', 'route-planner'
  status: String,                 // 'accepted', 'completed', 'cancelled', 'no-show'
  completedAt: Date,              // Cuando se marcó como completada
  notes: String,                  // Notas adicionales
  ipAddress: String,              // IP del cliente
  userAgent: String,              // Navegador/dispositivo
  timestamps: Boolean             // createdAt y updatedAt automáticos
}
```

### 2. Actualización del Endpoint `/accept-offer`
**Archivo:** `server.js`

**Cambio:** Ahora cuando un empleado acepta una oferta individual, se registra automáticamente en MongoDB:

```javascript
// Cuando el empleado acepta una oferta
POST /accept-offer
{
  scheduleId: "xxxxx"
}

// Se guarda un registro EmployeeAcceptance con:
// - Información completa del empleado
// - Detalles de la oferta
// - Marca de tiempo exacta
// - Tipo de aceptación: "single"
```

### 3. Actualización del Endpoint `/accept-multiple-offers`
**Archivo:** `server.js`

**Cambio:** Cuando un empleado acepta múltiples ofertas (Route Planner), se registra cada aceptación:

```javascript
POST /accept-multiple-offers
{
  scheduleIds: ["id1", "id2", "id3", ...]
}

// Se guardan múltiples registros EmployeeAcceptance con:
// - Información del empleado
// - Detalles de cada oferta
// - Orden de parada (stopOrder)
// - Tipo de aceptación: "route-planner"
```

### 4. Nuevos Endpoints de Reporte (API)

#### 4.1 Obtener todas las aceptaciones
```
GET /api/admin/employee-acceptances?status=accepted&dateFrom=2024-01-01&dateTo=2024-12-31

Parámetros:
- employeeId (opcional): Filtrar por empleado
- status (opcional): 'accepted', 'completed', 'cancelled', 'no-show'
- dateFrom (opcional): Fecha inicial YYYY-MM-DD
- dateTo (opcional): Fecha final YYYY-MM-DD

Respuesta:
{
  total: 150,
  acceptances: [
    {
      _id: "...",
      employeeInfo: {...},
      scheduleInfo: {...},
      acceptedAt: "...",
      acceptanceType: "single",
      status: "accepted"
    },
    ...
  ]
}
```

#### 4.2 Obtener aceptaciones de un empleado
```
GET /api/admin/employee-acceptances/:employeeId?status=completed

Retorna solo las aceptaciones de ese empleado con toda su información.
```

#### 4.3 Resumen agregado de aceptaciones
```
GET /api/admin/acceptances-summary?dateFrom=2024-01-01&dateTo=2024-12-31

Respuesta:
{
  total: 5,
  summary: [
    {
      _id: "employeeId",
      employeeName: "Juan",
      employeeLastName: "Pérez",
      employeeEmail: "juan@email.com",
      totalAcceptances: 45,
      totalEarnings: 1500.00,
      acceptedCount: 30,
      completedCount: 12,
      cancelledCount: 3,
      lastAcceptanceDate: "2024-12-15T10:30:00.000Z"
    }
  ]
}
```

#### 4.4 Aceptaciones agrupadas por fecha
```
GET /api/admin/acceptances-by-date?dateFrom=2024-01-01&dateTo=2024-12-31

Respuesta:
{
  total: 30,
  byDate: [
    {
      _id: "2024-12-15",
      count: 25,
      totalEarnings: 750.00,
      acceptanceTypes: ["single", "route-planner"]
    }
  ]
}
```

#### 4.5 Marcar aceptación como completada
```
POST /api/admin/acceptances/:acceptanceId/complete
{
  notes: "Completada exitosamente" (opcional)
}

Actualiza:
- status: "completed"
- completedAt: timestamp actual
```

#### 4.6 Cancelar aceptación
```
POST /api/admin/acceptances/:acceptanceId/cancel
{
  notes: "Razón de cancelación" (opcional)
}

Actualiza:
- status: "cancelled"
```

### 5. Dashboard de Reportes
**Archivo:** `public/acceptancesReport.html`

Página web completa para administradores con:

#### Pestañas:
1. **📈 Resumen**
   - Estadísticas generales
   - Total de aceptaciones
   - Ganancias totales
   - Listado de empleados con resumen de aceptaciones

2. **📋 Todas las Aceptaciones**
   - Lista completa de todas las aceptaciones
   - Filtros por estado y fecha
   - Detalles de cada aceptación
   - Vista expandida con información completa

3. **👥 Por Empleado**
   - Seleccionar un empleado específico
   - Ver todas sus aceptaciones
   - Detalles del empleado
   - Información de contacto

4. **📅 Por Fecha**
   - Agrupación por fecha
   - Total de aceptaciones por día
   - Ganancias por fecha
   - Tipos de aceptación

#### Funcionalidades:
- ✅ Filtros avanzados por fecha, estado, empleado
- ✅ Exportación a CSV
- ✅ Estadísticas en tiempo real
- ✅ Modal de detalles completos
- ✅ Marcar como completada
- ✅ Cancelar aceptación
- ✅ Interfaz responsive
- ✅ Cálculo de ganancias totales

## Cómo Usar

### Para Empleados (Automático)
Cuando un empleado acepta una oferta, automáticamente se registra en MongoDB. No requiere acción adicional.

### Para Administradores

1. **Acceder al Reporte:**
   ```
   http://localhost:3001/acceptances-report
   ```

2. **Ver Resumen General:**
   - Abre la pestaña "📈 Resumen"
   - Selecciona fechas (opcional)
   - Click en "Cargar Resumen"
   - Se muestran estadísticas de todos los empleados

3. **Buscar Aceptaciones Específicas:**
   - Abre "📋 Todas las Aceptaciones"
   - Usa filtros: estado, fecha
   - Click en "Ver" para detalles

4. **Analizar por Empleado:**
   - Abre "👥 Por Empleado"
   - Selecciona un empleado
   - Opcionalmente filtra por estado
   - Click en "Cargar"

5. **Análisis Temporal:**
   - Abre "📅 Por Fecha"
   - Selecciona rango de fechas
   - Click en "Cargar"
   - Ve tendencias

6. **Exportar Datos:**
   - En cualquier pestaña
   - Click en "📥 Descargar CSV"
   - Abre en Excel para análisis avanzado

## Estructura de Datos en MongoDB

### Collection: `employeeacceptances`

```javascript
{
  _id: ObjectId,
  employeeId: ObjectId,
  scheduleId: ObjectId,
  employeeInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    state: String
  },
  scheduleInfo: {
    date: String,
    time: String,
    customerName: String,
    customerType: String,
    vehicleType: String,
    price: Number,
    location: String,
    pickupAddress: String,
    dropoffAddress: String,
    stopOrder: Number
  },
  acceptedAt: Date,
  acceptanceType: String,  // 'single', 'multiple', 'route-planner'
  status: String,          // 'accepted', 'completed', 'cancelled', 'no-show'
  completedAt: Date (optional),
  notes: String (optional),
  ipAddress: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Índices para Rendimiento
- `employeeId + createdAt` (para consultas por empleado)
- `scheduleId` (para relaciones)
- `scheduleInfo.date` (para filtros por fecha)
- `acceptedAt` (para ordenamiento cronológico)

## Casos de Uso

### 1. Auditoría
Ver quién aceptó qué oferta y cuándo exactamente.

### 2. Análisis de Desempeño
- Total de aceptaciones por empleado
- Tasa de completación
- Ganancias por empleado

### 3. Gestión de Conflictos
Verificar si un empleado aceptó ofertas conflictivas.

### 4. Reportes Financieros
- Ganancias por período
- Ganancias por empleado
- Tendencias de aceptación

### 5. Control de Calidad
- Marcar ofertas como completadas
- Registrar cancelaciones
- Añadir notas sobre problemas

## Seguridad

- ✅ Validación de sesión en todos los endpoints
- ✅ Almacenamiento de IP y User-Agent para auditoría
- ✅ Información inmutable del empleado (snapshot al aceptar)
- ✅ Índices para consultas rápidas

## Notas Técnicas

### Campos Automáticos
- `_id`: Generado por MongoDB (ObjectId)
- `createdAt`: Automático (al insertar)
- `updatedAt`: Automático (al actualizar)
- `acceptedAt`: Generado con `Date.now()` al aceptar

### Campos Importantes
- `employeeInfo`: Snapshot inmutable de la información del empleado
- `scheduleInfo`: Detalles completos de la oferta
- `acceptanceType`: Diferencia entre aceptaciones únicas vs. rutas

## Próximas Mejoras Sugeridas

1. **Webhooks**: Notificar cuando un empleado acepta una oferta
2. **Gráficos**: Visualización de tendencias
3. **Alertas**: Notificaciones en tiempo real para cancellations
4. **Sincronización**: Integración con sistemas de contabilidad
5. **Validación**: Verificar disponibilidad antes de aceptar
6. **Historial**: Mantener historial de cambios de estado

## Troubleshooting

### Las aceptaciones no se guardan
1. Verifica que EmployeeAcceptance.js esté en `models/`
2. Asegúrate que `require('./models/EmployeeAcceptance')` esté en server.js
3. Verifica la conexión a MongoDB

### El dashboard no carga datos
1. Abre la consola del navegador (F12)
2. Revisa los errores en Network
3. Asegúrate que los empleados tengan sesión activa
4. Verifica que los endpoints devuelvan datos

### Problema con filtros de fecha
1. Usa formato YYYY-MM-DD
2. Verifica que dateFrom < dateTo
3. Las fechas sin hora se tratan como medianoche UTC

---

**Versión:** 1.0
**Fecha:** Enero 2026
**Desarrollado por:** Sistema Luber
