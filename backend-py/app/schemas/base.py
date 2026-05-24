"""Schema 基类"""

from datetime import datetime
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Schema 基类"""
    model_config = ConfigDict(from_attributes=True)


class PaginationRequest(BaseSchema):
    """分页请求"""
    offset: int = 0
    limit: int = 20


class PaginationResponse(BaseSchema):
    """分页响应"""
    total: int = 0
    offset: int = 0
    limit: int = 20
