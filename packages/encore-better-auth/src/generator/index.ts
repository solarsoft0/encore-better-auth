import { getEndpoints } from "better-auth/api";
import type { Endpoint, EndpointOptions } from "better-call";
import type { AuthContext, BetterAuthOptions } from "better-auth";
import {
    generateModelInputTypeString,
    generateModelOutputTypeString,
} from "./type-generator";

/**
 * Generates Encore.ts routes based on API endpoint information from better-auth
 * @param ctx Authentication context
 * @param options BetterAuth options including plugins
 * @param genOptions Configuration options for the generator
 * @returns A string containing the generated Encore.ts routes file
 */

interface Overrides {
    paramsType?: string;
    responseType?: string;
    model?: "user" | "session" | "account";
    action?: "create" | "update";
}

type EndpointOverrides = Record<string, Overrides>;

export async function generateEncoreRoutes(
    ctx: Promise<AuthContext>,
    options: BetterAuthOptions
): Promise<string> {
    const plugins = options.plugins;

    // Start with basic imports
    let encoreRoutes = `import { api } from "encore.dev/api";\n`;

    encoreRoutes += `\n`;

    // Track models to avoid duplicates
    const models = new Set<string>();
    models.add("user");
    models.add("session");
    models.add("account");

    // Track interfaces to avoid duplicates
    const generatedInterfaces = new Set<string>();

    // Get base endpoints
    const baseEndpoints = getEndpoints(ctx, {
        ...options,
        plugins: [], // Get only core endpoints first
    });

    // Process base endpoints
    let endpointCode = processEndpoints(
        baseEndpoints.api,
        generatedInterfaces,
        options
    );

    // Process plugin endpoints
    // plugin needs special support since headers can be abbitary, if encore client DX is to be improved.
    // currently aiming for api parity. with better-auth. so for now middleware handling header is enough.
    if (plugins && plugins.length > 0) {
        for (const plugin of plugins) {
            if (plugin.id === "open-api") {
                continue; // Skip OpenAPI plugin as it's handled separately
            }

            const pluginEndpoints = getEndpoints(ctx, {
                ...options,
                plugins: [plugin],
            });

            // Filter out any endpoints that exist in the base endpoints
            const uniquePluginEndpoints = Object.entries(pluginEndpoints.api)
                .filter(
                    ([key]) =>
                        !baseEndpoints.api[
                            key as keyof typeof baseEndpoints.api
                        ]
                )
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, any>);

            // Process plugin endpoints
            endpointCode += processEndpoints(
                uniquePluginEndpoints,
                generatedInterfaces,
                options
            );
        }
    }

    encoreRoutes += endpointCode;

    return encoreRoutes.trim();
}
// function processEndpoints(
//     endpoints: Record<string, Endpoint>,
//     generatedInterfaces: Set<string>,
//     authOptions: BetterAuthOptions
// ): string {
//     let code = "";

//     for (const [endpointName, endpoint] of Object.entries(endpoints || {})) {
//         if (!endpoint) continue;

//         const options = endpoint.options as EndpointOptions;
//         if (options?.metadata?.SERVER_ONLY) continue;

//         const path = endpoint.path || "";
//         const methods = Array.isArray(options.method)
//             ? options.method
//             : [options.method || "GET"];

//         // Infer model and action
//         const model = inferModel(endpoint, options, path);
//         const action = inferAction(methods, options);

//         // Extract path parameters
//         const pathParams = extractPathParams(path);

//         // Generate request interface
//         let requestInterface = "";
//         let requestType = "{}";
//         const paramProperties: Record<
//             string,
//             { type: string; optional: boolean; description?: string }
//         > = {};

//         // Add path parameters
//         pathParams.forEach((param) => {
//             paramProperties[param] = {
//                 type: "string",
//                 optional: false,
//                 description: "Path parameter",
//             };
//         });

