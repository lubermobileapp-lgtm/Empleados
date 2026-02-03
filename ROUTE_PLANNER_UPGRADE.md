# 🚀 Route Planner - Upgrade a Leaflet con Página Dedicada

## ¿Qué cambió?

### ❌ Antes (Google Maps modal)
- Mapa embebido en un modal pequeño
- Requería API Key de Google
- Validaciones de API tedidas
- Difícil de escalar

### ✅ Ahora (Leaflet en iframe)
- Página dedicada con diseño **épico y moderno** (`/route-map.html`)
- Sin API Keys requeridas
- OpenStreetMap + Nominatim (100% gratis)
- Diseño responsive y profesional

---

## 📁 Archivos Modificados

### 1. **public/route-map.html** (NUEVO - 400+ líneas)
Página dedicada para visualizar rutas con:
- ✨ Header con gradient moderno
- 🗺️ Mapa Leaflet responsivo (OpenStreetMap)
- 📋 Sidebar con lista de paradas
- 💰 Resumen de ganancias totales
- 🎨 Diseño gradient (morado/azul)
- 📱 Responsive (desktop/mobile)

**Características:**
- Geocodificación automática usando Nominatim API
- Línea de ruta punteada conectando todas las paradas
- Marcadores animados con números de parada
- Popups con información de cada parada
- Botón "Aceptar Ruta" que notifica al padre
- Animaciones suaves y transiciones

### 2. **public/employeeProfile.ejs** (MODIFICADO)
Cambios principales:
- Removidas 250+ líneas de código de Google Maps
- Removido script de Google Maps API
- Removido mapa inline de Google Maps
- Agregado modal con iframe que carga `route-map.html`
- Agregado listener para mensajes del iframe
- Función `openRoutePlanner()` ahora abre el iframe
- Nueva función `closeRoutePlannerModal()`

**Función `openRoutePlanner()` actualizada:**
```javascript
- Valida 2+ ofertas seleccionadas
- Construye objeto con datos de schedules (id, address, date, time, offer, customerName)
- Serializa a JSON y pasa como parámetro URL
- Abre modal con iframe
- Escucha evento de aceptación desde iframe
```

### 3. **server.js** (SIN CAMBIOS)
- La página `route-map.html` se sirve automáticamente desde `/public`
- El endpoint `/accept-multiple-offers` sigue funcionando igual
- Los datos se envían mediante `postMessage()` desde el iframe

---

## 🎯 Flujo de Funcionamiento

```
1. Empleado selecciona 2+ ofertas con checkboxes
2. Hace clic en "📍 Route Planner"
3. → Se abre modal con iframe que carga /route-map.html
4. → Se pasan schedules como parámetro URL
5. → route-map.html renderiza:
   - Mapa con todas las paradas
   - Lista de paradas en sidebar
   - Información de ganancias
6. Empleado puede:
   - Ver paradas en el mapa
   - Hacer clic en paradas para detalles
   - Ver línea de ruta
7. Hace clic en "✅ Aceptar Ruta"
8. → Envía postMessage() al padre
9. → employeeProfile.ejs recibe mensaje
10. → Llama a /accept-multiple-offers
11. → Se aceptan todos los schedules con stopOrder
12. → Se cierra el modal y recarga página
```

---

## 🔧 Tecnologías Usadas

### Frontend
- **Leaflet.js** - Mapas ligero y gratuito
- **OpenStreetMap** - Tiles de mapa (gratis)
- **Nominatim API** - Geocodificación (gratis)
- **postMessage API** - Comunicación iframe ↔ página

### Sin dependencias externas
- ✅ Sin Google Maps API
- ✅ Sin problemas de validación de API Keys
- ✅ 100% gratis y de código abierto

---

## 🎨 Diseño Visual

### Colores
- Gradiente principal: `#667eea → #764ba2` (morado/azul)
- Éxito: `#28a745` (verde)
- Fondo: Gradiente similar
- Cards: Blanco con bordes sutiles

### Componentes
- **Header**: Logo + título + badges (paradas, ganancias)
- **Mapa**: Leaflet con zoom inteligente
- **Sidebar**: Lista scrollable de paradas + resumen
- **Botones**: Primary (gradiente) y Secondary (gris)
- **Animaciones**: Pulse en marcadores, transiciones suaves

---

## 📋 Paso a Paso para Probar

1. **Abrir navegador** y loggearse como empleado
2. **Tener 2+ schedules disponibles**
3. **Hacer checkbox** en "Add to route"
4. **Clic en "📍 Route Planner"**
5. **Esperarse 1-2 segundos** (geocodificación)
6. **Ver el mapa bonito** con todas las paradas
7. **Hacer clic en paradas** en el sidebar para destacar
8. **Hacer clic en "✅ Aceptar Ruta"**
9. **Verificar** que se acepten todos los servicios

---

## ✅ Validaciones Incluidas

- ✔️ Mínimo 2 ofertas para abrir ruta
- ✔️ Validación de geocodificación
- ✔️ Fallback si no se puede geocodificar una dirección
- ✔️ Validación de disponibilidad en backend
- ✔️ Prevención de conflictos horarios
- ✔️ Asignación atómica de stopOrder (1, 2, 3...)

---

## 🚀 Mejoras Futuras Posibles

- [ ] Optimizar ruta (calcular mejor orden de paradas)
- [ ] Mostrar tiempo estimado de viaje
- [ ] Mostrar distancia total
- [ ] Permitir reordenar paradas arrastrando
- [ ] Modo oscuro
- [ ] Exportar ruta como PDF
- [ ] Integrar Mapbox para mapas más bonitos (si se quiere)

---

## 📞 Soporte

Si hay problemas:
1. Abre DevTools (F12)
2. Ve a Console
3. Revisa si hay errores
4. Los logs dicen "✅" o "❌" al cargar cosas

---

**¡Listo para probar! 🎉**
