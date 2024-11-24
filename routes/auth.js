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

const basePrompt = `
You're MAI, an AI dedicated to helpíng people create songs. You're a chat interface located at the right side of the music software MAISound.
In this program users can create tracks, play them, loop them and edit individual notes. Speak the language the user is speaking.
Talk briefly and be concise and precise, don't stray from the original topic, it should be about music and the software itself.\n
`

// Enviando mensagem para a IA
router.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    const userId = getUserByToken(req);

    if (!userId) {
        return res.status(500).json({ message: 'Usuário inválido' });
    }

    const result = await model.generateContent([basePrompt + prompt]);

    return res.status(200).json({ message: 'Sucesso', response: result.response.text() });
})

// ==========================================
//              PROJETO
// ==========================================

// Salvando o projeto no banco de dados:
router.post("/project", async (req, res) => {
    const { name, bpm, instruments, tracks } = req.body;
    const userId = await getUserByToken(req);

    // Verifica o usuário
    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {
        // Criar um novo projeto
        const newProject = new Project({
            name: name,
            userId: userId,
        });

        await newProject.save();
        return res.status(201).json({message: 'Projeto criado com sucesso'})
    } catch (err) {
        return res.status(500).json({
            message: "Erro ao criar o projeto", err
        });
    }
});

// Recebendo tudo de um projeto
router.get("/project/:id", async (req, res) => {
    const userId = await getUserByToken(req);
    const projectId = req.params.id;

    // Verifica o usuário
    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {
        // Tenta deletar o projeto pelo ID e userId
        const project = await Project.findOne({ _id: projectId, userId: userId });

        if (!project) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        // Retorna o projeto encontrado
        return res.status(200).json({ 
            message: 'Projeto encontrado com sucesso',
            project: project // Retorna o projeto aqui
        });
    } catch (err) {
        return res.status(500).json({
            message: "Erro ao procurar o projeto", error: err.message
        });
    }
});

// Recebendo APENAS NOME e ID dos projetos
router.get("/project", async (req, res) => {
    const userId = await getUserByToken(req);

    // Verifica o usuário
    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {

        // Busca projetos
        const projects = await Project.find({ userId: userId });

        // Extrai apenas os nomes dos projetos e seus IDs
        const projectList = projects.map(project => ({
            id: project._id,
            name: project.name
        }));

        return res.status(200).json({ 
            message: 'Projetos encontrados', 
            projects: projectList 
        });
    } catch (err) {
        return res.status(404).json({
            message: "Não foi possivel buscar por projetos", err
        });
    }
});

// Deletando um projeto
router.delete("/project/:id", async (req, res) => {
    const userId = await getUserByToken(req);
    const projectId = req.params.id;

    // Verifica o usuário
    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {
        // Tenta deletar o projeto pelo ID e userId
        const deletedProject = await Project.findOneAndDelete({ _id: projectId, userId: userId });

        if (!deletedProject) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        return res.status(200).json({ message: 'Projeto deletado com sucesso' });
    } catch (err) {
        return res.status(500).json({
            message: "Erro ao tentar deletar o projeto", error: err.message
        });
    }
});

// Atualizando um projeto no banco de dados
router.put("/project/:id", async (req, res) => {
    const projectId = req.params.id;
    const { name, bpm, instruments, tracks } = req.body;
    const userId = await getUserByToken(req);

    // Verifica o usuário
    if (!userId) {
        return res.status(401).json({ message: 'Usuário inválido' });
    }

    try {
        // Tenta encontrar e atualizar o projeto
        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, userId: userId },
            { name, bpm, instruments, tracks },
            { new: true } // Retorna o documento atualizado
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Projeto não encontrado' });
        }

        return res.status(200).json({ message: 'Projeto atualizado com sucesso', project: updatedProject });
    } catch (err) {
        return res.status(500).json({
            message: "Erro ao atualizar o projeto",
            error: err.message,
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
    // RETORNA UM TOKEN PADRAO POR ENQUANTO
    console.log("ALERTA: ESTAMOS RETORNANDO UM TOKEN PADRÃO POR ENQUANTO!!!")
    const token = "947d9e68-de2f-42c0-890b-d38a57106fc3"

    //const token = req?.cookies["session"]

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
        
    // Definir o token como cookie e retornar sucesso
    res.cookie('session', token, { httpOnly: true });
        return res.status(201).json({ message: 'Usuário autenticado com sucesso', token: token });
    }


    return res.status(500).json({ message: 'Não foi possivel validar token do usuário' });
})

// Logout
router.post('/logout', async (req, res) => {
    try {
        // Recuperar o token da sessão no cookie
        const token = req.cookies.session;

        if (!token) {
            return res.status(400).json({ message: 'Nenhuma sessão ativa encontrada' });
        }

        // Remover a sessão do banco de dados ou cache
        const sessionRemoved = await removeSession(token);
        if (!sessionRemoved) {
            return res.status(400).json({ message: 'Erro ao encerrar a sessão' });
        }

        // Limpar o cookie de sessão
        res.clearCookie('session', { httpOnly: true });

        return res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (err) {
        return res.status(500).json({ message: 'Erro ao fazer logout', err });
    }
});

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

// Buscar usuário
router.get('/user', async (req, res) => {
    const userId = await getUserByToken(req);

    if (!userId) {
        return res.status(500).json({ message: 'Usuário inválido' });
    }

    try {
        const user = await User.findById(userId);
        return res.status(200).json({ message: 'Usuário encontrado com sucesso', user: user });
    } catch (err) {
        return res.status(500).json({ message: 'Erro ao buscar usuário', err });
    }    
});

module.exports = router;