export const ticketLifecycleContent = `# Ciclo de Vida de um Ticket — Filazero

## Estados possíveis

| Status       | Descrição                                                   |
|--------------|-------------------------------------------------------------|
| PENDING      | Ticket criado, aguardando confirmação do estabelecimento    |
| CONFIRMED    | Agendamento confirmado pelo estabelecimento                 |
| CANCELLED    | Agendamento cancelado (pelo usuário ou pelo estabelecimento)|
| COMPLETED    | Atendimento realizado com sucesso                           |
| NO_SHOW      | Usuário não compareceu no horário agendado                  |

## Transições de estado

\`\`\`
PENDING ──► CONFIRMED ──► COMPLETED
   │              │
   └──────────────┴──► CANCELLED
CONFIRMED ──► NO_SHOW
\`\`\`

## Como consultar o status

Use a tool \`check_ticket_status\` passando o \`accessKey\` recebido no agendamento.
Alternativamente, use \`list_my_tickets\` com o token do usuário para ver todos os tickets.

## accessKey

O \`accessKey\` é o identificador público do ticket, gerado no momento do agendamento.
Guarde-o para consultas futuras — ele não requer autenticação para a consulta de status.

## Exemplo de resposta de ticket

\`\`\`json
{
  "id": 12345,
  "accessKey": "ABC-123456",
  "status": "CONFIRMED",
  "serviceName": "Consulta Clínica Geral",
  "companyName": "Clínica Exemplo",
  "scheduledAt": "10/04/2026 14:30",
  "createdAt": "04/04/2026 09:15"
}
\`\`\`
`;
