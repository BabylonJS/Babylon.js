/* eslint-disable @typescript-eslint/naming-convention */
import { FlowGraphSceneReadyEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock";
import { FlowGraphSceneTickEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneTickEventBlock";
import { FlowGraphConsoleLogBlock } from "core/FlowGraph/Blocks/Execution/flowGraphConsoleLogBlock";
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
    FlowGraphEBlock,
    FlowGraphPiBlock,
    FlowGraphInfBlock,
    FlowGraphNaNBlock,
    FlowGraphAbsBlock,
    FlowGraphSignBlock,
    FlowGraphTruncBlock,
    FlowGraphFloorBlock,
    FlowGraphCeilBlock,
    FlowGraphFractBlock,
    FlowGraphNegBlock,
    FlowGraphDivideBlock,
    FlowGraphRemainderBlock,
    FlowGraphMinBlock,
    FlowGraphMaxBlock,
    FlowGraphClampBlock,
    FlowGraphSaturateBlock,
    FlowGraphInterpolateBlock,
    FlowGraphEqBlock,
    FlowGraphLessThanOrEqualBlock,
    FlowGraphGreaterThanBlock,
    FlowGraphGreaterThanOrEqualBlock,
    FlowGraphIsNanBlock,
    FlowGraphIsInfBlock,
    FlowGraphDegToRadBlock,
    FlowGraphRadToDegBlock,
    FlowGraphSinBlock,
    FlowGraphCosBlock,
    FlowGraphTanBlock,
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
    FlowGraphLog2Block,
    FlowGraphLogBlock,
    FlowGraphLog10Block,
    FlowGraphSqrtBlock,
    FlowGraphCubeRootBlock,
    FlowGraphPowBlock,
    FlowGraphLengthBlock,
    FlowGraphNormalizeBlock,
    FlowGraphCrossBlock,
    FlowGraphRotate2DBlock,
    FlowGraphRotate3DBlock,
    FlowGraphTransposeBlock,
    FlowGraphDeterminantBlock,
    FlowGraphInvertMatrixBlock,
    FlowGraphMatMulBlock,
    FlowGraphBitwiseNotBlock,
    FlowGraphBitwiseAndBlock,
    FlowGraphBitwiseOrBlock,
    FlowGraphBitwiseXorBlock,
    FlowGraphBitwiseRightShiftBlock,
    FlowGraphBitwiseLeftShiftBlock,
    FlowGraphCountLeadingZerosBlock,
    FlowGraphCountTrailingZerosBlock,
    FlowGraphCountOneBitsBlock,
} from "core/FlowGraph/Blocks/Data/Math/flowGraphMathBlocks";
import { FlowGraphDoNBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphDoNBlock";
import { FlowGraphGetVariableBlock } from "core/FlowGraph/Blocks/Data/flowGraphGetVariableBlock";
import { FlowGraphSetVariableBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import { FlowGraphWhileLoopBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphWhileLoopBlock";

export const gltfToFlowGraphTypeMap: { [key: string]: string } = {
    "lifecycle/onStart": FlowGraphSceneReadyEventBlock.ClassName,
    "lifecycle/onTick": FlowGraphSceneTickEventBlock.ClassName,
    log: FlowGraphConsoleLogBlock.ClassName,
    "flow/delay": FlowGraphTimerBlock.ClassName,
    "customEvent/send": FlowGraphSendCustomEventBlock.ClassName,
    "customEvent/receive": FlowGraphReceiveCustomEventBlock.ClassName,
    "flow/sequence": FlowGraphSequenceBlock.ClassName,
    "world/get": FlowGraphGetPropertyBlock.ClassName,
    "world/set": FlowGraphSetPropertyBlock.ClassName,
    "flow/doN": FlowGraphDoNBlock.ClassName,
    "variable/get": FlowGraphGetVariableBlock.ClassName,
    "variable/set": FlowGraphSetVariableBlock.ClassName,
    "flow/whileLoop": FlowGraphWhileLoopBlock.ClassName,
    "math/random": FlowGraphRandomBlock.ClassName,
    "math/e": FlowGraphEBlock.ClassName,
    "math/pi": FlowGraphPiBlock.ClassName,
    "math/inf": FlowGraphInfBlock.ClassName,
    "math/nan": FlowGraphNaNBlock.ClassName,
    "math/abs": FlowGraphAbsBlock.ClassName,
    "math/sign": FlowGraphSignBlock.ClassName,
    "math/trunc": FlowGraphTruncBlock.ClassName,
    "math/floor": FlowGraphFloorBlock.ClassName,
    "math/ceil": FlowGraphCeilBlock.ClassName,
    "math/fract": FlowGraphFractBlock.ClassName,
    "math/neg": FlowGraphNegBlock.ClassName,
    "math/add": FlowGraphAddBlock.ClassName,
    "math/sub": FlowGraphSubtractBlock.ClassName,
    "math/mul": FlowGraphMultiplyBlock.ClassName,
    "math/div": FlowGraphDivideBlock.ClassName,
    "math/rem": FlowGraphRemainderBlock.ClassName,
    "math/min": FlowGraphMinBlock.ClassName,
    "math/max": FlowGraphMaxBlock.ClassName,
    "math/clamp": FlowGraphClampBlock.ClassName,
    "math/saturate": FlowGraphSaturateBlock.ClassName,
    "math/mix": FlowGraphInterpolateBlock.ClassName,
    "math/eq": FlowGraphEqBlock.ClassName,
    "math/lt": FlowGraphLessThanBlock.ClassName,
    "math/le": FlowGraphLessThanOrEqualBlock.ClassName,
    "math/gt": FlowGraphGreaterThanBlock.ClassName,
    "math/ge": FlowGraphGreaterThanOrEqualBlock.ClassName,
    "math/isnan": FlowGraphIsNanBlock.ClassName,
    "math/isinf": FlowGraphIsInfBlock.ClassName,
    "math/rad": FlowGraphDegToRadBlock.ClassName,
    "math/deg": FlowGraphRadToDegBlock.ClassName,
    "math/sin": FlowGraphSinBlock.ClassName,
    "math/cos": FlowGraphCosBlock.ClassName,
    "math/tan": FlowGraphTanBlock.ClassName,
    "math/asin": FlowGraphAsinBlock.ClassName,
    "math/acos": FlowGraphAcosBlock.ClassName,
    "math/atan": FlowGraphAtanBlock.ClassName,
    "math/atan2": FlowGraphAtan2Block.ClassName,
    "math/sinh": FlowGraphSinhBlock.ClassName,
    "math/cosh": FlowGraphCoshBlock.ClassName,
    "math/tanh": FlowGraphTanhBlock.ClassName,
    "math/asinh": FlowGraphAsinhBlock.ClassName,
    "math/acosh": FlowGraphAcoshBlock.ClassName,
    "math/atanh": FlowGraphAtanhBlock.ClassName,
    "math/exp": FlowGraphExpBlock.ClassName,
    "math/log": FlowGraphLogBlock.ClassName,
    "math/log2": FlowGraphLog2Block.ClassName,
    "math/log10": FlowGraphLog10Block.ClassName,
    "math/sqrt": FlowGraphSqrtBlock.ClassName,
    "math/cbrt": FlowGraphCubeRootBlock.ClassName,
    "math/pow": FlowGraphPowBlock.ClassName,
    "math/length": FlowGraphLengthBlock.ClassName,
    "math/normalize": FlowGraphNormalizeBlock.ClassName,
    "math/dot": FlowGraphDotBlock.ClassName,
    "math/cross": FlowGraphCrossBlock.ClassName,
    "math/rotate2d": FlowGraphRotate2DBlock.ClassName,
    "math/rotate3d": FlowGraphRotate3DBlock.ClassName,
    "math/transpose": FlowGraphTransposeBlock.ClassName,
    "math/determinant": FlowGraphDeterminantBlock.ClassName,
    "math/inverse": FlowGraphInvertMatrixBlock.ClassName,
    "math/matmul": FlowGraphMatMulBlock.ClassName,
    "math/not": FlowGraphBitwiseNotBlock.ClassName,
    "math/and": FlowGraphBitwiseAndBlock.ClassName,
    "math/or": FlowGraphBitwiseOrBlock.ClassName,
    "math/xor": FlowGraphBitwiseXorBlock.ClassName,
    "math/asr": FlowGraphBitwiseRightShiftBlock.ClassName,
    "math/lsl": FlowGraphBitwiseLeftShiftBlock.ClassName,
    "math/clz": FlowGraphCountLeadingZerosBlock.ClassName,
    "math/ctz": FlowGraphCountTrailingZerosBlock.ClassName,
    "math/popcnt": FlowGraphCountOneBitsBlock.ClassName,
};

export const gltfTypeToBabylonType: {
    [key: string]: string;
} = {
    float2: "Vector2",
    float3: "Vector3",
    float4: "Vector4",
    float4x4: "Matrix",
    int: "FlowGraphInteger",
};

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
- flow/throttle: FlowGraphThrottleBlock
- flow/setDelay:
- flow/cancelDelay:

## State manipulation nodes:

## Custom variable access:

- variable/get: FlowGraphGetVariableBlock
- variable/set: FlowGraphSetVariableBlock

### Object model access:

- pointer/get:
- pointer/set:
- pointer/interpolate:

### Animation control nodes:

- animation/start:
- animation/stop:
- animation/stopAt:

## Event nodes:

### Lifecycle events:

- event/onStart: FlowGraphSceneReadyEventBlock
- event/onTick: FlowGraphSceneTickEventBlock

### Custom events:

- event/receive: FlowGraphReceiveCustomEventBlock
- event/send: FlowGraphSendCustomEventBlock



*/
