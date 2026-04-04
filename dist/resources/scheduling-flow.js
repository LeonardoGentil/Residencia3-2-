"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulingFlowContent = void 0;
exports.schedulingFlowContent = `# Guia Completo do Fluxo de Agendamento — Filazero MCP

## Visão Geral

Este MCP Server expõe 8 tools que permitem realizar um agendamento completo via conversa natural.
Siga a sequência abaixo para garantir o fluxo correto.

---

## Sequência das Tools

### Passo 1 — list_companies
Lista todas as empresas disponíveis para agendamento.
- **Entrada:** nenhuma
- **Saída:** lista com id, slug, name, description

### Passo 2 — get_company_services
Obtém os serviços de uma empresa específica.
- **Entrada:** slug (obtido no passo 1)
- **Saída:** lista com id, abstractServiceId, name, description
- **IMPORTANTE:** guarde o \`abstractServiceId\` — use-o nos próximos passos

### Passo 3 — get_available_dates
Descobre quais dias têm vagas no mês escolhido.
- **Entrada:** slug, serviceId (usar abstractServiceId!), year, month
- **Saída:** lista de datas em DD/MM/YYYY (fuso horário de Brasília)

### Passo 4 — get_available_sessions
Lista os horários disponíveis em um dia específico.
- **Entrada:** slug, locationId, serviceId, date (YYYY-MM-DD)
- **Saída:** lista de sessões com sessionId, startTime, endTime, professionalName
- **IMPORTANTE:** guarde o \`sessionId\` para os próximos passos

### Passo 5 — get_booking_form
Retorna o formulário com os campos obrigatórios para o agendamento.
- **Entrada:** providerId, sessionId
- **Saída:** lista de campos com name, label, type, required

### Passo 6 — schedule_appointment (requer autenticação)
Emite o ticket de agendamento com os dados preenchidos.
- **Entrada:** token, sessionId, serviceId, formData
- **Saída:** ticket criado com accessKey e status

---

## Fluxo para consultar agendamento existente

### Opção A — check_ticket_status (sem autenticação)
- **Entrada:** accessKey do ticket
- **Saída:** status atual e detalhes do ticket

### Opção B — list_my_tickets (requer autenticação)
- **Entrada:** token do usuário
- **Saída:** lista de todos os tickets do usuário

---

## Regras críticas

1. **Sempre use abstractServiceId** (não o id simples) nos passos 3, 4 e 6
2. **Datas já estão em horário de Brasília** — não converter novamente
3. **Token Bearer** é necessário apenas para schedule_appointment e list_my_tickets

---

## Exemplo de conversa completa

> Usuário: "Quero agendar uma consulta na clínica exemplo"
> Agente: [usa list_companies para encontrar a clínica]
> Agente: [usa get_company_services para listar serviços]
> Agente: "Encontrei o serviço 'Consulta Clínica Geral'. Qual mês prefere?"
> Usuário: "Abril de 2026"
> Agente: [usa get_available_dates com year=2026, month=4]
> Agente: "Datas disponíveis: 08/04, 10/04, 15/04. Qual prefere?"
> Usuário: "10 de abril"
> Agente: [usa get_available_sessions com date=2026-04-10]
> Agente: "Horários: 09:00 (Dr. João), 14:30 (Dra. Maria). Qual prefere?"
> Usuário: "14:30 com a Dra. Maria"
> Agente: [usa get_booking_form para obter os campos]
> Agente: "Preciso do seu nome completo e CPF."
> Usuário: fornece os dados
> Agente: [usa schedule_appointment com token do usuário]
> Agente: "Agendamento confirmado! Seu código é ABC-123456."
`;
