# Filazero MCP Server

Servidor MCP para a API Filazero — permite que agentes de IA agendem atendimentos e consultem tickets sem filas presenciais.

Desenvolvido para a **Residência em Software III — Universidade Tiradentes (UNIT) 2026**.

---

## O que é isso?

Este projeto é um **servidor MCP (Model Context Protocol)** que conecta o Claude (e outros agentes de IA) à API do Filazero. Com ele, você consegue agendar atendimentos, consultar horários e verificar tickets apenas conversando com o Claude Desktop — sem abrir nenhum site ou app.

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org) **20 ou superior**
  - Para verificar: `node -v`
- [Git](https://git-scm.com) (para clonar o repositório)
- [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose *(opcional — apenas se quiser rodar com containers)*
- [Claude Desktop](https://claude.ai/download) *(necessário para integrar o MCP ao Claude)*

---

## Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repo>
cd filazero-mcp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente *(opcional)*

O servidor já funciona sem nenhum `.env` — os valores padrão apontam para o ambiente de staging do Filazero.

Se quiser personalizar, copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Abra o `.env` e ajuste as variáveis conforme necessário. Veja a [tabela de variáveis](#variáveis-de-ambiente) abaixo.

### 4. Compile o projeto

```bash
npm run build
```

Isso gera a pasta `dist/` com os arquivos JavaScript compilados.

### 5. Instale globalmente *(necessário para integrar ao Claude Desktop)*

```bash
npm install -g .
```

Isso registra o comando `filazero-mcp` no seu sistema, tornando-o acessível de qualquer lugar.

Para verificar se funcionou:

```bash
filazero-mcp --version
# ou
which filazero-mcp   # macOS/Linux
where filazero-mcp   # Windows
```

---

## Como rodar localmente (sem Docker)

Após a instalação, você tem três formas de rodar o servidor:

**Modo produção** (usando o build compilado):
```bash
npm start
```

**Modo desenvolvimento** (sem precisar compilar — ideal para mexer no código):
```bash
npm run dev
```

**Demo interativa** (chat no terminal usando Groq/Gemini):
```bash
# Adicione sua chave no .env: GROQ_API_KEY=sua_chave_aqui
npm run demo
```

---

## Como rodar com Docker

Se preferir usar containers:

```bash
# Sobe o servidor + proxy nginx
docker compose up --build
```

O servidor ficará disponível em:
- MCP: `http://localhost:3000/mcp`
- Health check: `http://localhost:3000/health`
- Proxy Nginx: `http://localhost:80`

Para parar:
```bash
docker compose down
```

---

## Testando com o MCP Inspector

O MCP Inspector é uma interface web para testar as tools do servidor antes de conectar ao Claude Desktop.

Com o servidor rodando em modo HTTP (`MCP_TRANSPORT=http` no `.env`), execute:

```bash
npx @modelcontextprotocol/inspector --transport streamable-http http://localhost:3000/mcp
```

Acesse `http://localhost:5173` no navegador. Você verá todas as tools disponíveis e poderá testá-las manualmente.

> **Atenção:** o endpoint MCP é `/mcp`, não `/`. Usar `http://localhost:3000` sem o path causará erro `Cannot POST /`.

---

## Como conectar ao Claude Desktop

Esta é a parte principal — depois de configurar, você fala com o Claude normalmente e ele já consegue agendar atendimentos para você.

### Passo 1 — Garanta que o build está feito e instalado globalmente

```bash
npm run build
npm install -g .
```

### Passo 2 — Abra o arquivo de configuração do Claude Desktop

Localize e abra o arquivo `claude_desktop_config.json` conforme seu sistema:

| Sistema | Caminho |
|---------|---------|
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

**No Windows**, abra o Explorador de Arquivos, cole `%APPDATA%\Claude` na barra de endereço e pressione Enter. Se a pasta ou o arquivo não existir, crie-o.

**Dica rápida no terminal:**
```bash
# Windows (PowerShell)
code "$env:APPDATA\Claude\claude_desktop_config.json"

# macOS/Linux
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Passo 3 — Adicione a configuração do servidor

Cole o conteúdo abaixo no arquivo (substitua se já houver algo):

**Windows:**
```json
{
  "mcpServers": {
    "filazero-mcp": {
      "command": "cmd",
      "args": ["/c", "filazero-mcp"]
    }
  }
}
```

**macOS / Linux:**
```json
{
  "mcpServers": {
    "filazero-mcp": {
      "command": "filazero-mcp"
    }
  }
}
```

> No Windows o `cmd /c` é obrigatório porque o Claude Desktop não herda o PATH do npm automaticamente.

Se você já tem outros servidores MCP configurados, adicione apenas o bloco `"filazero-mcp"` dentro do objeto `"mcpServers"` existente.

### Passo 4 — Reinicie o Claude Desktop

Feche completamente o Claude Desktop (inclusive da bandeja do sistema) e abra novamente.

### Passo 5 — Verifique se funcionou

Na caixa de texto do Claude Desktop, deve aparecer um **ícone de ferramentas (🔨)**. Clique nele para ver as tools do Filazero listadas. Se aparecer, está tudo certo!

> O Claude Desktop inicia o servidor automaticamente em modo STDIO — não é necessário deixar nenhum processo rodando manualmente.

---

### Configuração alternativa — caminho absoluto

Se o comando `filazero-mcp` não for reconhecido após a instalação global, use o caminho absoluto para o arquivo compilado:

**Windows:**
```json
{
  "mcpServers": {
    "filazero-mcp": {
      "command": "node",
      "args": ["C:\\caminho\\completo\\para\\filazero-mcp\\dist\\index.js"]
    }
  }
}
```

**macOS / Linux:**
```json
{
  "mcpServers": {
    "filazero-mcp": {
      "command": "node",
      "args": ["/caminho/completo/para/filazero-mcp/dist/index.js"]
    }
  }
}
```

Para descobrir o caminho completo do projeto:
```bash
# No terminal, dentro da pasta do projeto:
pwd          # macOS/Linux
cd           # Windows (mostra o diretório atual)
```

---

### Quando publicado no npm *(futuro)*

Quando o pacote estiver no registry do npm, não será necessário clonar o repositório:

```json
{
  "mcpServers": {
    "filazero-mcp": {
      "command": "npx",
      "args": ["-y", "filazero-mcp"]
    }
  }
}
```

---

## Exemplo de conversa

Com o MCP configurado no Claude Desktop, a conversa fica assim:

```
Usuário: Quero agendar uma consulta

Claude: [usa list_companies]
Empresas disponíveis:
- Clínica Saúde Total (slug: clinica-saude-total)
- Odonto Premium (slug: odonto-premium)
Qual você prefere?

Usuário: Clínica Saúde Total

Claude: [usa get_company_services com slug=clinica-saude-total]
Serviços disponíveis:
- Consulta Clínica Geral (ID: 42)
- Pediatria (ID: 43)
Qual serviço deseja?

Usuário: Consulta Clínica Geral

Claude: [usa get_available_dates com serviceId=42, year=2026, month=4]
Datas disponíveis em abril/2026: 08/04, 10/04, 15/04
Qual data prefere?

Usuário: 10 de abril

Claude: [usa get_available_sessions com date=2026-04-10]
Horários:
- 09:00 — Dr. João Silva (sessionId: 101)
- 14:30 — Dra. Maria Oliveira (sessionId: 102)

Usuário: 14:30

Claude: [usa get_booking_form com sessionId=102]
Preciso de: Nome completo, CPF, Telefone

Usuário: João da Silva, CPF 123.456.789-00, tel (79) 99999-0000

Claude: [usa schedule_appointment]
Agendamento confirmado!
Código do ticket: ABC-123456 — 10/04/2026 às 14:30 com Dra. Maria Oliveira
```

---

## Tools disponíveis

| Tool | Auth | Descrição |
|------|------|-----------|
| `list_companies` | Pública | Lista todas as empresas disponíveis |
| `get_company_services` | Pública | Serviços de uma empresa pelo slug |
| `get_available_dates` | Pública | Dias com vagas em um mês |
| `get_available_sessions` | Pública | Horários disponíveis em um dia |
| `get_booking_form` | Pública | Campos do formulário de agendamento |
| `schedule_appointment` | Bearer token | Emite o ticket de agendamento |
| `check_ticket_status` | Pública | Status de um ticket pelo accessKey |
| `list_my_tickets` | Bearer token | Todos os tickets do usuário |

> As tools que exigem **Bearer token** precisam que o usuário forneça seu token de autenticação do Filazero durante a conversa.

---

## Variáveis de ambiente

Todas as variáveis são opcionais — o servidor funciona sem nenhum `.env`.

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MCP_TRANSPORT` | `stdio` | Modo de transporte: `stdio` (Claude Desktop) ou `http` (Inspector/Docker) |
| `MCP_SERVER_PORT` | `3000` | Porta do servidor HTTP |
| `FILAZERO_API_URL` | `https://api.staging.filazero.net` | URL base da API |
| `FILAZERO_APP_ORIGIN` | `https://app.filazero.net` | Origin enviado nos headers |
| `RATE_LIMIT_RPM` | `30` | Máximo de requisições por minuto |
| `LOG_LEVEL` | `info` | Nível de log: `debug`, `info`, `warn`, `error` |
| `GROQ_API_KEY` | *(vazio)* | Chave da API Groq (apenas para a demo) |

---

## Arquitetura

```
src/
├── index.ts              # Entrypoint — registra tools, resources e prompts
├── client/filazero.ts    # Cliente HTTP com headers, retry e rate limit
├── tools/                # 8 tools MCP
├── resources/            # 3 resources estáticos em Markdown
├── prompts/              # 2 prompts guiados
├── cache/                # Cache em memória com TTL
├── logger/               # Logs estruturados em JSON (stderr)
└── types/                # Tipos TypeScript da API
```

---

## Resolução de problemas

**O ícone de ferramentas não aparece no Claude Desktop**
- Verifique se o `npm install -g .` foi executado com sucesso
- Confirme que o arquivo `claude_desktop_config.json` foi salvo corretamente (JSON válido, sem vírgulas sobrando)
- Feche completamente o Claude Desktop (verifique a bandeja do sistema) e abra novamente
- No Windows, tente usar o caminho absoluto na configuração

**`filazero-mcp: command not found`**
- O `npm install -g .` não foi executado ou falhou
- Verifique se o diretório global do npm está no PATH: `npm config get prefix`
- Use a configuração com caminho absoluto como alternativa

**Porta 3000 já em uso (modo HTTP/Docker)**
```bash
# macOS/Linux
kill $(lsof -t -i:3000)

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

**Permissão negada no Docker (Linux)**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Alterações no código não refletem**
```bash
npm run build          # recompila
npm install -g .       # reinstala globalmente
# Reinicie o Claude Desktop
```

---

## Regras de negócio críticas

1. **abstractServiceId** — sempre usar quando disponível e `> 0` (tem prioridade sobre o `id` padrão)
2. **Content-Type** — POST/PUT/PATCH sempre com `application/json;charset=UTF-8`
3. **Erros em HTTP 200** — verificar campo `messages` na resposta da API mesmo em respostas com status 200
4. **Datas** — converter UTC para `America/Sao_Paulo` antes de exibir ao usuário
