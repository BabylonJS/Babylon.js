import type { FlowGraphBlock } from "../flowGraphBlock";
import { FlowGraphBlockNames } from "./flowGraphBlockNames";

/**
 * Any external module that wishes to add a new block to the flow graph can add to this object using the helper function.
 */
const CustomBlocks: Record<string, () => Promise<typeof FlowGraphBlock>> = {};

/**
 * If you want to add a new block to the block factory, you should use this function.
 * Please be sure to choose a unique name and define the responsible module.
 * @param module the name of the module that is responsible for the block
 * @param blockName the name of the block. This should be unique.
 * @param factory an async factory function to generate the block
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function addToBlockFactory(module: string, blockName: string, factory: () => Promise<typeof FlowGraphBlock>): void {
    CustomBlocks[`${module}/${blockName}`] = factory;
}

/**
 * a function to get a factory function for a block.
 * @param blockName the block name to initialize. If the block comes from an external module, the name should be in the format "module/blockName"
 * @returns an async factory function that will return the block class when called.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function blockFactory(blockName: FlowGraphBlockNames | string): () => Promise<typeof FlowGraphBlock> {
    switch (blockName) {
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
        case FlowGraphBlockNames.Fraction:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphFractionBlock;
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
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphLengthBlock;
        case FlowGraphBlockNames.Normalize:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphNormalizeBlock;
        case FlowGraphBlockNames.Dot:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphDotBlock;
        case FlowGraphBlockNames.Cross:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphCrossBlock;
        case FlowGraphBlockNames.Rotate2D:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphRotate2DBlock;
        case FlowGraphBlockNames.Rotate3D:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphRotate3DBlock;
        case FlowGraphBlockNames.Transpose:
            return async () => (await import("./Data/Math/flowGraphMatrixMathBlocks")).FlowGraphTransposeBlock;
        case FlowGraphBlockNames.Determinant:
            return async () => (await import("./Data/Math/flowGraphMatrixMathBlocks")).FlowGraphDeterminantBlock;
        case FlowGraphBlockNames.InvertMatrix:
            return async () => (await import("./Data/Math/flowGraphMatrixMathBlocks")).FlowGraphInvertMatrixBlock;
        case FlowGraphBlockNames.MatrixMultiplication:
            return async () => (await import("./Data/Math/flowGraphMatrixMathBlocks")).FlowGraphMatrixMultiplicationBlock;
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
        case FlowGraphBlockNames.TransformCoordinatesSystem:
            return async () => (await import("./Data/flowGraphTransformCoordinatesSystemBlock")).FlowGraphTransformCoordinatesSystemBlock;
        case FlowGraphBlockNames.GetAsset:
            return async () => (await import("./Data/flowGraphGetAssetBlock")).FlowGraphGetAssetBlock;
        case FlowGraphBlockNames.GetProperty:
            return async () => (await import("./Data/flowGraphGetPropertyBlock")).FlowGraphGetPropertyBlock;
        case FlowGraphBlockNames.SetProperty:
            return async () => (await import("./Execution/flowGraphSetPropertyBlock")).FlowGraphSetPropertyBlock;
        case FlowGraphBlockNames.GetVariable:
            return async () => (await import("./Data/flowGraphGetVariableBlock")).FlowGraphGetVariableBlock;
        case FlowGraphBlockNames.SetVariable:
            return async () => (await import("./Execution/flowGraphSetVariableBlock")).FlowGraphSetVariableBlock;
        case FlowGraphBlockNames.JsonPointerParser:
            return async () => (await import("./Data/Transformers/flowGraphJsonPointerParserBlock")).FlowGraphJsonPointerParserBlock;
        case FlowGraphBlockNames.LeadingZeros:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphLeadingZerosBlock;
        case FlowGraphBlockNames.TrailingZeros:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphTrailingZerosBlock;
        case FlowGraphBlockNames.OneBitsCounter:
            return async () => (await import("./Data/Math/flowGraphMathBlocks")).FlowGraphOneBitsCounterBlock;
        case FlowGraphBlockNames.CombineVector2:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphCombineVector2Block;
        case FlowGraphBlockNames.CombineVector3:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphCombineVector3Block;
        case FlowGraphBlockNames.CombineVector4:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphCombineVector4Block;
        case FlowGraphBlockNames.CombineMatrix:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphCombineMatrixBlock;
        case FlowGraphBlockNames.ExtractVector2:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphExtractVector2Block;
        case FlowGraphBlockNames.ExtractVector3:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphExtractVector3Block;
        case FlowGraphBlockNames.ExtractVector4:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphExtractVector4Block;
        case FlowGraphBlockNames.ExtractMatrix:
            return async () => (await import("./Data/Math/flowGraphMathCombineExtractBlocks")).FlowGraphExtractMatrixBlock;
        case FlowGraphBlockNames.TransformVector:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphTransformBlock;
        case FlowGraphBlockNames.TransformCoordinates:
            return async () => (await import("./Data/Math/flowGraphVectorMathBlocks")).FlowGraphTransformCoordinatesBlock;
        case FlowGraphBlockNames.MatrixDecompose:
            return async () => (await import("./Data/Math/flowGraphMatrixMathBlocks")).FlowGraphMatrixDecomposeBlock;
        case FlowGraphBlockNames.MatrixCompose:
            return async () => (await import("./Data/Math/flowGraphMatrixMathBlocks")).FlowGraphMatrixComposeBlock;
        case FlowGraphBlockNames.BooleanToFloat:
            return async () => (await import("./Data/Transformers/flowGraphTypeToTypeBlocks")).FlowGraphBooleanToFloat;
        case FlowGraphBlockNames.BooleanToInt:
            return async () => (await import("./Data/Transformers/flowGraphTypeToTypeBlocks")).FlowGraphBooleanToInt;
        case FlowGraphBlockNames.FloatToBoolean:
            return async () => (await import("./Data/Transformers/flowGraphTypeToTypeBlocks")).FlowGraphFloatToBoolean;
        case FlowGraphBlockNames.IntToBoolean:
            return async () => (await import("./Data/Transformers/flowGraphTypeToTypeBlocks")).FlowGraphIntToBoolean;
        case FlowGraphBlockNames.IntToFloat:
            return async () => (await import("./Data/Transformers/flowGraphTypeToTypeBlocks")).FlowGraphIntToFloat;
        case FlowGraphBlockNames.FloatToInt:
            return async () => (await import("./Data/Transformers/flowGraphTypeToTypeBlocks")).FlowGraphFloatToInt;
        case FlowGraphBlockNames.Easing:
            return async () => (await import("./Execution/Animation/flowGraphEasingBlock")).FlowGraphEasingBlock;
        case FlowGraphBlockNames.BezierCurveEasing:
            return async () => (await import("./Execution/Animation/flowGraphBezierCurveEasingBlock")).FlowGraphBezierCurveEasingBlock;
        case FlowGraphBlockNames.PointerOverEvent:
            return async () => (await import("./Event/flowGraphPointerOverEventBlock")).FlowGraphPointerOverEventBlock;
        case FlowGraphBlockNames.PointerOutEvent:
            return async () => (await import("./Event/flowGraphPointerOutEventBlock")).FlowGraphPointerOutEventBlock;
        case FlowGraphBlockNames.Context:
            return async () => (await import("./Data/Utils/flowGraphContextBlock")).FlowGraphContextBlock;
        case FlowGraphBlockNames.ArrayIndex:
            return async () => (await import("./Data/Utils/flowGraphArrayIndexBlock")).FlowGraphArrayIndexBlock;
        case FlowGraphBlockNames.CodeExecution:
            return async () => (await import("./Data/Utils/flowGraphCodeExecutionBlock")).FlowGraphCodeExecutionBlock;
        case FlowGraphBlockNames.IndexOf:
            return async () => (await import("./Data/Utils/flowGraphIndexOfBlock")).FlowGraphIndexOfBlock;
        case FlowGraphBlockNames.FunctionReference:
            return async () => (await import("./Data/Utils/flowGraphFunctionReferenceBlock")).FlowGraphFunctionReferenceBlock;
        case FlowGraphBlockNames.DataSwitch:
            return async () => (await import("./Data/flowGraphDataSwitchBlock")).FlowGraphDataSwitchBlock;
        default:
            // check if the block is a custom block
            if (CustomBlocks[blockName]) {
                return CustomBlocks[blockName];
            }
            throw new Error(`Unknown block name ${blockName}`);
    }
}
