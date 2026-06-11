/**
 * Text content block used by MCP tool responses.
 */
export interface IMcpTextContent {
    [key: string]: unknown;
    /** MCP content type. */
    type: "text";
    /** Response text shown to the caller. */
    text: string;
}

/**
 * Minimal text response shape used by the MCP servers in this workspace.
 */
export interface IMcpTextResponse {
    [key: string]: unknown;
    /** Ordered response content blocks. */
    content: IMcpTextContent[];
    /** Whether the response represents an error. */
    isError?: boolean;
}

/**
 * Create a single text content block.
 * @param text - Text to include in the content block.
 * @returns A text content object.
 */
export function CreateTextContent(text: string): IMcpTextContent {
    return { type: "text", text };
}

/**
 * Create a standard successful MCP text response.
 * @param text - Text to return to the caller.
 * @returns A response with a single text block.
 */
export function CreateTextResponse(text: string): IMcpTextResponse {
    return {
        content: [CreateTextContent(text)],
    };
}

/**
 * Create a standard MCP error response.
 * @param text - Error text to return to the caller.
 * @returns An error response with a single text block.
 */
export function CreateErrorResponse(text: string): IMcpTextResponse {
    return {
        content: [CreateTextContent(text)],
        isError: true,
    };
}

/**
 * Create a successful MCP response with multiple text blocks.
 * @param texts - Ordered text blocks to include.
 * @returns A response containing one text content object per entry.
 */
export function CreateTextResponses(texts: string[]): IMcpTextResponse {
    return {
        content: texts.map((text) => CreateTextContent(text)),
    };
}
