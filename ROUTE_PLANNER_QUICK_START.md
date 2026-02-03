# 🚀 RUTA PLANNER - GUÍA RÁPIDA DE USO

## ¿QUÉ ES LA NUEVA FUNCIONALIDAD?

Los empleados ahora pueden:
1. **Seleccionar múltiples schedules** sin aceptarlos aún
2. **Ver todas las direcciones en Google Maps** antes de comprometerse
3. **Visualizar la ruta completa** con paradas numeradas
4. **Aceptar todos los schedules de una sola vez** organizados en orden (Parada 1, 2, 3...)

## INTERFACE DEL EMPLEADO

### Antes (Anterior):
```
📅 Schedule 1
- Dirección A
- Botón "✅ Accept Offer"

📅 Schedule 2
- Dirección B
- Botón "✅ Accept Offer"

(Debe aceptar uno por uno)
```

### Ahora (Nueva):
```
✓ ☑️ Checkbox - Seleccionar sin aceptar
✓ 📍 Route Planner Button - Planificar ruta
✓ 🗑️ Clear Selection Button - Limpiar selección
✓ Contador en vivo "3 selected"

┌─────────────────────────────────────────────────┐
│ 📍 ROUTE PLANNER (Modal)                         │
├─────────────────────────────────────────────────┤
│ PARADAS (Izquierda)  │  MAPA + RESUMEN (Derecha)│
│                      │                          │
│ ┌──────────────────┐ │ ┌────────────────────┐   │
│ │ 1️⃣ Cliente A    │ │ │                    │   │
│ │ 📍 Dirección A  │ │ │    Google Maps     │   │
│ │ 💰 $150         │ │ │    con Ruta        │   │
│ └──────────────────┘ │ │                    │   │
│                      │ └────────────────────┘   │
│ ┌──────────────────┐ │                          │
│ │ 2️⃣ Cliente B    │ │ 📊 Resumen:              │
│ │ 📍 Dirección B  │ │ • 2 Paradas              │
│ │ 💰 $200         │ │ • Total: $350            │
│ └──────────────────┘ │                          │
│                      │ [CANCEL] [✅ ACCEPT]    │
└─────────────────────────────────────────────────┘
```

## PASOS PARA USAR

### 1. SELECCIONAR OFERTAS
```
✓ Marcar checkbox de cada oferta
✓ Contador muestra "3 selected"
✓ No es necesario aceptar aún
```

### 2. ABRIR ROUTE PLANNER
```
✓ Clic en "📍 Route Planner"
✓ Se valida: mínimo 2 ofertas seleccionadas
✓ Se abre modal con mapa
```

### 3. VER RUTA EN GOOGLE MAPS
```
✓ Parada 1️⃣, 2️⃣, 3️⃣... en el mapa
✓ Ruta optimizada dibujada en azul
✓ Direcciones listadas a la izquierda
✓ Total de ganancias mostrado
```

### 4. ACEPTAR RUTA COMPLETA
```
✓ Clic en "✅ Accept Route"
✓ TODOS los schedules se aceptan de una vez
✓ Se asigna orden de parada (stopOrder)
✓ Página se recarga para mostrar cambios
```

### 5. VER SCHEDULES ACEPTADOS
```
✓ Schedules ahora muestran "Reserved"
✓ Cada uno tiene su número de parada
✓ Empleado puede trabajar en ese orden
```

## VALIDACIONES AUTOMÁTICAS

### ❌ NO PERMITE (Muestra Error):
- Seleccionar menos de 2 ofertas
- 2 ofertas a la MISMA hora con DIFERENTE cliente
- Oferta ya aceptada por otro empleado
- Sin autenticación

### ✅ SÍ PERMITE:
- Mismo cliente a la misma hora (es el mismo cliente)
- Diferentes clientes en diferentes horarios
- Diferentes clientes en el mismo día pero diferente hora

## CAMPOS NUEVOS EN BASE DE DATOS

Se agregó el campo `stopOrder` al Schedule:
```javascript
{
  _id: "...",
  customerName: "Juan",
  clientAddress: "Calle 123",
  date: "2026-01-28",
  time: "10:00",
  reserved: true,
  acceptedBy: "emp123",
  stopOrder: 1  // ← NUEVO: Orden en la ruta
}
```

## TECNOLOGÍA USADA

### Frontend:
- HTML/CSS/JavaScript puro
- Google Maps API (Geocoding + Directions)
- Modal con diseño responsive

### Backend:
- Node.js/Express
- MongoDB bulkWrite (aceptación atómica)
- Validación de conflictos
- Socket.IO para notificaciones

## EJEMPLO PRÁCTICO

**Escenario:** Empleado quiere aceptar 3 servicios en una ruta

```
ANTES (Antigua forma):
─────────────────────
1. Ver Schedule 1 → Aceptar → ✓
2. Ver Schedule 2 → Aceptar → ✓
3. Ver Schedule 3 → Aceptar → ✓
(Total: 3 clics en diferentes ofertas)

AHORA (Nueva forma):
──────────────────
1. ☑️ Marcar Schedule 1
2. ☑️ Marcar Schedule 2
3. ☑️ Marcar Schedule 3
4. 📍 Clic en Route Planner
5. 🗺️ Ver ruta en Google Maps
6. ✅ Clic en Accept Route
(Total: 1 clic para aceptar todos + visualización de ruta)
```

## ERRORES COMUNES Y SOLUCIONES

### Error: "Please select at least one offer to plan a route"
**Causa:** No hay ofertas seleccionadas
**Solución:** Marcar al menos 2 checkboxes

### Error: "Select at least 2 offers to create a meaningful route"
**Causa:** Solo hay 1 oferta seleccionada
**Solución:** Seleccionar al menos 2 ofertas para crear una ruta

### Error: "⛔ Conflicto: Ya tienes una oferta a las..."
**Causa:** 2 ofertas a la misma hora con diferente cliente
**Solución:** Seleccionar ofertas en diferentes horarios

### Error: "Una o más ofertas ya fueron aceptadas"
**Causa:** Otro empleado tomó una oferta mientras planificabas
**Solución:** Limpiar selección y volver a intentar

## CARACTERÍSTICAS INCLUIDAS

✅ Selección múltiple con checkboxes
✅ Contador en vivo de selecciones
✅ Modal de ruta planner responsive
✅ Google Maps integrado
✅ Geocodificación automática de direcciones
✅ Dibujado de rutas optimizadas
✅ Marcadores numerados en mapa
✅ Resumen con total de ganancias
✅ Botón "Clear Selection" para resetear
✅ Validación de conflictos de horario
✅ Validación de disponibilidad de ofertas
✅ Aceptación atómica (todo o nada)
✅ Asignación automática de stopOrder
✅ Manejo de errores completo
✅ Cierre de modal al hacer clic afuera

## PRÓXIMAS CARACTERÍSTICAS SUGERIDAS

🔄 Reordenamiento de paradas antes de aceptar
⏱️ Mostrar tiempo estimado de ruta
📏 Mostrar distancia total
💾 Guardar historial de rutas completadas
📊 Comparar earnings: individual vs ruta
🗺️ Navegación GPS en tiempo real
📍 Guardar waypoints favoritos

---

**Versión:** 1.0
**Fecha:** 28 Enero 2026
**Status:** ✅ Listo para Producción
