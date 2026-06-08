// ==============================================
// VORTEX.AI — src/services/cleanup.js
// Responsável por deletar arquivos temporários
// após o processamento, evitando vazamento de
// disco no servidor do Render.
// ==============================================

'use strict';

const fs   = require('fs');
const path = require('path');

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/vortex';

// ==============================================
// LIMPEZA PONTUAL
// Deleta arquivos específicos de um upload.
// Chamada ao final de cada requisição, com
// sucesso ou com erro — sempre limpa.
// ==============================================

/**
 * Deleta uma lista de arquivos do disco de forma segura.
 * Não lança erro se o arquivo já não existir.
 *
 * @param {string[]} filePaths - Array com caminhos absolutos dos arquivos.
 * @returns {void}
 *
 * @example
 * deletarArquivos([
 *   '/tmp/vortex/vortex-uuid.mp4',
 *   '/tmp/vortex/vortex-uuid.mp3',
 * ]);
 */
function deletarArquivos(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Arquivo deletado: ${path.basename(filePath)}`);
      }
    } catch (err) {
      // Loga o erro mas não interrompe o fluxo.
      // A limpeza nunca deve derrubar uma requisição.
      console.warn(`[Cleanup] Falha ao deletar ${path.basename(filePath)}: ${err.message}`);
    }
  }
}

// ==============================================
// LIMPEZA GERAL — STARTUP
// Deleta todos os arquivos temporários do diretório
// ao iniciar o servidor. Resolve o problem de
// arquivos órfãos deixados por crashes anteriores.
// ==============================================

/**
 * Limpa todos os arquivos do diretório temporário.
 * Deve ser chamada uma vez ao iniciar o servidor.
 *
 * @returns {void}
 */
function limparDiretorioTemp() {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
      console.log(`[Cleanup] Diretório temporário criado: ${TEMP_DIR}`);
      return;
    }

    const arquivos = fs.readdirSync(TEMP_DIR);

    if (arquivos.length === 0) {
      console.log('[Cleanup] Diretório temporário já estava limpo.');
      return;
    }

    for (const arquivo of arquivos) {
      // Processa apenas arquivos com prefixo "vortex-"
      // para nunca deletar arquivos de outros processos.
      if (!arquivo.startsWith('vortex-')) continue;

      const caminhoCompleto = path.join(TEMP_DIR, arquivo);
      try {
        fs.unlinkSync(caminhoCompleto);
      } catch (err) {
        console.warn(`[Cleanup] Não foi possível deletar ${arquivo}: ${err.message}`);
      }
    }

    console.log(`[Cleanup] Startup: ${arquivos.length} arquivo(s) órfão(s) removido(s).`);

  } catch (err) {
    // Falha silenciosa — o servidor deve subir mesmo se a
    // limpeza inicial falhar.
    console.warn(`[Cleanup] Falha na limpeza de startup: ${err.message}`);
  }
}

module.exports = { deletarArquivos, limparDiretorioTemp };
