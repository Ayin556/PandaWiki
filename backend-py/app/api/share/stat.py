"""前台统计 API - 对应 Go 版 handler/share/stat.go"""

from urllib.parse import urlparse

from fastapi import APIRouter, Request
from loguru import logger

from app.api.deps import DbSession
from app.services.stat import StatService

router = APIRouter()


@router.post("/page")
async def record_page(request: Request, req: dict, db: DbSession):
    """上报页面访问统计 - 对应 Go 版 ShareStatHandler.RecordPage

    Go 版从 HTTP 请求中提取 kb_id/ip/ua/referer/session_id 等元数据，
    前端仅发送 {scene, node_id}。
    """
    # 从 X-KB-ID header 获取知识库 ID（与 Go 版对齐）
    kb_id = request.headers.get("x-kb-id", "")
    req["kb_id"] = kb_id

    # 获取客户端真实 IP
    ip = request.client.host if request.client else ""
    # 检查 X-Forwarded-For / X-Real-IP
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    elif request.headers.get("x-real-ip"):
        ip = request.headers["x-real-ip"]
    req["ip"] = ip

    # 获取 User-Agent
    ua = request.headers.get("user-agent", "")
    req["ua"] = ua

    # 获取 Referer
    referer = request.headers.get("referer", "")
    req["referer"] = referer

    # 获取 session_id（优先 cookie，其次 header）
    session_id = ""
    cookie_val = request.cookies.get("x-pw-session-id", "")
    if cookie_val:
        session_id = cookie_val
    else:
        session_id = request.headers.get("x-pw-session-id", "")
    req["session_id"] = session_id

    service = StatService(db)
    await service.record_page(req)
    return {"message": "Recorded"}
