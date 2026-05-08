/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import reflectionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ReflectionBlock } from "./reflectionBlock.pure";

RegisterClass("BABYLON.ReflectionBlock", ReflectionBlock);
