/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import systemBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./systemBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { SystemBlock } from "./systemBlock.pure";

RegisterClass("BABYLON.SystemBlock", SystemBlock);
