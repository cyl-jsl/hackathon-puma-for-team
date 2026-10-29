---
target: entry
total_score: 23
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 1
target_identity: "file:/Users/ccy/repos/apps/hackathon-puma-for-team/frontend/src/entry/Entry.tsx"
target_fingerprint: "sha256:441b1072c3e82f07e0e1255db659bb210f4a9c56a70c2e5afc7e1b9c9a2fe67a"
target_path: /Users/ccy/repos/apps/hackathon-puma-for-team/frontend/src/entry/Entry.tsx
timestamp: 2026-10-29T07-19-56Z
slug: frontend-src-entry-entry-tsx
---
Method: dual-agent (A：設計審查子代理 · B：偵測器＋瀏覽器量測子代理)

審查對象：main 2541526（正式環境 deploy-20261029-1459）。

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | 註腳來回、閃黃、清 hash 都正常；頁內導覽沒有所在段落提示 |
| 2 | Match System / Real World | 3 | 「主表」「清冊」首次出現沒解釋 |
| 3 | User Control and Freedom | 3 | 外部連結另開分頁；頁首不固定，長頁中途沒有回頂端的路 |
| 4 | Consistency and Standards | 3 | 元件用法一致；設計理念第 3 列標題排版壞掉、試玩文案與管理端按鈕名稱對不上 |
| 5 | Error Prevention | 2 | 照字面按「模擬感測器」會在隨機桶開案；兩個管理端連結各開一個分頁 |
| 6 | Recognition Rather Than Recall | 3 | 連結含桶號與按鈕名；切分頁後步驟只留在入口站 |
| 7 | Flexibility and Efficiency | n/a | 說明兼分流頁 |
| 8 | Aesthetic and Minimalist Design | 3 | 6 顆常駐「回到內文」；661 點說明段很密 |
| 9 | Error Recovery | n/a | 沒有輸入與錯誤狀態 |
| 10 | Help and Documentation | 3 | 流程格內附操作、手機有「只有手機？」提示 |
| **Total** | | **23/32** | **Good（72%）** |

## Design Specificity Verdict

LLM：量身訂做。雙投入口桶、100 桶陣列、能掃的試玩桶貼紙、流程圖兼試玩、處處標示真假。偏通用：「設計理念」圖示＋標題＋段落四列、深色最終目標＋2×2 用途格。

Deterministic：CLI 對 Entry.tsx、App.tsx 0 筆（.tsx 只做 regex）；URL 掃描與瀏覽器 overlay 各 3 筆，全為誤報：nested-cards ×2（.sticker、.demo-note，外層投入口格無框無陰影）、cream-palette（再生紙 #f2efe6）。三種寬度無水平捲動，.entry padding 手機已是 24px 16px 40px（上次 P1 確認修好）。對比全過 AA，最低 4.58。量測另抓到：320 寬頁首換成兩行（89px）；手機上貼紙「開啟回報頁」點擊區 78×17；資料集捲動區沒有自己的 aria-label（有 aria-labelledby 指向範例資料說明）。

## Priority Issues

- [P1] 試玩寫「按『模擬感測器』」，但待辦面板的「模擬感測器」不帶參數，會隨機挑桶開案（Admin.tsx:250、436）；在試玩桶開案的是彈出框的「模擬感測器 85% 滿」（Admin.tsx:373）。照字面走，回報頁不會變，展示的 2 秒同步就斷了。兩個管理端連結還會各開一個分頁。Fix：文案改指「模擬感測器 85% 滿」或讓面板按鈕在已選桶時用該桶；管理端連結用固定 target 名稱共用一個分頁。→ /impeccable clarify
- [P2] 設計理念第 3 列標題在桌機排成 4 行：.idea h3 是 flex，上次加的 nobr span 成了獨立 flex 項目（Entry.tsx:254、entry.css:152）。上一輪修正造成的回歸。Fix：文字包成一個 span。→ /impeccable polish
- [P2] 手機上貼紙 QR Code 已藏起來，文案仍寫「這張就是桶 N 的，掃描或…」（Entry.tsx:208、entry.css:86）；手機上的「開啟回報頁」點擊區只有 78×17。Fix：手機版改寫文案、連結做成按鈕大小。→ /impeccable clarify
- [P2] 長頁沒有持續可用的導覽：頁首不固定，390 寬頁長 6927px；結尾停在資料來源清冊。320 寬頁首仍換兩行（89px）。Fix：入口站頁首 sticky、頁尾補「回到入口」、320 寬再縮頁首。→ /impeccable layout
- [P3] 6 顆常駐「回到內文」造成清冊雜訊、多 6 次 Tab。Fix：只在 li.hit 顯示。→ /impeccable distill

## Persona Red Flags

- Jordan：入口桶問「市民還是管理端」，但他只是來看作品的；照字面按模擬感測器在錯的桶開案；「主表」「清冊」沒解釋。
- Riley：兩個 /admin 分頁；面板按鈕不跟 ?bin= 走；新分頁開入口站會拿到另一個試玩桶（刻意設計但沒說明）。
- Casey：第一屏沒有入口（y≈914）；頁首不固定；手機要切分頁試玩；流程連結 31px、回到內文 32px、貼紙連結 17px 高；320 寬頁首兩行。
- 承辦人／記者：最關鍵的 2,000→806 只有 B 級媒體來源；研究筆記未公開無法查證；沒有最後更新日期與聯絡方式；資料集授權待定。

## Minor Observations

- 桌機頁首模擬資料長標籤（412px）比頁內導覽更搶眼。
- 「跳到主要內容」出現時蓋住頁首錨點。
- 「約 2,000 組」沒掛註腳、「806 組」有，同一出處可統一標一次。
- .uses li 上緣分隔線對比 1.92:1，幾乎看不見（裝飾線）。
- 焦點外框（滿溢紅）在黃貼紙上 3.16:1，剛過門檻。

## Trend

26/36（72%）→ 21/32（66%）→ 23/32（72%）→ 23/32（72%）。審查者每次不同，第 9 項是否 n/a 也不同，不是同尺度比較。上次的 P1（手機留白）已修好，但上一輪的 nobr 修正造成一個新的 P2 回歸。
