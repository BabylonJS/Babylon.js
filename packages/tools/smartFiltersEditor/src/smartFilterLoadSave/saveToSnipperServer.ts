import { type SmartFilter } from "smart-filters";
import { GetSnippet, SetSnippet } from "./hashFunctions";
import { SnippetUrl } from "./constants";
import { SerializeSmartFilter } from "./serializeSmartFilter";

/**
 * Saves the provided Smart Filter to the snippet server
 * @param smartFilter - Smart Filter to save
 */
export async function SaveToSnippetServerAsync(smartFilter: SmartFilter): Promise<void> {
    const smartFilterJson = await SerializeSmartFilter(smartFilter);

    const dataToSend = {
        payload: JSON.stringify({
            smartFilter: smartFilterJson,
        }),
        name: "",
        description: "",
        tags: "",
    };

    const [snippetToken] = GetSnippet();

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
    SetSnippet(snippet.id, snippet.version, false);
}
