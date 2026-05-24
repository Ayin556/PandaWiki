"""AI创作服务 - 对应 Go 版 usecase/creation.go"""

import json
from typing import AsyncGenerator

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.llm import llm_service


class CreationService:
    """AI创作业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def text_creation(self, req: dict) -> AsyncGenerator[str, None]:
        """AI文本创作 (SSE流式) - 对应 Go 版 TextCreation"""
        text = req.get("text", "")
        prompt = req.get("prompt", "")
        model_name = req.get("model_name", "")

        # 构建消息
        messages = [
            {"role": "system", "content": f"请对以下文本进行润色优化，保持原语言，优化语法、逻辑和表达：\n{prompt}" if prompt else "请对以下文本进行润色优化，保持原语言，优化语法、逻辑和表达："},
            {"role": "user", "content": text},
        ]

        # 流式 LLM 推理
        from langchain_core.messages import SystemMessage, HumanMessage
        lc_messages = [
            SystemMessage(content=messages[0]["content"]),
            HumanMessage(content=messages[1]["content"]),
        ]

        try:
            async for chunk in llm_service._get_chat_model(model_name, streaming=True).astream(lc_messages):
                event = json.dumps({"event": "message", "data": {"content": chunk.content}}, ensure_ascii=False)
                yield f"data: {event}\n\n"
            yield f"data: {json.dumps({'event': 'done'})}\n\n"
        except Exception as e:
            logger.error(f"Text creation failed: {e}")
            yield f"data: {json.dumps({'event': 'error', 'data': {'message': str(e)}})}\n\n"

    async def tab_complete(self, req: dict) -> dict:
        """AI Tab补全 (FIM模式) - 对应 Go 版 TabComplete"""
        prefix = req.get("prefix", "")
        suffix = req.get("suffix", "")
        model_name = req.get("model_name", "")

        # 构建 FIM 提示
        prompt = (
            f"请根据以下前文和后文，补全中间缺失的内容。只输出补全内容，不要输出其他内容。\n\n"
            f"前文:\n{prefix}\n\n"
            f"后文:\n{suffix}\n\n"
            f"补全内容:"
        )

        try:
            from langchain_core.messages import HumanMessage
            result = await llm_service._get_chat_model(model_name, streaming=False).ainvoke(
                [HumanMessage(content=prompt)]
            )
            return {"completion": result.content}
        except Exception as e:
            logger.error(f"Tab complete failed: {e}")
            return {"completion": ""}
