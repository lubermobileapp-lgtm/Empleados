# 🗺️ Ejemplos de Consultas - Geolocalización en MongoDB

## 📍 Conectarte a MongoDB

```bash
# Abrir terminal en la carpeta del proyecto
mongosh luber_db

# O conectarte de forma completa si está remoto
mongosh "mongodb+srv://usuario:password@cluster.mongodb.net/luber_db"
```

---

## 🔍 Consultas Básicas

### Ver última ubicación de un empleado

```javascript
// Buscar la orden más reciente de un empleado
db.employeeacceptances.findOne(
  { employeeId: ObjectId("60d5ec49c1234567890abcde") },
  { sort: { acceptedAt: -1 } }
)
```

**Resultado:**
```json
{
  "_id": ObjectId("60d5ec49c1234567890abcde"),
  "employeeUbication": {
    "latitude": 40.712776,
    "longitude": -74.005974,
    "accuracy": 8.5,
    "timestamp": ISODate("2026-02-02T15:30:45.123Z"),
    "locationHistory": [...]
  }
}
```

### Ver historial completo de ubicaciones

```javascript
// Obtener el historial de ubicaciones de una orden
db.employeeacceptances.findOne(
  { scheduleId: ObjectId("60d5ec49c1234567890abcde") },
  { "employeeUbication.locationHistory": 1 }
)
```

### Contar cuántas ubicaciones se han guardado

```javascript
// Para una orden específica
db.employeeacceptances.aggregate([
  { $match: { scheduleId: ObjectId("60d5ec49c1234567890abcde") } },
  {
    $project: {
      locationCount: { $size: "$employeeUbication.locationHistory" }
    }
  }
])
```

---

## 📊 Consultas Avanzadas

### Obtener últimas 5 ubicaciones

```javascript
// Últimas 5 ubicaciones de una orden
db.employeeacceptances.findOne(
  { scheduleId: ObjectId("60d5ec49c1234567890abcde") },
  {
    "employeeUbication": {
      locationHistory: { $slice: -5 }
    }
  }
)
```

### Ubicaciones en rango de tiempo

```javascript
// Ubicaciones de la última hora
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

db.employeeacceptances.aggregate([
  { $match: { scheduleId: ObjectId("60d5ec49c1234567890abcde") } },
  {
    $project: {
      recentLocations: {
        $filter: {
          input: "$employeeUbication.locationHistory",
          as: "loc",
          cond: { $gte: ["$$loc.timestamp", oneHourAgo] }
        }
      }
    }
  }
])
```

### Calcular distancia recorrida

```javascript
// Obtener todas las ubicaciones para análisis
const result = db.employeeacceptances.findOne(
  { scheduleId: ObjectId("60d5ec49c1234567890abcde") }
);

// Función para calcular distancia entre dos puntos (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
}

// Calcular distancia total
let totalDistance = 0;
const locs = result.employeeUbication.locationHistory;
for (let i = 1; i < locs.length; i++) {
  const dist = haversine(
    locs[i-1].latitude, locs[i-1].longitude,
    locs[i].latitude, locs[i].longitude
  );
  totalDistance += dist;
}
console.log(`Distancia total: ${(totalDistance * 1000).toFixed(2)}m`);
```

### Empleados activos en este momento

```javascript
// Órdenes activas (sin completar) de la última hora
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

db.employeeacceptances.find(
  {
    status: "accepted",
    acceptedAt: { $gte: oneHourAgo },
    "employeeUbication.timestamp": { $exists: true }
  },
  {
    employeeId: 1,
    scheduleId: 1,
    "employeeUbication.latitude": 1,
    "employeeUbication.longitude": 1,
    "employeeUbication.timestamp": 1,
    "employeeUbication.accuracy": 1
  }
)
```

### Órdenes completadas con ubicación

```javascript
// Ver si el empleado llegó al destino (con ubicación grabada)
db.employeeacceptances.find(
  {
    status: "completed",
    "employeeUbication.locationHistory": { $exists: true, $not: { $size: 0 } }
  },
  {
    employeeId: 1,
    completedAt: 1,
    "employeeUbication.locationHistory": { $slice: -1 } // Solo última ubicación
  }
)
```

---

## 🎯 Consultas por Caso de Uso

### Para un Dashboard de Rastreo en Tiempo Real

