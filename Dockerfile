# --------- Build stage ---------
    FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./src ./src
COPY tsconfig.json ./
RUN npm run build

# --------- ENV stage ---------
FROM node:22 as node-modules
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    rm -rf ./node_modules/@iota/sdk-wasm/web && \
    rm -rf ./node_modules/@iota/identity-wasm/web \
    rm -rf ./node_modules/ethers/lib.commonjs

# --------- Production stage ---------
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=node-modules /app/node_modules /app/node_modules
COPY --from=builder /app/dist ./dist
CMD ["dist/index.js"]