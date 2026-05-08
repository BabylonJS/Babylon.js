/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import iridescenceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./iridescenceBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { IridescenceBlock } from "./iridescenceBlock.pure";

RegisterClass("BABYLON.IridescenceBlock", IridescenceBlock);
