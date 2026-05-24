# PandaWiki Go → Python 转换指南

## 一、项目概述

将 PandaWiki Go 后端服务完整转换为 Python 3.12+ 版本，使用 FastAPI + LangChain 技术栈。

### 技术栈映射

| Go 技术 | Python 对应 |
|---------|------------|
| Echo v4 (HTTP) | FastAPI |
| GORM (ORM) | SQLAlchemy 2.0 + Alembic |
| PostgreSQL | PostgreSQL (相同) |
| Redis | Redis (相同，使用 redis-py) |
| NATS JetStream (MQ) | asyncio + NATS.py 或 Celery |
| MinIO/S3 | boto3 / minio-py |
| Wire (DI) | python-di / 手动注入 |
| JWT | PyJWT |
| raglite-go-sdk (RAG) | LangChain + 自定义 RAG |
| ip2region | ip2region (Python 版) |
| tiktoken | tiktoken (Python 原生) |
| golang-migrate | Alembic |
| spf13/viper (配置) | pydantic-settings |

---

## 二、Go 代码架构 → Python 架构映射

```
backend/                    →    backend-py/
├── cmd/                    →    app/main.py + app/cli.py
├── config/                 →    app/core/config.py
├── consts/                 →    app/core/constants.py
├── domain/                 →    app/models/          (SQLAlchemy ORM 模型)
│   ├── request/response    →    app/schemas/         (Pydantic 模型)
├── handler/                →    app/api/             (FastAPI Router)
│   ├── v1/                 →    app/api/v1/
│   └── share/              →    app/api/share/
├── middleware/              →    app/core/middleware.py
├── usecase/                →    app/services/         (业务逻辑层)
├── repo/                   →    app/repositories/     (数据访问层)
│   ├── pg/                 →    app/repositories/     (SQLAlchemy)
│   ├── cache/              →    app/repositories/cache/ (Redis)
│   ├── mq/                 →    app/repositories/mq/   (NATS)
│   └── ipdb/               →    app/repositories/ipdb/ (IP查询)
├── store/                  →    app/infrastructure/
│   ├── pg/                 →    app/infrastructure/database.py
│   ├── cache/              →    app/infrastructure/redis.py
│   ├── s3/                 →    app/infrastructure/storage.py
│   ├── rag/                →    app/infrastructure/rag.py (LangChain)
│   └── ipdb/               →    app/infrastructure/ipdb.py
├── pkg/                    →    app/external/         (第三方集成)
│   ├── anydoc/             →    app/external/anydoc/
│   ├── bot/                →    app/external/bot/
│   ├── captcha/            →    app/external/captcha/
│   ├── ratelimit/          →    app/core/ratelimit.py
│   ├── oauth/              →    app/external/oauth/
│   ├── dingtalk/           →    app/external/dingtalk/
│   ├── feishu/             →    app/external/feishu/
│   └── wecom/              →    app/external/wecom/
├── mq/                     →    app/infrastructure/mq.py
├── server/                 →    app/core/server.py
├── setup/                  →    app/core/setup.py
└── migration/              →    alembic/
```

---

## 三、API 接口完整清单

### A. 管理后台 API (`/api/v1/...`) — 47 个端点

#### A1. 应用管理 `/api/v1/app` (3个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 1 | GET | `/api/v1/app/detail` | 获取应用详情 | P1 |
| 2 | PUT | `/api/v1/app` | 更新应用配置 | P1 |
| 3 | DELETE | `/api/v1/app` | 删除应用 | P2 |

#### A2. 授权管理 `/api/v1/auth` (3个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 4 | GET | `/api/v1/auth/get` | 获取授权信息 | P1 |
| 5 | POST | `/api/v1/auth/set` | 设置授权信息 | P1 |
| 6 | DELETE | `/api/v1/auth/delete` | 删除授权信息 | P2 |

#### A3. 评论管理 `/api/v1/comment` (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 7 | GET | `/api/v1/comment` | 获取待审核评论列表 | P2 |
| 8 | DELETE | `/api/v1/comment/list` | 批量删除评论 | P2 |

