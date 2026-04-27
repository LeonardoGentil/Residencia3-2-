# Filazero MCP Server

Servidor MCP para a API Filazero — permite que agentes de IA agendem atendimentos e consultem tickets sem filas presenciais.

Desenvolvido para a Residência em Software III — Universidade Tiradentes (UNIT) 2026.

---

## Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- [Docker](https://docker.com) e Docker Compose (opcional, para rodar com containers)

---

## Instalação e uso local

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd filazero-mcp

# 2. Instale as dependências e compile
npm install
npm run build

# 3. Instale globalmente (torna o comando filazero-mcp disponível no sistema)
npm install -g .
```

### Modo desenvolvimento (sem compilar)

```bash
npm run dev
```

---

## Como rodar com Docker

```bash
# 1. Clone o repositório e entre na pasta
cd filazero-mcp

# 2. Suba os containers
docker compose up --build
```

O servidor ficará acessível em `http://localhost:3000`.

---

## Testando com o MCP Inspector

Com o servidor rodando em modo HTTP (`MCP_TRANSPORT=http`):

```bash
npx @modelcontextprotocol/inspector --transport streamable-http http://localhost:3000/mcp
```

> O endpoint MCP é `/mcp`, não a raiz `/`. Usar `http://localhost:3000` sem o path resultará em erro `Cannot POST /`.

---

## Como conectar ao Claude Desktop

Edite o arquivo de configuração do Claude Desktop:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

O Claude Desktop inicia o servidor automaticamente em modo STDIO — não é necessário deixar nenhum processo rodando antes.

> No Windows o `cmd /c` é necessário porque o Claude Desktop não herda o PATH do npm automaticamente.

> Após salvar, reinicie o Claude Desktop. O ícone de ferramentas (🔨) deve aparecer na caixa de texto.

### Quando publicado no npm (futuro)

Sem precisar clonar o repositório:

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

---

## Exemplo de conversa

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

## Variáveis de ambiente

Todas as variáveis são opcionais — o servidor funciona sem nenhum `.env`.

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MCP_TRANSPORT` | `stdio` | Modo de transporte: `stdio` ou `http` |
| `MCP_SERVER_PORT` | `3000` | Porta do servidor (apenas modo `http`) |
| `FILAZERO_API_URL` | `https://api.staging.filazero.net` | URL base da API |
| `FILAZERO_APP_ORIGIN` | `https://app.filazero.net` | Origin enviado nos headers |
| `RATE_LIMIT_RPM` | `30` | Máximo de requisições por minuto |
| `LOG_LEVEL` | `info` | Nível de log: `debug`, `info`, `warn`, `error` |

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

## Regras de negócio críticas

1. **abstractServiceId** — sempre usar quando disponível e `> 0`
2. **Content-Type** — POST/PUT/PATCH sempre com `application/json;charset=UTF-8`
3. **Erros em HTTP 200** — verificar campo `messages` na resposta da API
4. **Datas** — converter UTC para `America/Sao_Paulo` antes de exibir
