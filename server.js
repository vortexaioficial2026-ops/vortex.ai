// ==============================================
// VORTEX.AI — server.js
// Entry point principal do servidor.
// ==============================================

'use strict';

// Carrega as variáveis do .env para o process.env.
// Deve ser a primeira linha executada.
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

// ==============================================
// INICIALIZAÇÃO DO EXPRESS
// ==============================================
const app  = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// Ordem importa: segurança antes das rotas.
// ==============================================

// Helmet adiciona headers HTTP de segurança automaticamente.
// Protege contra XSS, clickjacking e outros ataques comuns.
app.use(helmet());

// CORS define quais origens podem chamar esta API.
// Apenas o front-end autorizado no .env pode fazer requisições.
app.use(cors({
  origin  : process.env.CORS_ORIGIN || 'http://localhost:5500',
  methods : ['GET', 'POST'],
}));

// Permite que o Express leia JSON no corpo das requisições.
app.use(express.json({ limit: '1mb' }));

// ==============================================
// HEALTH CHECK
// Rota simples que o Render usa para confirmar
// que o servidor está vivo e respondendo.
// Deve ser rápida e sem dependências externas.
// ==============================================
app.get('/v1/health', (_req, res) => {
  res.status(200).json({
    status    : 'ok',
    version   : '1.0.0',
    product   : 'Vortex.AI',
    timestamp : new Date().toISOString(),
  });
});

// ==============================================
// ROTAS DE NEGÓCIO
// As rotas existem mas ainda não têm lógica.
// Serão implementadas nos próximos arquivos.
// ==============================================
app.post('/v1/clip', (_req, res) => {
  res.status(200).json({ message: 'Rota Clip recebida. Implementação em breve.' });
});

app.post('/v1/studio', (_req, res) => {
  res.status(200).json({ message: 'Rota Studio recebida. Implementação em breve.' });
});

// ==============================================
// HANDLER DE ROTAS NÃO ENCONTRADAS (404)
// Qualquer rota não registrada acima cai aqui.
// Responde sempre em JSON — nunca em HTML.
// ==============================================
app.use((_req, res) => {
  res.status(404).json({
    error   : 'Rota não encontrada.',
    product : 'Vortex.AI',
  });
});

// ==============================================
// HANDLER GLOBAL DE ERROS (500)
// Captura erros não tratados sem expor detalhes
// internos ao cliente.
// ==============================================
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Vortex.AI] Erro interno:', err.message);
  res.status(500).json({
    error   : 'Erro interno do servidor.',
    product : 'Vortex.AI',
  });
});

// ==============================================
// INICIALIZAÇÃO
// ==============================================
app.listen(PORT, () => {
  console.log(`🌀 Vortex.AI rodando na porta ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/v1/health`);
});

module.exports = app;
