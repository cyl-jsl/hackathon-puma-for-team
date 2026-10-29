---
name: 桶緝犯
description: 找桶、回報，讓清潔隊來收。介面本身就是路邊的那個垃圾桶。
colors:
  truck-yellow: "#ffd21f"
  bin-ink: "#1d2226"
  overflow-red: "#d2441f"
  red-ink: "#b5381a"
  recycled-paper: "#f2efe6"
  white: "#ffffff"
  muted-ink: "#5f6870"
  hairline: "#1d222624"
  staff-gray: "#f4f5f6"
  slot-black: "#0a0d0f"
  status-assigned-amber: "#d9a400"
  capacity-full: "#d64545"
  capacity-high: "#e07a2f"
  capacity-mid: "#c4a017"
  capacity-low: "#2f9e4f"
  idle-gray: "#8a7f78"
  candidate-blue: "#4b5bd6"
  location-blue: "#2f6fde"
typography:
  display:
    fontFamily: "Huninn, Noto Sans TC, PingFang TC, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Huninn, Noto Sans TC, PingFang TC, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.3
  title:
    fontFamily: "Huninn, Noto Sans TC, PingFang TC, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.4
  ui-heading:
    fontFamily: "Noto Sans TC, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Noto Sans TC, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.8
  body-ui:
    fontFamily: "Noto Sans TC, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  small:
    fontFamily: "Noto Sans TC, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Noto Sans TC, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  qr: "4px"
  tag: "6px"
  control: "9px"
  card: "12px"
  panel: "20px"
  bin-base: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "28px"
  2xl: "40px"
  3xl: "56px"
components:
  button:
    backgroundColor: "{colors.white}"
    textColor: "{colors.bin-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-hover:
    backgroundColor: "{colors.bin-ink}"
    textColor: "{colors.white}"
  button-cta:
    backgroundColor: "{colors.bin-ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    height: "52px"
  button-cta-hover:
    backgroundColor: "{colors.overflow-red}"
    textColor: "{colors.white}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.bin-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  nav-link:
    textColor: "{colors.white}"
    rounded: "8px"
    padding: "0 12px"
    height: "36px"
  nav-link-current:
    backgroundColor: "{colors.truck-yellow}"
    textColor: "{colors.bin-ink}"
  badge:
    backgroundColor: "{colors.bin-ink}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  badge-kind:
    backgroundColor: "{colors.truck-yellow}"
    textColor: "{colors.bin-ink}"
  simulated-tag:
    backgroundColor: "{colors.truck-yellow}"
    textColor: "{colors.bin-ink}"
    rounded: "{rounded.tag}"
    padding: "2px 8px"
  status-open:
    backgroundColor: "{colors.overflow-red}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  status-assigned:
    backgroundColor: "{colors.truck-yellow}"
    textColor: "{colors.bin-ink}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  status-done:
    backgroundColor: "{colors.bin-ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "16px"
  slot:
    backgroundColor: "{colors.slot-black}"
    textColor: "{colors.white}"
    rounded: "26px"
    height: "52px"
  qr-sticker:
    backgroundColor: "{colors.truck-yellow}"
    textColor: "{colors.bin-ink}"
    rounded: "{rounded.tag}"
    padding: "14px"
---

# Design System: 桶緝犯

## Overview

**Creative North Star: "路邊的那個桶"**

桶緝犯的介面就是街上那個實體垃圾桶。桶身是墨色的粗線條，頂上有蓋、有提把，正面有黑色的投入口，桶身貼著一張微微歪掉的黃色 QR Code 貼紙。入口站把這個意象畫得最完整：整頁上半就是一個雙投入口的桶，左邊給市民，右邊給管理端。其他頁不畫整個桶，但沿用同樣的材料：墨線勾邊、白色桶身、黃色貼紙、紅色表示「滿了」。

這套系統是**實體的**，不是螢幕上的漂浮卡片。結構靠 1–2px 的墨色線條撐起來，不靠陰影；顏色像貼在桶上的貼紙，一塊一塊實心，不用漸層；狀態一律同時用形狀、顏色和文字表達。密度依頁面而定：入口站留白多、讀起來像一份說明；管理端緊湊、為掃視而排；市民回報頁只有幾個大按鈕。

