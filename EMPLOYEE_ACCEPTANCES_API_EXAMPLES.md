# API de Aceptaciones - Ejemplos de Uso

## 📚 Referencia Completa de Endpoints

### 1. Obtener Todas las Aceptaciones
```
GET /api/admin/employee-acceptances
```

#### Parámetros de Query (todos opcionales):
- `employeeId` - ID del empleado
- `status` - 'accepted', 'completed', 'cancelled', 'no-show'
- `dateFrom` - YYYY-MM-DD
- `dateTo` - YYYY-MM-DD

#### Ejemplo con cURL:
```bash
curl -X GET "http://localhost:3001/api/admin/employee-acceptances?status=completed&dateFrom=2024-01-01&dateTo=2024-12-31" \
  -H "Cookie: connect.sid=tu_session_id"
```

#### Ejemplo con JavaScript:
```javascript
async function getAllAcceptances(filters = {}) {
  const params = new URLSearchParams();
  if (filters.employeeId) params.append('employeeId', filters.employeeId);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);

  const response = await fetch(`/api/admin/employee-acceptances?${params}`);
  const data = await response.json();
  
  console.log(`Total: ${data.total}`);
  console.log(data.acceptances);
  
  return data;
}

// Uso:
getAllAcceptances({
  status: 'accepted',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31'
});
```

#### Ejemplo con Python:
```python
import requests
from datetime import datetime, timedelta

def get_all_acceptances(status=None, date_from=None, date_to=None):
    params = {}
    if status:
        params['status'] = status
    if date_from:
        params['dateFrom'] = date_from
    if date_to:
        params['dateTo'] = date_to
    
    response = requests.get(
        'http://localhost:3001/api/admin/employee-acceptances',
        params=params,
        cookies={'connect.sid': 'tu_session_id'}
    )
    
    data = response.json()
    return data

# Uso:
data = get_all_acceptances(
    status='completed',
    date_from='2024-01-01',
    date_to='2024-12-31'
)
print(f"Total: {data['total']}")
for acceptance in data['acceptances']:
    print(f"Empleado: {acceptance['employeeInfo']['firstName']}")
    print(f"Precio: ${acceptance['scheduleInfo']['price']}")
```

#### Respuesta Ejemplo:
```json
{
  "total": 45,
  "acceptances": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "employeeId": "507f1f77bcf86cd799439012",
      "scheduleId": "507f1f77bcf86cd799439013",
      "employeeInfo": {
        "firstName": "Juan",
        "lastName": "García",
        "email": "juan@example.com",
        "phone": "555-1234",
        "address": "Calle Principal 123",
        "state": "CA"
      },
      "scheduleInfo": {
        "date": "2024-12-15",
        "time": "09:00",
        "customerName": "Carlos López",
        "customerType": "Personal",
        "vehicleType": "Toyota Camry",
        "price": 85.50,
        "location": "Downtown LA",
        "pickupAddress": "123 Main St, LA",
        "dropoffAddress": "456 Oak Ave, LA",
        "stopOrder": null
      },
      "acceptedAt": "2024-12-14T14:30:00.000Z",
      "acceptanceType": "single",
      "status": "completed",
      "completedAt": "2024-12-15T10:15:00.000Z",
      "notes": "Completada exitosamente",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-12-14T14:30:00.000Z",
      "updatedAt": "2024-12-15T10:15:00.000Z"
    }
  ]
}
```

---

### 2. Obtener Aceptaciones de un Empleado
```
GET /api/admin/employee-acceptances/:employeeId
```

#### Parámetros:
- `employeeId` (requerido en URL) - ID del empleado
- `status` (opcional) - Filtrar por estado

#### Ejemplo:
```bash
# Obtener todas las aceptaciones de un empleado
curl -X GET "http://localhost:3001/api/admin/employee-acceptances/507f1f77bcf86cd799439012" \
  -H "Cookie: connect.sid=tu_session_id"

# Obtener solo las completadas
curl -X GET "http://localhost:3001/api/admin/employee-acceptances/507f1f77bcf86cd799439012?status=completed" \
  -H "Cookie: connect.sid=tu_session_id"
```

#### JavaScript:
```javascript
async function getEmployeeAcceptances(employeeId, status = null) {
  let url = `/api/admin/employee-acceptances/${employeeId}`;
  if (status) url += `?status=${status}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log(`Empleado: ${data.employee.firstName} ${data.employee.lastName}`);
  console.log(`Total aceptaciones: ${data.total}`);
  
  return data;
}
```

#### Respuesta:
```json
{
  "employee": {
    "id": "507f1f77bcf86cd799439012",
    "firstName": "Juan",
    "lastName": "García",
    "email": "juan@example.com",
    "phone": "555-1234"
  },
  "total": 12,
  "acceptances": [...]
}
```

---

### 3. Resumen Agregado
```
GET /api/admin/acceptances-summary
```

#### Parámetros:
- `dateFrom` (opcional) - YYYY-MM-DD
- `dateTo` (opcional) - YYYY-MM-DD

#### Ejemplo:
```bash
curl -X GET "http://localhost:3001/api/admin/acceptances-summary?dateFrom=2024-01-01&dateTo=2024-12-31" \
  -H "Cookie: connect.sid=tu_session_id"
