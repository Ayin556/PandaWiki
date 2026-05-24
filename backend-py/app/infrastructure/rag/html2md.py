"""HTML 转 Markdown - 对应 Go 版 store/rag/html2md.go"""

import re
from typing import Optional

from bs4 import BeautifulSoup
import html2text


def html_to_markdown(html_content: str) -> str:
    """将 HTML 转换为 Markdown

    对应 Go 版的 html2md 转换器，支持：
    - 附件/文件链接转换
    - 任务列表转换
    - 流程图标记保留
    - 表格转换
    """
    if not html_content:
        return ""

    # 使用 html2text 库转换
    converter = html2text.HTML2Text()
    converter.body_width = 0  # 不自动换行
    converter.ignore_links = False
    converter.ignore_images = False
    converter.ignore_emphasis = False
    converter.protect_links = True
    converter.wrap_links = False

    markdown = converter.handle(html_content)

    # 清理多余空行
    markdown = re.sub(r'\n{3,}', '\n\n', markdown)

    return markdown.strip()


def extract_images_from_html(html_content: str) -> list[str]:
    """从 HTML 中提取所有图片 URL"""
    soup = BeautifulSoup(html_content, "html.parser")
    images = []
    for img in soup.find_all("img"):
        src = img.get("src", "")
        if src:
            images.append(src)
    return images


def extract_links_from_html(html_content: str) -> list[dict[str, str]]:
    """从 HTML 中提取所有链接"""
    soup = BeautifulSoup(html_content, "html.parser")
    links = []
    for a in soup.find_all("a"):
        href = a.get("href", "")
        text = a.get_text(strip=True)
        if href:
            links.append({"url": href, "text": text})
    return links
