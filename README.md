# Filazero MCP Server

Servidor MCP que conecta o Claude à API Filazero — agende atendimentos conversando com o assistente, sem abrir nenhum site.

Desenvolvido para a **Residência em Software III — Universidade Tiradentes (UNIT) 2026**.

---

## Pré-requisitos

Instale as ferramentas abaixo antes de começar:

| Ferramenta | Windows | Linux |
|---|---|---|
| Node.js 20+ | [nodejs.org](https://nodejs.org) → baixe a versão LTS | `sudo apt install nodejs npm` |
| Docker Desktop | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) | `sudo apt install docker.io docker-compose-plugin` |
| Git | [git-scm.com/downloads](https://git-scm.com/downloads) | `sudo apt install git` |

> **Windows:** após instalar o Docker Desktop, abra-o e deixe rodando antes de continuar. Na primeira vez ele pode pedir para habilitar o WSL2 — aceite e reinicie o PC.

> **Linux:** após instalar o Docker, rode `sudo usermod -aG docker $USER && newgrp docker` para usar sem `sudo`.

---

## Instalação

```bash
git clone https://github.com/LeonardoGentil/Residencia3-2-
cd Residencia3-2-
npm install
npm run build
```

Crie o arquivo de configuração:

```bash
# Linux
cp .env.example .env

# Windows
copy .env.example .env
```

---

## Rodando

### Opção A — Interface web (recomendado)

```bash
docker compose up --build
```

Aguarde a mensagem `Filazero MCP Server iniciado em modo HTTP na porta 3000` e acesse **http://localhost** no navegador.

Para parar: `docker compose down`

---

### Opção B — Claude Desktop

```bash
npm run setup
```

Reinicie o Claude Desktop. O ícone de ferramentas vai aparecer na caixa de texto.

---

## Problemas comuns

**Porta 3000 em uso**
- Windows: encerre o processo no Gerenciador de Tarefas
- Linux: `kill $(lsof -t -i:3000)`

**Docker não encontrado**
Certifique-se de que o Docker Desktop está aberto (ícone na bandeja do sistema).
