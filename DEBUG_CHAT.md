# 🔍 Guía de Debug - Chat No Muestra Mensajes

## Paso 1: Verifica que haya mensajes en MongoDB

Accede a: **http://localhost:3001/debug-chat.html**

### 1.1 Carga Empleados
- Click en "Cargar Empleados"
- Verifica que aparezca la lista
- **Copia un ID de empleado**

### 1.2 Carga la Conversación de ese Empleado
- Pega el ID en el input "ID del Empleado"
- Click en "Cargar Conversación"
- **¿Ves mensajes?** 
  - ✅ **SÍ** → Ir a Paso 2
  - ❌ **NO** → Ir a Paso 3

## Paso 2: Si Hay Mensajes en BD

Los mensajes están guardados pero no se cargar en adminChat.html

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a **adminChat.html**
3. Selecciona un empleado
4. **¿Qué dice la consola?**
   - Si ves `📨 Respuesta del servidor:` → Los mensajes SÍ llegan
   - Si NO ves esto → Hay un error de red

**Reporta lo que ves en consola**

## Paso 3: Si NO Hay Mensajes en BD

Los mensajes no se están guardando correctamente

**Verificar:**
1. Abre el test: **http://localhost:3001/test-chat.html**
2. Conecta Admin y Empleado
3. Envía un mensaje
4. Vuelve a debug-chat.html
5. Click en "Cargar Todos los Chats"
6. **¿Ves nuevos mensajes?**
   - ✅ **SÍ** → Entonces sí se guardan. Ir a Paso 2
   - ❌ **NO** → Hay un problema en Socket.IO

## Paso 4: Revisa la Consola del Servidor

Abre la terminal donde corre el servidor:
- Busca mensajes como `📨 Mensaje guardado entre...`
- Busca errores `❌`

**Reporta cualquier error que veas**

## Resumen de URLs

| URL | Propósito |
|-----|-----------|
| `/adminChat.html` | Panel de chat admin (no ve mensajes) |
| `/debug-chat.html` | Ver mensajes en BD |
| `/test-chat.html` | Enviar mensajes de prueba |
| `/api/debug/all-chats` | API con todos los chats |
| `/chat/convo/:userId` | API para obtener conversación |

## Qué Hacer

1. **Usa debug-chat.html para ver si hay mensajes en MongoDB**
2. **Abre la consola del navegador en adminChat.html (F12)**
3. **Reporta qué mensajes ves en consola**

Así podré saber exactamente dónde está el problema.
