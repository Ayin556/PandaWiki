#!/bin/bash

# PandaWiki 一键停止脚本
# 停止后端、前端服务和 Docker 容器

echo "🛑 停止 PandaWiki 全栈应用..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 当前目录: $SCRIPT_DIR"

# 停止后端服务（查找并杀死相关进程）
echo "🐹 停止后端 Go 服务..."
pkill -f "go run main.go" || echo "⚠️  未找到后端 Go 进程"

# 停止前端服务
echo "🌐 停止前端服务..."
pkill -f "pnpm dev" || echo "⚠️  未找到前端 pnpm dev 进程"

# 停止 Docker 服务
echo "🐳 停止 Docker 中间件服务..."
cd "$SCRIPT_DIR"
docker-compose down

echo ""
echo "✅ PandaWiki 全栈应用已停止！"
echo ""
echo "📋 如需清理日志文件，请手动删除："
echo "   - $SCRIPT_DIR/backend/backend.log"
echo "   - $SCRIPT_DIR/web/frontend.log"