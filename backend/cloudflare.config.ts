import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "tongjifan-api",
		compatibilityDate: "2026-09-25",
		entrypoint,
		// issues：例外、5xx、console.error 會記成 Issue，再由 dashboard 的 automation 通知 Discord
		observability: { enabled: true, issues: { enabled: true } },
		// 只經由前端的 service binding 呼叫，不開 workers.dev 與預覽網址
		workersDev: false,
		previewUrls: false,
		env: {
			DB: bindings.d1({ id: "b768b5e7-71b4-4ef5-88a5-1ce2d69085c3", name: "tongjifan" }),
			// SLI 資料點，欄位見 src/sli.ts；dataset 在第一次寫入時自動建立
			SLI: bindings.analyticsEngineDataset({ name: "tongjifan_sli" }),
		},
	},
});
