/**
 * Resolves a glTF 2.1 unique ID to the JSON value it identifies.
 * The JSON object can be obtained from GLTFFileLoader.onParsedObservable.
 * @param gltf The parsed glTF JSON document
 * @param uniqueId The case-sensitive unique ID
 * @returns The referenced JSON value, or undefined if the ID is not defined
 * @throws If the ID's pointer is invalid or does not identify a value
 */
export function GetGLTFValueByUniqueId(gltf: object, uniqueId: string): unknown {
    const ids = (gltf as { uniqueIds?: Record<string, { pointer: string }> }).uniqueIds;
    if (!ids || !Object.prototype.hasOwnProperty.call(ids, uniqueId)) {
        return undefined;
    }

    const pointer = ids[uniqueId]?.pointer;
    if (typeof pointer !== "string" || !pointer.startsWith("/") || pointer === "/uniqueIds" || pointer.startsWith("/uniqueIds/") || /~(?![01])/.test(pointer)) {
        throw new Error(`Invalid glTF unique ID pointer for '${uniqueId}'`);
    }

    let value: unknown = gltf;
    for (const rawSegment of pointer.substring(1).split("/")) {
        const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~");
        if (value === null || typeof value !== "object" || (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(segment)) || !Object.prototype.hasOwnProperty.call(value, segment)) {
            throw new Error(`glTF unique ID '${uniqueId}' points to a missing value`);
        }
        value = (value as Record<string, unknown>)[segment];
    }
    return value;
}
