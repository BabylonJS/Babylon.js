/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cannonJSPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cannonJSPlugin.pure";

import { RegisterCannonJSPlugin } from "./cannonJSPlugin.pure";
RegisterCannonJSPlugin();
