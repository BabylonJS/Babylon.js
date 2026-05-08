/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import smartFilterTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smartFilterTextureBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { SmartFilterTextureBlock } from "./smartFilterTextureBlock.pure";

RegisterClass("BABYLON.SmartFilterTextureBlock", SmartFilterTextureBlock);