//         // Add schema-based input parameters (body)
//         if (model && action) {
//             const inputTypeStr = generateModelInputTypeString(
//                 authOptions,
//                 model,
//                 action
//             );
//             const inputLines = inputTypeStr.slice(1, -1).trim().split(";\n");
//             inputLines.forEach((line) => {
//                 if (!line.trim()) return;
//                 const [keyPart, typePart] = line.trim().split(": ");
//                 const isOptional = keyPart.endsWith("?");
//                 const key = keyPart.replace("?", "");
//                 paramProperties[key] = { type: typePart, optional: isOptional };
//             });
//         }

//         // Add query parameters from schema or metadata
//         if (options?.query) {
//             const queryProperties = extractZodProperties(options.query);
//             Object.entries(queryProperties).forEach(([key, value]) => {
//                 if (!paramProperties[key]) {
//                     paramProperties[key] = { ...value, optional: true };
//                 }
//             });
//         }

//         // Generate request interface if properties exist
//         if (Object.keys(paramProperties).length > 0) {
//             const interfaceName = `${capitalizeFirstLetter(
//                 endpointName
//             )}Params`;
//             requestInterface = `interface ${interfaceName} {\n${Object.entries(
//                 paramProperties
//             )
//                 .map(
//                     ([key, value]) =>
//                         `  ${key}${value.optional ? "?" : ""}: ${value.type}; ${
//                             value.description ? `// ${value.description}` : ""
//                         }`
//                 )
//                 .join("\n")}\n}\n\n`;
//             requestType = interfaceName;
//             generatedInterfaces.add(interfaceName);
//         }

//         // Generate response interface
//         let responseInterface = "";
//         let responseType = "void";

//         if (model) {
//             const outputTypeStr = generateModelOutputTypeString(
//                 authOptions,
//                 model
//             );
//             const interfaceName = `${capitalizeFirstLetter(
//                 endpointName
//             )}Response`;

//             // Check OpenAPI metadata for response structure
//             const responseSchema =
//                 options?.metadata?.openapi?.responses?.["200"]?.content;
//             if (responseSchema && Object.keys(responseSchema).length > 0) {
//                 const contentType = Object.keys(responseSchema)[0];
//                 // @ts-ignore
//                 const schema = responseSchema[contentType]?.schema;
//                 if (schema) {
//                     const properties = extractSchemaProperties(schema);
//                     if (properties.token && properties.user) {
//                         // Handle { token: null; user: {...} } style responses
//                         responseInterface = `interface ${interfaceName} {\n  token: null;\n  user: {\n${outputTypeStr.slice(
//                             1,
//                             -1
//                         )}\n  };\n}\n\n`;
//                     } else {
//                         responseInterface = `interface ${interfaceName} {\n${Object.entries(
//                             properties
//                         )
//                             .map(
//                                 ([key, value]) =>
//                                     `  ${key}${value.optional ? "?" : ""}: ${
//                                         value.type
//                                     };`
//                             )
//                             .join("\n")}\n}\n\n`;
//                     }
//                     responseType = interfaceName;
//                     generatedInterfaces.add(interfaceName);
//                 }
//             } else {
//                 // Default to optional model output (common pattern)
//                 responseInterface = `interface ${interfaceName} {\n  ${model}?: {\n${outputTypeStr.slice(
//                     1,
//                     -1
//                 )}\n  };\n}\n\n`;
//                 responseType = interfaceName;
//                 generatedInterfaces.add(interfaceName);
//             }
//         }

//         // Generate function comment
//         const description =
//             options?.metadata?.openapi?.description ||
//             `Handles ${endpointName} request`;
//         const functionComment = `// ${description}`;

//         // Generate Encore API function
//         const apiConfig = [
//             `method: [${methods.map((method) => `"${method}"`).join(", ")}]`,
//             `path: "${path}"`,
//             `expose: true`,
//         ];

//         const encoreFunction = `${requestInterface}${responseInterface}${functionComment}\nexport const ${endpointName} = api(\n  { ${apiConfig.join(
//             ", "
//         )} },\n  async (${
//             requestType ? `params: ${requestType}` : ""
//         }): Promise<${responseType}> => {\n    // Implement your logic here\n    throw new Error("Not implemented");\n  },\n);\n\n`;

