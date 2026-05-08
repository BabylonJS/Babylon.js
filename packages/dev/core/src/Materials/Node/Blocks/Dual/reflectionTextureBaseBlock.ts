/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import reflectionTextureBaseBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionTextureBaseBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ReflectionTextureBaseBlock } from "./reflectionTextureBaseBlock.pure";

RegisterClass("BABYLON.ReflectionTextureBaseBlock", ReflectionTextureBaseBlock);
