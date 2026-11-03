# SRE 方法論單人版：兩個 SLO、一個外部探測、一頁 postmortem

> 研究日期：2026-11-02。主要來源為 Google《Site Reliability Engineering》（下稱 SRE Book）與《The Site Reliability Workbook》（下稱 Workbook），都在 [sre.google](https://sre.google/books/) 免費線上閱讀。引文是原文摘錄，中文是轉述。標「（推論）」的是推論，不是查到的事實；查不到的寫「查不到」。

桶緝犯是單人維運、流量很低的專案，不需要整套 SRE 制度。只要五樣東西：

1. **兩個 SLI/SLO**：市民回報路徑的可用性、市民進度查詢的延遲。
2. **一個外部探測**：用來補低流量造成的統計空洞。
3. **一條寫成文字的 error budget policy**：預算用完就先修可靠性，暫停新功能。
4. **一頁 postmortem 範本**。
5. **28 天的滾動時間窗**。

issue #12 的四個 SLO 初稿逐項檢查如下：

- **「回報頁可用性 99.5%」方向對，但量不到。** 原本的量法同時包含 `/b/<id>` 和 `POST /api/reports`。`/b/<id>` 是靜態檔，根本不經過 Worker，Worker 端統計不到；`POST /api/reports` 每月的真實請求太少，一次失敗就吃掉大半預算。要改成「外部探測加真實請求」兩種量法。
- **「`GET /api/cases/:id` p95 < 500 ms」可以留。** 但量測點要寫清楚，是 Worker 內部時間還是客戶端時間。
- **「新鮮度 < 5 秒」目前沒有量測手段。** 而且它其實是由輪詢間隔決定的，先降級成設計目標。
- **「部署成功率 90%」不是 SLO。** 它比較接近 DORA 的 change fail rate，當成追蹤指標就好，不要掛 error budget。

## SRE Book / Workbook 的重點

**結論**：單人專案只需要四個概念：SLI 是比例、SLO 是目標、error budget 是 1 − SLO、事後檢討不究責。其他制度（on-call 輪值、SLA、多窗口告警）都可以先不做。

**依據**：

- **SLI、SLO、SLA**（[SRE Book ch.4 Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)）
  - SLI 是「a carefully defined quantitative measure of some aspect of the level of service」。
  - SLO 是「a target value or range of values for a service level that is measured by an SLI」。
  - SLA 是附帶罰則的契約，桶緝犯沒有，跳過。
- **怎麼挑 SLI 與定目標**（同章）
  - 只挑少數幾個：「a handful of representative indicators are enough」。
  - 延遲用百分位數，不用平均值。
  - 「Don't pick a target based on current performance」，並且「better to start with a loose target that you tighten」。
  - 內部目標要比對外承諾嚴一點，留安全邊際（「Keep a safety margin」）。
- **Error budget**（[SRE Book ch.3 Embracing Risk](https://sre.google/sre-book/embracing-risk/)）
  - 預算等於 SLO 與實際表現的差距。還有預算時可以照常發布：「as long as there is error budget remaining—new releases can be pushed」。
  - 書中的例子：SLO 99.999%，失敗率預算就是 0.001%。
- **SLI 的寫法**（[Workbook ch.2 Implementing SLOs](https://sre.google/workbook/implementing-slos/)）
  - 一律寫成比例：「the number of good events divided by the total number of events」。
  - 要分開寫 specification（使用者在意什麼）和 implementation（怎麼量）。
  - 量測來源有四種：application server logs、load balancer、black-box monitoring、client-side。第一版用最省工的那種就好。
  - 時間窗：「a four-week rolling window to be a good general-purpose interval」。
  - 常見的 SLI 類型：request 類有 availability、latency；pipeline 類有 freshness。
- **Error budget policy**（[Workbook Appendix B Example Error Budget Policy](https://sre.google/workbook/error-budget-policy/)）
  - 核心規則：「If the service has exceeded its error budget for the preceding four-week window, we will halt all changes and releases other than P0 issues or security fixes」。
  - 單一事故用掉 4 週預算的 20% 以上，就要寫 postmortem。
  - Policy 本身「not intended to serve as a punishment」。
- **Postmortem**（[SRE Book ch.15 Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)）
  - Blameless 的意思是「focus on identifying the contributing causes … without indicting any individual or team」。
  - 觸發條件要事先定好，包括：使用者可見的停機、任何資料遺失、需要人工介入（例如回退）、修復時間超過門檻、監控失效（例如靠人工才發現）。
  - 範例見 [SRE Book Appendix D Example Postmortem](https://sre.google/sre-book/example-postmortem/) 與 [Workbook ch.10 Postmortem Culture](https://sre.google/workbook/postmortem-culture/)。
- **Freshness**（[Workbook ch.13 Data Processing Pipelines](https://sre.google/workbook/data-processing/)）
  - 格式寫成「X% of data processed in Y」。
  - 要端到端量測：「customers only care about the SLO for the sum of all stages」。

## 單人、低流量版的最小集合

**結論**：保留 SLI/SLO、28 天時間窗、一條 error budget policy、postmortem。捨棄 on-call 輪值、burn-rate 多窗口告警、季度 SLO 檢討會議。告警只做一種：外部探測連續失敗就通知 Jin。

| 元素 | 留不留 | 理由 |
|---|---|---|
| SLI/SLO（2 個） | 留 | 決定「什麼時候該停下來修」，單人更需要客觀標準，不能靠感覺 |
| 28 天滾動時間窗 | 留 | Workbook 的建議；整數週，每個窗的週末數相同 |
| Error budget policy（一段文字） | 留 | 只寫一條：預算用完就暫停功能 PR，只合併可靠性與安全修正，直到回到 SLO 內 |
| Postmortem | 留，只用簡化版 | 觸發條件改成單人可負擔的門檻（見下方範本） |
| Burn-rate 多窗口告警 | 不做 | [Workbook ch.5](https://sre.google/workbook/alerting-on-slos/) 的門檻是為大流量設計的。低流量時一次失敗就觸發，只會變成噪音（見下節） |
| On-call、SLA | 不做 | 沒有輪值對象，也沒有契約 |

## 低流量時 SLO 的統計問題與對策

**結論**：桶緝犯市民端的真實請求一個月可能只有幾十到幾百次（推論，尚未量測），用真實請求算可用性幾乎沒有意義。解法是讓外部探測當主要分母，真實請求另外看，並且只在「連續失敗」時告警。

**依據與算式**：

- **問題**：Workbook 的例子是每小時 10 個請求，一次失敗就讓該小時錯誤率變成 10%。在 99.9% 的 SLO 下，這等於 1,000 倍的燃燒率 ([Alerting on SLOs：Low-Traffic Services](https://sre.google/workbook/alerting-on-slos/))。
- **套到桶緝犯**：假設 28 天有 200 次 `POST /api/reports`（推論），99.5% 的預算是 200 × 0.005 = **1 次失敗**。只要一次 D1 暫時錯誤，預算就用完了。
- **Workbook 列出的對策**（同節），以及在這裡的適用性：
  1. 「Generate artificial traffic」：**採用**。外部探測每 5 分鐘一次，28 天是 28 × 288 = 8,064 次。99.5% 的預算是 8,064 × 0.005 ≈ **40 次失敗探測**，約等於 40 × 5 = 200 分鐘停機。換算成時間也一樣：28 × 1,440 × 0.005 = 201.6 分鐘。Workbook 也提醒，成功的人工請求「hide the real user signal」，所以真實請求的錯誤還是要另外看。
  2. 「Combine smaller services」：**部分採用**。把 `/b/<id>`、`POST /api/reports`、`GET /api/cases/:id` 合成一個「市民回報旅程」SLI。
  3. 「Modify the product」：**採用**。客戶端失敗時用指數退避重試，單次失敗就不會變成使用者看得到的失敗。現在 `usePoll` 已經會自動重試，`report()` 送出失敗則要使用者手動重按。
  4. 「Lowering the SLO or Increasing the Window」：28 天已經夠長，不再拉長。99.5% 可以保留，因為分母主要是探測。
- **探測的工具限制**
  - GitHub Actions 的排程最短「once every 5 minutes」，在高負載時「can be delayed」。
  - 公開 repo 在「no repository activity … in 60 days」之後，排程會被自動停用 ([GitHub Docs：schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows))。
  - 所以半年沒有 commit 時，探測會默默停掉，這本身就是一個要監控的風險（推論）。
- **Cloudflare 端資料的保存期限**
  - Workers Logs 在 Free 方案只保留 **3 天** ([Workers Pricing：Workers Logs](https://developers.cloudflare.com/workers/platform/pricing/))，不夠算 28 天的 SLO。
  - Workers Analytics Engine 在 Free 方案每天可寫 100,000 個資料點，資料保存 **3 個月**，目前還沒有開始收費 ([AE Pricing](https://developers.cloudflare.com/analytics/analytics-engine/pricing/)；[AE Limits](https://developers.cloudflare.com/analytics/analytics-engine/limits/))。適合在後端只對市民相關路由寫資料點，欄位包括路由、狀態碼、耗時。
  - GraphQL 的 `workersInvocationsAdaptive` 文件範例只列出 invocation 的 `status` 和 `cpuTime` 分位數 ([Querying Workers Metrics](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/))。有沒有 HTTP 狀態碼與路徑這兩個維度，這次**沒有查證**。
  - 掛上自有網域後，zone 層級的 `httpRequestsAdaptiveGroups`「retain at least 31 days of data on every plan」([GraphQL Limits](https://developers.cloudflare.com/analytics/graphql-api/limits/))，可以涵蓋 28 天時間窗。`workers.dev` 不是 Jin 的 zone，推論用不到這個資料集。

## Postmortem 範本大綱（正體中文）

**結論**：欄位依 [SRE Book 附錄範例](https://sre.google/sre-book/example-postmortem/) 與 [Workbook ch.10](https://sre.google/workbook/postmortem-culture/) 精簡而成。一份寫在 `docs/postmortems/YYYY-MM-DD-<短描述>.md`，以 30 分鐘寫完為原則。

**觸發條件**（任一成立就寫）：

- 正式環境市民回報或進度頁無法使用超過 30 分鐘。
- 任何正式 D1 資料遺失或被錯誤改寫。
- 部署後需要回退。
- 是使用者先發現問題，不是探測先發現（監控失效）。
- 單一事件用掉當期 error budget 的 20% 以上（照 Workbook Appendix B）。

**範本**：

```
# <事件標題>（YYYY-MM-DD）
狀態：草稿／完成            撰寫：Jin            不究責：本文只找系統與流程的原因

## 摘要        一到三句：發生什麼、影響多久、怎麼修好
## 影響        受影響的頁面／API、時間區間（UTC+8）、估計受影響的請求或回報數、用掉多少 error budget
## 時間線      HH:MM 事件／偵測／判斷／處置／恢復（每行一件事）
## 偵測        怎麼發現的（探測／使用者／自己看到）；如果不是探測，為什麼探測沒抓到
## 根本原因與觸發  根因（條件）和觸發點（那個變更或事件）分開寫
## 處置與恢復  做了什麼、哪一步真正有效、回退了哪個 deploy-* tag
## 學到什麼    順利的地方／不順的地方／運氣好的地方
## 行動項目    | 項目 | 類型（預防／偵測／緩解／修復） | 優先級 | issue 連結 |
## 附錄        相關 log 片段、指令、圖
```

## 對 issue #12 SLO 初稿的評論

**結論**：保留兩個並改寫量法，一個降級成設計目標，一個改成追蹤指標。

| 初稿 | 評論 | 建議 |
|---|---|---|
| 市民回報頁可用性 99.5%（28 天），量法：`/b/<id>` 與 `POST /api/reports` 非 5xx 的比例 | 目標合理，99.5% 等於 28 天約 201.6 分鐘的停機預算。但量法有兩個問題。① `/b/<id>` 是靜態檔，前端設定只有 `/api/*` 走 Worker（`frontend/cloudflare.config.ts` 的 `runWorkerFirst`），請求不會進 Worker，Worker 的 log 量不到。② 真實的 POST 太少，見上節 | **SLI 改成「外部探測成功率」**：每 5 分鐘依序探測 `GET /b/300`（200，且 HTML 含 app 根節點）和 `GET /api/cases/300`（200 或 404 都算成功，5xx 或逾時算失敗）。目標 99.5%，28 天預算約 40 次探測失敗。真實請求的 5xx 用 Analytics Engine 另外記錄，只看不扣預算。探測不打 `POST /api/reports`，避免汙染正式資料（推論；要測寫入就要有專用測試桶，並在統計裡排除） |
| `GET /api/cases/:id` p95 < 500 ms | 合理，這是市民進度頁每 2 秒打一次的 API，查詢只讀 1 列案件加上該案的回報。初稿沒說在哪裡量。Worker 內部時間不含網路，客戶端時間又包含使用者的行動網路 | **寫成「Worker 收到請求到回應完成的時間 p95 < 300 ms」**，用 Analytics Engine 記錄每次請求的耗時。另外把探測端的總耗時 p95 < 1,000 ms 當參考值。兩個門檻都是推論，要先量一週再定（照 SRE Book「不要依現況定目標，但要先知道現況」）。issue 實測 `GET /api/cases`（完整列表）約 0.6 秒，這和 `:id` 是不同的 API，不能直接套用 |
| 新案件新鮮度 < 5 秒 | 現在**量不到**，也不是獨立的可靠性指標。它是由輪詢間隔（2 秒）加上查詢時間決定的，只要輪詢有在跑就會成立。`opened_at` 用 `datetime('now')`，只精確到秒，又沒有記錄「管理端看到的時間」 | **降級成設計目標**，寫進 ARCHITECTURE.md：「管理端輪詢間隔 ≤ 5 秒」。如果將來改成 ETag 或推播，要真的量時，用探測端寫入測試桶，再以另一個連線輪詢到出現為止，記錄兩者的時間差（Workbook 的 end-to-end freshness 作法） |
| 部署成功率 90% | SRE 書裡沒有這個 SLO。最接近的是 DORA 的 **change fail rate**：「The ratio of deployments that require immediate intervention following a deployment」([DORA metrics](https://dora.dev/guides/dora-metrics/))。樣本也很少：fork 後 2026-10-27 到 11-02 共有 8 個 `deploy-*` tag（`git tag -l 'deploy-*'`），28 天大約 30 次，90% 只容許 3 次失敗。另外，`/deploy` 的回退不打新 tag，現在無法事後統計回退次數 | **改成追蹤指標，不掛 error budget**。`/deploy` 回退時在 issue 或 `docs/deploys.md` 記一行，月底算 change fail rate。觸發 postmortem 的是「需要回退」這個事件本身，不是比率 |

## 對桶緝犯的意義

**結論**：約 2–3 個工作天、0 元，就能把 SRE 的最小集合落地。

1. **寫 `docs/slo.md`（0.5 天）**，內容包括：
   - 兩個 SLO：探測可用性 99.5%／28 天；`/api/cases/:id` Worker 耗時 p95 < 300 ms（先量一週再確認）。
   - 一條 error budget policy：「前 28 天探測失敗超過 40 次，就暫停功能 PR，只合併可靠性與安全修正」。
   - postmortem 觸發條件與範本（照上一節）。
2. **外部探測（0.5–1 天）**：用 GitHub Actions 排程每 5 分鐘 `curl` 兩個網址，連續 2 次失敗就開 issue 或發通知給 Jin。
   - 成本：公開 repo 的 Actions 分鐘數免費（推論，這次沒有查證 GitHub 的方案條款）。
   - 要注意 60 天沒有活動會被停用。可以每月由排程自己 commit 一次紀錄，或每季手動檢查。
   - 另一個選項是 issue 提到的 UptimeRobot 等外部服務，這次**沒有查**它們的免費額度。
3. **後端寫 Analytics Engine 資料點（0.5 天）**：只寫市民相關路由（`POST /api/reports`、`GET /api/cases/:id`），不寫每 2 秒一次的列表輪詢。
   - 估計每天幾百筆，遠低於 Free 每天 100,000 筆。
   - 月底用 SQL API 算 p95 與 5xx 比例，查詢次數遠低於每天 10,000 次的上限。
4. **回退紀錄**：在 `/deploy` skill 的回退步驟加一句「在 `docs/deploys.md` 記一行」。改了 skill 要重跑 eval，所以這項約 0.5 天。
5. **先做 [06_取代輪詢.md](06_取代輪詢.md) 的 PR 1 和 PR 2**。D1 每日讀取用完會讓整站的案件 API 一起失敗，這是現在最可能把 error budget 一次燒光的原因（推論）。
