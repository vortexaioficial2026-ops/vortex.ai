# ==============================================
# VORTEX.AI — Dockerfile
# ==============================================

# --- ESTÁGIO 1: instalação de dependências ---
# Usa Node 20 como base — versão LTS mais recente.
# "slim" significa imagem reduzida, sem pacotes desnecessários.
FROM node:20-slim AS deps

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de manifesto primeiro.
# Isso aproveita o cache do Docker: se o package.json
# não mudou, o npm install não roda de novo no próximo
# build. Economiza tempo e recursos.
COPY package.json package-lock.json ./

# Instala apenas dependências de produção.
# --omit=dev exclui eslint e outras ferramentas de dev.
RUN npm ci --omit=dev

# --- ESTÁGIO 2: imagem final de produção ---
FROM node:20-slim AS production

# Instala o ffmpeg no sistema operacional do container.
# Esta é a etapa que garante que a extração de áudio
# vai funcionar no Render.
# --no-install-recommends reduz o tamanho da imagem.
# rm -rf limpa o cache do apt ao final.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Define a pasta de trabalho
WORKDIR /app

# Cria o diretório temporário para uploads e processamento.
# É aqui que os vídeos e áudios ficam durante o processamento
# antes de serem deletados.
RUN mkdir -p /tmp/vortex

# Copia os node_modules prontos do estágio anterior.
# Não roda npm install de novo — reusa o trabalho já feito.
COPY --from=deps /app/node_modules ./node_modules

# Copia todo o código-fonte do projeto
COPY . .

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Informa ao Render qual porta o servidor vai escutar
EXPOSE 3000

# Comando que inicia o servidor quando o container sobe
CMD ["node", "server.js"]
