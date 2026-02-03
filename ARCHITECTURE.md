# 🗂️ ARQUITECTURA DEL SISTEMA DE APROBACIÓN

## 🏗️ Estructura General

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (NAVEGADOR)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐     │
│  │  AdminDashboard.html │      │EmployeesApprovals   │     │
│  │  - Estadísticas      │◄───►│  .html               │     │
│  │  - Navegación        │      │  - Lista empleados   │     │
│  │  - 30s Auto-refresh  │      │  - Búsqueda/Filtro   │     │
│  └──────────┬───────────┘      │  - Ver documentos    │     │
│             │                  │  - Botones de aprob. │     │
│             │                  └──────────┬───────────┘     │
│             │                             │                  │
└─────────────┼─────────────────────────────┼──────────────────┘
              │ HTTP/AJAX                   │
              ↓                             ↓
┌─────────────────────────────────────────────────────────────┐
│                  SERVIDOR (Node.js/Express)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              RUTAS API                                 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │  GET  /api/admin/employees-approval                   │ │
│  │  ├─ Obtiene todos los empleados                       │ │
│  │  └─ Campos: nombre, documentos, estado                │ │
│  │                                                         │ │
│  │  POST /api/admin/approve-document                     │ │
│  │  ├─ Parámetros: empId, docType (id|ssn|cert)        │ │
│  │  └─ Actualiza campo específico                        │ │
│  │                                                         │ │
│  │  POST /api/admin/approve-all                          │ │
│  │  ├─ Parámetros: empId                                 │ │
│  │  └─ Aprueba todos los documentos                      │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         LÓGICA DE NEGOCIO                              │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                         │ │
│  │  1. Validar parámetros                                │ │
│  │  2. Verificar empleado existe                         │ │
│  │  3. Actualizar campo en MongoDB                       │ │
│  │  4. Devolver respuesta                                │ │
│  │  5. Registrar en logs                                 │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
└─────────────────────────────────────────────────────────────┘
              │ Mongoose/MongoDB Driver
              ↓
┌─────────────────────────────────────────────────────────────┐
│                 BASE DE DATOS (MongoDB)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Colección: employees                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  _id: ObjectId                                         │ │
│  │  firstName: String                                     │ │
│  │  lastName: String                                      │ │
│  │  email: String                                         │ │
│  │  phone: String                                         │ │
│  │  address: String                                       │ │
│  │  startDate: Date                                       │ │
│  │  profileImagePath: String (Cloudinary URL)            │ │
│  │  ssnDocumentPath: String (Cloudinary URL)             │ │
│  │  certDocumentPath: String (Cloudinary URL)            │ │
│  │  resumeDocumentPath: String (Cloudinary URL)          │ │
│  │  ┌─ idApproved: Boolean       ← ACTUALIZAR            │ │
│  │  ├─ ssnApproved: Boolean      ← ACTUALIZAR            │ │
│  │  └─ certApproved: Boolean     ← ACTUALIZAR            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
              ↑
              │ URLs de imágenes
              ↓
┌─────────────────────────────────────────────────────────────┐
│           ALMACENAMIENTO (Cloudinary CDN)                    │
├─────────────────────────────────────────────────────────────┤
│  - Imágenes de documentos                                    │
│  - Fotos de perfil                                           │
│  - URLs de acceso público                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Flujo de Datos: Aprobación de Documento

