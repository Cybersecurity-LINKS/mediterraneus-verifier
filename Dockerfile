FROM node:22-slim
RUN apt-get update -y && apt-get install --no-install-recommends -y openssl
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY ./src ./src
COPY tsconfig.json ./
RUN npm run build
ENV DATABASE_URL="file:verifier.db"
RUN npx prisma generate --schema ./src/prisma/schema.prisma
EXPOSE 1234
CMD ["npm", "run","start:prod"]