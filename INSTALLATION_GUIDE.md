# 📦 INSTALACIÓN Y CONFIGURACIÓN - Route Planner

## CHECKLIST DE REQUISITOS

### Base de Datos
- [x] MongoDB ejecutándose
- [x] Colección `employees` con documentos de empleados
- [x] Colección `schedules` con documentos de schedules

### Node.js
- [x] Node.js instalado (v14+)
- [x] npm instalado
- [x] Dependencias instaladas: `npm install`

### Archivos Actualizados
- [x] `public/employeeProfile.ejs` - Interfaz del empleado
- [x] `public/css/employeeProfile.css` - Estilos del Route Planner
- [x] `server.js` - Nuevo endpoint `/accept-multiple-offers`

---

## PASO 1: ACTUALIZAR SCHEMA DE MONGODB

El nuevo endpoint usa un campo `stopOrder` en la colección `schedules`.

### Campo a agregar (OPCIONAL - se crea automáticamente):
```javascript
stopOrder: {
  type: Number,
  default: null,
  sparse: true  // No se requiere para todos
}
```

### Comando MongoDB:
```javascript
// Agregar campo a todos los schedules existentes
db.schedules.updateMany(
  { stopOrder: { $exists: false } },
  { $set: { stopOrder: null } }
);
```

**Nota:** Si no ejecutas esto, MongoDB lo hace automáticamente en el primer uso.

---

## PASO 2: VERIFICAR GOOGLE MAPS API KEY

El código incluye una Google Maps API Key embebida:

```javascript
// En public/employeeProfile.ejs:
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxagoK4QowkTiQfLFn222o"></script>
```

### Para Producción (RECOMENDADO):

1. **Crear variable de entorno en `.env`:**
```
GOOGLE_MAPS_API_KEY=AIzaSyB41DRUbKWJHPxagoK4QowkTiQfLFn222o
```

2. **Actualizar en `server.js`:**
```javascript
// Agregar después de require dotenv
const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyB41DRUbKWJHPxagoK4QowkTiQfLFn222o';

// Pasar al render
res.render('employeeProfile', {
  emp,
  schedules,
  googleMapsKey,  // ← Agregar
  selectedAccountType
});
```

3. **Actualizar en `public/employeeProfile.ejs`:**
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=<%= googleMapsKey %>"></script>
```

### Verificar que la API Key tenga permisos para:
- ✅ Maps JavaScript API
- ✅ Geocoding API
- ✅ Directions API

---

## PASO 3: INICIAR SERVIDOR

```bash
cd "f:\Luber\Luber Official\Empleados\Registro"
npm start
```

O si usas `node`:
```bash
node server.js
```

### Verificar en consola:
```
✅ Server running on port 3000
✅ MongoDB connected
✅ Socket.IO initialized
```

---

## PASO 4: PROBAR LA FUNCIONALIDAD

### Test 1: Verificar que los archivos se carguen
```
1. Ir a http://localhost:3000/profile
2. Abrir DevTools (F12)
3. Ir a Console tab
4. Verificar que NO hay errores de sintaxis
```

### Test 2: Verificar que Google Maps carga
```
1. Abrir DevTools
2. Ir a Network tab
3. Filtrar por "maps.googleapis.com"
4. Debe haber request exitoso (200)
```

### Test 3: Prueba rápida de Route Planner
```
1. Login como empleado con schedules disponibles
2. Seleccionar 2+ schedules
3. Hacer click en "📍 Route Planner"
4. Verificar que modal se abre
5. Verificar que Google Maps se carga
6. Hacer click en "✅ Accept Route"
7. Verificar que acepta sin errores
```

---

## TROUBLESHOOTING

### Error: "Google is not defined"
**Causa:** Google Maps API no cargó
**Solución:** 
- Verificar conexión a internet
- Verificar que API Key es válida
- Revisar Network tab en DevTools

### Error: "Cannot read property 'getContext' of null"
**Causa:** Elemento del mapa no existe
**Solución:**
- Verificar que `<div id="routeMap">` existe en HTML
- Esperar a que DOM cargue completamente

### Error: "Geolocation error: ZERO_RESULTS"
**Causa:** Dirección no es válida en Google Maps
**Solución:**
- Verificar que la dirección en schedule es correcta
- Intentar con diferentes direcciones
- Agregar ciudad/estado/país si falta

### Error: "ERR_INVALID_URL"
**Causa:** URL de Google Maps API inválida
**Solución:**
- Verificar API Key
- Verificar sintaxis de URL
- Usar URL correcta sin caracteres especiales

### Error: "Directions request failed: OVER_QUERY_LIMIT"
**Causa:** Google Maps API alcanzó limite de requests
**Solución:**
- Esperar unos minutos
- Mejorar plan de API Key
- Implementar caché de rutas

### Modal no se abre
**Causa:** JavaScript error o validación falla
**Solución:**
- Abrir DevTools > Console y revisar error
- Verificar que al menos 2 ofertas están seleccionadas
- Hacer refresh de página

### Checkboxes no guardan selección
**Causa:** Evento `change` no se dispara
**Solución:**
- Revisar en DevTools > Elements que checkbox existe
- Verificar que `updateSelectionCounter()` se llama
- Hacer refresh y reintentar

---

## VERIFICACIÓN DE INSTALACIÓN

Ejecutar este checklist completo:

```javascript
// 1. Verificar que endpoint existe
fetch('/accept-multiple-offers', {
  method: 'POST',
  body: JSON.stringify({ scheduleIds: [] })
})
.then(r => r.status !== 404 ? console.log('✅ Endpoint OK') : console.log('❌ Endpoint NO ENCONTRADO'))
.catch(e => console.log('❌ Error:', e));

