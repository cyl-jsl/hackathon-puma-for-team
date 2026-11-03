# Free 方案撐得住現在的流量，撐不住一個整天開著的管理端分頁

> 研究日期：2026-11-02。對應 issue #12「研究題目」的「Cloudflare 方案與額度」與「Workers 部署能力」。帳號已確認沒有任何 subscription，所以是 Workers Free。來源以 developers.cloudflare.com 為主，文件內容以研究當天的版本為準。標「（推論）」的是推論，不是查到的事實；查不到的寫「查不到」。實測數字是 2026-11-02 用 GraphQL Analytics 取得的。

目前用量離 Free 上限還很遠。用量最高的 11-02，請求數占每日上限 1.2%（只算前端）到 2.4%（前後端都算）；D1 rows read 占 12.0%；後端 CPU p99 最高 6.7 ms，離每次請求 10 ms 的上限還有 3.3 ms。真正的風險是輪詢。一個管理端分頁每 2 秒抓一次完整案件列表，一天會讀 **2,160 萬列**，是 D1 Free 每日上限 500 萬列的 4.3 倍。也就是說，**只要一個分頁連開約 5.6 小時，當天的 D1 就會停擺**，比 issue 原本估的「2–3 個分頁」更緊。D1 從 **2026-09-01** 起對 Free 帳號真的擋查詢，到 UTC 午夜（台灣早上 8 點）才恢復，不會自動轉成收費。升級 Workers Paid（每月 5 美元）後，同樣一個分頁一個月的用量只占 Paid 內含額度的 2.6%（rows read）和 13%（請求），不會產生超額費。部署方面，Cloudflare 平台本身有版本、百分比放量和保留 100 個版本的即時回退，beta 版 `cf` 也都有對應指令，只是沒有叫 `rollback` 的指令。目前的 `/deploy` skill 回退時要重新建置舊 tag，沒有用到平台的即時回退。

## Workers Free：每天 10 萬次請求，每次請求 10 ms CPU

Free 方案的關鍵限制是每天 **100,000 次請求**（以帳號計、UTC 午夜重置），以及每次 HTTP 請求 **10 ms CPU time**。超過請求上限回 Error 1027，CPU 超時回 Error 1102。依據如下：

