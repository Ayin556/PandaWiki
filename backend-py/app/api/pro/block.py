"""内容屏蔽词 API - 对应 Go 版 /api/pro/v1/block"""

from fastapi import APIRouter, Query
from loguru import logger
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.setting import Setting

router = APIRouter()

BLOCK_KEY = "block_words"


class CreateBlockWordsReq(BaseModel):
    kb_id: str
    block_words: list[str] = []


@router.get("")
async def get_block_words(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(..., description="知识库ID"),
):
    """获取屏蔽词列表"""
    result = await db.execute(
        select(Setting).where(Setting.kb_id == kb_id, Setting.key == BLOCK_KEY)
    )
    setting = result.scalar_one_or_none()

    if not setting:
        return {"words": []}

    return {"words": (setting.value or {}).get("words", [])}


@router.post("")
async def create_block_words(
    req: CreateBlockWordsReq,
    user: CurrentUser,
    db: DbSession,
):
    """创建/更新屏蔽词"""
    result = await db.execute(
        select(Setting).where(Setting.kb_id == req.kb_id, Setting.key == BLOCK_KEY)
    )
    setting = result.scalar_one_or_none()

    if setting:
        setting.value = {"words": req.block_words}
    else:
        db.add(Setting(
            kb_id=req.kb_id,
            key=BLOCK_KEY,
            value={"words": req.block_words},
            description="内容屏蔽词列表",
        ))

    await db.commit()
    logger.info(f"Updated block words for kb_id={req.kb_id}, count={len(req.block_words)}")
    return None
