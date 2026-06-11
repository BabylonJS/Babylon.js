import { dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { IsInputProvided, RequireAtLeastOneInput } from "./inputValidation.js";

/**
 * Options used to resolve text from either inline content or a file path.
 */
export interface IResolveInlineOrFileTextOptions {
    /** Inline text content provided directly by the caller. */
    inlineText?: string;
    /** Absolute path to a UTF-8 text file. */
    filePath?: string;
    /** Friendly label for the inline parameter used in error messages. */
    inlineLabel?: string;
    /** Friendly label for the file parameter used in error messages. */
    fileLabel?: string;
    /** Human-readable description of the file content used in read errors. */
    fileDescription?: string;
}

/**
 * Resolved text input along with the source it came from.
 */
export interface IResolvedTextInput {
    /** The resolved UTF-8 text content. */
    text: string;
    /** Whether the text came from inline input or a file. */
    source: "inline" | "file";
}

/**
 * Resolve text from either inline input or a file path.
 * Exactly one source must be provided.
 * @param options - Resolution options and friendly error labels.
 * @returns The resolved text plus its source.
 */
export function ResolveInlineOrFileText(options: IResolveInlineOrFileTextOptions): IResolvedTextInput {
    const inlineLabel = options.inlineLabel ?? "json";
    const fileLabel = options.fileLabel ?? "jsonFile";
    const fileDescription = options.fileDescription ?? "file";

    if (IsInputProvided(options.inlineText) && IsInputProvided(options.filePath)) {
        throw new Error(`Provide either ${inlineLabel} or ${fileLabel}, not both.`);
    }

    if (IsInputProvided(options.inlineText)) {
        return {
            text: options.inlineText as string,
            source: "inline",
        };
    }

    RequireAtLeastOneInput({
        candidates: [
            { label: inlineLabel, value: options.inlineText },
            { label: fileLabel, value: options.filePath },
        ],
        missingMessage: `Either ${inlineLabel} or ${fileLabel} must be provided.`,
    });

    try {
        return {
            text: readFileSync(options.filePath as string, "utf-8"),
            source: "file",
        };
    } catch (error) {
        throw new Error(`Error reading ${fileDescription}: ${(error as Error).message}`, { cause: error });
    }
}

/**
 * Write UTF-8 text to disk after creating any missing parent directories.
 * @param filePath - Absolute path to write.
 * @param text - Text content to persist.
 */
export function WriteTextFileEnsuringDirectory(filePath: string, text: string): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, text, "utf-8");
}
