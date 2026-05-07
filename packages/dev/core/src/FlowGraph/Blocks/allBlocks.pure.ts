// Event blocks
import { registerFlowGraphMeshPickEventBlock } from "./Event/flowGraphMeshPickEventBlock.pure";
import { registerFlowGraphPointerOutEventBlock } from "./Event/flowGraphPointerOutEventBlock.pure";
import { registerFlowGraphPointerOverEventBlock } from "./Event/flowGraphPointerOverEventBlock.pure";
import { registerFlowGraphReceiveCustomEventBlock } from "./Event/flowGraphReceiveCustomEventBlock.pure";
import { registerFlowGraphSceneReadyEventBlock } from "./Event/flowGraphSceneReadyEventBlock.pure";
import { registerFlowGraphSceneTickEventBlock } from "./Event/flowGraphSceneTickEventBlock.pure";
import { registerFlowGraphSendCustomEventBlock } from "./Event/flowGraphSendCustomEventBlock.pure";

// Execution blocks
import { registerFlowGraphBezierCurveEasingBlock } from "./Execution/Animation/flowGraphBezierCurveEasingBlock.pure";
import { registerFlowGraphEasingBlock } from "./Execution/Animation/flowGraphEasingBlock.pure";
import { registerFlowGraphInterpolationBlock } from "./Execution/Animation/flowGraphInterpolationBlock.pure";
import { registerFlowGraphPauseAnimationBlock } from "./Execution/Animation/flowGraphPauseAnimationBlock.pure";
import { registerFlowGraphPlayAnimationBlock } from "./Execution/Animation/flowGraphPlayAnimationBlock.pure";
import { registerFlowGraphStopAnimationBlock } from "./Execution/Animation/flowGraphStopAnimationBlock.pure";
import { registerFlowGraphBranchBlock } from "./Execution/ControlFlow/flowGraphBranchBlock.pure";
import { registerFlowGraphCancelDelayBlock } from "./Execution/ControlFlow/flowGraphCancelDelayBlock.pure";
import { registerFlowGraphCounterBlock } from "./Execution/ControlFlow/flowGraphCounterBlock.pure";
import { registerFlowGraphDebounceBlock } from "./Execution/ControlFlow/flowGraphDebounceBlock.pure";
import { registerFlowGraphDoNBlock } from "./Execution/ControlFlow/flowGraphDoNBlock.pure";
import { registerFlowGraphFlipFlopBlock } from "./Execution/ControlFlow/flowGraphFlipFlopBlock.pure";
import { registerFlowGraphForLoopBlock } from "./Execution/ControlFlow/flowGraphForLoopBlock.pure";
import { registerFlowGraphMultiGateBlock } from "./Execution/ControlFlow/flowGraphMultiGateBlock.pure";
import { registerFlowGraphSequenceBlock } from "./Execution/ControlFlow/flowGraphSequenceBlock.pure";
import { registerFlowGraphSetDelayBlock } from "./Execution/ControlFlow/flowGraphSetDelayBlock.pure";
import { registerFlowGraphSwitchBlock } from "./Execution/ControlFlow/flowGraphSwitchBlock.pure";
import { registerFlowGraphThrottleBlock } from "./Execution/ControlFlow/flowGraphThrottleBlock.pure";
import { registerFlowGraphWaitAllBlock } from "./Execution/ControlFlow/flowGraphWaitAllBlock.pure";
import { registerFlowGraphWhileLoopBlock } from "./Execution/ControlFlow/flowGraphWhileLoopBlock.pure";
import { registerFlowGraphConsoleLogBlock } from "./Execution/flowGraphConsoleLogBlock.pure";
import { registerFlowGraphSetPropertyBlock } from "./Execution/flowGraphSetPropertyBlock.pure";
import { registerFlowGraphSetVariableBlock } from "./Execution/flowGraphSetVariableBlock.pure";

