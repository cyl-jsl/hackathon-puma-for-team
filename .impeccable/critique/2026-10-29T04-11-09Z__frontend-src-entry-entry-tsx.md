---
target: entry
total_score: 21
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 2
target_identity: "file:/Users/ccy/repos/apps/hackathon-puma-for-team/frontend/src/entry/Entry.tsx"
target_fingerprint: "sha256:11737dfe8ad6e1bfd4be742eb1de29f5dde17ff49a18655b06a9534c4b1f2f46"
target_path: /Users/ccy/repos/apps/hackathon-puma-for-team/frontend/src/entry/Entry.tsx
timestamp: 2026-10-29T04-11-09Z
slug: frontend-src-entry-entry-tsx
---
Method: dual-agent (A：設計審查子代理 · B：偵測器＋瀏覽器量測子代理)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | 註腳 :target 染黃很好；「回到內文」滑鼠點擊後落點無視覺提示 |
| 2 | Match System / Real World | 3 | 桶意象與白話好；「管理端／待辦」仍是內部用語 |
| 3 | User Control and Freedom | 3 | 回到內文記得來源註腳；另開分頁有標示 |
| 4 | Consistency and Standards | 2 | 貼紙 /b/300 原分頁、試玩同網址另開分頁；管理端 hover 1.09:1；「少 145」違反頁面自己的組／點規則 |
| 5 | Error Prevention | 2 | 所有訪客共用桶 300 試玩會互相干擾；`/` 是管理端不是入口站 |
| 6 | Recognition Rather Than Recall | 3 | 試玩要在兩視窗間切換並記住下一步 |
| 7 | Flexibility and Efficiency | n/a | 單次閱讀的說明頁 |
| 8 | Aesthetic and Minimalist Design | 2 | 「兩來源一張待辦」講四次：導言、試玩、設計理念、流程 |
| 9 | Error Recovery | n/a | 入口站沒有會出錯的操作 |
| 10 | Help and Documentation | 3 | 來源分級好；入口說明的「一週滿溢趨勢」「感測器數值」沒當場標模擬 |
| **Total** | | **21/32** | **Acceptable（66%）** |

## Design Specificity Verdict

LLM：雙投入口桶身、100 桶撤桶陣列、歪貼紙 QR、組／點虛線框是本產品專屬。偏模板：首屏右半約 45% 空白；深色「最終目標」區（螢光標題＋黃表頭卡＋2×2）最像 SaaS 落地頁。最強的撤桶陣列不在首屏（桌機 y≈1450、手機 y≈2664）。

Deterministic：CLI 對 Entry.tsx、App.tsx 0 筆。瀏覽器 overlay：low-contrast ×1 為真（試玩 pills 的 .st-assigned 繼承 muted，#5f6870 on #ffd21f 3.92:1）；nested-cards（.sticker）、cream-palette（body #f2efe6）為誤報，屬 DESIGN.md 既定設計。上次的 sup a、.step.last 兩筆已消失。

## Priority Issues

- [P1] 「開放資料比官方組數少 145」與同框「不能和組相加減」自相矛盾，806 寫死（Entry.tsx:217）。Fix：拿掉減法，改寫成不可直接比較。（原文案，需 Jin 決定）
- [P1] 撤桶陣列（全頁高峰）在第三屏；入口與試玩排在問題之前。Fix：精簡陣列放首屏右半；試玩移到流程之後。（與上次 Jin 選的「桶身留首屏」部分衝突）
- [P2] 試玩三步、流程五格、流程註記講同一條路徑。Fix：合併成可操作的流程圖。→ /impeccable distill
- [P2] 共用桶 300、`/` 是管理端。Fix：隨機試玩桶＋sessionStorage、註明他人可能同時操作；根目錄導 /entry（動路由需 Jin 決定）。
- [P2] 手機無法「兩視窗並排」；貼紙 QR 是 CSS 示意。Fix：桌機放可掃的真 QR（/b/300），手機改單線流程。→ /impeccable adapt
- [P3] 試玩 pills 的 .st-assigned 3.92:1（entry.css:183 未設字色）；管理端 hover 1.09:1（entry.css:68）；320px 時副標「開放試用」被刪節號截掉（entry.css:56）。→ /impeccable polish

## Persona Red Flags

- Jordan：先遇到 6 個入口與「待辦」「管理端」；試玩門檻是開兩個視窗。
- Riley：桶 300 多人同時操作；320px 副標截斷；#r1 留在網址、整列一直黃。
- Casey：頁首 105px、模擬標籤兩行占首屏 15%；全頁 8,104px；資料表 9 欄要橫捲。
- 作品集訪客／承辦人：第三屏才看到陣列；沒有作者與技術資訊；「少 145」與「所有公開清冊都只有位置」全稱宣稱會被質疑。

## Minor Observations

- 市民／管理端名稱用 b 不是標題，螢幕閱讀器標題跳讀找不到；沒有 skip link。
- 所有頁面 title 都是「桶緝犯」；沒有 og:image、og:url。
- 桌機管理端那一格底部比市民多空約 90px。
- 「為智慧城市的清運治理補上一塊基礎」口號味。
- 頁尾提 the-wanted-can-wiki 沒連結。
- 陣列標的「2024 年」是從「兩年內」推算，應註明。
- lastCite 為模組層級變數，重掛載不重設。

## Trend vs 上次

26/36（72%）→ 21/32（66%）。上次的 5 項 P1／P2（順序、無試玩、雙色票、對比與點擊區、模板中段）都已修，偵測器真問題從 2 筆降到 1 筆；分數下降來自新功能帶出的新問題（試玩路徑、共用桶 300）、換了審查者看得更細，以及第 9 項改判 n/a 使滿分基準不同。
