"""验证码 API"""

from fastapi import APIRouter
from app.api.deps import DbSession

router = APIRouter()


@router.post("/challenge")
async def create_captcha(db: DbSession):
    """创建验证码挑战 - 对应 Go 版 ShareCaptchaHandler.CreateCaptcha"""
    # TODO: 实现验证码生成
    return {"captcha_id": "", "image_base64": ""}


@router.post("/redeem")
async def redeem_captcha(req: dict, db: DbSession):
    """验证验证码 - 对应 Go 版 ShareCaptchaHandler.RedeemCaptcha"""
    # TODO: 实现验证码验证
    return {"valid": False}
