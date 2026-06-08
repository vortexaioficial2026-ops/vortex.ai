// ==============================================
// VORTEX.AI — src/services/ffmpeg.js
// Responsável por extrair o áudio de um vídeo
// usando o ffmpeg instalado via Dockerfile.
// ==============================================

'use strict';

const ffmpeg = require('fluent-ffmpeg');
const path   = require('path');

/**
 * Extrai o áudio de um arquivo de vídeo.
 *
 * @param {string} videoPath - Caminho absoluto do vídeo em disco.
 * @returns {Promise<string>} - Caminho absoluto do áudio .mp3 gerado.
 *
 * @example
 * const audioPath = await extrairAudio('/tmp/vortex/vortex-uuid.mp4');
 * // retorna '/tmp/vortex/vortex-uuid.mp3'
 */
function extrairAudio(videoPath) {
  return new Promise((resolve, reject) => {

    // Gera o caminho do arquivo de saída substituindo
    // a extensão do vídeo por .mp3 no mesmo diretório.
    const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');

    ffmpeg(videoPath)
      // Sem vídeo na saída — apenas o stream de áudio.
      .noVideo()

      // Codec de áudio: mp3
      .audioCodec('libmp3lame')

      // Qualidade do MP3: escala de 0 (melhor) a 9 (pior).
      // 4 é o equilíbrio ideal para voz — arquivo pequeno
      // sem perder inteligibilidade da fala.
      .audioQuality(4)

      // Mono: 1 canal. Transcrição não precisa de estéreo.
      .audioChannels(1)

      // 16kHz: taxa de amostragem ideal para reconhecimento de voz.
      // Reduz o tamanho do arquivo sem impactar a transcrição.
      .audioFrequency(16000)

      // Timeout de segurança: se o ffmpeg travar por mais de
      // 5 minutos, a operação é cancelada automaticamente.
      .inputOptions(['-t 300'])

      // Caminho do arquivo de saída
      .save(audioPath)

      // Sucesso: retorna o caminho do áudio gerado
      .on('end', () => {
        resolve(audioPath);
      })

      // Erro: retorna mensagem descritiva
      .on('error', (err) => {
        reject(new Error(
          `Falha ao extrair áudio do vídeo: ${err.message}`
        ));
      });
  });
}

module.exports = { extrairAudio };
