# 🚀 Guía de Integración Rápida - Aceptaciones de Empleados

## Instalación y Configuración

### Paso 1: Verificar Archivos Creados
Los siguientes archivos deben estar en tu proyecto:

```
Registro/
├── models/
│   └── EmployeeAcceptance.js ✅ (NUEVO)
├── public/
│   └── acceptancesReport.html ✅ (NUEVO)
├── server.js ✅ (ACTUALIZADO)
└── EMPLOYEE_ACCEPTANCES_DOCUMENTATION.md ✅ (NUEVO)
```

### Paso 2: Verificar la Actualización en server.js

Busca estas líneas en `server.js`:

**Línea ~185:** Debe incluir:
```javascript
const EmployeeAcceptance = require('./models/EmployeeAcceptance');
```

**Línea ~355:** Debe tener acceso a:
```javascript
// === REPORTE DE ACEPTACIONES ===
app.get('/acceptances-report', (req, res) => {
  if (!req.session?.empId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'acceptancesReport.html'));
});
```

**Línea ~730:** Endpoint `/accept-offer` debe guardar registros:
```javascript
// ✅ GUARDAR REGISTRO DE ACEPTACIÓN DEL EMPLEADO
const employee = await Employee.findById(req.session.empId).lean();

if (employee) {
  const employeeAcceptance = new EmployeeAcceptance({
    // ... datos ...
  });
  await employeeAcceptance.save();
}
```

### Paso 3: Reiniciar el Servidor
```bash
node server.js
```

Deberías ver:
```
✅ MongoDB conectado
🚀 Servidor Luber corriendo en http://localhost:3001
```

### Paso 4: Verificar Funcionamiento

1. **Como Empleado:**
   - Login en http://localhost:3001/login
   - Ve a Perfil
   - Acepta una oferta
   - Revisa el servidor (debe mostrar: `✅ Aceptación registrada`)

2. **Como Admin:**
   - Ve a http://localhost:3001/acceptances-report
   - Deberías ver el dashboard
   - Click en "Cargar Resumen"
   - Debería mostrar datos

## Tests Rápidos

### Test 1: Aceptar una oferta
```bash
curl -X POST http://localhost:3001/accept-offer \
  -H "Content-Type: application/json" \
  -d '{"scheduleId":"SCHEDULE_ID"}' \
  --cookie "connect.sid=SESSION_ID"
```

**Esperado:** `{ "success": true }`

### Test 2: Ver aceptaciones
```bash
curl http://localhost:3001/api/admin/employee-acceptances \
  --cookie "connect.sid=SESSION_ID"
```

**Esperado:** JSON con array de aceptaciones

### Test 3: Ver resumen
```bash
curl http://localhost:3001/api/admin/acceptances-summary \
  --cookie "connect.sid=SESSION_ID"
```

**Esperado:** Estadísticas agregadas por empleado

## Uso en Producción

### URLs Principales

**Dashboard de Reportes:**
```
http://tudominio.com/acceptances-report
```

**APIs REST (para integraciones):**
```
GET    /api/admin/employee-acceptances
GET    /api/admin/employee-acceptances/:employeeId
GET    /api/admin/acceptances-summary
GET    /api/admin/acceptances-by-date
POST   /api/admin/acceptances/:acceptanceId/complete
POST   /api/admin/acceptances/:acceptanceId/cancel
```

### Permisos Recomendados

Actualmente solo se valida sesión. Para seguridad adicional, considera:

```javascript
// En los endpoints /api/admin/*
if (!req.session?.empId || !isAdmin(req.session.empId)) {
  return res.status(403).json({ error: 'No autorizado' });
}
```

Puedes agregar un campo `isAdmin: Boolean` al modelo Employee.

## Monitoreo

### Logs Importantes
```
✅ Aceptación registrada para empleado {ID} - Schedule {ID}
❌ Error en aceptar oferta
❌ Error obteniendo aceptaciones
```

### Métricas a Monitorear
- Número de aceptaciones por hora
- Tasa de completación
- Cancellations
- Errores en registros

## Troubleshooting Común

### "EmployeeAcceptance is not a constructor"
**Solución:** Verifica que EmployeeAcceptance.js esté en `models/` y el require sea correcto.

### "Cannot find module 'EmployeeAcceptance'"
**Solución:** 
```javascript
// ❌ Incorrecto
const EmployeeAcceptance = require('EmployeeAcceptance');

// ✅ Correcto
const EmployeeAcceptance = require('./models/EmployeeAcceptance');
```

### Dashboard carga pero sin datos
**Solución:**
1. Abre DevTools (F12)
2. Pestaña Console
3. Busca errores de red
4. Verifica que hay una sesión activa
5. Verifica que hay aceptaciones en MongoDB

### Collection no existe en MongoDB
**Solución:** La colección se crea automáticamente al first insert. Simplemente:
1. Acepta una oferta como empleado
2. MongoDB creará la colección `employeeacceptances`

## Backup y Recuperación

### Exportar datos de aceptaciones
```bash
mongoexport -d luber_db -c employeeacceptances -o acceptances_backup.json
```

### Importar desde backup
```bash
mongoimport -d luber_db -c employeeacceptances acceptances_backup.json
```

## Performance

### Para millones de registros, considera:

1. **Indexación:** Ya implementada automáticamente
2. **Archivado:** Mover aceptaciones antiguas a colección de historial
3. **Paginación:** Agregar límites a las consultas
4. **Caché:** Usar Redis para reportes frecuentes

Ejemplo con paginación:
```javascript
app.get('/api/admin/employee-acceptances', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  const acceptances = await EmployeeAcceptance.find()
    .skip(skip)
    .limit(limit)
    .sort({ acceptedAt: -1 });
});
```

## Integración con Otros Sistemas

### Webhooks (Ejemplo)
```javascript
// Cuando se acepta una oferta
app.post('/accept-offer', async (req, res) => {
  // ... lógica actual ...
  
  // Enviar webhook
  await fetch('https://tuapi.com/webhook/acceptance', {
    method: 'POST',
    body: JSON.stringify({
      employeeId: req.session.empId,
      scheduleId: scheduleId,
      timestamp: new Date()
    })
  });
});
```

### API para Aplicaciones Externas
```javascript
// Obtener aceptaciones de un empleado
GET /api/public/employee-acceptances/:employeeId?apiKey=KEY

// En server.js
app.get('/api/public/employee-acceptances/:employeeId', (req, res) => {
  const apiKey = req.query.apiKey;
  if (apiKey !== process.env.PUBLIC_API_KEY) {
    return res.status(403).json({ error: 'API Key inválida' });
  }
  // Retornar datos...
});
```

---

## Soporte

**¿Preguntas?**
- Revisa [EMPLOYEE_ACCEPTANCES_DOCUMENTATION.md](./EMPLOYEE_ACCEPTANCES_DOCUMENTATION.md)
- Busca en los logs: `grep "aceptación" console.log`
- Verifica MongoDB: `db.employeeacceptances.find().count()`

**¿Problemas?**
1. Busca el error en la consola del servidor
2. Revisa que todas las dependencias estén instaladas
3. Verifica la conexión a MongoDB
4. Reinicia el servidor

---

**Última actualización:** Enero 2026
