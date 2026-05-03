#!/usr/bin/env node
// Diz ao sistema operacional que esse arquivo deve ser executado com Node.js

// Importa três módulos nativos do Node.js:
// fs para ler e escrever arquivos, path para montar caminhos de pasta,
// e os para pegar informações do sistema operacional

const fs = require('fs');
const path = require('path');
const os = require('os');

// Define o conteúdo que vai ser inserido no arquivo de configuração:
// o tipo de transporte HTTP e o endereço do servidor

const CONFIG_ENTRY = {
  type: 'http',
  url: 'http://localhost:3000/mcp',
};

// Função que retorna o caminho do claude_desktop_config.json
// de acordo com o sistema operacional: Windows, Mac ou Linux

function getConfigPath() {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    default:
      return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  }
}

// Chama a função acima para obter o caminho do arquivo,
// e extrai só a pasta onde ele fica

const configPath = getConfigPath();
const configDir = path.dirname(configPath);

// Verifica se a pasta existe. Se não existir, cria ela

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Cria um objeto vazio. Se o arquivo já existir, lê o conteúdo e transforma
// o JSON em objeto. Se o JSON estiver inválido, exibe um erro e encerra o script

let config = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    console.error('Erro ao ler o arquivo de configuração existente. Ele pode estar com JSON inválido.');
    process.exit(1);
  }
}

// Se não existir a chave mcpServers no objeto, cria ela.
// Depois adiciona (ou sobrescreve) a entrada do Filazero

if (!config.mcpServers) config.mcpServers = {};
config.mcpServers['filazero-mcp'] = CONFIG_ENTRY;

// Converte o objeto de volta para JSON formatado e salva no arquivo

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

// Exibe no terminal uma mensagem de sucesso com o caminho do arquivo
// e um aviso para reiniciar o Claude Desktop

console.log('Claude Desktop configurado com sucesso!');
console.log(`   Arquivo: ${configPath}`);
console.log('');
console.log('Reinicie o Claude Desktop para aplicar as alterações.');