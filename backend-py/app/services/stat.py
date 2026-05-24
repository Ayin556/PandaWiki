"""统计服务 - 对应 Go 版 usecase/stat.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class StatService:
    """统计分析业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_page(self, req: dict) -> None:
        """记录页面访问"""
        # TODO: 实现
        pass

    async def get_instant_count(self, kb_id: str) -> list:
        """实时访问计数"""
        # TODO: 实现
        return []

    async def get_instant_pages(self, kb_id: str) -> list:
        """实时热门页面"""
        # TODO: 实现
        return []

    async def get_stat_count(self, kb_id: str, day: int) -> dict:
        """全局统计"""
        # TODO: 实现
        return {}

    async def get_geo_count(self, kb_id: str, day: int) -> dict:
        """地理分布"""
        # TODO: 实现
        return {}

    async def get_conversation_distribution(self, kb_id: str, day: int) -> list:
        """问答来源分布"""
        # TODO: 实现
        return []

    async def get_hot_pages(self, kb_id: str, day: int) -> list:
        """热门文档"""
        # TODO: 实现
        return []

    async def get_hot_referer_hosts(self, kb_id: str, day: int) -> list:
        """来源域名统计"""
        # TODO: 实现
        return []

    async def get_hot_browsers(self, kb_id: str, day: int) -> dict:
        """浏览器统计"""
        # TODO: 实现
        return {}
