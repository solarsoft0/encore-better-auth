import { getEndpoints } from "better-auth/api";
import type { Endpoint, EndpointOptions } from "better-call";
import type { AuthContext, BetterAuthOptions, ZodType } from "better-auth";
import { extractZodFields } from "./zod-utils";
import type {
	EndpointDefinition,
	FieldDefinition,
	TypeDefinition,
} from "../types";

interface GeneratorOptions {
	wrapResponse: boolean;
	plugins?: ((definitions: EndpointDefinition[]) => EndpointDefinition[])[];
}

export async function generateEncoreRoutes(
	ctx: Promise<AuthContext>,
	authOptions: BetterAuthOptions,
	genOptions: GeneratorOptions,
): Promise<string> {
	const { wrapResponse, plugins = [] } = genOptions;

	const endpoints = getEndpoints(ctx, authOptions).api;

	let endpointDefinitions: EndpointDefinition[] = Object.entries(endpoints)
	// @ts-ignore
		.filter(([, ep]) => ep && !ep.options?.metadata?.SERVER_ONLY)
		.map(([name, endpoint]) =>
			buildEndpointDefinition(name, endpoint, authOptions),
		);

	// Apply plugins in sequence
	endpointDefinitions = composePlugins(...plugins)(endpointDefinitions);

	return generateCodeFromDefinitions(endpointDefinitions, wrapResponse);
}

function buildEndpointDefinition(
	name: string,
	endpoint: Endpoint,
	_authOptions: BetterAuthOptions,
): EndpointDefinition {
	const { path, options } = endpoint;
	return {
		name,
		path,
		methods: normalizeMethods(options.method),
		middleware: [path],
		params: buildParams(endpoint),
		response: buildResponse(endpoint),
		comment: buildComment(options),
	};
}

function generateTypeCode(
	fields: FieldDefinition[],
	typeName: string,
	indentLevel: number = 0,
	generatedTypes: Set<string> = new Set(),
): string {
	if (generatedTypes.has(typeName)) return "";
	generatedTypes.add(typeName);

	const indent = "  ".repeat(indentLevel);
	const fieldLines: string[] = [];
	let nestedDefinitions = "";

	fields.forEach((field) => {
		const fieldIndent = "  ".repeat(indentLevel + 1);
		if (typeof field.type === "string") {
			fieldLines.push(
				`${fieldIndent}${field.name}${field.optional ? "?" : ""}: ${
					field.type
				}`,
			);
		} else {
			const nestedTypeName = `${typeName}${capitalize(field.name)}`;
			fieldLines.push(
				`${fieldIndent}${field.name}${
					field.optional ? "?" : ""
				}: ${nestedTypeName}`,
			);
			nestedDefinitions += generateTypeCode(
				field.type,
				nestedTypeName,
				0,
				generatedTypes,
			);
		}
	});

	const typeCode = `${indent}interface ${typeName} {\n${fieldLines.join(
		"\n",
	)}\n${indent}}`;
	return `${nestedDefinitions}${nestedDefinitions ? "\n" : ""}${typeCode}`;
}

function getParamsCodeAndType(
	paramsDef: TypeDefinition,
	baseName: string,
): { code: string; paramsPart: string; baseTypeName: string } {
	if (typeof paramsDef === "string") {
		return {
			code: "",
			paramsPart: `params: ${paramsDef}`,
			baseTypeName: paramsDef,
		};
	} else if (paramsDef.length > 0) {
		const baseTypeName = `${capitalize(baseName)}Params`;
		const code = generateTypeCode(paramsDef, baseTypeName);
		return {
			code: code ? `${code}\n` : "",
			paramsPart: `params: ${baseTypeName}`,
			baseTypeName,
		};
	}
	return { code: "", paramsPart: "", baseTypeName: "" };
}

function getResponseCodeAndType(
	responseDef: TypeDefinition,
	baseName: string,
	wrapInData: boolean,
): { code: string; responseType: string; baseTypeName: string } {
	if (responseDef === "void") {
		return { code: "", responseType: "{ data: any }", baseTypeName: "" };
	}

	let baseType: string;
	let code = "";

	if (typeof responseDef === "string") {
		baseType = responseDef;
	} else {
		const typeName = `${capitalize(baseName)}Response`;
		code = generateTypeCode(responseDef, typeName);
		baseType = typeName;
	}

	const finalType = wrapInData ? `{ data: ${baseType} }` : baseType;
	return {
		code: code ? `${code}\n` : "",
		responseType: finalType,
		baseTypeName: baseType,
	};
}

function generateCodeFromDefinitions(
	definitions: EndpointDefinition[],
	wrapResponse: boolean,
): string {
	let code = `import { api } from "encore.dev/api";\n`;
	code += `import { auth } from './encore.service';\n\n`;

	for (const def of definitions) {
		const {
			code: paramsCode,
			paramsPart,
			baseTypeName: paramsBaseTypeName,
		} = getParamsCodeAndType(def.params, def.name);
		code += paramsCode;

		const { code: responseCode, responseType } = getResponseCodeAndType(
			def.response,
			def.name,
			wrapResponse,
		);
		// Add a single newline between params and response types if both exist
		code += paramsCode && responseCode ? `${responseCode}\n` : responseCode;

		const apiConfig = buildApiConfig(def);
		const adjustedParamsPart =
			def.methods.includes("GET") &&
			def.methods.length === 1 &&
			paramsBaseTypeName
				? `_: ${paramsBaseTypeName}`
				: paramsPart;

		const asyncParams = adjustedParamsPart ? `(${adjustedParamsPart})` : "()";
		const handlerParams =
			(def.methods.includes("GET") && def.methods.length === 1) ||
			asyncParams === "()"
				? "()"
				: "(params)";

		code += `
${def.comment}
export const ${def.name} = api(
    { ${apiConfig.join(", ")} },
    async ${asyncParams}: Promise<${responseType}> => {
        // Using "as" to ignore response inconsistency from OpenAPI, to be resolved with PR https://github.com/better-auth/better-auth/pull/1699
        return await auth.routeHandlers.${
					def.name
				}${handlerParams} as ${responseType};
    }
);\n\n`; // Two newlines for larger gap between routes
	}

	return code.trim();
}

