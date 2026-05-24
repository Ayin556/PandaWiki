"""RAG 嵌入模型管理"""

from langchain_openai import OpenAIEmbeddings

from app.core.config import settings


def get_embedding_model() -> OpenAIEmbeddings:
    """获取嵌入模型实例"""
    return OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        openai_api_key=settings.OPENAI_API_KEY,
    )
