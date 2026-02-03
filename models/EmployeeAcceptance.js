// filepath: /f:/Luber Official/Empleados/Registro/models/EmployeeAcceptance.js
const mongoose = require('mongoose');

const employeeAcceptanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true
  },
  // Employee Information at time of acceptance
  employeeInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    state: String
  },
  // Schedule Information
  scheduleInfo: {
    date: String,
    time: String,
    customerName: String,
    customerType: String,
    vehicleType: String,
    price: Number,
    location: String,
    pickupAddress: String,
    dropoffAddress: String,
    stopOrder: Number // For route planner
  },
  // Acceptance Details
  acceptedAt: {
    type: Date,
    default: Date.now
  },
  acceptanceType: {
    type: String,
    enum: ['single', 'multiple', 'route-planner'],
    default: 'single'
  },
  status: {
    type: String,
    enum: ['accepted', 'completed', 'cancelled', 'no-show'],
    default: 'accepted'
  },
  completedAt: Date,
  notes: String,
  // IP address and user agent for audit trail
  ipAddress: String,
  userAgent: String,
  // Employee location tracking
  employeeUbication: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date,
    locationHistory: [{
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    }]
  }
}, { timestamps: true });

// Index for faster queries
employeeAcceptanceSchema.index({ employeeId: 1, createdAt: -1 });
employeeAcceptanceSchema.index({ scheduleId: 1 });
employeeAcceptanceSchema.index({ 'scheduleInfo.date': 1 });
employeeAcceptanceSchema.index({ acceptedAt: -1 });

module.exports = mongoose.model('EmployeeAcceptance', employeeAcceptanceSchema);