function normalizeMethods(method: string | string[]): string[] {
	return Array.isArray(method) ? method : [method || "GET"];
}

function buildApiConfig({
	path,
	methods,
	middleware,
}: EndpointDefinition): string[] {
	return [
		`method: [${methods.map((m) => `"${m}"`).join(", ")}]`,
		`path: "${path}"`,
		`expose: true`,
		middleware.length
			? `tags: [${middleware.map((m) => `"${m}"`).join(", ")}]`
			: "",
	].filter(Boolean);
}

function buildParams(endpoint: Endpoint): TypeDefinition {
	const { path, options } = endpoint;
	const pathParams = extractPathParams(path);
	const queryFields = options.query
		? extractZodFields(options.query as ZodType)
		: [];
	const bodyFields = options.body
		? extractZodFields(options.body as ZodType)
		: [];
	const openApiParams = options.metadata?.openapi?.parameters || [];

	const pathParamFields = pathParams.map((param) => ({
		name: param,
		type: "string",
		optional: false,
	}));

	const openApiFields = openApiParams.map((param) => {
		const fieldDef = convertOpenAPISchemaToFieldDefinition(
			param.schema,
			param.name ?? "namenotfound",
		);
		fieldDef.optional = !param.required;
		return fieldDef;
	});

	return [
		...pathParamFields,
		...queryFields,
		...bodyFields,
		...openApiFields,
	].filter((f, i, self) => self.findIndex((ff) => ff.name === f.name) === i);
}

function buildResponse(endpoint: Endpoint): TypeDefinition {
	const schema =
		endpoint.options.metadata?.openapi?.responses?.["200"]?.content?.[
			"application/json"
		]?.schema;
	return schema ? convertOpenAPISchemaToFieldDefinitions(schema) : "void";
}

function buildComment(options: EndpointOptions): string {
	return `// ${options.metadata?.openapi?.description || "API endpoint"}`;
}

function extractPathParams(path: string): string[] {
	return (path.match(/:\w+/g) || []).map((param) => param.slice(1));
}

function convertOpenAPISchemaToFieldDefinitions(schema: any): TypeDefinition {
	if (!schema) return "any";
	if (["string", "number", "integer", "boolean"].includes(schema.type)) {
		return schema.type === "integer" ? "number" : schema.type;
	}
	if (schema.type === "array") {
		const itemsType = convertOpenAPISchemaToFieldDefinitions(schema.items);
		return typeof itemsType === "string" ? `${itemsType}[]` : "any";
	}
	if (schema.type === "object") {
		const props = schema.properties || {};
		const required = schema.required || [];
		return Object.entries(props).map(([key, prop]) => {
			const fieldDef = convertOpenAPISchemaToFieldDefinition(prop, key);
			fieldDef.optional = !required.includes(key);
			return fieldDef;
		});
	}
	return "any";
}

function convertOpenAPISchemaToFieldDefinition(
	schema: any,
	name: string,
): FieldDefinition {
	let type: string;
	if (!schema) type = "any";
	else if (schema.type === "string") type = "string";
	else if (schema.type === "number" || schema.type === "integer")
		type = "number";
	else if (schema.type === "boolean") type = "boolean";
	else if (schema.type === "array") {
		const itemsType =
			typeof schema.items === "object"
				? convertOpenAPISchemaToFieldDefinitions(schema.items)
				: "any";
		type = typeof itemsType === "string" ? `${itemsType}[]` : "any[]";
	} else if (schema.type === "object") {
		type = "any"; // Could be enhanced to generate nested definitions
	} else type = "any";
	return { name, type, optional: false };
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function composePlugins(
	...plugins: ((definitions: EndpointDefinition[]) => EndpointDefinition[])[]
): (definitions: EndpointDefinition[]) => EndpointDefinition[] {
	return (definitions) =>
		plugins.reduce((defs, plugin) => plugin(defs), definitions);
}

export function createPlugin(
	options:
		| {
				name: string;
				selector?: (def: EndpointDefinition) => boolean;
				verbose?: boolean;
		  }
		| string,
	transform: (
		definition: EndpointDefinition,
		index: number,
		allDefinitions: EndpointDefinition[],
	) => EndpointDefinition,
): (definitions: EndpointDefinition[]) => EndpointDefinition[] {
	const {
		name,
		selector = () => true,
		verbose = true,
	} = typeof options === "string" ? { name: options } : options;

	return (definitions) => {
		if (verbose) console.log(`Applying plugin: ${name}`);
		return definitions.map((def, index, all) =>
			selector(def) ? transform(def, index, all) : def,
		);
	};
}