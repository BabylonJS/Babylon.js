/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import fragmentOutputBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragmentOutputBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { FragmentOutputBlock } from "./fragmentOutputBlock.pure";

RegisterClass("BABYLON.FragmentOutputBlock", FragmentOutputBlock);
