/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instancesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instancesBlock.pure";

import { RegisterInstancesBlock } from "./instancesBlock.pure";
RegisterInstancesBlock();