#### A4. 对话管理 `/api/v1/conversation` (4个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 9 | GET | `/api/v1/conversation` | 获取对话列表 | P1 |
| 10 | GET | `/api/v1/conversation/detail` | 获取对话详情 | P1 |
| 11 | GET | `/api/v1/conversation/message/list` | 获取消息反馈列表 | P2 |
| 12 | GET | `/api/v1/conversation/message/detail` | 获取消息详情 | P2 |

#### A5. 爬虫/文档导入 `/api/v1/crawler` (4个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 13 | POST | `/api/v1/crawler/parse` | 解析文档树 | P2 |
| 14 | POST | `/api/v1/crawler/export` | 导出文档内容 | P2 |
| 15 | GET | `/api/v1/crawler/result` | 获取爬取结果 | P2 |
| 16 | POST | `/api/v1/crawler/results` | 批量获取爬取结果 | P2 |

#### A6. AI创作 `/api/v1/creation` (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 17 | POST | `/api/v1/creation/text` | AI文本创作(SSE) | P1 |
| 18 | POST | `/api/v1/creation/tab-complete` | AI Tab补全 | P2 |

#### A7. 文件上传 `/api/v1/file` (3个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 19 | POST | `/api/v1/file/upload` | 上传文件 | P1 |
| 20 | POST | `/api/v1/file/upload/url` | URL上传文件 | P1 |
| 21 | POST | `/api/v1/file/upload/anydoc` | Anydoc文件上传 | P3 |

#### A8. 知识库管理 `/api/v1/knowledge_base` (11个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 22 | POST | `/api/v1/knowledge_base` | 创建知识库 | P1 |
| 23 | GET | `/api/v1/knowledge_base/list` | 获取知识库列表 | P1 |
| 24 | GET | `/api/v1/knowledge_base/detail` | 获取知识库详情 | P1 |
| 25 | PUT | `/api/v1/knowledge_base/detail` | 更新知识库 | P1 |
| 26 | DELETE | `/api/v1/knowledge_base/detail` | 删除知识库 | P1 |
| 27 | GET | `/api/v1/knowledge_base/user/list` | 获取知识库用户 | P2 |
| 28 | POST | `/api/v1/knowledge_base/user/invite` | 邀请用户加入 | P2 |
| 29 | PATCH | `/api/v1/knowledge_base/user/update` | 更新用户权限 | P2 |
| 30 | DELETE | `/api/v1/knowledge_base/user/delete` | 移除知识库用户 | P2 |
| 31 | POST | `/api/v1/knowledge_base/release` | 创建发布版本 | P1 |
| 32 | GET | `/api/v1/knowledge_base/release/list` | 获取发布版本列表 | P2 |

#### A9. 模型管理 `/api/v1/model` (7个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 33 | GET | `/api/v1/model/list` | 获取模型列表 | P1 |
| 34 | POST | `/api/v1/model` | 创建模型 | P1 |
| 35 | PUT | `/api/v1/model` | 更新模型 | P1 |
| 36 | POST | `/api/v1/model/check` | 校验模型可用性 | P1 |
| 37 | POST | `/api/v1/model/provider/supported` | 供应商模型列表 | P2 |
| 38 | POST | `/api/v1/model/switch-mode` | 切换模型模式 | P2 |
| 39 | GET | `/api/v1/model/mode-setting` | 获取模型模式设置 | P2 |

#### A10. 栏目管理 `/api/v1/nav` (5个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 40 | GET | `/api/v1/nav/list` | 获取栏目列表 | P1 |
| 41 | POST | `/api/v1/nav/add` | 添加栏目 | P1 |
| 42 | DELETE | `/api/v1/nav/delete` | 删除栏目 | P1 |
| 43 | PATCH | `/api/v1/nav/update` | 更新栏目 | P1 |
| 44 | POST | `/api/v1/nav/move` | 移动栏目排序 | P2 |

