/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import addBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./addBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { AddBlock } from "./addBlock.pure";

RegisterClass("BABYLON.AddBlock", AddBlock);
