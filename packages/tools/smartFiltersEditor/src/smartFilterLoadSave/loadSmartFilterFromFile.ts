import type { ThinEngine } from "core/Engines/thinEngine";
import { ReadFile } from "core/Misc/fileTools";
import type { SmartFilter, SmartFilterDeserializer } from "smart-filters";

/**
 * Loads a Smart Filter from the provided file.
 * @param smartFilterDeserializer - SmartFilterDeserializer to use
 * @param engine - ThinEngine to use
 * @param file - File object to load from
 * @returns Promise that resolves with the loaded Smart Filter
 */
export async function LoadSmartFilterFromFile(smartFilterDeserializer: SmartFilterDeserializer, engine: ThinEngine, file: File): Promise<SmartFilter> {
    const data = await new Promise<string>((resolve, reject) => {
        ReadFile(
            file,
            (data) => resolve(data),
            undefined,
            false,
            (error) => reject(error)
        );
    });
    const smartFilter = await smartFilterDeserializer.deserialize(engine, JSON.parse(data));
    return smartFilter;
}
