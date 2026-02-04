// filepath: /f:/Luber Official/Empleados/Registro/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const http = require('http');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const SocketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// === MEMORY MONITOR & ANTI-FREEZE ===
let lastRequestTime = Date.now();

// Monitor if server is responsive
setInterval(() => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest > 30000) {
    console.warn(`[WARNING] Server inactive for ${(timeSinceLastRequest/1000).toFixed(0)}s`);
  }
}, 30000);

// === SOCKET.IO CHAT CONFIGURATION ===
const connectedUsers = new Map(); // Map to store connected users

io.on('connection', (socket) => {
  console.log(`✅ Nuevo cliente conectado: ${socket.id}`);

  socket.on('registerUser', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`📍 Usuario registrado: ${userId} con socket ${socket.id}`);
    socket.userId = userId;
  });

  socket.on('joinRoom', (data) => {
    const { userId, role } = data;
    socket.join(`chat_${userId}`);
    socket.userId = userId;
    socket.role = role;
    console.log(`📍 ${role} ${userId} se unió a la sala chat_${userId}`);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { from, to, text, imageUrl } = data;
      const sender = from || socket.userId;
      const receiverId = to || 'office';
      
      console.log(`💬 Mensaje de ${sender} a ${receiverId}: "${text}"`);

      // Guardar mensaje en BD
      const ChatConversation = require('./models/ChatConversation');
      const participants = [sender, receiverId].sort();
      
      const message = {
        sender,
        text: text || '',
        imageUrl: imageUrl || '',
        at: new Date()
      };

      let conversation = await ChatConversation.findOne({ participants });
      if (!conversation) {
        conversation = new ChatConversation({ participants, messages: [message] });
      } else {
        conversation.messages.push(message);
      }
      await conversation.save();

      // Enviar mensaje al receptor
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          sender,
          text: text || '',
          imageUrl: imageUrl || '',
          to: receiverId,
          at: new Date()
        });
        console.log(`✅ Mensaje entregado a ${receiverId}`);
      } else {
        console.log(`⚠️ El receptor ${receiverId} no está conectado`);
      }

      // Enviar notificación al receptor
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessageNotification', {
          sender,
          preview: (text || 'Imagen').substring(0, 50)
        });
      }
    } catch (err) {
      console.error('❌ Error enviando mensaje:', err);
      socket.emit('messageError', { error: 'Error al enviar mensaje' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`👋 Usuario desconectado: ${socket.userId}`);
    }
  });
});
// === RUTAS IMPORTANTES DE ARCHIVOS ===
const fontPath = path.join(__dirname, 'public/fonts/DejaVuSans.ttf');
const bgPath = path.join(__dirname, 'public/images/w2-background.png');

// === CLOUDINARY CONFIG ===
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// === MULTER + CLOUDINARY ===
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'luber_uploads',
    format: async () => 'png',
    public_id: (req, file) => file.fieldname + '-' + Date.now()
  }
});
const upload = multer({ storage });

// === EXPRESS CONFIG ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// === REQUEST TRACKING MIDDLEWARE ===
app.use((req, res, next) => {
  lastRequestTime = Date.now();
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: null, // La sesión persiste hasta que el navegador se cierre o se hace logout
    httpOnly: true,
    secure: false // Cambiar a true si usas HTTPS
  }
}));

// === MONGODB ====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ MongoDB error:', err));

// === MODELOS ===
const employeeSchema = new mongoose.Schema({
  accountType: { type: String, default: 'employee' },
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phone: String,
  address: String,
  state: String,
  dob: Date,
  ssn: String,
  startDate: Date,
  passwordHash: String,
  profileImagePath: String,
  ssnDocumentPath: String,
  certDocumentPath: String,
  resumeDocumentPath: String,
  luberAccess: String,
  dispatchAccess: { type: String, default: 'false' },
  consentGiven: { type: Boolean, default: false },
  idApproved: { type: Boolean, default: false },
  ssnApproved: { type: Boolean, default: false },
  certApproved: { type: Boolean, default: false },
  resumeApproved: { type: Boolean, default: false },
  totalEarnings: { type: Number, default: 0 },
  earningsHistory: [{
    scheduleId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    completedAt: Date,
    Requested: { type: Boolean, default: false },
    Paid: { type: Boolean, default: false }
  }]
});
const Employee = mongoose.model('Employee', employeeSchema);

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule',
  new mongoose.Schema({}, { strict: false, collection: 'schedules' })
);

// === EMPLOYEE ACCEPTANCE MODEL ===
const EmployeeAcceptance = require('./models/EmployeeAcceptance');

