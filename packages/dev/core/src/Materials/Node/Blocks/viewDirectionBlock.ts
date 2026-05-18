/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import viewDirectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./viewDirectionBlock.pure";

import { RegisterViewDirectionBlock } from "./viewDirectionBlock.pure";
RegisterViewDirectionBlock();
