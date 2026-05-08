/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import flowGraphMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphMathBlocks.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import {
    FlowGraphAddBlock,
    FlowGraphSubtractBlock,
    FlowGraphMultiplyBlock,
    FlowGraphDivideBlock,
    FlowGraphRandomBlock,
    FlowGraphEBlock,
    FlowGraphPiBlock,
    FlowGraphInfBlock,
    FlowGraphNaNBlock,
    FlowGraphAbsBlock,
    FlowGraphSignBlock,
    FlowGraphTruncBlock,
    FlowGraphFloorBlock,
    FlowGraphCeilBlock,
    FlowGraphRoundBlock,
    FlowGraphFractionBlock,
    FlowGraphNegationBlock,
    FlowGraphModuloBlock,
    FlowGraphMinBlock,
    FlowGraphMaxBlock,
    FlowGraphClampBlock,
    FlowGraphSaturateBlock,
    FlowGraphMathInterpolationBlock,
    FlowGraphEqualityBlock,
    FlowGraphLessThanBlock,
    FlowGraphLessThanOrEqualBlock,
    FlowGraphGreaterThanBlock,
    FlowGraphGreaterThanOrEqualBlock,
    FlowGraphIsNanBlock,
    FlowGraphIsInfinityBlock,
    FlowGraphDegToRadBlock,
    FlowGraphRadToDegBlock,
    FlowGraphAsinBlock,
    FlowGraphAcosBlock,
    FlowGraphAtanBlock,
    FlowGraphAtan2Block,
    FlowGraphSinhBlock,
    FlowGraphCoshBlock,
    FlowGraphTanhBlock,
    FlowGraphAsinhBlock,
    FlowGraphAcoshBlock,
    FlowGraphAtanhBlock,
    FlowGraphExpBlock,
    FlowGraphLogBlock,
    FlowGraphLog2Block,
    FlowGraphLog10Block,
    FlowGraphSquareRootBlock,
    FlowGraphCubeRootBlock,
    FlowGraphPowerBlock,
    FlowGraphBitwiseNotBlock,
    FlowGraphBitwiseAndBlock,
    FlowGraphBitwiseOrBlock,
    FlowGraphBitwiseXorBlock,
    FlowGraphBitwiseLeftShiftBlock,
    FlowGraphBitwiseRightShiftBlock,
    FlowGraphLeadingZerosBlock,
    FlowGraphTrailingZerosBlock,
    FlowGraphOneBitsCounterBlock,
} from "./flowGraphMathBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";

