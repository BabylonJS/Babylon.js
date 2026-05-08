/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import splatReaderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./splatReaderBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SplatReaderBlock } from "./splatReaderBlock.pure";

RegisterClass("BABYLON.SplatReaderBlock", SplatReaderBlock);
