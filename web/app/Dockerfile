FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 配置 pnpm 镜像
RUN pnpm config set registry https://registry.npmmirror.com/

# 首先只复制依赖相关文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install

# 然后复制其他源代码文件
COPY . .
COPY .env .env

# 构建应用
RUN pnpm run build

FROM node:20-alpine

COPY --from=builder /app/public ./public
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3010

ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
