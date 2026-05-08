/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import nullBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nullBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NullBlock } from "./nullBlock.pure";

RegisterClass("BABYLON.NullBlock", NullBlock);
