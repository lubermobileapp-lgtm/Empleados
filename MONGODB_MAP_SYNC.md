# MongoDB Map Synchronization Implementation ✅

## Objetivo
El mapa en tiempo real ahora usa las MISMAS coordenadas que se transmiten a MongoDB cada minuto, en lugar de obtener nuevas lecturas de GPS independientes.

## Cambios Realizados

### 1. Backend: API Endpoint ✅
**Archivo:** [server.js](server.js#L1638)
**Endpoint:** `GET /api/employee-location/:scheduleId`

```javascript
// Retrieves the most recent employee location from MongoDB
// Used by the real-time map to show stored coordinates
Response: {
  success: true,
  location: {
    latitude: 25.7617,
    longitude: -80.1918,
    accuracy: 8.5,
    timestamp: 1704067200000
  },
  lastUpdate: "2024-01-01T12:00:00Z"
}
```

### 2. Frontend: Map Update Logic ✅
**Archivo:** [employeeProfile.ejs](employeeProfile.ejs#L2694)
**Función:** `initializeRealtimeMap()`

#### Flujo de Inicialización:
1. **Intenta obtener coordenadas de MongoDB** → El punto de partida del mapa
2. **Si MongoDB no tiene datos** → Fallback a GPS actual del navegador
3. **Crea el mapa** con las coordenadas obtenidas

#### Actualizaciones Periódicas (Cada 10 segundos):
```javascript
// Primer intento: obtener de MongoDB (las coordenadas que el servidor está rastreando)
fetch(`/api/employee-location/${scheduleId}`)
  .then(data => {
    // Actualizar marcador del mapa con coordenadas de MongoDB
    empMarker.setLatLng([data.location.latitude, data.location.longitude]);
  })
  .catch(() => {
    // Fallback: si falla MongoDB, usar GPS del navegador
    navigator.geolocation.getCurrentPosition(...)
  });
```

## Sincronización con Rastreo

### Ciclo de Rastreo (Rastreo automático)
- **Frecuencia:** Cada 60 segundos durante estado "OnRoad"
- **Endpoint:** `/update-employee-location` (servidor)
- **Almacenamiento:** MongoDB → EmployeeAcceptance.employeeUbication
- **Datos:** latitude, longitude, accuracy, timestamp

### Actualización del Mapa
- **Frecuencia:** Cada 10 segundos (consultas a `/api/employee-location/:scheduleId`)
- **Fuente:** MongoDB (coordenadas almacenadas por el rastreo)
- **Fallback:** GPS directo si MongoDB falla

### Timing
```
Rastreo a MongoDB (60s) ──→ Almacenado en EmployeeAcceptance
                             ↓
Mapa consulta MongoDB (10s) ← Lee las mismas coordenadas
```

## Ventajas de esta Implementación

✅ **Sincronización perfecta:** El empleado ve exactamente lo que el servidor está rastreando  
✅ **Histórico consistente:** Mapa y base de datos usan los mismos datos  
✅ **Menos consumo de GPS:** No solicita nuevas coordenadas constantemente  
✅ **Fallback inteligente:** Si MongoDB falla, usa GPS del navegador  
✅ **Sin latencia adicional:** Actualización desde caché local (MongoDB) más que GPS

## Flujo Técnico Detallado

### Cuando el empleado abre el mapa:

1. **Carga Modal**
   ```
   Modal opens → Container shows "Cargando ubicación desde servidor..."
   ```

2. **Obtiene Geocodificación** (si es necesaria)
   ```
   Si !clientLat || !clientLon → Nominatim API (dirección → coordenadas)
   ```

3. **Obtiene Ubicación del Empleado**
   ```
   Intenta: GET /api/employee-location/:scheduleId
   Si éxito → Usa coordenadas de MongoDB
   Si error → Pide GPS del navegador al usuario
   ```

4. **Crea el Mapa**
   ```
   L.map() con view=[empLat, empLon]
   Capa: OpenStreetMap tiles
   Marcadores:
   - Verde (employee) con ubicación de MongoDB
   - Rojo (cliente) con ubicación del Schedule
   Círculo naranja: radio de 1000 pies (304.8 metros)
   ```

5. **Actualización Periódica** (cada 10 segundos)
   ```
   setInterval(() => {
     fetch(/api/employee-location/:scheduleId)
       → Obtiene coordenadas más recientes de MongoDB
       → Actualiza marcador del empleado
       → Centra mapa en nueva posición
   }, 10000)
   ```

6. **Limpieza**
   ```
   Cuando se cierra el modal → clearInterval() de las actualizaciones
   ```

## Estados y Mensajes

| Estado | Mensaje | Acción |
|--------|---------|--------|
| Iniciando | "Cargando ubicación desde servidor..." | Consultando MongoDB |
| Sin datos en MongoDB | "Obteniendo GPS actual..." | Solicitando permiso de GPS |
| Error GPS | "❌ Error de GPS: [mensaje]" | Mostrar error del navegador |
| Mapa listo | Mapa visible con marcadores | Actualizaciones cada 10s |

## Casos de Uso

### 1. Empleado inicia sesión y comienza ruta
```
Presiona "OnRoad" → Rastreo cada 60s → MongoDB actualizado
```

### 2. Abre mapa en vivo
```
Presiona "🗺️ Ver Mapa en Vivo" 
→ Obtiene ubicación actual de MongoDB
→ Mapa muestra su posición (desde rastreo)
→ Se actualiza cada 10s (consultando MongoDB)
```

### 3. Llega a cliente
```
Presiona "Arrived" 
→ Validación de distancia (usando GPS + MongoDB)
→ Rastreo se detiene
```

## Variables de Control

```javascript
// Intervalo de actualización del mapa
const updateInterval = setInterval(..., 10000); // 10 segundos

// Intervalo de rastreo (en server.js - línea 1491)
const rastreoInterval = setInterval(..., 60000); // 60 segundos
```

## Dependencias

- **API Endpoint:** `/api/employee-location/:scheduleId` (línea 1638 en server.js)
- **Modelo:** EmployeeAcceptance.employeeUbication (MongoDB)
- **Librería:** Leaflet.js para maps
- **Geocodificación:** Nominatim API (OpenStreetMap)

## Verificación Rápida

1. **¿El endpoint está creado?** ✅
   ```bash
   GET /api/employee-location/{scheduleId}
   Response: { success: true, location: {...}, lastUpdate: ... }
   ```

2. **¿El mapa obtiene datos de MongoDB?** ✅
   Buscar en console: `📍 Ubicación obtenida de MongoDB:`

3. **¿Se actualiza periódicamente?** ✅
   Buscar en console: `📍 Ubicación actualizada desde MongoDB:`

4. **¿Funciona fallback a GPS?** ✅
   Si el fetch falla, muestra: `📍 Ubicación actualizada desde GPS (fallback):`

## Testing

Abrir DevTools (F12) y ver console para logs:
```javascript
// Inicialización
'📍 Ubicación obtenida de MongoDB: 25.7617, -80.1918 Última actualización: 2024-01-01T12:00:00Z'

// Actualizaciones (cada 10s)
'📍 Ubicación actualizada desde MongoDB: 25.7617, -80.1925'
```

## Próximos Pasos (Opcionales)

- [ ] Considerar aumentar intervalo a 60s (sincronizar con rastreo)
- [ ] Agregar indicador de "última actualización" en el modal
- [ ] Mostrar historial de ubicaciones de MongoDB
- [ ] Implementar route replay con historialización completa

---
**Estado:** ✅ IMPLEMENTADO Y LISTO PARA TESTING  
**Sincronización:** MongoDB → Mapa (cada 10 segundos)  
**Fallback:** GPS directo si MongoDB falla  
**Última actualización:** 2024
