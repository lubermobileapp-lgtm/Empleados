# ✅ Nueva Funcionalidad: Aprobación de CV/Resume

## 📋 Cambios Realizados

### 1. Backend (server.js)

#### Schema MongoDB - Nuevo Campo
```javascript
resumeApproved: { type: Boolean, default: false }
```
Se agregó el campo `resumeApproved` al esquema del empleado para guardar el estado de aprobación del CV.

#### Endpoints Actualizados

**GET /api/admin/employees-approval**
- Ahora retorna `resumeApproved` en los datos del empleado
- Campo incluido en la proyección

**POST /api/admin/approve-document**
- Maneja nuevo tipo de documento: `docType: 'resume'`
- Actualiza `resumeApproved: true` en MongoDB

```javascript
else if (docType === 'resume') updateFields.resumeApproved = true;
```

**POST /api/admin/approve-all**
- Ahora aprueba los 4 documentos (ID, SSN, Cert y Resume)

```javascript
{
  idApproved: true,
  ssnApproved: true,
  certApproved: true,
  resumeApproved: true
}
```

---

### 2. Frontend (EmployeesApprovals.html)

#### Cambios en la Tarjeta del CV
**Antes:**
```javascript
createDocumentCard('📄 CV', emp.resumeDocumentPath, true, emp._id, 'resume')
```
(Siempre se mostraba como aprobado)

**Ahora:**
```javascript
createDocumentCard('📄 CV', emp.resumeDocumentPath, emp.resumeApproved, emp._id, 'resume')
```
(Usa el estado real de aprobación)

#### Botón de Aprobación del CV
Se agregó un nuevo botón verde en la sección de acciones:

```javascript
${emp.resumeDocumentPath ? `<button class="action-btn btn-approve-all" 
    style="background: #28a745;" 
    onclick="approveDocument('${emp._id}', 'resume')" 
    ${emp.resumeApproved ? 'disabled' : ''}>
    ${emp.resumeApproved ? '✓ CV Aprobado' : 'Aprobar CV'}
</button>` : ''}
```

