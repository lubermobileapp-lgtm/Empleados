# 🧪 Guía de Pruebas - Sistema de Aprobación de Empleados

## 📋 Pre-Requisitos

- ✅ Servidor Node.js ejecutándose (`npm start`)
- ✅ MongoDB conectado correctamente
- ✅ Al menos 1 empleado registrado en el sistema
- ✅ Navegador web actualizado

---

## 🚀 Pruebas Paso a Paso

### Test 1: Carga de la Página
**Objetivo:** Verificar que la página se carga correctamente

1. Abre el navegador
2. Ve a `http://localhost:3001/EmployeesApprovals.html`
3. **Resultado esperado:**
   - ✅ Página carga sin errores
   - ✅ Se muestra "Cargando empleados..."
   - ✅ Aparece el spinner de carga
   - ✅ Después de 2-3 segundos, se cargan los empleados

---

### Test 2: Visualización de Empleados
**Objetivo:** Verificar que los empleados se muestran correctamente

1. Espera a que carguen los empleados
2. **Resultado esperado:**
   - ✅ Se muestran tarjetas de empleados
   - ✅ Cada tarjeta muestra: Nombre, Email, Teléfono, Dirección, Fecha de Inicio
   - ✅ Se muestran los badges de estado (Aprobado/Pendiente)
   - ✅ Se muestran los documentos disponibles

---

### Test 3: Búsqueda de Empleados
**Objetivo:** Verificar que la búsqueda funciona

1. Escribe un nombre en la barra de búsqueda (ej: "Juan")
2. **Resultado esperado:**
   - ✅ Las tarjetas se filtran en tiempo real
   - ✅ Solo muestra empleados que coincidan
   - ✅ Si no hay coincidencias, muestra "No hay empleados"

3. Borra el texto
4. **Resultado esperado:**
   - ✅ Vuelven a aparecer todos los empleados

---

### Test 4: Filtrado por Estado
**Objetivo:** Verificar que los filtros funcionan

1. Haz clic en "Pendientes"
2. **Resultado esperado:**
   - ✅ Se muestran solo empleados con documentos pendientes
   - ✅ El botón "Pendientes" está activo

3. Haz clic en "Aprobados"
4. **Resultado esperado:**
   - ✅ Se muestran solo empleados completamente aprobados
   - ✅ El botón "Aprobados" está activo

5. Haz clic en "Todos"
6. **Resultado esperado:**
   - ✅ Se muestran todos los empleados
   - ✅ El botón "Todos" está activo

---

### Test 5: Visualización de Documentos
**Objetivo:** Verificar que los documentos se pueden ver

1. En una tarjeta de empleado, haz clic en "Ver" bajo un documento
2. **Resultado esperado:**
   - ✅ Se abre un modal
   - ✅ Se muestra la imagen del documento
   - ✅ Se ve el título del documento

3. Cierra el modal haciendo clic en la X
4. **Resultado esperado:**
   - ✅ El modal se cierra
   - ✅ Vuelves a ver las tarjetas de empleados

5. Abre el modal nuevamente y cierra haciendo clic fuera
6. **Resultado esperado:**
   - ✅ El modal también se cierra

---

### Test 6: Aprobación Individual
**Objetivo:** Verificar que se pueden aprobar documentos individuales

**Precondición:** Tener un empleado con documentos pendientes de aprobar

1. Encuentra un empleado con un documento NO aprobado (estado ⏳)
2. Haz clic en "Aprobar ID"
3. Confirma en el diálogo que aparece
4. **Resultado esperado:**
   - ✅ Aparece notificación "Documento id aprobado correctamente"
   - ✅ El documento ahora muestra estado ✓ Aprobado
   - ✅ El botón "Aprobar ID" está deshabilitado
   - ✅ En MongoDB se actualiza `idApproved: true`

5. Repite para "Aprobar SSN"
6. **Resultado esperado:**
   - ✅ Mismo comportamiento que el anterior
   - ✅ Se actualiza `ssnApproved: true`

7. Repite para "Aprobar Cert"
8. **Resultado esperado:**
   - ✅ Mismo comportamiento
   - ✅ Se actualiza `certApproved: true`

---

### Test 7: Aprobación Masiva
**Objetivo:** Verificar que se pueden aprobar todos los documentos a la vez

**Precondición:** Tener un empleado con documentos pendientes

1. Encuentra un empleado con documentos no aprobados
2. Haz clic en "Aprobar Todo"
3. Confirma en el diálogo
4. **Resultado esperado:**
   - ✅ Aparece notificación "¡Todos los documentos han sido aprobados!"
   - ✅ Todos los documentos muestran estado ✓ Aprobado
   - ✅ Todos los botones de aprobación están deshabilitados
   - ✅ En MongoDB se actualizan todos los campos: `idApproved: true`, `ssnApproved: true`, `certApproved: true`

---

### Test 8: Persistencia de Datos
**Objetivo:** Verificar que los cambios se guardan en MongoDB

1. Aprueba un documento (Test 6 o 7)
2. Recarga la página (F5 o Ctrl+R)
3. **Resultado esperado:**
   - ✅ El empleado aparece con el documento aprobado
   - ✅ Los cambios persisten después de recargar

---

