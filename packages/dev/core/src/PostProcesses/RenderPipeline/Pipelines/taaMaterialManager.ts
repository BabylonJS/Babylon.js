/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import taaMaterialManager.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./taaMaterialManager.pure";

import { registerTaaMaterialManager } from "./taaMaterialManager.pure";
registerTaaMaterialManager();
