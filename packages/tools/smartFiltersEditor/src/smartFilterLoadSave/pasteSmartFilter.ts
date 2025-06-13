import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { SmartFilter, SmartFilterDeserializer } from "@babylonjs/smart-filters";
import type { Nullable } from "@babylonjs/core/types";

/**
 * Pastes a Smart Filter from clipboard.
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @returns Promise that resolves with the pasted Smart Filter
 */
export async function pasteSmartFilter(
    smartFilterDeserializer: SmartFilterDeserializer,
    engine: ThinEngine
): Promise<Nullable<SmartFilter>> {
    try {
        const clipboardText = await navigator.clipboard.readText();
        return smartFilterDeserializer.deserialize(engine, JSON.parse(clipboardText));
    } catch (error) {
        throw new Error(`Failed to paste Smart Filter: ${error instanceof Error ? error.message : String(error)}`);
    }
}
