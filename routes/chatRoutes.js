const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const ChatConversation = require('../models/ChatConversation');
const Employee = require('../models/Employee');

// === 🛠️ Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// === 📦 Middleware multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === 📤 Subir imagen del chat
router.post('/upload-chat-image', upload.single('chatImage'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen.' });

  try {
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
  } catch (err) {
    console.error('❌ Error subiendo a Cloudinary:', err);
    res.status(500).json({ error: 'Error al subir imagen.' });
  }
});

// === 📋 Lista de empleados (para el panel admin)
router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find({}, 'firstName lastName _id').lean();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener empleados.' });
  }
});

// === 💬 Obtener conversación entre 2 participantes
router.get('/convo/:userId', async (req, res) => {
  try {
    const empId = req.session?.empId || req.query?.empId || req.params.userId;
    const otherId = req.params.userId;
    const participants = [empId, otherId].sort();
    const convo = await ChatConversation.findOne({ participants }).lean();
    res.json(convo?.messages || []);
  } catch (err) {
    console.error('❌ Error al obtener conversación:', err);
    res.status(500).json({ error: 'Error al obtener el chat.' });
  }
});

// === 📨 Enviar mensaje
router.post('/:userId/send', async (req, res) => {
  const { sender, text = '', imageUrl = '' } = req.body;
  const senderId = req.session?.empId || req.body?.from;
  const receiverId = req.params.userId;

  if (!sender || (!text && !imageUrl)) {
    return res.status(400).json({ error: 'Mensaje vacío o campos faltantes.' });
  }

  try {
    const participants = [senderId, receiverId].sort();

    let conversation = await ChatConversation.findOne({ participants });
    const message = {
      sender,
      text,
      imageUrl,
      at: new Date()
    };

    if (!conversation) {
      conversation = new ChatConversation({ participants, messages: [message] });
    } else {
      conversation.messages.push(message);
    }

    await conversation.save();
    res.json({ success: true, conversation });
  } catch (err) {
    console.error('❌ Error al enviar mensaje:', err);
    res.status(500).json({ error: 'Error al enviar el mensaje.' });
  }
});

// === 🗃️ Archivar conversación
router.post('/:userId/archive', async (req, res) => {
  try {
    const empId = req.session?.empId || req.body?.empId;
    const userId = req.params.userId;
    const participants = [empId, userId].sort();

    const updated = await ChatConversation.findOneAndUpdate(
      { participants },
      { archived: true },
      { new: true }
    );

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: 'Error al archivar conversación.' });
  }
});

module.exports = router;
