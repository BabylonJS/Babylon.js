/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphMatrixMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMatrixMathBlocks.pure";

import { RegisterClass } from "core/Misc/typeStore";
import {
    FlowGraphTransposeBlock,
    FlowGraphDeterminantBlock,
    FlowGraphInvertMatrixBlock,
    FlowGraphMatrixMultiplicationBlock,
    FlowGraphMatrixDecomposeBlock,
    FlowGraphMatrixComposeBlock,
} from "./flowGraphMatrixMathBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Transpose, FlowGraphTransposeBlock);
RegisterClass(FlowGraphBlockNames.Determinant, FlowGraphDeterminantBlock);
RegisterClass(FlowGraphBlockNames.InvertMatrix, FlowGraphInvertMatrixBlock);
RegisterClass(FlowGraphBlockNames.MatrixMultiplication, FlowGraphMatrixMultiplicationBlock);
RegisterClass(FlowGraphBlockNames.MatrixDecompose, FlowGraphMatrixDecomposeBlock);
RegisterClass(FlowGraphBlockNames.MatrixCompose, FlowGraphMatrixComposeBlock);
