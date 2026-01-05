import type { ThinEngine } from "core/Engines/thinEngine";
import type { SmartFilter, SmartFilterDeserializer } from "smart-filters";
import type { Nullable } from "core/types";

/**
 * Pastes a Smart Filter from clipboard.
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @returns Promise that resolves with the pasted Smart Filter
 */
export async function PasteSmartFilterFromClipboardAsync(smartFilterDeserializer: SmartFilterDeserializer, engine: ThinEngine): Promise<Nullable<SmartFilter>> {
    try {
        const clipboardText = await navigator.clipboard.readText();
        const smartFilter = await smartFilterDeserializer.deserialize(engine, JSON.parse(clipboardText));
        return smartFilter;
    } catch (error) {
        throw new Error(`Failed to paste Smart Filter: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Pastes a Smart Filter from a string.
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @param input - The input string to paste
 * @returns Promise that resolves with the new Smart Filter
 */
export async function PasteSmartFilterFromStringAsync(smartFilterDeserializer: SmartFilterDeserializer, engine: ThinEngine, input: string): Promise<Nullable<SmartFilter>> {
    try {
        const smartFilter = await smartFilterDeserializer.deserialize(engine, JSON.parse(input));
        return smartFilter;
    } catch (error) {
        throw new Error(`Failed to paste Smart Filter: ${error instanceof Error ? error.message : String(error)}`);
    }
}