// 2. Verificar que Google Maps está disponible
console.log(typeof google !== 'undefined' ? '✅ Google Maps OK' : '❌ Google Maps NO CARGÓ');

// 3. Verificar checkboxes
console.log(document.querySelectorAll('.schedule-checkbox').length > 0 ? '✅ Checkboxes OK' : '❌ Checkboxes NO ENCONTRADOS');

// 4. Verificar modal
console.log(document.getElementById('routePlannerModal') ? '✅ Modal OK' : '❌ Modal NO ENCONTRADO');

// 5. Verificar funciones
console.log(typeof openRoutePlanner !== 'undefined' ? '✅ Funciones OK' : '❌ Funciones NO ENCONTRADAS');
```

Copia y pega esto en DevTools Console y verifica que todos muestren ✅

---

## MIGRACIÓN DE DATOS (Si tienes schedules antiguos)

Si tienes schedules aceptados antes de esta actualización, el campo `stopOrder` será `null`.

### Opción 1: Dejar null (RECOMENDADO)
- Los schedules antiguos seguirán funcionando
- El campo `stopOrder` solo se establece para nuevas aceptaciones

### Opción 2: Migrar schedules antiguos
```javascript
// Script MongoDB para migrar
db.schedules.updateMany(
  { reserved: true, stopOrder: null },
  [
    {
      $set: {
        stopOrder: 1  // O un valor específico
      }
    }
  ]
);
```

---

## CONFIGURACIÓN EN PRODUCCIÓN

### 1. Variables de Entorno (.env)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
GOOGLE_MAPS_API_KEY=AIzaSyB41DRUbKWJHPxagoK4QowkTiQfLFn222o
SESSION_SECRET=your-secret-key
PORT=3000
```

### 2. Google Maps API - Restricciones
En Google Cloud Console:
- Restringir por dominio (productivo)
- Restringir por IP si es posible
- Activar Application restrictions

### 3. HTTPS (Recomendado)
Google Maps requiere HTTPS en producción. Configurar:
```javascript
// En app.js o server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

### 4. Rate Limiting
Para proteger contra abuso del endpoint:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10 // 10 requests por IP
});

app.post('/accept-multiple-offers', limiter, async (req, res) => {
  // ...
});
```

---

## LOGS Y MONITOREO

### Logs en Backend
Se agregaron logs console en el endpoint:

```javascript
console.log('📡 Request recibido en /accept-multiple-offers');
console.log('scheduleIds:', scheduleIds);
console.log('❌ Error en aceptar múltiples ofertas:', err);
```

### Monitoreo Recomendado
- Alertas si el endpoint devuelve errores 5xx
- Tracking de tiempo de respuesta
- Logging de conflictos de horario detectados
- Monitoreo de uso de Google Maps API

---

## ROLLBACK (Si es necesario)

Si necesitas revertir los cambios:

1. **Restaurar archivos original:**
```bash
git checkout public/employeeProfile.ejs
git checkout public/css/employeeProfile.css
git checkout server.js
```

2. **Limpiar datos (opcional):**
```javascript
// Remover campo stopOrder si es necesario
db.schedules.updateMany({}, { $unset: { stopOrder: "" } });
```

3. **Reiniciar servidor:**
```bash
npm start
```

---

## SOPORTE Y ACTUALIZACIONES

Para reportar problemas o sugerencias:
1. Revisar TESTING_ROUTE_PLANNER.md para reproducir el issue
2. Recopilar logs de consola (DevTools F12)
3. Describir pasos exactos para reproducir
4. Incluir screenshot/video si es posible

---

**Última actualización:** 28 Enero 2026
**Versión:** 1.0
**Estado:** ✅ Listo para producción
