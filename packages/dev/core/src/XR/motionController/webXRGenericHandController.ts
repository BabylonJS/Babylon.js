/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRGenericHandController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRGenericHandController.pure";

import { registerWebXRGenericHandController } from "./webXRGenericHandController.pure";
registerWebXRGenericHandController();
