#FROM node:22-slim
#RUN apt-get update -y && apt-get install --no-install-recommends -y openssl
#WORKDIR /usr/src/app
#COPY package*.json ./
#RUN npm ci
#COPY ./src ./src
#COPY tsconfig.json ./
#RUN npm run build
#ENV DATABASE_URL="file:verifier.db"
#RUN npx prisma generate --schema ./src/prisma/schema.prisma
#EXPOSE 1234
#CMD ["npm", "run","start:prod"]

# --------- Build stage ---------
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./src ./src
COPY tsconfig.json ./
RUN npm run build
ENV DATABASE_URL="file:verifier.db"

# --------- Production stage ---------
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
RUN rm -rf ./node_modules/@iota/sdk-wasm/web && \
    rm -rf ./node_modules/@iota/identity-wasm/web \
    rm -rf ./node_modules/ethers/lib.commonjs
COPY --from=builder /app/dist ./dist
CMD ["node","dist/index.js"]