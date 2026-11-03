// SLI 紀錄：每個 API 請求寫一個資料點到 Workers Analytics Engine（dataset tongjifan_sli）。
// 欄位定義與查詢範例見 ARCHITECTURE.md「可觀測性」。
//
// 欄位一旦上線就不要改順序，舊資料點會對不上：
//   index1  路由（例如 "GET /api/cases/:id"）
//   blob1   路由（同 index1，方便 SQL 直接 GROUP BY）
//   double1 HTTP 狀態碼
//   double2 耗時（ms），Worker 收到請求到產生回應，含等 D1 的時間
//   double3 這個請求在 D1 讀了幾列（所有查詢的 meta.rows_read 加總）
//   double4 權重：抽樣時 1 筆代表幾個請求，算總數要用 SUM(double4)

// 成功的案件列表輪詢每 10 筆只記 1 筆：一個管理端分頁一天就有 43,200 次，
// 全記會用掉 Free 方案每天 10 萬個資料點的 43%。錯誤一律全記。
const LIST_SAMPLE_RATE = 10;

// 累計一個請求在 D1 讀了幾列。first() 不回傳 meta，所以一律改用 all()／run()。
export class Meter {
  rowsRead = 0;

  async all<T>(stmt: D1PreparedStatement): Promise<T[]> {
    const res = await stmt.all<T>();
    this.rowsRead += res.meta.rows_read ?? 0;
    return res.results;
  }

  async first<T>(stmt: D1PreparedStatement): Promise<T | null> {
    return (await this.all<T>(stmt))[0] ?? null;
  }

  async run(stmt: D1PreparedStatement): Promise<void> {
    const res = await stmt.run();
    this.rowsRead += res.meta.rows_read ?? 0;
  }
}

// 把路徑上的編號換成 :id，避免每件案件各自變成一條路由
export function routeOf(req: Request, url: URL): string {
  const path = url.pathname.replace(/^\/api\/cases\/\d+$/, "/api/cases/:id");
  const known = ["/api/reports", "/api/cases", "/api/cases/:id", "/api/health"];
  return `${req.method} ${known.includes(path) ? path : "other"}`;
}

export function record(dataset: AnalyticsEngineDataset | undefined, route: string, status: number, ms: number, rowsRead: number) {
  if (!dataset) return;
  let weight = 1;
  if (route === "GET /api/cases" && status < 400) {
    if (Math.random() >= 1 / LIST_SAMPLE_RATE) return;
    weight = LIST_SAMPLE_RATE;
  }
  // writeDataPoint 不用 await，不會拖慢回應；寫入失敗也不影響請求
  try {
    dataset.writeDataPoint({ indexes: [route], blobs: [route], doubles: [status, ms, rowsRead, weight] });
  } catch (e) {
    console.error("sli: writeDataPoint failed", e);
  }
}
