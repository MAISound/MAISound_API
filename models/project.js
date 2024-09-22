const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {type: String, required: true},
    bpm: {type: Number, default: 130},
    instruments: {type: Object},
    tracks: {type: Object}
});

module.exports = mongoose.model('Project', ProjectSchema);