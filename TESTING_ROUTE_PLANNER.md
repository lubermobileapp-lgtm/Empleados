# 🧪 TESTING GUIDE - Route Planner Feature

## PREREQUISITOS

1. Base de datos con empleados y schedules
2. Servidor ejecutándose: `npm start`
3. Navegador moderno con soporte para Google Maps
4. Al menos 3 schedules disponibles en diferentes horarios

## TEST 1: SELECCIÓN Y CONTADOR

**Objetivo:** Verificar que la selección múltiple funciona correctamente

### Pasos:
```
1. Log in como empleado
2. Ir a /profile
3. Ver lista de schedules disponibles
4. Hacer click en checkbox de Schedule 1
   → Counter debe mostrar "1 selected"
5. Hacer click en checkbox de Schedule 2
   → Counter debe mostrar "2 selected"
6. Hacer click en checkbox de Schedule 3
   → Counter debe mostrar "3 selected"
```

### Resultado Esperado:
- ✅ Counter actualiza en vivo
- ✅ Checkboxes marcan/desmarcan correctamente
- ✅ Botón "Clear Selection" limpia todo

---

## TEST 2: VALIDACIÓN MÍNIMA (0 ofertas)

**Objetivo:** Verificar que no se abra Route Planner sin selección

### Pasos:
```
1. No seleccionar ningún schedule
2. Hacer click en "📍 Route Planner"
```

### Resultado Esperado:
```
Alert: ❌ "Please select at least one offer to plan a route"
Modal NO se abre
```

---

## TEST 3: VALIDACIÓN MÍNIMA (1 oferta)

**Objetivo:** Verificar que se requieren mínimo 2 ofertas

### Pasos:
```
1. Seleccionar solo 1 schedule
2. Hacer click en "📍 Route Planner"
```

### Resultado Esperado:
```
Alert: ⚠️ "Select at least 2 offers to create a meaningful route"
Modal NO se abre
```

---

## TEST 4: ABRIR ROUTE PLANNER (2+ ofertas)

**Objetivo:** Verificar que el modal se abre correctamente

### Pasos:
```
1. Seleccionar 2+ schedules
2. Hacer click en "📍 Route Planner"
```

### Resultado Esperado:
```
✅ Modal se abre
✅ Se muestra lista de paradas a la izquierda
✅ Se muestra Google Maps a la derecha
✅ Cada parada tiene número (1️⃣, 2️⃣, etc.)
✅ Botón "✅ Accept Route" está disponible
```

---

## TEST 5: VISUALIZACIÓN DE PARADAS

**Objetivo:** Verificar que las paradas se muestren correctamente

### Pasos:
```
1. Abrir Route Planner con 3 schedules
2. Observar lista de paradas a la izquierda
```

### Resultado Esperado:
```
Parada 1:
  - Stop Number: 1️⃣
  - Customer Name: (nombre del cliente)
  - Address: (dirección completa)
  - Time: 📅 date @ 🕐 time
  - Price: 💰 $XXX

Parada 2:
  - Stop Number: 2️⃣
  - (similar a la anterior)

Parada 3:
  - Stop Number: 3️⃣
  - (similar a la anterior)
```

---

## TEST 6: GOOGLE MAPS

**Objetivo:** Verificar que Google Maps cargue y muestre la ruta

### Pasos:
```
1. Abrir Route Planner con 3 schedules en diferentes ubicaciones
2. Esperar 2-3 segundos para carga del mapa
```

### Resultado Esperado:
```
✅ Mapa visible a la derecha
✅ 3 marcadores numerados (1, 2, 3)
✅ Ruta azul conecta los marcadores en orden
✅ Mapa se centra y ajusta zoom para ver todos los puntos
✅ Nombre de dirección aparece al pasar cursor sobre marcador
```

### Notas:
- Si alguna dirección no geocodifica, puede no aparecer en el mapa
- Verificar que las direcciones sean válidas en Google Maps

---

## TEST 7: RESUMEN DE RUTA

**Objetivo:** Verificar cálculo de totales

### Pasos:
```
1. Abrir Route Planner con 3 schedules:
   - Schedule A: $150
   - Schedule B: $200
   - Schedule C: $100
2. Ver resumen a la derecha del mapa
```

### Resultado Esperado:
```
📊 Route Summary
Stops: 3
Total Earnings: $450
───────────────────
Total Earnings: $450
```

---

## TEST 8: CERRAR MODAL (Botón Cancel)

