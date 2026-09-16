import { FlowGraphBlock } from "../flowGraphBlock";
import { FlowGraphBlockNames } from "./flowGraphBlockNames";

/**
 * Any external module that wishes to add a new block to the flow graph can add to this object using the helper function.
 */
const CustomBlocks: Record<string, () => Promise<typeof FlowGraphBlock>> = {};
/**
 * Reverse lookup: short block name → full "module/blockName" key, for O(1) fallback.
 */
const ShortNameToFullKey: Record<string, string> = {};

/**
 * If you want to add a new block to the block factory, you should use this function.
 * Please be sure to choose a unique name and define the responsible module.
 * @param module the name of the module that is responsible for the block
 * @param blockName the name of the block. This should be unique.
 * @param factory an async factory function to generate the block
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function addToBlockFactory(module: string, blockName: string, factory: () => Promise<typeof FlowGraphBlock>): void {
    const fullKey = `${module}/${blockName}`;
    CustomBlocks[fullKey] = factory;
    ShortNameToFullKey[blockName] = fullKey;
}

function _IsFlowGraphBlockConstructor(value: unknown): value is typeof FlowGraphBlock {
    return typeof value === "function" && value.prototype instanceof FlowGraphBlock;
}

async function _LoadBlock(modulePromise: Promise<object>, blockName: string): Promise<typeof FlowGraphBlock> {
    const module = await modulePromise;
    let block: typeof FlowGraphBlock | undefined;
    let register: (() => void) | undefined;

    for (const [exportName, value] of Object.entries(module)) {
        if (exportName === blockName && _IsFlowGraphBlockConstructor(value)) {
            block = value;
        } else if (exportName.startsWith("RegisterFlowGraph") && typeof value === "function") {
            register = value;
        }
    }

    if (!block || !register) {
        throw new Error(`Invalid FlowGraph block module for ${blockName}`);
    }

    register();
    if (blockName === "FlowGraphPlayAnimationBlock") {
        const { RegisterAnimationGroup } = await import("../../Animations/animationGroup.pure");
        RegisterAnimationGroup();
    }

    return block;
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
            return async () => await _LoadBlock(import("./Execution/Animation/flowGraphPlayAnimationBlock.pure"), "FlowGraphPlayAnimationBlock");
        case FlowGraphBlockNames.StopAnimation:
            return async () => await _LoadBlock(import("./Execution/Animation/flowGraphStopAnimationBlock.pure"), "FlowGraphStopAnimationBlock");
        case FlowGraphBlockNames.PauseAnimation:
            return async () => await _LoadBlock(import("./Execution/Animation/flowGraphPauseAnimationBlock.pure"), "FlowGraphPauseAnimationBlock");
        case FlowGraphBlockNames.ValueInterpolation:
            return async () => await _LoadBlock(import("./Execution/Animation/flowGraphInterpolationBlock.pure"), "FlowGraphInterpolationBlock");
        case FlowGraphBlockNames.SceneReadyEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphSceneReadyEventBlock.pure"), "FlowGraphSceneReadyEventBlock");
        case FlowGraphBlockNames.SceneTickEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphSceneTickEventBlock.pure"), "FlowGraphSceneTickEventBlock");
        case FlowGraphBlockNames.SendCustomEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphSendCustomEventBlock.pure"), "FlowGraphSendCustomEventBlock");
        case FlowGraphBlockNames.ReceiveCustomEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphReceiveCustomEventBlock.pure"), "FlowGraphReceiveCustomEventBlock");
        case FlowGraphBlockNames.StopEventPropagation:
            return async () => await _LoadBlock(import("./Event/flowGraphStopEventPropagationBlock.pure"), "FlowGraphStopEventPropagationBlock");
        case FlowGraphBlockNames.MeshPickEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphMeshPickEventBlock.pure"), "FlowGraphMeshPickEventBlock");
        case FlowGraphBlockNames.E:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphEBlock");
        case FlowGraphBlockNames.PI:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphPiBlock");
        case FlowGraphBlockNames.Tau:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphTauBlock");
        case FlowGraphBlockNames.Inf:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphInfBlock");
        case FlowGraphBlockNames.NaN:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphNaNBlock");
        case FlowGraphBlockNames.Random:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphRandomBlock");
        case FlowGraphBlockNames.Add:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAddBlock");
        case FlowGraphBlockNames.Subtract:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphSubtractBlock");
        case FlowGraphBlockNames.Multiply:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphMultiplyBlock");
        case FlowGraphBlockNames.Divide:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphDivideBlock");
        case FlowGraphBlockNames.Abs:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAbsBlock");
        case FlowGraphBlockNames.Sign:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphSignBlock");
        case FlowGraphBlockNames.Trunc:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphTruncBlock");
        case FlowGraphBlockNames.Floor:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphFloorBlock");
        case FlowGraphBlockNames.Ceil:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphCeilBlock");
        case FlowGraphBlockNames.Round:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphRoundBlock");
        case FlowGraphBlockNames.Fraction:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphFractionBlock");
        case FlowGraphBlockNames.Negation:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphNegationBlock");
        case FlowGraphBlockNames.Modulo:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphModuloBlock");
        case FlowGraphBlockNames.Min:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphMinBlock");
        case FlowGraphBlockNames.Max:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphMaxBlock");
        case FlowGraphBlockNames.Clamp:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphClampBlock");
        case FlowGraphBlockNames.Saturate:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphSaturateBlock");
        case FlowGraphBlockNames.MathInterpolation:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphMathInterpolationBlock");
        case FlowGraphBlockNames.MathSlerp:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphMathSlerpBlock");
        case FlowGraphBlockNames.SmoothStep:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphMathSmoothStepBlock");
        case FlowGraphBlockNames.RGBToOkLCh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphRGBToOkLChBlock");
        case FlowGraphBlockNames.RGBFromOkLCh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphRGBFromOkLChBlock");
        case FlowGraphBlockNames.Equality:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphEqualityBlock");
        case FlowGraphBlockNames.LessThan:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphLessThanBlock");
        case FlowGraphBlockNames.LessThanOrEqual:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphLessThanOrEqualBlock");
        case FlowGraphBlockNames.GreaterThan:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphGreaterThanBlock");
        case FlowGraphBlockNames.GreaterThanOrEqual:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphGreaterThanOrEqualBlock");
        case FlowGraphBlockNames.IsNaN:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphIsNanBlock");
        case FlowGraphBlockNames.IsInfinity:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphIsInfinityBlock");
        case FlowGraphBlockNames.DegToRad:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphDegToRadBlock");
        case FlowGraphBlockNames.RadToDeg:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphRadToDegBlock");
        case FlowGraphBlockNames.Sin:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphSinBlock");
        case FlowGraphBlockNames.Cos:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphCosBlock");
        case FlowGraphBlockNames.Tan:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphTanBlock");
        case FlowGraphBlockNames.Asin:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAsinBlock");
        case FlowGraphBlockNames.Acos:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAcosBlock");
        case FlowGraphBlockNames.Atan:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAtanBlock");
        case FlowGraphBlockNames.Atan2:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAtan2Block");
        case FlowGraphBlockNames.Sinh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphSinhBlock");
        case FlowGraphBlockNames.Cosh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphCoshBlock");
        case FlowGraphBlockNames.Tanh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphTanhBlock");
        case FlowGraphBlockNames.Asinh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAsinhBlock");
        case FlowGraphBlockNames.Acosh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAcoshBlock");
        case FlowGraphBlockNames.Atanh:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphAtanhBlock");
        case FlowGraphBlockNames.Exponential:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphExpBlock");
        case FlowGraphBlockNames.Log:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphLogBlock");
        case FlowGraphBlockNames.Log2:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphLog2Block");
        case FlowGraphBlockNames.Log10:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphLog10Block");
        case FlowGraphBlockNames.SquareRoot:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphSquareRootBlock");
        case FlowGraphBlockNames.Power:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphPowerBlock");
        case FlowGraphBlockNames.CubeRoot:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphCubeRootBlock");
        case FlowGraphBlockNames.BitwiseAnd:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphBitwiseAndBlock");
        case FlowGraphBlockNames.BitwiseOr:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphBitwiseOrBlock");
        case FlowGraphBlockNames.BitwiseNot:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphBitwiseNotBlock");
        case FlowGraphBlockNames.BitwiseXor:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphBitwiseXorBlock");
        case FlowGraphBlockNames.BitwiseLeftShift:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphBitwiseLeftShiftBlock");
        case FlowGraphBlockNames.BitwiseRightShift:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphBitwiseRightShiftBlock");
        case FlowGraphBlockNames.Length:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphLengthBlock");
        case FlowGraphBlockNames.Normalize:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphNormalizeBlock");
        case FlowGraphBlockNames.Dot:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphDotBlock");
        case FlowGraphBlockNames.Cross:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphCrossBlock");
        case FlowGraphBlockNames.Rotate2D:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphRotate2DBlock");
        case FlowGraphBlockNames.Rotate3D:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphRotate3DBlock");
        case FlowGraphBlockNames.Transpose:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMatrixMathBlocks.pure"), "FlowGraphTransposeBlock");
        case FlowGraphBlockNames.Determinant:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMatrixMathBlocks.pure"), "FlowGraphDeterminantBlock");
        case FlowGraphBlockNames.InvertMatrix:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMatrixMathBlocks.pure"), "FlowGraphInvertMatrixBlock");
        case FlowGraphBlockNames.MatrixMultiplication:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMatrixMathBlocks.pure"), "FlowGraphMatrixMultiplicationBlock");
        case FlowGraphBlockNames.Branch:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphBranchBlock.pure"), "FlowGraphBranchBlock");
        case FlowGraphBlockNames.SetDelay:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphSetDelayBlock.pure"), "FlowGraphSetDelayBlock");
        case FlowGraphBlockNames.CancelDelay:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphCancelDelayBlock.pure"), "FlowGraphCancelDelayBlock");
        case FlowGraphBlockNames.CallCounter:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphCounterBlock.pure"), "FlowGraphCallCounterBlock");
        case FlowGraphBlockNames.Debounce:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphDebounceBlock.pure"), "FlowGraphDebounceBlock");
        case FlowGraphBlockNames.Throttle:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphThrottleBlock.pure"), "FlowGraphThrottleBlock");
        case FlowGraphBlockNames.DoN:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphDoNBlock.pure"), "FlowGraphDoNBlock");
        case FlowGraphBlockNames.FlipFlop:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphFlipFlopBlock.pure"), "FlowGraphFlipFlopBlock");
        case FlowGraphBlockNames.ForLoop:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphForLoopBlock.pure"), "FlowGraphForLoopBlock");
        case FlowGraphBlockNames.MultiGate:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphMultiGateBlock.pure"), "FlowGraphMultiGateBlock");
        case FlowGraphBlockNames.Sequence:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphSequenceBlock.pure"), "FlowGraphSequenceBlock");
        case FlowGraphBlockNames.Switch:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphSwitchBlock.pure"), "FlowGraphSwitchBlock");
        case FlowGraphBlockNames.WaitAll:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphWaitAllBlock.pure"), "FlowGraphWaitAllBlock");
        case FlowGraphBlockNames.WhileLoop:
            return async () => await _LoadBlock(import("./Execution/ControlFlow/flowGraphWhileLoopBlock.pure"), "FlowGraphWhileLoopBlock");
        case FlowGraphBlockNames.ConsoleLog:
            return async () => await _LoadBlock(import("./Execution/flowGraphConsoleLogBlock.pure"), "FlowGraphConsoleLogBlock");
        case FlowGraphBlockNames.Conditional:
            return async () => await _LoadBlock(import("./Data/flowGraphConditionalDataBlock.pure"), "FlowGraphConditionalDataBlock");
        case FlowGraphBlockNames.Constant:
            return async () => await _LoadBlock(import("./Data/flowGraphConstantBlock.pure"), "FlowGraphConstantBlock");
        case FlowGraphBlockNames.TransformCoordinatesSystem:
            return async () => await _LoadBlock(import("./Data/flowGraphTransformCoordinatesSystemBlock.pure"), "FlowGraphTransformCoordinatesSystemBlock");
        case FlowGraphBlockNames.GetAsset:
            return async () => await _LoadBlock(import("./Data/flowGraphGetAssetBlock.pure"), "FlowGraphGetAssetBlock");
        case FlowGraphBlockNames.GetProperty:
            return async () => await _LoadBlock(import("./Data/flowGraphGetPropertyBlock.pure"), "FlowGraphGetPropertyBlock");
        case FlowGraphBlockNames.SetProperty:
            return async () => await _LoadBlock(import("./Execution/flowGraphSetPropertyBlock.pure"), "FlowGraphSetPropertyBlock");
        case FlowGraphBlockNames.GetVariable:
            return async () => await _LoadBlock(import("./Data/flowGraphGetVariableBlock.pure"), "FlowGraphGetVariableBlock");
        case FlowGraphBlockNames.SetVariable:
            return async () => await _LoadBlock(import("./Execution/flowGraphSetVariableBlock.pure"), "FlowGraphSetVariableBlock");
        case FlowGraphBlockNames.JsonPointerParser:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphJsonPointerParserBlock.pure"), "FlowGraphJsonPointerParserBlock");
        case FlowGraphBlockNames.LeadingZeros:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphLeadingZerosBlock");
        case FlowGraphBlockNames.TrailingZeros:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphTrailingZerosBlock");
        case FlowGraphBlockNames.OneBitsCounter:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathBlocks.pure"), "FlowGraphOneBitsCounterBlock");
        case FlowGraphBlockNames.CombineVector2:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphCombineVector2Block");
        case FlowGraphBlockNames.CombineVector3:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphCombineVector3Block");
        case FlowGraphBlockNames.CombineVector4:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphCombineVector4Block");
        case FlowGraphBlockNames.CombineMatrix:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphCombineMatrixBlock");
        case FlowGraphBlockNames.CombineMatrix2D:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphCombineMatrix2DBlock");
        case FlowGraphBlockNames.CombineMatrix3D:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphCombineMatrix3DBlock");
        case FlowGraphBlockNames.ExtractVector2:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphExtractVector2Block");
        case FlowGraphBlockNames.ExtractVector3:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphExtractVector3Block");
        case FlowGraphBlockNames.ExtractVector4:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphExtractVector4Block");
        case FlowGraphBlockNames.ExtractMatrix:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphExtractMatrixBlock");
        case FlowGraphBlockNames.ExtractMatrix2D:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphExtractMatrix2DBlock");
        case FlowGraphBlockNames.ExtractMatrix3D:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMathCombineExtractBlocks.pure"), "FlowGraphExtractMatrix3DBlock");
        case FlowGraphBlockNames.TransformVector:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphTransformBlock");
        case FlowGraphBlockNames.TransformCoordinates:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphTransformCoordinatesBlock");
        case FlowGraphBlockNames.Conjugate:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphConjugateBlock");
        case FlowGraphBlockNames.AngleBetween:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphAngleBetweenBlock");
        case FlowGraphBlockNames.QuaternionFromAxisAngle:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphQuaternionFromAxisAngleBlock");
        case FlowGraphBlockNames.AxisAngleFromQuaternion:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphAxisAngleFromQuaternionBlock");
        case FlowGraphBlockNames.QuaternionFromDirections:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphQuaternionFromDirectionsBlock");
        case FlowGraphBlockNames.QuaternionFromUpForward:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphQuaternionFromUpForwardBlock");
        case FlowGraphBlockNames.QuaternionFromAngles:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphQuaternionFromAnglesBlock");
        case FlowGraphBlockNames.VectorSlerp:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphVectorMathBlocks.pure"), "FlowGraphVectorSlerpBlock");
        case FlowGraphBlockNames.MatrixDecompose:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMatrixMathBlocks.pure"), "FlowGraphMatrixDecomposeBlock");
        case FlowGraphBlockNames.MatrixCompose:
            return async () => await _LoadBlock(import("./Data/Math/flowGraphMatrixMathBlocks.pure"), "FlowGraphMatrixComposeBlock");
        case FlowGraphBlockNames.BooleanToFloat:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphTypeToTypeBlocks.pure"), "FlowGraphBooleanToFloat");
        case FlowGraphBlockNames.BooleanToInt:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphTypeToTypeBlocks.pure"), "FlowGraphBooleanToInt");
        case FlowGraphBlockNames.FloatToBoolean:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphTypeToTypeBlocks.pure"), "FlowGraphFloatToBoolean");
        case FlowGraphBlockNames.IntToBoolean:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphTypeToTypeBlocks.pure"), "FlowGraphIntToBoolean");
        case FlowGraphBlockNames.IntToFloat:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphTypeToTypeBlocks.pure"), "FlowGraphIntToFloat");
        case FlowGraphBlockNames.FloatToInt:
            return async () => await _LoadBlock(import("./Data/Transformers/flowGraphTypeToTypeBlocks.pure"), "FlowGraphFloatToInt");
        case FlowGraphBlockNames.Easing:
            return async () => await _LoadBlock(import("./Execution/Animation/flowGraphEasingBlock.pure"), "FlowGraphEasingBlock");
        case FlowGraphBlockNames.BezierCurveEasing:
            return async () => await _LoadBlock(import("./Execution/Animation/flowGraphBezierCurveEasingBlock.pure"), "FlowGraphBezierCurveEasingBlock");
        case FlowGraphBlockNames.PointerOverEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphPointerOverEventBlock.pure"), "FlowGraphPointerOverEventBlock");
        case FlowGraphBlockNames.PointerOutEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphPointerOutEventBlock.pure"), "FlowGraphPointerOutEventBlock");
        case FlowGraphBlockNames.PointerDownEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphPointerDownEventBlock.pure"), "FlowGraphPointerDownEventBlock");
        case FlowGraphBlockNames.PointerUpEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphPointerUpEventBlock.pure"), "FlowGraphPointerUpEventBlock");
        case FlowGraphBlockNames.PointerMoveEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphPointerMoveEventBlock.pure"), "FlowGraphPointerMoveEventBlock");
        // Keyboard
        case FlowGraphBlockNames.KeyDownEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphKeyDownEventBlock.pure"), "FlowGraphKeyDownEventBlock");
        case FlowGraphBlockNames.KeyUpEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphKeyUpEventBlock.pure"), "FlowGraphKeyUpEventBlock");
        case FlowGraphBlockNames.IsKeyPressed:
            return async () => await _LoadBlock(import("./Data/flowGraphIsKeyPressedBlock.pure"), "FlowGraphIsKeyPressedBlock");
        case FlowGraphBlockNames.Context:
            return async () => await _LoadBlock(import("./Data/Utils/flowGraphContextBlock.pure"), "FlowGraphContextBlock");
        case FlowGraphBlockNames.ArrayIndex:
            return async () => await _LoadBlock(import("./Data/Utils/flowGraphArrayIndexBlock.pure"), "FlowGraphArrayIndexBlock");
        case FlowGraphBlockNames.CodeExecution:
            return async () => (await import("./Data/Utils/flowGraphCodeExecutionBlock")).FlowGraphCodeExecutionBlock;
        case FlowGraphBlockNames.IndexOf:
            return async () => await _LoadBlock(import("./Data/Utils/flowGraphIndexOfBlock.pure"), "FlowGraphIndexOfBlock");
        case FlowGraphBlockNames.FunctionReference:
            return async () => await _LoadBlock(import("./Data/Utils/flowGraphFunctionReferenceBlock.pure"), "FlowGraphFunctionReferenceBlock");
        case FlowGraphBlockNames.DataSwitch:
            return async () => await _LoadBlock(import("./Data/flowGraphDataSwitchBlock.pure"), "FlowGraphDataSwitchBlock");
        case FlowGraphBlockNames.DebugBlock:
            return async () => await _LoadBlock(import("./Data/flowGraphDebugBlock.pure"), "FlowGraphDebugBlock");
        // Physics
        case FlowGraphBlockNames.PhysicsCollisionEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphPhysicsCollisionEventBlock.pure"), "FlowGraphPhysicsCollisionEventBlock");
        case FlowGraphBlockNames.PhysicsApplyForce:
            return async () => await _LoadBlock(import("./Execution/Physics/flowGraphApplyForceBlock.pure"), "FlowGraphApplyForceBlock");
        case FlowGraphBlockNames.PhysicsApplyImpulse:
            return async () => await _LoadBlock(import("./Execution/Physics/flowGraphApplyImpulseBlock.pure"), "FlowGraphApplyImpulseBlock");
        case FlowGraphBlockNames.PhysicsSetLinearVelocity:
            return async () => await _LoadBlock(import("./Execution/Physics/flowGraphSetLinearVelocityBlock.pure"), "FlowGraphSetLinearVelocityBlock");
        case FlowGraphBlockNames.PhysicsSetAngularVelocity:
            return async () => await _LoadBlock(import("./Execution/Physics/flowGraphSetAngularVelocityBlock.pure"), "FlowGraphSetAngularVelocityBlock");
        case FlowGraphBlockNames.PhysicsSetMotionType:
            return async () => await _LoadBlock(import("./Execution/Physics/flowGraphSetPhysicsMotionTypeBlock.pure"), "FlowGraphSetPhysicsMotionTypeBlock");
        case FlowGraphBlockNames.PhysicsGetLinearVelocity:
            return async () => await _LoadBlock(import("./Data/Physics/flowGraphGetLinearVelocityBlock.pure"), "FlowGraphGetLinearVelocityBlock");
        case FlowGraphBlockNames.PhysicsGetAngularVelocity:
            return async () => await _LoadBlock(import("./Data/Physics/flowGraphGetAngularVelocityBlock.pure"), "FlowGraphGetAngularVelocityBlock");
        case FlowGraphBlockNames.PhysicsGetMassProperties:
            return async () => await _LoadBlock(import("./Data/Physics/flowGraphGetPhysicsMassPropertiesBlock.pure"), "FlowGraphGetPhysicsMassPropertiesBlock");
        // Audio
        case FlowGraphBlockNames.AudioPlaySound:
            return async () => await _LoadBlock(import("./Execution/Audio/flowGraphPlaySoundBlock.pure"), "FlowGraphPlaySoundBlock");
        case FlowGraphBlockNames.AudioStopSound:
            return async () => await _LoadBlock(import("./Execution/Audio/flowGraphStopSoundBlock.pure"), "FlowGraphStopSoundBlock");
        case FlowGraphBlockNames.AudioPauseSound:
            return async () => await _LoadBlock(import("./Execution/Audio/flowGraphPauseSoundBlock.pure"), "FlowGraphPauseSoundBlock");
        case FlowGraphBlockNames.AudioSetVolume:
            return async () => await _LoadBlock(import("./Execution/Audio/flowGraphSetSoundVolumeBlock.pure"), "FlowGraphSetSoundVolumeBlock");
        case FlowGraphBlockNames.AudioSoundEndedEvent:
            return async () => await _LoadBlock(import("./Event/flowGraphSoundEndedEventBlock.pure"), "FlowGraphSoundEndedEventBlock");
        case FlowGraphBlockNames.AudioGetVolume:
            return async () => await _LoadBlock(import("./Data/Audio/flowGraphGetSoundVolumeBlock.pure"), "FlowGraphGetSoundVolumeBlock");
        case FlowGraphBlockNames.AudioIsSoundPlaying:
            return async () => await _LoadBlock(import("./Data/Audio/flowGraphIsSoundPlayingBlock.pure"), "FlowGraphIsSoundPlayingBlock");
        default:
            // check if the block is a custom block
            if (CustomBlocks[blockName]) {
                return CustomBlocks[blockName];
            }
            // Fallback: O(1) reverse lookup by short name (e.g. "FlowGraphGLTFDataProvider" → "KHR_interactivity/FlowGraphGLTFDataProvider")
            if (!blockName.includes("/")) {
                const fullKey = ShortNameToFullKey[blockName];
                if (fullKey && CustomBlocks[fullKey]) {
                    return CustomBlocks[fullKey];
                }
            }
            throw new Error(`Unknown block name ${blockName}`);
    }
}
