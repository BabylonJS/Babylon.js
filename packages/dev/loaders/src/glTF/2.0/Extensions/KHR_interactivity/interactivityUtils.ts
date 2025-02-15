// /* eslint-disable @typescript-eslint/naming-convention */
// import type { IKHRInteractivity_Node } from "babylonjs-gltf2interface";
// import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
// import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
// import type { ISerializedFlowGraphBlock, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
// import type { IGLTF } from "../../glTFLoaderInterfaces";
// import { RandomGUID } from "core/Misc/guid";
// import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";

// export interface InteractivityVariable {
//     name: string;
//     value: {
//         className: string;
//         value: any;
//     };
// }

// export interface InteractivityEvent {
//     eventId: string;
//     eventData?: {
//         eventData: boolean;
//         id: string;
//         type: string;
//         value?: any;
//     }[];
// }

// export interface IConvertedInteractivityObject {
//     variables: InteractivityVariable[];
//     events: InteractivityEvent[];
//     types: FlowGraphTypes[];
//     /**
//      * The nodes of the flow graph.
//      * Note that there is no guarantee that the nodes' index corresponds to the glTF node index.
//      * You can read the glTF node id from the block's metadata.
//      */
//     nodes: ISerializedFlowGraphBlock[];
// }

// export function convertGLTFValueToFlowGraph(name: string, value: any, mapping?: IGLTFToFlowGraphMappingObject, convertedObject?: IConvertedInteractivityObject) {
//     const flowGraphKeyName = mapping?.name || name;
//     let convertedValue = value;
//     if (mapping?.isIndex) {
//         if (!convertedObject?.[mapping.isIndex]) {
//             throw new Error("missing array " + mapping.isIndex);
//         } else {
//             if (!mapping.dataTransformer) {
//                 throw new Error("dataTransform must be defined if isIndex is set");
//             }
//             convertedValue = mapping.dataTransformer(value, convertedObject[mapping.isIndex]);
//         }
//     } else {
//         if (mapping?.dataTransformer) {
//             convertedValue = mapping.dataTransformer(value);
//         }
//     }

//     return {
//         key: flowGraphKeyName,
//         value: convertedValue.length && convertedValue.length === 1 ? convertedValue[0] : convertedValue,
//     };
// }

/**
 * Add a new serialized connection to the serialized objects.
 * This is mainly used for the extraProcessor function in the mapping.
 * If more than one node is returned from the extraProcessor, this function should be used to add the connections between the different nodes.
 * @param input The name of the input connection. If not found i n the array a new connection will be created.
 * @param output The name of the output connection. If not found in the array a new connection will be created.
 * @param serializedInput The serialized input object
 * @param serializedOutput The serialized output object
 * @param isVariable if true a new value will be added,, otherwise a flow will be added
 */
// export function connectFlowGraphNodes(input: string, output: string, serializedInput: ISerializedFlowGraphBlock, serializedOutput: ISerializedFlowGraphBlock, isVariable: boolean) {
//     const inputArray = isVariable ? serializedInput.dataInputs : serializedInput.signalInputs;
//     const outputArray = isVariable ? serializedOutput.dataOutputs : serializedOutput.signalOutputs;
//     const inputConnection = inputArray.find((s) => s.name === input) || {
//         uniqueId: RandomGUID(),
//         name: input,
//         _connectionType: FlowGraphConnectionType.Input, // Input
//         connectedPointIds: [] as string[],
//     };
//     const outputConnection = outputArray.find((s) => s.name === output) || {
//         uniqueId: RandomGUID(),
//         name: output,
//         _connectionType: FlowGraphConnectionType.Output, // Output
//         connectedPointIds: [] as string[],
//     };
//     // of not found add it to the array
//     if (!inputArray.find((s) => s.name === input)) {
//         inputArray.push(inputConnection);
//     }
//     if (!outputArray.find((s) => s.name === output)) {
//         outputArray.push(outputConnection);
//     }
//     // connect the sockets
//     inputConnection.connectedPointIds.push(outputConnection.uniqueId);
//     outputConnection.connectedPointIds.push(inputConnection.uniqueId);
// }

