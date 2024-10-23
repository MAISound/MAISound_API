# MAISound_API

Esta é uma API desenvolvida em Node.js que se conecta ao MongoDB para gerenciar dados e com o APP flutter.

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução para JavaScript no servidor.
- **Express**: Framework minimalista para construção de APIs.

## Instruções para Rodar a API

1. **Clone o Repositório**:
   ```bash
   git clone https://github.com/seu-usuario/MAISound_API.git
   cd MAISound_API

2. **Execute o programa**
   ```bash
   node server.js

## Manual

`GET "/"`

```json
{ 
   "message": "Usuário autenticado com sucesso" 
}
```

`GET "/users/"`

Retorna uma lista de usuários.
Provavelmente será removido no futuro.

`POST "/register"`

```json
{ 
   "name": "Teste" ,
   "email": "teste@teste.com",
   "password": "123456"
}
```

RESPONSE

```json
{
  "message": "Usuário criado com sucesso", 
  "session": "token"
}
```

`POST "/login"`

```json
{ 
   "email": "teste@teste.com",
   "password": "123456"
}
```

RESPONSE

```json
{ 
   "session": "token", 
   "user": { 
      "id": "123456", 
      "name": "teste", 
      "email": "teste@teste.com" 
      }, 
   "message": "Usuário fez login com êxito" 
}
```

`DELETE "/user/:id"`

PRECISAMOS MUDAR ISSO AQUI URGENTEMENTE!!!

```json
{ 
   "id": "123",
}
```

RESPONSE

```json
{ 
   "message": "Usuário deletado com sucesso"
}
```

