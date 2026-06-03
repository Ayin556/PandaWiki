"""评论服务 - 对应 Go 版 usecase/comment.go"""

import re
import uuid
from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select, func, delete, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.node import Node
from app.models.auth import Auth
from app.repositories.comment import CommentRepository


class CommentService:
    """评论业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CommentRepository(db)

    async def create_comment(self, req) -> dict:
        """创建评论 - 对应 Go 版 CreateComment"""
        # 验证节点存在
        result = await self.db.execute(
            select(Node).where(Node.id == req.node_id)
        )
        node = result.scalar_one_or_none()
        if not node:
            return {"error": "节点不存在"}

        # 生成 UUIDv7 风格 ID (使用 uuid4 作为简化实现)
        comment_id = str(uuid.uuid4())

        comment = Comment(
            id=comment_id,
            kb_id=req.kb_id,
            node_id=req.node_id,
            content=req.content,
            parent_id=getattr(req, "parent_id", ""),
            root_id=getattr(req, "root_id", ""),
            info=getattr(req, "info", {}) or {},
            pic_urls=getattr(req, "pic_urls", []) or [],
            status=0,  # 待审核
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return {"id": comment.id}

    async def get_comment_list(self, kb_id: str, offset: int, limit: int, status: int | None = None) -> dict:
        """获取评论列表(管理端) - 对应 Go 版 GetCommentListByKbID"""
        where_clauses = [Comment.kb_id == kb_id]
        if status is not None:
            where_clauses.append(Comment.status == status)

        # 查询总数
        count_result = await self.db.execute(
            select(func.count()).select_from(Comment).where(*where_clauses)
        )
        total = count_result.scalar_one()

        # 查询列表
        result = await self.db.execute(
            select(Comment)
            .where(*where_clauses)
            .order_by(Comment.created_at.desc())
            .offset(offset).limit(limit)
        )
        comments = list(result.scalars().all())

        # 补充认证用户信息
        comment_list = []
        for c in comments:
            item = {
                "id": c.id,
                "kb_id": c.kb_id,
                "node_id": c.node_id,
                "user_id": c.user_id,
                "content": c.content,
                "status": c.status,
                "parent_id": c.parent_id,
                "root_id": c.root_id,
                "info": c.info or {},
                "pic_urls": c.pic_urls or [],
                "created_at": c.created_at,
            }
            # 管理端不脱敏 IP
            comment_list.append(item)

        return {"list": comment_list, "total": total}

    async def get_comment_list_by_node_id(self, node_id: str, offset: int = 0, limit: int = 20) -> dict:
        """根据节点ID获取评论列表(前端) - 对应 Go 版 GetCommentListByNodeID"""
        count_result = await self.db.execute(
            select(func.count()).select_from(Comment)
            .where(Comment.node_id == node_id, Comment.status == 1)  # 只显示已通过
        )
        total = count_result.scalar_one()

        result = await self.db.execute(
            select(Comment)
            .where(Comment.node_id == node_id, Comment.status == 1)
            .order_by(Comment.created_at)
            .offset(offset).limit(limit)
        )
        comments = list(result.scalars().all())

        comment_list = []
        for c in comments:
            info = c.info or {}
            # 前端展示脱敏 IP
            if "ip" in info:
                info["ip"] = self._mask_ip(info["ip"])
            comment_list.append({
                "id": c.id,
                "node_id": c.node_id,
                "content": c.content,
                "status": c.status,
                "parent_id": c.parent_id,
                "root_id": c.root_id,
                "info": info,
                "pic_urls": c.pic_urls or [],
                "created_at": c.created_at,
            })

        return {"list": comment_list, "total": total}

    async def delete_comment_list(self, ids: list[str]) -> None:
        """批量删除评论 - 对应 Go 版 DeleteCommentList"""
        await self.db.execute(
            delete(Comment).where(Comment.id.in_(ids))
        )
        await self.db.commit()

    @staticmethod
    def _mask_ip(ip: str) -> str:
        """IP 地址脱敏 - 对应 Go 版 maskIP"""
        if not ip:
            return ""
        # IPv4: 保留首尾段
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.*.*.{parts[3]}"
        # IPv6 或非标准格式返回空
        return ""
