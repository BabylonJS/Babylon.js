/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectiveShadowMap.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectiveShadowMap.pure";

import { RegisterReflectiveShadowMap } from "./reflectiveShadowMap.pure";
RegisterReflectiveShadowMap();
