/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import matrixComposeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixComposeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MatrixComposeBlock } from "./matrixComposeBlock.pure";

RegisterClass("BABYLON.MatrixComposeBlock", MatrixComposeBlock);