//         code += encoreFunction;
//     }

//     return code;
// }


const endpointOverrides: EndpointOverrides = {};
function processEndpoints(
    endpoints: Record<string, Endpoint>,
    generatedInterfaces: Set<string>,
    authOptions: BetterAuthOptions
): string {
    
    return Object.entries(endpoints || {})
        .filter(
            ([, endpoint]) =>
                endpoint && !endpoint.options?.metadata?.SERVER_ONLY
        )
        .map(([endpointName, endpoint]) => {
            const { path, options } = endpoint;

            // const overrides: EndpointOverrides = endpointOverrides[endpointName] || {}
            const methods = normalizeMethods(options.method);
            const apiConfig = buildApiConfig(path, methods);

            // Declarative components
            const params = buildParams(
                endpointName,
                endpoint,
                authOptions,
                generatedInterfaces
            );
            const response = buildResponse(
                endpointName,
                endpoint,
                authOptions,
                generatedInterfaces
            );
            const comment = buildComment(endpointName, options);

            // Compose the final Encore API definition
            return (
                [
                    params.interface,
                    response.interface,
                    comment,
                    `export const ${endpointName} = api(`,
                    `  { ${apiConfig.join(", ")} },`,
                    `  async (${
                        params.type ? `params: ${params.type}` : ""
                    }): Promise<${response.type}> => {`,
                    `    // Implement your logic here`,
                    `    throw new Error("Not implemented");`,
                    `  },`,
                    `);`,
                ]
                    .filter(Boolean) // Remove empty strings
                    .join("\n") + "\n\n"
            );
        })
        .join("");
}

// Helper functions (declarative)

// Normalize methods to array
const normalizeMethods = (method: string | string[]): string[] =>
    Array.isArray(method) ? method : [method || "GET"];

// Build API config declaratively
const buildApiConfig = (path: string, methods: string[]): string[] => [
    `method: [${methods.map((m) => `"${m}"`).join(", ")}]`,
    `path: "${path}"`,
    `expose: true`,
];

// Build params (interface and type)
const buildParams = (
    endpointName: string,
    endpoint: Endpoint,
    authOptions: BetterAuthOptions,
    generatedInterfaces: Set<string>
): { interface: string; type: string } => {
    const { path, options } = endpoint;
    const overrides = endpointOverrides[endpointName] || {};
    const methods = normalizeMethods(options.method);

    if (overrides.paramsType) {
        return resolveManualType(
            endpointName,
            overrides.paramsType,
            "Params",
            generatedInterfaces
        );
    }

    const model = overrides.model || inferModel(endpoint, options, path);
    const action = overrides.action || inferAction(methods, options);
    const pathParams = extractPathParams(path);
    const paramFields = [
        ...pathParams.map((param) => ({
            name: param,
            type: "string",
            optional: false,
            description: "Path parameter",
        })),
        ...(model && action && ["create", "update"].includes(action)
            ? extractSchemaFields(
                  generateModelInputTypeString(authOptions, model, action)
              )
            : []),
        ...(!action &&
        (methods.includes("GET") || methods.includes("DELETE")) &&
        (endpointName.includes("get") || endpointName.includes("list"))
            ? [
                  {
                      name: "id",
                      type: "string",
                      optional: true,
                      description: "The ID of the resource",
                  },
              ]
            : []),
        ...(options.query ? extractZodFields(options.query) : []),
    ].filter(
        (field, idx, self) =>
            self.findIndex((f) => f.name === field.name) === idx
    ); // Deduplicate

    return paramFields.length > 0
        ? buildInterface(
              endpointName,
              "Params",
              paramFields,
              generatedInterfaces
          )
        : { interface: "", type: "{}" };
};

