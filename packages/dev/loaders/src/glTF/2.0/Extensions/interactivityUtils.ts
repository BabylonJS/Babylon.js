import { FlowGraphSceneReadyEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock";
import { FlowGraphSceneTickEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneTickEventBlock";
import { FlowGraphLogBlock } from "core/FlowGraph/Blocks/Execution/flowGraphLogBlock";
import { FlowGraphTimerBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphTimerBlock";
import { FlowGraphSendCustomEventBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSendCustomEventBlock";
import { FlowGraphReceiveCustomEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphReceiveCustomEventBlock";
import { FlowGraphSequenceBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSequenceBlock";
import { FlowGraphGetPropertyBlock } from "core/FlowGraph/Blocks/Data/flowGraphGetPropertyBlock";
import { FlowGraphSetPropertyBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetPropertyBlock";
import {
    FlowGraphAddBlock,
    FlowGraphRandomBlock,
    FlowGraphLessThanBlock,
    FlowGraphMultiplyBlock,
    FlowGraphSubtractBlock,
    FlowGraphDotBlock,
} from "core/FlowGraph/Blocks/Data/Math/flowGraphMathBlocks";
import { FlowGraphDoNBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphDoNBlock";
import { FlowGraphGetVariableBlock } from "core/FlowGraph/Blocks/Data/flowGraphGetVariableBlock";
import { FlowGraphSetVariableBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import { FlowGraphWhileLoopBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphWhileLoopBlock";
import { FlowGraphAnimateToBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphAnimateToBlock";

export const gltfToFlowGraphTypeMap: { [key: string]: string } = {
    "lifecycle/onStart": FlowGraphSceneReadyEventBlock.ClassName,
    "lifecycle/onTick": FlowGraphSceneTickEventBlock.ClassName,
    log: FlowGraphLogBlock.ClassName,
    "flow/delay": FlowGraphTimerBlock.ClassName,
    "customEvent/send": FlowGraphSendCustomEventBlock.ClassName,
    "customEvent/receive": FlowGraphReceiveCustomEventBlock.ClassName,
    "flow/sequence": FlowGraphSequenceBlock.ClassName,
    "world/get": FlowGraphGetPropertyBlock.ClassName,
    "world/set": FlowGraphSetPropertyBlock.ClassName,
    "math/add": FlowGraphAddBlock.ClassName,
    "flow/doN": FlowGraphDoNBlock.ClassName,
    "variable/get": FlowGraphGetVariableBlock.ClassName,
    "variable/set": FlowGraphSetVariableBlock.ClassName,
    "math/random": FlowGraphRandomBlock.ClassName,
    "math/lt": FlowGraphLessThanBlock.ClassName,
    "flow/whileLoop": FlowGraphWhileLoopBlock.ClassName,
    "math/mul": FlowGraphMultiplyBlock.ClassName,
    "world/animateTo": FlowGraphAnimateToBlock.ClassName,
    "math/sub": FlowGraphSubtractBlock.ClassName,
    "math/dot": FlowGraphDotBlock.ClassName,
};

export const gltfTypeToBabylonType: any = {
    float2: "Vector2",
    float3: "Vector3",
    float4: "Vector4",
};
