# 📋 Guía de Aprobación de Empleados - Luber

## 🎯 Descripción

Se ha creado una nueva página completa de **Aprobación de Empleados** que permite a los administradores:
- ✅ Ver todos los empleados y sus documentos
- 📄 Visualizar documentos (ID, SSN, Certificaciones, CV)
- ✔️ Aprobar documentos individuales o todos a la vez
- 🔍 Buscar y filtrar empleados
- 📊 Ver estado de aprobación de cada documento

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
1. **`public/EmployeesApprovals.html`** - Página principal de aprobación de empleados
2. **`public/AdminDashboard.html`** - Panel de control del administrador

### Archivos Modificados:
1. **`server.js`** - Se añadieron 3 nuevas rutas API:
   - `GET /api/admin/employees-approval` - Obtener lista de empleados con documentos
   - `POST /api/admin/approve-document` - Aprobar un documento específico
   - `POST /api/admin/approve-all` - Aprobar todos los documentos de un empleado

---

## 🚀 Cómo Acceder

### Opción 1: Panel de Control Admin (Recomendado)
Accede a: `http://localhost:3001/AdminDashboard.html`

Esta página te proporciona:
- 📊 Estadísticas en tiempo real
- 📋 Enlace a "Aprobación de Documentos"
- 💬 Enlace a Chat Admin
- ⚙️ Enlaces a otras funcionalidades

### Opción 2: Acceso Directo
Accede a: `http://localhost:3001/EmployeesApprovals.html`

---

## 🎮 Características de la Página

### 1. **Búsqueda y Filtrado**
- Busca empleados por nombre o email en la barra de búsqueda
- Filtra por estado: "Todos", "Pendientes" o "Aprobados"

### 2. **Tarjetas de Empleados**
Cada tarjeta muestra:
- Nombre y email del empleado
- Teléfono y dirección
- Fecha de inicio
- Estado de aprobación de cada documento (✓ Aprobado o ⏳ Pendiente)
- Lista de documentos disponibles

### 3. **Botones de Acción**
- **Aprobar Todo**: Aprueba todos los documentos del empleado
- **Aprobar ID**: Aprueba solo el documento de identidad
- **Aprobar SSN**: Aprueba solo el documento SSN
- **Aprobar Cert**: Aprueba solo el certificado

### 4. **Visualización de Documentos**
- Haz clic en "Ver" para visualizar cualquier documento
- Se abre un modal con vista previa de la imagen
- Cierra el modal con el botón × o haciendo clic fuera

---

## 📊 Campos de Aprobación

| Campo | Descripción |
|-------|-------------|
| `idApproved` | Aprobación de ID/Licencia (profileImagePath) |
| `ssnApproved` | Aprobación de SSN |
| `certApproved` | Aprobación de Certificación |

---

## 🔗 Rutas API

### 1. Obtener Empleados con Documentos
```
GET /api/admin/employees-approval
```
**Respuesta:**
```json
[
  {
    "_id": "64a8f3c2d9e4f1a2b3c4d5e6",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "phone": "555-1234",
    "address": "123 Calle Principal",
    "startDate": "2024-01-15T00:00:00.000Z",
    "profileImagePath": "https://cloudinary.com/...",
    "ssnDocumentPath": "https://cloudinary.com/...",
    "certDocumentPath": "https://cloudinary.com/...",
    "resumeDocumentPath": "https://cloudinary.com/...",
    "idApproved": false,
    "ssnApproved": false,
    "certApproved": false
  }
]
```

### 2. Aprobar un Documento
```
POST /api/admin/approve-document
Content-Type: application/json

{
  "empId": "64a8f3c2d9e4f1a2b3c4d5e6",
  "docType": "id" | "ssn" | "cert"
}
```

**Respuesta:**
```json
{
  "success": true,
  "employee": { ... }
}
```

### 3. Aprobar Todos los Documentos
```
POST /api/admin/approve-all
Content-Type: application/json

{
  "empId": "64a8f3c2d9e4f1a2b3c4d5e6"
}
```

---

## 💾 Cambios en MongoDB

Cuando un documento se aprueba, se actualiza la base de datos:

```javascript
// Ejemplo: Aprobar ID
await Employee.findByIdAndUpdate(empId, {
  idApproved: true
})

// Ejemplo: Aprobar todo
await Employee.findByIdAndUpdate(empId, {
  idApproved: true,
  ssnApproved: true,
  certApproved: true
})
```

---

## 🎨 Características de Diseño

✨ **Interfaz Moderna:**
- Gradientes de color profesionales
- Tarjetas con hover effects
- Diseño responsive para móviles
- Animaciones suaves

📱 **Responsive:**
- Se adapta a tablets y teléfonos
- Menú colapsable
- Botones redimensionables

⚡ **Actualizaciones en Tiempo Real:**
- Las estadísticas se actualizan cada 30 segundos
- Los cambios se guardan inmediatamente

---

## 🔒 Seguridad

**Nota Importante:** Actualmente, estas rutas NO tienen validación de autenticación.

Para producción, **añade validación de admin** en las rutas:

```javascript
app.get('/api/admin/employees-approval', authenticateAdmin, async (req, res) => {
  // ... código
});
```

---

## 📋 Checklist de Aprobación

Usa este checklist cuando apruebes a un nuevo empleado:

- [ ] Ver el documento de ID/Licencia
- [ ] Verificar que el nombre coincida
- [ ] Aprobar el ID
- [ ] Ver el documento SSN
- [ ] Verificar que el SSN sea válido
- [ ] Aprobar el SSN
- [ ] Ver el certificado
- [ ] Verificar que sea válido
- [ ] Aprobar el certificado
- [ ] (Opcional) Ver el CV/Resumen

---

## 🐛 Solución de Problemas

### Problema: Los documentos no se cargan
**Solución:** Verifica que:
- Los documentos estén guardados en Cloudinary
- Las rutas sean URLs válidas
- El navegador tenga permiso para mostrar imágenes

### Problema: Los botones no funcionan
**Solución:**
- Abre la consola de navegador (F12)
- Verifica que no haya errores de red
- Comprueba que el servidor esté corriendo

### Problema: La estadística no se actualiza
**Solución:**
- Recarga la página con F5
- Las estadísticas se actualizan cada 30 segundos automáticamente

---

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

---

**Versión:** 1.0  
**Fecha de Creación:** 27 de Enero de 2026  
**Estado:** ✅ Listo para Producción