// Data blocks
import { registerFlowGraphArrayIndexBlock } from "./Data/Utils/flowGraphArrayIndexBlock.pure";
import { registerFlowGraphContextBlock } from "./Data/Utils/flowGraphContextBlock.pure";
import { registerFlowGraphFunctionReferenceBlock } from "./Data/Utils/flowGraphFunctionReferenceBlock.pure";
import { registerFlowGraphIndexOfBlock } from "./Data/Utils/flowGraphIndexOfBlock.pure";
import { registerFlowGraphJsonPointerParserBlock } from "./Data/Transformers/flowGraphJsonPointerParserBlock.pure";
import { registerFlowGraphTypeToTypeBlocks } from "./Data/Transformers/flowGraphTypeToTypeBlocks.pure";
import { registerFlowGraphMathBlocks } from "./Data/Math/flowGraphMathBlocks.pure";
import { registerFlowGraphMathCombineExtractBlocks } from "./Data/Math/flowGraphMathCombineExtractBlocks.pure";
import { registerFlowGraphMatrixMathBlocks } from "./Data/Math/flowGraphMatrixMathBlocks.pure";
import { registerFlowGraphVectorMathBlocks } from "./Data/Math/flowGraphVectorMathBlocks.pure";
import { registerFlowGraphConditionalDataBlock } from "./Data/flowGraphConditionalDataBlock.pure";
import { registerFlowGraphConstantBlock } from "./Data/flowGraphConstantBlock.pure";
import { registerFlowGraphDataSwitchBlock } from "./Data/flowGraphDataSwitchBlock.pure";
import { registerFlowGraphGetAssetBlock } from "./Data/flowGraphGetAssetBlock.pure";
import { registerFlowGraphGetPropertyBlock } from "./Data/flowGraphGetPropertyBlock.pure";
import { registerFlowGraphGetVariableBlock } from "./Data/flowGraphGetVariableBlock.pure";
import { registerFlowGraphTransformCoordinatesSystemBlock } from "./Data/flowGraphTransformCoordinatesSystemBlock.pure";

/**
 * Registers all event flow graph blocks for deserialization.
 */
export function registerFlowGraphEventBlocks(): void {
    registerFlowGraphMeshPickEventBlock();
    registerFlowGraphPointerOutEventBlock();
    registerFlowGraphPointerOverEventBlock();
    registerFlowGraphReceiveCustomEventBlock();
    registerFlowGraphSceneReadyEventBlock();
    registerFlowGraphSceneTickEventBlock();
    registerFlowGraphSendCustomEventBlock();
}

/**
 * Registers all execution flow graph blocks for deserialization.
 */
export function registerFlowGraphExecutionBlocks(): void {
    // Animation
    registerFlowGraphBezierCurveEasingBlock();
    registerFlowGraphEasingBlock();
    registerFlowGraphInterpolationBlock();
    registerFlowGraphPauseAnimationBlock();
    registerFlowGraphPlayAnimationBlock();
    registerFlowGraphStopAnimationBlock();
    // Control flow
    registerFlowGraphBranchBlock();
    registerFlowGraphCancelDelayBlock();
    registerFlowGraphCounterBlock();
    registerFlowGraphDebounceBlock();
    registerFlowGraphDoNBlock();
    registerFlowGraphFlipFlopBlock();
    registerFlowGraphForLoopBlock();
    registerFlowGraphMultiGateBlock();
    registerFlowGraphSequenceBlock();
    registerFlowGraphSetDelayBlock();
    registerFlowGraphSwitchBlock();
    registerFlowGraphThrottleBlock();
    registerFlowGraphWaitAllBlock();
    registerFlowGraphWhileLoopBlock();
    // Other execution
    registerFlowGraphConsoleLogBlock();
    registerFlowGraphSetPropertyBlock();
    registerFlowGraphSetVariableBlock();
}

/**
 * Registers all data flow graph blocks for deserialization.
 */
export function registerFlowGraphDataBlocks(): void {
    // Utils
    registerFlowGraphArrayIndexBlock();
    registerFlowGraphContextBlock();
    registerFlowGraphFunctionReferenceBlock();
    registerFlowGraphIndexOfBlock();
    // Transformers
    registerFlowGraphJsonPointerParserBlock();
    registerFlowGraphTypeToTypeBlocks();
    // Math
    registerFlowGraphMathBlocks();
    registerFlowGraphMathCombineExtractBlocks();
    registerFlowGraphMatrixMathBlocks();
    registerFlowGraphVectorMathBlocks();
    // Other data
    registerFlowGraphConditionalDataBlock();
    registerFlowGraphConstantBlock();
    registerFlowGraphDataSwitchBlock();
    registerFlowGraphGetAssetBlock();
    registerFlowGraphGetPropertyBlock();
    registerFlowGraphGetVariableBlock();
    registerFlowGraphTransformCoordinatesSystemBlock();
}

let _registered = false;
/**
 * Registers all flow graph blocks in the type store.
 *
 * Note: Unlike other block systems, FlowGraph deserialization uses dynamic `import()` via
 * `blockFactory()` and does NOT require pre-registration. This function is provided for
 * architectural consistency and for scenarios where eager class registration is needed
 * (e.g., external tooling that queries the type store).
 */
export function registerAllFlowGraphBlocks(): void {
    if (_registered) return;
    _registered = true;

    registerFlowGraphEventBlocks();
    registerFlowGraphExecutionBlocks();
    registerFlowGraphDataBlocks();
}
