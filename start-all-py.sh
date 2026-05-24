#!/bin/bash

# PandaWiki 一键启动脚本（Python 后端版本）
# 启动 Docker 中间件服务 + Python 后端 + 前端

set -e

# 加载 nvm 确保 Node.js 版本正确（需要 Node 20+）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || { echo "请安装 Node.js 20+ 和 nvm"; exit 1; }

echo "开始启动 PandaWiki (Python 后端)..."

# 获取脚本所在目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PY_DIR="$SCRIPT_DIR/backend-py"

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

# 3. 启动 Docker 中间件服务
echo "启动 Docker 中间件服务..."
cd "$SCRIPT_DIR"
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

echo "等待 Docker 服务启动..."
sleep 10

echo "检查 Docker 服务状态..."
docker-compose -f docker-compose.yml -f docker-compose.override.yml ps

# 4. 切换前端配置到 Python 后端
echo "切换前端配置到 Python 后端 (端口 8000)..."
cp "$SCRIPT_DIR/web/admin/.env.python" "$SCRIPT_DIR/web/admin/.env"
cp "$SCRIPT_DIR/web/app/.env.python" "$SCRIPT_DIR/web/app/.env"

# 5. 启动 Python 后端服务
echo "启动 Python 后端服务..."
cd "$BACKEND_PY_DIR"

# 检查 venv 是否存在
if [ ! -d ".venv" ]; then
    echo "Python venv 不存在，请先创建: cd backend-py && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# 数据库迁移
echo "执行数据库迁移..."
PYTHONPATH="$BACKEND_PY_DIR" .venv/bin/alembic upgrade head || echo "数据库迁移跳过（可能已是最新）"

# 启动 Python 后端
nohup .venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend-py.log 2>&1 &
BACKEND_PID=$!

echo "Python 后端服务 PID: $BACKEND_PID"

# 等待后端服务启动
sleep 5

# 检查后端是否成功启动
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Python 后端服务启动成功"
else
    echo "Python 后端服务启动失败，查看日志: $BACKEND_PY_DIR/backend-py.log"
    tail -30 backend-py.log
    exit 1
fi

# 6. 启动前端服务
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
echo "================================================"
echo "  PandaWiki (Python 后端) 启动完成！"
echo "================================================"
echo ""
echo "访问地址:"
echo "   后端 API 文档: http://localhost:8000/swagger"
echo "   前端管理后台: http://localhost:5173"
echo "   前端用户界面: http://localhost:3010"
echo ""
echo "运行进程 PID:"
echo "   Python 后端: $BACKEND_PID"
echo "   前端服务: $FRONTEND_PID"
echo ""
echo "日志文件:"
echo "   后端日志: $BACKEND_PY_DIR/backend-py.log"
echo "   前端日志: $SCRIPT_DIR/web/frontend.log"
echo ""
echo "停止服务: ./stop-all-py.sh"
