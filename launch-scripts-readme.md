# PandaWiki 一键启动脚本使用说明

## 脚本介绍

此项目包含两个便捷的一键启动/停止脚本，帮助快速启动和停止完整的 PandaWiki 全栈应用。

### start-all.sh
一键启动以下服务：
- Docker 中间件服务（PostgreSQL、Redis、Qdrant、MinIO、NATS）
- Go 后端服务
- 前端服务

### stop-all.sh
一键停止所有相关服务

## 使用方法

### 启动服务
```bash
./start-all.sh
```

启动后你会看到：
- Docker 服务状态
- 后端和前端服务的进程 ID
- 访问地址
- 日志文件位置

### 停止服务
```bash
./stop-all.sh
```

## 注意事项

1. 确保 Docker Desktop 已启动
2. 确保 Node.js 20+ 和 pnpm 已安装
3. 确保 Go 1.24+ 已安装
4. 脚本会在后台运行服务，并将日志输出到相应日志文件

## 访问地址

- 后端 API 文档: http://localhost:8080/swagger/index.html
- 前端管理后台: http://localhost:5173
- 前端用户界面: 根据启动日志确认具体端口

## 日志文件

- 后端日志: `/backend/backend.log`
- 前端日志: `/web/frontend.log`

如需查看实时日志，可以使用:
```bash
tail -f backend/backend.log
tail -f web/frontend.log
```