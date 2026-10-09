FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime-base

ENV NODE_ENV=production

WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node plugin/assets ./plugin/assets

RUN mkdir -p /data && chown node:node /data

USER node

FROM runtime-base AS stdio
ENV TRANSPORT=stdio
CMD ["node", "dist/stdio.js"]

FROM runtime-base AS runtime
ENV TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=4311
EXPOSE 4311
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4311)+'/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
