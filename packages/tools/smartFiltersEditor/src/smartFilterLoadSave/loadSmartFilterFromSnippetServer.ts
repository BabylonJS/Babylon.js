import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { SmartFilter, SmartFilterDeserializer } from "@babylonjs/smart-filters";
import { SnippetUrl } from "./constants.js";

/**
 * Loads a SmartFilter from the provided file.
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @param snippetToken - Snippet token to load from
 * @param version - Optional version to load
 * @returns Promise that resolves with the loaded SmartFilter
 */
export async function loadSmartFilterFromSnippetServer(
    smartFilterDeserializer: SmartFilterDeserializer,
    engine: ThinEngine,
    snippetToken: string,
    version: string | undefined
): Promise<SmartFilter> {
    const response = await fetch(`${SnippetUrl}/${snippetToken}/${version || ""}`);

    if (!response.ok) {
        throw new Error(`Could not fetch snippet ${snippetToken}. Response was: ${response.status}`);
    }

    const data = await response.json();
    const snippet = JSON.parse(data.jsonPayload);
    const serializedSmartFilter = JSON.parse(snippet.smartFilter);

    return smartFilterDeserializer.deserialize(engine, serializedSmartFilter);
}