RegisterClass(FlowGraphBlockNames.Add, FlowGraphAddBlock);
RegisterClass(FlowGraphBlockNames.Subtract, FlowGraphSubtractBlock);
RegisterClass(FlowGraphBlockNames.Multiply, FlowGraphMultiplyBlock);
RegisterClass(FlowGraphBlockNames.Divide, FlowGraphDivideBlock);
RegisterClass(FlowGraphBlockNames.Random, FlowGraphRandomBlock);
RegisterClass(FlowGraphBlockNames.E, FlowGraphEBlock);
RegisterClass(FlowGraphBlockNames.PI, FlowGraphPiBlock);
RegisterClass(FlowGraphBlockNames.Inf, FlowGraphInfBlock);
RegisterClass(FlowGraphBlockNames.NaN, FlowGraphNaNBlock);
RegisterClass(FlowGraphBlockNames.Abs, FlowGraphAbsBlock);
RegisterClass(FlowGraphBlockNames.Sign, FlowGraphSignBlock);
RegisterClass(FlowGraphBlockNames.Trunc, FlowGraphTruncBlock);
RegisterClass(FlowGraphBlockNames.Floor, FlowGraphFloorBlock);
RegisterClass(FlowGraphBlockNames.Ceil, FlowGraphCeilBlock);
RegisterClass(FlowGraphBlockNames.Round, FlowGraphRoundBlock);
RegisterClass(FlowGraphBlockNames.Fraction, FlowGraphFractionBlock);
RegisterClass(FlowGraphBlockNames.Negation, FlowGraphNegationBlock);
RegisterClass(FlowGraphBlockNames.Modulo, FlowGraphModuloBlock);
RegisterClass(FlowGraphBlockNames.Min, FlowGraphMinBlock);
RegisterClass(FlowGraphBlockNames.Max, FlowGraphMaxBlock);
RegisterClass(FlowGraphBlockNames.Clamp, FlowGraphClampBlock);
RegisterClass(FlowGraphBlockNames.Saturate, FlowGraphSaturateBlock);
RegisterClass(FlowGraphBlockNames.MathInterpolation, FlowGraphMathInterpolationBlock);
RegisterClass(FlowGraphBlockNames.Equality, FlowGraphEqualityBlock);
RegisterClass(FlowGraphBlockNames.LessThan, FlowGraphLessThanBlock);
RegisterClass(FlowGraphBlockNames.LessThanOrEqual, FlowGraphLessThanOrEqualBlock);
RegisterClass(FlowGraphBlockNames.GreaterThan, FlowGraphGreaterThanBlock);
RegisterClass(FlowGraphBlockNames.GreaterThanOrEqual, FlowGraphGreaterThanOrEqualBlock);
RegisterClass(FlowGraphBlockNames.IsNaN, FlowGraphIsNanBlock);
RegisterClass(FlowGraphBlockNames.IsInfinity, FlowGraphIsInfinityBlock);
RegisterClass(FlowGraphBlockNames.DegToRad, FlowGraphDegToRadBlock);
RegisterClass(FlowGraphBlockNames.RadToDeg, FlowGraphRadToDegBlock);
RegisterClass(FlowGraphBlockNames.Asin, FlowGraphAsinBlock);
RegisterClass(FlowGraphBlockNames.Acos, FlowGraphAcosBlock);
RegisterClass(FlowGraphBlockNames.Atan, FlowGraphAtanBlock);
RegisterClass(FlowGraphBlockNames.Atan2, FlowGraphAtan2Block);
RegisterClass(FlowGraphBlockNames.Sinh, FlowGraphSinhBlock);
RegisterClass(FlowGraphBlockNames.Cosh, FlowGraphCoshBlock);
RegisterClass(FlowGraphBlockNames.Tanh, FlowGraphTanhBlock);
RegisterClass(FlowGraphBlockNames.Asinh, FlowGraphAsinhBlock);
RegisterClass(FlowGraphBlockNames.Acosh, FlowGraphAcoshBlock);
RegisterClass(FlowGraphBlockNames.Atanh, FlowGraphAtanhBlock);
RegisterClass(FlowGraphBlockNames.Exponential, FlowGraphExpBlock);
RegisterClass(FlowGraphBlockNames.Log, FlowGraphLogBlock);
RegisterClass(FlowGraphBlockNames.Log2, FlowGraphLog2Block);
RegisterClass(FlowGraphBlockNames.Log10, FlowGraphLog10Block);
RegisterClass(FlowGraphBlockNames.SquareRoot, FlowGraphSquareRootBlock);
RegisterClass(FlowGraphBlockNames.CubeRoot, FlowGraphCubeRootBlock);
RegisterClass(FlowGraphBlockNames.Power, FlowGraphPowerBlock);
RegisterClass(FlowGraphBlockNames.BitwiseNot, FlowGraphBitwiseNotBlock);
RegisterClass(FlowGraphBlockNames.BitwiseAnd, FlowGraphBitwiseAndBlock);
RegisterClass(FlowGraphBlockNames.BitwiseOr, FlowGraphBitwiseOrBlock);
RegisterClass(FlowGraphBlockNames.BitwiseXor, FlowGraphBitwiseXorBlock);
RegisterClass(FlowGraphBlockNames.BitwiseLeftShift, FlowGraphBitwiseLeftShiftBlock);
RegisterClass(FlowGraphBlockNames.BitwiseRightShift, FlowGraphBitwiseRightShiftBlock);
RegisterClass(FlowGraphBlockNames.LeadingZeros, FlowGraphLeadingZerosBlock);
RegisterClass(FlowGraphBlockNames.TrailingZeros, FlowGraphTrailingZerosBlock);
RegisterClass(FlowGraphBlockNames.OneBitsCounter, FlowGraphOneBitsCounterBlock);
