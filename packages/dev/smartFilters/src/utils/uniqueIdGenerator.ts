/**
 * Helper class used to generate IDs unique to the current session
 */
export class UniqueIdGenerator {
    /**
     * The next unique ID to be returned
     */
    public static _NextUniqueId = 1;

    /**
     * Gets a unique (relatively to the current session) Id
     */
    public static get UniqueId() {
        const result = this._NextUniqueId;
        this._NextUniqueId++;
        return result;
    }

    /**
     * Ensures future generated IDs are greater than the specified value
     * @param minimum - The minimum value that future generated IDs should be greater than
     */
    public static EnsureIdsGreaterThan(minimum: number): void {
        if (this._NextUniqueId <= minimum) {
            this._NextUniqueId = minimum + 1;
        }
    }
}
