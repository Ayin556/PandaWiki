"""验证码 API - 兼容 @cap.js/widget 前端库

对应 Go 版 ShareCaptchaHandler，实现 PoW 验证码协议。
注意: 响应格式不使用 PWResponse 包装，因为 @cap.js/widget 库
期望原始 JSON 格式（与 Go 版 c.JSON 直接返回一致）。
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import KbId
from app.core.captcha import captcha

router = APIRouter()


class RedeemCaptchaRequest(BaseModel):
    """兑换验证码请求 - 对应 Go 版 consts.RedeemCaptchaReq"""
    token: str = ""
    solutions: list[int] = []


@router.post("/challenge")
async def create_captcha(kb_id: KbId):
    """创建验证码挑战 - 对应 Go 版 ShareCaptchaHandler.CreateCaptcha

    返回 ChallengeData 格式 (不经过 PWResponse 包装):
    {
        "token": "hex_string",
        "expires": 毫秒级时间戳,
        "challenge": {"c": 50, "s": 32, "d": 3}
    }
    """
    return captcha.create_challenge()


@router.post("/redeem")
async def redeem_captcha(req: RedeemCaptchaRequest, kb_id: KbId):
    """验证工作量证明并兑换令牌 - 对应 Go 版 ShareCaptchaHandler.RedeemCaptcha

    返回 VerificationResult 格式 (不经过 PWResponse 包装):
    {
        "success": true/false,
        "token": "id:vertoken",
        "expires": 毫秒级时间戳,
        "message": "error message"
    }
    """
    return captcha.redeem_challenge(req.token, req.solutions)
