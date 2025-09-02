import type { SmartFilter } from "smart-filters";
import { SerializeSmartFilter } from "./serializeSmartFilter";

/**
 * Copies the Smart Filter to the clipboard as a JSON file.
 * @param smartFilter - The Smart Filter to copy
 */
export async function CopySmartFilterToClipboard(smartFilter: SmartFilter): Promise<void> {
    const serializedSmartFilter = await CopySmartFilterToString(smartFilter);
    await navigator.clipboard.writeText(serializedSmartFilter);
}

/**
 * Copies the Smart Filter to a string as a JSON file.
 * @param smartFilter - The Smart Filter to copy
 * @returns The serialized Smart Filter as a string
 */
export async function CopySmartFilterToString(smartFilter: SmartFilter): Promise<string> {
    const serializedSmartFilter = await SerializeSmartFilter(smartFilter);
    return serializedSmartFilter;
}
