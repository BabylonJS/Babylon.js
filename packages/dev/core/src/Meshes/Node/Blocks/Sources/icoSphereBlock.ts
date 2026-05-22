/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import icoSphereBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./icoSphereBlock.pure";

import { RegisterIcoSphereBlock } from "./icoSphereBlock.pure";
RegisterIcoSphereBlock();
