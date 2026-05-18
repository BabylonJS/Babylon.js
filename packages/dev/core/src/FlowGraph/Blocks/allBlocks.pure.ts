// Event blocks
import { RegisterFlowGraphMeshPickEventBlock } from "./Event/flowGraphMeshPickEventBlock.pure";
import { RegisterFlowGraphPointerOutEventBlock } from "./Event/flowGraphPointerOutEventBlock.pure";
import { RegisterFlowGraphPointerOverEventBlock } from "./Event/flowGraphPointerOverEventBlock.pure";
import { RegisterFlowGraphReceiveCustomEventBlock } from "./Event/flowGraphReceiveCustomEventBlock.pure";
import { RegisterFlowGraphSceneReadyEventBlock } from "./Event/flowGraphSceneReadyEventBlock.pure";
import { RegisterFlowGraphSceneTickEventBlock } from "./Event/flowGraphSceneTickEventBlock.pure";
import { RegisterFlowGraphSendCustomEventBlock } from "./Event/flowGraphSendCustomEventBlock.pure";

// Execution blocks
import { RegisterFlowGraphBezierCurveEasingBlock } from "./Execution/Animation/flowGraphBezierCurveEasingBlock.pure";
import { RegisterFlowGraphEasingBlock } from "./Execution/Animation/flowGraphEasingBlock.pure";
import { RegisterFlowGraphInterpolationBlock } from "./Execution/Animation/flowGraphInterpolationBlock.pure";
import { RegisterFlowGraphPauseAnimationBlock } from "./Execution/Animation/flowGraphPauseAnimationBlock.pure";
import { RegisterFlowGraphPlayAnimationBlock } from "./Execution/Animation/flowGraphPlayAnimationBlock.pure";
import { RegisterFlowGraphStopAnimationBlock } from "./Execution/Animation/flowGraphStopAnimationBlock.pure";
import { RegisterFlowGraphBranchBlock } from "./Execution/ControlFlow/flowGraphBranchBlock.pure";
import { RegisterFlowGraphCancelDelayBlock } from "./Execution/ControlFlow/flowGraphCancelDelayBlock.pure";
import { RegisterFlowGraphCounterBlock } from "./Execution/ControlFlow/flowGraphCounterBlock.pure";
import { RegisterFlowGraphDebounceBlock } from "./Execution/ControlFlow/flowGraphDebounceBlock.pure";
import { RegisterFlowGraphDoNBlock } from "./Execution/ControlFlow/flowGraphDoNBlock.pure";
import { RegisterFlowGraphFlipFlopBlock } from "./Execution/ControlFlow/flowGraphFlipFlopBlock.pure";
import { RegisterFlowGraphForLoopBlock } from "./Execution/ControlFlow/flowGraphForLoopBlock.pure";
import { RegisterFlowGraphMultiGateBlock } from "./Execution/ControlFlow/flowGraphMultiGateBlock.pure";
import { RegisterFlowGraphSequenceBlock } from "./Execution/ControlFlow/flowGraphSequenceBlock.pure";
import { RegisterFlowGraphSetDelayBlock } from "./Execution/ControlFlow/flowGraphSetDelayBlock.pure";
import { RegisterFlowGraphSwitchBlock } from "./Execution/ControlFlow/flowGraphSwitchBlock.pure";
import { RegisterFlowGraphThrottleBlock } from "./Execution/ControlFlow/flowGraphThrottleBlock.pure";
import { RegisterFlowGraphWaitAllBlock } from "./Execution/ControlFlow/flowGraphWaitAllBlock.pure";
import { RegisterFlowGraphWhileLoopBlock } from "./Execution/ControlFlow/flowGraphWhileLoopBlock.pure";
import { RegisterFlowGraphConsoleLogBlock } from "./Execution/flowGraphConsoleLogBlock.pure";
import { RegisterFlowGraphSetPropertyBlock } from "./Execution/flowGraphSetPropertyBlock.pure";
import { RegisterFlowGraphSetVariableBlock } from "./Execution/flowGraphSetVariableBlock.pure";

