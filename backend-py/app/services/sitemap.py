"""Sitemap服务 - 对应 Go 版 usecase/sitemap.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class SitemapService:
    """Sitemap业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_sitemap(self, kb_id: str) -> str:
        """生成Sitemap XML"""
        # TODO: 实现
        return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
