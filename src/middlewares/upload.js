// ==============================================
// VORTEX.AI — src/middlewares/upload.js
// Configura o Multer para receber uploads de vídeo.
// ==============================================

'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

// Diretório temporário onde os uploads ficam
// durante o processamento.
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/vortex';

// Garante que o diretório existe ao iniciar o servidor.
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ==============================================
// STORAGE ENGINE
// Define onde e com qual nome o arquivo é salvo.
// Cada vídeo recebe um nome único via UUID para
// evitar colisões entre uploads simultâneos.
// Exemplo: vortex-f47ac10b-58cc-4372-a567.mp4
// ==============================================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const fileName = `vortex-${uuidv4()}${ext}`;
    cb(null, fileName);
  },
});

// ==============================================
// FILTRO DE TIPO DE ARQUIVO
// Rejeita qualquer coisa que não seja vídeo.
// Valida tanto o MIME type quanto a extensão —
// só o MIME type pode ser falsificado pelo browser.
// ==============================================
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',    // .mov
  'video/x-msvideo',   // .avi
  'video/webm',
  'video/mpeg',
  'video/x-matroska',  // .mkv
];

const ALLOWED_EXTENSIONS = [
  '.mp4', '.mov', '.avi', '.webm', '.mpeg', '.mkv',
];

const fileFilter = (_req, file, cb) => {
  const ext    = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk  = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    cb(new Error(
      `Formato não suportado: ${file.mimetype}. ` +
      `Envie um vídeo em MP4, MOV, AVI, WebM, MPEG ou MKV.`
    ));
  }
};

// ==============================================
// CONFIGURAÇÃO FINAL DO MULTER
// ==============================================
const maxFileSizeBytes = parseInt(process.env.MAX_FILE_SIZE_BYTES, 10)
  || 157_286_400; // 150MB como fallback

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize : maxFileSizeBytes,
    files    : 1, // Apenas 1 arquivo por requisição
  },
});

module.exports = upload;
