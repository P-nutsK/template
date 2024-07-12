import { defineConfig } from "vitest/config";
export default defineConfig({
	test: {
		// ここに Vitest 用の設定を書き込んでいく
		globals: true,
		coverage: {
			enabled: true,
			provider: "v8",
		},
	},
});
