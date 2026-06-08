// ==============================================
// VORTEX.AI — server.js
// Entry point principal do servidor.
// ==============================================

'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

// ==============================================
// ROTAS E SERVIÇOS
// ==============================================
const clipRouter          = require('./src/routes/clip');
const { limparDiretorioTemp } = require('./src/services/cleanup');

// ==============================================
// INICIALIZAÇÃO DO EXPRESS
// ==============================================
const app  = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// MIDDLEWARES GLOBAIS DE SEGURANÇA
// Ordem importa: segurança antes das rotas.
// ==============================================
app.use(helmet());

app.use(cors({
  origin  : process.env.CORS_ORIGIN || 'http://localhost:5500',
  methods : ['GET', 'POST'],
}));

app.use(express.json({ limit: '1mb' }));

// ==============================================
// HEALTH CHECK
// Rota simples que o Render usa para confirmar
// que o servidor está vivo e respondendo.
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
// ==============================================

// Rota principal — análise de clipe via Gemini
app.use('/v1/clip', clipRouter);

// Rota Studio — ainda em implementação
app.post('/v1/studio', (_req, res) => {
  res.status(200).json({ message: 'Rota Studio recebida. Implementação em breve.' });
});

// ==============================================
// HANDLER DE ROTAS NÃO ENCONTRADAS (404)
// ==============================================
app.use((_req, res) => {
  res.status(404).json({
    error   : 'Rota não encontrada.',
    product : 'Vortex.AI',
  });
});

// ==============================================
// HANDLER GLOBAL DE ERROS (500)
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
// Limpa arquivos órfãos antes de abrir o servidor
// para novas requisições.
// ==============================================
limparDiretorioTemp();

app.listen(PORT, () => {
  console.log(`🌀 Vortex.AI rodando na porta ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/v1/health`);
});

module.exports = app;
