import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
	worker: {
		name: "tongjifan-api",
		compatibilityDate: "2026-09-25",
		entrypoint,
		observability: { enabled: true },
		env: {
			DB: bindings.d1({ id: "b768b5e7-71b4-4ef5-88a5-1ce2d69085c3", name: "tongjifan" }),
		},
	},
});