語氣是公共設施的語氣：白話、清楚、有出處，帶一點街頭的手感（Huninn 的圓頭字、轉了 -1.2° 的貼紙），但不可愛、不賣弄。看起來要像一個認真做出來的公共服務，而不是政府標案網站，也不是新創公司的儀表板。

**Key Characteristics:**
- 墨色粗線勾邊，扁平、沒有漸層
- 垃圾車黃是貼紙：小面積、實心、標示「這裡」
- 滿溢紅只在需要注意時出現
- 狀態用形狀＋顏色＋文字三重表達
- 圓頭的 Huninn 只當展示字，內文用系統黑體
- 只有淺色，沒有深色模式

## Colors

一個黃、一個墨、一個紅，鋪在再生紙色的底上；地圖上另有一組只用來表示資料的顏色。

### Primary
- **垃圾車黃** (truck-yellow)：系統的招牌色，來自臺灣的黃色垃圾車與標誌。用在：QR Code 貼紙、目前所在的導覽項目、「模擬資料」標籤、案件種類徽章、「已指派」狀態、資料集表頭、流程的最後一步。圖示裡被填色的那一塊也是它。

### Secondary
- **滿溢紅** (overflow-red)：表示「滿了、待處理、看這裡」。當底色或圖形用：「待處理」狀態、鍵盤焦點外框、懸停時的箭頭、標題重點字下方的色塊底線、圖表線條。
- **滿溢紅・字** (red-ink)：滿溢紅當**文字**時改用這個較深的紅，在再生紙底上也有 5:1 以上。用在：註腳編號、資料來源序號、逾時與警示文字、連結。CSS 變數是 `--red-ink`。

### Neutral
- **桶身墨** (bin-ink)：所有文字、框線、頁首底色、主要按鈕底色、「已完成」狀態。是系統的骨架。
- **再生紙** (recycled-paper)：頁面底色。
- **白** (white)：桶身、卡片、輸入框、按鈕的底色。
- **淡墨** (muted-ink)：說明文字、次要資訊、圖表刻度。
- **細線** (hairline)：卡片與列表之間的分隔線，是桶身墨加 14% 不透明度。
- **管理灰** (staff-gray)：入口站桶身右半「管理端」那一格的底色，用來和市民那一格區分。
- **投入口黑** (slot-black)：投入口的凹槽，比桶身墨更深，搭配內陰影做出凹進去的感覺。

### Data Colors（只用在地圖、圖表與狀態）
- **容量四級**：capacity-low → capacity-mid → capacity-high → capacity-full，依 25% 一級，從綠到紅。用在管理端的桶圖釘、容量色條、桶圖示裡的格子。
- **指派琥珀** (status-assigned-amber)：地圖與列表上的「已指派」。垃圾車黃在淺色底圖上看不清楚，所以地圖改用較深的琥珀色；文字徽章仍用垃圾車黃。
- **閒置灰** (idle-gray)：市民地圖上沒有案件的桶。
- **候選藍** (candidate-blue)：「建議增設」候選格，依分數用三種不透明度。
- **定位藍** (location-blue)：使用者目前位置的圓點，沿用地圖 App 的慣例。

### CSS 變數

色票寫在 `frontend/src/index.css` 的 `:root`，變數名稱沿用黑客松時期：`--coral` 是滿溢紅、`--red-ink` 是滿溢紅・字、`--ink` 是桶身墨、`--cream` 是白、`--yellow` 是垃圾車黃、`--muted` 是淡墨、`--line` 是細線、`--bg` 是再生紙。地圖圖層的顏色寫在 `Admin.tsx`、`BinMap.tsx` 的 paint 設定裡，改色票時要一起改。舊的珊瑚與奶油米色（#db6a41、#211d1d、#fff8f4、#fcea8b、#e7d9cd）已全部換掉。

### Named Rules
**The Sticker Rule.** 垃圾車黃是貼紙，不是油漆。它只出現在有邊界的小區塊上，用來標示「這裡」或「這一個」；不當整頁或整個區段的底色。

**The Red Means Look Rule.** 滿溢紅只用來吸引注意：待處理、註腳、焦點、懸停。不拿來當裝飾色塊，也不和容量四級的紅色混用。

**The Red Text Rule.** 紅色當文字一律用 `--red-ink`；`--coral` 只當底色、線條與圖形。

## Typography

**Display Font:** Huninn（fallback：Noto Sans TC、PingFang TC、system-ui）
**Body Font:** Noto Sans TC（fallback：system-ui）。專案沒有載入 Noto Sans TC 網頁字型，實際上多半顯示為系統黑體（Apple 上是蘋方）。

