import type { FlowGraphBlock } from "../flowGraphBlock";
import { FlowGraphBlockNames } from "./flowGraphBlockNames";

export function blockFactory(name: FlowGraphBlockNames): () => Promise<typeof FlowGraphBlock> {
    switch (name) {
        case FlowGraphBlockNames.PlayAnimation:
            return async () => (await import("./Execution/Animation/flowGraphPlayAnimationBlock")).FlowGraphPlayAnimationBlock;
        case FlowGraphBlockNames.StopAnimation:
            return async () => (await import("./Execution/Animation/flowGraphStopAnimationBlock")).FlowGraphStopAnimationBlock;
        case FlowGraphBlockNames.PauseAnimation:
            return async () => (await import("./Execution/Animation/flowGraphPauseAnimationBlock")).FlowGraphPauseAnimationBlock;
        case FlowGraphBlockNames.ValueInterpolation:
            return async () => (await import("./Execution/Animation/flowGraphInterpolationBlock")).FlowGraphInterpolationBlock;
        case FlowGraphBlockNames.SceneReadyEvent:
            return async () => (await import("./Event/flowGraphSceneReadyEventBlock")).FlowGraphSceneReadyEventBlock;
        case FlowGraphBlockNames.SceneTickEvent:
            return async () => (await import("./Event/flowGraphSceneTickEventBlock")).FlowGraphSceneTickEventBlock;
        case FlowGraphBlockNames.SendCustomEvent:
            return async () => (await import("./Event/flowGraphSendCustomEventBlock")).FlowGraphSendCustomEventBlock;
        case FlowGraphBlockNames.ReceiveCustomEvent:
            return async () => (await import("./Event/flowGraphReceiveCustomEventBlock")).FlowGraphReceiveCustomEventBlock;
        case FlowGraphBlockNames.MeshPickEvent:
            return async () => (await import("./Event/flowGraphMeshPickEventBlock")).FlowGraphMeshPickEventBlock;
        case FlowGraphBlockNames.E:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphEBlock;
        case FlowGraphBlockNames.PI:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphPiBlock;
        case FlowGraphBlockNames.Inf:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphInfBlock;
        case FlowGraphBlockNames.NaN:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphNaNBlock;
        case FlowGraphBlockNames.Random:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphRandomBlock;
        case FlowGraphBlockNames.Add:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAddBlock;
        case FlowGraphBlockNames.Subtract:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphSubtractBlock;
        case FlowGraphBlockNames.Multiply:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphMultiplyBlock;
        case FlowGraphBlockNames.Divide:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphDivideBlock;
        case FlowGraphBlockNames.Abs:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAbsBlock;
        case FlowGraphBlockNames.Sign:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphSignBlock;
        case FlowGraphBlockNames.Trunc:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphTruncBlock;
        case FlowGraphBlockNames.Floor:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphFloorBlock;
        case FlowGraphBlockNames.Ceil:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphCeilBlock;
        case FlowGraphBlockNames.Round:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphRoundBlock;
        case FlowGraphBlockNames.Fract:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphFractBlock;
        case FlowGraphBlockNames.Negation:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphNegationBlock;
        case FlowGraphBlockNames.Modulo:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphModuloBlock;
        case FlowGraphBlockNames.Min:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphMinBlock;
        case FlowGraphBlockNames.Max:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphMaxBlock;
        case FlowGraphBlockNames.Clamp:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphClampBlock;
        case FlowGraphBlockNames.Saturate:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphSaturateBlock;
        case FlowGraphBlockNames.MathInterpolation:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphMathInterpolationBlock;
        case FlowGraphBlockNames.Equality:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphEqualityBlock;
        case FlowGraphBlockNames.LessThan:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLessThanBlock;
        case FlowGraphBlockNames.LessThanOrEqual:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLessThanOrEqualBlock;
        case FlowGraphBlockNames.GreaterThan:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphGreaterThanBlock;
        case FlowGraphBlockNames.GreaterThanOrEqual:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphGreaterThanOrEqualBlock;
        case FlowGraphBlockNames.IsNaN:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphIsNanBlock;
        case FlowGraphBlockNames.IsInfinity:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphIsInfinityBlock;
        case FlowGraphBlockNames.DegToRad:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphDegToRadBlock;
        case FlowGraphBlockNames.RadToDeg:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphRadToDegBlock;
        case FlowGraphBlockNames.Sin:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphSinBlock;
        case FlowGraphBlockNames.Cos:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphCosBlock;
        case FlowGraphBlockNames.Tan:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphTanBlock;
        case FlowGraphBlockNames.Asin:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAsinBlock;
        case FlowGraphBlockNames.Acos:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAcosBlock;
        case FlowGraphBlockNames.Atan:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAtanBlock;
        case FlowGraphBlockNames.Atan2:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAtan2Block;
        case FlowGraphBlockNames.Sinh:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphSinhBlock;
        case FlowGraphBlockNames.Cosh:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphCoshBlock;
        case FlowGraphBlockNames.Tanh:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphTanhBlock;
        case FlowGraphBlockNames.Asinh:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAsinhBlock;
        case FlowGraphBlockNames.Acosh:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAcoshBlock;
        case FlowGraphBlockNames.Atanh:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphAtanhBlock;
        case FlowGraphBlockNames.Exponential:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphExpBlock;
        case FlowGraphBlockNames.Log:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLogBlock;
        case FlowGraphBlockNames.Log2:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLog2Block;
        case FlowGraphBlockNames.Log10:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLog10Block;
        case FlowGraphBlockNames.SquareRoot:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphSquareRootBlock;
        case FlowGraphBlockNames.Power:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphPowerBlock;
        case FlowGraphBlockNames.CubeRoot:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphCubeRootBlock;
        case FlowGraphBlockNames.BitwiseAnd:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphBitwiseAndBlock;
        case FlowGraphBlockNames.BitwiseOr:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphBitwiseOrBlock;
        case FlowGraphBlockNames.BitwiseNot:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphBitwiseNotBlock;
        case FlowGraphBlockNames.BitwiseXor:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphBitwiseXorBlock;
        case FlowGraphBlockNames.BitwiseLeftShift:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphBitwiseLeftShiftBlock;
        case FlowGraphBlockNames.BitwiseRightShift:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphBitwiseRightShiftBlock;
        case FlowGraphBlockNames.Length:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLengthBlock;
        case FlowGraphBlockNames.Normalize:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphNormalizeBlock;
        case FlowGraphBlockNames.Dot:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphDotBlock;
        case FlowGraphBlockNames.Cross:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphCrossBlock;
        case FlowGraphBlockNames.Rotate2d:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphRotate2DBlock;
        case FlowGraphBlockNames.Rotate3d:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphRotate3DBlock;
        case FlowGraphBlockNames.Transpose:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphTransposeBlock;
        case FlowGraphBlockNames.Determinant:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphDeterminantBlock;
        case FlowGraphBlockNames.InvertMatrix:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphInvertMatrixBlock;
        case FlowGraphBlockNames.MatrixMultiplication:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphMatrixMultiplicationBlock;
        case FlowGraphBlockNames.Branch:
            return async () => (await import("./Execution/ControlFlow/flowGraphBranchBlock")).FlowGraphBranchBlock;
        case FlowGraphBlockNames.SetDelay:
            return async () => (await import("./Execution/ControlFlow/flowGraphSetDelayBlock")).FlowGraphSetDelayBlock;
        case FlowGraphBlockNames.CancelDelay:
            return async () => (await import("./Execution/ControlFlow/flowGraphCancelDelayBlock")).FlowGraphCancelDelayBlock;
        case FlowGraphBlockNames.CallCounter:
            return async () => (await import("./Execution/ControlFlow/flowGraphCounterBlock")).FlowGraphCallCounterBlock;
        case FlowGraphBlockNames.Debounce:
            return async () => (await import("./Execution/ControlFlow/flowGraphDebounceBlock")).FlowGraphDebounceBlock;
        case FlowGraphBlockNames.Throttle:
            return async () => (await import("./Execution/ControlFlow/flowGraphThrottleBlock")).FlowGraphThrottleBlock;
        case FlowGraphBlockNames.DoN:
            return async () => (await import("./Execution/ControlFlow/flowGraphDoNBlock")).FlowGraphDoNBlock;
        case FlowGraphBlockNames.FlipFlop:
            return async () => (await import("./Execution/ControlFlow/flowGraphFlipFlopBlock")).FlowGraphFlipFlopBlock;
        case FlowGraphBlockNames.ForLoop:
            return async () => (await import("./Execution/ControlFlow/flowGraphForLoopBlock")).FlowGraphForLoopBlock;
        case FlowGraphBlockNames.MultiGate:
            return async () => (await import("./Execution/ControlFlow/flowGraphMultiGateBlock")).FlowGraphMultiGateBlock;
        case FlowGraphBlockNames.Sequence:
            return async () => (await import("./Execution/ControlFlow/flowGraphSequenceBlock")).FlowGraphSequenceBlock;
        case FlowGraphBlockNames.Switch:
            return async () => (await import("./Execution/ControlFlow/flowGraphSwitchBlock")).FlowGraphSwitchBlock;
        case FlowGraphBlockNames.Timer:
            return async () => (await import("./Execution/ControlFlow/flowGraphTimerBlock")).FlowGraphTimerBlock;
        case FlowGraphBlockNames.WaitAll:
            return async () => (await import("./Execution/ControlFlow/flowGraphWaitAllBlock")).FlowGraphWaitAllBlock;
        case FlowGraphBlockNames.WhileLoop:
            return async () => (await import("./Execution/ControlFlow/flowGraphWhileLoopBlock")).FlowGraphWhileLoopBlock;
        case FlowGraphBlockNames.ConsoleLog:
            return async () => (await import("./Execution/flowGraphConsoleLogBlock")).FlowGraphConsoleLogBlock;
        case FlowGraphBlockNames.Conditional:
            return async () => (await import("./Data/flowGraphConditionalDataBlock")).FlowGraphConditionalDataBlock;
        case FlowGraphBlockNames.Constant:
            return async () => (await import("./Data/flowGraphConstantBlock")).FlowGraphConstantBlock;
        case FlowGraphBlockNames.TransformCoordinates:
            return async () => (await import("./Data/flowGraphCoordinateTransformBlock")).FlowGraphTransformCoordinatesBlock;
        case FlowGraphBlockNames.GetAsset:
            return async () => (await import("./Data/flowGraphGetAssetBlock")).FlowGraphGetAssetBlock;
        case FlowGraphBlockNames.GetProperty:
            return async () => (await import("./Data/flowGraphGetPropertyBlock")).FlowGraphGetPropertyBlock;
        case FlowGraphBlockNames.SetProperty:
            return async () => (await import("./Data/flowGraphSetPropertyBlock")).FlowGraphSetPropertyBlock;
        case FlowGraphBlockNames.GetVariable:
            return async () => (await import("./Data/flowGraphGetVariableBlock")).FlowGraphGetVariableBlock;
        case FlowGraphBlockNames.SetVariable:
            return async () => (await import("./Data/flowGraphSetVariableBlock")).FlowGraphSetVariableBlock;
        case FlowGraphBlockNames.JsonPointerParser:
            return async () => (await import("./Data/Transformers/flowGraphJsonPointerParserBlock")).FlowGraphJsonPointerParserBlock;
        case FlowGraphBlockNames.LeadingZeros:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLeadingZerosBlock;
        case FlowGraphBlockNames.TrailingZeros:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphTrailingZerosBlock;
        case FlowGraphBlockNames.OneBitsCounter:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphOneBitsCounterBlock;
        default:
            throw new Error(`Unknown block name ${name}`);
    }
}
