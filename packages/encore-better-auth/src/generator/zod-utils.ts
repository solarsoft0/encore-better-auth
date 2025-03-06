import { ZodType, ZodObject, ZodOptional, ZodNullable, ZodString, ZodNumber, ZodBoolean, ZodDate, ZodArray, ZodLiteral, ZodEnum } from 'zod';

interface Field {
	name: string;
	type: string;
	optional: boolean;
	description?: string;
}

export function extractZodFields(schema: ZodType): Field[] {
	// Return empty array if schema is invalid or not a ZodObject
	if (!schema || !(schema instanceof ZodObject)) {
		return [];
	}

	// Get the schema's shape (field definitions)
	const shape = schema.shape;
	if (!shape || typeof shape !== "object") {
		return [];
	}

	// Process each field in the schema
	return Object.entries(shape).map(([name, field]) => {
		// Check if the field is optional or nullable
		const isOptional =
			field instanceof ZodOptional || field instanceof ZodNullable;
		// Get the underlying type (unwrap optional/nullable)
		const baseField = isOptional ? field._def.innerType : field;

		// Determine the TypeScript type based on the Zod type
		let type: string;
		if (baseField instanceof ZodString) {
			type = "string";
		} else if (baseField instanceof ZodNumber) {
			type = "number";
		} else if (baseField instanceof ZodBoolean) {
			type = "boolean";
		} else if (baseField instanceof ZodDate) {
			type = "Date";
		} else if (baseField instanceof ZodArray) {
			// Recursively extract the array item type
			const itemType = extractZodFields(baseField._def.type)[0]?.type || "any";
			type = `${itemType}[]`;
		} else if (baseField instanceof ZodLiteral) {
			// Represent literal values as quoted strings
			type = `"${baseField.value}"`;
		} else if (baseField instanceof ZodEnum) {
			// Create a union type from enum options
			type = baseField.options.map((opt: any) => `"${opt}"`).join(" | ");
		} else {
			// Fallback for unsupported types
			type = "any";
		}

		// Return the field object
		return { name, type, optional: isOptional };
	});
}