import { StringTools } from "shared-ui-components/stringTools.js";
import type { SmartFilter } from "smart-filters";
import { SerializeSmartFilter } from "./serializeSmartFilter";

/**
 * Initiates the download of a  Smart Filter as a JSON file.
 * @param smartFilter - The Smart Filter to download
 */
export async function DownloadSmartFilter(smartFilter: SmartFilter): Promise<void> {
    const serializedSmartFilter = await SerializeSmartFilter(smartFilter);

    StringTools.DownloadAsFile(document, serializedSmartFilter, smartFilter.name + ".json");
}
