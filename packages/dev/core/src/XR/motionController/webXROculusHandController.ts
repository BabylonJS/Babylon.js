/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webXROculusHandController.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webXROculusHandController.pure";

import { registerWebXROculusHandController } from "./webXROculusHandController.pure";
registerWebXROculusHandController();