// Data blocks
import { RegisterFlowGraphArrayIndexBlock } from "./Data/Utils/flowGraphArrayIndexBlock.pure";
import { RegisterFlowGraphContextBlock } from "./Data/Utils/flowGraphContextBlock.pure";
import { RegisterFlowGraphFunctionReferenceBlock } from "./Data/Utils/flowGraphFunctionReferenceBlock.pure";
import { RegisterFlowGraphIndexOfBlock } from "./Data/Utils/flowGraphIndexOfBlock.pure";
import { RegisterFlowGraphJsonPointerParserBlock } from "./Data/Transformers/flowGraphJsonPointerParserBlock.pure";
import { RegisterFlowGraphTypeToTypeBlocks } from "./Data/Transformers/flowGraphTypeToTypeBlocks.pure";
import { RegisterFlowGraphMathBlocks } from "./Data/Math/flowGraphMathBlocks.pure";
import { RegisterFlowGraphMathCombineExtractBlocks } from "./Data/Math/flowGraphMathCombineExtractBlocks.pure";
import { RegisterFlowGraphMatrixMathBlocks } from "./Data/Math/flowGraphMatrixMathBlocks.pure";
import { RegisterFlowGraphVectorMathBlocks } from "./Data/Math/flowGraphVectorMathBlocks.pure";
import { RegisterFlowGraphConditionalDataBlock } from "./Data/flowGraphConditionalDataBlock.pure";
import { RegisterFlowGraphConstantBlock } from "./Data/flowGraphConstantBlock.pure";
import { RegisterFlowGraphDataSwitchBlock } from "./Data/flowGraphDataSwitchBlock.pure";
import { RegisterFlowGraphGetAssetBlock } from "./Data/flowGraphGetAssetBlock.pure";
import { RegisterFlowGraphGetPropertyBlock } from "./Data/flowGraphGetPropertyBlock.pure";
import { RegisterFlowGraphGetVariableBlock } from "./Data/flowGraphGetVariableBlock.pure";
import { RegisterFlowGraphTransformCoordinatesSystemBlock } from "./Data/flowGraphTransformCoordinatesSystemBlock.pure";

/**
 * Registers all event flow graph blocks for deserialization.
 */
export function RegisterFlowGraphEventBlocks(): void {
    RegisterFlowGraphMeshPickEventBlock();
    RegisterFlowGraphPointerOutEventBlock();
    RegisterFlowGraphPointerOverEventBlock();
    RegisterFlowGraphReceiveCustomEventBlock();
    RegisterFlowGraphSceneReadyEventBlock();
    RegisterFlowGraphSceneTickEventBlock();
    RegisterFlowGraphSendCustomEventBlock();
}

/**
 * Registers all execution flow graph blocks for deserialization.
 */
export function RegisterFlowGraphExecutionBlocks(): void {
    // Animation
    RegisterFlowGraphBezierCurveEasingBlock();
    RegisterFlowGraphEasingBlock();
    RegisterFlowGraphInterpolationBlock();
    RegisterFlowGraphPauseAnimationBlock();
    RegisterFlowGraphPlayAnimationBlock();
    RegisterFlowGraphStopAnimationBlock();
    // Control flow
    RegisterFlowGraphBranchBlock();
    RegisterFlowGraphCancelDelayBlock();
    RegisterFlowGraphCounterBlock();
    RegisterFlowGraphDebounceBlock();
    RegisterFlowGraphDoNBlock();
    RegisterFlowGraphFlipFlopBlock();
    RegisterFlowGraphForLoopBlock();
    RegisterFlowGraphMultiGateBlock();
    RegisterFlowGraphSequenceBlock();
    RegisterFlowGraphSetDelayBlock();
    RegisterFlowGraphSwitchBlock();
    RegisterFlowGraphThrottleBlock();
    RegisterFlowGraphWaitAllBlock();
    RegisterFlowGraphWhileLoopBlock();
    // Other execution
    RegisterFlowGraphConsoleLogBlock();
    RegisterFlowGraphSetPropertyBlock();
    RegisterFlowGraphSetVariableBlock();
}

/**
 * Registers all data flow graph blocks for deserialization.
 */
export function RegisterFlowGraphDataBlocks(): void {
    // Utils
    RegisterFlowGraphArrayIndexBlock();
    RegisterFlowGraphContextBlock();
    RegisterFlowGraphFunctionReferenceBlock();
    RegisterFlowGraphIndexOfBlock();
    // Transformers
    RegisterFlowGraphJsonPointerParserBlock();
    RegisterFlowGraphTypeToTypeBlocks();
    // Math
    RegisterFlowGraphMathBlocks();
    RegisterFlowGraphMathCombineExtractBlocks();
    RegisterFlowGraphMatrixMathBlocks();
    RegisterFlowGraphVectorMathBlocks();
    // Other data
    RegisterFlowGraphConditionalDataBlock();
    RegisterFlowGraphConstantBlock();
    RegisterFlowGraphDataSwitchBlock();
    RegisterFlowGraphGetAssetBlock();
    RegisterFlowGraphGetPropertyBlock();
    RegisterFlowGraphGetVariableBlock();
    RegisterFlowGraphTransformCoordinatesSystemBlock();
}

let _Registered = false;
/**
 * Registers all flow graph blocks in the type store.
 *
 * Note: Unlike other block systems, FlowGraph deserialization uses dynamic `import()` via
 * `blockFactory()` and does NOT require pre-registration. This function is provided for
 * architectural consistency and for scenarios where eager class registration is needed
 * (e.g., external tooling that queries the type store).
 */
export function RegisterAllFlowGraphBlocks(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterFlowGraphEventBlocks();
    RegisterFlowGraphExecutionBlocks();
    RegisterFlowGraphDataBlocks();
}
