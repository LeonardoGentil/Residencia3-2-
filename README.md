# Filazero MCP Server



Desenvolvido para a Residência em Software III — Universidade Tiradentes (UNIT) 2026.

---

## Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- [Docker](https://docker.com) e Docker Compose (para rodar com containers)

---

## Como rodar com Docker

```bash
# 1. Clone o repositório e entre na pasta
cd filazero-mcp

# 2. Crie o arquivo .env a partir do exemplo
cp .env.example .env

# 3. Suba os containers
docker compose up --build

#4. Roda o MCP insepctor
npx @modelcontextprotocol/inspector http://localhost:3000

```

O servidor MCP ficará acessível em `http://localhost:3000` (direto) ou `http://localhost:80` (via Nginx).

---

## Como rodar localmente (sem Docker)

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Compile o TypeScript
npm run build

# 4. Inicie o servidor
npm start

# Ou em modo desenvolvimento (sem compilar)
npm run dev
```

---

## Como conectar ao Claude Desktop

Edite o arquivo de configuração do Claude Desktop (`claude_desktop_config.json`):

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filazero": {
      "transport": {
        "type": "http",
        "url": "http://localhost:3000"
      }
    }
  },
  "preferences": {
    "coworkWebSearchEnabled": true,
    "coworkScheduledTasksEnabled": false,
    "ccdScheduledTasksEnabled": false
  }
}
```

Substitua `/caminho/absoluto/para/filazero-mcp` pelo caminho real no seu sistema.

> Após salvar, reinicie o Claude Desktop. O ícone de ferramentas deve aparecer no chat.

---

## As 8 Tools disponíveis

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

## Exemplo de conversa completa

```
Usuário: Quero agendar uma consulta

Claude: Vou buscar as empresas disponíveis...
[usa list_companies]
Encontrei as seguintes empresas:
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
Datas disponíveis em abril/2026:
08/04/2026, 10/04/2026, 15/04/2026
Qual data prefere?

Usuário: 10 de abril

Claude: [usa get_available_sessions com date=2026-04-10]
Horários disponíveis:
- 09:00 — Dr. João Silva (sessionId: 101)
- 14:30 — Dra. Maria Oliveira (sessionId: 102)
Qual horário prefere?

Usuário: 14:30

Claude: [usa get_booking_form com sessionId=102]
Preciso de algumas informações:
- Nome completo (obrigatório)
- CPF (obrigatório)
- Telefone (obrigatório)

Usuário: João da Silva, CPF 123.456.789-00, tel (79) 99999-0000

Claude: [usa schedule_appointment com token do usuário]
✅ Agendamento confirmado!
Código do ticket: ABC-123456
Data: 10/04/2026 às 14:30
Profissional: Dra. Maria Oliveira
Guarde seu código para consultas futuras.
```

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `FILAZERO_API_URL` | `https://api.staging.filazero.net` | URL base da API (sempre staging) |
| `FILAZERO_APP_ORIGIN` | `https://app.filazero.net` | Origin enviado nos headers |
| `MCP_SERVER_PORT` | `3000` | Porta do servidor MCP |
| `RATE_LIMIT_RPM` | `30` | Máximo de requisições por minuto |
| `CACHE_TTL_COMPANIES` | `300` | TTL do cache de empresas (segundos) |
| `LOG_LEVEL` | `info` | Nível de log: debug, info, warn, error |

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

## Regras de negócio críticas

1. **abstractServiceId** — sempre usar quando disponível e `> 0`
2. **Content-Type** — POST/PUT/PATCH sempre com `application/json;charset=UTF-8`
3. **Erros em HTTP 200** — verificar campo `messages` na resposta da API
4. **Datas UTC** — converter para `America/Sao_Paulo` antes de exibir
