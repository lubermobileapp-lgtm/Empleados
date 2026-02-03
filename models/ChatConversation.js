const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'customer' o 'office'
  text: String,
  imageUrl: String,
  at: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  participants: { type: [String], required: true, index: true }, // [employeeId, adminId]
  messages: [messageSchema],
  archived: { type: Boolean, default: false }
}, { timestamps: true });

chatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('ChatConversation', chatSchema);
