import path from 'path';
import fs from "fs";

// Options type
interface Options {
	projectRoot?: string; // Override the root directory
	relativePath?: string; // Relative path from the root, defaults to "auth"
}

export function resolveAuthRoutePath(options: Options = {}): string {
	let projectRoot = undefined

	if (options.projectRoot) {
		projectRoot = path.resolve(options.projectRoot);
	} else {
		let currentDir = process.cwd();

		if (fs.existsSync(path.join(currentDir, "encore.app"))) {
			projectRoot = currentDir;
		} else {
			// Climb up if not found in cwd
			while (currentDir !== path.parse(currentDir).root) {
				currentDir = path.dirname(currentDir);
				if (fs.existsSync(path.join(currentDir, "encore.app"))) {
					projectRoot = currentDir;
					break;
				}
			}
			// Fallback to cwd if encore.app isn’t found (with warning)
			if (!projectRoot) {
				console.warn(
					"encore.app not found above cwd. Using cwd as root. Pass projectRoot if incorrect.",
				);
				projectRoot = process.cwd();
			}
		}
	}

  const relativePath = options.relativePath ?? "auth/better-auth.routes.ts";
	return path.join(projectRoot, relativePath);
}