// Build response (interface and type)
const buildResponse = (
    endpointName: string,
    endpoint: Endpoint,
    authOptions: BetterAuthOptions,
    generatedInterfaces: Set<string>
): { interface: string; type: string } => {
    const { path, options } = endpoint;
    const overrides = endpointOverrides[endpointName] || {};

    if (overrides.responseType) {
        return resolveManualType(
            endpointName,
            overrides.responseType,
            "Response",
            generatedInterfaces
        );
    }

    const model = overrides.model || inferModel(endpoint, options, path);
    if (model) {
        const outputTypeStr = generateModelOutputTypeString(authOptions, model);
        const fields = extractSchemaFields(outputTypeStr);

        if (endpointName.includes("list")) {
            return buildInterface(
                endpointName,
                "Response",
                [
                    {
                        name: "data",
                        type: `{${fields
                            .map(
                                (f) =>
                                    `${f.name}${f.optional ? "?" : ""}: ${
                                        f.type
                                    }`
                            )
                            .join("; ")}}[]`,
                        optional: false,
                    },
                ],
                generatedInterfaces
            );
        }

        if (options?.metadata?.openapi?.responses?.["200"]?.content) {
            const contentType = Object.keys(
                options.metadata.openapi.responses["200"].content
            )[0];
            const schema =
                // @ts-ignore
                options.metadata.openapi.responses["200"].content[contentType]
                    ?.schema;
            if (schema) {
                const properties = extractSchemaProperties(schema);
                if (properties.token && properties.user) {
                    return buildInterface(
                        endpointName,
                        "Response",
                        [
                            { name: "token", type: "null", optional: false },
                            {
                                name: "user",
                                type: `{${fields
                                    .map(
                                        (f) =>
                                            `${f.name}${
                                                f.optional ? "?" : ""
                                            }: ${f.type}`
                                    )
                                    .join("; ")}}`,
                                optional: false,
                            },
                        ],
                        generatedInterfaces
                    );
                }
                return buildInterface(
                    endpointName,
                    "Response",
                    Object.entries(properties).map(
                        ([name, { type, optional }]) => ({
                            name,
                            type,
                            optional,
                        })
                    ),
                    generatedInterfaces
                );
            }
        }

        return buildInterface(
            endpointName,
            "Response",
            [
                {
                    name: model,
                    type: `{${fields
                        .map(
                            (f) =>
                                `${f.name}${f.optional ? "?" : ""}: ${f.type}`
                        )
                        .join("; ")}}`,
                    optional: true,
                },
            ],
            generatedInterfaces
        );
    }

    if (endpointName.includes("apiKey")) {
        const apiKeyFields = [
            { name: "id", type: "string", optional: false },
            { name: "key", type: "string", optional: false },
            { name: "createdAt", type: "Date", optional: false },
        ];
        return endpointName.includes("list")
            ? buildInterface(
                  endpointName,
                  "Response",
                  [
                      {
                          name: "data",
                          type: `{${apiKeyFields
                              .map((f) => `${f.name}: ${f.type}`)
                              .join("; ")}}[]`,
                          optional: false,
                      },
                  ],
                  generatedInterfaces
              )
            : buildInterface(
                  endpointName,
                  "Response",
                  [
                      {
                          name: "apiKey",
                          type: `{${apiKeyFields
                              .map((f) => `${f.name}: ${f.type}`)
                              .join("; ")}}`,
                          optional: true,
                      },
                  ],
                  generatedInterfaces
              );
    }

    return {
        interface: "",
        type:
            endpointName === "ok" || endpointName === "error" ? "void" : "void",
    };
};

// Resolve manual type (inline or reference)
const resolveManualType = (
    endpointName: string,
    typeDef: string,
    suffix: "Params" | "Response",
    generatedInterfaces: Set<string>
): { interface: string; type: string } =>
    typeDef.startsWith("{") && typeDef.endsWith("}")
        ? buildInterface(
              endpointName,
              suffix,
              extractSchemaFields(typeDef),
              generatedInterfaces
          )
        : { interface: "", type: typeDef };