**Características:**
- ✅ Solo aparece si el empleado tiene CV (resumeDocumentPath)
- ✅ Color verde (#28a745) para diferenciarlo
- ✅ Se deshabilita cuando ya está aprobado
- ✅ Muestra "✓ CV Aprobado" cuando está completado

#### Lógica de Distribución de Secciones

**Nueva lógica de separación:**

```javascript
// Pendientes: Si falta alguno de los documentos requeridos
const pendingEmployees = allEmployees.filter(e => {
    const hasResume = e.resumeDocumentPath ? true : false;
    if (hasResume) {
        // Si tiene CV, debe tener todos 4 aprobados
        return !e.idApproved || !e.ssnApproved || !e.certApproved || !e.resumeApproved;
    } else {
        // Si no tiene CV, debe tener 3 aprobados
        return !e.idApproved || !e.ssnApproved || !e.certApproved;
    }
});

// Aprobados: Si tiene todos los requeridos aprobados
const approvedEmployees = allEmployees.filter(e => {
    const hasResume = e.resumeDocumentPath ? true : false;
    if (hasResume) {
        return e.idApproved && e.ssnApproved && e.certApproved && e.resumeApproved;
    } else {
        return e.idApproved && e.ssnApproved && e.certApproved;
    }
});
```

**Implicaciones:**
- Si un empleado tiene CV pero no está aprobado → Queda en "⏳ En Espera"
- Si un empleado tiene CV y está aprobado → Se mueve a "✅ Aprobados"
- Si un empleado NO tiene CV → Solo se consideran los 3 documentos principales

---

## 🎯 Flujo de Aprobación del CV

### Escenario 1: Empleado SIN CV
```
ID ✓ | SSN ✓ | Cert ✓
↓
✅ Aprobado (3/3 documentos)
```

### Escenario 2: Empleado CON CV NO APROBADO
```
ID ✓ | SSN ✓ | Cert ✓ | CV ⏳
↓
⏳ En Espera (3/4 documentos)
- Aparece botón "Aprobar CV" en verde
```

### Escenario 3: Empleado CON CV APROBADO
```
ID ✓ | SSN ✓ | Cert ✓ | CV ✓
↓
✅ Completamente Aprobado (4/4 documentos)
```

---

## 📊 Estado de Documentos

| Tipo | Color | Campo | Requerido |
|------|-------|-------|-----------|
| 🪪 ID | Rojo | `idApproved` | Sí (siempre) |
| 🔢 SSN | Azul | `ssnApproved` | Sí (siempre) |
| 📜 Cert | Púrpura | `certApproved` | Sí (siempre) |
| 📄 CV | Verde | `resumeApproved` | Condicional |

---

## 🔄 Ciclo de Vida del CV

### Estado 1: CV Presente, No Aprobado
- **Muestra:** Tarjeta con botón [Ver]
- **Status Badge:** CV ⏳
- **Acción:** Botón "Aprobar CV" habilitado
- **Ubicación:** ⏳ En Espera de Aprobación

### Estado 2: CV Presente, Aprobado
- **Muestra:** Tarjeta con botón [✓ Aprobado]
- **Status Badge:** CV ✓
- **Acción:** Botón "Aprobar CV" deshabilitado
- **Ubicación:** ✅ Aprobados (si otros también aprobados)

### Estado 3: Sin CV
- **Muestra:** Sin tarjeta de CV
- **Status Badge:** No aparece
- **Acción:** Sin opción de aprobar
- **Ubicación:** Basado en los 3 documentos principales

---

## 🧪 Cómo Probar

### 1. Crear un empleado con CV
```
1. Registrar nuevo empleado
2. Subir: ID, SSN, Cert y CV (Resume)
3. Admin accede a EmployeesApprovals.html
```

### 2. Verificar el estado inicial
```
✓ Aparece en "⏳ En Espera de Aprobación"
✓ Tarjeta CV muestra botón [Ver]
✓ Botón "Aprobar CV" está habilitado (color verde)
✓ Otros botones (ID, SSN, Cert) pueden estar completados
```

### 3. Aprobar el CV
```
1. Haz clic en botón "Aprobar CV" (verde)
2. Confirma el diálogo
```

### 4. Verificar cambios
```
✓ CV ⏳ cambia a CV ✓
✓ Botón "Aprobar CV" ahora muestra "✓ CV Aprobado"
✓ Botón se deshabilita
✓ Si otros están aprobados → Se mueve a "✅ Aprobados"
✓ Si otros no están aprobados → Sigue en "⏳ En Espera"
```

### 5. Prueba con "Aprobar Todo"
```
1. Si alguno falta, haz clic "Aprobar Todo"
2. Debe aprobar los 4 (o 3 si no tiene CV)
```

---

## 📱 Interface Visual

### Tarjeta de CV
```
┌─────────────┐
│ 📄          │
│ CV          │
│ [Ver/✓ Apro]│
└─────────────┘
```

### Botón de Aprobación (Verde)
```
┌─────────────────┐
│ Aprobar CV      │  (Habilitado, color verde)
└─────────────────┘

┌─────────────────┐
│ ✓ CV Aprobado   │  (Deshabilitado, color verde gris)
└─────────────────┘
```

### Estado en Tabla
```
ID✓ SSN✓ Cert✓ CV⏳  → En Espera
ID✓ SSN✓ Cert✓ CV✓  → Aprobado
ID✓ SSN⏳ Cert⏳ CV✗  → En Espera
```

---

## 💾 Datos en MongoDB

### Documento Empleado (Nuevo)
```json
{
  "_id": "ObjectId",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@email.com",
  "phone": "555-1234",
  "address": "Calle 123",
  "profileImagePath": "path/to/id.jpg",
  "ssnDocumentPath": "path/to/ssn.jpg",
  "certDocumentPath": "path/to/cert.jpg",
  "resumeDocumentPath": "path/to/resume.pdf",
  "idApproved": true,
  "ssnApproved": true,
  "certApproved": true,
  "resumeApproved": false,    ← NUEVO CAMPO
  "startDate": "2024-01-15"
}
```

---

## 🔌 Endpoints API

### GET /api/admin/employees-approval
**Retorna:**
```json
[
  {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "phone": "555-1234",
    "address": "Calle 123",
    "startDate": "2024-01-15",
    "profileImagePath": "path/to/id.jpg",
    "ssnDocumentPath": "path/to/ssn.jpg",
    "certDocumentPath": "path/to/cert.jpg",
    "resumeDocumentPath": "path/to/resume.pdf",
    "idApproved": true,
    "ssnApproved": true,
    "certApproved": true,
    "resumeApproved": false      ← INCLUIDO
  }
]
```

### POST /api/admin/approve-document
**Nuevo tipo soportado:**
```json
{
  "empId": "ObjectId",
  "docType": "resume"    ← NUEVO
}
```

**Respuesta:**
```json
{
  "success": true,
  "employee": { ... con resumeApproved: true ... }
}
```

### POST /api/admin/approve-all
**Ahora aprueba 4 campos:**
```json
{
  "empId": "ObjectId"
}

// Actualiza:
{
  "idApproved": true,
  "ssnApproved": true,
  "certApproved": true,
  "resumeApproved": true    ← INCLUIDO
}
```

---

## ✨ Características Clave

✅ **Condicional**: Solo cuenta si el empleado tiene CV
✅ **Inteligente**: Sabe si es requerido basado en documentos presentes
✅ **Visual**: Botón verde diferenciado
✅ **Automático**: Se mueve de sección cuando está completo
✅ **Persistente**: Se guarda en MongoDB
✅ **Historial**: Mantiene registro de cuándo fue aprobado

---

## 🎓 Resumen

Ahora puedes:
1. ✅ Aprobar CV individuales
2. ✅ Ver el estado de aprobación del CV
3. ✅ Incluir CV en aprobación masiva ("Aprobar Todo")
4. ✅ Distinguir empleados con/sin CV
5. ✅ Guardar datos de aprobación de CV en MongoDB

El sistema automáticamente ajusta los requisitos según si el empleado tiene CV o no.

---

**Fecha**: 27 de Enero de 2026
**Versión**: 2.2 (Resume/CV Approval)
**Estado**: ✅ COMPLETADO
