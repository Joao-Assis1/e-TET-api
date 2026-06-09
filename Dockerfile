# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# Apenas dependencias de produção para a imagem ficar mais leve
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Garante que a aplicação use uma porta previsível
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main"]
