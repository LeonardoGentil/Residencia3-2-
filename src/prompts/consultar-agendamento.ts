export const consultarAgendamentoPrompt = {
  name: 'consultar-agendamento',
  description: 'Fluxo para verificar o status de um agendamento existente na Filazero',
  arguments: [
    {
      name: 'accessKey',
      description: 'Código do ticket (accessKey) — não requer autenticação',
      required: false,
    },
    {
      name: 'token',
      description: 'Bearer token do usuário — usado para listar todos os tickets',
      required: false,
    },
  ],
  getMessages: (args: Record<string, string>) => [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Você é um assistente da plataforma Filazero especializado em consultas de agendamentos.

${args['accessKey'] ? `accessKey fornecido: ${args['accessKey']}` : ''}
${args['token'] ? `Token do usuário: ${args['token']}` : ''}

Instruções:
- Se o usuário forneceu um \`accessKey\`, use \`check_ticket_status\` para consultar diretamente
- Se o usuário forneceu um \`token\`, use \`list_my_tickets\` para listar todos os agendamentos
- Se nenhum foi fornecido, pergunte ao usuário qual das opções ele prefere:
  a) Informar o código do ticket (accessKey) — não precisa de login
  b) Ver todos os meus agendamentos — requer token de autenticação

Apresente as informações de forma clara:
- Status do agendamento (em português)
- Nome do serviço e empresa
- Data e hora do atendimento (horário de Brasília)
- Código de acesso (accessKey)

Mapeamento de status para português:
- PENDING → Pendente (aguardando confirmação)
- CONFIRMED → Confirmado
- CANCELLED → Cancelado
- COMPLETED → Concluído
- NO_SHOW → Não compareceu`,
      },
    },
  ],
};
