/**
 * Ensures the global `Symbol.metadata` well-known symbol exists.
 *
 * TC39 decorator metadata relies on `Symbol.metadata`. TypeScript's decorator emit reads it before
 * decorator callbacks run, so on a runtime that supports `Symbol` but does not yet expose
 * `Symbol.metadata` natively, decorated classes would receive `undefined` metadata and serialization
 * decorators (such as `@serialize`) could not store their metadata.
 *
 * This module installs the symbol as a one-time, idempotent side effect. Import it for its side
 * effect at package entry points before any decorated class is evaluated.
 */
function ApplySymbolMetadataPolyfill(): void {
    if (typeof Symbol !== "undefined" && !Symbol.metadata) {
        Object.defineProperty(Symbol, "metadata", {
            configurable: true,
            writable: true,
            value: Symbol("Symbol.metadata"),
        });
    }
}

ApplySymbolMetadataPolyfill();
