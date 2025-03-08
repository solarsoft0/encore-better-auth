import { betterAuth } from "better-auth";
import { getEndpoints } from "better-auth/api";
import fs from "fs";
import path from "path";
import { generateEncoreRoutes } from "./generator";
import type { EncoreBetterAuth, EncoreBetterAuthOptions, FieldDefinition } from "./types";
import { createEncoreHandlers } from "./encore";
import { createEncoreMiddlewares } from "./encore/handler";
import { createPlugin } from './generator/plugin';

const projectRoot = process.cwd();

export const callbackOAuthPlugin = createPlugin(
	{
		name: "callbackOAuthPlugin",
		selector: (def) => def.name === "callbackOAuth", // Only apply to callbackOAuth endpoint
		verbose: true,
	},
	(definition) => {
		// Define the params structure
		const params: FieldDefinition[] = [
			{ name: "id", type: "string", optional: false },
			{ name: "state", type: "string", optional: true },
			{ name: "code", type: "string", optional: true },
			{ name: "device_id", type: "string", optional: true },
			{ name: "error", type: "string", optional: true },
			{ name: "error_description", type: "string", optional: true },
		];

		return {
			...definition,
			params,
			response: "void", // Response will be wrapped as { data: void } if wrapResponse is true
		};
	},
);

// Updated signUpEmailPlugin using the fixed version
export const signUpEmailPlugin = createPlugin(
	{
		name: "signUpEmailPlugin",
		selector: (def) => def.name === "signUpEmail",
		verbose: true,
	},
	(definition) => {
		const params: FieldDefinition[] = [
			{ name: "name", type: "string", optional: false },
			{ name: "email", type: "string", optional: false },
			{ name: "password", type: "string", optional: false },
		];

		const response: FieldDefinition[] = [
			{ name: "token", type: "null", optional: false },
			{
				name: "user",
				type: [
					{ name: "id", type: "string", optional: false },
					{ name: "email", type: "string", optional: false },
					{ name: "name", type: "string", optional: false },
					{
						name: "image",
						type: "string | null | undefined",
						optional: true,
					},
					{ name: "emailVerified", type: "boolean", optional: false },
					{ name: "createdAt", type: "Date", optional: false },
					{ name: "updatedAt", type: "Date", optional: false },
				],
				optional: false,
			},
		];

		return {
			...definition,
			params,
			response,
		};
	},
);


export const updateUserPlugin = createPlugin(
	{
		name: "updateUserPlugin",
		selector: (def) => def.name === "updateUser", // Target only updateUser endpoint
		verbose: true,
	},
	(definition) => {
		// Define the params structure
		const params: FieldDefinition[] = [
			{ name: "name", type: "string", optional: true },
			{ name: "image", type: "string | null", optional: true },
		];

		// Define the response structure with nested definitions
		const response: FieldDefinition[] = [
			{ name: "status", type: "boolean", optional: false },
		];

		// Return modified endpoint definition
		return {
			...definition,
			params,
			response,
		};
	},
);

export function encoreBetterAuth<O extends EncoreBetterAuthOptions>(
	options: O,
): EncoreBetterAuth<O> {
	const auth = betterAuth(options);
	const { $context } = auth;
	const { api: apiEndpoints, middlewares } = getEndpoints($context, options);

	const encoreHandlers = createEncoreHandlers(apiEndpoints, options);
	if (options?.generateRoutes) {
		const outputPath =
			options.outputPath ??
			path.join(projectRoot, "/auth/better-auth.routes.ts");

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
				wrapResponse: options.wrapResponse,
				plugins: [callbackOAuthPlugin, signUpEmailPlugin, updateUserPlugin],
			}).then((value) => {
				fs.writeFileSync(outputPath, value);
				console.log(`Routes file generated at: ${outputPath}`);
			});
		} else {
			console.log(
				`Routes file already exists and is not empty at: ${outputPath}`,
			);
		}
	}

	return {
		routeHandlers: encoreHandlers,
		middlewares: createEncoreMiddlewares(middlewares, $context, options),
		...auth,
	};
}
