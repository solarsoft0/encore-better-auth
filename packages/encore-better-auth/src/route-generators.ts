import type { BetterAuthOptions } from "better-auth";
import { createPlugin } from "./generator";
import type { FieldDefinition } from "./types";
import { generateParamsFromOptions } from "./generator/plugin";

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
			response: "any",
		};
	},
);

// Updated signUpEmailPlugin using the fixed version
export const createSignUpEmailPlugin = (authOptions: BetterAuthOptions) => {
	return createPlugin(
		{
			name: "signUpEmailPlugin",
			selector: (def) => def.name === "signUpEmail",
			verbose: true,
		},
		(definition) => {
			const additionalParams = generateParamsFromOptions(
				authOptions,
				"user",
				"update",
			);
			const params: FieldDefinition[] = [
				{ name: "name", type: "string", optional: false },
				{ name: "email", type: "string", optional: false },
				{ name: "password", type: "string", optional: false },
				...additionalParams,
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
						...additionalParams,
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
};

export function createUpdateUserPlugin(authOptions: BetterAuthOptions) {
	return createPlugin(
		{
			name: "updateUserPlugin",
			selector: (def) => def.name === "updateUser",
			verbose: true,
		},
		(definition) => {
			const additionalParams = generateParamsFromOptions(
				authOptions,
				"user",
				"update",
			);

			const params: FieldDefinition[] = [
				{ name: "name", type: "string", optional: true },
				{ name: "image", type: "string | null", optional: true },
				...additionalParams,
			];

			const response: FieldDefinition[] = [
				{ name: "status", type: "boolean", optional: false },
			];

			return {
				...definition,
				params,
				response,
			};
		},
	);
}
