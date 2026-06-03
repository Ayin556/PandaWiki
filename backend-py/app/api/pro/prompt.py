"""自定义 AI 提示词 API - 对应 Go 版 /api/pro/v1/prompt"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import select, update
from loguru import logger

from app.api.deps import CurrentUser, DbSession
from app.models.setting import Setting

router = APIRouter()

PROMPT_KEY = "prompt"


class PromptData(BaseModel):
    """提示词配置"""
    content: str = ""
    summary_content: str = ""
    enable_preset: bool = True
    enable_preset_auto_language: bool = False
    enable_preset_general_info: bool = False
    enable_preset_reference: bool = True


class UpdatePromptReq(PromptData):
    """更新提示词请求"""
    kb_id: str


@router.get("")
async def get_prompt(
    user: CurrentUser,
    db: DbSession,
    kb_id: str = Query(..., description="知识库ID"),
):
    """获取知识库提示词配置"""
    result = await db.execute(
        select(Setting).where(Setting.kb_id == kb_id, Setting.key == PROMPT_KEY)
    )
    setting = result.scalar_one_or_none()

    if not setting:
        # 返回默认值
        return {
            "content": "",
            "summary_content": "",
            "enable_preset": True,
            "enable_preset_auto_language": False,
            "enable_preset_general_info": False,
            "enable_preset_reference": True,
        }

    value = setting.value or {}
    return {
        "content": value.get("content", ""),
        "summary_content": value.get("summary_content", ""),
        "enable_preset": value.get("enable_preset", True),
        "enable_preset_auto_language": value.get("enable_preset_auto_language", False),
        "enable_preset_general_info": value.get("enable_preset_general_info", False),
        "enable_preset_reference": value.get("enable_preset_reference", True),
    }


@router.put("")
async def update_prompt(
    req: UpdatePromptReq,
    user: CurrentUser,
    db: DbSession,
):
    """更新知识库提示词配置"""
    # 检查是否已存在
    result = await db.execute(
        select(Setting).where(Setting.kb_id == req.kb_id, Setting.key == PROMPT_KEY)
    )
    setting = result.scalar_one_or_none()

    prompt_data = {
        "content": req.content,
        "summary_content": req.summary_content,
        "enable_preset": req.enable_preset,
        "enable_preset_auto_language": req.enable_preset_auto_language,
        "enable_preset_general_info": req.enable_preset_general_info,
        "enable_preset_reference": req.enable_preset_reference,
    }

    if setting:
        # 更新现有记录
        setting.value = prompt_data
        await db.commit()
        logger.info(f"Updated prompt for kb_id={req.kb_id}")
    else:
        # 创建新记录
        new_setting = Setting(
            kb_id=req.kb_id,
            key=PROMPT_KEY,
            value=prompt_data,
            description="自定义 AI 提示词配置",
        )
        db.add(new_setting)
        await db.commit()
        logger.info(f"Created prompt for kb_id={req.kb_id}")

    # 同时更新 system_prompt（供 chat 服务使用）
    if req.content:
        result2 = await db.execute(
            select(Setting).where(Setting.kb_id == req.kb_id, Setting.key == "system_prompt")
        )
        sys_setting = result2.scalar_one_or_none()
        if sys_setting:
            sys_setting.value = {"content": req.content}
        else:
            db.add(Setting(
                kb_id=req.kb_id,
                key="system_prompt",
                value={"content": req.content},
                description="系统提示词（由 prompt 同步）",
            ))
        await db.commit()

    return None
