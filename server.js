const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth')
// const chatRoutes = require('./routes/chat')

// Configuração do app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Conexão com o MongoDB

mongoose.connect(process.env.DB_KEY, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB conectado'))
    .catch((err) => console.log(err));

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// Usar rotas de autenticação
app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);
