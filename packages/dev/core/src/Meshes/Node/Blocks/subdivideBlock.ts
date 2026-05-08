/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import subdivideBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./subdivideBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { SubdivideBlock } from "./subdivideBlock.pure";

RegisterClass("BABYLON.SubdivideBlock", SubdivideBlock);