#### A11. 文档/节点管理 `/api/v1/node` (16个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 45 | GET | `/api/v1/node/list` | 获取文档列表 | P1 |
| 46 | GET | `/api/v1/node/list/group/nav` | 按栏目分组文档列表 | P1 |
| 47 | GET | `/api/v1/node/stats` | 文档统计 | P2 |
| 48 | POST | `/api/v1/node` | 创建文档 | P1 |
| 49 | GET | `/api/v1/node/detail` | 获取文档详情 | P1 |
| 50 | PUT | `/api/v1/node/detail` | 更新文档详情 | P1 |
| 51 | POST | `/api/v1/node/summary` | 异步生成摘要 | P2 |
| 52 | POST | `/api/v1/node/summary/stream` | 流式生成摘要(SSE) | P2 |
| 53 | POST | `/api/v1/node/action` | 文档操作 | P1 |
| 54 | POST | `/api/v1/node/move` | 移动文档 | P2 |
| 55 | POST | `/api/v1/node/move/nav` | 移动到其他栏目 | P2 |
| 56 | POST | `/api/v1/node/batch_move` | 批量移动 | P2 |
| 57 | GET | `/api/v1/node/recommend_nodes` | 推荐文档 | P2 |
| 58 | POST | `/api/v1/node/restudy` | 重新学习 | P2 |
| 59 | GET | `/api/v1/node/permission` | 获取文档权限 | P2 |
| 60 | PATCH | `/api/v1/node/permission/edit` | 编辑文档权限 | P2 |

#### A12. 统计 `/api/v1/stat` (8个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 61 | GET | `/api/v1/stat/instant_count` | 实时访问计数 | P2 |
| 62 | GET | `/api/v1/stat/instant_pages` | 实时热门页面 | P2 |
| 63 | GET | `/api/v1/stat/count` | 全局统计 | P2 |
| 64 | GET | `/api/v1/stat/geo_count` | 地理分布 | P3 |
| 65 | GET | `/api/v1/stat/conversation_distribution` | 问答来源分布 | P3 |
| 66 | GET | `/api/v1/stat/hot_pages` | 热门文档 | P2 |
| 67 | GET | `/api/v1/stat/referer_hosts` | 来源域名统计 | P3 |
| 68 | GET | `/api/v1/stat/browsers` | 浏览器统计 | P3 |

#### A13. 用户管理 `/api/v1/user` (6个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 69 | POST | `/api/v1/user/login` | 用户登录 | P1 |
| 70 | GET | `/api/v1/user` | 获取当前用户信息 | P1 |
| 71 | GET | `/api/v1/user/list` | 获取用户列表 | P1 |
| 72 | POST | `/api/v1/user/create` | 创建用户 | P1 |
| 73 | PUT | `/api/v1/user/reset_password` | 重置密码 | P1 |
| 74 | DELETE | `/api/v1/user/delete` | 删除用户 | P2 |

---

### B. 前台共享 API (`/share/v1/...`) — 21 个端点

#### B1. 应用信息 `/share/v1/app` (5个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 75 | GET | `/share/v1/app/web/info` | Web应用信息 | P1 |
| 76 | GET | `/share/v1/app/widget/info` | Widget应用信息 | P2 |
| 77 | GET | `/share/v1/app/wechat/info` | 微信应用信息 | P3 |
| 78 | GET | `/share/v1/app/wechat/official_account` | 微信公众号验证 | P3 |
| 79 | POST | `/share/v1/app/wechat/official_account` | 微信公众号消息 | P3 |

#### B2. 前台认证 `/share/v1/auth` (3个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 80 | GET | `/share/v1/auth/get` | 获取认证类型 | P1 |
| 81 | POST | `/share/v1/auth/login/simple` | 简单口令登录 | P1 |
| 82 | POST | `/share/v1/auth/github` | GitHub OAuth登录 | P2 |

#### B3. 验证码 `/share/v1/captcha` (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 83 | POST | `/share/v1/captcha/challenge` | 创建验证码 | P2 |
| 84 | POST | `/share/v1/captcha/redeem` | 验证验证码 | P2 |

#### B4. 前台对话 `/share/v1/chat` (6个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 85 | POST | `/share/v1/chat/message` | Web对话(SSE流式) | P1 |
| 86 | POST | `/share/v1/chat/search` | 对话搜索 | P1 |
| 87 | POST | `/share/v1/chat/completions` | OpenAI兼容接口 | P1 |
| 88 | POST | `/share/v1/chat/widget` | Widget对话(SSE) | P2 |
| 89 | POST | `/share/v1/chat/widget/search` | Widget搜索 | P2 |
| 90 | POST | `/share/v1/chat/feedback` | 对话反馈 | P2 |

