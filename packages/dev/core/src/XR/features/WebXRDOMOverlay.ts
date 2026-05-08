/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import WebXRDOMOverlay.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./WebXRDOMOverlay.pure";

import { registerWebXRDOMOverlay } from "./WebXRDOMOverlay.pure";
registerWebXRDOMOverlay();
