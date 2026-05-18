/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRSpaceWarp.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRSpaceWarp.pure";

import "../../Shaders/velocity.fragment";
import "../../Shaders/velocity.vertex";

import { RegisterWebXRSpaceWarp } from "./WebXRSpaceWarp.pure";
RegisterWebXRSpaceWarp();
