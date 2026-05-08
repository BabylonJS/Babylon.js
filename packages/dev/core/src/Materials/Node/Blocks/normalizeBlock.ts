/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import normalizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { NormalizeBlock } from "./normalizeBlock.pure";

RegisterClass("BABYLON.NormalizeBlock", NormalizeBlock);
