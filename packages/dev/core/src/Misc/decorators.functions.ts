/**
 * Internal helpers for reading and writing decorator metadata used by serialization.
 *
 * The serialization store is attached to each class constructor via `Symbol.metadata`. The polyfill
 * required for `Symbol.metadata` lives in `symbolMetadataPolyfill.ts` and is applied at package
 * entry points.
 */
import { type SerializedPropertyMetadataMap } from "./decorators.serializationUtilities";

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

/**
 * The well-known `Symbol.metadata` symbol, resolved once at module-evaluation time.
 *
 * Reading (and thereby resolving) this symbol at module load guarantees that `Symbol.metadata`
 * exists BEFORE any decorated class which imports the decorator infrastructure evaluates its class
 * body. TypeScript's TC39 decorator emit captures `context.metadata` from `Symbol.metadata` at the
 * top of the class `static {}` block (before the decorator factory runs), so if the symbol is not
 * yet installed the metadata object is `void 0` and every metadata-based decorator throws.
 *
 * It is intentionally an exported `const` initialized from a function call: bundlers that treat this
 * module as side-effect-free may drop bare top-level calls, but they cannot drop a `const` whose
 * value is referenced by the retained decorator helpers below. The tree-shaking side-effect detector
 * likewise skips `const X = ...` initializers, so this module stays classified as pure and remains
 * importable from `.pure` modules.
 * @internal
 */
export const MetadataSymbol: symbol = GetMetadataSymbol();

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
    if (!HasOwn(ctor, MetadataSymbol)) {
        const parent = Object.getPrototypeOf(ctor);
        const parentMetadata = parent ? parent[MetadataSymbol] : null;
        Object.defineProperty(ctor, MetadataSymbol, {
            value: Object.create(parentMetadata ?? null),
            configurable: true,
            writable: true,
            enumerable: false,
        });
    }
    return ctor[MetadataSymbol];
}

/**
 * Returns (creating if necessary) the serialization store owned by the provided decorator metadata.
 * Used by the TC39 decorators, which receive `context.metadata` directly.
 * @internal
 */
export function GetDirectStoreFromMetadata(metadata: DecoratorMetadataObject): SerializedPropertyMetadataMap {
    if (!metadata) {
        // `metadata` is `context.metadata`, which is `void 0` when `Symbol.metadata` was not installed
        // before the class was evaluated. Referencing `MetadataSymbol` here (a) produces an actionable
        // error instead of a cryptic "Cannot convert undefined to object" and (b) keeps the module-load
        // polyfill anchored so bundlers cannot tree-shake it away on the decorate-time serialize path.
        throw new Error(`Decorator metadata is unavailable; the Symbol.metadata (${String(MetadataSymbol)}) polyfill must run before decorated classes are evaluated.`);
    }
    if (!HasOwn(metadata, __bjsSerializableKey)) {
        (metadata as any)[__bjsSerializableKey] = {};
    }
    return (metadata as any)[__bjsSerializableKey];
}

/** @internal */
export function GetDirectStore(target: any): SerializedPropertyMetadataMap {
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
export function GetMergedStore(target: any): SerializedPropertyMetadataMap {
    const ctor = GetConstructor(target);
    const metadata = ctor ? ctor[MetadataSymbol] : undefined;
    if (!metadata) {
        return {};
    }

    const cached = _mergedStoreCache.get(metadata);
    if (cached) {
        return cached;
    }

    const store: SerializedPropertyMetadataMap = {};
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
            const initialStore = meta[__bjsSerializableKey] as SerializedPropertyMetadataMap;
            for (const property in initialStore) {
                store[property] = initialStore[property];
            }
        }
    }

    _mergedStoreCache.set(metadata, store);
    return store;
}
