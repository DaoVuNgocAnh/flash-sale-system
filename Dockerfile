# 1. Base Image
FROM node:18-alpine AS builder

# 2. Tạo thư mục làm việc
WORKDIR /app

# 3. Copy file cấu hình package
COPY package*.json ./
COPY prisma ./prisma/

# 4. Cài đặt dependencies
RUN npm ci

# 5. Generate Prisma Client (Bắt buộc)
RUN npx prisma generate

# 6. Copy toàn bộ code vào
COPY . .

# 7. Nhận tham số build (Ví dụ: auth-service, gateway...)
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# 8. Build code (Dựa vào tham số APP_NAME)
RUN npm run build ${APP_NAME}

# ---------------------------------------------------
# 9. Production Image (Làm gọn nhẹ để chạy thật)
FROM node:18-alpine AS runner

WORKDIR /app

# Copy từ bước builder sang
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose cổng (Sẽ override bằng docker-compose)
EXPOSE 3000 3001 3002

# Lệnh chạy mặc định
CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]