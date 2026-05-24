"""爬虫/文档导入 API - 对应 Go 版 handler/v1/crawler.go"""

from fastapi import APIRouter
from app.api.deps import CurrentUser, DbSession
from app.services.crawler import CrawlerService

router = APIRouter()


@router.post("/parse")
async def crawler_parse(req: dict, user: CurrentUser, db: DbSession):
    """解析文档树 - 对应 Go 版 CrawlerHandler.CrawlerParse"""
    service = CrawlerService(db)
    return await service.parse_url(req)


@router.post("/export")
async def crawler_export(req: dict, user: CurrentUser, db: DbSession):
    """导出文档内容 - 对应 Go 版 CrawlerHandler.CrawlerExport"""
    service = CrawlerService(db)
    return await service.export_doc(req)


@router.get("/result")
async def crawler_result(task_id: str, user: CurrentUser, db: DbSession):
    """获取爬取结果 - 对应 Go 版 CrawlerHandler.CrawlerResult"""
    service = CrawlerService(db)
    return await service.get_result(task_id)


@router.post("/results")
async def crawler_results(task_ids: list[str], user: CurrentUser, db: DbSession):
    """批量获取爬取结果 - 对应 Go 版 CrawlerHandler.CrawlerResults"""
    service = CrawlerService(db)
    return await service.get_results(task_ids)
