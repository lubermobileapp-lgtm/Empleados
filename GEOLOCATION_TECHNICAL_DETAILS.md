# 🔬 DETALLES TÉCNICOS - GEOLOCALIZACIÓN MEJORADA

## 📐 Matemáticas de Precisión

### Promedios Ponderados
Cuando recopilas 3 muestras:

```
Muestra 1: lat=40.71278, lon=-74.00597, accuracy=4.50m
Muestra 2: lat=40.71279, lon=-74.00596, accuracy=3.80m  ← mejor
Muestra 3: lat=40.71277, lon=-74.00598, accuracy=4.20m

Promedio:
  lat = (40.71278 + 40.71279 + 40.71277) / 3 = 40.712780
  lon = (-74.00597 + -74.00596 + -74.00598) / 3 = -74.005970
  accuracy = MIN(4.50, 3.80, 4.20) = 3.80m  ← mejor accuracy gana
```

**Resultado:** ✅ Ubicación más precisa y estable

### Precisión Decimal de Coordenadas

| Decimales | Precisión |
|-----------|-----------|
| 1 | ±11.1 km |
| 2 | ±1.1 km |
| 3 | ±111 m |
| 4 | ±11.1 m |
| 5 | ±1.1 m |
| 6 | ±0.11 m (11 cm) |
| 7 | ±0.011 m (1.1 cm) |
| 8 | ±0.0011 m (1.1 mm) |

**Usamos 8 decimales** = Precisión de ±1mm teórica  
*En práctica: GPS da ±3-8m, los decimales adicionales capturan pequeñas variaciones*

---

## 🔄 Flujo Detallado

### Fase 1: Recopilación de Muestras

```javascript
function attemptHighAccuracyLocation() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      // ✅ Éxito - guardar muestra
      locations.push({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        // ... más campos
      });
      
      if (attemptsLeft > 1) {
        // Aún hay intentos - esperar y reintentar
        attemptsLeft--;
        setTimeout(() => attemptHighAccuracyLocation(), 1000);
      } else {
        // Todas las muestras recopiladas
        finalizeBestLocation(scheduleId, locations);
      }
    },
    (error) => {
      // ❌ Error - reintentarif (attemptsLeft > 1) {
        attemptsLeft--;
        setTimeout(() => attemptHighAccuracyLocation(), 2000);
      } else {
        // No quedan intentos - usar fallback
        if (locations.length > 0) {
          finalizeBestLocation(scheduleId, locations);
        } else {
          fallbackToIPGeolocation(scheduleId);
        }
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 45000,
      maximumAge: 0
    }
  );
}
```

### Fase 2: Procesamiento y Promediado

```javascript
function finalizeBestLocation(scheduleId, locations) {
  // 1. Promediar latitud y longitud
  const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) 
                 / locations.length;
  const avgLon = locations.reduce((sum, loc) => sum + loc.longitude, 0) 
                 / locations.length;
  
  // 2. Usar mejor accuracy (número más bajo = mejor precisión)
  const bestAccuracy = Math.min(...locations.map(loc => loc.accuracy));
  
  // 3. Redondear a 8 decimales para máxima precisión
  const finalLat = parseFloat(avgLat.toFixed(8));
  const finalLon = parseFloat(avgLon.toFixed(8));
  const finalAccuracy = parseFloat(bestAccuracy.toFixed(2));
  
  // 4. Compilar objeto final con metadatos
  const gpsLocation = {
    latitude: finalLat,
    longitude: finalLon,
    accuracy: finalAccuracy,
    altitude: lastLocation.altitude,
    heading: lastLocation.heading,
    speed: lastLocation.speed,
    samples: locations.length,
    timestamp: new Date().toISOString(),
    method: 'GPS-AVERAGED'
  };
  
  return gpsLocation;
}
```

### Fase 3: Envío al Servidor

```javascript
function sendLocationToServer(scheduleId, gpsLocation) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  fetch('/update-employee-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId, location: gpsLocation }),
    signal: controller.signal
  })
  .then(response => response.json())
  .then(data => {
    clearTimeout(timeoutId);
    // ✅ Éxito
  })
  .catch(err => {
    clearTimeout(timeoutId);
    // ❌ Error
  });
}
```

### Fase 4: Procesamiento en Servidor

