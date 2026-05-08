/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gridBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gridBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { GridBlock } from "./gridBlock.pure";

RegisterClass("BABYLON.GridBlock", GridBlock);
