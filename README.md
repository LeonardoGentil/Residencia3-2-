# Filazero MCP Server

Servidor MCP que conecta o Claude à API Filazero — agende atendimentos conversando com o assistente, sem abrir nenhum site.

Desenvolvido para a **Residência em Software III — Universidade Tiradentes (UNIT) 2026**.

---

## Antes de começar — o que você precisa instalar

### 1. Node.js
Acesse [nodejs.org](https://nodejs.org), baixe a versão **LTS** e instale normalmente.

Para confirmar que instalou certo, abra o terminal e rode:
```bash
node --version
```
Deve aparecer algo como `v20.x.x`.

---

### 2. Docker Desktop
Acesse [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop), baixe e instale.

Depois de instalar, **abra o Docker Desktop** e deixe ele rodando em segundo plano (ele precisa estar aberto para funcionar).

Para confirmar:
```bash
docker --version
```

---

### 3. Git
Acesse [git-scm.com/downloads](https://git-scm.com/downloads), baixe e instale.

Para confirmar:
```bash
git --version
```

---

## Baixando o projeto

Com o terminal aberto na pasta onde você quer salvar o projeto, rode:

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
cp .env.example .env
```

> No Windows, se o `cp` não funcionar, use: `copy .env.example .env`

---

## Como usar

Escolha uma das duas opções abaixo:

---

### Opção A — Interface web (mais simples)

Sobe o servidor e a interface com um comando só:

```bash
docker compose up --build
```

Aguarde aparecer a mensagem:
```
mcp-server-1 | Filazero MCP Server iniciado em modo HTTP na porta 3000
```

Depois abra o navegador e acesse **http://localhost**.

Faça login com qualquer e-mail e senha (modo demo) e pode começar a usar.

**Para parar**, pressione `Ctrl + C` no terminal e rode:
```bash
docker compose down
```

**Para rodar de novo depois:**
```bash
docker compose up --build
```

---

### Opção B — Claude Desktop

Com o Claude Desktop você conversa direto pelo app do Claude, sem precisar abrir o navegador.

**1.** Instale o Claude Desktop em [claude.ai/download](https://claude.ai/download).

**2.** Com o projeto já configurado (passos acima), rode:
```bash
npm run setup
```

Esse comando configura o Claude Desktop automaticamente para encontrar o servidor.

**3.** Reinicie o Claude Desktop.

O ícone de ferramentas vai aparecer na caixa de texto — pronto, está funcionando.

> Nessa opção não precisa do Docker rodando.
