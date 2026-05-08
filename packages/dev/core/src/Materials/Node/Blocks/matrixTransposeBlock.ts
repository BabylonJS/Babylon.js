/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import matrixTransposeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixTransposeBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MatrixTransposeBlock } from "./matrixTransposeBlock.pure";

RegisterClass("BABYLON.MatrixTransposeBlock", MatrixTransposeBlock);