```javascript
// Empleados activos con sus ubicaciones actuales
db.employeeacceptances.aggregate([
  {
    $match: {
      status: "accepted",
      "employeeUbication.latitude": { $exists: true }
    }
  },
  {
    $lookup: {
      from: "employees",
      localField: "employeeId",
      foreignField: "_id",
      as: "employee"
    }
  },
  {
    $project: {
      _id: 1,
      employeeName: { $arrayElemAt: ["$employee.firstName", 0] },
      lat: "$employeeUbication.latitude",
      lon: "$employeeUbication.longitude",
      accuracy: "$employeeUbication.accuracy",
      lastUpdate: "$employeeUbication.timestamp",
      historyCount: { $size: "$employeeUbication.locationHistory" }
    }
  },
  { $sort: { lastUpdate: -1 } }
])
```

### Para Reportes de Desempeño

```javascript
// Estadísticas de cada empleado
db.employeeacceptances.aggregate([
  {
    $group: {
      _id: "$employeeId",
      totalOrders: { $sum: 1 },
      completedOrders: {
        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
      },
      ordersWithLocation: {
        $sum: {
          $cond: [
            { $gt: [{ $size: "$employeeUbication.locationHistory" }, 0] },
            1,
            0
          ]
        }
      },
      lastLocation: { $max: "$employeeUbication.timestamp" }
    }
  },
  {
    $lookup: {
      from: "employees",
      localField: "_id",
      foreignField: "_id",
      as: "employee"
    }
  },
  {
    $project: {
      _id: 0,
      employeeId: "$_id",
      employeeName: { $arrayElemAt: ["$employee.firstName", 0] },
      totalOrders: 1,
      completedOrders: 1,
      ordersWithLocation: 1,
      lastLocation: 1
    }
  }
])
```

### Para Auditoría (Ubicaciones sospechosas)

```javascript
// Órdenes con saltos de ubicación muy grandes
db.employeeacceptances.aggregate([
  {
    $match: {
      "employeeUbication.locationHistory": { $exists: true }
    }
  },
  {
    $project: {
      employeeId: 1,
      scheduleId: 1,
      locations: "$employeeUbication.locationHistory"
    }
  }
  // Luego filtrar por JavaScript si es necesario
])
```

---

## 📈 Estadísticas y Análisis

### Precisión promedio del GPS

```javascript
db.employeeacceptances.aggregate([
  {
    $match: {
      "employeeUbication.locationHistory": { $exists: true }
    }
  },
  {
    $unwind: "$employeeUbication.locationHistory"
  },
  {
    $group: {
      _id: null,
      averageAccuracy: { $avg: "$employeeUbication.locationHistory.accuracy" },
      minAccuracy: { $min: "$employeeUbication.locationHistory.accuracy" },
      maxAccuracy: { $max: "$employeeUbication.locationHistory.accuracy" },
      totalLocations: { $sum: 1 }
    }
  }
])
```

### Cobertura de rastreo por día

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

db.employeeacceptances.aggregate([
  {
    $match: {
      acceptedAt: { $gte: today }
    }
  },
  {
    $group: {
      _id: null,
      totalOrders: { $sum: 1 },
      trackedOrders: {
        $sum: {
          $cond: [
            { $gt: [{ $size: "$employeeUbication.locationHistory" }, 0] },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      totalOrders: 1,
      trackedOrders: 1,
      coveragePercent: {
        $multiply: [
          { $divide: ["$trackedOrders", "$totalOrders"] },
          100
        ]
      }
    }
  }
])
```

---

## 🛠️ Exportar Datos

### Exportar a CSV para Excel

```bash
# Desde terminal (NO dentro de mongosh)

# Todas las ubicaciones de un empleado
mongoexport \
  --db luber_db \
  --collection employeeacceptances \
  --query '{"employeeId": ObjectId("60d5ec49c1234567890abcde")}' \
  --out empleado_ubicaciones.json

# Convertir a CSV
mongosh luber_db --eval "
  const result = db.employeeacceptances.findOne({employeeId: ObjectId('60d5ec49c1234567890abcde')});
  const locs = result.employeeUbication.locationHistory;
  let csv = 'timestamp,latitude,longitude,accuracy\n';
  locs.forEach(loc => {
    csv += loc.timestamp + ',' + loc.latitude + ',' + loc.longitude + ',' + loc.accuracy + '\n';
  });
  print(csv);
" > ubicaciones.csv
```

### Exportar a GeoJSON para mapas

```javascript
// Para usar en Google Maps o Mapbox
const result = db.employeeacceptances.findOne(
  { scheduleId: ObjectId("60d5ec49c1234567890abcde") }
);

const geojson = {
  type: "FeatureCollection",
  features: result.employeeUbication.locationHistory.map(loc => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [loc.longitude, loc.latitude]
    },
    properties: {
      accuracy: loc.accuracy,
      timestamp: loc.timestamp
    }
  }))
};