// export const gltfTypeToBabylonType: {
//     [key: string]: FlowGraphTypes;
// } = {
//     float: FlowGraphTypes.Number,
//     bool: FlowGraphTypes.Boolean,
//     float2: FlowGraphTypes.Vector2,
//     float3: FlowGraphTypes.Vector3,
//     float4: FlowGraphTypes.Vector4,
//     float4x4: FlowGraphTypes.Matrix,
//     float2x2: FlowGraphTypes.Matrix, // we don't have matrix3 and matrix2. We only have 4x4
//     float3x3: FlowGraphTypes.Matrix, // we don't have matrix3 and matrix2. We only have 4x4
//     int: FlowGraphTypes.Integer,
//     string: FlowGraphTypes.String, // configuration only, not used as value type.
//     "int[]": FlowGraphTypes.Any, // int[] is configuration only, not used as value type. Should be IntegerArray?
// };

/*

# glTF to FlowGraph type mapping

## Math nodes:
### Constants:

- math/e: FlowGraphEBlock !
- math/pi: FlowGraphPiBlock !
- math/inf: FlowGraphInfBlock !
- math/nan: FlowGraphNaNBlock !

### Arithmetic:

- math/abs: FlowGraphAbsBlock !
- math/sign: FlowGraphSignBlock !
- math/trunc: FlowGraphTruncBlock !
- math/floor: FlowGraphFloorBlock !
- math/ceil: FlowGraphCeilBlock !
- math/fract: FlowGraphFractBlock !
- math/neg: FlowGraphNegBlock !
- math/add: FlowGraphAddBlock !
- math/sub: FlowGraphSubtractBlock !
- math/mul: FlowGraphMultiplyBlock !
- math/div: FlowGraphDivideBlock !
- math/rem: FlowGraphRemainderBlock (Currently using % operator, need to check against floats!) !
- math/min: FlowGraphMinBlock !
- math/max: FlowGraphMaxBlock !
- math/clamp: FlowGraphClampBlock !
- math/saturate: FlowGraphSaturateBlock !
- math/mix: FlowGraphInterpolateBlock !

### Comparison:
- math/eq: FlowGraphEqBlock !
- math/lt: FlowGraphLessThanBlock !
- math/le: FlowGraphLessThanOrEqualBlock !
- math/gt: FlowGraphGreaterThanBlock !
- math/ge: FlowGraphGreaterThanOrEqualBlock !

### Special nodes

- math/isnan: FlowGraphIsNanBlock !
- math/isinf: FlowGraphIsInfBlock !
- math/select: 

### Trigonometry:

- math/rad: FlowGraphDegToRadBlock !
- math/deg: FlowGraphRadToDegBlock !
- math/sin: FlowGraphSinBlock !
- math/cos: FlowGraphCosBlock !
- math/tan: FlowGraphTanBlock !
- math/asin: FlowGraphAsinBlock !
- math/acos: FlowGraphAcosBlock !
- math/atan: FlowGraphAtanBlock !
- math/atan2: FlowGraphAtan2Block !

### Hyperbolic:

- math/sinh: FlowGraphSinhBlock !
- math/cosh: FlowGraphCoshBlock !
- math/tanh: FlowGraphTanhBlock !
- math/asinh: FlowGraphAsinhBlock !
- math/acosh: FlowGraphAcoshBlock !
- math/atanh: FlowGraphAtanhBlock !

### Exponential:

- math/exp: FlowGraphExpBlock !
- math/log: FlowGraphLogBlock !
- math/log2: FlowGraphLog2Block !
- math/log10: FlowGraphLog10Block !
- math/sqrt: FlowGraphSqrtBlock !
- math/cbrt: FlowGraphCubeRootBlock !
- math/pow: FlowGraphPowBlock !

### Vector operations:

- math/length: FlowGraphLengthBlock !
- math/normalize: FlowGraphNormalizeBlock !
- math/dot: FlowGraphDotBlock !
- math/cross: FlowGraphCrossBlock !
- math/rotate2d: FlowGraphRotate2DBlock !
- math/rotate3d: FlowGraphRotate3DBlock !
- math/transform: 
- math/combine2:
- math/combine3:
- math/combine4:
- math/extract2:
- math/extract3:
- math/extract4:

### Matrix operations:

- math/transpose: FlowGraphTransposeBlock !
- math/determinant: FlowGraphDeterminantBlock !
- math/inverse: FlowGraphInvertMatrixBlock !
- math/matmul: FlowGraphMatMulBlock !
- math/combine4x4:
- math/extract4x4:

### Integer operations:

- math.abs: FlowGraphAbsBlock !
- math.sign: FlowGraphSignBlock !
- math/neg: FlowGraphNegBlock !
- math/add: FlowGraphAddBlock !
- math/sub: FlowGraphSubtractBlock !
- math/mul: FlowGraphMultiplyBlock !
- math/div: FlowGraphDivideBlock !
- math/rem: FlowGraphRemainderBlock !
- math/min: FlowGraphMinBlock !
- math/max: FlowGraphMaxBlock !
- math/clamp: FlowGraphClampBlock !

### integer comparison:

- math/eq: FlowGraphEqBlock !
- math/lt: FlowGraphLessThanBlock !
- math/le: FlowGraphLessThanOrEqualBlock !
- math/gt: FlowGraphGreaterThanBlock !
- math/ge: FlowGraphGreaterThanOrEqualBlock !

### Bitwise operations:

- math/not: FlowGraphBitwiseNotBlock !
- math/and: FlowGraphBitwiseAndBlock !
- math/or: FlowGraphBitwiseOrBlock !
- math/xor: FlowGraphBitwiseXorBlock !
- math/asr: FlowGraphBitwiseRightShiftBlock !
- math/lsl: FlowGraphBitwiseLeftShiftBlock !
- math/clz: FlowGraphCountLeadingZerosBlock !
- math/ctz: FlowGraphCountTrailingZerosBlock !
- math/popcnt: FlowGraphCountOneBitsBlock !

## Type conversion:

### Boolean:

- type.boolToInt:
- type.boolToFloat:

### Integer:

- type.intToBool:
- type.intToFloat:

### Float:

- type.floatToBool:
- type.floatToInt:

## Control flow:

### Sync nodes:

- flow/sequence: FlowGraphSequenceBlock !
- flow/branch: FlowGraphBranchBlock !
- flow/switch: FlowGraphSwitchBlock !
- flow/while: FlowGraphWhileLoopBlock !
- flow/for: FlowGraphForLoopBlock !
- flow/doN: FlowGraphDoNBlock !
- flow/multiGate: FlowGraphMultiGateBlock !
- flow/waitAll: FlowGraphWaitAllBlock !
- flow/throttle: FlowGraphThrottleBlock !
- flow/setDelay: FlowGraphSetDelayBlock !
- flow/cancelDelay: FlowGraphCancelDelayBlock !

## State manipulation nodes:

## Custom variable access:

- variable/get: FlowGraphGetVariableBlock !
- variable/set: FlowGraphSetVariableBlock !

### Object model access:

- pointer/get: 
- pointer/set: 
- pointer/interpolate:

### Animation control nodes:

- animation/start: FlowGraphPlayAnimationBlock ? [Need to be revised]
- animation/stop: FlowGraphStopAnimationBlock ? [Need to be revised]
- animation/stopAt: FlowGraphStopAnimationAtBlock ? [Need to be revised]

## Event nodes:

### Lifecycle events:

- event/onStart: FlowGraphSceneReadyEventBlock ! 
- event/onTick: FlowGraphSceneTickEventBlock !

### Custom events:

- event/receive: FlowGraphReceiveCustomEventBlock !
- event/send: FlowGraphSendCustomEventBlock !



*/