| 項目 | Workers Free | Workers Paid | 來源 |
|---|---|---|---|
| 請求數 | 100,000／天 | 無上限（每月內含 1,000 萬次，超過每百萬次 0.30 美元） | [Limits](https://developers.cloudflare.com/workers/platform/limits/#account-plan-limits)；[Pricing](https://developers.cloudflare.com/workers/platform/pricing/#workers) |
| 每次請求 CPU time | 10 ms | 5 分鐘（預設 30 秒）；每月內含 3,000 萬 CPU ms，超過每百萬 ms 0.02 美元 | [Limits – CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)；[Pricing](https://developers.cloudflare.com/workers/platform/pricing/#workers) |
| 每次請求的 subrequest | 50 | 10,000 | [Limits – Subrequests](https://developers.cloudflare.com/workers/platform/limits/#subrequests) |
| Workers Logs | 200,000 筆／天，保留 3 天 | 每月 2,000 萬筆，保留 7 天 | [Pricing – Workers Logs](https://developers.cloudflare.com/workers/platform/pricing/#workers-logs) |
| 月費 | 0 | 每帳號最低 5 美元 | [Pricing](https://developers.cloudflare.com/workers/platform/pricing/) |

**請求上限與重置時間。**文件寫明「Workers Free 帳號每天 100,000 次請求，UTC 午夜重置；超過時 Cloudflare 回 Error 1027」 ([Limits – Daily requests](https://developers.cloudflare.com/workers/platform/limits/#daily-requests))。UTC 午夜就是台灣時間早上 8:00。上限以「帳號」計，前端 `tongjifan` 和後端 `tongjifan-api` 共用同一個額度（文件原文是 "Accounts on the Workers Free plan have a daily request limit"）。走 route 的 Worker 可以設成 fail open（略過 Worker）或 fail closed（回 1027 錯誤頁）。我們用的是 `workers.dev` 網址，不是 zone 上的 route，文件沒說 `workers.dev` 能不能設 fail open，**查不到**；應視為 fail closed（推論）。

**超額時使用者看到什麼。**錯誤碼表寫 1027 是「Worker exceeded free tier daily request limit」 ([Errors](https://developers.cloudflare.com/workers/observability/errors/#error-pages-generated-by-workers))。但靜態資產的計費頁另有一段專門寫給 Free 用戶：設了 `run_worker_first` 的路徑，超額後**回 429（Too Many Requests），不會退回去服務靜態檔**；沒有命中這些路徑的請求照樣由靜態資產回應 ([Static Assets – Billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/#billing))。兩頁對狀態碼的說法不一致，`/api/*` 超額時實際回 1027 頁還是 429，**要等實際撞到才能確認**。不論哪一種，結果都是 SPA 頁面打得開，但所有 `/api/*` 都失敗：地圖有桶、沒有案件，市民送不出回報（推論）。

**CPU time 與超時。**CPU time 只算程式執行，等 D1、`fetch()` 的時間不算。Free 每次 HTTP 請求 10 ms；超過時回 **Error 1102**「Worker exceeded resource limits」，分析資料裡的 outcome 是 `exceededCpu`。文件也說每個 isolate 對「偶爾」超時有些彈性，持續超時才會被中止 ([Limits – CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time))。

**service binding 會不會算兩次。**計費頁寫：Worker A 透過 service binding 呼叫 Worker B，「計為一次請求（A 的那次），CPU time 算 A 加 B 的總和」，但這段標明「Only available on Workers Standard pricing」，也就是 Paid 方案的計費方式 ([Pricing – Service bindings](https://developers.cloudflare.com/workers/platform/pricing/#service-bindings))。**Free 每日 10 萬次的額度會不會把後端那次也算進去，查不到**。實測上 GraphQL 對兩個 Worker 分別記了請求數（11-02 前端 1,213、後端 1,193），代表後端的呼叫在分析資料裡是獨立的 invocation。保守起見，下面的計算兩種情況都列，規劃時用「算兩次」（推論）。同樣地，Free 的 10 ms 是每個 invocation 各自計算，還是像 Paid 計費一樣把 A 加 B 合起來算，**查不到**。

**靜態資產不計次。**「Requests to static assets are free and unlimited」 ([Pricing 註 3](https://developers.cloudflare.com/workers/platform/pricing/#workers)；[Static Assets – Billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/#billing))。前端 `cloudflare.config.ts` 只對 `/api/*` 設了 `runWorkerFirst`，所以 HTML、JS、圖檔、`data/*.json` 都不吃請求額度，只有 `/api/*` 會叫醒 Worker。例外是開了 Workers Caching 時，從快取回應的請求要計費 ([Pricing 註 4](https://developers.cloudflare.com/workers/platform/pricing/#workers))；我們沒開。

## D1 Free：每天讀 500 萬列、寫 10 萬列，超額直接擋到 UTC 午夜

D1 Free 的每日上限是 **rows read 500 萬、rows written 10 萬**，全帳號儲存 5 GB（單一資料庫 500 MB）。超額時查詢會失敗，**不會轉成收費**，要等 UTC 午夜重置或升級 Paid。依據如下：

| 項目 | Workers Free | Workers Paid | 來源 |
|---|---|---|---|
| Rows read | 5,000,000／天 | 每月內含 250 億，超過每百萬列 0.001 美元 | [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/#billing-metrics) |
| Rows written | 100,000／天 | 每月內含 5,000 萬，超過每百萬列 1.00 美元 | 同上 |
| 儲存 | 全帳號 5 GB | 內含 5 GB，超過每 GB-月 0.75 美元 | 同上 |
| 單一資料庫大小 | 500 MB | 10 GB | [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/) |
| Time Travel 保留 | 7 天 | 30 天 | 同上 |
| 每次 Worker 呼叫的查詢數 | 50 | 1,000 | 同上 |

**怎麼算 rows read。**rows read 是查詢「掃過」的列數，不是回傳的列數；全表掃描 5,000 列就算 5,000 列，加索引可以減少掃描 ([D1 Pricing – Definitions](https://developers.cloudflare.com/d1/platform/pricing/#billing-metrics) 第 1、5 點)。後端 `GET /api/cases` 的查詢是 `cases LEFT JOIN reports ... GROUP BY c.id`，沒有 WHERE，每次都要掃完整的 `cases` 和對應的 `reports`。11-02 的實測是 599,684 ÷ 1,193 ≈ **每次後端請求 503 列**，和「每次約讀 500 列」吻合；目前資料是 224 件案件加 271 筆回報，224 + 271 = 495，量級一致（推論：掃描量約等於兩張表的列數總和）。所以每次輪詢的成本會**隨案件與回報數線性成長**。

**超額時的行為與重置時間。**2026-09-01 的 changelog 寫：「從 2026-09-01 起，Workers Free 帳號超過每日 row read 或 row write 上限時，D1 查詢會失敗；Workers Binding API 與 REST API 都回錯誤，直到 UTC 午夜重置。已存的資料不受影響，達到上限時會寄 email 通知。」錯誤訊息是 `Your account has exceeded D1's free tier daily row read limit. Upgrade to a paid plan or wait until tomorrow (midnight UTC) to continue.`（寫入超額則是 `row write limit`） ([Changelog 2026-09-01](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/))。定價頁 FAQ 也寫超額後「不能再對 D1 查詢」，升級 Paid 後「通常幾分鐘內」解除；Free 的每日額度在 00:00 UTC 重置 ([D1 Pricing – FAQ](https://developers.cloudflare.com/d1/platform/pricing/#frequently-asked-questions))。這表示 9 月 1 日以前超額不會被擋（推論，由「Beginning September 1, 2026」推得），黑客松期間的經驗不能拿來判斷現在的行為。

**對我們的程式碼來說**，後端沒有 try/catch，D1 丟出錯誤時整個請求會變成未處理的例外，前端拿到的是 Cloudflare 的錯誤頁或 500，不是有意義的 JSON（推論，依 `backend/src/index.ts` 的寫法判斷）。

## 目前用量：最高一天只用到 D1 額度的 12%

用 2026-11-02 由 GraphQL 取得的實測數字，除以上面的 Free 上限：

| 日期 | 前端請求 | 後端請求 | 請求占比（只算前端） | 請求占比（前後端都算） | D1 rows read | rows read 占比 |
|---|---|---|---|---|---|---|
| 10-27 | 172 | 183 | 172 ÷ 100,000 = 0.17% | 355 ÷ 100,000 = 0.36% | 111,163 | 111,163 ÷ 5,000,000 = 2.22% |
| 10-28 | 92 | 93 | 0.09% | 185 ÷ 100,000 = 0.19% | 44,101 | 0.88% |
| 10-29 | 235 | 199 | 0.24% | 434 ÷ 100,000 = 0.43% | 125,984 | 2.52% |
| 11-02 | 1,213 | 1,193 | 1.21% | 2,406 ÷ 100,000 = 2.41% | 599,684 | **11.99%** |

- **rows written**：最高 1,310，1,310 ÷ 100,000 = **1.31%**。
- **錯誤**：四天的 errors 都是 0，沒有出現 1027 或 1102。
- **D1 比請求先到上限**：11-02 的請求只用了 1.2–2.4%，rows read 已經用了 12%，相差 5–10 倍。只要還是「每次輪詢都讀整張表」，D1 rows read 就是第一個會撞到的上限。

## CPU：後端 p99 最多 6.7 ms，離 10 ms 還有 3.3 ms

- 後端 p50 1.6–2.7 ms，占 10 ms 上限的 16–27%。
- 後端 p99 3.9–6.7 ms，占 39–67%；剩餘空間是 10 − 6.7 = **3.3 ms**（最差日）到 10 − 3.9 = 6.1 ms。
- 前端 p99 1.3–2.7 ms，前端只做 `env.API.fetch(req)` 轉發，所以很低。
- 如果 Free 的 10 ms 和 Paid 的計費方式一樣，把前端加後端的 CPU 合起來算，最差情況是 2.7 + 6.7 = 9.4 ms，只剩 0.6 ms（推論；前文說過合併計算與否**查不到**，而且兩個 p99 不一定落在同一個請求上，這是上界）。
- 等 D1 的時間不算 CPU ([Limits – CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time))，所以後端的 CPU 主要花在把 SQL 結果轉成 JSON。`GET /api/cases` 的回應已經約 48 KB（issue #12 實測），案件數增加後 CPU 會跟著回應大小成長（推論）。文件說一般 Worker 平均約 2.2 ms，做大型 payload 解析的常見 10–20 ms ([同上](https://developers.cloudflare.com/workers/platform/limits/#cpu-time))。

## 輪詢：一個管理端分頁開滿一天，D1 用量是上限的 4.3 倍

前提：`usePoll` 每 2 秒呼叫一次 `GET /api/cases`，分頁隱藏時照樣輪詢（`frontend/src/shared/api.ts`）；每次讀約 500 列（11-02 實測 503 列）。

**一個分頁開 24 小時：**

- 輪詢次數：86,400 秒 ÷ 2 秒 = **43,200 次／天**。
- Workers 請求：只算前端 43,200 次，占 43,200 ÷ 100,000 = **43.2%**；前後端都算 86,400 次，占 **86.4%**。
- D1 rows read：43,200 × 500 = **21,600,000 列**，占 21,600,000 ÷ 5,000,000 = **432%**。
- 撞到 D1 上限的時間：5,000,000 ÷ 500 = 10,000 次輪詢，10,000 × 2 秒 = 20,000 秒 ≈ **5.6 小時**。如果當天已有 11-02 那樣的基本用量 599,684 列：(5,000,000 − 599,684) ÷ 500 ≈ 8,801 次，8,801 × 2 秒 ≈ **4.9 小時**。

**幾個分頁會撞上限：**

| 上限 | 一個分頁一天的用量 | 撞上限的分頁數 |
|---|---|---|
| Workers 請求（只算前端） | 43,200 | 100,000 ÷ 43,200 = 2.31，**第 3 個分頁** |
| Workers 請求（前後端都算） | 86,400 | 100,000 ÷ 86,400 = 1.16，**第 2 個分頁** |
| D1 rows read | 21,600,000 | 5,000,000 ÷ 21,600,000 = 0.23，**1 個分頁開 5.6 小時就到** |

換個角度看，D1 每天的預算大約是 **5.6 個「分頁小時」**：兩個分頁開 2.8 小時、或三個分頁開不到 2 小時，就會讓所有人一整天（到台灣早上 8 點）都查不到案件。

**其他會輪詢的頁面（推論，依程式碼計算）：**

- 市民進度頁（`/b/<桶>` 送出後）：每 2 秒抓 `/api/cases/:id`，同時另一個 `usePoll` 每 2 秒抓完整的 `/api/cases`，直到案件完成才停（`frontend/src/citizen/Citizen.tsx`）。所以一個停在進度頁的市民，成本至少和一個管理端分頁一樣，請求數還多一倍。
- `/map`：每 5 秒，86,400 ÷ 5 = 17,280 次，17,280 × 500 = 8,640,000 列，占 D1 上限的 173%。
- 案件數翻倍（每次約 1,000 列）時，一個分頁撞上限的時間減半，約 2.8 小時。

**換成 Workers Paid 的話（推論，用文件的內含額度計算）：**一個分頁開一個月，前端請求 43,200 × 30 = 1,296,000 次，占內含 1,000 萬次的 13%（service binding 在 Paid 只算一次，見前文）；rows read 21,600,000 × 30 = 648,000,000 列，占內含 250 億列的 2.6%。不考慮 CPU 時，要大約 10,000,000 ÷ 1,296,000 ≈ 7.7 個分頁全天開著，才會開始付請求的超額費；超過 1 個分頁的請求，每多 100 萬次是 0.30 美元。

## 部署能力：平台有版本、放量、100 版回退，`cf` 都有對應

Workers 每次改程式或設定都會產生一個 **version**；**deployment** 決定哪些版本在接流量，可以是一個版本 100%，或兩個版本按百分比分流 ([Versions & deployments](https://developers.cloudflare.com/workers/versions-and-deployments/))。依據與對應指令如下：

| 能力 | 平台行為 | wrangler | beta `cf`（1.0.0-beta.26） |
|---|---|---|---|
| 部署 | `deploy` 建立新版本並立刻 100% 上線 ([Versions & deployments](https://developers.cloudflare.com/workers/versions-and-deployments/#default-behavior)) | `wrangler deploy` | `cf deploy`（有 `--message`、`--tag`、`--dry-run`、`--prebuilt`） |
| 只上傳不部署 | 版本與部署可以拆開 ([Deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/)) | `wrangler versions upload` | `cf workers versions create`（"Upload a new Worker Version without deploying it"；有 `--preview-alias`） |
| 百分比放量 | 一個 deployment 最多兩個版本，按百分比分流 ([Gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)) | `wrangler versions deploy`（互動式） | `cf workers deployments create --strategy percentage --versions '[{"version_id":"…","percentage":10},…]'`，百分比總和要是 100 |
| 回退 | 立即建立一個指向舊版本的新 deployment；只能回到**最近 100 個**版本 ([Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/#rollbacks-limit))；2025-09-11 由 10 個放寬到 100 個 ([Changelog](https://developers.cloudflare.com/changelog/post/2025-09-11-increased-version-rollback-limit/)) | `wrangler rollback [version-id]` | **沒有 `rollback` 指令**（`cf cli search` 找「roll back worker」只回 Pages 的 rollback）。等價做法是 `cf workers deployments create`，把舊版本設成 100%；被阻擋時有 `--bypass-deployment-checks`（推論：依 `--help` 說明，例如 secret 改過之後回退） |
| 查詢 | Wrangler 可看最近 100 個版本與部署 ([Versions & deployments](https://developers.cloudflare.com/workers/versions-and-deployments/#via-wrangler)) | `wrangler versions list`、`wrangler deployments list` | `cf workers versions list`、`cf workers deployments list`（`--since`、`--until`） |
| 單一版本網址 | **Version URLs**（舊稱 preview URLs）：`<版本前綴>-<worker>.<subdomain>.workers.dev`，**使用正式環境的資源** ([Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)) | `wrangler versions upload` 會印出 | `cf workers versions create` |
| 分支預覽環境 | **Previews**：每個分支一個環境，綁定可以另外指定；Free 每個 Worker 100 個 Preview ([Previews](https://developers.cloudflare.com/workers/previews/)) | `wrangler preview`（需 4.135.0 以上） | `cf previews deploy` |
| 即時 log | — | `wrangler tail` | **不支援**，文件要你改用 `npx wrangler tail <WORKER_NAME>` ([cf reference](https://developers.cloudflare.com/cf/wrangler/reference/#commands-not-yet-supported)) |

幾個會影響我們的細節：

- **回退不會動到 D1。**「連到 Worker 的資源不會在回退時改變」，資料結構改過的話，舊版程式可能出錯 ([Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/))。這和 `/deploy` skill「migration 只能往前，舊版程式碼必須還能在新資料表上運作」的規則一致。
- **平台回退比重新建置快。**`/deploy` skill 的回退是 `git switch --detach <舊 tag>` 再跑一次建置和部署；平台回退直接把舊版本設成 100%，不用建置（推論：舊 tag 對應的版本，只要還在最近 100 個以內，都可以這樣回退）。
- **兩個 Worker 分開放量會版本錯位。**前端新版透過 service binding 呼叫後端時，可能打到後端的舊版本；文件建議用 version overrides 指定下游版本 ([Gradual deployments – Version skew](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/#version-skew))。同一個使用者連續的請求（包括重新整理和抓靜態檔）也可能落在不同版本，要固定得開 version affinity ([同上](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/#version-skew-within-a-worker))。
- **Version URL 公開，而且用正式資料。**沒有設定時跟著 `workers_dev`：`workers_dev` 開著就預設啟用 ([Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/#enable-or-disable-version-urls))。後端設了 `workersDev: false`、`previewUrls: false`，所以沒有；前端沒設 `previewUrls`、`workers.dev` 是開的，所以**前端每個版本都有一個公開的 Version URL**（推論）。它打的是正式的後端與 D1，不能拿來當 staging ([Compare workflows](https://developers.cloudflare.com/workers/previews/compare-workflows/#version-urls))。要做 staging，文件建議用 Previews，再綁一個獨立的 D1；不過「從 Preview 呼叫 service binding，打的是被綁 Worker 的正式部署」 ([Previews](https://developers.cloudflare.com/workers/previews/#settings-and-isolation))，所以前端的 Preview 還是會打到正式後端，要後端也有自己的 Preview 或另一個 Worker 才能隔離（推論）。

## CI 部署：GitHub Actions 加 API token 可行，Workers Builds 對 `cf` 設定沒有文件

**GitHub Actions。**`cf` 有官方 CI 文件：把 `cf` 裝成 devDependency 固定版本，repo secrets 放 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`，PR 跑 `cf build` 加 `cf deploy --prebuilt --dry-run`，push 到 main 才真的部署；只有最後一步拿得到 secret，所以 fork 來的 PR 也能跑檢查 ([Use cf in CI](https://developers.cloudflare.com/cf/ci/))。`CLOUDFLARE_API_TOKEN` 的優先權高於本機登入，`CLOUDFLARE_ACCOUNT_ID` 決定帳號 ([同上 – Provide credentials](https://developers.cloudflare.com/cf/ci/#provide-credentials))，所以 CI 不需要本機的帳號綁定檔。非互動模式下，破壞性指令沒加 `--force` 會印 `Aborted.`，**但 exit code 是 0** ([同上 – non-interactive](https://developers.cloudflare.com/cf/ci/#understand-non-interactive-behavior))，CI 腳本不能只看 exit code 判斷成功。wrangler 版的做法相同，官方 action 是 `cloudflare/wrangler-action@v4`，token 用「Edit Cloudflare Workers」範本並限縮到單一帳號 ([GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/))。D1 migration 要在 CI 跑的話，token 還需要 D1 的編輯權限（推論；文件只列了 Workers 範本）。

**Workers Builds（Cloudflare 自己的 Git 整合）。**Free 每月 3,000 建置分鐘、同時 1 個建置、單次 20 分鐘上限、建置紀錄保留 90 天 ([Builds – Limits & pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/))。預設部署指令是 `npx wrangler deploy`，可以改；文件要求 dashboard 上的 Worker 名稱和「Wrangler 設定檔」的 `name` 一致，否則建置失敗 ([Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)；[Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/))。只有 `cloudflare.config.ts`、沒有 `wrangler.jsonc` 的專案能不能過這個檢查，**查不到**。我們的兩個 Worker 在同一個 repo 的 `backend/`、`frontend/`，得各連一次，而且要保證後端先部署，Workers Builds 不保證這個順序（推論）。所以目前選 GitHub Actions 比較單純。

## 改回 wrangler.jsonc：大約半天到一天，主要成本在 deploy skill 和 eval

（本節整節為初判，沒有實際動手試。）

`cf` 標明還在 beta，「指令、設定與 Build Output 在正式版前都可能變」 ([Cloudflare CLI](https://developers.cloudflare.com/cf/))。反過來，`cf` 讀不到 `wrangler.jsonc`，wrangler 也讀不到 `cloudflare.config.ts` ([cf for Wrangler users](https://developers.cloudflare.com/cf/wrangler/#run-project-commands-only-after-you-migrate))。官方只提供 wrangler → `cf` 的 `cf migrate`，**查不到**反方向的轉換工具，要手寫。要改的東西：

| 項目 | 工作量 | 依據 |
|---|---|---|
| 兩個設定檔 | 小：各約 20 行，欄位有官方對照表（如 `previewUrls` ↔ `preview_urls`）；後端的 `entrypoint` 是 `import ... with { type: "cf-worker" }`，要改成 `main` 路徑 | [Wrangler to cf reference](https://developers.cloudflare.com/cf/wrangler/reference/) |
| `package.json` scripts | 小：`cf build/deploy` → `wrangler deploy`；`cf workers types` → `wrangler types`；`cf d1 migrations apply <id>` → `wrangler d1 migrations apply tongjifan --remote` | `backend/package.json`、`frontend/package.json` |
| D1 migration 紀錄 | 不用動：`cf d1 migrations apply` 的說明寫它和 `wrangler d1 migrations apply` 「wire-compatible：同樣的資料表格式、同樣的紀錄名稱、同樣的順序」 | `cf cli search` 的指令摘要（beta.26） |
| 本機開發 | 中：兩邊都用 `@cloudflare/vite-plugin` 的 beta 版，要換回讀 `wrangler.jsonc` 的穩定版並重測前後端 dev | Vite 外掛文件說一般使用者應該用 Wrangler 設定檔 ([Programmatic configuration](https://developers.cloudflare.com/workers/vite-plugin/reference/programmatic-configuration/)) |
| 帳號選擇 | 小：`cf` 的資料夾綁定改成 `wrangler.jsonc` 的 `account_id` 或 `CLOUDFLARE_ACCOUNT_ID` | [cf for Wrangler users](https://developers.cloudflare.com/cf/wrangler/#use-cf-alongside-a-wrangler-project) |
| `/deploy` skill 與 eval | **大**：skill 每一步都寫死 `bunx cf ...`，CLAUDE.md 規定改 skill 要重跑 `evals/deploy-skill/`，每個案例都要 1.00 | `.claude/skills/deploy/SKILL.md`、CLAUDE.md |
| 文件 | 小：CLAUDE.md、ARCHITECTURE.md、README 裡的 `cf` 指令 | — |

另一條路是留在 `cf`，但把 R6 的風險收斂掉，見下一節。

## 對桶緝犯的意義

### R2（輪詢成本）：比 issue 估的更嚴重，D1 rows read 是第一道牆

- **修正 issue 的估計。**issue 寫「2–3 個分頁就會撞到上限」，是用請求數估的。用 D1 rows read 算，**1 個分頁連開約 5.6 小時**就會讓當天所有 API 失效，到台灣早上 8 點才恢復。D1 從 2026-09-01 起才真的擋，所以黑客松期間沒遇到不代表現在安全。
- **最便宜的保險：升級 Workers Paid（每月 5 美元）。**同樣用量只占 Paid 內含額度的 2.6%（rows read）和 13%（請求），超額時是計費而不是停擺。這不解決線性成長，但把「停擺」換成「多付幾毛錢」。是否升級由 Jin 決定。
- **程式面要做的（不論升不升級）：**
  1. 分頁隱藏時停止輪詢（`document.visibilityState`），擋掉「忘了關的分頁」。
  2. 增量查詢：`GET /api/cases?since=<更新時間>` 只回有變動的案件，`cases` 要有更新時間欄位加索引，讓 rows read 不再隨總案件數成長。這會改 API 合約，要照 CLAUDE.md 的規則先合併合約 PR。
  3. 市民進度頁不要另外輪詢完整列表；`/map` 可以拉長間隔或也做增量。
  4. 後端對 D1 錯誤 try/catch，回 503 與明確訊息，前端顯示「今日額度用完」，不要讓使用者看到 Cloudflare 錯誤頁。
- **監控（接 R4）：**每天用 GraphQL 抓 rows read，超過 50%（250 萬列）就告警；D1 本身也會在達到上限時寄 email ([Changelog 2026-09-01](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/))，但那時已經停擺了。
- **CPU 暫時不用擔心**，但回應大小會隨案件數成長；做了增量查詢之後 CPU 也會跟著下降（推論）。

### R6（部署依賴 beta `cf` 與本機）：平台能力夠，缺的是「不靠本機」的路徑

- **`bunx cf` 在沒裝依賴的工作區會跑最新 beta。**這次研究在這個 worktree（沒有 `node_modules`）執行 `bunx cf --version`，得到 **1.0.0-beta.26**，但兩邊的 `bun.lock` 鎖的是 **1.0.0-beta.21**。`/deploy` skill 步驟 1 的 `bunx cf auth whoami` 和 `deployments list` 在 `bun install` 之前就執行，用的可能是和鎖檔不同的版本；步驟 5 有先 `bun install --frozen-lockfile`，部署本身用的是鎖定的版本（推論）。建議把 `bun install --frozen-lockfile` 移到步驟 1 之前。另外，`package.json` 寫的是 `^1.0.0-beta.5`、`^1.0.0-beta.20`，下次 `bun install` 更新鎖檔時會拉到新的 beta；beta 的設定格式可能改，建議改成精確版本。
- **把部署搬到 GitHub Actions。**用官方的 `cf` CI 流程加上限縮到單一帳號的 API token，就不再依賴本機的帳號綁定檔與登入狀態，換機器也不會卡住。可以保留「Jin 手動觸發」（`workflow_dispatch` 加 environment 核准），符合 CLAUDE.md「只由部署負責人執行」的規則（推論）。要注意 `cf` 在 CI 遇到破壞性指令時印 `Aborted.` 但回傳 0 ([Use cf in CI](https://developers.cloudflare.com/cf/ci/#understand-non-interactive-behavior))。
- **回退改用平台回退。**`cf workers deployments create` 把上一個版本設成 100%，幾秒內完成，不用重新建置；`deploy-*` tag 繼續當作「哪個版本對應哪個 commit」的紀錄（`cf deploy --message` 已經寫入短 SHA）。平台保留最近 100 個版本，一人維護的頻率足夠。改 skill 時要重跑 eval。
- **staging（接 R8）：**Version URL 用的是正式 D1，不能當 staging；前端目前每個版本都有公開的 Version URL，建議設 `previewUrls: false`，或者確認它沒有被誤用。真正的 staging 要用 Previews 加獨立的 D1，而且後端也要有對應的 Preview（推論）。
- **百分比放量對我們價值低。**流量一天只有幾百到兩千次，10% 放量幾乎看不到訊號，還要處理前後端版本錯位；先做「CI 部署 + 平台回退」就夠（推論）。
- **改回 wrangler.jsonc 目前不划算。**成本約半天到一天，主要是重寫 deploy skill 與 eval；鎖定 `cf` 版本、改用 CI 部署，就能解決 R6 大部分的問題。等 `cf` 出現破壞性變更、或 Workers Builds 必須用 Wrangler 設定檔時，再考慮改回（推論）。