```

#### JavaScript:
```javascript
async function getSummary(dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  
  const response = await fetch(`/api/admin/acceptances-summary?${params}`);
  const data = await response.json();
  
  data.summary.forEach(emp => {
    console.log(`${emp.employeeName}: ${emp.totalAcceptances} aceptaciones, $${emp.totalEarnings}`);
  });
  
  return data;
}
```

#### Respuesta:
```json
{
  "total": 3,
  "summary": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "employeeName": "Juan",
      "employeeLastName": "García",
      "employeeEmail": "juan@example.com",
      "totalAcceptances": 45,
      "totalEarnings": 2250.00,
      "acceptedCount": 30,
      "completedCount": 12,
      "cancelledCount": 3,
      "lastAcceptanceDate": "2024-12-15T14:30:00.000Z",
      "acceptanceTypes": ["single", "route-planner"]
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "employeeName": "María",
      "employeeLastName": "López",
      "employeeEmail": "maria@example.com",
      "totalAcceptances": 32,
      "totalEarnings": 1850.00,
      "acceptedCount": 25,
      "completedCount": 6,
      "cancelledCount": 1,
      "lastAcceptanceDate": "2024-12-14T10:00:00.000Z",
      "acceptanceTypes": ["single"]
    }
  ]
}
```

---

### 4. Aceptaciones por Fecha
```
GET /api/admin/acceptances-by-date
```

#### Parámetros:
- `dateFrom` (opcional) - YYYY-MM-DD
- `dateTo` (opcional) - YYYY-MM-DD

#### Ejemplo:
```bash
curl -X GET "http://localhost:3001/api/admin/acceptances-by-date?dateFrom=2024-12-01&dateTo=2024-12-31" \
  -H "Cookie: connect.sid=tu_session_id"
```

#### JavaScript:
```javascript
async function getByDate(dateFrom, dateTo) {
  const params = new URLSearchParams({
    dateFrom: dateFrom,
    dateTo: dateTo
  });
  
  const response = await fetch(`/api/admin/acceptances-by-date?${params}`);
  const data = await response.json();
  
  // Graficar tendencias
  const dates = data.byDate.map(d => d._id);
  const counts = data.byDate.map(d => d.count);
  const earnings = data.byDate.map(d => d.totalEarnings);
  
  console.log('Fechas:', dates);
  console.log('Aceptaciones por día:', counts);
  console.log('Ganancias por día:', earnings);
  
  return data;
}
```

#### Respuesta:
```json
{
  "total": 15,
  "byDate": [
    {
      "_id": "2024-12-15",
      "count": 25,
      "totalEarnings": 1200.00,
      "acceptanceTypes": ["single", "route-planner"]
    },
    {
      "_id": "2024-12-14",
      "count": 18,
      "totalEarnings": 920.50,
      "acceptanceTypes": ["single"]
    },
    {
      "_id": "2024-12-13",
      "count": 22,
      "totalEarnings": 1050.00,
      "acceptanceTypes": ["route-planner"]
    }
  ]
}
```

---

### 5. Marcar como Completada
```
POST /api/admin/acceptances/:acceptanceId/complete
```

#### Body (JSON):
```json
{
  "notes": "Completada exitosamente"
}
```

#### Ejemplo:
```bash
curl -X POST "http://localhost:3001/api/admin/acceptances/507f1f77bcf86cd799439011/complete" \
  -H "Cookie: connect.sid=tu_session_id" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Servicio completado sin problemas"}'
