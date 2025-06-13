import { type SmartFilter } from "@babylonjs/smart-filters";
import { getSnippet, setSnippet } from "./hashFunctions.js";
import { SnippetUrl } from "./constants.js";
import { serializeSmartFilter } from "./serializeSmartFilter.js";

/**
 * Saves the provided Smart Filter to the snippet server
 * @param smartFilter - Smart Filter to save
 */
export async function saveToSnippetServer(smartFilter: SmartFilter): Promise<void> {
    const smartFilterJson = await serializeSmartFilter(smartFilter);

    const dataToSend = {
        payload: JSON.stringify({
            smartFilter: smartFilterJson,
        }),
        name: "",
        description: "",
        tags: "",
    };

    const [snippetToken] = getSnippet();

    const response = await fetch(`${SnippetUrl}/${snippetToken || ""}`, {
        method: "POST",
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
        throw new Error(`Could not save snippet: ${response.statusText}`);
    }

    const snippet = await response.json();

    // Update the location in the address bar
    setSnippet(snippet.id, snippet.version, false);
}
