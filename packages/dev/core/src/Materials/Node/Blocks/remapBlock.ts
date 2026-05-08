/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import remapBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./remapBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { RemapBlock } from "./remapBlock.pure";

RegisterClass("BABYLON.RemapBlock", RemapBlock);