```

#### JavaScript:
```javascript
async function completeAcceptance(acceptanceId, notes = '') {
  const response = await fetch(
    `/api/admin/acceptances/${acceptanceId}/complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    }
  );
  
  const data = await response.json();
  if (response.ok) {
    console.log('✅ Aceptación completada');
    console.log('Estado actualizado a:', data.acceptance.status);
  }
  
  return data;
}

// Uso:
completeAcceptance('507f1f77bcf86cd799439011', 'Cliente satisfecho');
```

#### Respuesta:
```json
{
  "success": true,
  "acceptance": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "completed",
    "completedAt": "2024-12-15T15:30:00.000Z",
    "notes": "Servicio completado sin problemas"
  }
}
```

---

### 6. Cancelar Aceptación
```
POST /api/admin/acceptances/:acceptanceId/cancel
```

#### Body (JSON):
```json
{
  "notes": "Razón de cancelación"
}
```

#### Ejemplo:
```bash
curl -X POST "http://localhost:3001/api/admin/acceptances/507f1f77bcf86cd799439011/cancel" \
  -H "Cookie: connect.sid=tu_session_id" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Empleado no se presentó"}'
```

#### JavaScript:
```javascript
async function cancelAcceptance(acceptanceId, reason = '') {
  if (!confirm('¿Seguro que quieres cancelar?')) return;
  
  const response = await fetch(
    `/api/admin/acceptances/${acceptanceId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes: reason })
    }
  );
  
  const data = await response.json();
  if (response.ok) {
    console.log('✅ Aceptación cancelada');
  }
  
  return data;
}
```

#### Respuesta:
```json
{
  "success": true,
  "acceptance": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "cancelled",
    "notes": "Empleado no se presentó"
  }
}
```

---

## 📊 Casos de Uso Completos

### Caso 1: Generar Reporte Mensual

```javascript
async function generateMonthlyReport(year, month) {
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const dateLastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${dateLastDay}`;
  
  // Obtener resumen
  const response = await fetch(
    `/api/admin/acceptances-summary?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
  const data = await response.json();
  
  // Generar reporte
  let report = `REPORTE DE ACEPTACIONES - ${year}/${month}\n`;
  report += `${'='.repeat(50)}\n\n`;
  
  let totalGanancias = 0;
  data.summary.forEach(emp => {
    report += `Empleado: ${emp.employeeName} ${emp.employeeLastName}\n`;
    report += `  Email: ${emp.employeeEmail}\n`;
    report += `  Total Aceptaciones: ${emp.totalAcceptances}\n`;
    report += `  Completadas: ${emp.completedCount}\n`;
    report += `  En Proceso: ${emp.acceptedCount}\n`;
    report += `  Canceladas: ${emp.cancelledCount}\n`;
    report += `  Ganancias: $${emp.totalEarnings}\n\n`;
    totalGanancias += emp.totalEarnings;
  });
  
  report += `${'='.repeat(50)}\n`;
  report += `TOTALES:\n`;
  report += `  Empleados: ${data.total}\n`;
  report += `  Ganancias Totales: $${totalGanancias}\n`;
  
  return report;
}

// Uso:
const reporte = await generateMonthlyReport(2024, 12);
console.log(reporte);
```

### Caso 2: Verificar Empleados Inactivos

```javascript
async function findInactiveEmployees(daysInactive = 7) {
  const dateBefore = new Date();
  dateBefore.setDate(dateBefore.getDate() - daysInactive);
  const dateFrom = dateBefore.toISOString().split('T')[0];
  
  const response = await fetch('/api/admin/acceptances-summary');
  const data = await response.json();
  
  const inactive = data.summary.filter(emp => {
    const lastDate = new Date(emp.lastAcceptanceDate);
    return lastDate < dateBefore;
  });
  
  console.log(`Empleados inactivos desde hace ${daysInactive} días:`);
  inactive.forEach(emp => {
    console.log(`- ${emp.employeeName} ${emp.employeeLastName}`);
    console.log(`  Última aceptación: ${emp.lastAcceptanceDate}`);
  });
  
  return inactive;
}
```

### Caso 3: Calcular KPIs

```javascript
async function calculateKPIs(dateFrom, dateTo) {
  const response = await fetch(
    `/api/admin/acceptances-summary?dateFrom=${dateFrom}&dateTo=${dateTo}`
  );
  const data = await response.json();
  
  // Calcular métricas
  const kpis = {
    totalAcceptances: 0,
    totalEarnings: 0,
    totalCompleted: 0,
    completionRate: 0,
    averageEarningsPerEmployee: 0,
    topEmployee: null,
    topEarner: null
  };
  
  let maxAcceptances = 0;
  let maxEarnings = 0;
  
  data.summary.forEach(emp => {
    kpis.totalAcceptances += emp.totalAcceptances;
    kpis.totalEarnings += emp.totalEarnings;
    kpis.totalCompleted += emp.completedCount;
    
    if (emp.totalAcceptances > maxAcceptances) {
      maxAcceptances = emp.totalAcceptances;
      kpis.topEmployee = `${emp.employeeName} ${emp.employeeLastName}`;
    }
    
    if (emp.totalEarnings > maxEarnings) {
      maxEarnings = emp.totalEarnings;
      kpis.topEarner = `${emp.employeeName} ${emp.employeeLastName}`;
    }
  });
  
  kpis.completionRate = (kpis.totalCompleted / kpis.totalAcceptances * 100).toFixed(2);
  kpis.averageEarningsPerEmployee = (kpis.totalEarnings / data.total).toFixed(2);
  
  return kpis;
}

// Uso:
const kpis = await calculateKPIs('2024-01-01', '2024-12-31');
console.log(`Total Aceptaciones: ${kpis.totalAcceptances}`);
console.log(`Ganancias Totales: $${kpis.totalEarnings}`);
console.log(`Tasa de Completación: ${kpis.completionRate}%`);
console.log(`Empleado Top: ${kpis.topEmployee}`);
console.log(`Mayor Ganancia: ${kpis.topEarner}`);
```

---

## ⚠️ Códigos de Error

| Código | Mensaje | Causa |
|--------|---------|-------|
| 200 | OK | Solicitud exitosa |
| 400 | Bad Request | Parámetros inválidos |
| 401 | Unauthorized | No hay sesión activa |
| 403 | Forbidden | Permisos insuficientes |
| 404 | Not Found | Registro no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

**Última actualización:** Enero 2026
