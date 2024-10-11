/* eslint-disable @typescript-eslint/naming-convention */
import { FlowGraphSceneReadyEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock";
import { FlowGraphSceneTickEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSceneTickEventBlock";
import { FlowGraphConsoleLogBlock } from "core/FlowGraph/Blocks/Execution/flowGraphConsoleLogBlock";
import { FlowGraphTimerBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphTimerBlock";
import { FlowGraphSendCustomEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSendCustomEventBlock";
import { FlowGraphReceiveCustomEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphReceiveCustomEventBlock";
import { FlowGraphSequenceBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSequenceBlock";
// import { FlowGraphGetPropertyBlock } from "core/FlowGraph/Blocks/Data/flowGraphGetPropertyBlock";
// import { FlowGraphSetPropertyBlock } from "core/FlowGraph/Blocks/Data/flowGraphSetPropertyBlock";
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
import { FlowGraphSetVariableBlock } from "core/FlowGraph/Blocks/Data/flowGraphSetVariableBlock";
import { FlowGraphWhileLoopBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphWhileLoopBlock";
import { FlowGraphBranchBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphBranchBlock";
import { FlowGraphForLoopBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphForLoopBlock";
import { FlowGraphMultiGateBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphMultiGateBlock";
import { FlowGraphWaitAllBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphWaitAllBlock";
import { FlowGraphThrottleBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphThrottleBlock";
import { FlowGraphSetDelayBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSetDelayBlock";
import { FlowGraphCancelDelayBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphCancelDelayBlock";
import { FlowGraphGetPropertyBlock } from "core/FlowGraph/Blocks/Data/flowGraphGetPropertyBlock";
import { FlowGraphSetPropertyBlock } from "core/FlowGraph/Blocks/Data/flowGraphSetPropertyBlock";
import { FlowGraphPlayAnimationBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphPlayAnimationBlock";
import { FlowGraphStopAnimationBlock } from "core/FlowGraph/Blocks/Execution/Animation/flowGraphStopAnimationBlock";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";

interface IGLTFToFlowGraphMappingObject<I = any, O = any> {
    /**
     * The name of the property in the FlowGraph block.
     */
    name: string;
    /**
     * The type of the property in the glTF specs.
     * If not provided will be inferred.
     */
    gltfType?: string;
    /**
     * The type of the property in the FlowGraph block.
     * If not defined it equals the glTF type.
     */
    flowGraphType?: string;
    /**
     * A function that transforms the data from the glTF to the FlowGraph block.
     */
    dataTransformer?: ((data: I) => O) | null;
    /**
     * If the property is in the options passed to the constructor of the block.
     */
    inOptions?: boolean;

    /**
     * If the property is a pointer to a value.
     * This will add an extra JsonPointerParser block to the graph.
     */
    isPointer?: boolean;

    /**
     * If the property is an index to a value.
     * if defined this will be the name of the array to find the object in.
     */
    isIndex?: string;

    /**
     * the name of the class type this value will be mapped to.
     * This is used if we generate more than one block for a single glTF node.
     */
    toBlock?: string;
}

interface IGLTFToFlowGraphMapping {
    /**
     * The type of the FlowGraph block.
     */
    types: [string];
    /**
     * The inputs of the glTF node mapped to the FlowGraph block.
     */
    inputs: {
        /**
         * The value inputs of the glTF node mapped to the FlowGraph block.
         */
        values?: { [originName: string]: IGLTFToFlowGraphMappingObject };
        /**
         * The flow inputs of the glTF node mapped to the FlowGraph block.
         */
        flows?: { [originName: string]: IGLTFToFlowGraphMappingObject };
    };
    /**
     * The outputs of the glTF node mapped to the FlowGraph block.
     */
    outputs: {
        /**
         * The value outputs of the glTF node mapped to the FlowGraph block.
         */
        values?: { [originName: string]: IGLTFToFlowGraphMappingObject };
        /**
         * The flow outputs of the glTF node mapped to the FlowGraph block.
         */
        flows?: { [originName: string]: IGLTFToFlowGraphMappingObject };
    };
    /**
     * The configuration of the glTF node mapped to the FlowGraph block.
     * This information is usually passed to the constructor of the block.
     */
    configuration: { [originName: string]: IGLTFToFlowGraphMappingObject };

    /**
     * If we generate more than one block for a single glTF node, this mapping will be used to map
     * between the flowGraph classes.
     */
    typeToTypeMapping?: { [originName: string]: IGLTFToFlowGraphMappingObject };
}
// this mapper is just a way to convert the glTF nodes to FlowGraph nodes in terms of input/output connection names and values.
export const gltfToFlowGraphMapping: { [key: string]: IGLTFToFlowGraphMapping } = {
    "event/onStart": {
        types: [FlowGraphSceneReadyEventBlock.ClassName],
        inputs: {},
        outputs: {
            flows: {
                out: { name: "out" },
            },
        },
        configuration: {},
    },
    "event/onTick": {
        types: [FlowGraphSceneTickEventBlock.ClassName],
        inputs: {},
        outputs: {
            values: {
                timeSinceStart: { name: "timeSinceStart", gltfType: "number" },
                timeSinceLastTick: { name: "deltaTime", gltfType: "number", dataTransformer: (time: number) => time / 1000 },
            },
            flows: {
                out: { name: "out" },
            },
        },
        configuration: {},
    },
    "event/send": {
        types: [FlowGraphSendCustomEventBlock.ClassName],
        configuration: {
            // event is an INDEX to the events array in the glTF data. so eventId will be taken from the array.
            event: { name: "eventId", gltfType: "number", flowGraphType: "string", inOptions: true },
        },
        inputs: {
            values: {
                // TODO the type(s) for the custom values here is defined by the event itself! will need to see how to handle this.
                // TODO - do we want to add the mapping here?
                "[custom]": { name: "eventData[$1]", gltfType: "array", inOptions: true },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
            },
        },
    },
    "event/receive": {
        types: [FlowGraphReceiveCustomEventBlock.ClassName],
        configuration: {
            // event is an INDEX to the events array in the glTF data. so eventId will be taken from the array.
            event: { name: "eventId", gltfType: "number", flowGraphType: "string", inOptions: true },
        },
        inputs: {
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            values: {
                "[custom]": { name: "eventData", gltfType: "array" },
            },
        },
    },
    "math/e": getSimpleInputMapping(FlowGraphEBlock.ClassName),
    "math/pi": getSimpleInputMapping(FlowGraphPiBlock.ClassName),
    "math/inf": getSimpleInputMapping(FlowGraphInfBlock.ClassName),
    "math/nan": getSimpleInputMapping(FlowGraphNaNBlock.ClassName),
    "math/abs": getSimpleInputMapping(FlowGraphAbsBlock.ClassName),
    "math/sign": getSimpleInputMapping(FlowGraphSignBlock.ClassName),
    "math/trunc": getSimpleInputMapping(FlowGraphTruncBlock.ClassName),
    "math/floor": getSimpleInputMapping(FlowGraphFloorBlock.ClassName),
    "math/ceil": getSimpleInputMapping(FlowGraphCeilBlock.ClassName),
    "math/fract": getSimpleInputMapping(FlowGraphFractBlock.ClassName),
    "math/neg": getSimpleInputMapping(FlowGraphNegBlock.ClassName),
    "math/add": getSimpleInputMapping(FlowGraphAddBlock.ClassName, ["a", "b"]),
    "math/sub": getSimpleInputMapping(FlowGraphSubtractBlock.ClassName, ["a", "b"]),
    "math/mul": getSimpleInputMapping(FlowGraphMultiplyBlock.ClassName, ["a", "b"]),
    "math/div": getSimpleInputMapping(FlowGraphDivideBlock.ClassName, ["a", "b"]),
    "math/rem": getSimpleInputMapping(FlowGraphRemainderBlock.ClassName, ["a", "b"]),
    "math/min": getSimpleInputMapping(FlowGraphMinBlock.ClassName, ["a", "b"]),
    "math/max": getSimpleInputMapping(FlowGraphMaxBlock.ClassName, ["a", "b"]),
    "math/clamp": getSimpleInputMapping(FlowGraphClampBlock.ClassName, ["a", "b", "c"]),
    "math/saturate": getSimpleInputMapping(FlowGraphSaturateBlock.ClassName),
    "math/mix": getSimpleInputMapping(FlowGraphInterpolateBlock.ClassName, ["a", "b", "c"]),
    "math/eq": getSimpleInputMapping(FlowGraphEqBlock.ClassName, ["a", "b"]),
    "math/lt": getSimpleInputMapping(FlowGraphLessThanBlock.ClassName, ["a", "b"]),
    "math/le": getSimpleInputMapping(FlowGraphLessThanOrEqualBlock.ClassName, ["a", "b"]),
    "math/gt": getSimpleInputMapping(FlowGraphGreaterThanBlock.ClassName, ["a", "b"]),
    "math/ge": getSimpleInputMapping(FlowGraphGreaterThanOrEqualBlock.ClassName, ["a", "b"]),
    "math/isnan": getSimpleInputMapping(FlowGraphIsNanBlock.ClassName),
    "math/isinf": getSimpleInputMapping(FlowGraphIsInfBlock.ClassName),
    // TODO!!!
    "math/select": getSimpleInputMapping("TODO"),
    "math/rad": getSimpleInputMapping(FlowGraphDegToRadBlock.ClassName),
    "math/deg": getSimpleInputMapping(FlowGraphRadToDegBlock.ClassName),
    "math/sin": getSimpleInputMapping(FlowGraphSinBlock.ClassName),
    "math/cos": getSimpleInputMapping(FlowGraphCosBlock.ClassName),
    "math/tan": getSimpleInputMapping(FlowGraphTanBlock.ClassName),
    "math/asin": getSimpleInputMapping(FlowGraphAsinBlock.ClassName),
    "math/acos": getSimpleInputMapping(FlowGraphAcosBlock.ClassName),
    "math/atan": getSimpleInputMapping(FlowGraphAtanBlock.ClassName),
    "math/atan2": getSimpleInputMapping(FlowGraphAtan2Block.ClassName, ["a", "b"]),
    "math/sinh": getSimpleInputMapping(FlowGraphSinhBlock.ClassName),
    "math/cosh": getSimpleInputMapping(FlowGraphCoshBlock.ClassName),
    "math/tanh": getSimpleInputMapping(FlowGraphTanhBlock.ClassName),
    "math/asinh": getSimpleInputMapping(FlowGraphAsinhBlock.ClassName),
    "math/acosh": getSimpleInputMapping(FlowGraphAcoshBlock.ClassName),
    "math/atanh": getSimpleInputMapping(FlowGraphAtanhBlock.ClassName),
    "math/exp": getSimpleInputMapping(FlowGraphExpBlock.ClassName),
    "math/log": getSimpleInputMapping(FlowGraphLogBlock.ClassName),
    "math/log2": getSimpleInputMapping(FlowGraphLog2Block.ClassName),
    "math/log10": getSimpleInputMapping(FlowGraphLog10Block.ClassName),
    "math/sqrt": getSimpleInputMapping(FlowGraphSqrtBlock.ClassName),
    "math/cbrt": getSimpleInputMapping(FlowGraphCubeRootBlock.ClassName),
    "math/pow": getSimpleInputMapping(FlowGraphPowBlock.ClassName, ["a", "b"]),
    "math/length": getSimpleInputMapping(FlowGraphLengthBlock.ClassName),
    "math/normalize": getSimpleInputMapping(FlowGraphNormalizeBlock.ClassName),
    "math/dot": getSimpleInputMapping(FlowGraphDotBlock.ClassName, ["a", "b"]),
    "math/cross": getSimpleInputMapping(FlowGraphCrossBlock.ClassName, ["a", "b"]),
    "math/rotate2d": getSimpleInputMapping(FlowGraphRotate2DBlock.ClassName, ["a", "b"]),
    "math/rotate3d": getSimpleInputMapping(FlowGraphRotate3DBlock.ClassName, ["a", "b", "c"]),
    "math/transform": getSimpleInputMapping("TODO"),
    // TODO!!!
    "math/combine2": getSimpleInputMapping("TODO"),
    "math/combine3": getSimpleInputMapping("TODO"),
    "math/combine4": getSimpleInputMapping("TODO"),
    // one input, N outputs! outputs named using numbers.
    "math/extract2": getSimpleInputMapping("TODO"),
    "math/extract3": getSimpleInputMapping("TODO"),
    "math/extract4": getSimpleInputMapping("TODO"),
    "math/transpose": getSimpleInputMapping(FlowGraphTransposeBlock.ClassName),
    "math/determinant": getSimpleInputMapping(FlowGraphDeterminantBlock.ClassName),
    "math/inverse": getSimpleInputMapping(FlowGraphInvertMatrixBlock.ClassName),
    "math/matmul": getSimpleInputMapping(FlowGraphMatMulBlock.ClassName, ["a", "b"]),
    // TODO
    "math/combine4x4": getSimpleInputMapping("TODO"),
    "math/extract4x4": getSimpleInputMapping("TODO"),
    // skipping some int-nodes as they repeat the float ones.
    "math/not": getSimpleInputMapping(FlowGraphBitwiseNotBlock.ClassName),
    "math/and": getSimpleInputMapping(FlowGraphBitwiseAndBlock.ClassName, ["a", "b"]),
    "math/or": getSimpleInputMapping(FlowGraphBitwiseOrBlock.ClassName, ["a", "b"]),
    "math/xor": getSimpleInputMapping(FlowGraphBitwiseXorBlock.ClassName, ["a", "b"]),
    "math/asr": getSimpleInputMapping(FlowGraphBitwiseRightShiftBlock.ClassName, ["a", "b"]),
    "math/lsl": getSimpleInputMapping(FlowGraphBitwiseLeftShiftBlock.ClassName, ["a", "b"]),
    "math/clz": getSimpleInputMapping(FlowGraphCountLeadingZerosBlock.ClassName),
    "math/ctz": getSimpleInputMapping(FlowGraphCountTrailingZerosBlock.ClassName),
    "math/popcnt": getSimpleInputMapping(FlowGraphCountOneBitsBlock.ClassName),
    // TODO
    "type/boolToInt": getSimpleInputMapping("TODO"),
    "type/boolToFloat": getSimpleInputMapping("TODO"),
    "type/intToBool": getSimpleInputMapping("TODO"),
    "type/intToFloat": getSimpleInputMapping("TODO"),
    "type/floatToInt": getSimpleInputMapping("TODO"),
    "type/floatToBool": getSimpleInputMapping("TODO"),

    // flows
    "flow/sequence": {
        types: [FlowGraphSequenceBlock.ClassName],
        configuration: {
            // the number of output flows.
            "[name].length": { name: "numberOutputFlows", inOptions: true },
        },
        inputs: {
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                "[name]": { name: "$1" },
            },
        },
    },
    "flow/branch": {
        types: [FlowGraphBranchBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                condition: { name: "condition", gltfType: "boolean" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                true: { name: "onTrue" },
                false: { name: "onFalse" },
            },
        },
    },
    "flow/switch": {
        types: [FlowGraphBranchBlock.ClassName],
        configuration: {
            cases: { name: "cases", gltfType: "array", inOptions: true },
        },
        inputs: {
            values: {
                selection: { name: "selection", gltfType: "number" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                "[case]": { name: "out_$1" },
                default: { name: "default" },
            },
        },
    },
    "flow/while": {
        types: [FlowGraphWhileLoopBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                condition: { name: "condition", gltfType: "boolean" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                loopBody: { name: "executionFlow" },
                completed: { name: "completed" },
            },
        },
    },
    "flow/for": {
        types: [FlowGraphForLoopBlock.ClassName],
        configuration: {
            initialIndex: { name: "initialIndex", gltfType: "number", inOptions: true },
        },
        inputs: {
            values: {
                startIndex: { name: "startIndex", gltfType: "number" },
                endIndex: { name: "endIndex", gltfType: "number" },
                // no step
                // step: { name: "step", gltfType: "number" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            values: {
                index: { name: "index" },
            },
            flows: {
                loopBody: { name: "loopBody" },
                completed: { name: "completed" },
            },
        },
    },
    "flow/doN": {
        types: [FlowGraphDoNBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                n: { name: "maxExecutions", gltfType: "number" },
            },
            flows: {
                reset: { name: "reset" },
                in: { name: "in" },
            },
        },
        outputs: {
            values: {
                currentCount: { name: "executionCount" },
            },
            flows: {
                out: { name: "out" },
            },
        },
    },
    "flow/multiGate": {
        types: [FlowGraphMultiGateBlock.ClassName],
        configuration: {
            isRandom: { name: "isRandom", gltfType: "boolean", inOptions: true },
            isLoop: { name: "isLoop", gltfType: "boolean", inOptions: true },
        },
        inputs: {
            flows: {
                reset: { name: "reset" },
                in: { name: "in" },
            },
        },
        outputs: {
            values: {
                lastIndex: { name: "lastIndex" },
            },
            flows: {
                "[name]": { name: "$1" },
                "pname].length": { name: "numberOutputFlows", inOptions: true },
            },
        },
    },
    "flow/waitAll": {
        types: [FlowGraphWaitAllBlock.ClassName],
        configuration: {
            inputFlows: { name: "inputFlows", gltfType: "number", inOptions: true },
        },
        inputs: {
            flows: {
                reset: { name: "reset" },
                // or "in_$1" ?
                "[i]": { name: "inFlows[$1]" },
            },
        },
        outputs: {
            values: {
                remainingInputs: { name: "remainingInputs" },
            },
            flows: {
                completed: { name: "completed" },
                out: { name: "out" },
            },
        },
    },
    "flow/throttle": {
        types: [FlowGraphThrottleBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                duration: { name: "duration", gltfType: "number" },
            },
            flows: {
                in: { name: "in" },
                reset: { name: "reset" },
            },
        },
        outputs: {
            values: {
                lastRemainingTime: { name: "lastRemainingTime" },
            },
            flows: {
                out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
    "flow/setDelay": {
        types: [FlowGraphSetDelayBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                duration: { name: "duration", gltfType: "number" },
            },
            flows: {
                in: { name: "in" },
                cancel: { name: "cancel" },
            },
        },
        outputs: {
            values: {
                lastDelayIndex: { name: "lastDelayIndex" },
            },
            flows: {
                out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
    "flow/cancelDelay": {
        types: [FlowGraphCancelDelayBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                delayIndex: { name: "delayIndex", gltfType: "number" },
            },
            flows: {
                in: { name: "cancel" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
            },
        },
    },
    "variable/get": {
        types: [FlowGraphGetVariableBlock.ClassName],
        configuration: {
            variable: { name: "variable", gltfType: "number", flowGraphType: "string", inOptions: true, dataTransformer: (index: number) => `variable_${index}` },
        },
        inputs: {},
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    "variable/set": {
        types: [FlowGraphSetVariableBlock.ClassName],
        configuration: {
            variable: { name: "variable", gltfType: "number", flowGraphType: "string", inOptions: true, dataTransformer: (index: number) => `variable_${index}` },
        },
        inputs: {
            values: {
                value: { name: "value" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
            },
        },
    },
    "pointer/get": {
        types: [FlowGraphGetPropertyBlock.ClassName],
        configuration: {
            pointer: { name: "object;propertyName", isPointer: true },
        },
        inputs: {
            values: {
                "[segment]": { name: "$1", toBlock: "pointer" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
                isValid: { name: "isValid" },
            },
        },
    },
    "pointer/set": {
        types: [FlowGraphSetPropertyBlock.ClassName],
        configuration: {
            pointer: { name: "object;propertyName", isPointer: true },
        },
        inputs: {
            values: {
                value: { name: "value" },
                "[segment]": { name: "$1", toBlock: "pointer" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
    "pointer/interpolate": {
        types: [FlowGraphBlockNames.Interpolation],
        configuration: {
            pointer: { name: "object;propertyName", isPointer: true },
        },
        inputs: {
            values: {
                value: { name: "value" },
                "[segment]": { name: "$1", toBlock: "pointer" },
                duration: { name: "duration", gltfType: "number" /*, inOptions: true */ },
                p1: { name: "initialValue", gltfType: "number" /*, inOptions: true*/ },
                p2: { name: "endValue", gltfType: "number" /*, inOptions: true*/ },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
    "animation/start": {
        types: [FlowGraphPlayAnimationBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                animation: { name: "animation", gltfType: "number", flowGraphType: "animation", isIndex: "animation" },
                speed: { name: "speed", gltfType: "number" },
                // 60 is a const from the glTF loader
                startTime: { name: "from", gltfType: "number", dataTransformer: (time: number) => time / 60 },
                endTime: { name: "to", gltfType: "number", dataTransformer: (time: number) => time / 60 },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
                err: { name: "error" },
                done: { name: "done" },
            },
        },
    },
    "animation/stop": {
        types: [FlowGraphStopAnimationBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                animation: { name: "animation", gltfType: "number", flowGraphType: "animation", isIndex: "animation" },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
    "animation/stopAt": {
        types: [FlowGraphStopAnimationBlock.ClassName],
        configuration: {},
        inputs: {
            values: {
                animation: { name: "animation", gltfType: "number", flowGraphType: "animation", isIndex: "animation" },
                stopTime: { name: "stopAtFrame", gltfType: "number", dataTransformer: (time: number) => time / 60 },
            },
            flows: {
                in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
};

function getSimpleInputMapping(type: string, inputs: string[] = ["a"]): IGLTFToFlowGraphMapping {
    return {
        types: [type],
        inputs: {
            values: inputs.reduce(
                (acc, input) => {
                    acc[input] = { name: input };
                    return acc;
                },
                {} as { [key: string]: { name: string } }
            ),
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
        configuration: {},
    };
}

export const gltfToFlowGraphTypeMap: { [key: string]: string } = {
    "event/onStart": FlowGraphSceneReadyEventBlock.ClassName,
    "event/onTick": FlowGraphSceneTickEventBlock.ClassName,
    log: FlowGraphConsoleLogBlock.ClassName,
    "flow/delay": FlowGraphTimerBlock.ClassName,
    "event/send": FlowGraphSendCustomEventBlock.ClassName,
    "event/receive": FlowGraphReceiveCustomEventBlock.ClassName,
    "flow/sequence": FlowGraphSequenceBlock.ClassName,
    // "world/get": FlowGraphGetPropertyBlock.ClassName,
    // "world/set": FlowGraphSetPropertyBlock.ClassName,
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
