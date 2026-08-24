FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY assets ./assets
COPY config ./config
COPY docs ./docs
COPY README.md ./
COPY docker-entrypoint.sh /usr/local/bin/metaflora-entrypoint

RUN mkdir -p /data \
  && chmod 0755 /usr/local/bin/metaflora-entrypoint

ENTRYPOINT ["metaflora-entrypoint"]
CMD ["node", "src/index.js"]
