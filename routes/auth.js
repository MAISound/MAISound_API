const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid').v4;
const User = require('../models/user');
const Session = require('../models/session');
const Project = require('../models/project')
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Instancia a IA Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// ==========================================
//                 IA
// ==========================================

// Enviando mensagem para a IA
router.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    const userId = getUserByToken(req);

    if (!userId) {
        return res.status(500).json({ message: 'Usuário inválido' });
    }

    const result = await model.generateContent([prompt]);

    // Faz alguma coisa com o ID do usuario
    // :)

    return res.status(201).json({ message: 'Sucesso', response: result.response.text() });
})

// ==========================================
//              PROJETO
// ==========================================

// Salvando o projeto no banco de dados:
router.post("/project", async (req, res) => {
    const { name, bpm, instruments, tracks } = req.body;
    const userId = getUserByToken(req);

    // Verifica o usuário
    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {
        // Criar um novo projeto
        const newProject = new Project({
            name,
            bpm,
            instruments,
            tracks,
            userId
        });

        await newProject.save();
        return res.status(201).json({message: 'Projeto criado com sucesso'})
    } catch (err) {
        return res.status(500).json({
            message: "Erro ao criar o projeto", err
        });
    }
});

// Atualizando um projeto existente
router.put('/project', async (req, res) => {
    const { id, name, bpm, instruments, tracks } = req.body;
    const userId = await getUserByToken(req);

    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {
        // Verifica se o projeto existe
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        // Verifica se o usuário é o dono do projeto
        if (project.userId !== userId) {
            return res.status(401).json({ message: 'Usuário não autorizado' });
        }

        // Atualiza o projeto
        project.name = name || project.name;
        project.bpm = bpm || project.bpm;
        project.instruments = instruments || project.instruments;
        project.tracks = tracks || project.tracks;

        await project.save(); // Salva as alterações
        return res.status(200).json({ message: 'Projeto atualizado com sucesso', project});
    } catch (err) {
        return res.status(500).json({
            message: "Erro ao atualizar o projeto", err
        });
    }
});

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

// Deletar usuário
router.delete('/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar usuário', err });
    }
});

// Listar todos os usuários
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username email'); // Seleciona apenas o username e email
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar usuários', err });
    }
});

module.exports = router;