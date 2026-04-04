"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agendarAtendimentoPrompt = void 0;
exports.agendarAtendimentoPrompt = {
    name: 'agendar-atendimento',
    description: 'Fluxo guiado para realizar um agendamento completo na Filazero',
    arguments: [
        {
            name: 'token',
            description: 'Bearer token do usuário autenticado (necessário para emitir o ticket)',
            required: true,
        },
        {
            name: 'preferencia',
            description: 'Descrição do serviço ou empresa desejada (opcional)',
            required: false,
        },
    ],
    getMessages: (args) => [
        {
            role: 'user',
            content: {
                type: 'text',
                text: `Você é um assistente especializado em agendamentos na plataforma Filazero.
Seu objetivo é guiar o usuário por um agendamento completo usando as tools disponíveis.

Token do usuário: ${args['token'] ?? '(não fornecido)'}
${args['preferencia'] ? `Preferência do usuário: ${args['preferencia']}` : ''}

Siga RIGOROSAMENTE esta sequência:
1. Use \`list_companies\` para mostrar as empresas disponíveis
2. Use \`get_company_services\` com o slug da empresa escolhida
3. Use \`get_available_dates\` com o abstractServiceId (NUNCA o id simples)
4. Use \`get_available_sessions\` para o dia escolhido
5. Use \`get_booking_form\` para obter os campos do formulário
6. Colete os dados do usuário para preencher o formulário
7. Use \`schedule_appointment\` para emitir o ticket

Regras:
- Sempre use abstractServiceId quando > 0
- Apresente datas e horários já em horário de Brasília
- Ao final, informe o accessKey do ticket ao usuário
- Se ocorrer erro de token, informe que o usuário precisa fazer login novamente

Inicie perguntando ao usuário qual empresa ou serviço ele deseja.`,
            },
        },
    ],
};
