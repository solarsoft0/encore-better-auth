import { betterAuth } from "better-auth";
import { getEndpoints } from "better-auth/api";
import fs from "fs";
import { createEncoreHandlers, getValidatedSession } from "./encore";
import { createEncoreMiddlewares } from "./encore/handler";
import { generateEncoreRoutes } from "./generator";
import {
	callbackOAuthPlugin,
	createSignUpEmailPlugin,
	createUpdateUserPlugin,
} from "./route-generators";
import type { EncoreBetterAuth, EncoreBetterAuthOptions } from "./types";
import { resolveAuthRoutePath } from './utils/path';




export function encoreBetterAuth<O extends EncoreBetterAuthOptions>(
	options: O,
): EncoreBetterAuth<O> {
	const auth = betterAuth(options);
	const { $context } = auth;
	const { api: apiEndpoints, middlewares } = getEndpoints($context, options);

	const encoreHandlers = createEncoreHandlers(apiEndpoints, options);
	if (options?.generateRoutes) {
		const outputPath = resolveAuthRoutePath({
			projectRoot: options.projectRoot,
			relativePath: options.relativePath,
		});
			options.outputPath ?? outputPath;

		let shouldGenerate = true;
		try {
			const stats = fs.statSync(outputPath);
			if (stats.isFile() && stats.size > 0) {
				shouldGenerate = false; // File exists and is not empty
			}
		} catch (error: any) {
			// If file doesn't exist (ENOENT), proceed with generation
			// @ts-ignore
			if (error.code !== "ENOENT") {
				throw error; // Rethrow other errors (permissions, etc.)
			}
		}

		if (shouldGenerate) {
			generateEncoreRoutes($context, options, {
				plugins: [
					callbackOAuthPlugin,
					createSignUpEmailPlugin(options),
					createUpdateUserPlugin(options),
					...(options.generatorPlugins || []),
				],
			}).then((value) => {
				fs.writeFileSync(outputPath, value);
				console.log(`Routes file generated at: ${outputPath}`);
			});
		} else {
			console.log(
				`Routes file already exists and is not empty at: ${outputPath}, manually clear file or delete to update.`,
			);
		}
	}

	return {
		routeHandlers: encoreHandlers,
		middlewares: createEncoreMiddlewares(middlewares, $context, options),
		getValidatedSession: getValidatedSession(apiEndpoints),
		...auth,
	};
}
