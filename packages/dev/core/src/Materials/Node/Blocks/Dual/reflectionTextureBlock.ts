/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import reflectionTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionTextureBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ReflectionTextureBlock } from "./reflectionTextureBlock.pure";

RegisterClass("BABYLON.ReflectionTextureBlock", ReflectionTextureBlock);
