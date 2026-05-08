/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pbrMetallicRoughnessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMetallicRoughnessBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PBRMetallicRoughnessBlock } from "./pbrMetallicRoughnessBlock.pure";

RegisterClass("BABYLON.PBRMetallicRoughnessBlock", PBRMetallicRoughnessBlock);
