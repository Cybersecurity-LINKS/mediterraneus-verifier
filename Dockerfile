FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY ./src ./src
COPY tsconfig.json ./
RUN npm run build
ENV DATABASE_URL="file:./sql/challenges.db"
RUN npx prisma generate --schema ./src/prisma/schema.prisma
RUN npx prisma db push --schema ./src/prisma/schema.prisma
EXPOSE 1235
CMD ["npm", "run","start:prod"]