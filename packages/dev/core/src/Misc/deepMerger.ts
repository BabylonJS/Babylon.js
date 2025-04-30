// https://stackoverflow.com/a/48218209
/**
 * Merges a series of objects into a single object, deeply.
 * @param objects The objects to merge (objects later in the list take precedence).
 * @returns The merged object.
 */
export function deepMerge<T extends Object>(...objects: T[]): T {
    const isRecord = (obj: unknown): obj is Record<string, unknown> => !!obj && typeof obj === "object";

    return objects.reduce<Record<string, unknown>>((prev, obj) => {
        const keys = Object.keys(obj);
        for (const key of keys) {
            const pVal = prev[key];
            const oVal = (obj as Record<string, unknown>)[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            } else if (isRecord(pVal) && isRecord(oVal)) {
                prev[key] = deepMerge(pVal, oVal);
            } else {
                prev[key] = oVal;
            }
        }

        return prev;
    }, {}) as T;
}