#### B5. 前台评论 `/share/v1/comment` (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 91 | POST | `/share/v1/comment` | 创建评论 | P2 |
| 92 | GET | `/share/v1/comment/list` | 获取评论列表 | P2 |

#### B6. 前台公共 `/share/v1/common` (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 93 | POST | `/share/v1/common/file/upload` | 前台上传图片 | P2 |
| 94 | POST | `/share/v1/common/file/upload/url` | 前台URL上传 | P2 |

#### B7. 前台对话详情 `/share/v1/conversation` (1个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 95 | GET | `/share/v1/conversation/detail` | 获取对话详情 | P2 |

#### B8. 前台栏目 `/share/v1/nav` (1个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 96 | GET | `/share/v1/nav/list` | 前台栏目列表 | P1 |

#### B9. 前台文档 `/share/v1/node` (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 97 | GET | `/share/v1/node/list` | 前台文档列表 | P1 |
| 98 | GET | `/share/v1/node/detail` | 前台文档详情 | P1 |

#### B10. 前台统计 `/share/v1/stat` (1个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 99 | POST | `/share/v1/stat/page` | 上报页面访问 | P2 |

---

### C. 微信/企业微信 `/share/v1/app/wechat` (7个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 100 | GET | `/share/v1/app/wechat/service` | 微信客服URL验证 | P3 |
| 101 | POST | `/share/v1/app/wechat/service` | 微信客服消息 | P3 |
| 102 | GET | `/share/v1/app/wechat/service/answer` | 微信客服对话(SSE) | P3 |
| 103 | GET | `/share/v1/app/wechat/app` | 企业微信URL验证 | P3 |
| 104 | POST | `/share/v1/app/wechat/app` | 企业微信消息 | P3 |
| 105 | GET | `/share/v1/app/wecom/ai_bot` | 企微AI Bot验证 | P3 |
| 106 | POST | `/share/v1/app/wecom/ai_bot` | 企微AI Bot消息 | P3 |

---

### D. 开放平台/回调 (2个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 107 | GET | `/share/v1/openapi/github/callback` | GitHub OAuth回调 | P2 |
| 108 | POST | `/share/v1/openapi/lark/bot/:kb_id` | 飞书机器人回调 | P3 |

---

### E. Sitemap (1个)
| # | 方法 | 路径 | 功能 | 优先级 |
|---|------|------|------|--------|
| 109 | GET | `/sitemap.xml` | Sitemap XML | P3 |

---

### F. 后台任务 (非HTTP)
| # | 类型 | 主题 | 功能 | 优先级 |
|---|------|------|------|--------|
| T1 | MQ | VectorTaskTopic | 文档向量化(upsert/delete/summary) | P1 |
| T2 | MQ | RagDocUpdateTopic | RAG文档状态更新 | P1 |
| T3 | Cron | */10 */1 * * * | 聚合小时统计 | P2 |
| T4 | Cron | 1 */1 * * * | 清理旧数据 | P2 |
| T5 | Cron | 3 0 * * * | 清理90天前小时统计 | P3 |
| T6 | Cron | 26 * * * * | 同步RAG节点状态 | P2 |
| T7 | Cron | 0 2 * * * | 清理30天前发布备份 | P3 |

---

## 四、数据库表完整清单 (27张表)

