/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXRGenericHandController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXRGenericHandController.pure";

import { RegisterWebXRGenericHandController } from "./webXRGenericHandController.pure";
RegisterWebXRGenericHandController();
