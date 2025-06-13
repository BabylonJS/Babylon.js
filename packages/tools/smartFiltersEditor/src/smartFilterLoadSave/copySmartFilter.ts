import type { SmartFilter } from "@babylonjs/smart-filters";
import { serializeSmartFilter } from "./serializeSmartFilter.js";

/**
 * Copies the Smart Filter to the clipboard as a JSON file.
 * @param smartFilter - The Smart Filter to copy
 */
export async function copySmartFilter(smartFilter: SmartFilter): Promise<void> {
    serializeSmartFilter(smartFilter).then((serializedSmartFilter) => {
        navigator.clipboard.writeText(serializedSmartFilter);
    });
}
