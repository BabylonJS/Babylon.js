/**
 * Re-exports the pure decorator metadata helpers and applies the runtime Symbol.metadata polyfill.
 * Import decorators.functions.pure for tree-shakeable, side-effect-free usage of the helpers.
 */
export * from "./decorators.functions.pure";

import { RegisterSymbolMetadataPolyfill } from "./decorators.functions.pure";
RegisterSymbolMetadataPolyfill();
