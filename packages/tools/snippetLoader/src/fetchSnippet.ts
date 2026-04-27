import { type ISnippetServerResponse } from "./types";

/** Default snippet server endpoint. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DEFAULT_SNIPPET_URL = "https://snippet.babylonjs.com";

/**
 * Fetches a raw snippet envelope from the snippet server.
 *
 * @param snippetId - The snippet identifier, e.g. `"ABC123"` or `"ABC123#2"`.
 *   The `#` separator between id and revision is normalised to `/` for the HTTP request.
 * @param snippetUrl - Base URL of the snippet server (defaults to `https://snippet.babylonjs.com`).
 * @returns The parsed server response envelope.
 */
export async function FetchSnippet(snippetId: string, snippetUrl: string = DEFAULT_SNIPPET_URL): Promise<ISnippetServerResponse> {
    // Normalise "ID#revision" → "ID/revision", and ensure a revision exists.
    let path = snippetId.replace(/#/g, "/");
    if (!path.includes("/")) {
        path += "/0";
    }

    const url = `${snippetUrl}/${path}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch snippet "${snippetId}": ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as ISnippetServerResponse;
}
