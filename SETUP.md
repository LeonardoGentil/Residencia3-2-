# Guia de Instalação e Execução — Filazero MCP Server

## Pré-requisitos

Você vai precisar instalar:

1. [Node.js 20+](#1-instalar-nodejs)
2. [Docker + Docker Compose](#2-instalar-docker)
3. [Git](#3-instalar-git) *(opcional, para clonar)*

---

## 1. Instalar Node.js

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Mac
```bash
brew install node@20
```

### Windows
Baixe o instalador em: https://nodejs.org/en/download  
Escolha a versão **LTS (20.x)**.

**Verificar instalação:**
```bash
node --version   # deve mostrar v20.x.x
npm --version    # deve mostrar 10.x.x
```

---

## 2. Instalar Docker

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### Mac
Baixe o **Docker Desktop**: https://www.docker.com/products/docker-desktop  
Instale e abra o aplicativo.

### Windows
Baixe o **Docker Desktop**: https://www.docker.com/products/docker-desktop  
Instale e abra o aplicativo. Requer WSL2 habilitado.

**Verificar instalação:**
```bash
docker --version         # deve mostrar Docker version 24.x ou superior
docker compose version   # deve mostrar Docker Compose version v2.x
```

---

## 3. Instalar Git

### Linux
```bash
sudo apt-get install -y git
```

### Mac
```bash
brew install git
```

### Windows
Baixe em: https://git-scm.com/download/win

---

## 4. Baixar o projeto

### Opção A — Git clone
```bash
git clone <url-do-repositorio>
cd filazero-mcp
```

### Opção B — Download manual
Baixe o ZIP do projeto, extraia e entre na pasta `filazero-mcp`.

---

## 5. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

O arquivo `.env` já vem configurado com os valores corretos para staging.  
Não é necessário alterar nada para rodar.

Conteúdo padrão:
```env
FILAZERO_API_URL=https://api.staging.filazero.net
FILAZERO_APP_ORIGIN=https://app.filazero.net
MCP_SERVER_PORT=3000
MCP_TRANSPORT=http
RATE_LIMIT_RPM=30
CACHE_TTL_COMPANIES=300
LOG_LEVEL=info
```

---

## 6. Rodar o projeto

### Opção A — Docker (recomendado)

```bash
docker compose up --build
```

Aguarde até ver a mensagem:
```
mcp-server-1 | {"level":"info","message":"Filazero MCP Server iniciado em modo HTTP na porta 3000"}
```

O servidor estará disponível em:
- MCP: `http://localhost:3000/mcp`
- Health: `http://localhost:3000/health`
- Nginx: `http://localhost:80`

Para parar:
```bash
docker compose down
```

---

### Opção B — Local (sem Docker)

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Rodar
npm start
```

---

## 7. Verificar se está funcionando

```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{"status":"ok","server":"filazero-mcp"}
```

---

## 8. Testar as tools com o MCP Inspector

O Inspector é uma interface visual para testar as tools sem precisar de um agente de IA.

### Abrir o Inspector

Em outro terminal (com o servidor já rodando):
```bash
npx @modelcontextprotocol/inspector
```

Acesse `http://localhost:5173` no navegador.

### Conectar ao servidor

1. **Transport Type:** selecione `Streamable HTTP`
2. **URL:** `http://localhost:3000/mcp`
3. Clique em **Connect**

### Testar as tools

Na aba **Tools**, clique em qualquer tool para testá-la.

**Exemplo — listar empresas:**
- Clique em `list_companies`
- Clique em **Run Tool** (sem preencher nada)
- Resultado: lista de empresas da plataforma

**Exemplo — ver serviços de uma empresa:**
- Clique em `get_company_services`
- Preencha: `slug` → `nome-da-empresa`
- Clique em **Run Tool**

---

## 9. Conectar ao Claude Desktop

Para usar as tools numa conversa com o Claude:

### Localizar o arquivo de configuração

- **Linux:** `~/.config/Claude/claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Adicionar o servidor MCP

```json
{
  "mcpServers": {
    "filazero": {
      "command": "node",
      "args": ["/caminho/absoluto/para/filazero-mcp/dist/index.js"]
    }
  }
}
```

Substitua `/caminho/absoluto/para/filazero-mcp` pelo caminho real no seu sistema.

> No Linux, para descobrir o caminho absoluto, entre na pasta do projeto e rode `pwd`.

### Exemplo Linux
```json
{
  "mcpServers": {
    "filazero": {
      "command": "node",
      "args": ["/home/leo/Documents/Faculdade/Residencia3 Tentativa 2/filazero-mcp/dist/index.js"]
    }
  }
}
```

Reinicie o Claude Desktop. O ícone de ferramentas aparecerá no chat e você poderá fazer agendamentos em linguagem natural.

---

## Estrutura do projeto

```
filazero-mcp/
├── src/
│   ├── index.ts                  # Entrypoint do servidor
│   ├── client/filazero.ts        # Cliente HTTP da API Filazero
│   ├── tools/                    # 8 tools MCP
│   │   ├── list-companies.ts
│   │   ├── get-company-services.ts
│   │   ├── get-available-dates.ts
│   │   ├── get-available-sessions.ts
│   │   ├── get-booking-form.ts
│   │   ├── schedule-appointment.ts
│   │   ├── check-ticket-status.ts
│   │   └── list-my-tickets.ts
│   ├── resources/                # 3 resources estáticos
│   ├── prompts/                  # 2 prompts guiados
│   ├── cache/                    # Cache em memória com TTL
│   ├── logger/                   # Logs JSON estruturados
│   └── types/                    # Tipos TypeScript
├── dist/                         # Código compilado (gerado pelo build)
├── Dockerfile                    # Build multistage
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Solução de problemas

**Porta 3000 em uso:**
```bash
kill $(lsof -t -i:3000)
docker compose up
```

**Porta 6277 em uso (Inspector):**
```bash
kill $(lsof -t -i:6277)
npx @modelcontextprotocol/inspector
```

**Erro de permissão no Docker (Linux):**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Recompilar após mudanças no código:**
```bash
npm run build
# ou com Docker:
docker compose up --build
```
