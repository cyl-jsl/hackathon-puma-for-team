---
target: entry
total_score: 23
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 1
target_identity: "file:/Users/ccy/repos/apps/hackathon-puma-for-team/frontend/src/entry/Entry.tsx"
target_fingerprint: "sha256:4fc1fc7076ff36e64210892eb3632774ef16760cd865b62e8b6b89a50caec3d4"
target_path: /Users/ccy/repos/apps/hackathon-puma-for-team/frontend/src/entry/Entry.tsx
timestamp: 2026-10-29T06-24-51Z
slug: frontend-src-entry-entry-tsx
---
Method: dual-agent (A：設計審查子代理 · B：偵測器＋瀏覽器量測子代理)

審查對象：fix/entry-leftovers 分支（未提交），含口號刪除、wiki 註明未公開、管理端「開放試用」虛線框、兩格底部對齊。

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | 註腳來回與閃黃正常；頁首錨點不固定、沒有所在段落提示 |
| 2 | Match System / Real World | 3 | 「派工、結案、併入上一件」「A · 已交叉確認」需翻譯 |
| 3 | User Control and Freedom | 3 | 試玩另開分頁不丟原頁；同目的地開法不一 |
| 4 | Consistency and Standards | 2 | 虛線框兩種意思；貼紙同分頁 vs 流程另開；來源 5 只標「A」 |
| 5 | Error Prevention | 3 | 已說明其他訪客可能同時操作；另開分頁有標示 |
| 6 | Recognition Rather Than Recall | 3 | 手機 .solo 要記住三次分頁切換 |
| 7 | Flexibility and Efficiency | n/a | 說明頁 |
| 8 | Aesthetic and Minimalist Design | 3 | 「模擬資料」講 5 次；2,000→806 首屏講兩次 |
| 9 | Error Recovery | n/a | 沒有輸入與錯誤狀態 |
| 10 | Help and Documentation | 3 | 流程圖兼教學；手機試玩說明未步驟化 |
| **Total** | | **23/32** | **Good（72%）** |

## Design Specificity Verdict

LLM：量身打造。雙投入口桶身、一百桶陣列、點／組虛線框、可掃 QR、轉角黃貼紙都扣住「路邊的那個桶」與「有出處」。偏模板：深色最終目標區＋2×2 用途格；設計理念四列仍是圖示＋標題＋段落骨架。

Deterministic：CLI 對 Entry.tsx、App.tsx 0 筆（.tsx 只做 regex）；URL 掃描與瀏覽器 overlay 各 3 筆，全判誤報：nested-cards ×2（.sticker、.demo-note，DESIGN.md 定義的貼紙與標註）、cream-palette（body #f2efe6 再生紙）。對比全數過 AA，最低 4.58（待處理膠囊白字）；三種寬度皆無水平捲動；標題不跳級。偵測器沒抓到的：P1 container query 失效（量測 computed padding 才看得出來）。

## Priority Issues

- [P1] entry.css:25 的 `@container (max-width:560px) { .entry {…} }` 查的是 .entry 自己，永遠不生效（全頁沒有更外層的容器）。手機左右仍留 32px，320 寬桶身文字欄只剩 189px。Fix：改 `@media (max-width: 592px)` 或把容器移到外層。→ /impeccable adapt
- [P2] 手機首屏看不到任何入口：390 寬頁首 105px、桶身從 y=864 開始；320 寬頁首 130px（標籤斷兩行、版號自成一行）。Fix：≤760px 標籤縮成「模擬資料」、版號移頁尾。→ /impeccable adapt
- [P2] 貼紙「開啟桶 N 的回報頁」同分頁開，流程裡同一網址另開分頁；桶身「待辦」不帶桶號。Fix：試玩動作一律另開，或貼紙改連 #flow。→ /impeccable clarify
- [P2] 虛線框兩種意思：DESIGN.md Shapes 說虛線＝輸入來源（流程的感測器／市民格），新的開放試用說明又說虛線＝不是真實資料；讀者會把「市民回報」讀成假的。Fix：只留一種意思，開放試用框改用標籤系統，或 .step.in 改實線。→ /impeccable polish
- [P3] 為了對齊底部，市民格入口和貼紙之間空 87px（管理端 14px）；頁面以 6 列資料來源乾收尾。→ /impeccable layout

## Persona Red Flags

- Jordan：「試一次」沒說試什麼；術語未解釋；wiki 名稱查不到。
- Riley：開法不一；來源 5 分級格式不同。
- Casey：入口在首屏外；錨點導覽不固定；表格 279px 框橫捲 922px；試玩連結高 31px、回到內文高 32px，低於 44px；切三次分頁。
- 議題記者：來源 1 是媒體（B 級）沒直連議會紀錄；資料集寫「JSON、CSV、API」但沒有可下載的東西；範例表用真實地址，截圖可能裁掉標籤。

## Minor Observations

- 390 寬「最終目標」標題在專有名詞中間斷行（mark 可加 keep-all）。
- 設計理念第三列標題被 18em 欄寬折斷。
- 黃色用途太多，稀釋 Sticker Rule。
- 貼紙上的 CSS 假 QR 與流程區真 QR 同時出現，可能有人去掃假的。
- 註腳 24×25 剛好達 WCAG 2.5.8 下限。

## Trend

26/36（72%）→ 21/32（66%）→ 23/32（72%）。三次審查者不同、滿分基準不同，不是同尺度比較。
