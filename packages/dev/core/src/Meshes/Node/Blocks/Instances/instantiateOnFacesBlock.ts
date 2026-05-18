/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import instantiateOnFacesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./instantiateOnFacesBlock.pure";

import { RegisterInstantiateOnFacesBlock } from "./instantiateOnFacesBlock.pure";
RegisterInstantiateOnFacesBlock();
