FROM node:24-bookworm-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    dumb-init \
 && rm -rf /var/lib/apt/lists/*

##############################
# deps
##############################
FROM base AS deps
COPY package*.json ./

# 👉 FORZAMOS la versión de @andes/fhir
RUN npm pkg set dependencies.@andes/fhir="^1.13.0-beta"

RUN npm install

##############################
# build
##############################
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src

RUN npm run tsc

##############################
# production
##############################
FROM node:22-bookworm-slim AS production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    dumb-init \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

# 👉 mismo fix en runtime
RUN npm pkg set dependencies.@andes/fhir="^1.13.0-beta"

RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