| # | 表名 | Go 模型 | 说明 | 优先级 |
|---|------|---------|------|--------|
| 1 | `knowledge_bases` | KnowledgeBase | 知识库主表 | P1 |
| 2 | `users` | User | 用户表 | P1 |
| 3 | `kb_users` | KBUsers | 知识库-用户关联 | P1 |
| 4 | `apps` | App | 应用配置表(含巨型JSONB) | P1 |
| 5 | `auths` | Auth | 认证用户表 | P1 |
| 6 | `auth_groups` | AuthGroup | 认证用户组(支持层级) | P1 |
| 7 | `auth_configs` | AuthConfig | 认证配置表 | P1 |
| 8 | `navs` | Nav | 栏目/导航表 | P1 |
| 9 | `nav_releases` | NavRelease | 栏目发布版本 | P2 |
| 10 | `nodes` | Node | 文档节点表(含JSONB) | P1 |
| 11 | `node_releases` | NodeRelease | 节点发布版本 | P1 |
| 12 | `node_release_backup` | NodeReleaseBackup | 节点发布备份 | P3 |
| 13 | `node_auth_groups` | NodeAuthGroup | 节点-权限组关联 | P2 |
| 14 | `models` | Model | AI模型配置表 | P1 |
| 15 | `conversations` | Conversation | 对话表 | P1 |
| 16 | `conversation_messages` | ConversationMessage | 对话消息表 | P1 |
| 17 | `conversation_references` | ConversationReference | 对话引用表 | P2 |
| 18 | `comments` | Comment | 评论表 | P2 |
| 19 | `contributes` | Contribute | 投稿表 | P3 |
| 20 | `settings` | Setting | 知识库设置表 | P1 |
| 21 | `system_settings` | SystemSetting | 系统设置表 | P2 |
| 22 | `stat_pages` | StatPage | 页面访问统计 | P2 |
| 23 | `stat_page_hours` | StatPageHour | 小时聚合统计 | P3 |
| 24 | `node_stats` | NodeStats | 节点PV统计 | P3 |
| 25 | `kb_releases` | KBRelease | 知识库发布版本 | P1 |
| 26 | `kb_release_node_releases` | KBReleaseNodeRelease | KB发布-节点发布关联 | P2 |
| 27 | `api_tokens` | APIToken | API令牌表 | P2 |
| 28 | `migrations` | Migration | 迁移记录表 | P1 |
| 29 | `mcp_calls` | MCPCall | MCP调用记录 | P3 |

---

## 五、核心业务流程转换优先级

### P1 — 核心功能（首先转换）
1. **用户认证**: 登录/JWT/Session
2. **知识库CRUD**: 创建/列表/详情/更新/删除
3. **文档节点CRUD**: 创建/列表/详情/更新/发布
4. **栏目导航CRUD**: 创建/列表/更新/删除/排序
5. **AI对话核心**: RAG检索 + LLM推理 + SSE流式输出
6. **模型管理**: 列表/创建/更新/获取模型
7. **文件上传**: 本地上传/URL上传/S3存储

### P2 — 重要功能（第二步转换）
1. 对话管理/历史/反馈
2. 文档导入/爬虫
3. AI创作/Tab补全
4. 统计分析
5. 评论管理
6. 用户权限管理
7. 发布版本管理

### P3 — 增强功能（第三步转换）
1. 微信/企业微信集成
2. 钉钉/飞书/Lark/Discord 机器人
3. 高级统计分析
4. GitHub OAuth
5. 验证码
6. MCP Server

---

## 六、关键 JSONB 字段结构

### `nodes.meta`
```json
{
  "summary": "文档摘要",
  "emoji": "📄",
  "content_type": "markdown"
}
```

### `nodes.permissions`
```json
{
  "answerable": "open|partial|closed",
  "visitable": "open|partial|closed",
  "visible": "open|partial|closed"
}
```

### `nodes.rag_info`
```json
{
  "status": "PENDING|RUNNING|FAILED|SUCCEEDED|REINDEX",
  "message": "状态消息",
  "synced_at": "2024-01-01T00:00:00Z"
}
```

### `knowledge_bases.access_settings`
```json
{
  "ports": [8080],
  "ssl_ports": [],
  "public_key": "",
  "private_key": "",
  "hosts": [],
  "base_url": "",
  "trusted_proxies": [],
  "simple_auth": {"password": ""},
  "enterprise_auth": {},
  "source_type": "",
  "is_forbidden": false
}
```

