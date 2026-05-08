/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import icoSphereBuilder.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./icoSphereBuilder.pure";

import { RegisterIcoSphereBuilder } from "./icoSphereBuilder.pure";
RegisterIcoSphereBuilder();
