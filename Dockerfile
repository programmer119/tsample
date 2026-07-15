FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    ca-certificates \
    dumb-init \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pdf_renderer/package*.json ./
RUN npm ci --omit=dev
COPY pdf_renderer/server.js ./
COPY pdf_renderer/src ./src

USER node
EXPOSE 8080
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