// Build interface from fields
const buildInterface = (
    endpointName: string,
    suffix: "Params" | "Response",
    fields: {
        name: string;
        type: string;
        optional: boolean;
        description?: string;
    }[],
    generatedInterfaces: Set<string>
): { interface: string; type: string } => {
    const interfaceName = `${capitalizeFirstLetter(endpointName)}${suffix}`;
    const interfaceDef = `interface ${interfaceName} {\n${fields
        .map(
            (f) =>
                `  ${f.name}${f.optional ? "?" : ""}: ${f.type};${
                    f.description ? ` // ${f.description}` : ""
                }`
        )
        .join("\n")}\n}\n\n`;
    generatedInterfaces.add(interfaceName);
    return { interface: interfaceDef, type: interfaceName };
};

const buildComment = (endpointName: string, options: EndpointOptions): string =>
    `// ${
        options?.metadata?.openapi?.description ||
        `Handles ${endpointName} request`
    }`;

const extractPathParams = (path: string): string[] =>
    (path.match(/:\w+/g) || []).map((param) => param.slice(1));

const inferModel = (
    _: Endpoint,
    __: EndpointOptions,
    path: string
): "user" | "session" | "account" | undefined =>
    path.includes("user")
        ? "user"
        : path.includes("session")
        ? "session"
        : path.includes("account")
        ? "account"
        : undefined;

const inferAction = (
    methods: string[],
    _: EndpointOptions
): "create" | "update" | undefined =>
    methods.includes("POST")
        ? "create"
        : methods.includes("PUT") || methods.includes("PATCH")
        ? "update"
        : undefined;

const extractSchemaFields = (
    typeStr: string
): { name: string; type: string; optional: boolean }[] =>
    typeStr
        .slice(1, -1)
        .trim()
        .split(";\n")
        .filter((line) => line.trim())
        .map((line) => {
            const [keyPart, typePart] = line.trim().split(": ");
            return {
                name: keyPart.replace("?", ""),
                type: typePart,
                optional: keyPart.endsWith("?"),
            };
        });

/**
 * Detects if an endpoint requires authentication
 * @param endpoint The endpoint object
 * @returns True if the endpoint requires authentication
 */
export function detectAuthRequirement(endpoint: any): boolean {
    // Check if endpoint has "use" property with session and user
    if (endpoint.use && Array.isArray(endpoint.use)) {
        // Check middleware for session and user requirements
        for (const middleware of endpoint.use) {
            if (middleware?.options?.handler?.arguments?.[0]?.session) {
                return true;
            }
        }
    }

    // Check if endpoint has a session property in its handler
    if (endpoint.options?.handler?.arguments?.[0]?.session) {
        return true;
    }

    // Check endpoint metadata for auth requirements
    if (endpoint.options?.metadata?.requiresAuth === true) {
        return true;
    }

    // Check for security requirements in OpenAPI metadata
    if (endpoint.options?.metadata?.openapi?.security) {
        return true;
    }

    return false;
}

/**
 * Extracts property definitions from a Zod schema object
 * @param zodSchema The Zod schema object
 * @returns A record of property names to their types and metadata
 */
