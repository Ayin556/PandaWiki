"""爬虫/文档导入服务 - 对应 Go 版 usecase/crawler.go"""

import uuid
from typing import Optional

import httpx
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.rag.html2md import html_to_markdown


class CrawlerService:
    """文档导入业务逻辑"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def parse_url(self, req: dict) -> dict:
        """解析URL获取文档列表 - 对应 Go 版 ParseURL"""
        url = req.get("url", "")
        depth = req.get("depth", 1)

        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                html = response.text

            # 解析 HTML 获取链接列表
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, "html.parser")

            links = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                text = a.get_text(strip=True)
                if href.startswith("/") or href.startswith(url):
                    full_url = href if href.startswith("http") else f"{url.rstrip('/')}/{href.lstrip('/')}"
                    links.append({"url": full_url, "title": text})

            return {"list": links[:50]}  # 限制最多50个链接
        except Exception as e:
            logger.error(f"Parse URL failed: {e}")
            return {"list": []}

    async def export_doc(self, req: dict) -> dict:
        """导出文档为Markdown - 对应 Go 版 ExportDoc"""
        url = req.get("url", "")
        task_id = str(uuid.uuid4())

        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                html = response.text

            markdown = html_to_markdown(html)

            # 缓存结果到 Redis
            try:
                from app.infrastructure.redis import get_redis
                redis = await get_redis()
                if redis:
                    import json
                    await redis.set(
                        f"crawler:task:{task_id}",
                        json.dumps({"status": "completed", "url": url, "markdown": markdown, "title": ""}),
                        ex=3600,
                    )
            except Exception:
                pass

            return {"task_id": task_id}
        except Exception as e:
            logger.error(f"Export doc failed: {e}")
            return {"task_id": ""}

    async def get_result(self, task_id: str) -> dict:
        """获取爬取结果 - 对应 Go 版 GetResult"""
        try:
            from app.infrastructure.redis import get_redis
            redis = await get_redis()
            if redis:
                import json
                data = await redis.get(f"crawler:task:{task_id}")
                if data:
                    return json.loads(data)
        except Exception:
            pass
        return {}

    async def get_results(self, task_ids: list[str]) -> dict:
        """批量获取爬取结果 - 对应 Go 版 GetResults"""
        results = []
        for task_id in task_ids:
            result = await self.get_result(task_id)
            results.append(result)
        return {"results": results}
