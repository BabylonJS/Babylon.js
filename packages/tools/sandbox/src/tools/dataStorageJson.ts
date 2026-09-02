import { DataStorage } from "core/Misc/dataStorage";
import { Logger } from "core/Misc/logger";

const MissingStorageValue = "__BabylonSandboxMissingStorageValue__";
const AlternateMissingStorageValue = "__BabylonSandboxAlternateMissingStorageValue__";

export interface IDataStorageStringAdapter {
    readString(key: string, defaultValue: string): string;
    writeString(key: string, value: string): void;
}

const DataStorageStringAdapter: IDataStorageStringAdapter = {
    readString: (key, defaultValue) => DataStorage.ReadString(key, defaultValue),
    writeString: (key, value) => DataStorage.WriteString(key, value),
};

export function ReadJsonFromDataStorage<T>(key: string, defaultValue: T, storage: IDataStorageStringAdapter = DataStorageStringAdapter): T {
    let storedValue = storage.readString(key, MissingStorageValue);
    if (storedValue === MissingStorageValue) {
        storedValue = storage.readString(key, AlternateMissingStorageValue);
        if (storedValue === AlternateMissingStorageValue) {
            return defaultValue;
        }
    }

    try {
        return JSON.parse(storedValue) as T;
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        Logger.Warn(`Failed to parse JSON from storage for key "${key}". Returning default value. ${detail}`);
        return defaultValue;
    }
}

export function ReadJsonRecordFromDataStorage(
    key: string,
    defaultValue: Record<string, unknown> = {},
    storage: IDataStorageStringAdapter = DataStorageStringAdapter
): Record<string, unknown> {
    const storedValue = ReadJsonFromDataStorage<unknown>(key, defaultValue, storage);
    return typeof storedValue === "object" && storedValue !== null && !Array.isArray(storedValue) ? (storedValue as Record<string, unknown>) : defaultValue;
}

export function WriteJsonToDataStorage<T>(key: string, value: T, storage: IDataStorageStringAdapter = DataStorageStringAdapter): void {
    storage.writeString(key, JSON.stringify(value));
}
