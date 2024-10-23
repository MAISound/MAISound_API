const mongoose = require('mongoose');

// Definir um schema para as faixas, se necessário
const TrackSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: Number, required: true }, // Duração em segundos
    // Adicione outros campos nescessário para cada faixa
})

// Definir o schema do projeto
const ProjectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: {type: String, required: true},
    bpm: {type: Number, default: 130},
    instruments: {type: [String], required: true},
    tracks: {type: [TrackSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', ProjectSchema);