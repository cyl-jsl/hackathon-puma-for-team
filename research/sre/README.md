# 桶緝犯 SRE 研究總結（issue #12 階段 0）

> 研究日期：2026-11-02。對應 [issue #12](https://github.com/cyl-jsl/hackathon-puma-for-team/issues/12) 第 2 節「研究題目」與階段 0。各結論的來源與算式都在下列筆記裡，這頁只寫結論與它們對 issue 的修正。標「（推論）」的是推論。

| 筆記 | 題目 |
|---|---|
| [00_現況量測.md](00_現況量測.md) | 帳號方案、每日請求、延遲、D1 用量（實測） |
| [01_cloudflare額度與部署能力.md](01_cloudflare額度與部署能力.md) | Free／Paid 額度、超額行為、Versions、gradual deployments、回退、`cf` 對應 |
| [02_D1可靠性與備份.md](02_D1可靠性與備份.md) | Time Travel、匯出、SLA、read replication、備份與演練 |
| [03_監控與告警.md](03_監控與告警.md) | Free 方案的告警、Workers Issues、外部探測 |
| [04_防濫用與管理端驗證.md](04_防濫用與管理端驗證.md) | Access、Rate Limiting、Turnstile、共享 token |
| [05_自有網域與QR網址.md](05_自有網域與QR網址.md) | 網域價格、Custom Domain、舊網址轉址 |
| [06_取代輪詢.md](06_取代輪詢.md) | visibility、ETag／304、增量查詢、Durable Objects |
| [07_SRE方法論_單人版.md](07_SRE方法論_單人版.md) | SLI／SLO、error budget、postmortem 範本 |
| [08_改善前基準.md](08_改善前基準.md) | 階段 2 改善前的單次請求成本、輪詢頁面、一個分頁一天的成本，以及重量的方法 |

## 一段話結論

帳號是 **Workers Free**。現在的流量很小，11-02 用量最高的一天也只用了 D1 讀取額度的 12%，而且一週內沒有任何錯誤。但最大的風險不是流量，是**輪詢設計和額度上限**：一個管理端分頁連開約 5.6 小時，就會用完 D1 Free 每天 500 萬列的讀取額度。超過後 D1 會**擋掉查詢、不會轉成收費**，全站 API 壞到台灣時間隔天 08:00。同一個上限，也讓「沒有驗證的公開 API」從資料完整性問題變成可用性問題：一個 curl 迴圈就能讓全站停一天。平台本身適合留下，**不需要遷移**；需要盡快做的是買自有網域，把之後印的 QR Code 網址鎖住。

## 對 issue #12 風險表的修正

| # | 風險 | issue 原判 | 研究後 | 改了什麼 |
|---|---|---|---|---|
| R2 | 輪詢成本 | 高，「2–3 個分頁撞上限」 | **最高** | 用請求數估是 2–3 個分頁；用 D1 rows read 估，**1 個分頁 3.9–5.6 小時**就撞上限（[08](08_改善前基準.md)），而且撞到後停擺，不是收費（[01](01_cloudflare額度與部署能力.md)、[06](06_取代輪詢.md)） |
| R3 | 沒有驗證 | 高（資料被亂改） | 高，**主要是可用性** | 每秒約 1.16 次請求就能用完每天 10 萬次請求額度；2.5–5 萬次回報就能用完每天 10 萬列寫入額度（[04](04_防濫用與管理端驗證.md)） |
| R1 | QR 綁 `workers.dev` | 高 | 高，**另有一個部署陷阱** | 加 Custom Domain 時，設定檔沒有明寫 `workersDev: true`，下次部署會自動關掉 `workers.dev`，舊貼紙當場失效。現在的 Worker 只接 `/api/*`，`/b/<id>` 走靜態檔，要改 `runWorkerFirst` 才能轉址（[05](05_自有網域與QR網址.md)） |
| R4 | 沒有監控 | 中 | 中 | Free 沒有錯誤率告警，Health Checks 是 0 個。可行的是 UptimeRobot 加 Workers Issues（beta，免費）推 Discord。額度用完沒有原生通知（[03](03_監控與告警.md)） |
| R5 | 沒有備份演練 | 中 | 中 | Time Travel 在 Free 只能回到 7 天內，而且只能覆蓋原庫；`cf` 沒有匯出指令，要用 wrangler 或 REST API（[02](02_D1可靠性與備份.md)） |
| R6 | 部署依賴 beta `cf` | 中 | 中，**已經發生版本漂移** | 這個 worktree 的 `bunx cf` 跑的是 beta.26，`bun.lock` 鎖的是 beta.21。`cf` 沒有 rollback 指令，要用 `deployments create` 把舊版本設成 100%（[01](01_cloudflare額度與部署能力.md)） |
| R7 | 外部依賴 | 低–中 | 低–中 | 沒有新發現 |
| R8 | 沒有 staging | 中 | 中，**另有一個漏洞** | 前端每個版本都有公開的 Version URL，打的是正式後端與 D1（推論），所以不能當 staging（[01](01_cloudflare額度與部署能力.md)） |
| R9（新） | CPU 上限 | — | 低–中 | Free 每次請求 10 ms CPU，後端每小時 p99 最高 8.1 ms。列表要轉成 JSON 的列數跟著案件數成長，超過會回 Error 1102（[00](00_現況量測.md)、[01](01_cloudflare額度與部署能力.md)） |

```
              影響大
                ▲
   R3 驗證 ●    │    ● R2 輪詢（1 分頁 5.6 h 停擺）
   R1 QR  ●     │
 ───────────────┼──────────────────► 發生機率高
   R5 備份 ●    │    ● R4 沒監控
   R9 CPU ●     │    ● R6 cf 版本漂移
                │    ● R8 Version URL
```

## 對 SLO 初稿的修正

詳見 [07](07_SRE方法論_單人版.md)。

| issue 初稿 | 問題 | 建議 |
|---|---|---|
| 回報頁可用性 99.5%，量 `/b/<id>` 與 `POST /api/reports` 的非 5xx 比例 | `/b/<id>` 是靜態檔，不經過 Worker，量不到；一個月約 200 次回報時，99.5% 只容許 1 次失敗 | 改用**外部探測成功率** 99.5%：每 5 分鐘一次，28 天 8,064 次，容許約 40 次失敗 |
| `GET /api/cases/:id` p95 < 500 ms | 量得到（Workers Analytics），但要寫明是 Worker 內部的 wall time；目前 p50 約 134 ms | 先量一週再定門檻 |
| 新案件新鮮度 < 5 秒 | 由輪詢間隔決定，目前量不到 | 降為設計目標 |
| 部署成功率 90% | 不是 SLO，比較接近 DORA 的 change fail rate；`/deploy` 回退時不打 tag，事後算不出來 | 改成追蹤指標，回退時記一行 |

Workers Logs 在 Free 只留 3 天，不夠算 28 天的 SLO；要算就用 Workers Analytics Engine（保留 3 個月）或 GraphQL Analytics。

## 第 6 節「是否遷移」：不遷移平台

| 選項 | 研究後的結論 |
|---|---|
| A. 留在 Cloudflare，加自有網域 | **採用。** 網域建議用台灣註冊商的 `.tw`（約 NT$800／年），DNS 放 Cloudflare Free zone。Cloudflare Registrar 不賣 `.tw`，而且在它那裡買的網域只能用它的 NS，等於和帳號綁死（[05](05_自有網域與QR網址.md)） |
| B. 改用 wrangler | **暫不做。** 估計要半天到一天，大部分時間花在重寫 deploy skill 與 eval。先把 `cf` 版本鎖死（[01](01_cloudflare額度與部署能力.md)） |
| C. Vercel + Supabase／Neon | 不採用，研究沒有改變原判 |
| D. 自架 | 只當練習 |
| （新）升級 Workers Paid，每月 US$5 | **可以當保險。** 同一個分頁一個月的 rows read 只占 Paid 內含額度的 2.6%，額度停擺的問題直接消失。但它只解決症狀，輪詢與限流還是要做（[01](01_cloudflare額度與部署能力.md)） |

正式決定要寫成 ADR，這需要 Jin 先回答下一節的問題。

## 需要 Jin 決定的事

1. **每月成本上限**：0 元（全部留在 Free，靠程式修正撐住）還是 US$5（Workers Paid 當保險）？
2. **網域**：要不要買、哪個名稱與 TLD。建議台灣註冊商的 `.tw`。
3. **管理端試玩要不要保留「任何人都能操作」**：入口站刻意開放試玩，加登入會打斷它。建議分兩階段：現在先用共享 token 保護 `PATCH` 與 `source=sensor`，加上限流與每案回報上限；等清潔隊真的在用時，再改用 Cloudflare Access，試玩改用獨立的示範資料（[04](04_防濫用與管理端驗證.md)）。

## 建議調整後的實作順序

成本都是 0 元（網域除外），工作量是研究筆記裡的估計。

```
 階段 1 止血（依急迫度排序）
 ├─ 1a 輪詢只在分頁可見時跑；進度頁背景放慢到 15 秒     前端，約半天   ← R2，最便宜、效果最大
 ├─ 1b 每案回報上限 + 共享 token 保護 PATCH／sensor      後端，約 1 天   ← R3
 ├─ 1c UptimeRobot 兩個監控 + Workers Issues 推 Discord  設定，約 2 小時 ← R4
 │     （需要 GET /api/health：改 API 合約，先開小 PR）
 ├─ 1d 鎖死 cf 版本；/deploy 先 bun install --frozen-lockfile  約 1 小時 ← R6
 ├─ 1e 買網域 + Custom Domain（明寫 workersDev: true）+ 頁面轉址  約 1 天 ← R1
 └─ 1f GitHub Actions 每日加密匯出 D1 + 第一次還原演練    約半天  ← R5

 階段 2 降成本
 └─ ETag／304：加單列 meta.version（migration），沒變動時只讀 1 列
     8 小時分頁從約 713 萬列降到約 5–6 萬列

 階段 3、4 維持 issue 原計畫；staging 改用 Previews + 獨立 D1，不用 Version URL
```

1a 排第一，因為它是唯一一個「一般使用情境下今天就會撞到」的風險：有人開著管理端一個上午，D1 就停擺。改動也只在前端。

## 還沒查證的事

- Free 的每日 10 萬請求，會不會把 service binding 呼叫後端那一次也算進去。GraphQL 對兩個 Worker 各記一次，所以估算時保守地算成兩次（[01](01_cloudflare額度與部署能力.md)）。
- 超過每日請求上限時回 Error 1027 還是 429，官方兩份文件說法不同（[01](01_cloudflare額度與部署能力.md)）。
- Rate Limiting binding 在 Free 能不能用，官方沒有明文，要實測（[04](04_防濫用與管理端驗證.md)）。
- D1 匯出 API 要的 token 權限、R2 與 Zero Trust 是否要綁信用卡（[02](02_D1可靠性與備份.md)、[04](04_防濫用與管理端驗證.md)）。
- `cloudflare.config.ts` 中 Custom Domain 與 `workersDev` 的確切欄位名稱：這個 worktree 沒裝套件，沒有對型別查證（[05](05_自有網域與QR網址.md)）。
- GraphQL Adaptive 資料集有抽樣，兩個資料集的 rows read 對不起來，所以每次讀的列數只能抓 500–700 列這個區間（[00](00_現況量測.md)）。