```javascript
app.post('/update-employee-location', async (req, res) => {
  const { scheduleId, location } = req.body;
  
  // 1. Validar sesión
  if (!req.session?.empId) return res.status(401).json({...});
  
  // 2. Buscar registro
  const employeeAcceptance = await EmployeeAcceptance.findOne({
    scheduleId: scheduleId,
    employeeId: req.session.empId
  });
  
  // 3. Validar coordenadas
  if (location.latitude < -90 || location.latitude > 90 || 
      location.longitude < -180 || location.longitude > 180) {
    return res.status(400).json({ error: 'Coordenadas invalidas' });
  }
  
  // 4. Determinar calidad
  const accuracy = location.accuracy || 0;
  const qualityFlag = accuracy <= 10 ? '🟢 EXCELENTE' : 
                      accuracy <= 25 ? '🟡 BUENA' : 
                      accuracy <= 50 ? '🟠 ACEPTABLE' : '🔴 BAJA';
  
  console.log(`📍 [${scheduleId}] ${qualityFlag} (±${accuracy.toFixed(2)}m)`);
  
  // 5. Actualizar ubicación actual
  employeeAcceptance.employeeUbication = {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    altitude: location.altitude,
    heading: location.heading,
    speed: location.speed,
    samples: location.samples,
    method: location.method,
    timestamp: new Date()
  };
  
  // 6. Agregar al historial
  employeeAcceptance.employeeUbication.locationHistory.push({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    altitude: location.altitude,
    timestamp: new Date(),
    method: location.method
  });
  
  // 7. Limitar historial a 100 registros
  if (employeeAcceptance.employeeUbication.locationHistory.length > 100) {
    employeeAcceptance.employeeUbication.locationHistory = 
      employeeAcceptance.employeeUbication.locationHistory.slice(-100);
  }
  
  // 8. Guardar y responder
  await employeeAcceptance.save();
  res.json({ success: true });
});
```

---

## 🌐 Geolocalización por IP (Fallback)

### Cuándo se activa
- ✅ Usuario denegó permisos de GPS
- ✅ Dispositivo sin GPS hardware
- ✅ 3 intentos de GPS fallaron

### Implementación
```javascript
function fallbackToIPGeolocation(scheduleId) {
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
      const ipLocation = {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        accuracy: data.accuracy || 5000,  // ±5km típico
        city: data.city,
        country: data.country_name,
        timestamp: new Date().toISOString(),
        method: 'IP-BASED'
      };
      
      sendLocationToServer(scheduleId, ipLocation);
    });
}
```

### Ventajas
- ✅ Funciona sin permisos especiales
- ✅ Muy rápido (2-5 segundos)
- ✅ Compatible con todos los dispositivos
- ✅ Los datos se guardan de todas formas

### Desventajas
- ⚠️ Menos preciso (±5km típicamente)
- ⚠️ Puede estar fuera del país si usa VPN

---

## 📊 Estructura de Datos en MongoDB

### EmployeeAcceptance Schema
```javascript
{
  _id: ObjectId(...),
  employeeId: ObjectId(...),
  scheduleId: ObjectId(...),
  status: "accepted",
  
  // ← Ubicación actual
  employeeUbication: {
    latitude: 40.71278250,      // 8 decimales
    longitude: -74.00596750,    // 8 decimales
    accuracy: 4.5,              // en metros
    altitude: 12.34,            // en metros
    heading: 127.5,             // 0-360 grados
    speed: 15.2,                // km/h
    samples: 3,                 // cuántas muestras se promediaron
    method: "GPS-AVERAGED",     // o "IP-BASED"
    timestamp: ISODate("2026-02-02T15:30:45.123Z"),
    
    // ← Historial de últimas 100 ubicaciones
    locationHistory: [
      {
        latitude: 40.71278250,
        longitude: -74.00596750,
        accuracy: 4.5,
        altitude: 12.34,
        timestamp: ISODate("2026-02-02T15:30:45.123Z"),
        method: "GPS-AVERAGED"
      },
      // ... más registros
    ]
  },
  
  acceptedAt: ISODate(...),
  createdAt: ISODate(...),
  updatedAt: ISODate(...)
}
```

