/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import alignAngleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./alignAngleBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { AlignAngleBlock } from "./alignAngleBlock.pure";

RegisterClass("BABYLON.AlignAngleBlock", AlignAngleBlock);
