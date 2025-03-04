import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	rollup: {
		emitCJS: true,
		esbuild: {
			treeShaking: true,
		},
	},
	declaration: true,
	outDir: "dist",
	clean: false,
	failOnWarn: false,
	externals: [
		"better-sqlite3",
		"react",
		// "next/headers",
		"$app/environment",
		"vitest",
		"@vitest/runner",
		"@vitest/utils",
		"@vitest/expect",
		"@vitest/snapshot",
		"@vitest/spy",
		"better-auth",
		"encore.dev",
	],
	entries: [
		"./src/index.ts",
		"./src/types/index.ts",
		"./src/encore/index.ts",
		"./src/generator/index.ts",
		// "./src/plugins/example/index.ts",
	],
});