// === NODEMAILER ===
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// === RUTAS DE REGISTRO Y LOGIN ===
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', upload.fields([
  { name: 'profileImage' }, { name: 'ssnDoc' },
  { name: 'certDoc' }, { name: 'resumeDoc' }
]), async (req, res) => {
  const {
    firstName, lastName, email, phone, address,
    password, ssn, state, dob, startDate, consent, dispatchAccess
  } = req.body;

  if (!consent) {
    return res.render('register', { error: 'Debes aceptar el uso de tus datos personales.' });
  }

  // Validate SSN format (XXX-XX-XXXX)
  if (!ssn || !/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
    return res.render('register', { error: 'El número de seguro social debe estar en formato XXX-XX-XXXX' });
  }

  // Validate uploaded files exist to avoid runtime errors (ngrok requests may omit files)
  const files = req.files || {};
  const missingFiles = [];
  if (!files.profileImage || !files.profileImage[0]) missingFiles.push('Profile Image');
  if (!files.ssnDoc || !files.ssnDoc[0]) missingFiles.push('SSN Document');
  if (!files.certDoc || !files.certDoc[0]) missingFiles.push('Certification');
  if (!files.resumeDoc || !files.resumeDoc[0]) missingFiles.push('Resume');
  if (missingFiles.length) {
    return res.render('register', { error: 'Faltan archivos: ' + missingFiles.join(', ') });
  }

  // Build luberAccess and hash password, then create and save inside try/catch
  const luberAccess = (firstName[0] + lastName[0]).toLowerCase() + (phone || '').slice(-4);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const emp = new Employee({
      accountType: 'employee',
      firstName,
      lastName,
      email,
      phone,
      address,
      ssn,
      state,
      dob,
      startDate,
      passwordHash,
      profileImagePath: files.profileImage[0].path,
      ssnDocumentPath: files.ssnDoc[0].path,
      certDocumentPath: files.certDoc[0].path,
      resumeDocumentPath: files.resumeDoc[0].path,
      luberAccess,
      dispatchAccess: dispatchAccess === 'on' ? 'true' : 'false',
      consentGiven: true
    });

    await emp.save();

    // send welcome email (don't block registration on mail failures)
    await transporter.sendMail({
  from: `"Luber HR" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: '🔐 Tu acceso a Luber',
  text: `Hola ${firstName},

Tus credenciales de acceso a Luber son:

Email: ${email}
Contraseña: ${password}
Clave LuberAccess: ${luberAccess}

Guárdalas en un lugar seguro.
No compartas esta información con nadie.

— Equipo Luber`,
  html: `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f6f7f9; padding:40px;">
      <div style="max-width:520px; margin:auto; background:#ffffff; padding:32px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        
        <h2 style="margin-top:0; color:#111;">Hola ${firstName} 👋</h2>

        <p style="font-size:15px; color:#333;">
          Bienvenido a <strong>Luber</strong>. Aquí están tus credenciales de acceso.
        </p>

        <div style="margin:24px 0; padding:16px; background:#f0f4ff; border-radius:6px;">
          <p style="margin:0 0 12px 0; font-size:14px; color:#555;"><strong>Email:</strong></p>
          <div style="font-size:15px; color:#1a3cff; margin-bottom:16px; word-break: break-all;">
            ${email}
          </div>

          <p style="margin:0 0 12px 0; font-size:14px; color:#555;"><strong>Contraseña:</strong></p>
          <div style="font-size:15px; color:#1a3cff; margin-bottom:16px; word-break: break-all;">
            ${password}
          </div>

          <p style="margin:0 0 12px 0; font-size:14px; color:#555;"><strong>Clave LuberAccess:</strong></p>
          <div style="font-size:22px; font-weight:bold; letter-spacing:2px; color:#1a3cff;">
            ${luberAccess}
          </div>
        </div>

        <p style="font-size:14px; color:#d32f2f; margin-top:16px;">
          ⚠️ Guarda estas credenciales en un lugar seguro.  
          No las compartas con nadie.
        </p>

        <hr style="border:none; border-top:1px solid #eee; margin:32px 0;" />

        <p style="font-size:12px; color:#999;">
          — Equipo Luber<br/>
          Recursos Humanos
        </p>
      </div>
    </div>
  `
}).catch(err => {
  console.error('⚠️ Error enviando mail:', err);
});


    req.session.empId = emp._id;
    return res.redirect('/login');
  } catch (err) {
    console.error('❌ Error en registro:', err);
    const msg = err.code === 11000 ? '⚠️ Email ya registrado' : '❌ Error al registrar (ver logs)';
    return res.render('register', { error: msg });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, registered: req.query.registered === 'true' });
});

app.post('/login', async (req, res) => {
  const { email, luberAccess } = req.body;
  const emp = await Employee.findOne({ email, luberAccess });
  if (!emp) return res.render('login', { error: 'Email o clave incorrecta', registered: false });

  req.session.empId = emp._id;
  res.redirect('/profile');
});

// === PERFIL ===
app.get('/profile', async (req, res) => {
  if (!req.session.empId) return res.redirect('/login');

  const accountTypeFilter = req.query.accountType;

  try {
    const emp = await Employee.findById(req.session.empId).lean();
    if (!emp) return res.redirect('/login');

    const isApproved = emp.idApproved && emp.ssnApproved && emp.certApproved;
    if (!isApproved) return res.redirect('/employeeApproval');

    // ✅ MODIFICADO: Ahora incluye schedules completados también
    // El filtrado en tabs (Incoming, My Work Schedules, Completed) se hace en el cliente
    const baseConditions = {
      $or: [
        { reserved: false, Completed: { $ne: true } },  // Ofertas disponibles (no completadas)
        { reserved: true, acceptedBy: req.session.empId }  // Mis aceptadas (completadas o no)
      ]
    };

    const fleetFilter = { accountType: 'Fleet', confirmed: true, processed: true };
    const customerFilter = { accountType: 'Customer' };

    if (accountTypeFilter === 'Fleet') {
      baseConditions.$and = [fleetFilter];
    } else if (accountTypeFilter === 'Customer') {
      baseConditions.$and = [customerFilter];
    } else {
      baseConditions.$and = [{ $or: [fleetFilter, customerFilter] }];
    }

    const schedules = await Schedule.find(baseConditions).sort({ createdAt: -1 }).lean();

    res.render('employeeProfile', {
      emp,
      schedules,
      selectedAccountType: accountTypeFilter || ''
    });
  } catch (err) {
    console.error('❌ Error en /profile:', err);
    res.render('employeeProfile', { emp: {}, schedules: [], selectedAccountType: '' });
  }
});

// === REPORTE DE ACEPTACIONES ===
app.get('/acceptances-report', (req, res) => {
  // Verificar si es admin
  if (!req.session?.empId) return res.redirect('/login');
  
  // En el futuro, aquí verificarías que sea admin
  res.sendFile(path.join(__dirname, 'public', 'acceptancesReport.html'));
});

// === W-2 PDF GENERATOR ===
app.post('/download-w2', async (req, res) => {
  if (!req.session.empId) return res.status(401).send('No autorizado');

  try {
    const emp = await Employee.findById(req.session.empId).lean();
    if (!emp) return res.status(404).send('Empleado no encontrado');

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    let total = 0;

    const fontPath = path.join(__dirname, 'public/fonts/DejaVuSans.ttf');
    if (fs.existsSync(fontPath)) {
      doc.registerFont('clean', fontPath);
      doc.font('clean');
    }

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Luber-1099.pdf"');
      res.send(result);
    });

    const bgPath = path.join(__dirname, 'public/images/w2-background.png');
    if (fs.existsSync(bgPath)) {
      doc.save();
      doc.opacity(0.15);
      doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
      doc.restore();
    }

    const logoPath = path.join(__dirname, 'public/images/logo.png');
    if (fs.existsSync(logoPath)) {
      // draw logo top-right
      doc.image(logoPath, doc.page.width - 130, 50, { width: 80 });
    }

    // Header
    doc.fontSize(18).fillColor('#0b2240').text('Luber Inc.', 50, 50);
    doc.fontSize(10).fillColor('#233348').text('1099 Form', 50, 72);
    doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100).strokeColor('#e6edf3').stroke();

    // helper to draw label/value pairs in two columns
    const leftX = 50;
    const rightX = 320;
    const labelWidth = 120;
    let y = 110;
    const lh = 16;

    function kv(xLabel, xValue, yy, label, value){
      // draw label and value in two columns; return used height
      const labelFontSize = 9;
      const valueFontSize = 10;
      doc.fontSize(labelFontSize).fillColor('#475569');
      // measure label height
      const labelText = label + ':';
      const labelHeight = doc.heightOfString(labelText, { width: xValue - xLabel - 4 });

      // measure value height within remaining width to right column
      const valueMaxWidth = doc.page.width - xValue - 60;
      doc.fontSize(valueFontSize).fillColor('#0b2240');
      const valueText = String(value || '-');
      const valueHeight = doc.heightOfString(valueText, { width: valueMaxWidth });

      // actually render
      doc.fontSize(labelFontSize).fillColor('#475569').text(labelText, xLabel, yy);
      doc.fontSize(valueFontSize).fillColor('#0b2240').text(valueText, xValue, yy, { width: valueMaxWidth });

      return Math.max(labelHeight, valueHeight);
    }

    // Personal info block
    // draw pairs and advance y by tallest rendered block
    let h1 = kv(leftX, leftX + labelWidth, y, 'Nombre', `${emp.firstName} ${emp.lastName}`);
    let h2 = kv(rightX, rightX + labelWidth, y, 'LuberAccess', emp.luberAccess);
    y += Math.max(h1, h2, lh) + 2;

    // Email con tamaño más pequeño
    doc.fontSize(7).fillColor('#475569').text('Email:', leftX, y);
    doc.fontSize(8).fillColor('#0b2240').text(emp.email, leftX + labelWidth, y, { width: doc.page.width - (leftX + labelWidth) - 60 });
    h2 = kv(rightX, rightX + labelWidth, y, 'Teléfono', emp.phone);
    y += Math.max(12, h2, lh) + 2;

    // Dirección en dos líneas - separar por primera coma
    const addressFull = emp.address || '-';
    const stateLine = emp.state || '';
    
    // Dividir la dirección en la primera coma
    const commaIndex = addressFull.indexOf(',');
    let addressLine1 = addressFull;
    let addressLine2 = '';
    
    if (commaIndex !== -1) {
      addressLine1 = addressFull.substring(0, commaIndex + 1).trim(); // incluir la coma
      addressLine2 = addressFull.substring(commaIndex + 1).trim();
    }
    
    doc.fontSize(9).fillColor('#475569').text('Dirección:', leftX, y);
    doc.fontSize(8).fillColor('#0b2240').text(addressLine1, leftX + labelWidth, y, { width: doc.page.width - (leftX + labelWidth) - 60 });
    y += 10;
    doc.fontSize(8).fillColor('#0b2240').text(addressLine2, leftX + labelWidth, y, { width: doc.page.width - (leftX + labelWidth) - 60 });
    
    h2 = kv(rightX, rightX + labelWidth, y - 10, 'Nacimiento', emp.dob ? new Date(emp.dob).toLocaleDateString() : '-');
    y += Math.max(12, h2, lh) + 2;

    h1 = kv(leftX, leftX + labelWidth, y, 'Inicio', emp.startDate ? new Date(emp.startDate).toLocaleDateString() : '-');
    h2 = kv(rightX, rightX + labelWidth, y, 'SSN (últimos 4)', emp.ssn ? ('***-**-' + emp.ssn.slice(-4)) : 'XXXX');
    y += Math.max(h1, h2, lh) + 2;

    h1 = kv(leftX, leftX + labelWidth, y, 'Ganancia Total', `$${(emp.totalEarnings||0).toFixed(2)}`);
    y += Math.max(h1, lh) + 3;

    // Earnings history table
    doc.moveTo(leftX, y).lineTo(doc.page.width - 50, y).strokeColor('#e6edf3').stroke();
    y += 4;
    doc.fontSize(12).fillColor('#0b2240').text('Historial de Ganancias', leftX, y);
    y += lh;

    if (!emp.earningsHistory || !emp.earningsHistory.length){
      doc.fontSize(10).fillColor('#475569').text('No hay ganancias registradas.', leftX, y);
    } else {
      // compute total
      const earningsTotal = (emp.earningsHistory || []).reduce((s, e) => s + (e.amount || 0), 0);
      // table headers
      const col1 = leftX;
      const col2 = leftX + 120;
      const col3 = leftX + 240;
      doc.fontSize(10).fillColor('#94a3b8').text('Fecha', col1, y);
      doc.text('Monto', col2, y);
      doc.text('Estado', col3, y);
      y += lh - 4;

      emp.earningsHistory.forEach((entry, i) => {
        const date = entry.completedAt ? new Date(entry.completedAt).toLocaleDateString() : '-';
        const amount = `$${(entry.amount||0).toFixed(2)}`;
        let estado = 'No';
        if (entry.Requested && entry.Paid) estado = 'Requested / Paid';
        else if (entry.Paid) estado = 'Paid';
        else if (entry.Requested) estado = 'Requested';

        // compute heights for each cell
        const hDate = doc.heightOfString(date, { width: col2 - col1 - 8 });
        const hAmount = doc.heightOfString(amount, { width: col3 - col2 - 8 });
        const hEstado = doc.heightOfString(estado, { width: doc.page.width - col3 - 60 });
        const rowH = Math.max(hDate, hAmount, hEstado, lh);

        if (y + rowH > doc.page.height - 80) { doc.addPage(); y = 60; }

        // alternating background
        if (i % 2 === 0){
          doc.rect(leftX - 6, y - 2, doc.page.width - leftX - 44, rowH + 6).fill('#fbfdff').fillColor('#0b2240');
        }

        doc.fillColor('#0b2240').fontSize(10).text(date, col1, y, { width: col2 - col1 - 8 });
        doc.text(amount, col2, y, { width: col3 - col2 - 8 });
        doc.text(estado, col3, y, { width: doc.page.width - col3 - 60 });
        y += rowH + 3;
      });

      // leave a bit more breathing room before the total
      y += 12;
      doc.fontSize(11).fillColor('green')
        .text(`Total acumulado: $${earningsTotal.toFixed(2)}`, leftX, y, { width: doc.page.width - leftX - 60, align: 'right' });
    }

    // Footer
    doc.moveTo(50, doc.page.height - 90).lineTo(doc.page.width - 50, doc.page.height - 90).strokeColor('#e6edf3').stroke();
    doc.fontSize(9).fillColor('#94a3b8').text('Este formulario fue generado automáticamente por Luber Inc.', 50, doc.page.height - 70, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  } catch (err) {
    console.error('❌ Error generando W-2:', err);
    res.status(500).send('Error generando el PDF');
  }
});

// === 1099 PDF GENERATOR ===
app.post('/download-1099', async (req, res) => {
  if (!req.session.empId) return res.status(401).send('No autorizado');

  try {
    const emp = await Employee.findById(req.session.empId).lean();
    if (!emp) return res.status(404).send('Empleado no encontrado');

    if ((emp.totalEarnings || 0) < 600) {
      return res.status(400).send('Este empleado no alcanza el mínimo para 1099.');
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Luber-1099NEC.pdf"');
      res.send(result);
    });

    const year = new Date().getFullYear();
    doc.fontSize(20).fillColor('#000').text(`1099-NEC ${year}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#000').text('👉 Pagador:', { underline: true });
    doc.text('Nombre: Luber Inc.');
    doc.text('TIN: 98-7654321');
    doc.text('Dirección: 456 Business Rd, Orlando, FL 32801');
    doc.moveDown();

    doc.fontSize(12).fillColor('#000').text('🧑 Empleado:', { underline: true });
    doc.text(`Nombre: ${emp.firstName} ${emp.lastName}`);
    doc.text(`SSN: ***-**-${emp.ssn?.slice(-4) || 'XXXX'}`);
    doc.text(`Dirección: ${emp.address}, ${emp.state}`);
    doc.text(`Email: ${emp.email}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('green')
      .text(`💵 Ganancias reportadas: $${emp.totalEarnings?.toFixed(2)}`, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(10).fillColor('gray')
      .text('Este documento no sustituye el formulario oficial del IRS, pero contiene toda la información necesaria para tu declaración de impuestos.', {
        align: 'center'
      });

    doc.end();
  } catch (err) {
    console.error('❌ Error generando 1099:', err);
    res.status(500).send('Error generando el PDF');
  }
});

// === FUNCIÓN PARA CALCULAR DISTANCIA HAVERSINE ===
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 20902231; // Radio de la Tierra en pies (6371 km = 20902231 pies)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en pies
}

// === ACTUALIZAR ESTADO DE SCHEDULE ===
app.post('/update-status', async (req, res) => {
  const { scheduleId, statusKey, serviceMilage } = req.body;
  const validKeys = ['OnRoad', 'Arrived', 'Started', 'Completed'];

  if (!req.session?.empId || !validKeys.includes(statusKey)) {
    return res.status(400).json({ error: 'Solicitud inválida o no autorizado' });
  }

  try {
    const employee = await Employee.findById(req.session.empId).lean();
    const update = { [statusKey]: true };

    // ✅ Validar distancia si el estado es "Arrived"
    if (statusKey === 'Arrived') {
      const employeeAcceptance = await EmployeeAcceptance.findOne({
        scheduleId: scheduleId,
        employeeId: req.session.empId
      }).lean();

      if (!employeeAcceptance) {
        return res.status(404).json({ error: 'Registro de aceptación no encontrado' });
      }

      console.log(`✅ Empleado marcó como Arrived - ${scheduleId}`);
    }

    if (statusKey === 'Completed') {
      update.completedBy = `${employee.firstName} ${employee.lastName}`;
      update.completedAt = new Date();
      if (serviceMilage !== undefined) update.serviceMilage = serviceMilage;

      const scheduleOriginal = await Schedule.findById(scheduleId).lean();
      const offer = parseFloat(scheduleOriginal?.offerPrice) || 0;

      const updateEmployee = {
        $inc: { totalEarnings: offer },
        $set: {
          EarningsRequested: false,
          EarningsApproval: false
        },
        $push: {
          earningsHistory: {
            scheduleId,
            amount: offer,
            completedAt: new Date(),
            Requested: false,
            Paid: false
          }
        }
      };

      const updatedEmp = await Employee.findByIdAndUpdate(
        req.session.empId,
        updateEmployee,
        { new: true }
      );

      // Socket.IO eliminado - El cliente consultará la ubicación con un botón de refresh
    }

    const schedule = await Schedule.findOneAndUpdate(
      { _id: scheduleId, acceptedBy: req.session.empId },
      { $set: update },
      { new: true }
    );

    if (!schedule) return res.status(404).json({ error: 'No encontrado o sin permisos' });

    // Socket.IO eliminado - El cliente consultará el status con un botón de refresh
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === ACEPTAR OFERTA ===
app.post('/accept-offer', async (req, res) => {
  const { scheduleId, location } = req.body;
  if (!req.session?.empId) return res.status(401).json({ error: 'No autorizado' });

  try {
    console.log(`📍 [ACCEPT-OFFER] Datos recibidos:`, {
      scheduleId,
      location,
      empId: req.session.empId
    });

    const selectedSchedule = await Schedule.findById(scheduleId).lean();
    if (!selectedSchedule) return res.status(404).json({ error: 'Schedule no encontrado' });

    const selectedHour = parseInt(selectedSchedule.time.split(':')[0], 10);
    const selectedMinute = parseInt(selectedSchedule.time.split(':')[1], 10);
    const selectedDate = selectedSchedule.date;
    const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;
    const selectedCustomer = selectedSchedule.customerName;

    const alreadyAccepted = await Schedule.find({
      acceptedBy: req.session.empId,
      date: selectedDate
    }).lean();

    const conflict = alreadyAccepted.some(existing => {
      if (!existing.time || !existing.customerName) return false;
      const [h, m] = existing.time.split(':').map(Number);
      const existingTime = h * 60 + m;
      const timeDiff = Math.abs(existingTime - selectedTimeInMinutes);
      return timeDiff === 0 && existing.customerName !== selectedCustomer;
    });

    if (conflict) {
      return res.status(400).json({
        error: '⛔ Ya tienes una oferta aceptada a esa misma hora con otro cliente.'
      });
    }

    // Prepare location data if provided
    const ubicationData = location && location.latitude && location.longitude ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 0,
      timestamp: new Date(),
      locationHistory: [{
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        timestamp: new Date()
      }]
    } : null;

    console.log(`📍 [ACCEPT-OFFER] Datos de ubicación procesados:`, ubicationData);

    // Update Schedule with location and acceptedBy
    const result = await Schedule.findOneAndUpdate(
      { _id: scheduleId, reserved: false },
      { 
        $set: { 
          reserved: true, 
          acceptedBy: req.session.empId,
          acceptedAt: new Date(),
          employeeLocation: ubicationData // 📍 Guardar ubicación también en Schedule
        } 
      }
    );

    if (!result) return res.status(404).json({ error: 'Ya fue aceptada por otro empleado' });

    // ✅ GUARDAR REGISTRO DE ACEPTACIÓN DEL EMPLEADO
    const employee = await Employee.findById(req.session.empId).lean();
    
    if (employee) {
      const employeeAcceptance = new EmployeeAcceptance({
        employeeId: req.session.empId,
        scheduleId: scheduleId,
        employeeInfo: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
          state: employee.state
        },
        scheduleInfo: {
          date: selectedSchedule.date,
          time: selectedSchedule.time,
          customerName: selectedSchedule.customerName,
          customerType: selectedSchedule.customerType,
          vehicleType: selectedSchedule.vehicleType,
          price: selectedSchedule.price,
          location: selectedSchedule.location,
          pickupAddress: selectedSchedule.pickupAddress,
          dropoffAddress: selectedSchedule.dropoffAddress
        },
        acceptanceType: 'single',
        status: 'accepted',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        employeeUbication: ubicationData
      });

      await employeeAcceptance.save();
      console.log(`✅ [ACCEPT-OFFER] Aceptación registrada para empleado ${req.session.empId}`);
      console.log(`📍 [ACCEPT-OFFER] Ubicación guardada:`, ubicationData ? `Lat: ${ubicationData.latitude}, Lon: ${ubicationData.longitude}` : 'SIN UBICACIÓN');
    }

    res.json({ success: true, locationSaved: !!ubicationData });
  } catch (err) {
    console.error('❌ [ACCEPT-OFFER] Error en aceptar oferta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === ACEPTAR MÚLTIPLES OFERTAS (RUTA PLANNER) ===
app.post('/accept-multiple-offers', async (req, res) => {
  const { scheduleIds } = req.body;
  if (!req.session?.empId) return res.status(401).json({ error: 'No autorizado' });

  if (!Array.isArray(scheduleIds) || scheduleIds.length < 2) {
    return res.status(400).json({ error: 'Se requieren al menos 2 ofertas' });
  }

  try {
    // Obtener todos los schedules
    const schedules = await Schedule.find({ _id: { $in: scheduleIds } }).lean();
    
    if (schedules.length !== scheduleIds.length) {
      return res.status(404).json({ error: 'Uno o más schedules no encontrados' });
    }

    // Verificar que no estén reservadas
    const unreservedSchedules = schedules.filter(s => !s.reserved);
    if (unreservedSchedules.length !== scheduleIds.length) {
      return res.status(400).json({ error: '❌ Una o más ofertas ya fueron aceptadas' });
    }

    // Obtener schedules ya aceptados por el empleado
    const alreadyAccepted = await Schedule.find({
      acceptedBy: req.session.empId
    }).lean();

    // Verificar conflictos de tiempo (mismo cliente a la misma hora es permitido)
    let hasConflict = false;
    let conflictMessage = '';

    for (const newSchedule of unreservedSchedules) {
      const newHour = parseInt(newSchedule.time.split(':')[0], 10);
      const newMinute = parseInt(newSchedule.time.split(':')[1], 10);
      const newDate = newSchedule.date;
      const newTimeInMinutes = newHour * 60 + newMinute;
      const newCustomer = newSchedule.customerName;

      const existingConflict = alreadyAccepted.some(existing => {
        if (!existing.time || !existing.customerName || existing.date !== newDate) return false;
        const [h, m] = existing.time.split(':').map(Number);
        const existingTime = h * 60 + m;
        const timeDiff = Math.abs(existingTime - newTimeInMinutes);
        // Conflicto si es a la misma hora pero diferente cliente
        return timeDiff === 0 && existing.customerName !== newCustomer;
      });

      if (existingConflict) {
        hasConflict = true;
        conflictMessage = `⛔ Conflicto: Ya tienes una oferta a las ${newSchedule.time} en la fecha ${newDate} con otro cliente`;
        break;
      }
    }

    if (hasConflict) {
      return res.status(400).json({ error: conflictMessage });
    }

    // Aceptar todas las ofertas en orden
    const updates = scheduleIds.map((scheduleId, index) => ({
      updateOne: {
        filter: { _id: scheduleId, reserved: false },
        update: {
          $set: {
            reserved: true,
            acceptedBy: req.session.empId,
            stopOrder: index + 1  // Número de parada
          }
        }
      }
    }));

    const result = await Schedule.bulkWrite(updates);

    if (result.modifiedCount !== scheduleIds.length) {
      return res.status(400).json({ 
        error: 'No se pudieron aceptar todas las ofertas (es posible que hayan sido aceptadas por otro empleado)'
      });
    }

    // ✅ GUARDAR REGISTROS DE ACEPTACIÓN MÚLTIPLE DEL EMPLEADO
    const employee = await Employee.findById(req.session.empId).lean();
    
    if (employee) {
      const acceptanceRecords = schedules.map((schedule, index) => {
        const matchingScheduleId = scheduleIds[index];
        return {
          employeeId: req.session.empId,
          scheduleId: matchingScheduleId,
          employeeInfo: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            address: employee.address,
            state: employee.state
          },
          scheduleInfo: {
            date: schedule.date,
            time: schedule.time,
            customerName: schedule.customerName,
            customerType: schedule.customerType,
            vehicleType: schedule.vehicleType,
            price: schedule.price,
            location: schedule.location,
            pickupAddress: schedule.pickupAddress,
            dropoffAddress: schedule.dropoffAddress,
            stopOrder: index + 1
          },
          acceptanceType: 'route-planner',
          status: 'accepted',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        };
      });

      await EmployeeAcceptance.insertMany(acceptanceRecords);
      console.log(`✅ ${acceptanceRecords.length} aceptaciones registradas para empleado ${req.session.empId}`);
    }

    res.json({ 
      success: true, 
      message: `✅ ${scheduleIds.length} ofertas aceptadas correctamente`,
      acceptedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('❌ Error en aceptar múltiples ofertas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === APROBACIÓN MANUAL DEL EMPLEADO ===
app.get('/employeeApproval', (req, res) => {
  if (!req.session.empId) return res.redirect('/login');
  res.render('employeeApproval', { empId: req.session.empId });
});

app.post('/approve/:id', async (req, res) => {
  const { id } = req.params;

  await Employee.findByIdAndUpdate(id, {
    idApproved: true,
    ssnApproved: true,
    certApproved: true
  });

  // Socket.IO eliminado - El cliente consultará los datos con un botón de refresh
  res.json({ approved: true });
});

// === CHAT API - Get current employee ===
app.get('/api/current-employee', async (req, res) => {
  if (!req.session?.empId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const emp = await Employee.findById(req.session.empId).select('_id firstName lastName email').lean();
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(emp);
  } catch (err) {
    console.error('❌ Error obteniendo empleado:', err);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
});

// === CHAT API - Get employee schedules ===
app.get('/api/employee-schedules/:employeeId', async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    console.log(`📅 Obteniendo schedules para empleado: ${employeeId}`);
    
    const schedules = await Schedule.find({
      $or: [
        { reserved: false },
        { acceptedBy: employeeId }
      ]
    }).lean();

    console.log(`📊 Total de schedules encontrados: ${schedules.length}`);
    res.json(schedules);
  } catch (err) {
    console.error('❌ Error obteniendo schedules:', err);
    res.status(500).json({ error: 'Error al obtener schedules' });
  }
});

// === CHAT API - Get employees list (for admin) ===
app.get('/api/chat/employees', async (req, res) => {
  try {
    const employees = await Employee.find({}, 'firstName lastName _id email').lean();
    res.json(employees);
  } catch (err) {
    console.error('❌ Error obteniendo empleados:', err);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// === CHAT API - Get conversation ===
app.get('/chat/convo/:userId', async (req, res) => {
  try {
    const employeeId = req.params.userId;
    const adminId = 'office'; // El admin siempre es 'office'
    
    // Los participantes siempre son sorted
    const participants = [adminId, employeeId].sort();
    
    console.log(`📨 Buscando chat entre: ${JSON.stringify(participants)}`);
    
    const ChatConversation = require('./models/ChatConversation');
    const convo = await ChatConversation.findOne({ participants }).lean();
    
    if (!convo) {
      console.log(`ℹ️ No hay conversación para ${JSON.stringify(participants)}`);
      return res.json([]);
    }
    
    console.log(`✅ Conversación encontrada con ${convo.messages.length} mensajes`);
    res.json(convo.messages);
  } catch (err) {
    console.error('❌ Error al obtener conversación:', err);
    res.status(500).json({ error: 'Error al obtener el chat' });
  }
});

// === CHAT API - Send message (HTTP fallback) ===
app.post('/chat/convo/:userId/send', async (req, res) => {
  try {
    const { text, imageUrl, sender } = req.body;
    const receiverId = req.params.userId;
    const senderId = sender || req.session?.empId;

    if (!senderId || (!text && !imageUrl)) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const ChatConversation = require('./models/ChatConversation');
    const participants = [senderId, receiverId].sort();
    
    const message = {
      sender: senderId,
      text: text || '',
      imageUrl: imageUrl || '',
      at: new Date()
    };

    let conversation = await ChatConversation.findOne({ participants });
    if (!conversation) {
      conversation = new ChatConversation({ participants, messages: [message] });
    } else {
      conversation.messages.push(message);
    }
    
    await conversation.save();

    // Emit via Socket.IO si el receptor está conectado
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', {
        sender: senderId,
        text: text || '',
        imageUrl: imageUrl || '',
        to: receiverId,
        at: new Date()
      });
      io.to(receiverSocketId).emit('newMessageNotification', {
        sender: senderId,
        preview: (text || 'Imagen').substring(0, 50)
      });
    }

    res.json({ success: true, message });
  } catch (err) {
    console.error('❌ Error enviando mensaje:', err);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// === CHAT API - Upload chat image ===
const chatImageUpload = multer({ storage }).single('chatImage');
app.post('/upload-chat-image', chatImageUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ninguna imagen.' });
  }

  try {
    // Si usas Cloudinary con multer-storage-cloudinary, el archivo ya está subido
    if (req.file.path) {
      // Ya subido a Cloudinary
      res.json({ success: true, url: req.file.path });
    } else {
      // Alternativa: subir manualmente a Cloudinary
      const streamifier = require('streamifier');
      const streamUpload = (buffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'luber-chat' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });

      const result = await streamUpload(req.file.buffer);
      res.json({ success: true, url: result.secure_url });
    }
  } catch (err) {
    console.error('❌ Error subiendo imagen:', err);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

// === DEBUG - Ver todos los chats ===
app.get('/api/debug/all-chats', async (req, res) => {
  try {
    const ChatConversation = require('./models/ChatConversation');
    const allChats = await ChatConversation.find({}).lean();
    console.log(`📊 Total de chats en BD: ${allChats.length}`);
    allChats.forEach((chat, idx) => {
      console.log(`Chat ${idx}: Participantes:`, chat.participants, `- Mensajes: ${chat.messages.length}`);
    });
    res.json(allChats);
  } catch (err) {
    console.error('❌ Error obteniendo chats:', err);
    res.status(500).json({ error: err.message });
  }
});

// === 📋 API - APROBACIÓN DE EMPLEADOS ===

// Obtener todos los empleados con sus documentos
app.get('/api/admin/employees-approval', async (req, res) => {
  try {
    const employees = await Employee.find({}, 
      'firstName lastName email phone address startDate profileImagePath ssnDocumentPath certDocumentPath resumeDocumentPath idApproved ssnApproved certApproved resumeApproved'
    ).lean();
    res.json(employees);
  } catch (err) {
    console.error('❌ Error obteniendo empleados:', err);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

// Aprobar un documento específico
app.post('/api/admin/approve-document', async (req, res) => {
  try {
    const { empId, docType } = req.body;

    if (!empId || !docType) {
      return res.status(400).json({ error: 'Parámetros faltantes' });
    }

    const updateFields = {};
    if (docType === 'id') updateFields.idApproved = true;
    else if (docType === 'ssn') updateFields.ssnApproved = true;
    else if (docType === 'cert') updateFields.certApproved = true;
    else if (docType === 'resume') updateFields.resumeApproved = true;
    else return res.status(400).json({ error: 'Tipo de documento inválido' });

    const updatedEmployee = await Employee.findByIdAndUpdate(empId, updateFields, { new: true });

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Socket.IO eliminado - El cliente consultará los datos con un botón de refresh

    console.log(`✅ Documento ${docType} aprobado para empleado ${empId}`);
    res.json({ success: true, employee: updatedEmployee });
  } catch (err) {
    console.error('❌ Error al aprobar documento:', err);
    res.status(500).json({ error: 'Error al aprobar el documento' });
  }
});

// Aprobar todos los documentos de un empleado
app.post('/api/admin/approve-all', async (req, res) => {
  try {
    const { empId } = req.body;

    if (!empId) {
      return res.status(400).json({ error: 'ID de empleado faltante' });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(empId, {
      idApproved: true,
      ssnApproved: true,
      certApproved: true,
      resumeApproved: true
    }, { new: true });

    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Socket.IO eliminado - El cliente consultará los datos con un botón de refresh

    console.log(`✅ Todos los documentos aprobados para empleado ${empId}`);
    res.json({ success: true, employee: updatedEmployee });
  } catch (err) {
    console.error('❌ Error al aprobar documentos:', err);
    res.status(500).json({ error: 'Error al aprobar los documentos' });
  }
});

// Obtener estado de aprobación del empleado (para el empleado)
app.get('/api/employee/approval-status/:empId', async (req, res) => {
  try {
    const { empId } = req.params;

    const employee = await Employee.findById(empId).select(
      'idApproved ssnApproved certApproved resumeApproved resumeDocumentPath'
    );

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({
      idApproved: employee.idApproved || false,
      ssnApproved: employee.ssnApproved || false,
      certApproved: employee.certApproved || false,
      resumeApproved: employee.resumeApproved || false,
      hasResume: !!employee.resumeDocumentPath
    });
  } catch (err) {
    console.error('❌ Error al obtener estado de aprobación:', err);
    res.status(500).json({ error: 'Error al obtener el estado' });
  }
});

// === 📊 EMPLOYEE ACCEPTANCE REPORTS ===

// Obtener todos los registros de aceptación (para reportes)
app.get('/api/admin/employee-acceptances', async (req, res) => {
  try {
    if (!req.session?.empId || req.session?.role !== 'admin') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { employeeId, dateFrom, dateTo, status } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.acceptedAt = {};
      if (dateFrom) filter.acceptedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.acceptedAt.$lte = new Date(dateTo);
    }

    const acceptances = await EmployeeAcceptance.find(filter)
      .sort({ acceptedAt: -1 })
      .lean();

    res.json({
      total: acceptances.length,
      acceptances
    });
  } catch (err) {
    console.error('❌ Error obteniendo aceptaciones:', err);
    res.status(500).json({ error: 'Error al obtener aceptaciones' });
  }
});

// Obtener aceptaciones de un empleado específico
app.get('/api/admin/employee-acceptances/:employeeId', async (req, res) => {
  try {
    if (!req.session?.empId || req.session?.role !== 'admin') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { employeeId } = req.params;
    const { status } = req.query;
    const filter = { employeeId };

    if (status) filter.status = status;

    const acceptances = await EmployeeAcceptance.find(filter)
      .sort({ acceptedAt: -1 })
      .lean();

    const employee = await Employee.findById(employeeId).lean();

    res.json({
      employee: employee ? {
        id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone
      } : null,
      total: acceptances.length,
      acceptances
    });
  } catch (err) {
    console.error('❌ Error obteniendo aceptaciones del empleado:', err);
    res.status(500).json({ error: 'Error al obtener aceptaciones' });
  }
});

// Obtener resumen de aceptaciones por empleado
app.get('/api/admin/acceptances-summary', async (req, res) => {
  try {
    if (!req.session?.empId || req.session?.role !== 'admin') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { dateFrom, dateTo } = req.query;
    const matchStage = {};

    if (dateFrom || dateTo) {
      matchStage.acceptedAt = {};
      if (dateFrom) matchStage.acceptedAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.acceptedAt.$lte = new Date(dateTo);
    }

    const summary = await EmployeeAcceptance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$employeeId',
          employeeName: { $first: '$employeeInfo.firstName' },
          employeeLastName: { $first: '$employeeInfo.lastName' },
          employeeEmail: { $first: '$employeeInfo.email' },
          totalAcceptances: { $sum: 1 },
          totalEarnings: { $sum: '$scheduleInfo.price' },
          acceptedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          lastAcceptanceDate: { $max: '$acceptedAt' },
          acceptanceTypes: { $push: '$acceptanceType' }
        }
      },
      { $sort: { totalAcceptances: -1 } }
    ]);

    res.json({
      total: summary.length,
      summary
    });
  } catch (err) {
    console.error('❌ Error obteniendo resumen de aceptaciones:', err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// Obtener aceptaciones por fecha
app.get('/api/admin/acceptances-by-date', async (req, res) => {
  try {
    if (!req.session?.empId || req.session?.role !== 'admin') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { dateFrom, dateTo } = req.query;
    const matchStage = {};

    if (dateFrom || dateTo) {
      matchStage.acceptedAt = {};
      if (dateFrom) matchStage.acceptedAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.acceptedAt.$lte = new Date(dateTo);
    }

    const byDate = await EmployeeAcceptance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$acceptedAt' }
          },
          count: { $sum: 1 },
          totalEarnings: { $sum: '$scheduleInfo.price' },
          acceptanceTypes: { $push: '$acceptanceType' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      total: byDate.length,
      byDate
    });
  } catch (err) {
    console.error('❌ Error obteniendo aceptaciones por fecha:', err);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// Marcar aceptación como completada
app.post('/api/admin/acceptances/:acceptanceId/complete', async (req, res) => {
  try {
    if (!req.session?.empId || req.session?.role !== 'admin') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { acceptanceId } = req.params;
    const { notes } = req.body;

    const acceptance = await EmployeeAcceptance.findByIdAndUpdate(
      acceptanceId,
      {
        status: 'completed',
        completedAt: new Date(),
        ...(notes && { notes })
      },
      { new: true }
    );

    if (!acceptance) {
      return res.status(404).json({ error: 'Aceptación no encontrada' });
    }

    res.json({ success: true, acceptance });
  } catch (err) {
    console.error('❌ Error completando aceptación:', err);
    res.status(500).json({ error: 'Error al completar aceptación' });
  }
});

// Cancelar aceptación
app.post('/api/admin/acceptances/:acceptanceId/cancel', async (req, res) => {
  try {
    if (!req.session?.empId || req.session?.role !== 'admin') {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { acceptanceId } = req.params;
    const { notes } = req.body;

    const acceptance = await EmployeeAcceptance.findByIdAndUpdate(
      acceptanceId,
      {
        status: 'cancelled',
        ...(notes && { notes })
      },
      { new: true }
    );

    if (!acceptance) {
      return res.status(404).json({ error: 'Aceptación no encontrada' });
    }

    res.json({ success: true, acceptance });
  } catch (err) {
    console.error('❌ Error cancelando aceptación:', err);
    res.status(500).json({ error: 'Error al cancelar aceptación' });
  }
});

// === UPDATE EMPLOYEE LOCATION (Every minute) ===
app.post('/update-employee-location', async (req, res) => {
  const { scheduleId, location } = req.body;
  if (!req.session?.empId) return res.status(401).json({ error: 'No autorizado' });

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[${new Date().toLocaleTimeString()}] TIMEOUT ubicacion: ${scheduleId}`);
      res.status(408).json({ error: 'Timeout' });
    }
  }, 5000);

  try {
    const employeeAcceptance = await EmployeeAcceptance.findOne({
      scheduleId: scheduleId,
      employeeId: req.session.empId
    });

    if (!employeeAcceptance) {
      clearTimeout(timeout);
      return res.status(404).json({ error: 'No encontrado' });
    }

    if (location && location.latitude && location.longitude) {
      if (location.latitude < -90 || location.latitude > 90 || 
          location.longitude < -180 || location.longitude > 180) {
        clearTimeout(timeout);
        return res.status(400).json({ error: 'Coordenadas invalidas' });
      }

      // Log accuracy quality
      const accuracy = location.accuracy || 0;
      const accuracyQuality = accuracy <= 10 ? '🟢 EXCELENTE' : 
                             accuracy <= 25 ? '🟡 BUENA' : 
                             accuracy <= 50 ? '🟠 ACEPTABLE' : '🔴 BAJA';

      console.log(`📍 [${scheduleId}] Ubicación recibida: ${accuracyQuality} (±${accuracy.toFixed(2)}m) | Método: ${location.method || 'GPS'}`);

      employeeAcceptance.employeeUbication = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        altitude: location.altitude || null,
        heading: location.heading || null,
        speed: location.speed || null,
        samples: location.samples || 1,
        method: location.method || 'GPS',
        timestamp: new Date(),
        locationHistory: employeeAcceptance.employeeUbication?.locationHistory || []
      };

      employeeAcceptance.employeeUbication.locationHistory.push({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 0,
        altitude: location.altitude || null,
        timestamp: new Date(),
        method: location.method || 'GPS'
      });

      if (employeeAcceptance.employeeUbication.locationHistory.length > 100) {
        employeeAcceptance.employeeUbication.locationHistory = 
          employeeAcceptance.employeeUbication.locationHistory.slice(-100);
      }

      const updateResult = await Schedule.findByIdAndUpdate(
        scheduleId,
        {
          $set: {
            employeeLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy || 0,
              altitude: location.altitude || null,
              method: location.method || 'GPS',
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );

      // Socket.IO eliminado - La ubicación se consulta con un botón refresh en el cliente
    }

    await employeeAcceptance.save();
    
    clearTimeout(timeout);
    console.log(`[${new Date().toLocaleTimeString()}] UPDATE ${scheduleId}`);
    
    res.json({ 
      success: true,
      details: {
        historyCount: employeeAcceptance.employeeUbication?.locationHistory?.length || 0
      }
    });

  } catch (err) {
    clearTimeout(timeout);
    console.error(`[${new Date().toLocaleTimeString()}] ERROR ${scheduleId}: ${err.message}`);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al actualizar' });
    }
  }
});

