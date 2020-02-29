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
        }
        catch {
            const inMemoryStorage: { [key: string]: string } = {};
            return {
                getItem: (key) => {
                    const value = inMemoryStorage[key];
                    return value === undefined ? null : value;
                },
                setItem: (key, value) => {
                    inMemoryStorage[key] = value;
                }
            };
        }
    }

    public static ReadString(key: string, defaultValue: string): string {
        const value = this._Storage.getItem(key);
        return (value !== null ? value : defaultValue);
    }

    public static WriteString(key: string, value: string): void {
        this._Storage.setItem(key, value);
    }

    public static ReadBoolean(key: string, defaultValue: boolean): boolean {
        const value = this._Storage.getItem(key);
        return (value !== null ? (value === "true") : defaultValue);
    }

    public static WriteBoolean(key: string, value: boolean) {
        this._Storage.setItem(key, value ? "true" : "false");
    }

    public static ReadNumber(key: string, defaultValue: number): number {
        const value = this._Storage.getItem(key);
        return (value !== null ? parseFloat(value) : defaultValue);
    }

    public static WriteNumber(key: string, value: number) {
        this._Storage.setItem(key, value.toString());
    }
}