function extractZodFields(
    zodSchema: any
): Record<string, { type: string; optional: boolean; description?: string }> {
    const properties: Record<
        string,
        { type: string; optional: boolean; description?: string }
    > = {};

    // Handle undefined or non-object schemas
    if (!zodSchema || typeof zodSchema !== "object") return properties;

    // Handle ZodRecord type
    if (isZodRecord(zodSchema)) {
        return { "*": { type: "Record<string, any>", optional: false } };
    }

    // Check if this is a Zod object with a shape property
    const shape = zodSchema.shape || zodSchema._def?.shape;
    if (!shape) return properties;

    // Extract properties from the Zod schema
    for (const [key, value] of Object.entries(shape)) {
        // Skip internal properties
        if (key.startsWith("_")) continue;

        const isOptional =
            // @ts-ignore
            value?.isOptional === true ||
            String(value).includes("ZodOptional") ||
            // @ts-ignore
            value?._def?.typeName === "ZodOptional";

        let type = "any";
        let description: string | undefined;

        // Try to determine description from Zod metadata
        // @ts-ignore
        if (value?._def?.description) {
            // @ts-ignore
            description = value._def.description;
        }

        // Determine the type based on the Zod type or constructor name
        const typeName =
            // @ts-ignore
            value?.typeName ||
            // @ts-ignore
            value?._def?.typeName ||
            value?.constructor?.name;

        if (typeName === "ZodString" || String(value).includes("ZodString")) {
            type = "string";
        } else if (
            typeName === "ZodNumber" ||
            String(value).includes("ZodNumber")
        ) {
            type = "number";
        } else if (
            typeName === "ZodBoolean" ||
            String(value).includes("ZodBoolean")
        ) {
            type = "boolean";
        } else if (
            typeName === "ZodEnum" ||
            String(value).includes("ZodEnum")
        ) {
            // Extract enum values if available
            // @ts-ignore
            const enumValues = value?._def?.values || [];
            if (Array.isArray(enumValues) && enumValues.length > 0) {
                type = enumValues
                    .map((v) => (typeof v === "string" ? `"${v}"` : v))
                    .join(" | ");
            } else {
                type = "string";
            }
        } else if (
            typeName === "ZodObject" ||
            String(value).includes("ZodObject")
        ) {
            // For nested objects, we could recursively extract properties
            // but for simplicity we'll just use 'Record<string, any>'
            type = "Record<string, any>";
        } else if (
            typeName === "ZodArray" ||
            String(value).includes("ZodArray")
        ) {
            // Try to get element type
            // @ts-ignore
            const elementType = value?._def?.type;
            if (elementType) {
                const innerType = getZodTypeString(elementType);
                type = `${innerType}[]`;
            } else {
                type = "any[]";
            }
        } else if (
            typeName === "ZodDate" ||
            String(value).includes("ZodDate")
        ) {
            type = "Date";
        } else if (isZodRecord(value)) {
            type = "Record<string, any>";
        }

        properties[key] = { type, optional: isOptional, description };
    }

    return properties;
}

/**
 * Gets a string representation of a Zod type
 * @param zodType Zod schema type
 * @returns A string representing the TypeScript type
 */
function getZodTypeString(zodType: any): string {
    if (!zodType) return "any";

    const typeName =
        zodType?.typeName ||
        zodType?._def?.typeName ||
        zodType?.constructor?.name;

    switch (typeName) {
        case "ZodString":
            return "string";
        case "ZodNumber":
            return "number";
        case "ZodBoolean":
            return "boolean";
        case "ZodObject":
            return "Record<string, any>";
        case "ZodArray":
            const elementType = zodType?._def?.type;
            if (elementType) {
                return `${getZodTypeString(elementType)}[]`;
            }
            return "any[]";
        case "ZodDate":
            return "Date";
        case "ZodEnum":
            const enumValues = zodType?._def?.values || [];
            if (Array.isArray(enumValues) && enumValues.length > 0) {
                return enumValues
                    .map((v) => (typeof v === "string" ? `"${v}"` : v))
                    .join(" | ");
            }
            return "string";
        default:
            return "any";
    }
}

/**
 * Checks if a Zod schema is a ZodRecord type
 * @param zodSchema The Zod schema to check
 * @returns True if the schema is a ZodRecord
 */
function isZodRecord(zodSchema: any): boolean {
    if (!zodSchema) return false;

    // Check for ZodRecord in typeName or _def.typeName
    const typeName =
        zodSchema.typeName ||
        zodSchema._def?.typeName ||
        zodSchema?.constructor?.name;
    if (typeName === "ZodRecord") return true;

    // Look for specific ZodRecord pattern
    return Boolean(
        String(zodSchema).includes("ZodRecord") ||
            (zodSchema._def?.keyType && zodSchema._def?.valueType)
    );
}

