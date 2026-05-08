/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import matrixBuilderBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./matrixBuilderBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { MatrixBuilderBlock } from "./matrixBuilderBlock.pure";

RegisterClass("BABYLON.MatrixBuilder", MatrixBuilderBlock);
