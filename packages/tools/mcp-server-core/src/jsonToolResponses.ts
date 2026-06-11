import { ResolveInlineOrFileText, WriteTextFileEnsuringDirectory } from "./textHandoff.js";
import { CreateErrorResponse, CreateTextResponse, type IMcpTextResponse } from "./response.js";

/**
 * Options for exporting JSON either inline or to a file.
 */
export interface ICreateJsonExportResponseOptions {
    /** JSON text to return or persist. */
    jsonText?: string | null;
    /** Optional absolute path to write the JSON to. */
    outputFile?: string;
    /** Error message returned when the JSON source does not exist. */
    missingMessage: string;
    /** Human-readable label used in the file-written success message. */
    fileLabel: string;
}

/**
 * Options for importing JSON into an in-memory manager and describing the result.
 */
export interface ICreateJsonImportResponseOptions {
    /** Inline JSON text provided directly by the caller. */
    json?: string;
    /** Optional absolute path to a JSON file. */
    jsonFile?: string;
    /** Human-readable description used in file-read errors. */
    fileDescription: string;
    /** Import callback that returns "OK" on success or an error string on failure. */
    importJson: (jsonText: string) => string;
    /** Description callback for the imported object after a successful import. */
    describeImported: () => string;
    /** Success message prefix returned before the description. */
    successMessage?: string;
}

/**
 * Options for importing JSON into an in-memory manager and building a custom success summary.
 */
export interface ICreateJsonImportSummaryResponseOptions<ImportResult> {
    /** Inline JSON text provided directly by the caller. */
    json?: string;
    /** Optional absolute path to a JSON file. */
    jsonFile?: string;
    /** Human-readable description used in file-read errors. */
    fileDescription: string;
    /** Import callback invoked with the resolved JSON text. */
    importJson: (jsonText: string) => ImportResult;
    /** Builds the success text returned to the caller. */
    createSuccessText: (result: ImportResult) => string;
}

/**
 * Minimal snippet payload shape used by the MCP servers in this workspace.
 */
export interface IJsonDataSnippetResult {
    /** Snippet kind identifier returned by the snippet loader. */
    type: string;
    /** JSON-compatible payload for supported snippet types. */
    data?: unknown;
}

/**
 * Options for importing a typed snippet into an in-memory manager and describing the result.
 */
export interface ICreateTypedSnippetImportResponseOptions {
    /** Snippet identifier requested by the caller. */
    snippetId: string;
    /** Snippet payload returned by the caller's snippet loader. */
    snippetResult: IJsonDataSnippetResult;
    /** Expected snippet type for the current manager. */
    expectedType: string;
    /** Import callback that returns "OK" on success or an error string on failure. */
    importJson: (jsonText: string) => string;
    /** Description callback for the imported object after a successful import. */
    describeImported: () => string;
    /** Success message prefix returned before the description. */
    successMessage: string;
}

/**
 * Options for importing a typed snippet and building a custom success summary.
 */
export interface ICreateTypedSnippetImportSummaryResponseOptions<ImportResult> {
    /** Snippet identifier requested by the caller. */
    snippetId: string;
    /** Snippet payload returned by the caller's snippet loader. */
    snippetResult: IJsonDataSnippetResult;
    /** Expected snippet type for the current manager. */
    expectedType: string;
    /** Import callback invoked with the snippet JSON text. */
    importJson: (jsonText: string) => ImportResult;
    /** Builds the success text returned to the caller. */
    createSuccessText: (result: ImportResult) => string;
}

/**
 * Options for wrapping snippet-fetch boilerplate around a response factory.
 */
export interface IRunSnippetResponseOptions<SnippetResult = unknown> {
    /** Snippet identifier requested by the caller. */
    snippetId: string;
    /** Async loader used to fetch the snippet payload. */
    loadSnippet: (snippetId: string) => Promise<SnippetResult>;
    /** Builds the final response from the fetched snippet payload. */
    createResponse: (snippetResult: SnippetResult) => IMcpTextResponse;
}

/**
 * Build a standard MCP response for JSON export tools.
 * @param options - Export result data and output-file options.
 * @returns A text response for the caller.
 */
export function CreateJsonExportResponse(options: ICreateJsonExportResponseOptions): IMcpTextResponse {
    if (!options.jsonText) {
        return CreateErrorResponse(options.missingMessage);
    }

    if (!options.outputFile) {
        return CreateTextResponse(options.jsonText);
    }

    try {
        WriteTextFileEnsuringDirectory(options.outputFile, options.jsonText);
        return CreateTextResponse(`${options.fileLabel} written to: ${options.outputFile}`);
    } catch (error) {
        return CreateErrorResponse(`Error writing file: ${(error as Error).message}`);
    }
}

