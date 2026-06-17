import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
    CreateJsonExportResponse,
    CreateJsonImportResponse,
    CreateJsonImportSummaryResponse,
    CreateTextResponse,
    CreateTypedSnippetImportResponse,
    CreateTypedSnippetImportSummaryResponse,
    RunSnippetResponse,
} from "../../src/index";

describe("json tool response helpers", () => {
    it("returns an error when export JSON is missing", () => {
        expect(
            CreateJsonExportResponse({
                jsonText: undefined,
                missingMessage: 'Material "test" not found.',
                fileLabel: "NME JSON",
            })
        ).toEqual({
            content: [{ type: "text", text: 'Material "test" not found.' }],
            isError: true,
        });
    });

    it("writes exported JSON to disk when outputFile is provided", () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-core-export-"));
        const outputFile = path.join(tempDir, "nested", "graph.json");

        expect(
            CreateJsonExportResponse({
                jsonText: '{"ok":true}',
                outputFile,
                missingMessage: 'Material "test" not found.',
                fileLabel: "NME JSON",
            })
        ).toEqual({
            content: [{ type: "text", text: `NME JSON written to: ${outputFile}` }],
        });

        expect(fs.readFileSync(outputFile, "utf-8")).toBe('{"ok":true}');
    });

    it("returns inline exported JSON when no outputFile is provided", () => {
        expect(
            CreateJsonExportResponse({
                jsonText: '{"ok":true}',
                missingMessage: 'Material "test" not found.',
                fileLabel: "NME JSON",
            })
        ).toEqual({
            content: [{ type: "text", text: '{"ok":true}' }],
        });
    });

    it("imports JSON from inline text and appends the object description", () => {
        expect(
            CreateJsonImportResponse({
                json: '{"ok":true}',
                fileDescription: "NME JSON file",
                importJson: () => "OK",
                describeImported: () => "material description",
            })
        ).toEqual({
            content: [{ type: "text", text: "Imported successfully.\n\nmaterial description" }],
        });
    });

    it("returns an error when import validation fails", () => {
        expect(
            CreateJsonImportResponse({
                fileDescription: "GUI JSON file",
                importJson: () => "OK",
                describeImported: () => "gui description",
            })
        ).toEqual({
            content: [{ type: "text", text: "Either json or jsonFile must be provided." }],
            isError: true,
        });
    });

    it("returns an error when the import callback fails", () => {
        expect(
            CreateJsonImportResponse({
                json: '{"ok":false}',
                fileDescription: "GUI JSON file",
                importJson: () => "bad payload",
                describeImported: () => "gui description",
            })
        ).toEqual({
            content: [{ type: "text", text: "Error: bad payload" }],
            isError: true,
        });
    });

    it("creates a custom summary response for JSON imports", () => {
        expect(
            CreateJsonImportSummaryResponse({
                json: '{"ok":true}',
                fileDescription: "NRGE JSON file",
                importJson: () => ({ blocks: [1, 2], outputNodeId: 7 }),
                createSuccessText: (graph) => `Imported render graph with ${graph.blocks.length} blocks.\noutputNodeId: ${graph.outputNodeId}`,
            })
        ).toEqual({
            content: [{ type: "text", text: "Imported render graph with 2 blocks.\noutputNodeId: 7" }],
        });
    });

    it("returns an error when custom-summary import throws", () => {
        expect(
            CreateJsonImportSummaryResponse({
                json: '{"ok":true}',
                fileDescription: "NRGE JSON file",
                importJson: () => {
                    throw new Error("bad graph");
                },
                createSuccessText: () => "unreachable",
            })
        ).toEqual({
            content: [{ type: "text", text: "Error: bad graph" }],
            isError: true,
        });
    });

    it("returns an error for snippets with the wrong type", () => {
        expect(
            CreateTypedSnippetImportResponse({
                snippetId: "ABC123",
                snippetResult: { type: "gui", data: {} },
                expectedType: "nodeMaterial",
                importJson: () => "OK",
                describeImported: () => "material description",
                successMessage: 'Imported snippet "ABC123" as "mat" successfully.',
            })
        ).toEqual({
            content: [{ type: "text", text: 'Error: Snippet "ABC123" is of type "gui", not "nodeMaterial".' }],
            isError: true,
        });
    });

    it("imports typed snippet JSON and appends the object description", () => {
        expect(
            CreateTypedSnippetImportResponse({
                snippetId: "ABC123",
                snippetResult: { type: "nodeMaterial", data: { editorData: { locations: [] } } },
                expectedType: "nodeMaterial",
                importJson: () => "OK",
                describeImported: () => "material description",
                successMessage: 'Imported snippet "ABC123" as "mat" successfully.',
            })
        ).toEqual({
            content: [{ type: "text", text: 'Imported snippet "ABC123" as "mat" successfully.\n\nmaterial description' }],
        });
    });

    it("creates a custom summary response for typed snippet imports", () => {
        expect(
            CreateTypedSnippetImportSummaryResponse({
                snippetId: "ABC123",
                snippetResult: { type: "nodeRenderGraph", data: { blocks: [1, 2, 3] } },
                expectedType: "nodeRenderGraph",
                importJson: () => ({ blocks: [1, 2, 3], outputNodeId: null }),
                createSuccessText: (graph) => `Imported render graph with ${graph.blocks.length} blocks.\noutputNodeId: ${graph.outputNodeId ?? "(not set)"}`,
            })
        ).toEqual({
            content: [{ type: "text", text: "Imported render graph with 3 blocks.\noutputNodeId: (not set)" }],
        });
    });

    it("loads a snippet and delegates to the response factory", async () => {
        await expect(
            RunSnippetResponse({
                snippetId: "ABC123",
                loadSnippet: async () => ({ type: "nodeMaterial", data: { ok: true } }),
                createResponse: (snippetResult) => CreateTextResponse(`Loaded ${snippetResult.type}`),
            })
        ).resolves.toEqual({
            content: [{ type: "text", text: "Loaded nodeMaterial" }],
        });
    });

    it("returns a consistent error when snippet loading fails", async () => {
        await expect(
            RunSnippetResponse({
                snippetId: "ABC123",
                loadSnippet: async () => {
                    throw new Error("network down");
                },
                createResponse: () => CreateTextResponse("unreachable"),
            })
        ).resolves.toEqual({
            content: [{ type: "text", text: 'Error fetching snippet "ABC123": network down' }],
            isError: true,
        });
    });
});
