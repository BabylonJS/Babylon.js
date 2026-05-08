/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clusteredLightContainer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clusteredLightContainer.pure";

import { registerClusteredLightContainer } from "./clusteredLightContainer.pure";
registerClusteredLightContainer();