### `apps.settings` (巨型JSONB，含20+子结构)
```json
{
  "title": "知识库标题",
  "icon": "",
  "description": "",
  "theme": {"primary_color": "#1890ff", "mode": "light"},
  "watermark": {"setting": "hidden", "text": ""},
  "copy_setting": {"setting": "none", "text": ""},
  "chat": {"enabled": true, "show_source": true},
  "welcome": {"enabled": true, "message": ""},
  "landing_page": {"enabled": false, "nav_id": ""},
  "recommend_nodes": {"type": "nav", "nav_ids": [], "node_ids": []},
  "dingtalk_bot": {"enabled": false, "client_id": "", "client_secret": ""},
  "feishu_bot": {"enabled": false, "app_id": "", "app_secret": ""},
  "lark_bot": {"enabled": false, ...},
  "discord_bot": {"enabled": false, ...},
  "wechat_bot": {"enabled": false, ...},
  "wechat_service": {"enabled": false, ...},
  "wechat_official_account": {"enabled": false, ...},
  "openai_api_bot": {"enabled": false, "secret_key": ""},
  "wecom_ai_bot": {"enabled": false, ...},
  "mcp_server": {"enabled": false, ...},
  "feedback": {"enabled": false, ...},
  "comment": {"enabled": false, "review_enabled": false},
  "copyright": {"enabled": false, "content": ""},
  "disclaimer": {"enabled": false, "content": ""}
}
```

### `models.parameters`
```json
{
  "context_window": 4096,
  "max_tokens": 2048,
  "r1_enabled": false,
  "support_computer_use": false,
  "temperature": 0.7,
  "top_p": 1.0
}
```

---

## 七、LangChain RAG 架构设计

Go 版本使用 raglite-go-sdk，Python 版本使用 LangChain 重新实现：

```
app/infrastructure/rag/
├── __init__.py
├── base.py           # RAGService 接口
├── langchain_rag.py  # LangChain 实现
├── embeddings.py     # 嵌入模型管理
├── retriever.py      # 检索器
├── html2md.py        # HTML转Markdown
└── vectorstore.py     # 向量存储(Chroma/Qdrant/PGVector)
```

### 核心接口映射

| Go RAGService 方法 | LangChain 对应 |
|---------------------|---------------|
| `CreateKnowledgeBase()` | 创建 Collection/Index |
| `UpsertRecords(req)` | `vectorstore.add_documents()` |
| `QueryRecords(req)` | `retriever.invoke()` + rerank |
| `DeleteRecords(datasetID, docIDs)` | `vectorstore.delete(ids=)` |
| `DeleteKnowledgeBase(datasetID)` | 删除 Collection |
| `UpdateDocumentGroupIDs()` | 更新文档 metadata |
| `ListDocuments()` | `vectorstore.get()` |

---

## 八、转换步骤建议

### Phase 1: 基础框架 (1-2天)
1. 创建项目结构
2. 配置管理 (pydantic-settings)
3. 数据库连接 (SQLAlchemy 2.0 async)
4. Redis 连接
5. S3/MinIO 连接
6. 基础中间件 (CORS, 异常处理, 请求日志)

### Phase 2: 核心数据模型 (1天)
1. SQLAlchemy ORM 模型 (27张表)
2. Pydantic Schema (请求/响应)
3. Alembic 初始迁移

### Phase 3: P1 接口转换 (3-5天)
1. 用户认证 (登录/JWT)
2. 知识库 CRUD
3. 文档节点 CRUD
4. 栏目导航 CRUD
5. AI对话核心 (LangChain RAG)
6. 模型管理
7. 文件上传

### Phase 4: P2 接口转换 (3-5天)
1. 对话管理
2. 文档导入
3. AI创作
4. 统计分析
5. 评论管理
6. 权限管理

### Phase 5: P3 增强功能 (3-5天)
1. 微信集成
2. Bot 集成
3. 高级统计
4. OAuth
5. 验证码
6. MCP Server

---

## 九、环境差异注意事项

1. **Go goroutine → Python asyncio**: 所有异步操作改用 async/await
2. **Go channel → Python asyncio.Queue**: SSE 流式输出使用 StreamingResponse
3. **Wire DI → FastAPI Depends**: 依赖注入使用 FastAPI 的 Depends 机制
4. **GORM → SQLAlchemy**: JSONB 字段使用 `TypeDecorator` 或 `MutableDict.as_mutable()`
5. **golang-migrate → Alembic**: 数据库迁移改用 Alembic
6. **NATS → 可选 Celery/NATS**: 消息队列可用 Celery (Redis backend) 或 nats.py
7. **bcrypt → passlib**: 密码哈希使用 passlib[bcrypt]
8. **Echo Binder → Pydantic**: 请求绑定和验证全部由 Pydantic 自动完成
9. **Go context → Python context vars**: 使用 contextvars 传递请求级上下文
