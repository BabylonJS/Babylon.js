import { Logger } from "./logger";

interface IStorage {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
}

/**
 * Class for storing data to local storage if available or in-memory storage otherwise
 */
export class DataStorage {
    private static _Storage: IStorage = DataStorage._GetStorage();

    private static _GetStorage(): IStorage {
        try {
            localStorage.setItem("test", "");
            localStorage.removeItem("test");
            return localStorage;
        } catch {
            const inMemoryStorage: { [key: string]: string } = {};
            return {
                getItem: (key) => {
                    const value = inMemoryStorage[key];
                    return value === undefined ? null : value;
                },
                setItem: (key, value) => {
                    inMemoryStorage[key] = value;
                },
            };
        }
    }

    /**
     * Reads a string from the data storage
     * @param key The key to read
     * @param defaultValue The value if the key doesn't exist
     * @returns The string value
     */
    public static ReadString(key: string, defaultValue: string): string {
        const value = this._Storage.getItem(key);
        return value !== null ? value : defaultValue;
    }

    /**
     * Writes a string to the data storage
     * @param key The key to write
     * @param value The value to write
     */
    public static WriteString(key: string, value: string): void {
        this._Storage.setItem(key, value);
    }

    /**
     * Reads a boolean from the data storage
     * @param key The key to read
     * @param defaultValue The value if the key doesn't exist
     * @returns The boolean value
     */
    public static ReadBoolean(key: string, defaultValue: boolean): boolean {
        const value = this._Storage.getItem(key);
        return value !== null ? value === "true" : defaultValue;
    }

    /**
     * Writes a boolean to the data storage
     * @param key The key to write
     * @param value The value to write
     */
    public static WriteBoolean(key: string, value: boolean) {
        this._Storage.setItem(key, value ? "true" : "false");
    }

    /**
     * Reads a number from the data storage
     * @param key The key to read
     * @param defaultValue The value if the key doesn't exist
     * @returns The number value
     */
    public static ReadNumber(key: string, defaultValue: number): number {
        const value = this._Storage.getItem(key);
        return value !== null ? parseFloat(value) : defaultValue;
    }

    /**
     * Writes a number to the data storage
     * @param key The key to write
     * @param value The value to write
     */
    public static WriteNumber(key: string, value: number) {
        this._Storage.setItem(key, value.toString());
    }

    /**
     * Reads a JSON value from the data storage
     * @param key The key to read
     * @param defaultValue The value if the key doesn't exist
     * @returns The JSON value
     */
    public static ReadJson<T>(key: string, defaultValue: T): T {
        const value = this._Storage.getItem(key);
        try {
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            Logger.Warn(`Failed to parse JSON from storage for key "${key}". Returning default value.`, e);
            return defaultValue;
        }
    }

    /**
     * Writes a JSON value to the data storage
     * @param key The key to write
     * @param value The JSON value to write
     */
    public static WriteJson<T>(key: string, value: T) {
        this._Storage.setItem(key, JSON.stringify(value));
    }
}
