# ---------------------------------------------------
# 1. Base Image: Đổi sang SLIM (Dựa trên Debian) thay vì Alpine
# ---------------------------------------------------
FROM node:18-slim AS builder

WORKDIR /app

# Cài đặt OpenSSL cho Debian/Slim (Khác với Alpine)
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

RUN npm run build ${APP_NAME}

# ---------------------------------------------------
# 9. Production Image
# ---------------------------------------------------
FROM node:18-slim AS runner

WORKDIR /app

# Cài đặt OpenSSL cho môi trường chạy (Bắt buộc cho Prisma)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Neo biến môi trường
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000 3001 3002

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]