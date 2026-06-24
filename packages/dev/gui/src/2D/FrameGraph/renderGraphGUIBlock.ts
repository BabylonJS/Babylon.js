/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./renderGraphGUIBlock.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./renderGraphGUIBlock.pure";

import { RegisterNodeRenderGraphGUIBlock } from "./renderGraphGUIBlock.pure";
RegisterNodeRenderGraphGUIBlock();