```
┌──────────────────────┐
│ Usuario hace click   │
│ en "Aprobar ID"      │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ JavaScript captura evento onclick        │
│ approveDocument(empId, 'id')             │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ Mostrar confirmación                     │
│ "¿Confirmar aprobación de id?"           │
└──────────┬───────────────────────────────┘
           │
       SÍ  │  NO → Cancelar
           │
           ↓
┌──────────────────────────────────────────┐
│ POST /api/admin/approve-document         │
│ {                                        │
│   empId: "64a8f3c2d9e4f1a2b3c4d5e6",    │
│   docType: "id"                          │
│ }                                        │
└──────────┬───────────────────────────────┘
           │ (AJAX)
           ↓
┌──────────────────────────────────────────┐
│ Servidor recibe solicitud                │
│ app.post('/api/admin/approve-document')  │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ Validar parámetros                       │
│ ├─ empId? ✓                              │
│ └─ docType válido? ✓                     │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ Construir updateFields                   │
│ {                                        │
│   idApproved: true                       │
│ }                                        │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ Ejecutar query MongoDB                   │
│ Employee.findByIdAndUpdate(              │
│   empId,                                 │
│   updateFields,                          │
│   { new: true }                          │
│ )                                        │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ MongoDB actualiza documento              │
│ idApproved: false → true                 │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ Devolver respuesta                       │
│ {                                        │
│   success: true,                         │
│   employee: {...}                        │
│ }                                        │
└──────────┬───────────────────────────────┘
           │ (AJAX)
           ↓
┌──────────────────────────────────────────┐
│ JavaScript recibe respuesta              │
│ ├─ Mostrar notificación ✓                │
│ ├─ Registrar en logs                     │
│ └─ Ejecutar loadEmployees()              │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ GET /api/admin/employees-approval        │
│ Recargar lista de empleados              │
└──────────┬───────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ Servidor devuelve lista actualizada      │
│ Con: idApproved: true                    │
└──────────┬───────────────────────────────┘
           │ (AJAX)
           ↓
┌──────────────────────────────────────────┐
│ JavaScript renderiza UI                  │
│ ├─ La tarjeta muestra ✓ Aprobado        │
│ ├─ Botón "Aprobar ID" está deshabilitado│
│ └─ Se muestra notificación exitosa       │
└──────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Vida de la Página

```
1. Usuario abre EmployeesApprovals.html
   ↓
2. DOMContentLoaded dispara loadEmployees()
   ↓
3. JavaScript hace GET /api/admin/employees-approval
   ↓
4. Mostrar spinner de carga
   ↓
5. MongoDB devuelve todos los empleados
   ↓
6. JavaScript renderiza tarjetas con renderEmployees()
   ↓
7. Usuario interactúa:
   ├─ Busca → filterEmployees()
   ├─ Filtra → filterBy()
   ├─ Ve documento → viewDocument()
   ├─ Aprueba → approveDocument() o approveAll()
   └─ Confirma → loadEmployees() nuevamente
   ↓
8. Ciclo se repite
```

---

## 📡 Endpoints API Detallados

### GET /api/admin/employees-approval

```
REQUEST:
  Method: GET
  URL: http://localhost:3001/api/admin/employees-approval
  Headers: 
    - Accept: application/json

PROCESSING:
  1. Query: Employee.find({}, campos)
  2. Opciones: .lean() para optimizar
  3. Campos: firstName, lastName, email, documentos, estados

RESPONSE (200):
  [
    {
      "_id": "64a8f3c2d9e4f1a2b3c4d5e6",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan@example.com",
      "phone": "555-1234",
      "address": "123 Calle Principal",
      "startDate": "2024-01-15T00:00:00.000Z",
      "profileImagePath": "https://res.cloudinary.com/...",
      "ssnDocumentPath": "https://res.cloudinary.com/...",
      "certDocumentPath": "https://res.cloudinary.com/...",
      "resumeDocumentPath": "https://res.cloudinary.com/...",
      "idApproved": false,
      "ssnApproved": false,
      "certApproved": false
    },
    ...
  ]

ERROR (500):
  {
    "error": "Error al obtener empleados"
  }
```

### POST /api/admin/approve-document

```
REQUEST:
  Method: POST
  URL: http://localhost:3001/api/admin/approve-document
  Headers:
    - Content-Type: application/json
  Body:
    {
      "empId": "64a8f3c2d9e4f1a2b3c4d5e6",
      "docType": "id" | "ssn" | "cert"
    }

