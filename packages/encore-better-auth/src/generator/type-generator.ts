import {
    BetterAuthOptions,
} from "better-auth";
import { FieldType, getAllFields } from 'better-auth/db';

/**
 * Generates a TypeScript input type definition as a string
 */

export function generateModelInputTypeString(
    options: BetterAuthOptions,
    model: "user" | "session" | "account",
    action: "create" | "update" = "create"
): string {
    const schema = getAllFields(options, model);
    const fields: string[] = [];

    for (const [key, field] of Object.entries(schema)) {
        let fieldType = getBaseTypeString(field.type);
        let isOptional = false;

        // Handle input: false fields
        if (field.input === false) {
            continue;
        }

        // Determine optionality based on action and field attributes
        if (action === "update") {
            isOptional = true;
        } else if (action === "create") {
            if (!field.required || field.defaultValue !== undefined) {
                isOptional = true;
            }
        }

        fields.push(`  ${key}${isOptional ? "?" : ""}: ${fieldType}`);
    }

    if (fields.length === 0) {
        return "{}";
    }

    return `{\n${fields.join(";\n")}\n}`;
}

/**
 * Generates a TypeScript output type definition as a string
 */
export function generateModelOutputTypeString(
    options: BetterAuthOptions,
    model: "user" | "session" | "account"
): string {
    const schema = getAllFields(options, model);
    const fields: string[] = [];

    for (const [key, field] of Object.entries(schema)) {
        // Skip fields that shouldn't be returned
        if (field.returned === false) {
            continue;
        }

        let fieldType = getBaseTypeString(field.type);
        const isOptional = !field.required || field.defaultValue !== undefined;

        fields.push(`  ${key}${isOptional ? "?" : ""}: ${fieldType}`);
    }

    if (fields.length === 0) {
        return "{}";
    }

    return `{\n${fields.join(";\n")}\n}`;
}

/**
 * Helper function to convert FieldType to TypeScript type string
 */
function getBaseTypeString(fieldType: FieldType): string {
    switch (fieldType) {
        case "string":
            return "string";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        case "date":
            return "Date";
        case "string[]":
            return "string[]";
        case "number[]":
            return "number[]";
        default:
            if (Array.isArray(fieldType)) {
                return fieldType.map((val) => `"${val}"`).join(" | ");
            }
            return "any"; // Fallback for unknown types
    }
}
