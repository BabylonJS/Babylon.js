/**
 * Internal helpers for reading and writing decorator metadata used by serialization.
 *
 * The serialization store is attached to each class constructor via `Symbol.metadata`. The polyfill
 * required for `Symbol.metadata` lives in `symbolMetadataPolyfill.ts` and is applied at package
 * entry points.
 */

// eslint-disable-next-line @typescript-eslint/naming-convention
const __bjsSerializableKey = "__bjs_serializable__";

// eslint-disable-next-line @typescript-eslint/naming-convention
const _mergedStoreCache = new WeakMap<object, any>();

// Universal `Object.hasOwn` equivalent. We intentionally avoid the native `Object.hasOwn` (ES2022)
// because TypeScript does not down-level runtime APIs and some Babylon Native engines (e.g. ChakraCore)
// do not provide it. `Object.prototype.hasOwnProperty` exists on every engine, and routing through it
// here also stays safe for the null-prototype metadata objects created below.
function HasOwn(target: object, key: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(target, key);
}

function GetMetadataSymbol(): symbol {
    let metadataSymbol = (Symbol as any).metadata as symbol | undefined;
    if (!metadataSymbol) {
        // Defensive idempotent fallback for runtimes (or import orders) where the entry-point polyfill
        // has not yet run. Matches symbolMetadataPolyfill.ts.
        metadataSymbol = Symbol("Symbol.metadata");
        Object.defineProperty(Symbol, "metadata", {
            configurable: true,
            writable: true,
            value: metadataSymbol,
        });
    }
    return metadataSymbol;
}

// Returns the constructor for the provided decorator/serialization target.
// Experimental decorators pass a prototype; serialization passes an instance or a constructor.
function GetConstructor(target: any): any {
    return typeof target === "function" ? target : target?.constructor;
}

// Returns (creating if necessary) the metadata object owned by the given constructor.
// The metadata's prototype mirrors the class hierarchy so merged lookups can walk it.
function GetOwnMetadata(ctor: any): any {
    if (!ctor) {
        return undefined;
    }
    if (!HasOwn(ctor, GetMetadataSymbol())) {
        const parent = Object.getPrototypeOf(ctor);
        const parentMetadata = parent ? parent[GetMetadataSymbol()] : null;
        Object.defineProperty(ctor, GetMetadataSymbol(), {
            value: Object.create(parentMetadata ?? null),
            configurable: true,
            writable: true,
            enumerable: false,
        });
    }
    return ctor[GetMetadataSymbol()];
}

/** @internal */
export function GetDirectStore(target: any): any {
    const metadata = GetOwnMetadata(GetConstructor(target));
    if (!metadata) {
        return {};
    }
    if (!HasOwn(metadata, __bjsSerializableKey)) {
        metadata[__bjsSerializableKey] = {};
    }
    return metadata[__bjsSerializableKey];
}

/**
 * @returns the list of properties flagged as serializable
 * @param target host object
 */
export function GetMergedStore(target: any): any {
    const ctor = GetConstructor(target);
    const metadata = ctor ? ctor[GetMetadataSymbol()] : undefined;
    if (!metadata) {
        return {};
    }

    const cached = _mergedStoreCache.get(metadata);
    if (cached) {
        return cached;
    }

    const store: any = {};
    // Walk the metadata prototype chain (most derived first); parents overwrite children to match the
    // original class-name-keyed merge order.
    const chain: any[] = [];
    let current: any = metadata;
    while (current) {
        chain.push(current);
        current = Object.getPrototypeOf(current);
    }
    for (const meta of chain) {
        if (HasOwn(meta, __bjsSerializableKey)) {
            const initialStore = meta[__bjsSerializableKey];
            for (const property in initialStore) {
                store[property] = initialStore[property];
            }
        }
    }

    _mergedStoreCache.set(metadata, store);
    return store;
}
