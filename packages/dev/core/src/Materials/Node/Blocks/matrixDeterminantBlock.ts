/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import matrixDeterminantBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixDeterminantBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MatrixDeterminantBlock } from "./matrixDeterminantBlock.pure";

RegisterClass("BABYLON.MatrixDeterminantBlock", MatrixDeterminantBlock);
