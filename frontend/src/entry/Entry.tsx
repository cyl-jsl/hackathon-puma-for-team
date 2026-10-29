import { useEffect, useId, useState, type ReactNode } from "react";
import { encode } from "uqr";
import itrash from "../../../data/itrash.json";
import { BINS, binById, STATUS_LABEL } from "../shared/api";
import { LogoMark } from "../shared/Logo";
import "./entry.css";

// vite.config.ts 在 build 時數 data/trucks.json 的停靠點數注入，重跑 etl/trucks.py 後不用改這裡
declare const __TRUCK_STOPS__: number;
declare const __BUILD__: { short: string };
const TRUCK_STOPS = __TRUCK_STOPS__;
const DISTRICTS = new Set(BINS.map((b) => b.properties.district)).size;
const fmt = (n: number) => n.toLocaleString("zh-TW");

// 官方組數，出處見資料來源 1；桶陣列一個圖示代表 20 組
const BEFORE = 2000;
const NOW = 806;
const PER_ICON = 20;

// 試玩連結的分頁名稱：回報頁、待辦各開一個分頁，重複點會回到同一個
const REPORT_TAB = "tongjifan-report";
const ADMIN_TAB = "tongjifan-admin";

// 標題字型只在入口站用，不放進 index.html，免得掃 QR Code 的回報頁多等一個外部 CSS
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Huninn&display=swap";

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Go({ href, title, children }: { href: string; title: string; children: string }) {
  return (
    <a className="go" href={href}>
      <strong>{title}</strong>
      <span>{children}</span>
      <Chevron />
    </a>
  );
}

// 另開分頁的連結：右上箭頭給看得到的人，括號文字給螢幕閱讀器。
// 試玩連結傳 target 名稱，同一種頁面一直開在同一個分頁，不會越開越多；站內頁面不需要 noreferrer
function Ext({ href, target = "_blank", className, children }: { href: string; target?: string; className?: string; children: ReactNode }) {
  return (
    <a className={className ? `ext ${className}` : "ext"} href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined}>
      {children}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16L16 8M9 8h7v7" /></svg>
      <span className="sr-only">（另開分頁）</span>
    </a>
  );
}

// 最後點的是哪一個註腳；資料來源的「回到內文」跳回這裡，沒點過就回到第一次引用的地方
let lastCite: string | null = null;

// 跳到的那筆資料來源整列染黃。不用 :target：回到內文時要清掉網址上的 #r1，replaceState 不會更新 :target
function markRef(n: number | null) {
  document.querySelectorAll(".refs li.hit").forEach((li) => li.classList.remove("hit"));
  if (n !== null) document.getElementById(`r${n}`)?.classList.add("hit");
}

// 註腳，對到頁尾「資料來源」的編號
function Ref({ n }: { n: number }) {
  const id = useId();
  return (
    <sup>
      <a id={id} href={`#r${n}`} aria-label={`資料來源 ${n}`} onClick={() => { lastCite = id; markRef(n); }}>{n}</a>
    </sup>
  );
}

function Back({ n }: { n: number }) {
  const back = () => {
    const last = lastCite ? document.getElementById(lastCite) : null;
    const el = last?.getAttribute("href") === `#r${n}` ? last : document.querySelector<HTMLElement>(`sup a[href="#r${n}"]`);
    markRef(null);
    history.replaceState(null, "", location.pathname + location.search);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
    // 用滑鼠按的話 :focus-visible 不會亮，閃一下黃底讓人知道回到哪一句
    el.classList.add("cited");
    setTimeout(() => el.classList.remove("cited"), 2000);
  };
  return (
    <button type="button" className="back" onClick={back}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
      回到內文
    </button>
  );
}

// <ol> 只能放 <li>，箭頭也包成 li，對螢幕閱讀器隱藏
const Arrow = () => (
  <li className="arrow" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  </li>
);

