import {
    FlowGraphSceneReadyEventBlock,
    FlowGraphLogBlock,
    FlowGraphTimerBlock,
    FlowGraphSendCustomEventBlock,
    FlowGraphSequenceBlock,
    FlowGraphGetPropertyBlock,
    FlowGraphSetPropertyBlock,
    FlowGraphAddBlock,
    FlowGraphSceneTickEventBlock,
    FlowGraphDoNBlock,
    FlowGraphGetVariableBlock,
    FlowGraphSetVariableBlock,
    FlowGraphRandomBlock,
    FlowGraphLessThanBlock,
    FlowGraphWhileLoopBlock,
    FlowGraphMultiplyBlock,
    FlowGraphAnimateToBlock,
} from "core/FlowGraph";

export const gltfToFlowGraphTypeMap: { [key: string]: string } = {
    "lifecycle/onStart": FlowGraphSceneReadyEventBlock.ClassName,
    log: FlowGraphLogBlock.ClassName,
    "flow/delay": FlowGraphTimerBlock.ClassName,
    "customEvent/send": FlowGraphSendCustomEventBlock.ClassName,
    "flow/sequence": FlowGraphSequenceBlock.ClassName,
    "world/get": FlowGraphGetPropertyBlock.ClassName,
    "world/set": FlowGraphSetPropertyBlock.ClassName,
    "math/add": FlowGraphAddBlock.ClassName,
    "lifecycle/onTick": FlowGraphSceneTickEventBlock.ClassName,
    "flow/doN": FlowGraphDoNBlock.ClassName,
    "variable/get": FlowGraphGetVariableBlock.ClassName,
    "variable/set": FlowGraphSetVariableBlock.ClassName,
    "math/random": FlowGraphRandomBlock.ClassName,
    "math/lt": FlowGraphLessThanBlock.ClassName,
    "flow/whileLoop": FlowGraphWhileLoopBlock.ClassName,
    "math/mul": FlowGraphMultiplyBlock.ClassName,
    "world/animateTo": FlowGraphAnimateToBlock.ClassName,
};

export const gltfPropertyNameToBabylonPropertyName: any = {
    translation: "position",
    scale: "scaling",
    rotation: "rotationQuaternion",
};

export const gltfTypeToBabylonType: any = {
    float2: "Vector2",
    float3: "Vector3",
    float4: "Vector4",
};
