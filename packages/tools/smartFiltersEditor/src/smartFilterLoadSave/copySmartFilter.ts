import type { SmartFilter } from "smart-filters";
import { SerializeSmartFilter } from "./serializeSmartFilter";

/**
 * Copies the Smart Filter to the clipboard as a JSON file.
 * @param smartFilter - The Smart Filter to copy
 */
export async function CopySmartFilter(smartFilter: SmartFilter): Promise<void> {
    const serializedSmartFilter = await SerializeSmartFilter(smartFilter);
    await navigator.clipboard.writeText(serializedSmartFilter);
}
