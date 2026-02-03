# 📍 Guía de Rastreo de Ubicación en Tiempo Real

## ✅ ¿Qué está implementado?

El sistema de rastreo de ubicación **ya está completamente funcional**. Una vez que el empleado:
1. **Autoriza** el acceso a su ubicación GPS
2. **Acepta** una orden/servicio

El sistema automáticamente:
- ✅ Solicita la ubicación GPS de inmediato
- ✅ Repite cada **1 minuto** (60,000 ms)
- ✅ Guarda cada ubicación en **MongoDB**
- ✅ Mantiene un historial de hasta **100 ubicaciones** por servicio
- ✅ Reintentar automáticamente si falla
- ✅ Detener al cerrar la pestaña del navegador

---

## 🔄 Flujo Completo

```
1. Empleado abre orden → employeeProfile.ejs
   ↓
2. Hace clic en "Aceptar Orden"
   ↓
3. Navegador pide permiso de ubicación
   ↓
4. Empleado autoriza (click en "Permitir")
   ↓
5. Se obtiene ubicación GPS inmediatamente
   ↓
6. Se envía a server.js → /accept-offer
   ↓
7. Se guarda en MongoDB → EmployeeAcceptance
   ↓
8. Se inicia rastreo automático (startLocationTracking)
   ↓
9. CADA MINUTO por 60,000 ms:
   → Se solicita ubicación GPS nueva
   → Se envía a /update-employee-location
   → Se guarda en MongoDB con timestamp
   → Se actualiza también en Schedule
   ↓
10. Continúa hasta que:
    - Se cancela la orden
    - Se cierra el navegador
    - Falla después de múltiples reintentos
```

---

## 📁 Archivos Modificados

### 1. Frontend - `public/employeeProfile.ejs`

**Función: `startLocationTracking(scheduleId)`**
- Inicia el rastreo automático cada minuto
- Evita duplicados usando `sessionStorage`
- Llama a `updateEmployeeLocation(scheduleId)` cada 60 segundos

**Función: `updateEmployeeLocation(scheduleId)`**
- Obtiene la ubicación GPS actual
- **Reintentar hasta 3 veces** si falla
- Espera 5 segundos entre reintentos
- Envía al backend: `/update-employee-location`
- Log detallado de cada intento

**Líneas clave:**
```javascript
// Inicia rastreo al aceptar
startLocationTracking(scheduleId);

// Cada minuto (60000 ms)
const intervalId = setInterval(() => {
  updateEmployeeLocation(scheduleId);
}, 60000);
```

### 2. Backend - `server.js`

**Ruta: `POST /update-employee-location`**
- Recibe ubicación del cliente cada minuto
- Valida que las coordenadas sean válidas
- Guarda en `EmployeeAcceptance.employeeUbication`
- Agrega al historial con timestamp
- Actualiza también `Schedule.employeeLocation`
- Mantiene solo últimas 100 ubicaciones
- Respuesta con detalles

**Ejemplo de datos guardados:**
```json
{
  "employeeUbication": {
    "latitude": 40.712776,
    "longitude": -74.005974,
    "accuracy": 8.5,
    "timestamp": "2026-02-02T15:30:45.123Z",
    "locationHistory": [
      {
        "latitude": 40.712776,
        "longitude": -74.005974,
        "accuracy": 8.5,
        "timestamp": "2026-02-02T15:30:45.123Z"
      },
      {
        "latitude": 40.712800,
        "longitude": -74.005900,
        "accuracy": 7.2,
        "timestamp": "2026-02-02T15:31:45.234Z"
      }
      // ... más registros cada minuto
    ]
  }
}
```

### 3. Database - `models/EmployeeAcceptance.js`

**Campo: `employeeUbication`**
```javascript
employeeUbication: {
  latitude: Number,        // Latitud actual
  longitude: Number,       // Longitud actual
  accuracy: Number,        // Precisión en metros
  timestamp: Date,         // Cuándo se obtuvo
  locationHistory: [{      // Historial de hasta 100 ubicaciones
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  }]
}
```

---

## 🔍 Características del Rastreo

### ✅ Automático
Una vez autorizado, funciona sin intervención del usuario.

### ✅ Resiliente
- Reintenta **3 veces** si falla
- Espera 5 segundos entre intentos
- Continúa intentando cada minuto

### ✅ Preciso
- `enableHighAccuracy: true` - Usa GPS de máxima precisión
- Timeout: 30 segundos para obtener ubicación
- Sin usar posiciones en caché (`maximumAge: 0`)

### ✅ Eficiente
- Solo 1 minuto entre actualizaciones
- Historial limitado a 100 registros
- Logs organizados para debugging

### ✅ Seguro
- Requiere sesión activa (`req.session.empId`)
- Valida coordenadas
- Registra intentos fallidos

---

## 🛠️ Cómo Verificar Que Funciona

### En el Navegador (Console)

Abre la consola (F12) y verás logs como:

```
🚀 Iniciando rastreo de ubicación cada minuto para 507f1f77bcf86cd799439011
✅ Rastreo de ubicación iniciado - Intervalo: 12345
🔍 [507f1f77bcf86cd799439011] Solicitando ubicación GPS...
✅ [507f1f77bcf86cd799439011] Ubicación obtenida:
   {lat: 40.71278, lon: -74.00597, accuracy: 8.45m}
✅ [507f1f77bcf86cd799439011] Ubicación guardada en MongoDB
```

### En MongoDB

```bash
# Conectarte a MongoDB
mongosh luber_db

# Ver últimas ubicaciones
db.employeeacceptances.findOne(
  { employeeId: ObjectId("...") },
  { "employeeUbication.locationHistory": 1 }
)
```

### En el Server (Logs)

