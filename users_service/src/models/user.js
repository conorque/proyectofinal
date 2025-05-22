const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    
    identificacion: { type: String, required: true, unique: true }, // RUC o cédula del usuario
    nombres: { type: String, required: true }, // Nombre 
    apellidos: { type: String, required: true }, //apellido
    edad: { type: Number, required: true },
    cargo: { type: String },  
});

module.exports = mongoose.model('User', userSchema);
