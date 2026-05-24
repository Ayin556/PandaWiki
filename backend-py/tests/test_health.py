"""健康检查测试"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """测试应用启动"""
    # FastAPI 默认提供 /docs 端点
    response = await client.get("/openapi.json")
    assert response.status_code == 200
