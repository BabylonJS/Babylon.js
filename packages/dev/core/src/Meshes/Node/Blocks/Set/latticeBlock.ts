/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import latticeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./latticeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { LatticeBlock } from "./latticeBlock.pure";

RegisterClass("BABYLON.LatticeBlock", LatticeBlock);
