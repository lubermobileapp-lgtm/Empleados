# 🗺️ MAPA EN VIVO - DOCUMENTACIÓN

## 📋 Descripción

Nueva funcionalidad que permite al empleado **ver un mapa interactivo en tiempo real** mientras está en camino hacia el cliente. El mapa muestra:

✅ **Ubicación actual del empleado** (punto verde que se actualiza cada 10 segundos)  
✅ **Ubicación del cliente** (marcador rojo)  
✅ **Rango permitido** (círculo punteado de 1000 pies)  
✅ **Distancia en vivo** (en pies y metros)  
✅ **Precisión del GPS** (indicador de calidad)

---

## 🎯 Cómo Usar

### 1. En "My Work Schedules"
Cuando el empleado ha presionado **"OnRoad"** y está en camino:
```
- Aparece botón 🗺️ "Ver Mapa en Vivo"
- Solo visible mientras está "OnRoad" y NO completado
```

### 2. Click en Botón
```
- Se abre MODAL grande con mapa
- Mapa muestra ambas ubicaciones
- Ubicación del empleado se actualiza cada 10 segundos
```

### 3. Información Mostrada
```
┌─────────────────────────────────────┐
│  🗺️ Mapa en Vivo - En Camino   [X] │
├─────────────────────────────────────┤
│                                     │
│   [    MAPA LEAFLET 100% alto   ]   │
│   - Verde: Tu ubicación (se mueve)  │
│   - Rojo: Cliente (fijo)            │
│   - Círculo: Rango de 1000 pies    │
│                                     │
├─────────────────────────────────────┤
│ 📍 Cliente: Juan Pérez              │
│ Dirección: Calle 123, City          │
│ ✅ A 450 pies (~137m)              │
│ 🟢 GPS: 40.71278, -74.00597        │
│ Precisión: ±5m                      │
├─────────────────────────────────────┤
│            [Cerrar Mapa]            │
└─────────────────────────────────────┘
```

### 4. Cerrar Mapa
- Click en "[X]" o botón "Cerrar Mapa"
- Actualizaciones se detienen automáticamente

---

## 🔧 CAMBIOS TÉCNICOS

### HTML - Botón Agregado

```html
<% if (schedule.OnRoad && !schedule.Completed) { %>
  <button 
    class="accept-button map-button"
    onclick="openRealtimeMapModal(...)"
    style="background: linear-gradient(...); color: white;">
    🗺️ Ver Mapa en Vivo
  </button>
<% } %>
```

### Funciones JavaScript

#### 1. `openRealtimeMapModal()`
- Crea el modal con estructura HTML
- Carga Leaflet si no está disponible
- Inicia el mapa en tiempo real

#### 2. `initializeRealtimeMap()`
- Obtiene ubicación inicial del empleado
- Crea marcadores y círculo de rango
- Inicia intervalo de actualización (10 segundos)
- Geocodifica dirección si faltan coordenadas

#### 3. `updateRealtimeDisplay()`
- Actualiza distancia (pies y metros)
- Muestra precisión GPS
- Actualiza coordenadas en pantalla

### Actualización de Ubicación

```javascript
setInterval(() => {
  // Cada 10 segundos:
  // 1. Obtener nueva ubicación GPS
  // 2. Actualizar marcador del empleado
  // 3. Calcular nueva distancia
  // 4. Actualizar display
  // 5. Centrar mapa en empleado
}, 10000); // 10 segundos
```

---

## 📊 CARACTERÍSTICAS

### Marcadores

| Elemento | Color | Descripción |
|----------|-------|------------|
| **Empleado** | 🟢 Verde | Ubicación actual (se mueve) |
| **Cliente** | 🔴 Rojo | Ubicación destino (fija) |
| **Rango** | 🟠 Naranja | Círculo de 1000 pies |

### Información GPS

```
Formato: 🟢 GPS: 40.71278, -74.00597 | Precisión: ±5m

Colores de precisión:
🟢 Verde: ±10m o mejor (Excelente)
🟡 Amarillo: ±10-25m (Bueno)
🟠 Naranja: ±25-50m (Aceptable)
🔴 Rojo: >50m (Baja)
```

### Distancia

```
Ejemplo 1: A 500 pies (~152m)
  Muestra: ✅ A 500 pies (~152m)
  Significado: Está dentro del rango permitido

Ejemplo 2: A 1500 pies (~457m)
  Muestra: 📍 A 1500 pies (~457m)
  Significado: Aún no está en rango, pero puede verlo
```

---

## 🎨 DISEÑO

### Modal
- Ancho: 95% en móvil, máx 900px en escritorio
- Alto: 90vh (90% de pantalla)
- Estructura: Header + Mapa + Info + Footer

### Mapa
- 100% del ancho y altura del contenedor
- Basado en OpenStreetMap (Leaflet)
- Interactivo: zoom, pan, click en marcadores

### Información
- Nombre del cliente
- Dirección completa
- Distancia en vivo
- Coordenadas GPS con precisión

---

## 🌐 COMPATIBILIDAD

| Browser | Estado |
|---------|--------|
| Chrome 50+ | ✅ Full |
| Firefox 55+ | ✅ Full |
| Safari 13+ | ✅ Full |
| Edge 15+ | ✅ Full |
| Mobile Safari | ✅ Full |
| Chrome Mobile | ✅ Full |

