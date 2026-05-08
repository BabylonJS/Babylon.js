/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import reflectBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ReflectBlock } from "./reflectBlock.pure";

RegisterClass("BABYLON.ReflectBlock", ReflectBlock);
