import { useEffect } from "react";
import itrash from "../../../data/itrash.json";
import { BINS, binById } from "../shared/api";
import { LogoMark } from "../shared/Logo";
import "./entry.css";

// 垃圾車停靠點數；trucks.json 有 1MB，入口站只要一個數字，不打包整份。重跑 etl/trucks.py 後要跟著改
const TRUCK_STOPS = 4009;
const DISTRICTS = new Set(BINS.map((b) => b.properties.district)).size;
const fmt = (n: number) => n.toLocaleString("zh-TW");

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

// 註腳，對到頁尾「資料來源」的編號
const Ref = ({ n }: { n: number }) => (
  <sup>
    <a href={`#r${n}`} aria-label={`資料來源 ${n}`}>{n}</a>
  </sup>
);

// <ol> 只能放 <li>，箭頭也包成 li，對螢幕閱讀器隱藏
const Arrow = () => (
  <li className="arrow" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  </li>
);

// 資料集範例列：桶編號與位置取自 bins.json，其餘欄位是示意
const SAMPLE = [
  { time: "10/28 08:12", bin: 300, source: "感測器", kind: "滿了", fill: "86%", status: "已完成", took: "42 分" },
  { time: "10/28 08:20", bin: 300, source: "市民", kind: "髒亂", fill: "－", status: "已完成", took: "併入上一件" },
  { time: "10/28 09:05", bin: 451, source: "市民", kind: "這裡沒有桶", fill: "－", status: "待處理", took: "－" },
];

