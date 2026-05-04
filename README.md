# Filazero MCP Server

Servidor MCP que conecta o Claude Desktop à API Filazero — agende atendimentos conversando com o Claude, sem abrir nenhum site.

Desenvolvido para a **Residência em Software III — Universidade Tiradentes (UNIT) 2026**.

---

## Instalação (feita uma única vez)

**1. Instale os pré-requisitos:**
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Claude Desktop](https://claude.ai/download)

**2. Clone o repositório e instale as dependências:**
```bash
git clone https://github.com/LeonardoGentil/Residencia3-2-
cd Residencia3-2-
npm install
npm run build
cp .env.example .env
```

**3. Configure o Claude Desktop automaticamente:**
```bash
npm run setup
```

**4. Reinicie o Claude Desktop.**

O ícone de ferramentas aparecerá na caixa de texto — instalação concluída.

---

## Rodar o projeto

```bash
docker compose up --build
```

Aguarde a mensagem de servidor iniciado, depois abra o Claude Desktop e comece a usar.

---

## Parar o projeto

No terminal onde o projeto está rodando, pressione `Ctrl + C`, depois:

```bash
docker compose down
```

---

## Iniciar de novo após parar

```bash
docker compose up --build
```
