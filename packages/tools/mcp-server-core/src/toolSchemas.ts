/**
 * Create the standard optional output file schema used by JSON export tools.
 * @param zodFactory - The caller's local Zod factory.
 * @returns An optional string schema with the shared output-file description.
 */
export function CreateOutputFileSchema<Schema>(zodFactory: { string(): { optional(): { describe(description: string): Schema } } }): Schema {
    return zodFactory
        .string()
        .optional()
        .describe("Optional absolute file path. When provided, the JSON is written to this file and the path is returned instead of the full JSON.");
}

/**
 * Create an optional inline JSON string schema.
 * @param zodFactory - The caller's local Zod factory.
 * @param description - Field description to apply.
 * @returns An optional string schema for inline JSON text.
 */
export function CreateInlineJsonSchema<Schema>(zodFactory: { string(): { optional(): { describe(description: string): Schema } } }, description: string): Schema {
    return zodFactory.string().optional().describe(description);
}

/**
 * Create an optional JSON file path schema.
 * @param zodFactory - The caller's local Zod factory.
 * @param description - Field description to apply.
 * @returns An optional string schema for JSON file paths.
 */
export function CreateJsonFileSchema<Schema>(zodFactory: { string(): { optional(): { describe(description: string): Schema } } }, description: string): Schema {
    return zodFactory.string().optional().describe(description);
}

/**
 * Create the shared snippet ID schema used by Babylon.js snippet tools.
 * @param zodFactory - The caller's local Zod factory.
 * @returns A required string schema with the shared snippet-ID description.
 */
export function CreateSnippetIdSchema<Schema>(zodFactory: { string(): { describe(description: string): Schema } }): Schema {
    return zodFactory.string().describe('Snippet ID from the Babylon.js Snippet Server (e.g. "ABC123" or "ABC123#2")');
}

/**
 * Create the shared optional overwrite flag used by import tools that can replace an existing graph.
 * @param zodFactory - The caller's local Zod factory.
 * @returns An optional boolean schema with the shared overwrite description.
 */
export function CreateOverwriteSchema<Schema>(zodFactory: { boolean(): { optional(): { describe(description: string): Schema } } }): Schema {
    return zodFactory.boolean().optional().describe("If true, replace any existing graph with the same name. Default: false.");
}
