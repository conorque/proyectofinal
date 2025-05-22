const mongoose = require('mongoose');
const { Schema } = mongoose;

const assignedUserSchema = new Schema({
  id:            { type: String, required: true },
  identificacion:{ type: String },
  nombres:       { type: String },
  apellidos:     { type: String },
  edad:          { type: Number },
  cargo:         { type: String },
}, { _id: false });

const taskSchema = new Schema({
  taskcode:   { type: String, required: true, unique: true },
  title:      { type: String, required: true },
  description:{ type: String },
  acceptance: { type: String },
  startDate:  { type: Date,   required: true },
  endDate:    { type: Date,   required: true },
  devTime:    { type: Number, required: true },
  state:      { 
    type: String, 
    enum: ['Backlog','Doing','In Review','Done'], 
    default: 'Backlog'
  },
  assignedUser: {
    type: assignedUserSchema,
    default: null
  }
}, {
  versionKey: false,
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