**Objetivo:** Verificar cierre del modal

### Pasos:
```
1. Abrir Route Planner
2. Hacer click en "Cancel" button
```

### Resultado Esperado:
```
✅ Modal se cierra
✅ Selecciones se mantienen (checkboxes siguen marcados)
✅ Contador sigue mostrando el número de selecciones
```

---

## TEST 9: CERRAR MODAL (Click en fondo)

**Objetivo:** Verificar cierre del modal haciendo click en background

### Pasos:
```
1. Abrir Route Planner
2. Hacer click en el área gris (fuera del modal)
```

### Resultado Esperado:
```
✅ Modal se cierra
✅ Selecciones se mantienen
```

---

## TEST 10: CERRAR MODAL (Botón X)

**Objetivo:** Verificar cierre del modal con el botón X

### Pasos:
```
1. Abrir Route Planner
2. Hacer click en "×" (top right del modal)
```

### Resultado Esperado:
```
✅ Modal se cierra
✅ Selecciones se mantienen
```

---

## TEST 11: ACEPTAR RUTA (Sin conflictos)

**Objetivo:** Verificar aceptación de ruta completa

### Pasos:
```
1. Seleccionar 3 schedules:
   - Schedule A: 10:00, Cliente X, $150
   - Schedule B: 14:00, Cliente Y, $200
   - Schedule C: 16:00, Cliente Z, $100
2. Abrir Route Planner
3. Verificar ruta en Google Maps
4. Hacer click en "✅ Accept Route"
```

### Resultado Esperado:
```
✅ Loading state activo (botón deshabilitado)
✅ Alert exitoso: "✅ Route accepted! All 3 offers are now reserved."
✅ Modal se cierra
✅ Página se recarga
✅ Los 3 schedules ahora muestran "Reserved"
```

### Verificación en BD:
```
Schedule A: reserved: true, acceptedBy: empId, stopOrder: 1
Schedule B: reserved: true, acceptedBy: empId, stopOrder: 2
Schedule C: reserved: true, acceptedBy: empId, stopOrder: 3
```

---

## TEST 12: CONFLICTO DE HORARIO (Mismo cliente = OK)

**Objetivo:** Verificar que MISMO CLIENTE a la misma hora es permitido

### Pasos:
```
1. Seleccionar 2 schedules:
   - Schedule A: 10:00, Cliente X, Dirección A
   - Schedule B: 10:00, Cliente X, Dirección B
   (Mismo cliente, misma hora, diferente dirección)
2. Abrir Route Planner
3. Hacer click en "✅ Accept Route"
```

### Resultado Esperado:
```
✅ Route accepted successfully
✅ Ambas ofertas aceptadas
✅ stopOrder 1 y 2 asignados
```

---

## TEST 13: CONFLICTO DE HORARIO (Diferente cliente = ERROR)

**Objetivo:** Verificar que DIFERENTE CLIENTE a la misma hora es rechazado

### Pasos:
```
1. Seleccionar 2 schedules:
   - Schedule A: 10:00, Cliente X
   - Schedule B: 10:00, Cliente Y
   (Diferente cliente, misma hora)
2. Abrir Route Planner
3. Hacer click en "✅ Accept Route"
```

### Resultado Esperado:
```
❌ Alert: "⛔ Conflicto: Ya tienes una oferta a las 10:00 en la fecha XXXX con otro cliente"
❌ Route NO accepted
✅ Botón se vuelve a habilitar
```

---

## TEST 14: OFERTA TOMADA POR OTRO (Race condition)

**Objetivo:** Verificar manejo cuando otra persona toma la oferta

### Pasos:
```
1. Empleado A selecciona 3 schedules y abre Route Planner
2. Empleado B acepta Schedule B (en otra pestaña)
3. Empleado A hace click en "✅ Accept Route"
```

### Resultado Esperado:
```
❌ Alert: "Una o más ofertas ya fueron aceptadas (es posible que..."
❌ Route NO accepted
✅ Botón se vuelve a habilitar
✅ Empleado puede limpiar selección e intentar con otras
```

---

## TEST 15: CLEAR SELECTION

**Objetivo:** Verificar que limpiar selección funciona

### Pasos:
```
1. Seleccionar 3 schedules
2. Counter muestra "3 selected"
3. Hacer click en "🗑️ Clear Selection"
```

### Resultado Esperado:
```
✅ Todos los checkboxes se desmarcan
✅ Counter muestra "0 selected"
```

---

