
// Definir o schema do chat
const ChatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    messages: [
        {
            type: { type: String, required: true }, // 'Robot' ou 'User'
            message: { type: String, required: true } // 'Olá! Eu sou a MAI...'
        }
    ],
});

module.exports = mongoose.model('Chat', ChatSchema);