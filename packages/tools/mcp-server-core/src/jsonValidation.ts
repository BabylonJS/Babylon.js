/**
 * Options used to parse JSON text with consistent error messages.
 */
export interface IParseJsonTextOptions {
    /** Raw JSON text to parse. */
    jsonText: string;
    /** Friendly label used in parse error messages. */
    jsonLabel?: string;
    /** Include a preview of the invalid JSON text in parse errors. */
    includePreviewInError?: boolean;
    /** Maximum number of characters to include in the error preview. */
    previewLength?: number;
}

/**
 * Parse JSON text and throw a consistently formatted error when parsing fails.
 * @param options - JSON parse options and error formatting controls.
 * @returns Parsed JSON value.
 */
export function ParseJsonText<T = unknown>(options: IParseJsonTextOptions): T {
    const jsonLabel = options.jsonLabel ?? "JSON";

    try {
        return JSON.parse(options.jsonText) as T;
    } catch (error) {
        if (options.includePreviewInError) {
            const previewLength = options.previewLength ?? 100;
            const preview = options.jsonText.slice(0, previewLength);
            const suffix = options.jsonText.length > preview.length ? "..." : "";
            throw new Error(`Invalid ${jsonLabel}: ${preview}${suffix}`, { cause: error });
        }

        throw new Error(`Invalid ${jsonLabel}: parse error.`, { cause: error });
    }
}
