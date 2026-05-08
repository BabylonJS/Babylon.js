/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import sphereShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./sphereShapeBlock.pure";

import { RegisterSphereShapeBlock } from "./sphereShapeBlock.pure";
RegisterSphereShapeBlock();
