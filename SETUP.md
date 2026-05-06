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
ALLOW_HTTP_LOGIN=false
```

> **Observação sobre `RATE_LIMIT_RPM`:** o limite é mantido em memória pelo processo. Se você rodar várias réplicas (ex.: nginx balanceando entre N containers), cada réplica conta separadamente — para um limite global você precisaria de Redis. Em ambiente de demo/residência, uma réplica só é o suficiente.

> **Observação sobre `ALLOW_HTTP_LOGIN`:** a tool `login` aceita e-mail e senha. Em modo `stdio` (Claude Desktop local) a senha nunca sai da máquina. Em modo `http`, a senha trafega entre cliente e servidor — por isso o login é bloqueado por padrão. Só ative `ALLOW_HTTP_LOGIN=true` se você for o operador da rede e souber o que está fazendo.

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

**Exemplo — autenticar para agendar:**
- Clique em `login`
- Preencha: `email` e `password` da conta no Filazero
- Clique em **Run Tool**
- Copie o `access_token` da resposta para usar como `token` em `schedule_appointment` ou `list_my_tickets`

> Em modo HTTP (que é o padrão do `docker-compose`) o login fica bloqueado. Para testar o `login`, rode em modo stdio:
> ```bash
> MCP_TRANSPORT=stdio npm start
> ```
> ou ative explicitamente: `ALLOW_HTTP_LOGIN=true`.

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

## 10. Front web (opcional)

Além do Claude Desktop e do MCP Inspector, o repositório inclui um cliente web próprio em `web/` — uma SPA React/Vite que conversa com o MCP usando uma IA gratuita escolhida pelo usuário (Groq, OpenRouter, Cerebras ou Google Gemini).

### Subir o front (modo dev)

Em outro terminal (com o servidor MCP já rodando):

```bash
cd web
npm install
npm run dev
```

Acesse `http://localhost:5173`.

### Subir o front via Docker (junto do resto)

O `docker-compose.yml` já inclui o serviço `web` que builda e serve o front em **`http://localhost:8080`**:

```bash
docker compose up --build
```

Sobe os 3 containers (mcp-server, nginx, web). O nginx do container `web` faz proxy de `/mcp` pro `mcp-server`, então a URL padrão `http://localhost:3000/mcp` funciona normalmente — ou troca pra `http://localhost:8080/mcp` se preferir tudo num host só.

### Usar

1. Na barra lateral, escolha um **provider de IA**.
2. Clique em **"obter chave grátis"** (link abre o site do provider) e gere uma chave.
3. Cole a chave no campo da barra lateral. Ela fica salva no `localStorage` do navegador — não é enviada pra ninguém.
4. Verifique se a **bolinha verde** está acesa em "Conexão MCP" (significa conectado).
5. Digite uma pergunta no chat, ex.: "liste as empresas disponíveis".

A IA decide automaticamente quais tools chamar e mostra cada chamada em tempo real (clique no card pra ver os argumentos e o resultado).

### Providers suportados

| Provider | Free tier | Modelos sugeridos |
|---|---|---|
| Groq | grátis, rápido | Llama 3.3 70B, Llama 3.1 8B Instant |
| OpenRouter | grátis com `:free` | DeepSeek V3, Qwen 2.5, Llama 3.3 |
| Cerebras | grátis | Llama 3.3 70B |
| Google Gemini | grátis (15 RPM) | Gemini 2.0 Flash |

Adicionar provider novo é editar `web/src/lib/providers.ts`.

### Build de produção

```bash
cd web && npm run build
```

Saída em `web/dist/` — pode servir com qualquer static host (nginx, Vercel, etc.).

---

## Estrutura do projeto

```
filazero-mcp/
├── src/
│   ├── index.ts                  # Entrypoint do servidor
│   ├── client/filazero.ts        # Cliente HTTP da API Filazero
│   ├── tools/                    # 9 tools MCP
│   │   ├── login.ts
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
├── tsconfig.json
└── web/                          # Front web opcional (Vite + React + Tailwind)
    ├── src/
    │   ├── App.tsx
    │   ├── components/           # Sidebar, Chat, ToolCallCard, etc.
    │   └── lib/                  # mcpClient, llmClient, chatLoop, providers
    ├── package.json
    └── vite.config.ts
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
