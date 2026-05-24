"""认证服务 - 对应 Go 版 usecase/auth.go + auth_github.go"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token
from app.models.auth import Auth, AuthConfig
from app.repositories.auth import AuthRepository, AuthConfigRepository


class AuthService:
    """认证业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.auth_repo = AuthRepository(db)
        self.auth_config_repo = AuthConfigRepository(db)

    async def get_auth(self, kb_id: str, source_type: str) -> dict:
        """获取认证配置及关联用户列表 - 对应 Go 版 GetAuth"""
        config = await self.auth_config_repo.get_by_kb_and_source_type(kb_id, source_type)
        if not config:
            return {"auth_config": None, "auth_list": []}

        auth_list = await self.auth_repo.get_by_source_type(kb_id, source_type)
        return {
            "auth_config": {
                "id": config.id,
                "kb_id": config.kb_id,
                "source_type": config.source_type,
                "auth_setting": config.auth_setting,
            },
            "auth_list": [
                {
                    "id": a.id,
                    "union_id": a.union_id,
                    "source_type": a.source_type,
                    "user_info": a.user_info,
                    "last_login_time": str(a.last_login_time) if a.last_login_time else "",
                }
                for a in auth_list
            ],
        }

    async def set_auth(self, req) -> AuthConfig:
        """设置认证配置 - 对应 Go 版 SetAuth"""
        auth_setting = {
            "client_id": req.client_id,
            "client_secret": req.client_secret,
            "proxy": req.proxy,
        }
        config = await self.auth_config_repo.upsert(req.kb_id, req.source_type, auth_setting)
        return config

    async def delete_auth(self, req) -> None:
        """删除认证配置/用户 - 对应 Go 版 DeleteAuth"""
        if req.auth_id:
            await self.auth_repo.delete_by_kb_and_id(req.kb_id, int(req.auth_id))
        else:
            # 删除整个认证配置
            config = await self.auth_config_repo.get_by_kb_and_source_type(req.kb_id, "")
            if config:
                from sqlalchemy import delete
                from app.models.auth import AuthConfig
                await self.db.execute(
                    delete(AuthConfig).where(AuthConfig.kb_id == req.kb_id)
                )
                await self.db.commit()

    async def get_share_auth(self, kb_id: str) -> dict:
        """获取前台认证信息"""
        from app.models.auth import AuthConfig
        from sqlalchemy import select

        result = await self.db.execute(
            select(AuthConfig).where(AuthConfig.kb_id == kb_id)
        )
        configs = list(result.scalars().all())
        return {
            "auth_types": [
                {"source_type": c.source_type, "auth_setting": c.auth_setting}
                for c in configs
            ],
        }

    async def login_simple(self, req: dict) -> dict:
        """简单口令登录 - 对应 Go 版 LoginSimple"""
        kb_id = req.get("kb_id", "")
        password = req.get("password", "")

        # 获取知识库访问设置中的简单认证密码
        from app.models.knowledge_base import KnowledgeBase
        from sqlalchemy import select
        result = await self.db.execute(
            select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
        )
        kb = result.scalar_one_or_none()
        if not kb:
            return {"error": "知识库不存在"}

        access_settings = kb.access_settings or {}
        simple_auth = access_settings.get("simple_auth", {})
        stored_password = simple_auth.get("password", "")

        if not stored_password or password != stored_password:
            return {"error": "密码错误"}

        # 创建或获取认证用户
        auth = await self.auth_repo.get_by_union_id(kb_id, "simple_auth_user", "simple")
        if not auth:
            auth = Auth(
                kb_id=kb_id,
                union_id="simple_auth_user",
                source_type="simple",
                user_info={"username": "简单认证用户"},
                last_login_time=datetime.now(timezone.utc),
            )
            await self.auth_repo.create_auth(auth)
        else:
            auth.last_login_time = datetime.now(timezone.utc)
            await self.db.commit()

        # 生成 Session Token
        token = create_access_token({"user_id": auth.id, "kb_id": kb_id, "type": "auth"})
        return {"token": token, "auth_id": auth.id}

    async def login_github(self, req: dict) -> dict:
        """GitHub OAuth登录 - 返回授权URL"""
        client_id = req.get("client_id", "")
        redirect_url = req.get("redirect_url", "")
        kb_id = req.get("kb_id", "")

        # 生成 state 并缓存
        state = str(uuid.uuid4())
        redis = await self._get_redis()
        if redis:
            import json
            state_info = json.dumps({
                "kb_id": kb_id,
                "redirect_url": redirect_url,
            })
            await redis.set(f"oauth:state:{state}", state_info, ex=900)  # 15分钟

        # 构建 GitHub OAuth URL
        github_url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={client_id}&state={state}&redirect_uri={redirect_url}"
        )
        return {"url": github_url, "state": state}

    async def github_callback(self, code: str, state: str) -> dict:
        """GitHub OAuth回调 - 交换 access_token 并获取用户信息"""
        import httpx

        # 获取缓存的 state 信息
        redis = await self._get_redis()
        if not redis:
            return {"error": "Redis 不可用"}

        state_data = await redis.get(f"oauth:state:{state}")
        if not state_data:
            return {"error": "State 已过期"}

        import json
        state_info = json.loads(state_data)
        kb_id = state_info.get("kb_id", "")
        redirect_url = state_info.get("redirect_url", "")

        # 获取 GitHub 认证配置
        config = await self.auth_config_repo.get_by_kb_and_source_type(kb_id, "github")
        if not config:
            return {"error": "GitHub 认证未配置"}

        client_id = config.auth_setting.get("client_id", "")
        client_secret = config.auth_setting.get("client_secret", "")

        # 交换 access_token
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                json={"client_id": client_id, "client_secret": client_secret, "code": code},
                headers={"Accept": "application/json"},
            )
            token_data = token_resp.json()
            access_token = token_data.get("access_token", "")

            if not access_token:
                return {"error": "GitHub 认证失败"}

            # 获取用户信息
            user_resp = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_data = user_resp.json()

        # 创建或更新认证用户
        union_id = str(user_data.get("id", ""))
        auth = await self.auth_repo.get_by_union_id(kb_id, union_id, "github")
        user_info = {
            "username": user_data.get("login", ""),
            "avatar_url": user_data.get("avatar_url", ""),
            "email": user_data.get("email", ""),
        }
        if auth:
            auth.user_info = user_info
            auth.last_login_time = datetime.now(timezone.utc)
            auth.ip = state_info.get("ip", "")
            await self.db.commit()
        else:
            auth = Auth(
                kb_id=kb_id,
                union_id=union_id,
                source_type="github",
                user_info=user_info,
                last_login_time=datetime.now(timezone.utc),
                ip=state_info.get("ip", ""),
            )
            await self.auth_repo.create_auth(auth)

        token = create_access_token({"user_id": auth.id, "kb_id": kb_id, "type": "auth"})
        # 清理 state
        await redis.delete(f"oauth:state:{state}")
        return {"token": token, "auth_id": auth.id, "redirect_url": redirect_url}

    async def _get_redis(self):
        """获取 Redis 连接"""
        try:
            from app.infrastructure.redis import get_redis
            return await get_redis()
        except Exception:
            return None