```
📍 [LOCATION-UPDATE] 15:30:45 Datos recibidos: {
  scheduleId: 507f1f77bcf86cd799439011,
  empId: 507f1f77bcf86cd799439010,
  location: {lat: 40.71278, lon: -74.00597, accuracy: 8.45m}
}
✅ [LOCATION-UPDATE] 15:30:45 Ubicación actualizada:
   current: {lat: 40.71278, lon: -74.00597}
   historyLength: 5
✅ [LOCATION-UPDATE] 15:30:45 Guardado en MongoDB - EmployeeAcceptance ID: 507f...
```

---

## 🐛 Troubleshooting

### Problema: "No se obtiene ubicación"

**Soluciones:**
1. ✅ **Permiso:** Autorizar ubicación en navegador
2. ✅ **GPS:** Verificar que GPS está habilitado en dispositivo
3. ✅ **Ubicación:** Estar en exterior (señal GPS más fuerte)
4. ✅ **WiFi:** Usar red WiFi para geolocalización asistida
5. ✅ **HTTPS:** Solo localhost y HTTPS tienen acceso a GPS

**Verificar en Console:**
```javascript
// Ver si hay permiso
navigator.permissions.query({name:'geolocation'})
  .then(r => console.log('Geolocation:', r.state))

// Ver si está disponible
console.log('Geolocation available:', 'geolocation' in navigator)
```

### Problema: "Ubicación pero no guarda en BD"

**Verificar:**
1. ✅ MongoDB está corriendo: `mongosh luber_db`
2. ✅ Sesión activa: Estás logueado
3. ✅ Orden aceptada: La orden existe en la BD
4. ✅ Network tab: El POST a `/update-employee-location` se envía

**Check en Console:**
```javascript
// Ver si intervalId se creó
Object.keys(sessionStorage).filter(k => k.startsWith('tracking_'))

// Ver fallos acumulados
Object.keys(sessionStorage).filter(k => k.startsWith('tracking_failures_'))
```

### Problema: "Múltiples intentos sin guardar"

- Revisa los logs del servidor
- Verifica que MongoDB esté conectado
- Verifica que el `scheduleId` sea válido
- Revisa la consola para errores de red

---

## 📊 Estadísticas de Datos

### Tamaño por registro
- 1 ubicación = ~100 bytes
- 100 ubicaciones = ~10 KB por empleado
- 1000 órdenes activas = ~10 MB en memoria

### Límite de historial
- **Máximo: 100 ubicaciones** por orden
- Se eliminan las más antiguas automáticamente
- Equivale a ~100 minutos de rastreo continuo

### Retención
- Mientras la orden está activa: Todas guardadas
- Después de completar: Se conservan en MongoDB
- 24 horas de rastreo = 1440 ubicaciones (se conservan últimas 100)

---

## 🚀 API Reference

### Endpoint: `POST /update-employee-location`

**Request:**
```json
{
  "scheduleId": "507f1f77bcf86cd799439011",
  "location": {
    "latitude": 40.712776,
    "longitude": -74.005974,
    "accuracy": 8.5,
    "timestamp": "2026-02-02T15:30:45.123Z"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Ubicación actualizada correctamente",
  "details": {
    "timestamp": "2026-02-02T15:30:45.123Z",
    "historyCount": 45
  }
}
```

**Response (Error):**
```json
{
  "error": "Aceptación no encontrada"
}
```

**Status Codes:**
- `200` - Ubicación guardada
- `401` - No autorizado (sin sesión)
- `404` - Orden no encontrada
- `400` - Coordenadas inválidas
- `500` - Error del servidor

---

## 💡 Tips de Optimización

### Para mejor precisión GPS
```javascript
// Ya configurado así en el código:
{
  enableHighAccuracy: true,    // Máxima precisión
  timeout: 30000,              // 30 segundos para obtener
  maximumAge: 0                // No usar ubicación en caché
}
```

### Para reducir uso de batería
Si necesitas menos actualizaciones:
```javascript
// Cambiar de 60000 (1 minuto) a:
// - 120000 para cada 2 minutos
// - 300000 para cada 5 minutos
// - 600000 para cada 10 minutos
setInterval(() => updateEmployeeLocation(scheduleId), 120000);
```

### Para más historial
En `server.js`, cambiar:
```javascript
// Cambiar 100 a mayor número:
if (employeeAcceptance.employeeUbication.locationHistory.length > 1000) {
  employeeAcceptance.employeeUbication.locationHistory = 
    employeeAcceptance.employeeUbication.locationHistory.slice(-1000);
}
```

---

## 🔗 Archivos Relacionados

- [employeeProfile.ejs](public/employeeProfile.ejs#L2070) - Código frontend
- [server.js](server.js#L1435) - Endpoint del backend
- [EmployeeAcceptance.js](models/EmployeeAcceptance.js) - Modelo de datos

---

## 📞 Preguntas Frecuentes

**P: ¿Se detiene el rastreo cuando cierra el navegador?**
A: Sí. El evento `beforeunload` limpia todos los intervalos.

**P: ¿Qué pasa si no tiene GPS?**
A: El empleado puede aceptar la orden sin ubicación, pero el rastreo no funcionará.

**P: ¿Se guarda el historial después de completar la orden?**
A: Sí. Todo el historial está en MongoDB bajo `EmployeeAcceptance`.

**P: ¿Pueden rastrear al empleado en tiempo real desde el admin?**
A: Depende de si existe un dashboard que lea `employeeUbication`. Actualmente se guarda pero necesitarías crear la visualización.

**P: ¿Cuál es la precisión del GPS?**
A: `accuracy` en metros. Típicamente 5-15m con buen GPS, hasta 100m+ sin.

---

Última actualización: 2026-02-02