**Character:** Huninn 圓頭、略帶手寫感，像貼在公共設施上的標語，和標誌字標同一套字；內文用中性的黑體，讓資訊保持清楚。

### Hierarchy
- **Display**（400，44px，行高 1.2，字距 0.02em）：入口站主標題。容器寬 560px 以下縮成 30px。
- **Headline**（400，30px，行高 1.3）：入口站各段標題；深色目標區塊用 34px。窄版 24px。
- **Title**（400，19–22px，行高 1.4）：入口站卡片標題、入口連結名稱、投入口標籤。
- **UI Heading**（700，22px）：功能頁的頁面標題；區塊標題 18px、卡片內 15–16px。
- **Body**（400，15px，行高 1.75–1.8）：入口站段落，最大寬度 36–38em。
- **Body UI**（400，16px）：功能頁的按鈕、輸入框、列表。輸入框維持 16px，避免 iOS 聚焦時放大畫面。
- **Small**（400，12.5–14px，行高 1.6–1.7）：說明、次要資訊、資料來源。
- **Label**（700，12px）：徽章、狀態膠囊、模擬資料標籤。

數字一律用 `font-variant-numeric: tabular-nums`，讓桶數、時間與表格對齊。

### Named Rules
**The Light Load Rule.** Huninn 只在入口站載入，而且是進到入口站才動態插入。市民回報頁 `/b/<編號>` 不載入任何外部字型，掃 QR Code 的人不用多等一個網路請求。

**The Display Is Regular Rule.** Huninn 一律用 400 字重；強調靠字級和顏色，不靠加粗。

## Layout

- **入口站**：最大寬度 1100px，四周留白 40px／32px，區段間距 56px。首屏左右兩欄：左邊標誌、標題與一句問題陳述，右邊撤桶桶陣列；860px 以下改上下排。其餘單欄。用 container query 依 `.entry` 的寬度排版：760px 以下流程圖改直排、QR Code 換成手機說明，560px 以下桶身兩格改上下疊、卡片改單欄，360px 以下投入口的名稱和副標上下排。
- **管理端待辦**：左邊地圖、右邊 360px 案件面板，高度填滿頁首以下。760px 以下改成上半地圖（50vh）、下半面板。
- **清潔狀態、桶一覽**：可捲動的單欄網格，區塊間距 16px，760px 以下多欄改單欄。
- **市民回報頁**：置中，最大寬度 480px，左右 16px。
- **市民地圖**：地圖填滿頁首以下的整個畫面，底部浮一張資訊卡；底部保留 22px，不蓋住地圖版權列。

間距用 4、8、12、16、28、40、56px 這幾級。觸控目標至少 44px，市民回報的「狀況」按鈕 56px，主要行動按鈕 52px。所有懸停樣式都包在 `@media (hover: hover)` 裡，手機點完不會停在反白狀態。

## Elevation & Depth

扁平為主。層次靠墨色框線、白色與再生紙色的對比，以及深色區塊（頁首、目標區塊、投入口）建立，不靠陰影。

### Shadow Vocabulary
- **浮層** (`box-shadow: 0 8px 24px #211d1d29`)：地圖彈出框、下拉選單、搜尋建議清單。
- **底部資訊卡** (`box-shadow: 0 -2px 16px #0003`)：市民地圖底部的資訊卡。
- **地圖小物** (`box-shadow: 0 1px 4px #0002`～`#0005`)：圖例、圖釘、定位點、色階條。
- **提示** (`box-shadow: 0 4px 12px #0004`)：地圖上的提示按鈕。
- **投入口凹槽** (`box-shadow: inset 0 6px 10px #000c, 0 1px 0 #fff`)：唯一的內陰影，做出「凹進桶身」的感覺。

### Named Rules
**The Only Floaters Cast Shadows Rule.** 只有浮在地圖或內容上方的東西才有陰影。頁面裡的卡片、按鈕、表格一律平貼，用線條區分。

## Shapes

形狀語言來自實體的桶：圓角的桶身、方正的貼紙、膠囊形的投入口。