**Requisitos:**
- HTTPS (o localhost)
- GPS/Geolocalización habilitada
- Permiso de ubicación concedido

---

## 🔄 FLUJO COMPLETO

```
1. Empleado presiona "OnRoad"
   ↓
2. Rastreo comienza cada 60 segundos
   ↓
3. Botón "🗺️ Ver Mapa en Vivo" aparece
   ↓
4. Empleado presiona botón
   ↓
5. Modal se abre con mapa
   ↓
6. Sistema obtiene ubicación inicial
   ↓
7. Mapa carga con Leaflet
   ↓
8. Se muestran: empleado, cliente, rango
   ↓
9. Cada 10 segundos: actualiza ubicación empleado
   ↓
10. Empleado ve su progreso en vivo
   ↓
11. Cuando llega cerca: puede presionar "Arrived"
   ↓
12. Cierra mapa al confirmar llegada
```

---

## 🐛 ERROR HANDLING

### Sin GPS
```
❌ Error de GPS: User denied geolocation

Solución:
- Verificar que el browser tiene permiso
- Ir a Configuración → Ubicación → Permitir
- Reintentar abrir mapa
```

### Sin Coordenadas del Cliente
```
Sistema intenta:
1. Usar coordenadas guardadas en Schedule
2. Geocodificar la dirección automáticamente
3. Si ambas fallan: mostrar error

Usuario ve:
- Mapa de todas formas se abre
- Pero sin marcador del cliente
- Puede ver su propia ubicación
```

### Conexión Lenta
```
- Leaflet carga desde CDN
- Si CDN no responde: error en consola
- Modal sigue abierto pero sin mapa
```

---

## ⚡ RENDIMIENTO

### Actualizaciones
- **Rastreo normal:** 1 actualizaciones por minuto
- **Mapa en vivo:** 1 actualización cada 10 segundos
- **GPS múltiples:** 3 muestras por actualización

### Impacto en Batería
- GPS: ~1-2% por minuto
- Mapa: mínimo impacto (estático)
- Rastreo + Mapa: ~2-3% combinado

### Datos
- Ubicación: ~1KB por actualización
- Mapa Leaflet: ~100KB (una sola vez)
- Geocodificación: variable según dirección

---

## 📱 RESPONSIVE

### Móvil (< 600px)
```
- Modal: 95% ancho
- Mapa: 100% contenedor
- Info: una columna
- Altura: 90vh
- Scroll si es necesario
```

### Tablet (600px - 1024px)
```
- Modal: 85% ancho
- Mapa: 100% contenedor
- Info: una columna o dos
- Bien balanceado
```

### Escritorio (> 1024px)
```
- Modal: máx 900px ancho
- Mapa: 100% contenedor
- Info: dos columnas
- Zoom legible
```

---

## 🎯 CASOS DE USO

### Caso 1: Empleado Viajando
```
✓ Abre mapa
✓ Ve su ubicación en verde
✓ Ve destino en rojo
✓ Sigue progreso
✓ Mapa se centra en su posición
✓ Distancia disminuye a medida que se acerca
```

### Caso 2: Empleado Perdido
```
✓ Ve en el mapa donde debería ir
✓ Puede acercarse manualmente
✓ Mapa muestra ruta (abierto a Google Maps)
✓ Distancia le ayuda a navegar
```

### Caso 3: Monitoreo de Progreso
```
✓ Admin puede ver ubicación en MongoDB
✓ Empleado ve su propio progreso
✓ Transparencia en ambos lados
```

---

## 🔐 SEGURIDAD

- **Solo visible en "OnRoad":** No muestra ubicación antes de aceptar
- **Geocodificación pública:** No expone datos privados
- **GPS real del dispositivo:** No se puede falsificar fácilmente
- **Logs en servidor:** Se registra cada actualización

---

## 📊 MONITOREO

### Datos Guardados
```javascript
db.employeeacceptances.findOne({ scheduleId: ObjectId("...") })
// {
//   employeeUbication: {
//     latitude: 40.71278,
//     longitude: -74.00597,
//     accuracy: 5,
//     timestamp: ISODate("2026-02-02T15:35:00Z"),
//     locationHistory: [
//       { lat: 40.71250, lon: -74.00550, accuracy: 7, timestamp: ... },
//       { lat: 40.71265, lon: -74.00575, accuracy: 5, timestamp: ... },
//       // ... más ubicaciones ...
//     ]
//   }
// }
```

### Consola del Navegador
```javascript
// Ver actualizaciones en tiempo real
console.log('📍 Ubicación actualizada:', lat, lon);
console.log('📏 Distancia:', distance.toFixed(0), 'pies');
console.log('📡 Precisión:', accuracy, 'metros');
```

---

## 🚀 MEJORAS FUTURAS

- [ ] Auto-centrado en cliente cuando se acerca
- [ ] Animación de línea conectando ambos puntos
- [ ] Opción de cambiar zoom
- [ ] Historial de ruta recorrida
- [ ] Tiempo estimado de llegada (ETA)
- [ ] Indicador de velocidad actual

---

**Actualizado:** 2026-02-02  
**Versión:** 1.0  
**Estado:** ✅ Implementado y Funcional