PROCESSING:
  1. Validar: empId y docType existen
  2. Mapear docType:
     - "id" → { idApproved: true }
     - "ssn" → { ssnApproved: true }
     - "cert" → { certApproved: true }
  3. Query: Employee.findByIdAndUpdate(empId, fields)
  4. Registrar en logs

RESPONSE (200):
  {
    "success": true,
    "employee": { ...datos actualizados... }
  }

ERROR (400):
  {
    "error": "Parámetros faltantes"
  }

ERROR (404):
  {
    "error": "Empleado no encontrado"
  }

ERROR (500):
  {
    "error": "Error al aprobar el documento"
  }
```

### POST /api/admin/approve-all

```
REQUEST:
  Method: POST
  URL: http://localhost:3001/api/admin/approve-all
  Headers:
    - Content-Type: application/json
  Body:
    {
      "empId": "64a8f3c2d9e4f1a2b3c4d5e6"
    }

PROCESSING:
  1. Validar: empId existe
  2. Query: Employee.findByIdAndUpdate(empId, {
       idApproved: true,
       ssnApproved: true,
       certApproved: true
     })
  3. Registrar en logs

RESPONSE (200):
  {
    "success": true,
    "employee": { ...datos con todos aprobados... }
  }

ERROR (400):
  {
    "error": "ID de empleado faltante"
  }

ERROR (404):
  {
    "error": "Empleado no encontrado"
  }

ERROR (500):
  {
    "error": "Error al aprobar los documentos"
  }
```

---

## 🧩 Componentes Frontend

### 1. HTML Structure
```html
<div class="container">
  <div class="header"></div>
  <div class="controls"></div>
  <div class="content">
    <div id="loadingContainer"></div>
    <div id="employeesContainer" class="employee-grid"></div>
    <div id="noDataContainer"></div>
  </div>
</div>
<div id="documentModal"></div>
```

### 2. JavaScript Modules
```javascript
// Variables globales
allEmployees = []
currentFilter = 'all'

// Funciones principales
loadEmployees()          // Cargar datos
renderEmployees()        // Mostrar empleados
filterEmployees()        // Búsqueda
filterBy()               // Filtrado
createEmployeeCard()     // Generar HTML
viewDocument()           // Abrir modal
approveDocument()        // Aprobar individual
approveAll()             // Aprobar todos
showSuccess()            // Notificación
showError()              // Error

// Event Listeners
DOMContentLoaded → loadEmployees()
searchInput.input → filterEmployees()
filterButtons.click → filterBy()
documentModal.click → closeDocumentModal()
```

### 3. Estilos CSS
```
- Gradientes: #667eea → #764ba2
- Cards: hover effect, sombras
- Responsive: Grid con auto-fit
- Animaciones: spin, slideIn
- Modales: overlay oscuro, centrado
```

---

## 🔐 Seguridad

### Actual (Desarrollo)
```
✗ Sin autenticación
✗ Sin autorización
✗ Sin validación de permisos
✗ Sin rate limiting
✗ Sin CSRF protection
```

### Recomendado (Producción)
```javascript
// Middleware de autenticación
const authenticateAdmin = (req, res, next) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};

// Aplicar a rutas
app.get('/api/admin/employees-approval', authenticateAdmin, ...);
app.post('/api/admin/approve-document', authenticateAdmin, ...);
app.post('/api/admin/approve-all', authenticateAdmin, ...);

// Validaciones adicionales
- Verificar CSRF token
- Registrar auditoría
- Rate limiting
- HTTPS solo
- CORS restrictivo
```

---

## 📈 Escalabilidad

### Optimizaciones Futuras
```
1. Caché de empleados (Redis)
2. Paginación de resultados
3. Índices en MongoDB
4. Compresión de imágenes
5. Lazy loading de documentos
6. Workers de fondo para procesos
7. GraphQL en lugar de REST
```

---

**Arquitectura Versión:** 1.0  
**Documentado:** 27 de Enero de 2026
