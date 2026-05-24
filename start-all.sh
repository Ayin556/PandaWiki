#!/bin/bash

# PandaWiki 一键启动脚本（macOS 本地开发）
# 启动 Docker 中间件服务 + 本地后端 + 本地前端

set -e

# 确保 Go bin 目录在 PATH 中
export PATH="$PATH:/Users/ayin/go/bin"

# 加载 nvm 确保 Node.js 版本正确（需要 Node 20+）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || { echo "请安装 Node.js 20+ 和 nvm"; exit 1; }

echo "开始启动 PandaWiki 全栈应用..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "当前目录: $SCRIPT_DIR"

# 1. 检查 Docker 是否运行
echo "检查 Docker 服务..."
if ! docker info >/dev/null 2>&1; then
    echo "Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 2. 加载 .env 文件中的环境变量
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo "加载 .env 环境变量..."
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

# 3. 启动 Docker 中间件服务（使用 override 仅启动中间件，暴露端口）
echo "启动 Docker 中间件服务..."
cd "$SCRIPT_DIR"
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

echo "等待 Docker 服务启动..."
sleep 10

echo "检查 Docker 服务状态..."
docker-compose -f docker-compose.yml -f docker-compose.override.yml ps

# 4. 启动后端服务
echo "启动后端 Go 服务..."
cd "$SCRIPT_DIR/backend"

# 确保依赖是最新的
go mod tidy

# 生成 wire 依赖注入代码（如果尚未生成）
cd "$SCRIPT_DIR/backend/cmd/api"
if ! command -v wire &>/dev/null; then
    echo "安装 wire 工具..."
    go install github.com/google/wire/cmd/wire@latest
fi
wire

# 构建后端服务（注意：不要使用 -tags wireinject，否则会跳过 wire_gen.go）
cd "$SCRIPT_DIR/backend"
go build -o cmd/api/panda-wiki-api ./cmd/api/

# 使用环境变量覆盖配置，确保连接到正确的 Docker 服务
# 从 backend/ 目录运行，viper 会自动加载 config.yml
cd "$SCRIPT_DIR/backend"
nohup env \
    ENV="local" \
    PG_DSN="host=localhost user=panda-wiki password=${POSTGRES_PASSWORD:-YourSecurePassword123} dbname=panda-wiki port=5432 sslmode=disable TimeZone=Asia/Shanghai" \
    REDIS_ADDR="localhost:6379" \
    REDIS_PASSWORD="${REDIS_PASSWORD:-}" \
    NATS_PASSWORD="${NATS_PASSWORD:-}" \
    MQ_NATS_SERVER="nats://localhost:4222" \
    S3_ENDPOINT="localhost:9000" \
    S3_ACCESS_KEY="s3panda-wiki" \
    S3_SECRET_KEY="${S3_SECRET_KEY:-minioadmin123}" \
    SENTRY_ENABLED="false" \
    CADDY_ENABLED="false" \
    RAG_CT_RAG_BASE_URL="http://localhost:5050" \
    LOG_LEVEL=0 \
    HTTP_PORT=8080 \
    ./cmd/api/panda-wiki-api > backend.log 2>&1 &
BACKEND_PID=$!

echo "后端 API 服务 PID: $BACKEND_PID"

# 4.2 构建 Consumer 服务
echo "构建后端 Consumer 服务..."
cd "$SCRIPT_DIR/backend"
go build -o cmd/consumer/panda-wiki-consumer ./cmd/consumer/

# 4.3 启动 Consumer 服务（处理文档索引、RAG 同步等异步任务）
echo "启动 Consumer 服务..."
cd "$SCRIPT_DIR/backend"
nohup env \
    ENV="local" \
    PG_DSN="host=localhost user=panda-wiki password=${POSTGRES_PASSWORD:-YourSecurePassword123} dbname=panda-wiki port=5432 sslmode=disable TimeZone=Asia/Shanghai" \
    REDIS_ADDR="localhost:6379" \
    REDIS_PASSWORD="${REDIS_PASSWORD:-}" \
    NATS_PASSWORD="${NATS_PASSWORD:-}" \
    MQ_NATS_SERVER="nats://localhost:4222" \
    S3_ENDPOINT="localhost:9000" \
    S3_ACCESS_KEY="s3panda-wiki" \
    S3_SECRET_KEY="${S3_SECRET_KEY:-minioadmin123}" \
    SENTRY_ENABLED="false" \
    CADDY_ENABLED="false" \
    RAG_CT_RAG_BASE_URL="http://localhost:5050" \
    LOG_LEVEL=0 \
    ./cmd/consumer/panda-wiki-consumer > consumer.log 2>&1 &
CONSUMER_PID=$!
echo "Consumer 服务 PID: $CONSUMER_PID"

# 等待后端服务启动
sleep 5

# 检查后端是否成功启动
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "后端 API 服务启动成功"
else
    echo "后端 API 服务启动失败，查看日志: $SCRIPT_DIR/backend/backend.log"
    tail -20 backend.log
    exit 1
fi

if kill -0 $CONSUMER_PID 2>/dev/null; then
    echo "Consumer 服务启动成功"
else
    echo "Consumer 服务启动失败，查看日志: $SCRIPT_DIR/backend/consumer.log"
    tail -20 consumer.log
fi

# 5. 启动前端服务
echo "启动前端服务..."
cd "$SCRIPT_DIR/web"

# 安装前端依赖
pnpm install

# 在后台启动前端服务
echo "前端服务启动中..."
nohup pnpm dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "PandaWiki 全栈应用启动完成！"
echo ""
echo "访问地址:"
echo "   后端 API 文档: http://localhost:8080/swagger/index.html"
echo "   前端管理后台: http://localhost:5173"
echo "   前端用户界面: http://localhost:3010"
echo ""
echo "运行进程 PID:"
echo "   后端 API 服务: $BACKEND_PID"
echo "   Consumer 服务: $CONSUMER_PID"
echo "   前端服务: $FRONTEND_PID"
echo ""
echo "日志文件:"
echo "   后端日志: $SCRIPT_DIR/backend/backend.log"
echo "   Consumer日志: $SCRIPT_DIR/backend/consumer.log"
echo "   前端日志: $SCRIPT_DIR/web/frontend.log"
echo ""
echo "注意:"
echo "   - Caddy 已禁用 (CADDY_ENABLED=false)，知识库自定义端口/域名不可用"
echo "   - Sentry 已禁用 (SENTRY_ENABLED=false)，避免外部连接超时"
echo "   - Consumer 服务负责文档索引和 RAG 同步，必须运行才能使用 AI 搜索"
echo "   - 如需停止服务: kill $BACKEND_PID $CONSUMER_PID $FRONTEND_PID"
