export class DataStorage {
    private static _InMemoryStorage: { [key: string]: boolean | number };

    public static ReadBoolean(key: string, defaultValue: boolean): boolean {
        try {
            if (this._InMemoryStorage && this._InMemoryStorage[key] !== undefined) {
                return this._InMemoryStorage[key] as boolean;
            } else if (typeof (Storage) !== "undefined" && localStorage.getItem(key) !== null) {
                return localStorage.getItem(key) === "true";
            } else {
                return defaultValue;
            }
        }
        catch (e) {
            this._InMemoryStorage = {};
            this._InMemoryStorage[key] = defaultValue;
            return defaultValue;
        }
    }

    public static StoreBoolean(key: string, value: boolean) {
        try {
            if (this._InMemoryStorage) {
                this._InMemoryStorage[key] = value;
            } else if (typeof (Storage) !== "undefined") {
                localStorage.setItem(key, value ? "true" : "false");
            }
        }
        catch (e) {
            this._InMemoryStorage = {};
            this._InMemoryStorage[key] = value;
        }
    }

    public static ReadNumber(key: string, defaultValue: number): number {
        try {
            if (this._InMemoryStorage && this._InMemoryStorage[key] !== undefined) {
                return this._InMemoryStorage[key] as number;
            } else if (typeof (Storage) !== "undefined" && localStorage.getItem(key) !== null) {
                return parseFloat(localStorage.getItem(key)!);
            } else {
                return defaultValue;
            }
        }
        catch (e) {
            this._InMemoryStorage = {};
            this._InMemoryStorage[key] = defaultValue;
            return defaultValue;
        }
    }

    public static StoreNumber(key: string, value: number) {
        try {
            if (this._InMemoryStorage) {
                this._InMemoryStorage[key] = value;
            } else if (typeof (Storage) !== "undefined") {
                localStorage.setItem(key, value.toString());
            }
        }
        catch (e) {
            this._InMemoryStorage = {};
            this._InMemoryStorage[key] = value;
        }
    }
}