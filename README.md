# Sistema de Prevenção de Fraudes - Mercado Livre

**Sprint Session 4º Semestre 2025/1**

## Sobre o Projeto

Sistema completo de **detecção e prevenção de fraudes** desenvolvido para o **Mercado Livre**, utilizando machine learning para identificar transações potencialmente fraudulentas em tempo real. O projeto combina um backend em FastAPI com uma interface em React, proporcionando uma solução escalável e eficiente para proteção contra fraudes.

### Objetivos
- Prevenir fraudes no processo de compra e venda
- Proteger compradores e vendedores da plataforma
- Fornecer análises em tempo real e em lote
- Manter histórico detalhado de predições para auditoria

## Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web moderno e de alta performance
- **MongoDB** - Banco de dados NoSQL para logs e histórico
- **Pandas** - Manipulação e processamento de dados
- **Motor** - Driver assíncrono para MongoDB

### Frontend
- **React 18** - Biblioteca para construção da interface
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **Vite** - Build tool moderna e rápida
- **Axios** - Cliente HTTP para comunicação com a API

### Ferramentas de Desenvolvimento
- **DVC** - Versionamento de dados e modelos
- **Git** - Controle de versão
- **Postman** - Testes e documentação da API

## Estrutura do Projeto

```
├── backend/
│   ├── main.py                 # API FastAPI principal
│   ├── dataset.py             # Processamento de dados
│   ├── model.pkl              # Modelo ML pré-treinado
│   └── meli_api.postman_collection.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── services/         # Serviços de API
│   │   └── App.tsx           # Componente principal
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt           # Dependências Python
├── .dvcignore                # Configuração DVC
└── README.md
```

## Instalação e Configuração

### Pré-requisitos
- Python 3.8+
- Node.js 16+
- MongoDB (local ou Atlas)

### Backend
```bash
# 1. Clone o repositório
git clone https://github.com/insper-classroom/2025-1-app-selecao-da-fraude-app.git
cd 2025-1-app-selecao-da-fraude-app

# 2. Crie um ambiente virtual
python -m venv .venv
.venv\Scripts\activate

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Execute o servidor
cd backend
python main.py
```

### Frontend
```bash
# 1. Entre na pasta frontend
cd frontend

# 2. Instale as dependências
bun install

# 3. Execute o servidor de desenvolvimento
npm run dev
```

## Endpoints da API

### Predições
- **POST** `/predict/single` - Predição de uma única transação
- **POST** `/predict/batch` - Predição em lote de múltiplas transações

### Logs e Monitoramento
- **GET** `/logs` - Consulta histórico de predições com filtros por data

### Formato dos Dados
O sistema aceita três arquivos no formato `.feather`:
- **payers.feather** - Dados dos compradores
- **sellers.feather** - Dados dos vendedores  
- **transactions.feather** - Dados das transações

## Como Usar

### 1. Interface Web
1. Acesse `http://localhost:5173` (frontend)
2. Faça upload dos arquivos de dados (.feather)
3. Escolha entre predição individual ou em lote
4. Visualize os resultados e probabilidades
5. Consulte o histórico de predições

## Modelo de Machine Learning

O sistema utiliza um modelo pré-treinado que:
- Retorna probabilidade de fraude (0-1)
- Classifica como fraude (1) ou legítima (0)

### Métricas de Saída
- **prediction**: 0 (legítima) ou 1 (fraude)
- **probability**: Confiança da predição (0.0 - 1.0)
- **is_fraud**: Flag booleana para facilitar interpretação

## Monitoramento e Logs

Todas as predições são automaticamente registradas no MongoDB incluindo:
- Timestamp da predição
- Versão do modelo utilizada
- Dados completos da transação
- Resultado da predição e probabilidade