- **控制項**（按鈕、輸入框、列表項目）：9px 圓角。
- **卡片、彈出框、流程步驟**：12px。
- **貼紙、標籤、徽章**：4–6px，比較方，像真的貼紙。
- **大區塊**：目標區塊 20px；入口站桶身底部 28px，只有下方兩角是圓的，上方接著桶蓋。
- **膠囊**：狀態標籤、資料集狀態、投入口（26px）。
- **框線**：一般 1px 細線；強調、選取、入口站桶身用 2px 桶身墨。「輸入來源」用 1px 虛線，表示是外部進來的訊號。
- **狀態形狀**：待處理的圖釘是圓形並持續擴散；已指派是旋轉 45° 的方塊；已完成淡出。

## Components

### Buttons
扎實、可以按下去的實體按鈕。
- **Shape:** 9px 圓角，最小高度 44px，1px 桶身墨框線。
- **Default:** 白底、墨字。
- **Hover / Focus:** 懸停時整顆反成墨底白字；入口站的連結以 3px 滿溢紅外框表示鍵盤焦點。
- **CTA:** 墨底白字，高 52px、18px 粗體；懸停變滿溢紅。
- **Chips:** 32px 高、16px 圓角的篩選按鈕；選中時墨底白字。
- **Disabled:** 不透明度 0.5。

### Badges & Status Pills
- **徽章：** 12px 字、6px 圓角。來源徽章墨底白字，種類徽章垃圾車黃底。
- **狀態膠囊：** 待處理＝滿溢紅底白字，已指派＝垃圾車黃底墨字，已完成＝墨底白字，外加 1px 框線（待處理的框線也是滿溢紅，其餘是桶身墨）。
- **模擬資料標籤：** 頁首右側的垃圾車黃標籤，每一頁都在。

### Cards / Containers
- **Corner Style:** 12px（列表項目 9px）。
- **Background:** 白；入口站的數字區用白底加細線框。
- **Shadow Strategy:** 不用陰影，見 Elevation & Depth。
- **Border:** 1px 細線；選取時改 2px 墨色外框。
- **Status Edge:** 案件卡左側 4px 色條：待處理滿溢紅、已指派琥珀。
- **Internal Padding:** 12–16px。

### Inputs / Fields
- **Style:** 白底、1px 墨色框線、9px 圓角、44px 高、16px 字。
- **Dropdown:** 展開時觸發按鈕反成墨底白字、箭頭旋轉 180°；選單白底墨框，套用浮層陰影，選中項垃圾車黃、鍵盤焦點墨底白字。

### Navigation
- **頁首：** 整條桶身墨底，左邊白色標誌與「桶緝犯」，接著是導覽連結，右邊是模擬資料標籤與部署版號（11px 等寬字、半透明白）。
- **導覽連結：** 36px 高、8px 圓角、白字；目前所在頁用垃圾車黃底墨字粗體，懸停是 15% 白底。
- **入口站：** 頁首不放品牌（頁內已有大標誌），導覽改成頁內錨點「試一次、目標、資料來源」；入口站很長，頁首固定在頂端（sticky），錨點一直按得到，錨點目標都讓出 72px 不被頁首蓋住；760px 以下模擬資料標籤縮成「模擬資料」、版號移到頁尾，380px 以下再縮小錨點內距，320 寬的手機頁首也只有一行（56px）。頁尾放「回到入口」與「回到試玩」。網站根目錄 `/` 導向入口站。
- **窄螢幕：** 版號只留短 SHA，模擬資料標籤換到下一行。

### 雙投入口桶身（入口站招牌元件）
整頁上半畫成一個垃圾桶：墨色提把、墨色桶蓋、白色桶身與 2px 墨框，桶身分成左右兩格。左格給市民（白底，投入口標籤用垃圾車黃字），右格給管理端（管理灰底）。每一格頂端是黑色的投入口，下面是入口連結：Huninn 22px 標題、淡墨說明、右側箭頭，懸停時整列染上 40% 垃圾車黃，箭頭右移 4px 變紅。

### 開放試用說明
管理端那一格最下面的白底細框（1px 細線、6px 圓角），開頭是墨框膠囊「開放試用」，後面一句淡墨說明，講清楚案件與感測器數值是模擬資料。膠囊和資料集的「範例資料」是同一種標籤：入口站用這種膠囊標示「不是真實資料」，不用虛線（虛線只代表輸入來源，見「框線」）。兩格都是直向 flex，貼紙與這個框用 `margin-top: auto` 貼齊底部，兩格底緣對齊。

