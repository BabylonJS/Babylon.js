/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clipPlanesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clipPlanesBlock.pure";

import { RegisterClipPlanesBlock } from "./clipPlanesBlock.pure";
RegisterClipPlanesBlock();