/**
 * Extracts property definitions from an OpenAPI schema object
 * @param schema The OpenAPI schema object
 * @returns A record of property names to their types and metadata
 */
function extractSchemaProperties(
    schema: any
): Record<string, { type: string; optional: boolean; description?: string }> {
    const properties: Record<
        string,
        { type: string; optional: boolean; description?: string }
    > = {};

    // Handle undefined or non-object schemas
    if (!schema) return properties;

    // Handle schema with $ref
    if (schema.$ref) {
        // Extract the type name from the ref
        const refType = schema.$ref.split("/").pop();
        return { data: { type: refType || "any", optional: false } };
    }

    // If no properties but has type, might be a primitive type
    if (!schema.properties && schema.type) {
        if (schema.type === "array" && schema.items) {
            let itemType = "any";
            if (schema.items.type) {
                itemType =
                    schema.items.type === "integer"
                        ? "number"
                        : schema.items.type;
            } else if (schema.items.$ref) {
                itemType = schema.items.$ref.split("/").pop() || "any";
            }
            return { data: { type: `${itemType}[]`, optional: false } };
        }

        const type = schema.type === "integer" ? "number" : schema.type;
        return { data: { type, optional: false } };
    }

    if (!schema.properties) return properties;

    // Extract required properties list
    const required = Array.isArray(schema.required) ? schema.required : [];

    // Extract properties from the schema
    for (const [key, value] of Object.entries(schema.properties || {})) {
        if (!value || typeof value !== "object") continue;

        const isOptional = !required.includes(key);
        let type = "any";

        // Determine the type based on the schema type
        // @ts-ignore
        if (value.type === "string") {
            // @ts-ignore
            if (value.format === "date-time") {
                type = "Date";
                // @ts-ignore
            } else if (value.enum && Array.isArray(value.enum)) {
                // @ts-ignore
                type = value.enum.map((v: string) => `"${v}"`).join(" | ");
                // @ts-ignore
            } else {
                type = "string";
            }
            // @ts-ignore
        } else if (value.type === "number" || value.type === "integer") {
            type = "number";
            // @ts-ignoree
        } else if (value.type === "boolean") {
            type = "boolean";
            // @ts-ignore
        } else if (value.type === "object") {
            // @ts-ignore
            if (value.properties) {
                // Nested object with properties
                type = "Record<string, any>"; // Simplified
            } else {
                type = "Record<string, any>";
            }
            // @ts-ignore
        } else if (value.type === "array") {
            // @ts-ignore
            if (value.items?.type) {
                type = `${
                    // @ts-ignore
                    value.items.type === "string"
                        ? "string"
                        : // @ts-ignore
                        value.items.type === "number" ||
                          // @ts-ignore
                          value.items.type === "integer"
                        ? "number"
                        : // @ts-ignore
                        value.items.type === "boolean"
                        ? "boolean"
                        : "any"
                }[]`;
                // @ts-ignoree
            } else if (value.items?.$ref) {
                // Extract type from ref
                // @ts-ignore
                const refType = value.items.$ref.split("/").pop();
                type = `${refType || "any"}[]`;
            } else {
                type = "any[]";
            }
            // @ts-ignore
        } else if (value.$ref) {
            // Handle direct references
            // @ts-ignore
            const refType = value.$ref.split("/").pop();
            type = refType || "any";
        }

        properties[key] = {
            type,
            optional: isOptional,
            // @ts-ignore
            description: value.description,
        };
    }

    return properties;
}

/**
 * Capitalizes the first letter of a string
 * @param str The input string
 * @returns The string with the first letter capitalized
 */
function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// /**
//  * Main export function that can be called directly from the CLI
//  * Generates Encore routes for a better-auth application
//  */
// export async function encoreGenerator(
//     ctx: AuthContext,
//     options: BetterAuthOptions
// ) {
//     // Generate Encore routes with default options
//     const routeContent = await generateEncoreRoutes(ctx, options);

//     // Return the generated content
//     return routeContent;
// }
