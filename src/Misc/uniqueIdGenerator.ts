/**
 * Helper class used to generate session unique ID
 */
export class UniqueIdGenerator {
    // Statics
    private static _UniqueIdCounter = 0;

    /**
     * Gets an unique (relatively to the current scene) Id
     * @returns an unique number for the scene
     */
    public static get UniqueId() {
        var result = this._UniqueIdCounter;
        this._UniqueIdCounter++;
        return result;
    }
}