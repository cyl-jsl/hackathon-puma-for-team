import bins from "../../data/bins.json";
import { Meter, record, routeOf } from "./sli";

const SOURCES = ["sensor", "citizen"];
const KINDS = ["full", "dirty", "missing"];
const STATUSES = ["open", "assigned", "done"];
const BIN_COUNT = bins.features.length;

const CASE_SELECT = `
  SELECT c.*,
    SUM(r.source = 'sensor') AS sensor_reports,
    SUM(r.source = 'citizen') AS citizen_reports,
    GROUP_CONCAT(DISTINCT r.kind) AS kinds
  FROM cases c LEFT JOIN reports r ON r.case_id = c.id`;

const json = (body: unknown, status = 200) => Response.json(body, { status });
const error = (status: number, message: string) => json({ error: message }, status);

async function getCase(db: D1Database, m: Meter, id: number) {
  return m.first(db.prepare(`${CASE_SELECT} WHERE c.id = ? GROUP BY c.id`).bind(id));
}

async function createReport(req: Request, db: D1Database, m: Meter) {
  const body = (await req.json().catch(() => null)) as { bin_id?: unknown; source?: unknown; kind?: unknown } | null;
  const binId = Number(body?.bin_id);
  if (!Number.isInteger(binId) || binId < 1 || binId > BIN_COUNT) return error(400, "invalid bin_id");
  if (!SOURCES.includes(body?.source as string)) return error(400, "invalid source");
  if (!KINDS.includes(body?.kind as string)) return error(400, "invalid kind");

  // 先查再新增是兩個語句，同時進來的回報會各開一張案件；
  // 改成單一 INSERT ... WHERE NOT EXISTS，D1 一次只執行一個寫入語句，就不會重複開案
  const created = await m.first<{ id: number }>(
    db
      .prepare("INSERT INTO cases (bin_id) SELECT ?1 WHERE NOT EXISTS (SELECT 1 FROM cases WHERE bin_id = ?1 AND status IN ('open', 'assigned')) RETURNING id")
      .bind(binId),
  );
  const caseId =
    created?.id ??
    (await m.first<{ id: number }>(
      db.prepare("SELECT id FROM cases WHERE bin_id = ? AND status IN ('open', 'assigned') ORDER BY id DESC LIMIT 1").bind(binId),
    ))!.id;
  await m.run(db.prepare("INSERT INTO reports (case_id, source, kind) VALUES (?, ?, ?)").bind(caseId, body!.source, body!.kind));
  return json(await getCase(db, m, caseId), created ? 201 : 200);
}

async function listCases(url: URL, db: D1Database, m: Meter) {
  const status = url.searchParams.get("status");
  if (status && !STATUSES.includes(status)) return error(400, "invalid status");
  const where = status ? "WHERE c.status = ?" : "";
  const stmt = db.prepare(`${CASE_SELECT} ${where} GROUP BY c.id ORDER BY c.id DESC`);
  return json(await m.all(status ? stmt.bind(status) : stmt));
}

async function updateCase(req: Request, db: D1Database, m: Meter, id: number) {
  const body = (await req.json().catch(() => null)) as { status?: unknown; team?: unknown } | null;
  const next = body?.status;
  if (next !== "assigned" && next !== "done") return error(400, "invalid status");
  const current = await m.first<{ status: string }>(db.prepare("SELECT status FROM cases WHERE id = ?").bind(id));
  if (!current) return error(404, "case not found");
  if (STATUSES.indexOf(next) <= STATUSES.indexOf(current.status)) return error(409, `cannot move ${current.status} to ${next}`);

  const team = typeof body?.team === "string" ? body.team : "清潔隊";
  const sql =
    next === "assigned"
      ? "UPDATE cases SET status = 'assigned', team = ?, assigned_at = datetime('now') WHERE id = ?"
      : "UPDATE cases SET status = 'done', team = COALESCE(team, ?), assigned_at = COALESCE(assigned_at, datetime('now')), done_at = datetime('now') WHERE id = ?";
  await m.run(db.prepare(sql).bind(team, id));
  return json(await getCase(db, m, id));
}

// 給外部探測用：只跑 SELECT 1，不讀業務資料表，探測再頻繁也幾乎不吃 D1 讀取額度。
// D1 失敗（包含每日額度用完）回 503，探測端就看得出「Worker 活著但資料庫不能用」。
async function health(db: D1Database, m: Meter) {
  const headers = { "cache-control": "no-store" };
  try {
    await m.first(db.prepare("SELECT 1"));
    return Response.json({ ok: true }, { headers });
  } catch (e) {
    // 錯誤細節只寫進 Workers Logs，不回給公開的探測請求
    console.error("health check: D1 failed", e);
    return Response.json({ ok: false, error: "database unavailable" }, { status: 503, headers });
  }
}

// 只給本機開發用：正式網址上的案件可能是隊友正在 Demo 的資料
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

async function clearCases(db: D1Database) {
  await db.batch([db.prepare("DELETE FROM reports"), db.prepare("DELETE FROM cases")]);
  return json({ ok: true });
}

async function route(req: Request, url: URL, db: D1Database, m: Meter): Promise<Response> {
  const caseMatch = url.pathname.match(/^\/api\/cases\/(\d+)$/);

  if (url.pathname === "/api/health" && req.method === "GET") return health(db, m);
  if (url.pathname === "/api/reports" && req.method === "POST") return createReport(req, db, m);
  if (url.pathname === "/api/cases" && req.method === "GET") return listCases(url, db, m);
  if (url.pathname === "/api/cases" && req.method === "DELETE" && LOCAL_HOSTS.includes(url.hostname)) return clearCases(db);
  if (caseMatch && req.method === "GET") {
    const found = await getCase(db, m, Number(caseMatch[1]));
    return found ? json(found) : error(404, "case not found");
  }
  if (caseMatch && req.method === "PATCH") return updateCase(req, db, m, Number(caseMatch[1]));
  return error(404, "not found");
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = new Meter();
    // Workers 的 Date.now() 只在 I/O（例如等 D1）之後前進，量到的是含 D1 往返的時間
    const start = Date.now();
    let status = 500;
    try {
      const res = await route(req, url, env.DB, m);
      status = res.status;
      return res;
    } finally {
      // 丟出例外時 status 維持 500，一樣記下來
      record(env.SLI, routeOf(req, url), status, Date.now() - start, m.rowsRead);
    }
  },
} satisfies ExportedHandler<Env>;
