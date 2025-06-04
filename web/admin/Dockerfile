FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 配置 pnpm 镜像
RUN pnpm config set registry https://registry.npmmirror.com/

# 使用非 root 用户目录
RUN pnpm config set store-dir /app/.pnpm-store

# 首先只复制依赖相关文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖，使用 BuildKit 缓存
RUN --mount=type=cache,target=/app/.pnpm-store \
    --mount=type=cache,target=/app/admin-node_modules \
    pnpm install --frozen-lockfile --prefer-offline

# 然后复制其他源代码文件
COPY . .

# 添加构建参数
ARG BUILD_TYPE=saas

# 构建应用
RUN pnpm run build

# 使用 nginx 作为生产环境的基础镜像
FROM nginx:alpine

# 只复制构建产物和配置文件
COPY --from=builder /app/dist /opt/frontend/dist
COPY --from=builder /app/server.conf /etc/nginx/conf.d/server.conf
COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/ssl /etc/nginx/ssl

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

