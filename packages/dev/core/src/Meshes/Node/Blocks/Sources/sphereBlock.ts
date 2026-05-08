/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphereBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereBlock.pure";

import { registerSphereBlock } from "./sphereBlock.pure";
registerSphereBlock();
