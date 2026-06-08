// ==============================================
// VORTEX.AI — src/services/gemini.js
// Responsável por enviar o áudio ao Gemini via
// OpenRouter e retornar a análise estruturada.
// ==============================================

'use strict';

const fs   = require('fs');
const path = require('path');

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL
  || 'https://openrouter.ai/api/v1';

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL
  || 'google/gemini-flash-1.5';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ==============================================
// PROMPT ESPECIALIZADO — ALMA DO PRODUTO
// Instrui o Gemini a agir como estrategista
// de conteúdo viral com output estruturado.
// ==============================================
const SYSTEM_PROMPT = `
Você é o Vortex.AI, um estrategista especialista em conteúdo viral para redes sociais.
Sua função é analisar o áudio de um vídeo e retornar uma análise completa e estruturada.

INSTRUÇÕES:
1. Transcreva o áudio com precisão.
2. Identifique os 3 melhores momentos para corte, indicando o timestamp aproximado e o motivo.
3. Calcule o Vortex Score™ de 0 a 100, representando o potencial viral do conteúdo.
4. Extraia os 3 principais ganchos (frases de impacto) do conteúdo.
5. Sugira uma legenda otimizada para Instagram/TikTok com emojis e hashtags relevantes.

FORMATO DE RESPOSTA — responda SEMPRE em JSON válido com esta estrutura exata:
{
  "transcricao": "texto completo transcrito",
  "vortex_score": 87,
  "justificativa_score": "explicação objetiva do score em 1 frase",
  "pontos_de_corte": [
    {
      "timestamp": "00:00:15",
      "titulo": "título curto do momento",
      "motivo": "por que este trecho é viral"
    }
  ],
  "ganchos": [
    "frase de impacto 1",
    "frase de impacto 2",
    "frase de impacto 3"
  ],
  "legenda_sugerida": "legenda completa com emojis e hashtags"
}

REGRAS:
- Responda APENAS com o JSON. Sem texto antes ou depois.
- Nunca quebre o formato acima.
- Se o áudio for inaudível ou vazio, retorne vortex_score 0 e explique na justificativa.
- Seja direto e objective. Sem rodeios.
`.trim();

// ==============================================
// FUNÇÃO PRINCIPAL
// ==============================================

/**
 * Analisa o áudio de um vídeo usando o Gemini via OpenRouter.
 *
 * @param {string} audioPath - Caminho absoluto do áudio .mp3 em disco.
 * @returns {Promise<Object>} - Objeto JSON com a análise estruturada.
 */
async function analisarAudio(audioPath) {

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY não configurada nas variáveis de ambiente.');
  }

  // Lê o arquivo de áudio e converte para Base64.
  // A API do Gemini exige o conteúdo do arquivo, não o caminho.
  const audioBuffer = fs.readFileSync(audioPath);
  const audioBase64 = audioBuffer.toString('base64');

  // O MIME type do áudio gerado pelo ffmpeg.js é sempre mp3.
  const audioMimeType = 'audio/mpeg';

  // ==============================================
  // MONTAGEM DO PAYLOAD
  // Formato multimodal do Gemini: texto + áudio
  // ==============================================
  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            // Parte 1: instrução em texto com o prompt especializado
            type : 'text',
            text : SYSTEM_PROMPT,
          },
          {
            // Parte 2: o áudio em Base64
            type      : 'image_url',
            image_url : {
              url: `data:${audioMimeType};base64,${audioBase64}`,
            },
          },
        ],
      },
    ],
    // Temperatura 0: respostas determinísticas e consistentes.
    // Essencial para garantir JSON válido sempre.
    temperature        : 0,
    max_tokens         : 2048,
    response_format    : { type: 'json_object' },
  };

  // ==============================================
  // CHAMADA À API
  // ==============================================
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method  : 'POST',
    headers : {
      'Authorization' : `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type'  : 'application/json',
      'HTTP-Referer'  : 'https://vortexai.app.br',
      'X-Title'       : 'Vortex.AI',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter retornou erro ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  // Extrai o conteúdo da resposta do modelo
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Resposta vazia ou inesperada do modelo.');
  }

  // Faz o parse do JSON retornado pelo Gemini.
  // Se o modelo não seguiu o formato, vai lançar erro aqui.
  let analise;
  try {
    analise = JSON.parse(content);
  } catch {
    throw new Error(
      `O modelo retornou resposta fora do formato JSON esperado: ${content}`
    );
  }

  return analise;
}

module.exports = { analisarAudio };
