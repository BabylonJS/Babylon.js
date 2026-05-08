/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRMeshDetector.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRMeshDetector.pure";

import { registerWebXRMeshDetector } from "./WebXRMeshDetector.pure";
registerWebXRMeshDetector();
