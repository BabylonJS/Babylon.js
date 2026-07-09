/**
 * Ensures the global `Symbol.metadata` well-known symbol exists.
 *
 * The serialization decorator store keys its metadata off `Symbol.metadata`. On a runtime that
 * supports `Symbol` but does not yet expose `Symbol.metadata` natively, the symbol must be created
 * so decorated classes can attach their serialization metadata to their constructor.
 *
 * This module installs the symbol as a one-time, idempotent side effect. Import it for its side
 * effect at package entry points before any decorated class is evaluated.
 */
function ApplySymbolMetadataPolyfill(): void {
    if (typeof Symbol !== "undefined" && !(Symbol as any).metadata) {
        Object.defineProperty(Symbol, "metadata", {
            configurable: true,
            writable: true,
            value: Symbol("Symbol.metadata"),
        });
    }
}

ApplySymbolMetadataPolyfill();
