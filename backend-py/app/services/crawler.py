"""爬虫/文档导入服务 - 对应 Go 版 usecase/crawler.go"""

from sqlalchemy.ext.asyncio import AsyncSession


class CrawlerService:
    """文档导入业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def parse_url(self, req: dict) -> dict:
        """解析URL获取文档列表"""
        # TODO: 实现
        return {"list": []}

    async def export_doc(self, req: dict) -> dict:
        """导出文档为Markdown"""
        # TODO: 实现
        return {"task_id": ""}

    async def get_result(self, task_id: str) -> dict:
        """获取爬取结果"""
        # TODO: 实现
        return {}

    async def get_results(self, task_ids: list[str]) -> dict:
        """批量获取爬取结果"""
        # TODO: 实现
        return {"results": []}
