#!/bin/bash

# PandaWiki 一键停止脚本（Python 后端版本）
# 停止 Python 后端、前端服务和 Docker 容器

echo "停止 PandaWiki (Python 后端)..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "当前目录: $SCRIPT_DIR"

# 停止 Python 后端服务
echo "停止 Python 后端服务..."
pkill -f "uvicorn app.main:app" || echo "未找到 Python 后端进程"

# 停止前端服务
echo "停止前端服务..."
pkill -f "pnpm dev" || echo "未找到前端 pnpm dev 进程"

# 恢复前端配置到 Go 后端
echo "恢复前端配置到 Go 后端 (端口 8080)..."
cp "$SCRIPT_DIR/web/admin/.env.go" "$SCRIPT_DIR/web/admin/.env" 2>/dev/null || true
cp "$SCRIPT_DIR/web/app/.env.go" "$SCRIPT_DIR/web/app/.env" 2>/dev/null || true

# 停止 Docker 服务（可选，默认不停止）
# cd "$SCRIPT_DIR"
# docker-compose down

echo ""
echo "PandaWiki (Python 后端) 已停止！"
echo ""
echo "前端配置已恢复为 Go 后端"
echo ""
echo "如需同时停止 Docker 中间件: docker-compose down"
