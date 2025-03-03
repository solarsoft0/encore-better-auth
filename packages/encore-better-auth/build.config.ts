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
		"prisma",
		"@prisma/client",
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
	],
	entries: [
		"./src/index.ts",
		"./src/types/index.ts",
		// "./src/plugins/example/index.ts",
	],
});