export default function Entry() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.append(link);
  }, []);

  return (
    <main className="entry">
      <div className="intro">
        <p className="lockup"><LogoMark size={44} /><span>桶緝犯</span></p>
        <h1>找桶、回報，<br />讓清潔隊來收。</h1>
        <p>
          開放資料收錄的 <strong>{fmt(BINS.length)}</strong> 個行人垃圾桶<Ref n={2} />，位置、回報與清潔進度都在這裡。
        </p>
      </div>

      <div className="bin" aria-label="入口">
        <div className="handle" aria-hidden="true" />
        <div className="lid" aria-hidden="true" />
        <div className="body">
          <section className="chute public" aria-labelledby="h-citizen">
            <div className="slot"><b id="h-citizen">市民</b><span>找桶、丟家用垃圾</span></div>
            <Go href="/map" title="地圖找桶">{`開放資料的 ${fmt(BINS.length)} 個行人垃圾桶，找離你最近的一個`}</Go>
            <Go href="/trash" title="家用垃圾">{`${fmt(TRUCK_STOPS)} 個垃圾車停靠點與 ${itrash.length} 個 iTrash 站，查最近的時間和地點`}</Go>
            <div className="sticker">
              <span className="qr" aria-hidden="true"><i /></span>
              <p><b>桶滿了、很髒？</b></p>
              <p>掃桶身上的 QR Code 回報。想先看看：<a href="/b/300">開啟桶 300 的回報頁</a></p>
            </div>
          </section>
          <section className="chute staff" aria-labelledby="h-staff">
            <div className="slot"><b id="h-staff">管理端</b><span>清潔隊與承辦人</span></div>
            <Go href="/" title="待辦">市民回報與感測器通報，在這裡指派、結案</Go>
            <Go href="/status" title="清潔狀態">{`${DISTRICTS} 個行政區的桶況與一週滿溢趨勢`}</Go>
            <Go href="/bins" title="桶一覽">每個桶的編號、地址與感測器數值</Go>
          </section>
        </div>
      </div>

      <div className="story">
        <section className="sec" aria-labelledby="s-problem">
          <h2 id="s-problem">兩年內，臺北的行人垃圾桶從約 2,000 組減到 806 組</h2>
          <p>
            環保局說明撤桶的主要原因，是家戶垃圾被違規丟進行人垃圾桶<Ref n={1} />。撤了之後，走在路上的人還是有垃圾要丟。我們從三個每天都會遇到的情境開始：
          </p>
          <div className="scenes">
            <div className="scene"><h3>手上一杯飲料，找不到桶</h3><p>附近的桶撤了，地圖上也查不到下一個在哪裡。</p></div>
            <div className="scene"><h3>找到了，桶卻滿了</h3><p>沒有人知道哪個桶已經滿出來，等到有人看見，垃圾已經堆在桶旁。</p></div>
            <div className="scene"><h3>下班錯過垃圾車</h3><p>家裡的垃圾沒地方去，就被帶出門塞進街上的桶，這正是撤桶的理由。</p></div>
          </div>
          <div className="counts" aria-label="臺北市行人垃圾桶數量">
            <div className="count"><b>約 2,000</b><span>2024 年，官方組數<Ref n={1} /></span></div>
            <div className="count"><b>806</b><span>2026-07，官方組數<Ref n={1} /></span></div>
            <div className="count"><b>{fmt(BINS.length)}</b><span>開放資料主表點數<Ref n={2} /></span></div>
            <p>
              開放資料比官方組數少 {806 - BINS.length}。公園、市場、捷運站的桶由各單位自管，主表可能沒有收錄；主表也不含北投區。清冊沒有固定箱號，更沒有每個桶多久滿一次、多久收一次的紀錄；環保局說設桶、撤桶「有一定標準」，但標準沒有公開<Ref n={1} />。
            </p>
          </div>
          <p className="src">「組」和「點」的計算單位不同，三個數字不能互相加減。題目頁與網路流傳的「近 3,000 組」查不到一手出處，本頁不採用。</p>
        </section>

        <section className="sec" aria-labelledby="s-ideas">
          <h2 id="s-ideas">設計理念</h2>
          <div className="ideas">
            <div className="idea">
              <svg viewBox="0 0 40 40" aria-hidden="true"><rect className="fill" x="9" y="6" width="22" height="28" rx="3" /><path d="M14 12h4v4h-4zM22 12h4v4h-4zM14 22h4v4h-4zM23 23h3M23 26h3" /></svg>
              <h3>掃了就能回報</h3>
              <p>每個桶貼一張 QR Code，網址帶著桶編號。不用下載 App、不用登入，選「滿了」「髒亂」「這裡沒有桶」就送出。</p>
            </div>
            <div className="idea">
              <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 10h10l6 10M6 30h10l6-10h12" /><circle className="fill" cx="34" cy="20" r="3" /></svg>
              <h3>兩種來源，一張待辦</h3>
              <p>桶內感測器負責看滿溢，市民負責看感測器看不到的髒亂、損壞。兩邊進同一張待辦，同一個桶還沒處理完的回報併成一件，不會重複派工。</p>
            </div>
            <div className="idea">
              <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 10h20l-2 24H12z" /><path className="fill" d="M12.6 18h14.8l-1.3 16H13.9z" /><path d="M8 10h24M17 6h6" /></svg>
              <h3>滿了才派人，但不只信感測器</h3>
              <p>
                桃園慈湖 20 組桶用「8 分滿才通知」，市府自述清運人力減少 50%<Ref n={4} />。臺北 112 年也試過，因為蓬鬆垃圾頻繁誤判而沒有採用<Ref n={3} />。所以感測器只是第一道訊號，市民回報與清運結案的紀錄用來交叉校正。
              </p>
            </div>
            <div className="idea">
              <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="14" width="22" height="14" rx="2" /><path className="fill" d="M26 18h6l4 5v5H26z" /><circle cx="11" cy="30" r="3" /><circle cx="30" cy="30" r="3" /></svg>
              <h3>家用垃圾也有去處</h3>
              <p>
                官方撤桶的理由是家戶垃圾<Ref n={1} />，所以市民端同時查得到 {fmt(TRUCK_STOPS)} 個垃圾車停靠點<Ref n={5} />和 {itrash.length} 個 iTrash 站<Ref n={6} />。錯過垃圾車，也查得到下一個去處。
              </p>
            </div>
          </div>
        </section>

        <section className="sec" aria-labelledby="s-flow">
          <h2 id="s-flow">一件案件怎麼走完</h2>
          <ol className="flow">
            <li className="sources">
              <div className="step in"><b>感測器</b><span>桶內容量超過 8 成，自動通報</span></div>
              <div className="step in"><b>市民</b><span>掃桶上的 QR Code，回報滿了或髒亂</span></div>
            </li>
            <Arrow />
            <li className="step"><em className="st-open">待處理</em><b>開成一件案件</b><span>同一個桶已有未完成的案件，就併進去</span></li>
            <Arrow />
            <li className="step"><em className="st-assigned">已指派</em><b>管理端派工</b><span>在待辦地圖上看位置，指派給清潔隊</span></li>
            <Arrow />
            <li className="step"><em className="st-done">已完成</em><b>清潔隊收完結案</b><span>案件留下回報到結案的時間</span></li>
            <Arrow />
            <li className="step last"><b>市民看到進度</b><span>回報頁 2 秒內跟著更新，知道有人來收了</span></li>
          </ol>
          <div className="flow-notes">
            <p><b>市民</b>只需要做一件事：掃描、選一個狀況、送出。之後的進度在同一頁看得到。</p>
            <p><b>清潔隊</b>看的是同一張待辦，來源標在案件上，感測器和市民回報不用分兩套處理。</p>
            <p><b>承辦人</b>在清潔狀態頁看各區的桶況與一週趨勢，在桶一覽找個別的桶。</p>
          </div>
        </section>

        <section className="goal" aria-labelledby="s-goal">
          <h2 id="s-goal">最終目標：補上缺少的<mark>行人垃圾桶即時滿溢資料集</mark></h2>
          <p>
            目前所有公開的桶位清冊都只有位置，沒有任何開放資料記錄桶的滿溢狀態<Ref n={2} />。桶緝犯把每一次感測器通報、市民回報和清運結案都寫成一筆紀錄，累積下來，就能回答哪個桶多久滿一次、滿了多久才有人收。有了這份資料，設桶、撤桶和清運路線才能用數據討論，為智慧城市的清運治理補上一塊基礎。
          </p>
          <div className="dataset">
            <div className="ds-head"><h3>臺北市行人垃圾桶即時滿溢資料集</h3><span>規劃中，試點後產生</span></div>
            <dl className="ds-meta">
              <div><dt>更新方式</dt><dd>事件發生即寫入</dd></div>
              <div><dt>資料來源</dt><dd>感測器、市民回報、清運結案</dd></div>
              <div><dt>格式</dt><dd>JSON、CSV、API</dd></div>
              <div><dt>授權</dt><dd>開放授權（待定）</dd></div>
            </dl>
            <div className="tbl">
              <table>
                <thead>
                  <tr><th>時間</th><th>桶編號</th><th>行政區</th><th>位置</th><th>來源</th><th>狀況</th><th>容量</th><th>案件狀態</th><th>回報到結案</th></tr>
                </thead>
                <tbody>
                  {SAMPLE.map((r) => {
                    const p = binById(r.bin).properties;
                    return (
                      <tr key={r.time}>
                        <td>{r.time}</td><td><code>{r.bin}</code></td><td>{p.district}</td><td>{p.address}</td>
                        <td>{r.source}</td><td>{r.kind}</td><td>{r.fill}</td><td>{r.status}</td><td>{r.took}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="ds-foot">範例資料：桶編號與位置取自開放資料，時間、容量與案件狀態為示意。</div>
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
                <span><a href="https://udn.com/news/story/7323/9641642" target="_blank" rel="noreferrer">聯合報〈北市2年撤除上千組垃圾桶〉2026-07-21</a>；<a href="https://www.cna.com.tw/news/aloc/202608040144.aspx" target="_blank" rel="noreferrer">中央社〈北市：逐年減少行人垃圾桶〉2026-08-04</a></span>
              </div>
              <em>B · 已交叉確認</em>
            </li>
            <li id="r2">
              <div>
                <b>臺北市行人專用清潔箱：主表 {fmt(BINS.length)} 點，{DISTRICTS} 區，不含北投，沒有箱號與滿溢欄位</b>
                <span><a href="https://data.gov.tw/dataset/121355" target="_blank" rel="noreferrer">環保局，data.gov.tw 資料集 121355</a>，2026-10-21 更新</span>
              </div>
              <em>A · 已交叉確認</em>
            </li>
            <li id="r3">
              <div>
                <b>臺北 112 年「8 分滿回報」感測試辦，因蓬鬆垃圾頻繁誤判未採用</b>
                <span><a href="https://money.udn.com/money/story/7307/8944421" target="_blank" rel="noreferrer">經濟日報，2025-08-17</a>；僅環保局說法，未寫廠商</span>
              </div>
              <em>B · 部分確認</em>
            </li>
            <li id="r4">
              <div>
                <b>桃園慈湖 20 組智慧桶，8 分滿通知，清運人力減少 50%</b>
                <span><a href="https://www.smart-taoyuan.tw/City/Case/10" target="_blank" rel="noreferrer">智慧桃園官方案例頁（113 年）</a>；成效為市府自述，沒有獨立佐證</span>
              </div>
              <em>A · 部分確認</em>
            </li>
            <li id="r5">
              <div>
                <b>臺北市垃圾車點位路線：4,012 點，含停靠時刻</b>
                <span><a href="https://data.taipei/dataset/detail?id=6bb3304b-4f46-4bb0-8cd1-60c66dcd1cae" target="_blank" rel="noreferrer">環保局，data.taipei</a>；本站轉檔時剔除欄位不完整的資料，保留 {fmt(TRUCK_STOPS)} 點</span>
              </div>
              <em>A</em>
            </li>
            <li id="r6">
              <div>
                <b>iTrash 服務站點：{itrash.length} 站，萬華、中正 0 站</b>
                <span><a href="https://www.itrash.com.tw/pages/site" target="_blank" rel="noreferrer">iTrash 官網站點頁</a>，2026-10-23 擷取</span>
              </div>
              <em>B · 部分確認</em>
            </li>
          </ol>
          <p className="src">以上整理自議題研究知識庫 the-wanted-can-wiki 的來源卡。回報、案件與感測器數值為測試資料。</p>
        </section>

        <footer className="foot">
          <span>黑客松「市長，你給我聽好了」題目 #2 找回消失的垃圾桶</span>
          <a href="https://github.com/cyl-jsl/hackathon-puma-for-team" target="_blank" rel="noreferrer">GitHub 原始碼</a>
        </footer>
      </div>
    </main>
  );
}