### QR Code 貼紙
垃圾車黃底、2px 墨框、6px 圓角，整張轉 -1.2°。左邊是可以掃的 QR Code（84px，內容是這個分頁的試玩桶回報頁），右邊是一句 Huninn 標語與一個另開分頁的連結。760px 以下藏起 QR Code，手機掃不到自己的螢幕，所以文案也換一段不提「這張 QR Code」的說法，連結改成至少 44px 高、再生紙底墨框的整列按鈕。

### 撤桶桶陣列
一百個迷你桶，一個代表 20 組：實心桶身墨是還在的，空心淡線（桶身墨 50%）是撤掉的，形狀和顏色同時區分。放在首屏右欄，白底 2px 墨框。上方用 Huninn 寫「約 2,000 組 → 806 組」，兩個數字同字級；一律排 20 欄 5 列，窄螢幕只把數字列改上下排、箭頭轉向下。不同單位的數字（開放資料的「點」）放在另一個白底細框裡，不畫進同一張圖。

### 流程圖兼試玩
「一件案件怎麼走完」的流程格本身就是試玩步驟：有動作的格子（感測器、市民、管理端派工）在說明下面加一個另開分頁的粗體連結，不另寫一份步驟。試玩桶每個分頁隨機挑一個（存在 sessionStorage），避免訪客擠在同一個桶上。試玩連結用具名分頁：回報頁一個、管理端一個，重複點會回到同一個分頁，不會越開越多。管理端連結帶 `?bin=`，「模擬感測器」在已選取的桶開案，所以照步驟做會開在試玩桶上。流程圖下方，桌機放一張黃底墨框的卡片，裡面是可以掃的 QR Code（白底、墨色模組、四格靜區）和一句 Huninn 標語；760px 以下換成一段「只有手機？」的分頁切換說明。

### 桶圖示容量計
迷你的垃圾桶圖示：提把、桶蓋、桶身，桶身裡四格由下往上亮起，顏色用容量四級。用在管理端彈出框與列表，一眼看出這個桶有多滿。

### 地圖圖釘
24px，2px 白框加小陰影，裡面寫數字。待處理是滿溢紅圓形並持續擴散（使用者開了減少動態時停止）；已指派是旋轉 45° 的琥珀方塊；選中時放大 1.35 倍，其他的淡到 35%。

## Do's and Don'ts

### Do:
- **Do** 用 1–2px 桶身墨的線條建立結構，讓介面像一個實體的桶。
- **Do** 把垃圾車黃當貼紙用：小面積、有邊界、標示「這裡」。
- **Do** 狀態一律同時給形狀、顏色和文字（圓形／方塊、紅／黃／墨、「待處理」等字）。
- **Do** 每一頁保留頁首的「模擬資料」標籤，入口站的數字附註腳編號。從註腳跳到資料來源時，只有那一列顯示「回到內文」，其他列不顯示。
- **Do** 數字用 tabular-nums；觸控目標至少 44px（註腳這類行內小目標至少 24px）；懸停樣式包在 `@media (hover: hover)` 裡。
- **Do** 另開分頁的連結加右上箭頭圖示與「（另開分頁）」的隱藏文字。
- **Do** 動態要尊重 `prefers-reduced-motion`，過場維持在 0.15s 左右。
- **Do** 改到功能頁時，順手把舊的珊瑚奶油色票換成垃圾車黃系統。

### Don't:
- **Don't** 做成市府標案網站：藍白漸層、圖庫照片、輪播橫幅。
- **Don't** 做成 SaaS 儀表板：紫色漸層、玻璃擬態、整排大數字卡片。
- **Don't** 畫可愛的環保插畫：綠葉、地球、會笑的垃圾桶吉祥物。
- **Don't** 走監控科技風：深色底、霓虹線、雷達掃描。
- **Don't** 用陰影撐起頁面裡的卡片；陰影只給浮在上方的東西。
- **Don't** 用垃圾車黃當整頁底色，也不要把滿溢紅當裝飾。
- **Don't** 在市民回報頁載入 Huninn 或任何外部字型。
- **Don't** 把 Huninn 加粗，或拿它排內文。
- **Don't** 用遞減字級排一列不能比較的數字；不同單位的數字要在版面上分開。
- **Don't** 用「圖示＋標題＋段落」的等大卡片當段落結構；條列內容用墨線分隔的清冊列。
