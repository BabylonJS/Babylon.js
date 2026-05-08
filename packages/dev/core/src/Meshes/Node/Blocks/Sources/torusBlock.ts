/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import torusBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./torusBlock.pure";

import { RegisterTorusBlock } from "./torusBlock.pure";
RegisterTorusBlock();
