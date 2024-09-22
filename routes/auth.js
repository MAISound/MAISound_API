const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;
const User = require('../models/user');
const Session = require('../models/session');
const Project = require('../models/project')
const router = express.Router();



// EXEMPLO:
router.get('/exemplo', async (req, res) => {
    const userId = getUserByToken(req);

    if (!userId) {
        return res.status(500).json({ message: 'Usuário inválido' });
    }

    // Faz alguma coisa com o ID do usuario
    // :)

    return res.status(201).json({ message: 'Sucesso' });
})


// Salvando o projeto no banco de dados:
router.post("/project", async (req, res) => {
    const { name, bpm, instruments, tracks} = req.body;

    const userId = getUserByToken(req);

    // Verifica o usuário
    if (!userId) {
        return res.status(500).json({ message: 'Usuário inválido' });
    }

    try {
        // Criar um novo projeto
        const newProject = new Project({
            name,
            bpm,
            instruments,
            tracks
        });

        await newProject.save();

    } catch (err) {
        return res.status(500).json({
            message: "Erro ao criar o projeto", err
        });
    }

    return res.status(201).json({message: 'Projeto criado com sucesso'})
})

//========================================
//         V CONTINUAR ABAIXO V
//========================================
// Salvando no projeto
router.put('/saveProject', async (req, res) => {
    const { name, bpm, instruments, tracks} = req.body;

    const userId = getUserByToken(req);

    if (!userId) {
        return res.status(500).json({ message: 'Usuário inválido' });
    }

    // Faz alguma coisa com o ID do usuario
    // :)

    return res.status(201).json({ message: 'Sucesso' });

})





// ==========================================
//              AUTENTICAÇÃO
// ==========================================
const newSession = async (userId) => {

    const session = new Session({
        userId: userId,
        token: uuidv4()
    });

    await session.save();

    return session.token;
}

const getUserByToken = async (req) => {
    const token = req?.cookies["session"]

    // Caso o token não exista ou seja invalido retorne null
    if (!token) {
        return null;
    }

    // Procura pelo token no banco de dados
    try {
        // Busca sessão relacionada a este token
        const session = await Session.findOne({ token: token })

        // Busca usuario relacionado a esta sessão
        const user = await User.findOne({ _id: session.userId })

        // Retorna o ID do usuario
        return user._id;
    } catch (e) { }

    // Caso tenha dado algum erro na parte superior retorne nulo
    return null;
}

// Autoriza token
router.get('/', async (req, res) => {

    const token = await getUserByToken(req);

    if (token) {
        return res.status(201).json({ message: 'Usuário autenticado com sucesso' });
    }

    return res.status(500).json({ message: 'Não foi possivel validar token do usuário' });
})

// Registro
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Verificar se o usuário já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já está registrado' });
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar um novo usuário
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        // Criar sessão para o novo usuário
        const token = await newSession(newUser._id);

        // Definir o token como cookie e retornar sucesso
        res.cookie('session', token, { httpOnly: true });
        return res.status(201).json({ message: 'Usuário criado com sucesso', session: token });
    } catch (err) {
        return res.status(500).json({
            message: 'Erro ao registrar usuário', err
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar se o usuário existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        // Verificar a senha
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        // const token = jwt.sign({ id: user._id }, 'segredo', { expiresIn: '1h' });

        // Criar sessão para o novo usuário
        const token = await newSession(user._id);

        // Definir o token como cookie e retornar sucesso
        res.cookie('session', token, { httpOnly: true });

        return res.json({ session: token, user: { id: user._id, name: user.name, email: user.email }, message: "Usuário fez login com êxito" });
    } catch (err) {
        return res.status(500).json({ message: 'Erro ao fazer login', err });
    }
});

module.exports = router;
