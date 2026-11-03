"""每日額度用量檢查：超過 Free 方案上限的門檻就發 Discord 通知。

由 .github/workflows/quota-alert.yml 每小時執行；只用 Python 標準函式庫。

環境變數：
  CF_ACCOUNT_ID        Cloudflare 帳號 ID
  CF_ANALYTICS_TOKEN   只有 Account Analytics: Read 權限的 API token
  DISCORD_WEBHOOK_URL  沒設就只印出結果，不發通知（本機試跑用）
  FORCE_NOTIFY=1       不管有沒有超過門檻都發一則（測試通知管道用）

額度上限與重置時間見 research/sre/01_cloudflare額度與部署能力.md：
每天 UTC 00:00（台灣 08:00）歸零，超過後擋掉請求，不會轉成收費。

去重複：每小時跑一次，若只要超過門檻就通知，一天會吵十幾次。
所以只在「這次超過、但一小時前還沒超過」時通知，不需要另外存狀態。
GraphQL Analytics 會抽樣，數字是近似值。
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

LIMITS = {
    "Workers 請求": 100_000,
    "D1 rows read": 5_000_000,
    "D1 rows written": 100_000,
}
THRESHOLDS = [0.7, 0.9]

QUERY = """
query ($account: String!, $since: Time!) {
  viewer { accounts(filter: {accountTag: $account}) {
    workers: workersInvocationsAdaptive(limit: 100, filter: {datetime_geq: $since}) {
      dimensions { datetimeHour } sum { requests }
    }
    d1: d1AnalyticsAdaptiveGroups(limit: 100, filter: {datetimeHour_geq: $since}) {
      dimensions { datetimeHour } sum { rowsRead rowsWritten }
    }
  } }
}
"""


def post_json(url: str, body: dict, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "tongjifan-quota-alert", **(headers or {})},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def fetch_hourly(account: str, token: str, since: datetime) -> dict[str, dict[str, int]]:
    """回傳 {小時: {指標: 數值}}，小時是 ISO 字串。"""
    raw = post_json(
        "https://api.cloudflare.com/client/v4/graphql",
        {"query": QUERY, "variables": {"account": account, "since": since.strftime("%Y-%m-%dT%H:%M:%SZ")}},
        {"Authorization": f"Bearer {token}"},
    )
    data = json.loads(raw)
    if data.get("errors"):
        raise RuntimeError(f"GraphQL 錯誤：{data['errors']}")
    acc = data["data"]["viewer"]["accounts"][0]
    hours: dict[str, dict[str, int]] = {}
    for row in acc["workers"]:
        h = hours.setdefault(row["dimensions"]["datetimeHour"], dict.fromkeys(LIMITS, 0))
        h["Workers 請求"] += row["sum"]["requests"]
    for row in acc["d1"]:
        h = hours.setdefault(row["dimensions"]["datetimeHour"], dict.fromkeys(LIMITS, 0))
        h["D1 rows read"] += row["sum"]["rowsRead"]
        h["D1 rows written"] += row["sum"]["rowsWritten"]
    return hours


def total(hours: dict[str, dict[str, int]], before: str | None = None) -> dict[str, int]:
    """加總各小時；給 before 時只加總早於那個小時的資料。"""
    out = dict.fromkeys(LIMITS, 0)
    for hour, values in hours.items():
        if before is None or hour < before:
            for k, v in values.items():
                out[k] += v
    return out


def crossed(now: dict[str, int], prev: dict[str, int]) -> list[str]:
    """這次跨過門檻的指標。"""
    msgs = []
    for name, limit in LIMITS.items():
        for t in reversed(THRESHOLDS):
            if now[name] >= limit * t > prev[name]:
                msgs.append(f"{name} 超過 {t:.0%}")
                break
    return msgs


def report(now: dict[str, int], at: datetime) -> str:
    reset = (at + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    left = reset - at
    lines = [f"截至 {at:%Y-%m-%d %H:%M} UTC，距離歸零還有 {left.seconds // 3600} 小時 {left.seconds % 3600 // 60} 分："]
    for name, limit in LIMITS.items():
        lines.append(f"- {name}：{now[name]:,} / {limit:,}（{now[name] / limit:.1%}）")
    return "\n".join(lines)


def main() -> int:
    account = os.environ["CF_ACCOUNT_ID"]
    token = os.environ["CF_ANALYTICS_TOKEN"]
    webhook = os.environ.get("DISCORD_WEBHOOK_URL", "")
    force = os.environ.get("FORCE_NOTIFY") == "1"

    at = datetime.now(timezone.utc)
    day_start = at.replace(hour=0, minute=0, second=0, microsecond=0)
    hours = fetch_hourly(account, token, day_start)

    now = total(hours)
    # 一小時前那次執行看到的量：只算到上一個整點之前的小時
    prev_cutoff = (at - timedelta(hours=1)).replace(minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")
    prev = total(hours, before=prev_cutoff)

    body = report(now, at)
    print(body)
    alerts = crossed(now, prev)
    if alerts:
        title = "⚠️ 桶緝犯額度告警：" + "、".join(alerts) + "。超過上限會停擺到台灣時間 08:00"
    elif force:
        title = "🔔 桶緝犯額度檢查（測試通知）"
    else:
        print("沒有跨過新的門檻，不通知")
        return 0

    if not webhook:
        print("沒有 DISCORD_WEBHOOK_URL，不發通知：", title)
        return 0
    post_json(webhook, {"content": f"{title}\n{body}"})
    print("已通知 Discord：", title)
    return 0


if __name__ == "__main__":
    sys.exit(main())