// 一百個桶排成 20 欄 5 列：左上起是還在的，其餘是撤掉的空心桶。圖示 10×13，格子 12×16
function Tally() {
  const total = BEFORE / PER_ICON;
  const kept = Math.round(NOW / PER_ICON);
  const cols = 20;
  return (
    <svg
      className="tally-bins"
      viewBox={`0 0 ${cols * 12} ${(total / cols) * 16}`}
      role="img"
      aria-label={`${total} 個桶圖示，每個約 ${PER_ICON} 組：${kept} 個還在，${total - kept} 個已撤除`}
    >
      <defs>
        <symbol id="tally-bin" viewBox="0 0 10 13">
          <path d="M3.5 0.6h3M0.6 2.4h8.8M1.5 4.4h7l-0.8 7.8h-5.4z" />
        </symbol>
      </defs>
      {Array.from({ length: total }, (_, i) => (
        <use key={i} href="#tally-bin" className={i < kept ? "kept" : "gone"} x={(i % cols) * 12 + 1} y={Math.floor(i / cols) * 16 + 1.5} width="10" height="13" />
      ))}
    </svg>
  );
}

// 試玩用的桶：每個分頁隨機挑一個，訪客才不會都擠在同一個桶上；重新整理不換。存不進 sessionStorage 時每次重挑
function pickTrialBin() {
  try {
    const saved = Number(sessionStorage.getItem("trial-bin"));
    if (binById(saved)) return saved;
  } catch { /* 無痕視窗或封鎖網站資料 */ }
  const id = 1 + Math.floor(Math.random() * BINS.length);
  try { sessionStorage.setItem("trial-bin", String(id)); } catch { /* 同上 */ }
  return id;
}

// 真的可以掃的 QR Code，四周留 4 格空白（掃描器需要的靜區）
function Qr({ url }: { url: string }) {
  const { data, size } = encode(url, { ecc: "M", border: 0 });
  const d = data.flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : ""))).join("");
  return (
    <svg className="qr-code" viewBox={`-4 -4 ${size + 8} ${size + 8}`} shapeRendering="crispEdges" role="img" aria-label={`QR Code，內容是 ${url}`}>
      <rect x="-4" y="-4" width={size + 8} height={size + 8} fill="#fff" />
      <path d={d} />
    </svg>
  );
}

// 資料集範例列：桶編號與位置取自 bins.json，其餘欄位是示意。欄位順序：手機橫捲前先看到最重要的幾欄
const SAMPLE = [
  { time: "10/28 08:12", bin: 300, source: "感測器", kind: "滿了", fill: "86%", status: "已完成", took: "42 分" },
  { time: "10/28 08:20", bin: 300, source: "市民", kind: "髒亂", fill: "－", status: "已完成", took: "併入上一件" },
  { time: "10/28 09:05", bin: 451, source: "市民", kind: "這裡沒有桶", fill: "－", status: "待處理", took: "－" },
];

