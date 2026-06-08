// ==============================================
// VORTEX.AI — src/routes/clip.js
// Rota principal POST /v1/clip
// Orquestra o fluxo completo de análise de vídeo.
// ==============================================

'use strict';

const express = require('express');
const router  = express.Router();

const upload          = require('../middlewares/upload');
const { extrairAudio } = require('../services/ffmpeg');
const { analisarAudio } = require('../services/gemini');
const { deletarArquivos } = require('../services/cleanup');

// ==============================================
// POST /v1/clip
// Recebe um vídeo, extrai o áudio, analisa com
// o Gemini e retorna a análise estruturada.
//
// Content-Type: multipart/form-data
// Campo do arquivo: "video"
// ==============================================
router.post('/', upload.single('video'), async (req, res) => {

  // Caminhos dos arquivos temporários desta requisição.
  // Declarados aqui fora para o finally ter acesso.
  let videoPath = null;
  let audioPath = null;

  try {

    // ------------------------------------------
    // ETAPA 1: Validação do upload
    // O Multer já processou o arquivo antes de
    // chegar aqui. Se o arquivo não existe, o
    // usuário não enviou nada.
    // ------------------------------------------
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhum arquivo de vídeo foi enviado.',
        hint : 'Envie o vídeo no campo "video" como multipart/form-data.',
      });
    }

    videoPath = req.file.path;

    console.log(`[Clip] Upload recebido: ${req.file.originalname} (${(req.file.size / 1_048_576).toFixed(2)}MB)`);

    // ------------------------------------------
    // ETAPA 2: Extração do áudio via ffmpeg
    // ------------------------------------------
    console.log('[Clip] Extraindo áudio...');
    audioPath = await extrairAudio(videoPath);
    console.log('[Clip] Áudio extraído com sucesso.');

    // ------------------------------------------
    // ETAPA 3: Análise do áudio via Gemini
    // ------------------------------------------
    console.log('[Clip] Enviando para análise do Gemini...');
    const analise = await analisarAudio(audioPath);
    console.log(`[Clip] Análise concluída. Vortex Score™: ${analise.vortex_score}`);

    // ------------------------------------------
    // ETAPA 4: Resposta ao front-end
    // ------------------------------------------
    return res.status(200).json({
      success  : true,
      produto  : 'Vortex.AI',
      arquivo  : req.file.originalname,
      analise,
    });

  } catch (err) {

    console.error('[Clip] Erro no processamento:', err.message);

    // Identifica o tipo de erro para retornar
    // mensagem adequada ao usuário.

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Arquivo excede o tamanho máximo de 150MB.',
      });
    }

    if (err.message?.includes('Formato não suportado')) {
      return res.status(415).json({
        error: err.message,
      });
    }

    if (err.message?.includes('Falha ao extrair áudio')) {
      return res.status(422).json({
        error: 'Falha ao processar o áudio do vídeo.',
        detail: err.message,
      });
    }

    if (err.message?.includes('OpenRouter')) {
      return res.status(502).json({
        error : 'Falha ao analisar o conteúdo.',
        detail: err.message,
      });
    }

    // Erro genérico não mapeado
    return res.status(500).json({
      error: 'Erro interno ao processar o vídeo.',
    });

  } finally {

    // ------------------------------------------
    // LIMPEZA GARANTIDA
    // Roda sempre — com sucesso ou com erro.
    // Nenhum arquivo temporário sobrevive ao
    // fim desta requisição.
    // ------------------------------------------
    const arquivosParaDeletar = [videoPath, audioPath].filter(Boolean);
    if (arquivosParaDeletar.length > 0) {
      deletarArquivos(arquivosParaDeletar);
    }

  }
});

module.exports = router;
