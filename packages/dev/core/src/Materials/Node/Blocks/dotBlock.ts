/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import dotBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./dotBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { DotBlock } from "./dotBlock.pure";

RegisterClass("BABYLON.DotBlock", DotBlock);
