import { getEndpoints } from "better-auth/api";
import type { Endpoint, EndpointOptions } from "better-call";
import type { AuthContext, BetterAuthOptions, ZodType } from "better-auth";
import { extractZodFields } from "./zod-utils";

interface GeneratorOptions {
	wrapResponseInData?: boolean;
	overrides?: Record<
		string,
		{
			paramsType?: string;
			responseType?: string;
			middleware?: string[];
		}
	>;
	plugins?: ((definitions: EndpointDefinition[]) => EndpointDefinition[])[];
}

type FieldDefinition = { name: string; type: string; optional: boolean };
type TypeDefinition = FieldDefinition[] | string;

interface EndpointDefinition {
	name: string;
	path: string;
	methods: string[];
	middleware: string[];
	params: TypeDefinition;
	response: TypeDefinition;
	comment: string;
}

export async function generateEncoreRoutes(
	ctx: Promise<AuthContext>,
	authOptions: BetterAuthOptions,
	genOptions: GeneratorOptions = {},
): Promise<string> {
	const {
		wrapResponseInData = false,
		overrides = {},
		plugins = [],
	} = genOptions;

	const endpoints = getEndpoints(ctx, authOptions).api;

	let endpointDefinitions: EndpointDefinition[] = Object.entries(endpoints)
		// @ts-ignore
		.filter(([, ep]) => ep && !ep.options?.metadata?.SERVER_ONLY)
		.map(([name, endpoint]) =>
			buildEndpointDefinition(
				name,
				endpoint,
				authOptions,
				overrides,
				wrapResponseInData,
			),
		);

	for (const plugin of plugins) {
		endpointDefinitions = plugin(endpointDefinitions);
	}

	return generateCodeFromDefinitions(endpointDefinitions, wrapResponseInData);
}

function buildEndpointDefinition(
	name: string,
	endpoint: Endpoint,
	_authOptions: BetterAuthOptions,
	overrides: GeneratorOptions["overrides"],
	wrapResponseInData: boolean,
): EndpointDefinition {
	const { path, options } = endpoint;

	const override = overrides?.[name] || {};

	const methods = normalizeMethods(options.method);
	const middleware = override.middleware || extractMiddleware(endpoint);
	const params = buildParams(endpoint, override.paramsType);
	const response = buildResponse(
		endpoint,
		override.responseType,
		wrapResponseInData,
	);
	const comment = buildComment(options);

	return {
		name,
		path,
		methods,
		middleware,
		params,
		response,
		comment,
	};
}
/**
 * Generates code and parameter signature for params.
 * - String: Uses it as the type.
 * - Array with fields: Generates an interface.
 * - Empty array: Omits the parameter.
 */
function getParamsCodeAndType(
	paramsDef: TypeDefinition,
	baseName: string,
): { code: string; paramsPart: string } {
	if (typeof paramsDef === "string") {
		return { code: "", paramsPart: `params: ${paramsDef}` };
	} else if (paramsDef.length > 0) {
		const interfaceName = `${capitalize(baseName)}Params`;
		const fields = paramsDef
			.map((p) => `  ${p.name}${p.optional ? "?" : ""}: ${p.type}`)
			.join("\n");
		const code = `interface ${interfaceName} {\n${fields}\n}\n`;
		return { code, paramsPart: `params: ${interfaceName}` };
	} else {
		return { code: "", paramsPart: "" };
	}
}


function getResponseCodeAndType(
	responseDef: TypeDefinition,
	baseName: string,
	wrapInData: boolean,
): { code: string; responseType: string } {
	if (responseDef === "void") {
		return { code: "", responseType: "void" };
	}
	let baseType: string;
	let code = "";
	if (typeof responseDef === "string") {
		baseType = responseDef;
	} else {
		const typeName = `${capitalize(baseName)}Response`;
		const fields = responseDef
			.map((f) => `  ${f.name}${f.optional ? "?" : ""}: ${f.type}`)
			.join("\n");
		code = `type ${typeName} = {\n${fields}\n};\n`;
		baseType = typeName;
	}
	const finalType =
		wrapInData && baseType !== "void" ? `{ data: ${baseType} }` : baseType;
	return { code, responseType: finalType };
}



