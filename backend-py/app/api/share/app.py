"""前台应用信息 API"""

from fastapi import APIRouter
from app.api.deps import DbSession, KbId
from app.services.app import AppService

router = APIRouter()


@router.get("/web/info")
async def get_web_app_info(kb_id: KbId, db: DbSession):
    """获取Web应用信息 - 对应 Go 版 ShareAppHandler.GetWebAppInfo"""
    service = AppService(db)
    return await service.get_web_app_info(kb_id)


@router.get("/widget/info")
async def get_widget_app_info(kb_id: KbId, db: DbSession):
    """获取Widget应用信息 - 对应 Go 版 ShareAppHandler.GetWidgetAppInfo"""
    service = AppService(db)
    return await service.get_widget_app_info(kb_id)


@router.get("/wechat/info")
async def wechat_app_info(kb_id: KbId, db: DbSession):
    """获取微信应用信息 - 对应 Go 版 ShareAppHandler.WechatAppInfo"""
    service = AppService(db)
    return await service.get_wechat_app_info(kb_id)
