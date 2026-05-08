/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import matrixSplitterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixSplitterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MatrixSplitterBlock } from "./matrixSplitterBlock.pure";

RegisterClass("BABYLON.MatrixSplitterBlock", MatrixSplitterBlock);
