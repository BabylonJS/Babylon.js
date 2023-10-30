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
} from "core/FlowGraph";
import type { GLTFLoader } from "../../glTFLoader";

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
};

const gltfPropertyNameToBabylonPropertyName: any = {
    translation: "position",
    scale: "scaling",
    rotation: "rotationQuaternion",
};

export const gltfTypeToBabylonType: any = {
    float2: "Vector2",
    float3: "Vector3",
    float4: "Vector4",
};

export function _parsePath(context: string, pointer: string, _loader: GLTFLoader): { target: any; path: string } {
    if (!pointer.startsWith("/")) {
        throw new Error(`${context}: Value (${pointer}) must start with a slash`);
    }

    const parts = pointer.split("/");

    // Remove the first part since it will be empty string as pointers must start with a slash.
    parts.shift();

    // index until the last part, which is the property name
    let currentNode: any = _loader.gltf;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        currentNode = currentNode && currentNode[part];
    }

    if (currentNode._babylonTransformNode) {
        currentNode = currentNode._babylonTransformNode;
    }

    const propertyName = gltfPropertyNameToBabylonPropertyName[parts[parts.length - 1]] ?? parts[parts.length - 1];

    return {
        target: currentNode,
        path: propertyName,
    };
}
