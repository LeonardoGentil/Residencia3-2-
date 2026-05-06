# Filazero MCP Server

Servidor MCP que conecta o Claude à API Filazero — agende atendimentos conversando com o assistente, sem abrir nenhum site.

Desenvolvido para a **Residência em Software III — Universidade Tiradentes (UNIT) 2026**.

---

## O que você vai precisar instalar

### 1. Node.js

**Windows**
Acesse [nodejs.org](https://nodejs.org), baixe a versão **LTS** e instale normalmente (clique em Next em tudo).

**Mac**
```bash
brew install node@20
```

**Linux (Ubuntu/Debian)**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Confirme a instalação:
```bash
node --version   # deve mostrar v20.x.x
npm --version    # deve mostrar 10.x.x
```

---

### 2. Docker Desktop

**Windows e Mac**
Acesse [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop), baixe e instale.

> No Windows, o instalador vai pedir para habilitar o WSL2 — aceite e reinicie o computador se solicitado.

**Linux (Ubuntu/Debian)**
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

Depois de instalar, **abra o Docker Desktop** e deixe rodando em segundo plano — ele precisa estar aberto para funcionar.

Confirme a instalação:
```bash
docker --version          # deve mostrar Docker version 24.x ou superior
docker compose version    # deve mostrar Docker Compose version v2.x
```

---

### 3. Git

**Windows**
Acesse [git-scm.com/downloads](https://git-scm.com/downloads), baixe e instale (clique em Next em tudo).

**Mac**
```bash
brew install git
```

**Linux**
```bash
sudo apt-get install -y git
```

Confirme:
```bash
git --version
```

---

## Baixando o projeto

Abra o terminal na pasta onde quer salvar o projeto e rode:

```bash
git clone https://github.com/LeonardoGentil/Residencia3-2-
cd Residencia3-2-
```

---

## Configurando o projeto

Esses comandos só precisam ser rodados **uma vez**:

```bash
npm install
npm run build
```

Agora crie o arquivo de configuração a partir do exemplo:

**Mac/Linux:**
```bash
cp .env.example .env
```

**Windows:**
```
copy .env.example .env
```

> O `.env` já vem com os valores corretos para rodar — não precisa alterar nada.

---

## Como usar

Escolha uma das duas opções:

---

### Opção A — Interface web (mais simples, requer Docker)

Sobe o servidor e a interface com um comando só:

```bash
docker compose up --build
```

Aguarde aparecer a mensagem:
```
mcp-server-1 | Filazero MCP Server iniciado em modo HTTP na porta 3000
```

Abra o navegador e acesse **http://localhost**.

Faça login com qualquer e-mail e senha (modo demo) e comece a usar.

**Para parar:**
```bash
docker compose down
```

**Para rodar de novo depois:**
```bash
docker compose up --build
```

---

### Opção B — Claude Desktop (sem navegador, sem Docker)

Com o Claude Desktop você conversa direto pelo app do Claude.

**1.** Instale o Claude Desktop em [claude.ai/download](https://claude.ai/download).

**2.** Com o projeto já configurado (passos acima), rode:
```bash
npm run setup
```

Esse comando configura o Claude Desktop automaticamente para encontrar o servidor.

**3.** Reinicie o Claude Desktop.

O ícone de ferramentas vai aparecer na caixa de texto — pronto, está funcionando.

---

## Verificando se está funcionando (Opção A)

Com o Docker rodando, abra outro terminal e rode:

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{"status":"ok","server":"filazero-mcp"}
```

---

## Solução de problemas

**Porta 3000 já em uso:**

Windows — abra o Gerenciador de Tarefas, encontre o processo usando a porta e encerre-o.

Mac/Linux:
```bash
kill $(lsof -t -i:3000)
```

**Erro de permissão no Docker (Linux):**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Docker Desktop não encontrado (Windows):** certifique-se de que o Docker Desktop está aberto e com o ícone aparecendo na bandeja do sistema (canto inferior direito).

**Recompilar após mudanças no código:**
```bash
npm run build
docker compose up --build
```

---

## Estrutura do projeto

```
Residencia3-2-/
├── src/
│   ├── index.ts                  # Entrypoint do servidor
│   ├── client/filazero.ts        # Cliente HTTP da API Filazero
│   ├── tools/                    # Tools MCP (login, agendamento, consulta)
│   ├── resources/                # Recursos estáticos (guias, categorias)
│   ├── prompts/                  # Prompts guiados de agendamento
│   ├── cache/                    # Cache em memória com TTL
│   ├── logger/                   # Logs JSON estruturados
│   └── types/                    # Tipos TypeScript
├── frontend/                     # Interface web (servida via Docker)
├── dist/                         # Código compilado (gerado pelo npm run build)
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```
