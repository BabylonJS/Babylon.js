// eslint-disable-next-line @typescript-eslint/naming-convention
let _MetadataPolyfillRegistered = false;

/**
 * Provides the TC39 decorator metadata key for runtimes that support Symbol but do not yet expose Symbol.metadata.
 * TypeScript's decorator emit reads Symbol.metadata before decorator callbacks run; if it is absent,
 * context.metadata is undefined and decorators such as @serialize cannot store class metadata.
 *
 * Safe to call multiple times; only the first call has an effect.
 * @internal
 */
export function RegisterSymbolMetadataPolyfill(): void {
    if (_MetadataPolyfillRegistered) {
        return;
    }
    _MetadataPolyfillRegistered = true;

    if (typeof Symbol !== "undefined" && !Symbol.metadata) {
        Object.defineProperty(Symbol, "metadata", {
            configurable: true,
            writable: true,
            value: Symbol("Symbol.metadata"),
        });
    }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __bjsSerializableKey = "__bjs_serializable__";

// eslint-disable-next-line @typescript-eslint/naming-convention
const _mergedStoreCache = /*#__PURE__*/ new WeakMap<object, Record<string, any>>();

/**
 * Returns the metadata object for the decorator context.
 * Used internally by decorator functions to store serialization info.
 * @internal
 */
export function GetDirectStoreFromMetadata(metadata: DecoratorMetadataObject): Record<string, any> {
    let ownStore = Object.prototype.hasOwnProperty.call(metadata, __bjsSerializableKey) ? (metadata[__bjsSerializableKey] as Record<string, any>) : undefined;
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
    return Object.prototype.hasOwnProperty.call(metadata, __bjsSerializableKey) ? (metadata[__bjsSerializableKey] as Record<string, any>) : {};
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
        if (Object.prototype.hasOwnProperty.call(currentMeta, __bjsSerializableKey)) {
            const classStore = currentMeta[__bjsSerializableKey] as Record<string, any>;
            for (const property in classStore) {
                if (Object.prototype.hasOwnProperty.call(classStore, property) && !(property in store)) {
                    store[property] = classStore[property];
                }
            }
        }
        currentMeta = Object.getPrototypeOf(currentMeta);
    }

    _mergedStoreCache.set(metadata, store);
    return store;
}
