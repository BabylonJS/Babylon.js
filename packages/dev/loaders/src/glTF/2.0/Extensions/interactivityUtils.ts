/* eslint-disable @typescript-eslint/naming-convention */
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
        types: [FlowGraphBlockNames.SceneReadyEvent],
        inputs: {},
        outputs: {
            flows: {
                out: { name: "out" },
            },
        },
        configuration: {},
    },
    "event/onTick": {
        types: [FlowGraphBlockNames.SceneTickEvent],
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
        types: [FlowGraphBlockNames.SendCustomEvent],
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
        types: [FlowGraphBlockNames.ReceiveCustomEvent],
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
    "math/e": getSimpleInputMapping(FlowGraphBlockNames.E),
    "math/pi": getSimpleInputMapping(FlowGraphBlockNames.PI),
    "math/inf": getSimpleInputMapping(FlowGraphBlockNames.Inf),
    "math/nan": getSimpleInputMapping(FlowGraphBlockNames.NaN),
    "math/abs": getSimpleInputMapping(FlowGraphBlockNames.Abs),
    "math/sign": getSimpleInputMapping(FlowGraphBlockNames.Sign),
    "math/trunc": getSimpleInputMapping(FlowGraphBlockNames.Trunc),
    "math/floor": getSimpleInputMapping(FlowGraphBlockNames.Floor),
    "math/ceil": getSimpleInputMapping(FlowGraphBlockNames.Ceil),
    "math/fract": getSimpleInputMapping(FlowGraphBlockNames.Fract),
    "math/neg": getSimpleInputMapping(FlowGraphBlockNames.Negation),
    "math/add": getSimpleInputMapping(FlowGraphBlockNames.Add, ["a", "b"]),
    "math/sub": getSimpleInputMapping(FlowGraphBlockNames.Subtract, ["a", "b"]),
    "math/mul": getSimpleInputMapping(FlowGraphBlockNames.Multiply, ["a", "b"]),
    "math/div": getSimpleInputMapping(FlowGraphBlockNames.Divide, ["a", "b"]),
    "math/rem": getSimpleInputMapping(FlowGraphBlockNames.Modulo, ["a", "b"]),
    "math/min": getSimpleInputMapping(FlowGraphBlockNames.Min, ["a", "b"]),
    "math/max": getSimpleInputMapping(FlowGraphBlockNames.Max, ["a", "b"]),
    "math/clamp": getSimpleInputMapping(FlowGraphBlockNames.Clamp, ["a", "b", "c"]),
    "math/saturate": getSimpleInputMapping(FlowGraphBlockNames.Saturate),
    "math/mix": getSimpleInputMapping(FlowGraphBlockNames.MathInterpolation, ["a", "b", "c"]),
    "math/eq": getSimpleInputMapping(FlowGraphBlockNames.Equality, ["a", "b"]),
    "math/lt": getSimpleInputMapping(FlowGraphBlockNames.LessThan, ["a", "b"]),
    "math/le": getSimpleInputMapping(FlowGraphBlockNames.LessThanOrEqual, ["a", "b"]),
    "math/gt": getSimpleInputMapping(FlowGraphBlockNames.GreaterThan, ["a", "b"]),
    "math/ge": getSimpleInputMapping(FlowGraphBlockNames.GreaterThanOrEqual, ["a", "b"]),
    "math/isnan": getSimpleInputMapping(FlowGraphBlockNames.IsNaN),
    "math/isinf": getSimpleInputMapping(FlowGraphBlockNames.IsInfinity),
    // TODO!!!
    "math/asin": getSimpleInputMapping(FlowGraphBlockNames.Asin),
    "math/acos": getSimpleInputMapping(FlowGraphBlockNames.Acos),
    "math/atan": getSimpleInputMapping(FlowGraphBlockNames.Atan),
    "math/atan2": getSimpleInputMapping(FlowGraphBlockNames.Atan2, ["a", "b"]),
    "math/sinh": getSimpleInputMapping(FlowGraphBlockNames.Sinh),
    "math/cosh": getSimpleInputMapping(FlowGraphBlockNames.Cosh),
    "math/tanh": getSimpleInputMapping(FlowGraphBlockNames.Tanh),
    "math/asinh": getSimpleInputMapping(FlowGraphBlockNames.Asinh),
    "math/acosh": getSimpleInputMapping(FlowGraphBlockNames.Acosh),
    "math/atanh": getSimpleInputMapping(FlowGraphBlockNames.Atanh),
    "math/exp": getSimpleInputMapping(FlowGraphBlockNames.Exponential),
    "math/log": getSimpleInputMapping(FlowGraphBlockNames.Log),
    "math/log2": getSimpleInputMapping(FlowGraphBlockNames.Log2),
    "math/log10": getSimpleInputMapping(FlowGraphBlockNames.Log10),
    "math/sqrt": getSimpleInputMapping(FlowGraphBlockNames.SquareRoot),
    "math/cbrt": getSimpleInputMapping(FlowGraphBlockNames.CubeRoot),
    "math/pow": getSimpleInputMapping(FlowGraphBlockNames.Power, ["a", "b"]),
    "math/length": getSimpleInputMapping(FlowGraphBlockNames.Length),
    "math/normalize": getSimpleInputMapping(FlowGraphBlockNames.Normalize),
    "math/dot": getSimpleInputMapping(FlowGraphBlockNames.Dot, ["a", "b"]),
    "math/cross": getSimpleInputMapping(FlowGraphBlockNames.Cross, ["a", "b"]),
    "math/rotate2d": getSimpleInputMapping(FlowGraphBlockNames.Rotate2d, ["a", "b"]),
    "math/rotate3d": getSimpleInputMapping(FlowGraphBlockNames.Rotate3d, ["a", "b", "c"]),
    "math/transform": getSimpleInputMapping("TODO"),
    // TODO!!!
    "math/combine2": getSimpleInputMapping("TODO"),
    "math/combine3": getSimpleInputMapping("TODO"),
    "math/combine4": getSimpleInputMapping("TODO"),
    // one input, N outputs! outputs named using numbers.
    "math/extract2": getSimpleInputMapping("TODO"),
    "math/extract3": getSimpleInputMapping("TODO"),
    "math/extract4": getSimpleInputMapping("TODO"),
    "math/transpose": getSimpleInputMapping(FlowGraphBlockNames.Transpose),
    "math/determinant": getSimpleInputMapping(FlowGraphBlockNames.Determinant),
    "math/inverse": getSimpleInputMapping(FlowGraphBlockNames.InvertMatrix),
    "math/matmul": getSimpleInputMapping(FlowGraphBlockNames.MatrixMultiplication, ["a", "b"]),
    // TODO
    "math/combine4x4": getSimpleInputMapping("TODO"),
    "math/extract4x4": getSimpleInputMapping("TODO"),
    // skipping some int-nodes as they repeat the float ones.
    "math/not": getSimpleInputMapping(FlowGraphBlockNames.BitwiseNot),
    "math/and": getSimpleInputMapping(FlowGraphBlockNames.BitwiseAnd, ["a", "b"]),
    "math/or": getSimpleInputMapping(FlowGraphBlockNames.BitwiseOr, ["a", "b"]),
    "math/xor": getSimpleInputMapping(FlowGraphBlockNames.BitwiseXor, ["a", "b"]),
    "math/asr": getSimpleInputMapping(FlowGraphBlockNames.BitwiseRightShift, ["a", "b"]),
    "math/lsl": getSimpleInputMapping(FlowGraphBlockNames.BitwiseLeftShift, ["a", "b"]),
    "math/clz": getSimpleInputMapping(FlowGraphBlockNames.LeadingZeros),
    "math/ctz": getSimpleInputMapping(FlowGraphBlockNames.TrailingZeros),
    "math/popcnt": getSimpleInputMapping(FlowGraphBlockNames.OneBitsCounter),
    // TODO
    "type/boolToInt": getSimpleInputMapping("TODO"),
    "type/boolToFloat": getSimpleInputMapping("TODO"),
    "type/intToBool": getSimpleInputMapping("TODO"),
    "type/intToFloat": getSimpleInputMapping("TODO"),
    "type/floatToInt": getSimpleInputMapping("TODO"),
    "type/floatToBool": getSimpleInputMapping("TODO"),

    // flows
    "flow/sequence": {
        types: [FlowGraphBlockNames.Sequence],
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
        types: [FlowGraphBlockNames.Branch],
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
        types: [FlowGraphBlockNames.Switch],
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
        types: [FlowGraphBlockNames.WhileLoop],
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
        types: [FlowGraphBlockNames.ForLoop],
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
        types: [FlowGraphBlockNames.DoN],
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
        types: [FlowGraphBlockNames.MultiGate],
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
        types: [FlowGraphBlockNames.WaitAll],
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
        types: [FlowGraphBlockNames.Throttle],
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
        types: [FlowGraphBlockNames.SetDelay],
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
        types: [FlowGraphBlockNames.CancelDelay],
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
        types: [FlowGraphBlockNames.GetVariable],
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
        types: [FlowGraphBlockNames.SetVariable],
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
        types: [FlowGraphBlockNames.GetProperty],
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
        types: [FlowGraphBlockNames.SetProperty],
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
        types: [FlowGraphBlockNames.ValueInterpolation],
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
        types: [FlowGraphBlockNames.PlayAnimation],
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
        types: [FlowGraphBlockNames.StopAnimation],
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
        types: [FlowGraphBlockNames.StopAnimation],
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
