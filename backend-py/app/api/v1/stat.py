"""统计分析 API - 对应 Go 版 handler/v1/stat.go"""

from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, DbSession
from app.services.stat import StatService

router = APIRouter()


@router.get("/instant_count")
async def get_instant_count(kb_id: str, user: CurrentUser, db: DbSession):
    """实时访问计数 - 对应 Go 版 StatHandler.GetInstantCount"""
    service = StatService(db)
    return await service.get_instant_count(kb_id)


@router.get("/instant_pages")
async def get_instant_pages(kb_id: str, user: CurrentUser, db: DbSession):
    """实时热门页面 - 对应 Go 版 StatHandler.GetInstantPages"""
    service = StatService(db)
    return await service.get_instant_pages(kb_id)


@router.get("/count")
async def stat_count(kb_id: str, day: int = 1, user: CurrentUser = None, db: DbSession = None):
    """全局统计 - 对应 Go 版 StatHandler.StatCount"""
    service = StatService(db)
    return await service.get_stat_count(kb_id, day)


@router.get("/geo_count")
async def stat_geo_count(kb_id: str, day: int = 1, user: CurrentUser = None, db: DbSession = None):
    """用户地理分布 - 对应 Go 版 StatHandler.StatGeoCountReq"""
    service = StatService(db)
    return await service.get_geo_count(kb_id, day)


@router.get("/conversation_distribution")
async def stat_conversation_distribution(kb_id: str, day: int = 1, user: CurrentUser = None, db: DbSession = None):
    """问答来源分布 - 对应 Go 版 StatHandler.StatConversationDistribution"""
    service = StatService(db)
    return await service.get_conversation_distribution(kb_id, day)


@router.get("/hot_pages")
async def stat_hot_pages(kb_id: str, day: int = 1, user: CurrentUser = None, db: DbSession = None):
    """热门文档 - 对应 Go 版 StatHandler.StatHotPages"""
    service = StatService(db)
    return await service.get_hot_pages(kb_id, day)


@router.get("/referer_hosts")
async def stat_referer_hosts(kb_id: str, day: int = 1, user: CurrentUser = None, db: DbSession = None):
    """来源域名统计 - 对应 Go 版 StatHandler.StatRefererHosts"""
    service = StatService(db)
    return await service.get_hot_referer_hosts(kb_id, day)


@router.get("/browsers")
async def stat_browsers(kb_id: str, day: int = 1, user: CurrentUser = None, db: DbSession = None):
    """浏览器统计 - 对应 Go 版 StatHandler.StatBrowsers"""
    service = StatService(db)
    return await service.get_hot_browsers(kb_id, day)
