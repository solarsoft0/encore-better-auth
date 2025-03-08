import {
	getAllFields,
	parseUserInput,
	type FieldAttribute,
} from "better-auth/db";
import type { EndpointDefinition, FieldDefinition } from "../types";
import type { BetterAuthOptions } from "better-auth";

export type GeneratorPlugin = (
	definitions: EndpointDefinition[],
) => EndpointDefinition[];

export function composePlugins(...plugins: GeneratorPlugin[]): GeneratorPlugin {
	return (definitions: EndpointDefinition[]) => {
		return plugins.reduce((defs, plugin) => plugin(defs), definitions);
	};
}

type RouteSelector = (
	definition: EndpointDefinition,
	index: number,
	allDefinitions: EndpointDefinition[],
) => boolean;

/**
 * Plugin configuration options
 */
interface PluginOptions {
	/**
	 * Name of the plugin for debugging purposes
	 */
	name: string;

	/**
	 * Optional selector to determine which routes this plugin applies to
	 * If not provided, the plugin applies to all routes
	 */
	selector?: RouteSelector | string | RegExp | string[];

	/**
	 * Whether to log when the plugin runs
	 * @default true
	 */
	verbose?: boolean;
}

/**
 * Helper function to create a plugin for the endpoint generator with targeted route selection.
 *
 * @param options Plugin configuration or name
 * @param transform Function that transforms endpoint definitions
 * @returns A plugin function that can be added to the plugins array
 */
export function createPlugin(
	options: PluginOptions | string,
	transform: (
		definition: EndpointDefinition,
		index: number,
		allDefinitions: EndpointDefinition[],
	) => EndpointDefinition,
): (definitions: EndpointDefinition[]) => EndpointDefinition[] {
	const pluginOptions =
		typeof options === "string" ? { name: options } : options;

	const {
		name,
		selector = () => true, // Default to selecting all routes
		verbose = true,
	} = pluginOptions;

	const selectorFn: RouteSelector =
		typeof selector === "function"
			? selector
			: createSelectorFromPattern(selector);

	return (definitions: EndpointDefinition[]) => {
		if (verbose) {
			console.log(`Applying plugin: ${name}`);
		}

		return definitions.map((def, index, all) => {
			// Apply transform only if the selector matches
			if (selectorFn(def, index, all)) {
				if (verbose) {
					console.log(`  - Transforming route: ${def.name}`);
				}
				return transform(def, index, all);
			}
			return def;
		});
	};
}

/**
 * Creates a selector function from various pattern types
 */
function createSelectorFromPattern(
	pattern: string | RegExp | string[],
): RouteSelector {
	// String pattern matches route name exactly
	if (typeof pattern === "string") {
		return (def) => def.name === pattern;
	}

	// RegExp pattern tests against route name
	if (pattern instanceof RegExp) {
		return (def) => pattern.test(def.name);
	}

	// String array checks if route name is in the array
	if (Array.isArray(pattern)) {
		return (def) => pattern.includes(def.name);
	}

	// Default to matching all routes
	return () => true;
}

function fieldAttributeToFieldDefinition(
	name: string,
	attr: FieldAttribute,
	action: "create" | "update" = "update",
): FieldDefinition {
	let type: string;
	switch (attr.type) {
		case "string":
			type = "string";
			break;
		case "number":
			type = "number";
			break;
		case "boolean":
			type = "boolean";
			break;
		case "date":
			type = "Date";
			break;
		case "string[]":
			type = "string[]";
			break;
		case "number[]":
			type = "number[]";
			break;
		default:
			type = "any";
	}
	const isOptional =
		action === "update" ? true : !attr.required && attr.input !== false;
	return { name, type, optional: isOptional };
}

export function generateParamsFromOptions(
	authOptions: BetterAuthOptions,
	table: string,
	action: "create" | "update" = "update",
): FieldDefinition[] {
	const schema = getAllFields(authOptions, table);
	return Object.entries(schema)
		.filter(([, attr]) => attr.input !== false)
		.map(([name, attr]) => fieldAttributeToFieldDefinition(name, attr, action));
}