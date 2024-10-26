const mongoose = require('mongoose');

// Definir um schema para as faixas, se necessário
const InstrumentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
    index: { type: Number, required: true },
});

const NoteSchema = new mongoose.Schema({
    noteName: { type: String, required: true },  // The note pitch, e.g., "C4", "G#3"
    startTime: { type: Number, required: true },  // The start time of the note in seconds or beats
    duration: { type: Number, required: true },  // Duration of the note in seconds or beats
});

const TrackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    startTime: { type: Number, required: true },
    duration: { type: Number, required: true },  // Duration of the track in seconds or beats
    instrumentIndex: { type: Number, required: true },  // Refers to the instrument index
    volume: { type: Number, default: 100 },  // Track volume as a percentage
    notes: { type: [NoteSchema], default: [] },  // Array of notes in this track
});

// Definir o schema do projeto
const ProjectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    bpm: { type: Number, default: 130 },
    instruments: { type: [InstrumentSchema], required: true },  // Instrument definition
    tracks: { type: [TrackSchema], default: [] },  // Track definition, now with notes
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', ProjectSchema);