JSON.stringify(geojson);
```

---

## 🔐 Mantenimiento de Base de Datos

### Limpiar ubicaciones antiguas (> 30 días)

```javascript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

db.employeeacceptances.updateMany(
  { "employeeUbication.timestamp": { $lt: thirtyDaysAgo } },
  {
    $set: {
      "employeeUbication.locationHistory": []
    }
  }
)
```

### Crear índice para búsquedas rápidas

```javascript
// Hacer búsquedas de ubicación más rápidas
db.employeeacceptances.createIndex({ "employeeUbication.timestamp": -1 })
db.employeeacceptances.createIndex({ "employeeUbication.latitude": 1, "employeeUbication.longitude": 1 })
db.employeeacceptances.createIndex({ employeeId: 1, "employeeUbication.timestamp": -1 })
```

### Ver tamaño de colección

```javascript
// Tamaño total de la colección
db.employeeacceptances.stats()

// Tamaño de un documento
const doc = db.employeeacceptances.findOne();
Object.bsonsize(doc) // en bytes
```

---

## 💻 Ejemplos en Node.js

### Obtener ubicaciones en una ruta

```javascript
// En tu código de Node.js/Express
const employeeAcceptance = await EmployeeAcceptance.findOne({
  scheduleId: scheduleId
});

const locations = employeeAcceptance.employeeUbication.locationHistory;
console.log(`Total de ubicaciones: ${locations.length}`);

locations.forEach((loc, index) => {
  console.log(`${index + 1}. ${loc.latitude}, ${loc.longitude} (±${loc.accuracy}m) - ${loc.timestamp}`);
});
```

### Enviar ubicaciones al frontend

```javascript
app.get('/api/order-locations/:scheduleId', async (req, res) => {
  const acceptance = await EmployeeAcceptance.findOne({
    scheduleId: req.params.scheduleId
  });
  
  if (!acceptance) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }
  
  res.json({
    current: {
      lat: acceptance.employeeUbication.latitude,
      lon: acceptance.employeeUbication.longitude,
      accuracy: acceptance.employeeUbication.accuracy,
      timestamp: acceptance.employeeUbication.timestamp
    },
    history: acceptance.employeeUbication.locationHistory,
    count: acceptance.employeeUbication.locationHistory.length
  });
});
```

### Visualizar en Google Maps

```html
<!-- En tu HTML -->
<div id="map" style="width: 100%; height: 400px;"></div>

<script>
  // Obtener ubicaciones de la API
  fetch('/api/order-locations/507f1f77bcf86cd799439011')
    .then(r => r.json())
    .then(data => {
      const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: data.current.lat, lng: data.current.lon },
        zoom: 15
      });
      
      // Dibujar ruta
      const polyline = new google.maps.Polyline({
        path: data.history.map(loc => ({ 
          lat: loc.latitude, 
          lng: loc.longitude 
        })),
        map: map,
        strokeColor: '#667eea',
        strokeWeight: 3
      });
      
      // Marcador final
      new google.maps.Marker({
        position: { lat: data.current.lat, lng: data.current.lon },
        map: map,
        title: 'Ubicación actual'
      });
    });
</script>
```

---

## 🐛 Debugging

### Ver qué se está guardando

```javascript
// En el servidor, dentro de /update-employee-location
console.log('Antes de guardar:', JSON.stringify(
  employeeAcceptance.employeeUbication,
  null,
  2
));

await employeeAcceptance.save();

console.log('Después de guardar:', JSON.stringify(
  employeeAcceptance.employeeUbication,
  null,
  2
));
```

### Verificar conectividad MongoDB

```bash
# En terminal
mongosh --eval "db.adminCommand('ping')"

# Debe responder: { ok: 1 }
```

---

Última actualización: 2026-02-02
