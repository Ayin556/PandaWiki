# PandaWiki Backend - Python 版本

PandaWiki 后端服务的 Python 3.12+ 重写版本，基于 FastAPI + LangChain。

## 技术栈

- **Web 框架**: FastAPI
- **ORM**: SQLAlchemy 2.0 (async)
- **数据库迁移**: Alembic
- **RAG**: LangChain
- **缓存**: Redis (redis-py)
- **对象存储**: MinIO (minio-py)
- **消息队列**: NATS (nats-py) / Celery
- **认证**: PyJWT + passlib
- **配置**: pydantic-settings
- **API文档**: OpenAPI (FastAPI 内置)

## 快速开始

```bash
# 创建虚拟环境
python3.12 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 复制配置文件
cp .env.example .env

# 运行数据库迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload --port 8000
```

## 项目结构

```
backend-py/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── api/                    # API 路由层
│   │   ├── __init__.py
│   │   ├── deps.py             # 依赖注入
│   │   ├── v1/                 # 管理后台 V1 API
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── app.py          # 应用管理
│   │   │   ├── auth.py         # 授权管理
│   │   │   ├── comment.py      # 评论管理
│   │   │   ├── conversation.py # 对话管理
│   │   │   ├── crawler.py      # 爬虫/导入
│   │   │   ├── creation.py     # AI创作
│   │   │   ├── file.py         # 文件上传
│   │   │   ├── knowledge_base.py # 知识库管理
│   │   │   ├── model.py        # 模型管理
│   │   │   ├── nav.py          # 栏目管理
│   │   │   ├── node.py         # 文档管理
│   │   │   ├── stat.py         # 统计
│   │   │   └── user.py         # 用户管理
│   │   └── share/              # 前台共享 API
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── app.py
│   │       ├── auth.py
│   │       ├── captcha.py
│   │       ├── chat.py
│   │       ├── comment.py
│   │       ├── common.py
│   │       ├── conversation.py
│   │       ├── nav.py
│   │       ├── node.py
│   │       ├── openapi.py
│   │       ├── sitemap.py
│   │       ├── stat.py
│   │       └── wechat.py
│   ├── core/                   # 核心配置
│   │   ├── __init__.py
│   │   ├── config.py           # 配置管理
│   │   ├── constants.py        # 常量定义
│   │   ├── security.py         # 安全(JWT/密码)
│   │   ├── middleware.py       # 中间件
│   │   ├── exceptions.py       # 自定义异常
│   │   └── ratelimit.py        # 限速
│   ├── models/                 # SQLAlchemy ORM 模型
│   │   ├── __init__.py
│   │   ├── base.py             # 基类
│   │   ├── user.py
│   │   ├── knowledge_base.py
│   │   ├── app.py
│   │   ├── auth.py
│   │   ├── nav.py
│   │   ├── node.py
│   │   ├── model.py
│   │   ├── conversation.py
│   │   ├── comment.py
│   │   ├── stat.py
│   │   ├── setting.py
│   │   └── api_token.py
│   ├── schemas/                # Pydantic 请求/响应模型
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── knowledge_base.py
│   │   ├── app.py
│   │   ├── auth.py
│   │   ├── nav.py
│   │   ├── node.py
│   │   ├── model.py
│   │   ├── conversation.py
│   │   ├── chat.py
│   │   ├── comment.py
│   │   ├── stat.py
│   │   ├── creation.py
│   │   ├── crawler.py
│   │   ├── file.py
│   │   └── common.py
│   ├── services/               # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── knowledge_base.py
│   │   ├── app.py
│   │   ├── auth.py
│   │   ├── nav.py
│   │   ├── node.py
│   │   ├── model.py
│   │   ├── chat.py
│   │   ├── llm.py              # LangChain LLM
│   │   ├── conversation.py
│   │   ├── comment.py
│   │   ├── creation.py
│   │   ├── crawler.py
│   │   ├── file.py
│   │   ├── stat.py
│   │   ├── sitemap.py
│   │   ├── wechat.py
│   │   └── wecom.py
│   ├── repositories/           # 数据访问层
│   │   ├── __init__.py
│   │   ├── base.py             # 泛型基类
│   │   ├── user.py
│   │   ├── knowledge_base.py
│   │   ├── app.py
│   │   ├── auth.py
│   │   ├── nav.py
│   │   ├── node.py
│   │   ├── model.py
│   │   ├── conversation.py
│   │   ├── comment.py
│   │   ├── stat.py
│   │   ├── setting.py
│   │   └── api_token.py
│   ├── infrastructure/        # 基础设施层
│   │   ├── __init__.py
│   │   ├── database.py        # SQLAlchemy 引擎/会话
│   │   ├── redis.py           # Redis 连接池
│   │   ├── storage.py         # MinIO/S3 客户端
│   │   ├── mq.py              # 消息队列 (NATS/Celery)
│   │   ├── ipdb.py            # IP地址查询
│   │   └── rag/               # RAG 检索增强
│   │       ├── __init__.py
│   │       ├── base.py
│   │       ├── langchain_rag.py
│   │       ├── embeddings.py
│   │       ├── retriever.py
│   │       ├── html2md.py
│   │       └── vectorstore.py
│   └── external/              # 第三方集成
│       ├── __init__.py
│       ├── anydoc/            # 文档导入客户端
│       │   ├── __init__.py
│       │   └── client.py
│       ├── oauth/             # OAuth 认证
│       │   ├── __init__.py
│       │   ├── github.py
│       │   └── base.py
│       └── bot/               # 机器人集成
│           ├── __init__.py
│           ├── dingtalk.py
│           ├── feishu.py
│           ├── lark.py
│           ├── discord.py
│           ├── wechat.py
│           └── wecom.py
├── alembic/                   # 数据库迁移
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── tests/                     # 测试
│   ├── __init__.py
│   ├── conftest.py
│   ├── api/
│   ├── services/
│   └── repositories/
├── alembic.ini
├── pyproject.toml
├── requirements.txt
├── .env.example
├── CONVERSION_GUIDE.md
└── README.md