function generateCodeFromDefinitions(
	definitions: EndpointDefinition[],
	wrapResponseInData: boolean,
): string {
	let code = `import { api } from "encore.dev/api";\n\n`;

	for (const def of definitions) {
		const { code: paramsCode, paramsPart } = getParamsCodeAndType(
			def.params,
			def.name,
		);
		code += paramsCode;

		const { code: responseCode, responseType } = getResponseCodeAndType(
			def.response,
			def.name,
			wrapResponseInData,
		);
		code += responseCode;

		const apiConfig = buildApiConfig(def);

		// Construct function parameters
		const asyncParams = paramsPart ? `(${paramsPart})` : "()";

		// Assemble the endpoint code
		code += `
${def.comment}
export const ${def.name} = api(
  { ${apiConfig.join(", ")} },
  async ${asyncParams}: Promise<${responseType}> => {
    // Implement your logic here
    throw new Error("Not implemented");
  }
);
`;
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
			? `middleware: [${middleware.map((m) => `"${m}"`).join(", ")}]`
			: "",
	].filter(Boolean);
}

function extractMiddleware(endpoint: Endpoint): string[] {
	return (
		endpoint.options.use?.map((mw) => mw.name || "unknownMiddleware") || []
	);
}

function buildParams(
	endpoint: Endpoint,
	overrideType: string | undefined,
): TypeDefinition {
	if (overrideType) {
		return overrideType;
	}

	const { path, options } = endpoint;
	const pathParams = extractPathParams(path);
	const queryFields = options.query
		? extractZodFields(options.query as ZodType)
		: [];
	const bodyFields = options.body
		? extractZodFields(options.body as ZodType)
		: [];
	const openApiParams = options.metadata?.openapi?.parameters || [];

	// Convert path params to field definitions
	const pathParamFields = pathParams.map((param) => ({
		name: param,
		type: "string",
		optional: false,
	}));

	// Convert OpenAPI parameters to field definitions
	const openApiFields = openApiParams.map((param) => {
		const fieldDef = convertOpenAPISchemaToFieldDefinition(
			param.schema,
			param.name ?? "namenotfound",
		);
		fieldDef.optional = !param.required;
		return fieldDef;
	});

	// Combine all field definitions
	return [
		...pathParamFields,
		...queryFields,
		...bodyFields,
		...openApiFields,
	].filter((f, i, self) => self.findIndex((ff) => ff.name === f.name) === i);
}

function buildResponse(
	endpoint: Endpoint,
	overrideType: string | undefined,
	wrapResponseInData: boolean,
): TypeDefinition {
	if (overrideType) {
		return overrideType;
	}

	const schema =
		endpoint.options.metadata?.openapi?.responses?.["200"]?.content?.[
			"application/json"
		]?.schema;

	if (!schema) return "void";

	return convertOpenAPISchemaToFieldDefinitions(schema);
}

function buildComment(options: EndpointOptions): string {
	return `// ${options.metadata?.openapi?.description || "API endpoint"}`;
}

function extractPathParams(path: string): string[] {
	return (path.match(/:\w+/g) || []).map((param) => param.slice(1));
}


function convertOpenAPISchemaToFieldDefinitions(schema: any): TypeDefinition {
	if (!schema) return "any";

	// Handle primitive types directly
	if (
		schema.type === "string" ||
		schema.type === "number" ||
		schema.type === "integer" ||
		schema.type === "boolean"
	) {
		return schema.type === "integer" ? "number" : schema.type;
	}

	// Handle array type
	if (schema.type === "array") {
		const itemsType = convertOpenAPISchemaToFieldDefinitions(schema.items);
		if (typeof itemsType === "string") {
			return `${itemsType}[]`;
		}
		return "any";
	}

	// Handle object type
	if (schema.type === "object") {
		const props = schema.properties || {};
		const required = schema.required || [];

		// Convert each property to a field definition
		return Object.entries(props).map(([key, prop]) => {
			const fieldDef = convertOpenAPISchemaToFieldDefinition(prop, key);
			fieldDef.optional = !required.includes(key);
			return fieldDef;
		});
	}

	// Default case
	return "any";
}

function convertOpenAPISchemaToFieldDefinition(
	schema: any,
	name: string,
): FieldDefinition {
	let type: string;

	if (!schema) {
		type = "any";
	} else if (schema.type === "string") {
		type = "string";
	} else if (schema.type === "number" || schema.type === "integer") {
		type = "number";
	} else if (schema.type === "boolean") {
		type = "boolean";
	} else if (schema.type === "array") {
		const itemsType =
			typeof schema.items === "object"
				? convertOpenAPISchemaToFieldDefinitions(schema.items)
				: "any";
		type = typeof itemsType === "string" ? `${itemsType}[]` : "any[]";
	} else if (schema.type === "object") {
		console.log(schema, "from schema", name);
		type = "any";
	} else {
		type = "any";
	}

	return { name, type, optional: false };
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}