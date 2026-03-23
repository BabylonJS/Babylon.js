import { LoadSnippet } from "@tools/snippet-loader";
import type { IPlaygroundSnippetResult } from "@tools/snippet-loader";

/**
 * Loads a playground snippet by ID and returns the fully-parsed result.
 * The consumer uses `result.createEngine(canvas)` and
 * `result.createScene(engine, canvas)` to run the snippet.
 *
 * @param playgroundId - The snippet ID (e.g. "ABC123#0").
 * @returns The parsed {@link IPlaygroundSnippetResult}.
 * @throws If the snippet is not a playground type.
 */
export const LoadPlaygroundAsync = async (playgroundId: string): Promise<IPlaygroundSnippetResult> => {
    const result = await LoadSnippet(playgroundId, { moduleFormat: "esm" });
    if (result.type !== "playground") {
        throw new Error(`Snippet "${playgroundId}" is not a playground snippet (type: ${result.type})`);
    }
    return result;
};

/**
 * Extracts the playground ID from the current URL hash or query string.
 *
 * @returns The playground snippet ID, or an empty string if not found.
 */
export const GetPlaygroundId = () => {
    if (location.hash) {
        return location.hash.substring(1);
    } else {
        if (location.href.indexOf("pg=") > -1) {
            return location.href.split("pg=")[1];
        }
    }
    return "";
};