/**
 * Build a standard MCP response for JSON import tools that load an object and then describe it.
 * @param options - Import callbacks and source-text options.
 * @returns A text response for the caller.
 */
export function CreateJsonImportResponse(options: ICreateJsonImportResponseOptions): IMcpTextResponse {
    let jsonText: string;

    try {
        jsonText = ResolveInlineOrFileText({
            inlineText: options.json,
            filePath: options.jsonFile,
            inlineLabel: "json",
            fileLabel: "jsonFile",
            fileDescription: options.fileDescription,
        }).text;
    } catch (error) {
        return CreateErrorResponse((error as Error).message);
    }

    const result = options.importJson(jsonText);
    if (result !== "OK") {
        return CreateErrorResponse(`Error: ${result}`);
    }

    return CreateTextResponse(`${options.successMessage ?? "Imported successfully."}\n\n${options.describeImported()}`);
}

/**
 * Build a standard MCP response for JSON import tools that need a custom success summary.
 * @param options - Import callbacks and source-text options.
 * @returns A text response for the caller.
 */
export function CreateJsonImportSummaryResponse<ImportResult>(options: ICreateJsonImportSummaryResponseOptions<ImportResult>): IMcpTextResponse {
    let jsonText: string;

    try {
        jsonText = ResolveInlineOrFileText({
            inlineText: options.json,
            filePath: options.jsonFile,
            inlineLabel: "json",
            fileLabel: "jsonFile",
            fileDescription: options.fileDescription,
        }).text;
    } catch (error) {
        return CreateErrorResponse((error as Error).message);
    }

    try {
        return CreateTextResponse(options.createSuccessText(options.importJson(jsonText)));
    } catch (error) {
        return CreateErrorResponse(`Error: ${(error as Error).message}`);
    }
}

/**
 * Build a standard MCP response for snippet-import tools that load a typed JSON payload.
 * @param options - Snippet payload and import callbacks.
 * @returns A text response for the caller.
 */
export function CreateTypedSnippetImportResponse(options: ICreateTypedSnippetImportResponseOptions): IMcpTextResponse {
    if (options.snippetResult.type === "unknown") {
        return CreateErrorResponse(`Error: Snippet "${options.snippetId}" has an unrecognized format.`);
    }

    if (options.snippetResult.type !== options.expectedType) {
        return CreateErrorResponse(`Error: Snippet "${options.snippetId}" is of type "${options.snippetResult.type}", not "${options.expectedType}".`);
    }

    const result = options.importJson(JSON.stringify(options.snippetResult.data));
    if (result !== "OK") {
        return CreateErrorResponse(`Error importing snippet data: ${result}`);
    }

    return CreateTextResponse(`${options.successMessage}\n\n${options.describeImported()}`);
}

/**
 * Build a standard MCP response for typed snippet imports that need a custom success summary.
 * @param options - Snippet payload and import callbacks.
 * @returns A text response for the caller.
 */
export function CreateTypedSnippetImportSummaryResponse<ImportResult>(options: ICreateTypedSnippetImportSummaryResponseOptions<ImportResult>): IMcpTextResponse {
    if (options.snippetResult.type === "unknown") {
        return CreateErrorResponse(`Error: Snippet "${options.snippetId}" has an unrecognized format.`);
    }

    if (options.snippetResult.type !== options.expectedType) {
        return CreateErrorResponse(`Error: Snippet "${options.snippetId}" is of type "${options.snippetResult.type}", not "${options.expectedType}".`);
    }

    try {
        return CreateTextResponse(options.createSuccessText(options.importJson(JSON.stringify(options.snippetResult.data))));
    } catch (error) {
        return CreateErrorResponse(`Error: ${(error as Error).message}`);
    }
}

/**
 * Load a snippet and map it to a response with consistent fetch-error handling.
 * @param options - Snippet identifier, loader, and response factory.
 * @returns The final MCP response.
 */
export async function RunSnippetResponse<SnippetResult>(options: IRunSnippetResponseOptions<SnippetResult>): Promise<IMcpTextResponse> {
    try {
        return options.createResponse(await options.loadSnippet(options.snippetId));
    } catch (error) {
        return CreateErrorResponse(`Error fetching snippet "${options.snippetId}": ${(error as Error).message}`);
    }
}
