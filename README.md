# 🚀 EdgeIQ - Plataforma MDI Modular Gerencial

O **EdgeIQ** é um ecossistema de gerenciamento administrativo moderno projetado com base no padrão arquitetural MDI (*Multiple Document Interface*) modular. O sistema conta com uma interface web de alta performance integrada de ponta a ponta a uma API corporativa escalável para controle de usuários, perfis de acesso e auditoria cadastral.

---

## 🛠️ Stack Tecnológica

### Frontend (Web)
* **React 19** com **Vite** (Build Tool ultrarrápido)
* **Tailwind CSS v4** (Estilização fluida e responsiva)
* **Lucide React** (Pacote de iconografia vetorial dinâmico)
* **React Router DOM v6** (Gerenciamento de rotas privadas/públicas e estados de navegação)
* **jwt-decode** (Decodificação de payloads de segurança na camada de transporte)

### Backend (API)
* **.NET 8 / 9 Core Minimal APIs** (Arquitetura RESTful de alta performance)
* **Entity Framework Core** (Mapeamento ORM e persistência de dados)
* **FluentValidation** (Validação automatizada de DTOs baseada em regras de negócio)
* **BCrypt.Net** (Algoritmo de Hash seguro para criptografia de credenciais)
* **Bearer Token JWT** (Autenticação e autorização por chaves assinadas)

---

## ✨ Funcionalidades Implementadas

* **🔑 Fluxo de Autenticação Robusto**: Tela de Login, Esqueci Senha com repasse automático de dados via estado de navegação e redefinição segura de credenciais.
* **📦 UX Otimizada por FluentValidation**: Interceptador global que captura dicionários de erro do C# e mapeia de forma automatizada e visual (com quebra de linhas por marcadores `•`) abaixo de cada input correspondente no formulário.
* **📊 Dashboard Analítico Completo**: Cards informativos alimentados em tempo real por contadores assíncronos (`Promise.all`) da API e gráficos de movimentação estruturados puramente em CSS.
* **📋 DataGrid Fluido Expandido**: Listagem full-width para gerenciamento de **Perfis** e **Usuários** integrada ao ecossistema de paginação nativo do .NET (PascalCase).
* **🔍 Busca em Tempo Real**: Filtro reativo instantâneo na listagem para refinamento e busca ágil de registros.
* **🗂️ Menu Lateral Sanfona**: Sidebar colapsável dinâmica baseada no conceito do *Modular Admin* que otimiza o espaço útil de trabalho.
* **🕵️‍♂️ Descriptografia de Payload**: Captura do e-mail do usuário diretamente de dentro do hash-token JWT e exibição dinâmica no cabeçalho.

---

## 📁 Estrutura de Pastas (Frontend)

```text
src/
├── components/          # Componentes de controle (ProtectedRoute, etc.)
├── layouts/             # Wrappers estruturais (AuthLayout, MdiLayout)
├── pages/               # Telas da aplicação (Login, Dashboard, Cruds)
├── services/            # Serviços de integração (authService, apiClient)
├── App.jsx              # Centralizador de rotas e roteamento do sistema
└── main.jsx             # Ponto de entrada do ecossistema React
```

---

## 🔧 Configuração e Inicialização

### Pré-requisitos
* [Node.js](https://nodejs.org) (Versão 18 ou superior)
* [.NET SDK](https://microsoft.com) (Versão 8.0+)
* Banco de Dados configurado no `appsettings.json` do C#

### 1. Configurando o Backend C#
1. Navegue até a pasta do projeto da API .NET.
2. Execute as migrações do banco de dados (se aplicável):
   ```bash
   dotnet ef database update
   ```
3. Inicie o servidor da API:
   ```bash
   dotnet run
   ```
   *Certifique-se de anotar a porta local gerada (ex: `https://localhost:7000`).*

### 2. Configurando o Frontend React
1. Navegue até a pasta raiz do frontend.
2. Instale todas as dependências do ecossistema Node:
   ```bash
   npm install
   ```
3. Crie um arquivo chamado **`.env`** na raiz do projeto frontend (na mesma pasta do `package.json`) e insira o endereço da sua API:
   ```env
   VITE_API_URL=http://localhost:5164
   ```
4. Inicie o servidor de desenvolvimento do Vite forçando a limpeza de cache:
   ```bash
   npm run dev -- --force
   ```

---

## 🔒 Boas Práticas de Segurança Aplicadas

1. **HTTPS Compulsório**: Garantia de integridade de tráfego de payloads sensíveis (como senhas explicitadas temporariamente no canal local de rede) por tunelamento SSL inquebrável.
2. **Isolamento de Criptografia**: Hash de senhas gerenciado restritamente na camada de backend C# através do `BCrypt`, tratando hashes como chaves secretas definitivas e blindando o banco de dados contra vazamentos (*Anti-Pattern Protection*).
3. **Interceptação Autenticada**: Injeção automática e transparente de cabeçalhos `Authorization: Bearer <token>` em rotas protegidas pelo utilitário centralizado `apiClient`.
4. **Tratamento de Sessão**: Expulsão automatizada do usuário do painel interno MDI caso o token expire ou a API retorne status `401 Unauthorized`.
