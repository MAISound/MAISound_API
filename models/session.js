const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const SessionSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Session', SessionSchema);