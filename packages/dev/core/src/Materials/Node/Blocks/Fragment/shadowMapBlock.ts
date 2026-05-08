/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowMapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowMapBlock.pure";

import { registerShadowMapBlock } from "./shadowMapBlock.pure";
registerShadowMapBlock();
