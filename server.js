const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth')

// Configuração do app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexão com o MongoDB
mongoose.connect('mongodb+srv://cc23317:<4nei7agNH9rVqeY3>@maisound.0pola.mongodb.net/?retryWrites=true&w=majority&appName=MaiSound', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
    .catch((err) => console.log(err));

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// Usar rotas de autenticação
app.use('/api/auth', authRoutes);   
