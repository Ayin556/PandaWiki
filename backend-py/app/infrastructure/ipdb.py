"""IP 地址查询 - 基于 ip2region"""

from dataclasses import dataclass
from typing import Optional

from loguru import logger


@dataclass
class IPAddress:
    """IP 地址信息"""
    ip: str
    country: str = ""
    province: str = ""
    city: str = ""


class IPDB:
    """IP 地址数据库 - 对应 Go 版 store/ipdb/IPDB"""

    def __init__(self, db_path: str = ""):
        self._db = None
        self._db_path = db_path
        self._init_db()

    def _init_db(self):
        """初始化 IP 数据库"""
        try:
            from ip2region import Ip2Region
            if self._db_path:
                self._db = Ip2Region(self._db_path)
            else:
                import os
                db_file = os.path.join(os.path.dirname(__file__), "ip2region.xdb")
                if os.path.exists(db_file):
                    self._db = Ip2Region(db_file)
                else:
                    logger.warning(f"IP database not found: {db_file}")
        except ImportError:
            logger.warning("ip2region not installed, IP lookup disabled")

    def lookup(self, ip: str) -> Optional[IPAddress]:
        """查询 IP 地址信息"""
        if not self._db:
            return IPAddress(ip=ip)
        try:
            result = self._db.search(ip)
            # result 格式: "国家|区域|省份|城市|ISP"
            parts = result.split("|")
            return IPAddress(
                ip=ip,
                country=parts[0] if len(parts) > 0 else "",
                province=parts[2] if len(parts) > 2 else "",
                city=parts[3] if len(parts) > 3 else "",
            )
        except Exception as e:
            logger.error(f"IP lookup failed for {ip}: {e}")
            return IPAddress(ip=ip)

    def lookup_batch(self, ips: list[str]) -> dict[str, IPAddress]:
        """批量查询 IP 地址"""
        return {ip: self.lookup(ip) for ip in ips}


ipdb = IPDB()
