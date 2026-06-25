import { z } from "zod";

import { CreateInlineJsonSchema, CreateJsonFileSchema, CreateOutputFileSchema, CreateOverwriteSchema, CreateSnippetIdSchema } from "../../src/index";

describe("tool schema helpers", () => {
    it("creates the shared output file schema", () => {
        const schema = CreateOutputFileSchema(z);

        expect(schema.description).toBe("Optional absolute file path. When provided, the JSON is written to this file and the path is returned instead of the full JSON.");
        expect(schema.safeParse(undefined).success).toBe(true);
        expect(schema.safeParse("/tmp/output.json").success).toBe(true);
    });

    it("creates described inline and file JSON schemas", () => {
        const inlineSchema = CreateInlineJsonSchema(z, "The NME JSON string to import");
        const fileSchema = CreateJsonFileSchema(z, "Absolute path to a file containing the NME JSON to import (alternative to inline json)");

        expect(inlineSchema.description).toBe("The NME JSON string to import");
        expect(fileSchema.description).toBe("Absolute path to a file containing the NME JSON to import (alternative to inline json)");
        expect(inlineSchema.safeParse("{}").success).toBe(true);
        expect(fileSchema.safeParse("/tmp/input.json").success).toBe(true);
    });

    it("creates the shared snippet id schema", () => {
        const schema = CreateSnippetIdSchema(z);

        expect(schema.description).toBe('Snippet ID from the Babylon.js Snippet Server (e.g. "ABC123" or "ABC123#2")');
        expect(schema.safeParse("ABC123#2").success).toBe(true);
        expect(schema.safeParse(undefined).success).toBe(false);
    });

    it("creates the shared overwrite schema", () => {
        const schema = CreateOverwriteSchema(z);

        expect(schema.description).toBe("If true, replace any existing graph with the same name. Default: false.");
        expect(schema.safeParse(true).success).toBe(true);
        expect(schema.safeParse(undefined).success).toBe(true);
    });
});
