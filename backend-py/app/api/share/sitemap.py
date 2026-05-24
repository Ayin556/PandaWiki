"""Sitemap API"""

from fastapi import APIRouter, Response
from app.api.deps import DbSession, KbId
from app.services.sitemap import SitemapService

router = APIRouter()


@router.get("")
async def get_sitemap(kb_id: KbId, db: DbSession):
    """获取Sitemap XML - 对应 Go 版 ShareSitemapHandler.GetSitemap"""
    service = SitemapService(db)
    xml_content = await service.get_sitemap(kb_id)
    return Response(content=xml_content, media_type="application/xml")
