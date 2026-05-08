/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBlock.pure";

import { registerTorusBlock } from "./torusBlock.pure";
registerTorusBlock();