export default function Entry() {
  const [trial] = useState(pickTrialBin);
  const binUrl = `/b/${trial}`;
  const adminUrl = `/admin?bin=${trial}`;

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.append(link);
  }, []);

  return (
    <main className="entry">
      {/* 首屏左邊是一句話講清楚問題，右邊是同一件事畫成一百個桶 */}
      <div className="hero">
        <div className="intro">
          <p className="lockup"><LogoMark size={44} /><span>桶緝犯</span></p>
          <h1>找桶、回報，<br />讓清潔隊來收。</h1>
          <p className="lead">
            兩年內，臺北的行人垃圾桶從約 <strong>2,000</strong> 組減到 <strong>806</strong> 組<Ref n={1} />。手上有垃圾的人更難找到桶，找到的桶又常常是滿的。
          </p>
          <p>桶緝犯讓市民找桶、掃桶上的 QR Code 回報，清潔隊在同一張待辦裡指派、結案。</p>
        </div>
        <figure className="tally" aria-labelledby="tally-cap">
          <figcaption id="tally-cap" className="tally-head">
            <span className="from"><b>約 {fmt(BEFORE)} 組</b><span>兩年前，官方組數</span></span>
            <svg className="tally-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            <span className="to"><b>{NOW} 組</b><span>2026-07，官方組數<Ref n={1} /></span></span>
          </figcaption>
          <Tally />
          <p className="tally-key">
            <span><i className="kept" aria-hidden="true" />還在</span>
            <span><i className="gone" aria-hidden="true" />撤除，約 {fmt(Math.round((BEFORE - NOW) / 100) * 100)} 組</span>
            <span>每個圖示約 {PER_ICON} 組</span>
          </p>
        </figure>
      </div>

      <nav className="bin" id="start" aria-labelledby="h-entry">
        <h2 id="h-entry" className="sr-only">選一個入口</h2>
        <div className="handle" aria-hidden="true" />
        <div className="lid" aria-hidden="true" />
        <div className="body">
          <section className="chute public" aria-labelledby="h-citizen">
            <div className="slot"><h3 id="h-citizen">市民</h3><span>找桶、丟家用垃圾</span></div>
            <Go href="/map" title="地圖找桶">{`開放資料的 ${fmt(BINS.length)} 個行人垃圾桶，找離你最近的一個`}</Go>
            <Go href="/trash" title="家用垃圾">{`${fmt(TRUCK_STOPS)} 個垃圾車停靠點與 ${itrash.length} 個 iTrash 站，查最近的時間和地點`}</Go>
            <div className="sticker">
              {/* 真的可以掃：這張就是試玩桶的 QR Code，桌機上拿手機掃就能試 */}
              <Qr url={location.origin + binUrl} />
              <p><b>桶滿了、很髒？</b></p>
              {/* 桌機有 QR Code 可掃；窄螢幕藏起 QR Code，改成一顆按鈕大小的連結。兩段用 container query 切換 */}
              <p className="sticker-wide">掃桶上的 QR Code 回報。這張就是桶 {trial} 的，掃描或<Ext href={binUrl} target={REPORT_TAB}>開啟回報頁</Ext>都能試。</p>
              <p className="sticker-narrow">桶上會貼一張 QR Code，掃了就能回報。<Ext href={binUrl} target={REPORT_TAB} className="sticker-btn">開啟桶 {trial} 的回報頁</Ext></p>
            </div>
          </section>
          <section className="chute staff" aria-labelledby="h-staff">
            <div className="slot"><h3 id="h-staff">管理端</h3><span>清潔隊的畫面</span></div>
            <Go href="/admin" title="待辦">市民回報與感測器通報，在這裡指派、結案</Go>
            <Go href="/status" title="清潔狀態">{`${DISTRICTS} 個行政區的桶況與一週滿溢趨勢`}</Go>
            <Go href="/bins" title="桶一覽">每個桶的編號、地址與感測器數值</Go>
            {/* 「開放試用」標籤和資料集的「範例資料」同一種膠囊，標示不是真實資料；也補齊兩格的高度差 */}
            <p className="demo-note"><b>開放試用</b>案件、感測器數值與一週趨勢都是模擬資料，任何人都能指派、結案，不會影響真實清運。</p>
          </section>
        </div>
      </nav>

      <div className="story">
        <section className="sec" aria-labelledby="s-problem">
          <h2 id="s-problem">撤桶的理由，正是家用垃圾</h2>
          <p>
            環保局說明撤桶的主要原因，是家戶垃圾被違規丟進行人垃圾桶<Ref n={1} />。撤了之後，走在路上的人還是有垃圾要丟。我們從三個每天都會遇到的情境開始：
          </p>
          <div className="scenes">
            <div className="scene"><h3>手上一杯飲料，找不到桶</h3><p>附近的桶撤了，地圖上也查不到下一個在哪裡。</p></div>
            <div className="scene"><h3>找到了，桶卻滿了</h3><p>沒有人知道哪個桶已經滿出來，等到有人看見，垃圾已經堆在桶旁。</p></div>
            <div className="scene"><h3>下班錯過垃圾車</h3><p>家裡的垃圾沒地方去，就被帶出門塞進街上的桶，這正是撤桶的理由。</p></div>
          </div>
          <div className="other-unit">
            <p className="other-count"><b>{fmt(BINS.length)} 點</b><span>開放資料主表<Ref n={2} />，單位是「點」，不能和官方的「組」相加減</span></p>
            <p>
              一個點可能放不只一組桶，所以主表的點數不能和官方組數直接比較。公園、市場、捷運站的桶由各單位自管，主表可能沒有收錄；主表也不含北投區。清冊沒有固定箱號，更沒有每個桶多久滿一次、多久收一次的紀錄；環保局說設桶、撤桶「有一定標準」，但標準沒有公開<Ref n={1} />。
            </p>
          </div>
          <p className="src">題目頁與網路流傳的「近 3,000 組」查不到一手出處，本頁不採用。</p>
        </section>

        <section className="sec" aria-labelledby="s-ideas">
          <h2 id="s-ideas">設計理念</h2>
          <div className="ideas">
            <div className="idea">
              <h3><svg viewBox="0 0 40 40" aria-hidden="true"><rect className="fill" x="9" y="6" width="22" height="28" rx="3" /><path d="M14 12h4v4h-4zM22 12h4v4h-4zM14 22h4v4h-4zM23 23h3M23 26h3" /></svg>掃了就能回報</h3>
              <p>每個桶貼一張 QR Code，網址帶著桶編號。不用下載 App、不用登入，選「滿了」「髒亂」「這裡沒有桶」就送出。</p>
            </div>
            <div className="idea">
              <h3><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 10h10l6 10M6 30h10l6-10h12" /><circle className="fill" cx="34" cy="20" r="3" /></svg>兩種來源，一張待辦</h3>
              <p>桶內感測器負責看滿溢，市民負責看感測器看不到的髒亂、損壞。兩邊進同一張待辦，同一個桶還沒處理完的回報併成一件，不會重複派工。</p>
            </div>
            <div className="idea">
              <h3><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 10h20l-2 24H12z" /><path className="fill" d="M12.6 18h14.8l-1.3 16H13.9z" /><path d="M8 10h24M17 6h6" /></svg><span><span className="nobr">滿了才派人，</span><wbr /><span className="nobr">但不只信感測器</span></span></h3>
              <p>
                桃園慈湖 20 組桶用「8 分滿才通知」，市府自述清運人力減少 50%<Ref n={4} />。臺北 112 年也試過，因為蓬鬆垃圾頻繁誤判而沒有採用<Ref n={3} />。所以感測器只是第一道訊號，市民回報與清運結案的紀錄用來交叉校正。
              </p>
            </div>
            <div className="idea">
              <h3><svg viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="14" width="22" height="14" rx="2" /><path className="fill" d="M26 18h6l4 5v5H26z" /><circle cx="11" cy="30" r="3" /><circle cx="30" cy="30" r="3" /></svg>家用垃圾也有去處</h3>
              <p>
                官方撤桶的理由是家戶垃圾<Ref n={1} />，所以市民端同時查得到 {fmt(TRUCK_STOPS)} 個垃圾車停靠點<Ref n={5} />和 {itrash.length} 個 iTrash 站<Ref n={6} />。錯過垃圾車，也查得到下一個去處。
              </p>
            </div>
          </div>
        </section>

        <section className="sec" id="flow" aria-labelledby="s-flow">
          <h2 id="s-flow">一件案件怎麼走完，自己試一次</h2>
          <p>
            這次試玩用桶 {trial}，帶箭頭的連結會另開分頁。回報與案件都是測試資料，任何人都能操作，其他訪客也可能同時在待辦上指派或結案。
          </p>
          {/* 流程圖本身就是試玩步驟：有動作的那幾格附上連結，不另寫一份說明 */}
          <ol className="flow">
            <li className="sources">
              <div className="step in"><b>感測器</b><span>桶內容量超過 8 成，自動通報</span><Ext href={adminUrl} target={ADMIN_TAB}>按「模擬感測器」</Ext></div>
              <div className="step in"><b>市民</b><span>掃桶上的 QR Code，回報滿了或髒亂</span><Ext href={binUrl} target={REPORT_TAB}>開桶 {trial} 的回報頁</Ext></div>
            </li>
            <Arrow />
            <li className="step"><em className="st-open">{STATUS_LABEL.open}</em><b>開成一件案件</b><span>同一個桶已有未完成的案件，就併進去</span></li>
            <Arrow />
            <li className="step"><em className="st-assigned">{STATUS_LABEL.assigned}</em><b>管理端派工</b><span>在待辦地圖上看位置，指派給清潔隊</span><Ext href={adminUrl} target={ADMIN_TAB}>到待辦按「指派」</Ext></li>
            <Arrow />
            <li className="step"><em className="st-done">{STATUS_LABEL.done}</em><b>清潔隊收完結案</b><span>在待辦按「標記完成」，案件留下回報到結案的時間</span></li>
            <Arrow />
            <li className="step last"><b>市民看到進度</b><span>回報頁 2 秒內跟著更新，不用重新整理</span></li>
          </ol>
          {/* 桌機：用手機掃 QR Code 當市民，正是產品在路邊的用法。手機：沒有第二台裝置，改成在兩個分頁間切換 */}
          <div className="scan">
            <Qr url={location.origin + binUrl} />
            <p><b>用手機掃，當一次市民</b><span>手機開桶 {trial} 的回報頁，這台電腦開待辦，並排看進度怎麼變。</span></p>
          </div>
          <p className="solo"><b>只有手機？</b>回報頁和待辦會各開一個分頁：先送出回報，切到待辦按「指派」，再切回回報頁看進度。</p>
        </section>

        <section className="goal" id="goal" aria-labelledby="s-goal">
          <h2 id="s-goal">最終目標：補上缺少的<mark><span className="nobr">行人垃圾桶</span>即時滿溢資料集</mark></h2>
          <p>
            目前所有公開的桶位清冊都只有位置，沒有任何開放資料記錄桶的滿溢狀態<Ref n={2} />。桶緝犯把每一次感測器通報、市民回報和清運結案都寫成一筆紀錄，累積下來，就能回答哪個桶多久滿一次、滿了多久才有人收。有了這份資料，設桶、撤桶和清運路線才能用數據討論。
          </p>
          <div className="dataset">
            <div className="ds-head"><h3>臺北市行人垃圾桶即時滿溢資料集</h3><span>規劃中，試點後產生</span></div>
            <dl className="ds-meta">
              <div><dt>更新方式</dt><dd>事件發生即寫入</dd></div>
              <div><dt>資料來源</dt><dd>感測器、市民回報、清運結案</dd></div>
              <div><dt>格式</dt><dd>JSON、CSV、API</dd></div>
              <div><dt>授權</dt><dd>開放授權（待定）</dd></div>
            </dl>
            {/* 示意說明放在表格外，手機橫捲表格時也一直看得到 */}
            <p className="ds-note" id="ds-cap"><b>範例資料</b>桶編號與位置取自開放資料；時間、容量與案件狀態為示意，不是真實紀錄。</p>
            <div className="tbl" tabIndex={0} role="region" aria-labelledby="ds-cap">
              <table>
                <thead>
                  <tr><th>時間</th><th>桶編號</th><th>狀況</th><th>案件狀態</th><th>回報到結案</th><th>來源</th><th>容量</th><th>行政區</th><th>位置</th></tr>
                </thead>
                <tbody>
                  {SAMPLE.map((r) => {
                    const p = binById(r.bin).properties;
                    return (
                      <tr key={r.time}>
                        <td>{r.time}</td><td><code>{r.bin}</code></td><td>{r.kind}</td><td>{r.status}</td><td>{r.took}</td>
                        <td>{r.source}</td><td>{r.fill}</td><td>{p.district}</td><td>{p.address}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <ul className="uses">
            <li><b>動態清運</b><span>依即時滿溢排路線，滿了才去收，取代固定班表。</span></li>
            <li><b>設桶、撤桶有公開依據</b><span>用每個桶多常滿、多常被回報來評估，標準可以公開、可以重算。</span></li>
            <li><b>找出缺口</b><span>對照捷運、YouBike 人流與「這裡沒有桶」的回報，找出該補桶的地方。</span></li>
            <li><b>其他縣市可沿用</b><span>欄位格式公開，原始碼放在 GitHub，換一份桶位清冊就能用。</span></li>
          </ul>
        </section>

        <section className="sec" id="refs" aria-labelledby="s-refs">
          <h2 id="s-refs">資料來源</h2>
          <p className="src">分級：A 官方一手資料、B 主流媒體或廠商官方資料。「已交叉確認」表示關鍵主張有獨立來源佐證；「部分確認」表示仍有主張只有單一來源。</p>
          <ol className="refs">
            <li id="r1">
              <div>
                <b>環保局議會說明：約 2,000 組減到 806 組，撤桶主因是家戶垃圾，評估標準未公開</b>
                <span><Ext href="https://udn.com/news/story/7323/9641642">聯合報〈北市2年撤除上千組垃圾桶〉2026-07-21</Ext>；<Ext href="https://www.cna.com.tw/news/aloc/202608040144.aspx">中央社〈北市：逐年減少行人垃圾桶〉2026-08-04</Ext></span>
              </div>
              <em>B · 已交叉確認</em>
              <Back n={1} />
            </li>
            <li id="r2">
              <div>
                <b>臺北市行人專用清潔箱：主表 {fmt(BINS.length)} 點，{DISTRICTS} 區，不含北投，沒有箱號與滿溢欄位</b>
                <span><Ext href="https://data.gov.tw/dataset/121355">環保局，data.gov.tw 資料集 121355</Ext>，2026-10-21 更新</span>
              </div>
              <em>A · 已交叉確認</em>
              <Back n={2} />
            </li>
            <li id="r3">
              <div>
                <b>臺北 112 年「8 分滿回報」感測試辦，因蓬鬆垃圾頻繁誤判未採用</b>
                <span><Ext href="https://money.udn.com/money/story/7307/8944421">經濟日報，2025-08-17</Ext>；僅環保局說法，未寫廠商</span>
              </div>
              <em>B · 部分確認</em>
              <Back n={3} />
            </li>
            <li id="r4">
              <div>
                <b>桃園慈湖 20 組智慧桶，8 分滿通知，清運人力減少 50%</b>
                <span><Ext href="https://www.smart-taoyuan.tw/City/Case/10">智慧桃園官方案例頁（113 年）</Ext>；成效為市府自述，沒有獨立佐證</span>
              </div>
              <em>A · 部分確認</em>
              <Back n={4} />
            </li>
            <li id="r5">
              <div>
                <b>臺北市垃圾車點位路線：4,012 點，含停靠時刻</b>
                <span><Ext href="https://data.taipei/dataset/detail?id=6bb3304b-4f46-4bb0-8cd1-60c66dcd1cae">環保局，data.taipei</Ext>；本站轉檔時剔除欄位不完整的資料，保留 {fmt(TRUCK_STOPS)} 點</span>
              </div>
              <em>A · 部分確認</em>
              <Back n={5} />
            </li>
            <li id="r6">
              <div>
                <b>iTrash 服務站點：{itrash.length} 站，萬華、中正 0 站</b>
                <span><Ext href="https://www.itrash.com.tw/pages/site">iTrash 官網站點頁</Ext>，2026-10-23 擷取</span>
              </div>
              <em>B · 部分確認</em>
              <Back n={6} />
            </li>
          </ol>
          <p className="src">以上整理自我們的議題研究筆記（目前未公開）。</p>
        </section>

        <footer className="foot">
          <span>黑客松「市長，你給我聽好了」題目 #2 找回消失的垃圾桶</span>
          <a href="#start">回到入口</a>
          <a href="#flow">回到試玩</a>
          <Ext href="https://github.com/cyl-jsl/hackathon-puma-for-team">GitHub 原始碼</Ext>
          {/* 手機的頁首不放版號，改放這裡 */}
          <span className="foot-ver">版本 {__BUILD__.short}</span>
        </footer>
      </div>
    </main>
  );
}