// === GET COORDINATES FROM ADDRESS (Geocoding) ===

// === GET CURRENT EMPLOYEE LOCATION FROM MONGODB ===
app.get('/api/employee-location/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  if (!req.session?.empId) return res.status(401).json({ error: 'No autorizado' });

  try {
    const employeeAcceptance = await EmployeeAcceptance.findOne({
      scheduleId: scheduleId,
      employeeId: req.session.empId
    }).select('employeeUbication').lean();

    if (!employeeAcceptance || !employeeAcceptance.employeeUbication) {
      return res.status(404).json({ 
        error: 'No se encontró ubicación',
        code: 'NO_LOCATION'
      });
    }

    res.json({
      success: true,
      location: employeeAcceptance.employeeUbication,
      lastUpdate: employeeAcceptance.employeeUbication.timestamp
    });
  } catch (err) {
    console.error('❌ Error obteniendo ubicación:', err);
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
});

app.post('/api/geocode', async (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: 'Dirección requerida' });
  }

  try {
    // Using OpenStreetMap Nominatim (free, no API key required)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?address=${encodeURIComponent(address)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'Luber-App' }
    });

    if (!response.ok) {
      throw new Error('Nominatim API error');
    }

    const results = await response.json();
    
    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontró la dirección',
        code: 'ADDRESS_NOT_FOUND'
      });
    }

    const location = results[0];
    res.json({
      success: true,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      displayName: location.display_name,
      boundingBox: location.boundingbox
    });
  } catch (err) {
    console.error('❌ Error en geocoding:', err);
    res.status(500).json({ 
      error: 'Error al geocodificar la dirección',
      details: err.message
    });
  }
});

// === LOGOUT ===
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/register');
});

// === HOME ===
app.get('/', (req, res) => res.redirect('/register'));

// === ERROR HANDLING ===
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).send('Algo salió mal');
});

// === START SERVER ===
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Servidor Luber corriendo en http://localhost:${PORT}`));
