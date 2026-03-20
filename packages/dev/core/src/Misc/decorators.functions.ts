/** @internal */
export const __bjsSerializableKey = "__bjs_serializable__";

const _mergedStoreCache = new WeakMap<object, Record<string, any>>();

/**
 * Returns the metadata object for the decorator context.
 * Used internally by decorator functions to store serialization info.
 * @internal
 */
export function GetDirectStoreFromMetadata(metadata: DecoratorMetadataObject): Record<string, any> {
    let ownStore = Object.hasOwn(metadata, __bjsSerializableKey) ? (metadata[__bjsSerializableKey] as Record<string, any>) : undefined;
    if (!ownStore) {
        ownStore = {};
        metadata[__bjsSerializableKey] = ownStore;
    }
    return ownStore;
}

/** @internal */
export function GetDirectStore(target: any): any {
    const ctor = typeof target === "function" ? target : target?.constructor;
    const metadata: DecoratorMetadataObject | undefined = ctor?.[Symbol.metadata];
    if (!metadata) {
        return {};
    }
    return Object.hasOwn(metadata, __bjsSerializableKey) ? (metadata[__bjsSerializableKey] as Record<string, any>) : {};
}

/**
 * @returns the list of properties flagged as serializable
 * @param target host object
 */
export function GetMergedStore(target: any): any {
    const ctor = typeof target === "function" ? target : target?.constructor;
    const metadata: DecoratorMetadataObject | undefined = ctor?.[Symbol.metadata];
    if (!metadata) {
        return {};
    }

    // Check cache
    const cached = _mergedStoreCache.get(metadata);
    if (cached) {
        return cached;
    }

    // Walk the metadata prototype chain and merge all serializable stores
    const store: Record<string, any> = {};
    let currentMeta: any = metadata;
    while (currentMeta) {
        if (Object.hasOwn(currentMeta, __bjsSerializableKey)) {
            const classStore = currentMeta[__bjsSerializableKey] as Record<string, any>;
            for (const property in classStore) {
                if (Object.hasOwn(classStore, property) && !(property in store)) {
                    store[property] = classStore[property];
                }
            }
        }
        currentMeta = Object.getPrototypeOf(currentMeta);
    }

    _mergedStoreCache.set(metadata, store);
    return store;
}
