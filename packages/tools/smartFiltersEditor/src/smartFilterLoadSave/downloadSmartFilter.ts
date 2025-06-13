import { StringTools } from "@babylonjs/shared-ui-components/stringTools.js";
import type { SmartFilter } from "@babylonjs/smart-filters";
import { serializeSmartFilter } from "./serializeSmartFilter.js";

/**
 * Initiates the download of a  Smart Filter as a JSON file.
 * @param smartFilter - The Smart Filter to download
 */
export async function downloadSmartFilter(smartFilter: SmartFilter): Promise<void> {
    const serializedSmartFilter = await serializeSmartFilter(smartFilter);

    StringTools.DownloadAsFile(document, serializedSmartFilter, smartFilter.name + ".json");
}
