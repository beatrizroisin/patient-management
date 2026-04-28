PsicoGest

Sistema de gestão interna para consultório de psicologia — controle de pacientes, agenda semanal, financeiro, prontuários e documentos clínicos.


Sobre o projeto
O PsicoGest nasceu da necessidade real de uma psicóloga de ter um único lugar para organizar tudo do consultório: saber quem atende hoje, quanto está a receber, quais sessões estão em aberto e ter o histórico de cada paciente acessível com um clique — tudo com visual limpo, cores suaves e fácil de usar tanto no computador quanto no celular.
O sistema roda inteiramente no navegador. Nenhum dado sai do seu dispositivo.

Funcionalidades
◈ Dashboard

Saudação dinâmica com hora do dia (bom dia / boa tarde / boa noite) e data por extenso
Cards de resumo financeiro: total recebido, a receber, lucro real e sessões do dia
Agenda de hoje gerada automaticamente a partir dos horários recorrentes cadastrados nos pacientes
Indicador visual de sessão em andamento no momento atual
Lista de pendências financeiras em aberto

▦ Agenda Semanal

Visualização estilo Google Calendar com grade horária das 7h às 21h
Cada paciente tem uma cor própria para identificação rápida
Blocos de sessão posicionados proporcionalmente à duração
Linha vermelha indicando o horário atual (apenas no dia de hoje)
Navegação entre semanas e botão "Hoje"
Legenda de pacientes com cores
Rolagem horizontal no mobile

◉ Pacientes

Cadastro completo: nome, idade, profissão, telefone, contato de emergência
Status do paciente: Ativo, Em Pausa, Alta ou Lista de Espera
Tipo de atendimento: Particular ou Convênio (com campos de carteirinha e sessões autorizadas)
Horários recorrentes de atendimento: dia da semana, horário e duração — integrado com a agenda e o dashboard
Tags clínicas clicáveis para identificar temas recorrentes
Histórico médico e observações livres
Ao clicar em qualquer paciente, abre o dossiê completo com três abas:

Ficha — todos os dados cadastrais editáveis
Prontuário — notas de sessão em linha do tempo com tags e busca
✦ Insight — campo de lembrete para ler antes da próxima sessão



◎ Financeiro

Controle de sessões realizadas com marcação de pagamento por método (Pix, Dinheiro, Cartão, Transferência)
Lançamento de gastos do consultório por categoria (infraestrutura, desenvolvimento, material)
Cálculo automático de lucro real (recebido − gastos)
Gerador de recibo personalizável com exportação para impressão / PDF

◫ Documentos

Gerador de templates: Atestado, Laudo, Contrato de Prestação de Serviços e Declaração
Editor de texto livre para personalizar o documento gerado
Histórico de documentos salvos com possibilidade de reabrir e editar
Exportação para impressão / PDF

◧ Prontuários

Visualização rápida das notas de todos os pacientes ativos
Campo de insight da próxima sessão em destaque
Registro de nova nota com tags temáticas
Linha do tempo de notas com busca por texto ou tag
Acesso direto ao painel sem sair da tela principal


Stack
CamadaTecnologiaFrameworkReact 18BuildViteEstilizaçãoInline styles (sem dependências de CSS externas)PersistêncialocalStorage do navegadorDeployVercel
Sem bibliotecas de UI externas. Sem banco de dados. Sem backend. Zero dependências além do React.

Estrutura do projeto
psicogest/
├── public/
├── src/
│   ├── App.jsx          ← todo o sistema em um único arquivo
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md

Como rodar localmente
Pré-requisitos: Node.js 18+ instalado.
bash#

1. Criar o projeto com Vite
npm create vite@latest psicogest -- --template react
cd psicogest
npm install
npm run dev

Abra http://localhost:5173 no navegador.


Persistência de dados
Os dados ficam salvos no localStorage do navegador com as seguintes chaves:
ChaveConteúdopsicogest_patientsPacientes, fichas, horários, notas e insightspsicogest_sessionsSessões financeiras registradaspsicogest_expensesGastos do consultóriopsicogest_docsDocumentos salvos no editor
O que isso significa na prática:

✅ Os dados ficam 100% no seu dispositivo — nenhuma informação é enviada para servidores externos
✅ Funciona sem internet após o primeiro carregamento
✅ Sem necessidade de login ou conta
⚠️ Cada dispositivo mantém seus próprios dados — celular e computador não sincronizam automaticamente
⚠️ Limpar o cache / dados do navegador apaga tudo — faça exportações periódicas se necessário


Responsividade
O sistema é totalmente responsivo:

Desktop: sidebar lateral fixa com navegação completa
Mobile: header superior com menu hambúrguer + barra de navegação inferior, grids colapsados em coluna única, agenda com rolagem horizontal
