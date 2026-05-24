"""Sitemap服务 - 对应 Go 版 usecase/sitemap.go"""

from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node
from app.models.nav import Nav


class SitemapService:
    """Sitemap业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_sitemap(self, kb_id: str) -> str:
        """生成Sitemap XML - 对应 Go 版 GetSitemap"""
        # 获取所有已发布节点
        result = await self.db.execute(
            select(Node).where(
                Node.kb_id == kb_id,
                Node.status == 2,  # 已发布
                Node.type == 2,   # 文档类型
            )
        )
        nodes = list(result.scalars().all())

        # 获取知识库信息用于构建 URL
        from app.models.knowledge_base import KnowledgeBase
        kb_result = await self.db.execute(
            select(KnowledgeBase).where(KnowledgeBase.id == kb_id)
        )
        kb = kb_result.scalar_one_or_none()
        base_url = ""
        if kb and kb.access_settings:
            base_url = kb.access_settings.get("base_url", "")

        # 构建 XML
        urls = []
        for node in nodes:
            loc = f"{base_url}/doc/{node.id}" if base_url else f"/doc/{node.id}"
            lastmod = node.edit_time.isoformat() if node.edit_time else datetime.now(timezone.utc).isoformat()
            urls.append(
                f"  <url>\n"
                f"    <loc>{loc}</loc>\n"
                f"    <lastmod>{lastmod}</lastmod>\n"
                f"    <changefreq>weekly</changefreq>\n"
                f"    <priority>0.8</priority>\n"
                f"  </url>"
            )

        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(urls) + "\n"
            + "</urlset>"
        )
        return xml