### Test 9: Panel de Control Admin
**Objetivo:** Verificar que el dashboard funciona

1. Ve a `http://localhost:3001/AdminDashboard.html`
2. **Resultado esperado:**
   - ✅ Se cargan las estadísticas
   - ✅ Muestra número de "Empleados Totales"
   - ✅ Muestra número de "Pendientes de Aprobación"
   - ✅ Muestra número de "Completamente Aprobados"

3. Haz clic en "Ir a Aprobaciones"
4. **Resultado esperado:**
   - ✅ Te lleva a EmployeesApprovals.html
   - ✅ Se cargan los empleados

5. Vuelve atrás y espera 30 segundos
6. **Resultado esperado:**
   - ✅ Las estadísticas se actualizan automáticamente

---

### Test 10: Validaciones y Errores
**Objetivo:** Verificar que el sistema maneja errores

1. Abre la consola (F12)
2. Ve a EmployeesApprovals.html
3. En la consola, ejecuta:
   ```javascript
   approveDocument('invalid-id', 'id')
   ```
4. **Resultado esperado:**
   - ✅ Aparece error "Error al aprobar el documento"
   - ✅ En la consola se ve un error de red

---

### Test 11: Responsividad
**Objetivo:** Verificar que funciona en móviles

1. Abre la página en EmployeesApprovals.html
2. Presiona F12 (DevTools)
3. Presiona Ctrl+Shift+M (Modo responsive)
4. Cambia a diferentes tamaños:
   - 📱 iPhone SE (375px)
   - 📱 iPhone 12 (390px)
   - 📱 iPad (768px)
   - 💻 Desktop (1920px)
5. **Resultado esperado:**
   - ✅ El layout se adapta correctamente
   - ✅ Los botones son clickeables en móviles
   - ✅ El texto es legible
   - ✅ Las tarjetas se reorganizan en filas

---

### Test 12: Búsqueda + Filtrado Combinado
**Objetivo:** Verificar que búsqueda y filtrado funcionan juntos

1. Escribe un nombre en la búsqueda
2. Haz clic en "Pendientes"
3. **Resultado esperado:**
   - ✅ Se muestran solo empleados que coinciden con el nombre AND tienen documentos pendientes
   - ✅ Si no hay coincidencias, muestra "No hay empleados"

---

## 🐛 Solución de Problemas Comunes

### Problema: No se cargan los empleados
**Solución:**
- [ ] Verificar que MongoDB está conectado
- [ ] Verificar que hay empleados en la BD (usar MongoDB Compass)
- [ ] Abrir consola (F12) y ver mensajes de error
- [ ] Verificar que el servidor está corriendo

### Problema: Los documentos no se cargan
**Solución:**
- [ ] Verificar que Cloudinary está configurado
- [ ] Verificar que los empleados tienen documentos guardados
- [ ] Ver en MongoDB que los campos de documentos no estén vacíos
- [ ] Comprobar permisos CORS

### Problema: Los botones no funcionan
**Solución:**
- [ ] Abrir consola (F12) y ver si hay errores
- [ ] Verificar que el servidor responde (ver red en DevTools)
- [ ] Comprobar que MongoDB está actualizar
- [ ] Recargar la página

### Problema: Las estadísticas no coinciden
**Solución:**
- [ ] Esperar 30 segundos a que se actualicen
- [ ] Recargar la página
- [ ] Verificar que los datos en MongoDB son correctos

---

## ✅ Checklist de Aceptación

Marca cada prueba como completada:

- [ ] Test 1: Carga de la página
- [ ] Test 2: Visualización de empleados
- [ ] Test 3: Búsqueda
- [ ] Test 4: Filtrado
- [ ] Test 5: Visualización de documentos
- [ ] Test 6: Aprobación individual
- [ ] Test 7: Aprobación masiva
- [ ] Test 8: Persistencia de datos
- [ ] Test 9: Dashboard admin
- [ ] Test 10: Validaciones
- [ ] Test 11: Responsividad
- [ ] Test 12: Combinaciones

**Estado General:** ⬜ No completado | ✅ Completado

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| Carga inicial | < 2 segundos | - |
| Búsqueda | < 100ms | - |
| Aprobación | < 1 segundo | - |
| Persistencia | 100% en BD | - |
| Responsividad | Todos los tamaños | - |

---

## 🎯 Próximos Pasos

1. ✅ Completar todas las pruebas
2. ✅ Documentar cualquier problema encontrado
3. ✅ Reportar errores al equipo de desarrollo
4. ✅ Implementar mejoras sugeridas
5. ✅ Hacer pruebas de carga
6. ✅ Configurar alertas de errores

---

## 📞 Reporte de Bugs

Si encuentras un problema:

1. Anota el error exacto
2. Toma una captura de pantalla
3. Abre la consola (F12) y copia los errores
4. Reporta con el siguiente formato:

```
### Título del Bug
- **Pasos para reproducir:** 1. ... 2. ...
- **Resultado esperado:** ...
- **Resultado actual:** ...
- **Captura de pantalla:** [adjuntar]
- **Consola:** [copiar error]
```

---

**Pruebas Creadas:** 27 de Enero de 2026  
**Última Actualización:** 27 de Enero de 2026  
**Estado:** ✅ Listo para Testing
