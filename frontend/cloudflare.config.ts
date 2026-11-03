import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    "name": "tongjifan",
    "compatibilityDate": "2026-09-25",
    "entrypoint": "./worker/index.ts",
    // issues：例外、5xx、console.error 會記成 Issue，再由 dashboard 的 automation 通知 Discord
    "observability": {
      "enabled": true,
      "issues": { "enabled": true }
    },
    "assets": {
      "notFoundHandling": "single-page-application",
      "runWorkerFirst": ["/api/*"]
    },
    "env": {
      "API": bindings.worker({ worker: "tongjifan-api" })
    }
  }
});