## TEST 16: RESPONSIVE DESIGN - Mobile

**Objetivo:** Verificar que el modal es responsive en mobile

### Pasos:
```
1. Abrir DevTools (F12)
2. Cambiar a móvil (iPhone SE)
3. Seleccionar 2 schedules
4. Abrir Route Planner
```

### Resultado Esperado:
```
✅ Modal se adapta al ancho de pantalla
✅ Lista de paradas está ARRIBA del mapa
✅ Mapa ocupa ancho completo
✅ Botones son clicables en mobile
✅ Scroll vertical disponible
✅ Texto legible sin zoom
```

---

## TEST 17: RESPONSIVE DESIGN - Tablet

**Objetivo:** Verificar que el modal es responsive en tablet

### Pasos:
```
1. Abrir DevTools (F12)
2. Cambiar a tablet (iPad)
3. Seleccionar 2 schedules
4. Abrir Route Planner
```

### Resultado Esperado:
```
✅ Grid es 1 columna o 2 columnas según espacio
✅ Mapa visible sin scroll horizontal
✅ Todo legible y clickeable
```

---

## TEST 18: PERFORMANCE (Muchas ofertas)

**Objetivo:** Verificar que funciona con muchas ofertas

### Pasos:
```
1. Crear 10+ schedules disponibles
2. Seleccionar 8 schedules
3. Abrir Route Planner
4. Esperar a que cargue mapa
5. Scroll en lista de paradas
```

### Resultado Esperado:
```
✅ Modal abre rápido (< 1 segundo)
✅ Mapa carga en 2-3 segundos
✅ Scroll suave en lista de paradas
✅ Ruta se dibuja correctamente
✅ Aceptación funciona sin delays
```

---

## TEST 19: DESATURACIÓN DE BOTÓN

**Objetivo:** Verificar que el botón se habilita/deshabilita correctamente

### Pasos:
```
1. Abrir Route Planner sin completar geocodificación
   → Botón debe estar DESHABILITADO (gris)
2. Esperar a que cargue el mapa
   → Botón se habilita (gradiente morado)
```

### Resultado Esperado:
```
✅ Botón comienza deshabilitado
✅ Se habilita cuando la ruta se carga exitosamente
✅ Se deshabilita si hay error en la ruta
```

---

## TEST 20: FLUJO COMPLETO (Happy Path)

**Objetivo:** Verificar flujo completo sin errores

### Pasos:
```
1. Login como empleado (sin schedules aceptados)
2. Ver /profile con 5+ schedules disponibles
3. Seleccionar 3 schedules en diferentes horarios
4. Hacer click "📍 Route Planner"
5. Esperar carga de Google Maps
6. Verificar paradas, direcciones y ruta
7. Hacer click "✅ Accept Route"
8. Confirmar alert de éxito
9. Esperar recarga de página
10. Verificar que 3 schedules ahora muestran "Reserved"
11. Verificar que pueden ver status buttons (OnRoad, etc)
```

### Resultado Esperado:
```
✅ Todos los pasos completados sin errores
✅ Página funciona fluida
✅ Datos guardados en base de datos correctamente
✅ Empleado puede ver sus schedules aceptados
```

---

## CHECKLIST DE QA

- [ ] Selección múltiple funciona
- [ ] Contador actualiza en vivo
- [ ] Modal abre solo con 2+ ofertas
- [ ] Google Maps carga y muestra ruta
- [ ] Paradas se numeran correctamente
- [ ] Resumen calcula total correcto
- [ ] Modal cierra con X, Cancel, y click afuera
- [ ] Ruta se acepta y recarga página
- [ ] Conflictos de horario se detectan
- [ ] Ofertas tomadas por otros se rechazan
- [ ] Clear Selection limpia todo
- [ ] Responsive en mobile, tablet, desktop
- [ ] Performance aceptable con muchas ofertas
- [ ] Botón se habilita/deshabilita correctamente
- [ ] Errores muestran mensajes claros
- [ ] Base de datos actualiza stopOrder
- [ ] Pueden continuar con flujo normal después

---

## REPORTAR BUGS

Si encuentras algún problema:

1. **Documentar pasos exactos** para reproducir
2. **Incluir error de consola** (F12 > Console)
3. **Ambiente**: Browser, OS, resolución
4. **Adjuntar**: Screenshots o video
5. **Enviar a**: [equipo de desarrollo]

---

**Versión:** 1.0
**Última actualización:** 28 Enero 2026
