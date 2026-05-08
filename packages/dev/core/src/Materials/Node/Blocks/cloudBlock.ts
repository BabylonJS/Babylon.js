/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import cloudBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cloudBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { CloudBlock } from "./cloudBlock.pure";

RegisterClass("BABYLON.CloudBlock", CloudBlock);
