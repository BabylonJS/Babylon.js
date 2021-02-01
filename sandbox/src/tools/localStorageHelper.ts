export class LocalStorageHelper {
    public static ReadLocalStorageValue(key: string, defaultValue: number) {
        if (typeof (Storage) !== "undefined" && localStorage.getItem(key) !== null) {
            return parseInt(localStorage.getItem(key)!);
        }
    
        return defaultValue;
    }
}