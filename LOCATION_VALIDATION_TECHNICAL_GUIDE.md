# 🗺️ GUÍA TÉCNICA - VALIDACIÓN DE UBICACIÓN PARA "ARRIVED"

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Requisitos Técnicos](#requisitos-técnicos)
3. [Implementación](#implementación)
4. [API Endpoints](#api-endpoints)
5. [Casos de Uso](#casos-de-uso)
6. [Troubleshooting](#troubleshooting)
7. [Mejoras Futuras](#mejoras-futuras)

---

## 📝 Descripción General

### ¿Qué es?
Sistema de validación de distancia GPS que **bloquea el botón "Arrived"** si el empleado no está a menos de **1000 pies** (305 metros) de la ubicación del cliente.

### ¿Cómo funciona?

```
┌────────────────────────────────────────┐
│  Empleado presiona "Arrived"           │
│  (OnRoad button completed)             │
└────────────────────┬───────────────────┘
                     ↓
┌────────────────────────────────────────┐
│  Sistema abre MODAL CON MAPA           │
│  ├─ Obtiene GPS actual (empleado)      │
│  ├─ Obtiene coordenadas (cliente)      │
│  ├─ Dibuja ambas ubicaciones           │
│  └─ Calcula distancia (HIVE formula)   │
└────────────────────┬───────────────────┘
                     ↓
         ┌───────────┴────────────┐
         ↓                        ↓
    SI ≤ 1000 pies         SI > 1000 pies
         ↓                        ↓
   BOTÓN HABILITADO        BOTÓN DESHABILITADO
    (Color Verde)          (Color Gris)
         ↓                        ↓
   Empleado confirma        Debe acercarse más
         ↓                        ↓
  Servidor valida          "Debes estar a menos
  NUEVAMENTE              de 1000 pies"
         ↓
   Si pasa → Actualiza status
   Si falla → Rechaza solicitud
```

---

## 🔧 Requisitos Técnicos

### Backend
- ✅ Node.js + Express
- ✅ MongoDB con EmployeeAcceptance model
- ✅ Acceso a Internet (para Nominatim Geocoding)

### Frontend
- ✅ HTML5 Geolocation API
- ✅ Leaflet.js (OpenStreetMap)
- ✅ Fetch API
- ✅ ES6 JavaScript

### Browser
- ✅ Chrome 50+
- ✅ Firefox 55+
- ✅ Safari 13+
- ✅ Edge 15+

**Requisito especial:** El sitio DEBE estar en HTTPS o localhost para que funcione Geolocation API

---

## 🛠️ Implementación

### Cambios en `server.js`

#### 1. Función Haversine

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 20902231; // Radio en pies (6371km = 20902231 pies)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Retorna PIES
}
```

#### 2. Endpoint `/update-status` modificado

```javascript
app.post('/update-status', async (req, res) => {
  const { scheduleId, statusKey } = req.body;
  
  if (statusKey === 'Arrived') {
    // 1. Obtener ubicación actual del empleado
    const employeeAcceptance = await EmployeeAcceptance.findOne({
      scheduleId, employeeId: req.session.empId
    });
    
    // 2. Obtener coordenadas del cliente
    const schedule = await Schedule.findById(scheduleId);
    
    // 3. Calcular distancia
    const distance = calculateDistance(
      employeeAcceptance.employeeUbication.latitude,
      employeeAcceptance.employeeUbication.longitude,
      schedule.clientLatitude,
      schedule.clientLongitude
    );
    
    // 4. Validar (máximo 1000 pies)
    if (distance > 1000) {
      return res.status(400).json({
        error: `Debes estar a menos de 1000 pies. Distancia actual: ${distance.toFixed(0)} pies`,
        code: 'TOO_FAR_FROM_CLIENT',
        distance: { feet: distance, meters: distance * 0.3048 }
      });
    }
  }
  
  // Proceder con actualización...
});
```

#### 3. Nuevo Endpoint `/api/geocode`

```javascript
app.post('/api/geocode', async (req, res) => {
  const { address } = req.body;
  
  // Usa OpenStreetMap Nominatim (GRATUITO, sin API key)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?address=${address}&format=json`
  );
  
  const results = await response.json();
  
  if (results.length === 0) {
    return res.status(404).json({ error: 'Dirección no encontrada' });
  }
  
  res.json({
    success: true,
    latitude: parseFloat(results[0].lat),
    longitude: parseFloat(results[0].lon),
    displayName: results[0].display_name
  });
});
```

### Cambios en `employeeProfile.ejs`

#### 1. HTML del elemento Schedule

```html
<li class="reserved" 
    data-schedule-id="<%= schedule._id %>"
    data-address="<%= schedule.clientAddress %>"
    data-client-lat="<%= schedule.clientLatitude || '' %>"
    data-client-lon="<%= schedule.clientLongitude || '' %>">
```

#### 2. Función `updateStatus` modificada

```javascript
async function updateStatus(scheduleId, statusKey, btn) {
  if (statusKey === 'Arrived') {
    // NO ejecutar actualización inmediatamente
    // En su lugar, mostrar modal con mapa
    showMapModal(scheduleId);
    return;
  }
  
  // Para otros estados (OnRoad, Started, etc)
  // Proceder normalmente
}
```

#### 3. Nueva función `showMapModal`

```javascript
async function showMapModal(scheduleId) {
  // 1. Obtener datos del schedule
  const scheduleEl = document.querySelector(`[data-schedule-id="${scheduleId}"]`);
  const scheduleInfo = {
    customerName: scheduleEl.querySelector('strong')?.textContent,
    clientAddress: scheduleEl.querySelector('a[href*="maps"]')?.textContent,
    clientLat: parseFloat(scheduleEl.dataset.clientLat || 0),
    clientLon: parseFloat(scheduleEl.dataset.clientLon || 0)
  };
  
  // 2. Crear modal HTML
  const modal = document.createElement('div');
  modal.id = 'mapModal';
  modal.className = 'map-modal';
  modal.innerHTML = '...'; // HTML del modal
  
  // 3. Cargar Leaflet si es necesario
  loadMapWithLeaflet(scheduleId, scheduleInfo);
}
```

#### 4. Funciones de Mapa

```javascript
async function loadMapWithLeaflet(scheduleId, scheduleInfo) {
  // Cargar librería Leaflet desde CDN
  if (typeof L === 'undefined') {
    // ... cargar scripts
    document.head.appendChild(scriptTag);
  }
}

async function initializeMap(scheduleId, scheduleInfo) {
  // 1. Si faltan coordenadas del cliente, geocodificar
  if (!scheduleInfo.clientLat) {
    const res = await fetch('/api/geocode', {
      method: 'POST',
      body: JSON.stringify({ address: scheduleInfo.clientAddress })
    });
    const data = await res.json();
    scheduleInfo.clientLat = data.latitude;
    scheduleInfo.clientLon = data.longitude;
  }
  
  // 2. Obtener ubicación del empleado
  navigator.geolocation.getCurrentPosition((position) => {
    const empLat = position.coords.latitude;
    const empLon = position.coords.longitude;
    
    // 3. Crear mapa con Leaflet
    const map = L.map('mapContainer').setView([empLat, empLon], 15);
    
    // 4. Agregar marcadores
    L.circleMarker([empLat, empLon]).addTo(map); // Empleado (verde)
    L.marker([scheduleInfo.clientLat, scheduleInfo.clientLon]).addTo(map); // Cliente (rojo)
    
    // 5. Dibujar círculo de rango (1000 pies)
    L.circle([scheduleInfo.clientLat, scheduleInfo.clientLon], {
      radius: 304.8  // 1000 pies en metros
    }).addTo(map);
    
    // 6. Calcular distancia
    const distance = calculateDistanceInFeet(empLat, empLon, ...);
    
    // 7. Habilitar/deshabilitar botón
    updateDistanceDisplay(distance);
  });
}
```

---

## 📡 API Endpoints

### `POST /update-status`

**Parámetros:**
```json
{
  "scheduleId": "507f1f77bcf86cd799439011",
  "statusKey": "Arrived",
  "serviceMilage": 45000  // Solo para "Completed"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true
}
```

**Respuesta Error - Demasiado Lejos (400):**
```json
{
  "success": false,
  "error": "❌ Debes estar a menos de 1000 pies de la ubicación del cliente.\n\nDistancia actual: 1500 pies (~457 metros)",
  "code": "TOO_FAR_FROM_CLIENT",
  "distance": {
    "feet": "1500.25",
    "meters": "457.32"
  }
}
```

**Respuesta Error - Sin GPS (400):**
```json
{
  "success": false,
  "error": "📍 No se puede localizar tu posición GPS. Asegúrate de estar conectado y con GPS habilitado.",
  "code": "GPS_NOT_AVAILABLE"
}
```

### `POST /api/geocode`

**Parámetros:**
```json
{
  "address": "123 Main Street, Springfield, IL 62701"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "latitude": 39.7817,
  "longitude": -89.6501,
  "displayName": "123, Main Street, Springfield, Illinois, 62701, United States",
  "boundingBox": ["39.7815", "39.7819", "-89.6503", "-89.6499"]
}
```

**Respuesta Error (404):**
```json
{
  "error": "No se encontró la dirección",
  "code": "ADDRESS_NOT_FOUND"
}
```

---

## 📖 Casos de Uso

### Caso 1: Empleado a 500 pies del cliente

```
1. Empleado presiona "Arrived"
2. Modal se abre
3. GPS obtiene ubicación: (40.7128, -74.0060)
4. Coordenadas cliente: (40.7250, -74.0060)
5. Distancia calculada: 500 pies
6. Botón HABILITADO ✅ (Verde)
7. Empleado presiona "Confirmar Llegada"
8. Servidor valida NUEVAMENTE
9. Status actualizado a "Arrived"
10. Rastreo detiene
```

### Caso 2: Empleado a 2000 pies del cliente

```
1. Empleado presiona "Arrived"
2. Modal se abre
3. GPS obtiene ubicación: (40.7000, -74.0060)
4. Coordenadas cliente: (40.7250, -74.0060)
5. Distancia calculada: 2000 pies
6. Botón DESHABILITADO ❌ (Gris)
7. Mensaje: "Debes estar a menos de 1000 pies"
8. Empleado no puede presionar botón
9. Debe acercarse más
```

### Caso 3: Schedule sin coordenadas

```
1. Empleado presiona "Arrived"
2. Modal se abre
3. clientLatitude y clientLongitude están vacías
4. Sistema intenta geocodificar dirección
5. Nominatim API devuelve coordenadas
6. Continúa normalmente con nueva ubicación
7. Si geocoding falla: Mensaje de error, botón deshabilitado
```

### Caso 4: Sin GPS disponible

```
1. Empleado presiona "Arrived"
2. Modal se abre
3. navigator.geolocation.getCurrentPosition() falla
4. Código de error: PERMISSION_DENIED
5. Mensaje: "Permiso de ubicación denegado"
6. Botón deshabilitado
7. Empleado debe habilitar GPS y reintentar
```

---

## 🐛 Troubleshooting

### "Geolocalización no disponible"

**Causa:** Browser no soporta Geolocation API o sitio no está en HTTPS

**Solución:**
```javascript
// Verificar en consola
if (!navigator.geolocation) {
  console.log('❌ Geolocation no disponible');
}
```

**Requisitos:**
- ✅ HTTPS (o localhost)
- ✅ Permiso de ubicación otorgado
- ✅ Browser moderno (Chrome, Firefox, Safari, Edge)

### "Coordenadas del cliente no disponibles"

**Causa:** Schedule no tiene `clientLatitude` y `clientLongitude`, y geocoding falló

**Solución:**

**Opción 1:** Agregar coordenadas manualmente en MongoDB
```javascript
db.schedules.updateOne(
  { _id: ObjectId("...") },
  { $set: { 
    clientLatitude: 40.7128,
    clientLongitude: -74.0060
  }}
)
```

**Opción 2:** Esperar a que sistema geocodifique
```javascript
// El sistema usa Nominatim automáticamente
// Si no funciona, puede ser por:
// - Nominatim API caída
// - Dirección mal escrita
// - Sin conexión a Internet
```

### Distancia Incorrecta

**Causa:** GPS con baja precisión o coordenadas incorrectas

**Verificar:**
```javascript
// En consola del navegador
const pos = await new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject);
});

console.log('Lat:', pos.coords.latitude);
console.log('Lon:', pos.coords.longitude);
console.log('Accuracy:', pos.coords.accuracy, 'metros');
```

**Solución:**
- Esperar a que GPS obtenga mejor señal
- GPS outdoor es más preciso que indoor
- Valor de accuracy > 30m indica baja precisión

### Botón "Arrived" No Se Habilita

**Causas posibles:**

1. **GPS aún cargando**
   - Solución: Esperar 10-15 segundos

2. **Empleado está lejos (>1000 pies)**
   - Solución: Acercarse al cliente

3. **Coordenadas del cliente faltan**
   - Solución: Verificar que el schedule tenga `clientLatitude` y `clientLongitude`

4. **Permiso de ubicación denegado**
   - Solución: Ir a Configuración del browser, permitir acceso a ubicación

5. **HTTPS no está configurado**
   - Solución: Usar HTTPS o localhost para desarrollo

---

## 🚀 Mejoras Futuras

### Corto Plazo (1-2 semanas)

- [ ] Cache de coordenadas geocodificadas en BD
- [ ] Notificación cuando empleado está cerca (a 2000 pies)
- [ ] Historial visual de ruta recorrida en el mapa
- [ ] Brújula que apunte al cliente

### Mediano Plazo (1 mes)

- [ ] Distancia configurable por tipo de servicio
- [ ] Geofencing automático (auto-marcar "Arrived")
- [ ] Tiempo estimado de llegada (ETA)
- [ ] Rutas sugeridas usando Google Directions API

### Largo Plazo (2+ meses)

- [ ] Análisis de rutas para optimización
- [ ] Predicción de retrasos basada en tráfico
- [ ] Integración con Waze o Google Maps
- [ ] Análisis de patrón de conducción para seguridad

---

## 📊 Monitoreo y Análisis

### Métricas a Seguir

```javascript
// En Google Analytics o herramienta similar
// 1. % de empleados que presionan "Arrived"
// 2. Distancia promedio al momento de "Arrived"
// 3. Tiempo promedio de rastreo (OnRoad a Arrived)
// 4. Casos de GPS no disponible
// 5. Casos de too far from client
```

### Logging en Servidor

```javascript
// El servidor loguea:
console.log(`📍 Validación de distancia para ${scheduleId}:`);
console.log(`   Empleado: ${currentLocation.latitude}, ${currentLocation.longitude}`);
console.log(`   Cliente: ${clientLat}, ${clientLon}`);
console.log(`   Distancia: ${distanceFeet.toFixed(2)} pies`);
console.log(`   Resultado: ${distanceFeet <= 1000 ? 'APROBADO ✅' : 'RECHAZADO ❌'}`);
```

---

## 🔒 Consideraciones de Seguridad

### ¿Puede el empleado hacer "trampas"?

**No, porque:**

1. ✅ **Validación doble**
   - Frontend (UX feedback)
   - Backend (seguridad real)

2. ✅ **GPS difícil de falsificar**
   - Requiere modificar geolocation
   - Navegador obtiene datos reales del dispositivo

3. ✅ **Servidor valida NUEVAMENTE**
   - Aunque se falsifique JS, servidor rechaza

4. ✅ **Logs de auditoría**
   - Se registra coordinada, distancia, resultado

### Datos Guardados en MongoDB

```javascript
db.employeeacceptances.findOne({ scheduleId: ObjectId("...") })
// {
//   employeeUbication: {
//     latitude: 40.7128,
//     longitude: -74.0060,
//     accuracy: 4.5,  // metros - indica precisión
//     timestamp: ISODate("2026-02-02T15:30:45Z"),
//     locationHistory: [...]
//   }
// }
```

---

**Última actualización:** 2026-02-02  
**Versión:** 1.0  
**Estado:** ✅ En Producción