### Schedule Schema (también se actualiza)
```javascript
{
  _id: ObjectId(...),
  // ... otros campos
  
  employeeLocation: {
    latitude: 40.71278250,
    longitude: -74.00596750,
    accuracy: 4.5,
    altitude: 12.34,
    method: "GPS-AVERAGED",
    timestamp: ISODate("2026-02-02T15:30:45.123Z")
  }
}
```

---

## 🔍 Consultas MongoDB Útiles

### Ver ubicación actual de empleado
```javascript
db.employeeacceptances.findOne(
  { scheduleId: ObjectId("...") },
  { projection: { "employeeUbication": 1 } }
)
```

### Ver historial completo
```javascript
db.employeeacceptances.findOne(
  { scheduleId: ObjectId("...") },
  { projection: { "employeeUbication.locationHistory": 1 } }
)
```

### Análisis de precisión por día
```javascript
db.employeeacceptances.aggregate([
  {
    $match: {
      "employeeUbication.timestamp": {
        $gte: new Date(new Date().setHours(0,0,0,0))
      }
    }
  },
  {
    $group: {
      _id: null,
      avgAccuracy: { $avg: "$employeeUbication.accuracy" },
      minAccuracy: { $min: "$employeeUbication.accuracy" },
      maxAccuracy: { $max: "$employeeUbication.accuracy" },
      totalRecords: { $sum: 1 }
    }
  }
])
```

### Contar órdenes con excelente precisión (≤10m)
```javascript
db.employeeacceptances.countDocuments({
  "employeeUbication.accuracy": { $lte: 10 }
})
```

### Ver distribución de métodos
```javascript
db.employeeacceptances.aggregate([
  {
    $group: {
      _id: "$employeeUbication.method",
      count: { $sum: 1 }
    }
  }
])
```

**Resultado esperado:**
```javascript
[
  { _id: "GPS-AVERAGED", count: 847 },  // ✅ Mayoría GPS preciso
  { _id: "IP-BASED", count: 23 }        // ⚠️ Pocas fallos
]
```

---

## ⚙️ Variables de Configuración

En `employeeProfile.ejs`:

```javascript
// Número de intentos GPS
let attemptsLeft = 3;
// Cambiar a 2 para más rápido (menos preciso)
// Cambiar a 4 para más preciso (más lento)

// Milisegundos entre intentos exitosos
setTimeout(() => attemptHighAccuracyLocation(), 1000);
// Cambiar a 500 para más rápido
// Cambiar a 2000 para esperar más entre satélites

// Milisegundos entre intentos fallidos
setTimeout(() => attemptHighAccuracyLocation(), 2000);
// Cambiar a 1000 para reintentar más rápido
// Cambiar a 5000 para esperar más

// Timeout máximo para obtener GPS (ms)
timeout: 45000
// Cambiar a 30000 para más rápido pero menos preciso
// Cambiar a 60000 para esperar mucho más (batería)
```

---

## 🧪 Testing

### Simular Error de GPS
En Chrome DevTools:
1. F12 → Sensors → Geolocation → Override
2. Seleccionar "San Francisco" o ubicación falsa
3. Verás que se recopilan 3 muestras de la falsa ubicación

### Ver Logs en Consola
```javascript
// Filtrar solo mensajes de geolocalización
console.log("✅", "📍", "🎯", "🌐", "⚠️")
```

---

## 📈 Mejoras Futuras Posibles

1. **Kalman Filter**
   - Suavizar ruido de GPS
   - Predicción de movimiento

2. **Mapa de Calor**
   - Ver zonas con mejor/peor señal GPS
   - Heatmap de precisión

3. **Machine Learning**
   - Detectar outliers automáticamente
   - Ajustar timeout según condiciones

4. **Integración Google Maps**
   - Snap to roads
   - Validar contra rutas reales

5. **API Alternativas**
   - Integratar Apple Maps si iOS
   - Usar HERE Maps
   - Comparar múltiples APIs

---

## ✅ Checklist de Validación

- [x] Muestreo múltiple implementado
- [x] Promediado de coordenadas correcto
- [x] Fallback IP funcionando
- [x] Datos extendidos guardados
- [x] Logging detallado implementado
- [x] Indicadores de calidad funcionando
- [x] MongoDB actualizado
- [x] Validación de coordenadas
- [x] Manejo de errores completo
- [x] Documentación actualizada

---

**Última actualización:** 2 de Febrero, 2026  
**Versión:** 2.0 - Enhanced Accuracy

