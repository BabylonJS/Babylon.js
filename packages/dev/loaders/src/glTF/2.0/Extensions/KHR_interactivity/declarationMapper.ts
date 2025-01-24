/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity_Declaration, IKHRInteractivity_Node } from "babylonjs-gltf2interface";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { Logger } from "core/Misc/logger";
import { ISerializedFlowGraphBlock, ISerializedFlowGraphContext } from "core/src/FlowGraph/typeDefinitions";
import { InteractivityEvent, InteractivityGraphToFlowGraphParser } from "./interactivityGraphParser";
import { IGLTF } from "../../glTFLoaderInterfaces";

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
    dataTransformer?: ((data: I, array?: any[], container?: { [originName: string]: IGLTFToFlowGraphMappingObject }) => O) | null;
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
    isVariable?: boolean;

    /**
     * the name of the class type this value will be mapped to.
     * This is used if we generate more than one block for a single glTF node.
     * Defaults to the first block in the mapping.
     */
    toBlock?: FlowGraphBlockNames;
}

export interface IGLTFToFlowGraphMapping {
    /**
     * The type of the FlowGraph block(s).
     * Typically will be a single element in an array
     */
    blocks: FlowGraphBlockNames[];
    /**
     * The inputs of the glTF node mapped to the FlowGraph block.
     */
    inputs?: {
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
    outputs?: {
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
    configuration?: { [originName: string]: IGLTFToFlowGraphMappingObject };

    /**
     * If we generate more than one block for a single glTF node, this mapping will be used to map
     * between the flowGraph classes.
     */
    typeToTypeMapping?: { [originName: string]: IGLTFToFlowGraphMappingObject };

    /**
     * The connections between two or more blocks.
     * This is used to connect the blocks in the graph
     */
    interBlockConnectors?: {
        /**
         * The name of the input connection in the first block.
         */
        input: string;
        /**
         * The name of the output connection in the second block.
         */
        output: string;

        /**
         * The index of the block in the array of blocks that corresponds to the input.
         */
        inputBlockIndex: number;
        /**
         * The index of the block in the array of blocks that corresponds to the output.
         */
        outputBlockIndex: number;
        /**
         * If the connection is a variable connection or a flow connection.
         */
        isVariable?: boolean;
    }[];

    /**
     * This is used if we need extra information for the constructor/options that is not provided directly by the glTF node.
     * This function can return more than one node, if extra nodes are needed for this block to function correctly.
     * Returning more than one block will usually happen when a json pointer was provided.
     *
     * TODO - semantically this doesn't belong here, as it is not a mapping, but a processor.
     *
     * @param gltfBlock the glTF node
     * @param mapping the mapping object
     * @param arrays the arrays of the interactivity object
     * @param serializedObjects the serialized object
     * @returns an array of serialized nodes that will be added to the graph.
     */
    extraProcessor?: (
        gltfBlock: IKHRInteractivity_Node,
        declaration: IKHRInteractivity_Declaration,
        mapping: IGLTFToFlowGraphMapping,
        parser: InteractivityGraphToFlowGraphParser,
        serializedObjects: ISerializedFlowGraphBlock[],
        context: ISerializedFlowGraphContext,
        globalGLTF?: IGLTF
    ) => ISerializedFlowGraphBlock[];
}

export function getMappingForFullOperationName(fullOperationName: string) {
    const [op, extension] = fullOperationName.split(":");
    return getMappingForDeclaration({ op, extension });
}

export function getMappingForDeclaration(declaration: IKHRInteractivity_Declaration, returnNoOpIfNotAvailable: boolean = true): IGLTFToFlowGraphMapping | undefined {
    const mapping = declaration.extension ? gltfExtensionsToFlowGraphMapping[declaration.extension]?.[declaration.op] : gltfToFlowGraphMapping[declaration.op];
    if (!mapping) {
        Logger.Warn(`No mapping found for operation ${declaration.op} and extension ${declaration.extension || "KHR_interactivity"}`);
        if (returnNoOpIfNotAvailable) {
            const inputs: IGLTFToFlowGraphMapping["inputs"] = {};
            const outputs: IGLTFToFlowGraphMapping["outputs"] = {
                flows: {},
            };
            if (declaration.inputValueSockets) {
                inputs.values = {};
                Object.keys(declaration.inputValueSockets).forEach((key) => {
                    inputs.values![key] = {
                        name: key,
                    };
                });
            }
            if (declaration.outputValueSockets) {
                outputs.values = {};
                Object.keys(declaration.outputValueSockets).forEach((key) => {
                    outputs.values![key] = {
                        name: key,
                    };
                });
            }
            return {
                blocks: [], // no blocks, just mapping
                inputs,
                outputs,
            };
        }
    }
    return mapping;
}

/**
 * This function will add new mapping to glTF interactivity.
 * Other extensions can define new types of blocks, this is the way to let interactivity know how to parse them.
 * @param key the type of node, i.e. "variable/get"
 * @param extension the extension of the interactivity operation, i.e. "KHR_selectability"
 * @param mapping The mapping object. See documentation or examples below.
 */
export function addNewInteractivityFlowGraphMapping(key: string, extension: string, mapping: IGLTFToFlowGraphMapping) {
    gltfExtensionsToFlowGraphMapping[extension] = gltfExtensionsToFlowGraphMapping[extension] || {};
    gltfExtensionsToFlowGraphMapping[extension][key] = mapping;
}

// /**
//  * Get the mapping for a specific type of node.
//  * @param operation the type of node, i.e. "variable/get"
//  * @param extension the extension of the interactivity operation, i.e. "KHR_selectability"
//  * @returns the mapping gltf to flow graph
//  */
// export function getMappingForOperation(operation: string, extension?: string): IGLTFToFlowGraphMapping | undefined {
//     const mapping = extension ? gltfExtensionsToFlowGraphMapping[extension]?.[operation] : gltfToFlowGraphMapping[operation];
//     return mapping;
// }

const gltfExtensionsToFlowGraphMapping: { [extension: string]: { [key: string]: IGLTFToFlowGraphMapping } } = {
    BABYLON_Logging: {
        "babylon/log": {
            blocks: [FlowGraphBlockNames.ConsoleLog],
            configuration: {},
            inputs: {
                flows: {
                    // in: { name: "in" },
                },
                values: {
                    message: { name: "message" },
                },
            },
            outputs: {
                flows: {
                    // out: { name: "out" },
                },
            },
        },
    },
};

// this mapper is just a way to convert the glTF nodes to FlowGraph nodes in terms of input/output connection names and values.
const gltfToFlowGraphMapping: { [key: string]: IGLTFToFlowGraphMapping } = {
    "event/onStart": {
        blocks: [FlowGraphBlockNames.SceneReadyEvent],
        outputs: {
            flows: {
                out: { name: "done" },
            },
        },
    },
    "event/onTick": {
        blocks: [FlowGraphBlockNames.SceneTickEvent],
        inputs: {},
        outputs: {
            values: {
                timeSinceLastTick: { name: "deltaTime", gltfType: "number" /*, dataTransformer: (time: number) => time / 1000*/ },
            },
            flows: {
                out: { name: "done" },
            },
        },
        configuration: {},
    },
    "event/send": {
        blocks: [FlowGraphBlockNames.SendCustomEvent],
        outputs: {
            flows: {
                out: { name: "done" },
            },
        },
        extraProcessor(gltfBlock, declaration, _mapping, parser, serializedObjects) {
            // set eventId and eventData. The configuration object of the glTF shoudl have a single(!) object.
            // validate that we are running it on the right block.
            if (declaration.op !== "event/send" || !gltfBlock.configuration || Object.keys(gltfBlock.configuration).length !== 1) {
                throw new Error("Receive event should have a single configuration object, the event itself");
            }
            const eventConfiguration = gltfBlock.configuration[0];
            const event: InteractivityEvent = parser.arrays.events[eventConfiguration.value];
            const serializedObject = serializedObjects[0];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.eventId = event.eventId;
            serializedObject.config.eventData = event.eventData;
            return serializedObjects;
        },
    },
    "event/receive": {
        blocks: [FlowGraphBlockNames.ReceiveCustomEvent],
        outputs: {
            flows: {
                out: { name: "done" },
            },
        },
        // extraProcessor(gltfBlock, _mapping, arrays, serializedObjects) {
        //     // set eventId and eventData. The configuration object of the glTF shoudl have a single(!) object.
        //     // validate that we are running it on the right block.
        //     if (gltfBlock.type !== "event/receive" || !gltfBlock.configuration || Object.keys(gltfBlock.configuration).length !== 1) {
        //         throw new Error("Receive event should have a single configuration object, the event itself");
        //     }
        //     const eventConfiguration = gltfBlock.configuration[0];
        //     const event: InteractivityEvent = arrays.events[eventConfiguration.value];
        //     const serializedObject = serializedObjects[0];
        //     serializedObject.config = serializedObject.config || {};
        //     serializedObject.config.eventId = event.eventId;
        //     serializedObject.config.eventData = event.eventData;
        //     return serializedObjects;
        // },
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
    "math/select": {
        blocks: [FlowGraphBlockNames.Conditional],
        configuration: {},
        inputs: {
            values: {
                condition: { name: "condition" },
                // Should we validate those have the same type here, or assume it is already validated?
                a: { name: "onTrue" },
                b: { name: "onFalse" },
            },
        },
        outputs: {
            values: {
                value: { name: "output" },
            },
        },
    },
    "math/sin": getSimpleInputMapping(FlowGraphBlockNames.Sin),
    "math/cos": getSimpleInputMapping(FlowGraphBlockNames.Cos),
    "math/tan": getSimpleInputMapping(FlowGraphBlockNames.Tan),
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
    "math/rotate2d": getSimpleInputMapping(FlowGraphBlockNames.Rotate2D, ["a", "b"]),
    "math/rotate3d": getSimpleInputMapping(FlowGraphBlockNames.Rotate3D, ["a", "b", "c"]),
    "math/transform": {
        // glTF transform is vector4 to matrix4x4
        blocks: [FlowGraphBlockNames.TransformVector4],
        configuration: {},
        inputs: {
            values: {
                a: { name: "a", gltfType: "float4" },
                b: { name: "b", gltfType: "float4x4" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    "math/combine2": {
        blocks: [FlowGraphBlockNames.CombineVector2],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input_0", gltfType: "number" },
                b: { name: "input_1", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    "math/combine3": {
        blocks: [FlowGraphBlockNames.CombineVector3],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input_0", gltfType: "number" },
                b: { name: "input_1", gltfType: "number" },
                c: { name: "input_2", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    "math/combine4": {
        blocks: [FlowGraphBlockNames.CombineVector4],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input_0", gltfType: "number" },
                b: { name: "input_1", gltfType: "number" },
                c: { name: "input_2", gltfType: "number" },
                d: { name: "input_3", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    // one input, N outputs! outputs named using numbers.
    "math/extract2": {
        blocks: [FlowGraphBlockNames.ExtractVector2],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                "0": { name: "output_0" },
                "1": { name: "output_1" },
            },
        },
    },
    "math/extract3": {
        blocks: [FlowGraphBlockNames.ExtractVector3],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                "0": { name: "output_0" },
                "1": { name: "output_1" },
                "2": { name: "output_2" },
            },
        },
    },
    "math/extract4": {
        blocks: [FlowGraphBlockNames.ExtractVector4],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                "0": { name: "output_0" },
                "1": { name: "output_1" },
                "2": { name: "output_2" },
                "3": { name: "output_3" },
            },
        },
    },
    "math/transpose": getSimpleInputMapping(FlowGraphBlockNames.Transpose),
    "math/determinant": getSimpleInputMapping(FlowGraphBlockNames.Determinant),
    "math/inverse": getSimpleInputMapping(FlowGraphBlockNames.InvertMatrix),
    "math/matmul": getSimpleInputMapping(FlowGraphBlockNames.MatrixMultiplication, ["a", "b"]),
    // TODO
    "math/combine4x4": {
        blocks: [FlowGraphBlockNames.CombineMatrix],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input_0", gltfType: "number" },
                b: { name: "input_1", gltfType: "number" },
                c: { name: "input_2", gltfType: "number" },
                d: { name: "input_3", gltfType: "number" },
                e: { name: "input_4", gltfType: "number" },
                f: { name: "input_5", gltfType: "number" },
                g: { name: "input_6", gltfType: "number" },
                h: { name: "input_7", gltfType: "number" },
                i: { name: "input_8", gltfType: "number" },
                j: { name: "input_9", gltfType: "number" },
                k: { name: "input_10", gltfType: "number" },
                l: { name: "input_11", gltfType: "number" },
                m: { name: "input_12", gltfType: "number" },
                n: { name: "input_13", gltfType: "number" },
                o: { name: "input_14", gltfType: "number" },
                p: { name: "input_15", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    "math/extract4x4": {
        blocks: [FlowGraphBlockNames.ExtractMatrix],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                "0": { name: "output_0" },
                "1": { name: "output_1" },
                "2": { name: "output_2" },
                "3": { name: "output_3" },
                "4": { name: "output_4" },
                "5": { name: "output_5" },
                "6": { name: "output_6" },
                "7": { name: "output_7" },
                "8": { name: "output_8" },
                "9": { name: "output_9" },
                "10": { name: "output_10" },
                "11": { name: "output_11" },
                "12": { name: "output_12" },
                "13": { name: "output_13" },
                "14": { name: "output_14" },
                "15": { name: "output_15" },
            },
        },
    },
    "math/compose": {
        blocks: [FlowGraphBlockNames.MatrixCompose],
        configuration: {},
        inputs: {
            values: {
                translation: { name: "position", gltfType: "float3" },
                rotation: { name: "rotationQuaternion", gltfType: "float4" },
                scale: { name: "scaling", gltfType: "float3" },
            },
        },
        outputs: {
            values: {
                value: { name: "output" },
            },
        },
    },
    "math/decompose": {
        blocks: [FlowGraphBlockNames.MatrixDecompose],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input" },
            },
        },
        outputs: {
            values: {
                translation: { name: "position" },
                rotation: { name: "rotationQuaternion" },
                scale: { name: "scaling" },
            },
        },
    },
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
    "math/rad": getSimpleInputMapping(FlowGraphBlockNames.DegToRad),
    "math/deg": getSimpleInputMapping(FlowGraphBlockNames.RadToDeg),
    "type/boolToInt": getSimpleInputMapping(FlowGraphBlockNames.BooleanToInt),
    "type/boolToFloat": getSimpleInputMapping(FlowGraphBlockNames.BooleanToFloat),
    "type/intToBool": getSimpleInputMapping(FlowGraphBlockNames.IntToBoolean),
    "type/intToFloat": getSimpleInputMapping(FlowGraphBlockNames.IntToFloat),
    "type/floatToInt": getSimpleInputMapping(FlowGraphBlockNames.FloatToInt),
    "type/floatToBool": getSimpleInputMapping(FlowGraphBlockNames.FloatToBoolean),

    // flows
    "flow/sequence": {
        blocks: [FlowGraphBlockNames.Sequence],
        // extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects) {
        //     // TODO - removing this prevents proper validation
        //     // if (gltfBlock.type !== "flow/sequence" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
        //     //     throw new Error("Sequence should have a single configuration object, the number of output flows");
        //     // }
        //     const serializedObject = serializedObjects[0];
        //     serializedObject.config = serializedObject.config || {};
        //     serializedObject.config.numberOutputFlows = Object.keys(gltfBlock.flows || []).length || 1;
        //     serializedObject.signalOutputs.forEach((output, index) => {
        //         output.name = "out_" + index;
        //     });
        //     return serializedObjects;
        // },
    },
    "flow/branch": {
        blocks: [FlowGraphBlockNames.Branch],
        outputs: {
            flows: {
                true: { name: "onTrue" },
                false: { name: "onFalse" },
            },
        },
    },
    "flow/switch": {
        blocks: [FlowGraphBlockNames.Switch],
        configuration: {
            cases: { name: "cases", gltfType: "array", inOptions: true },
        },
        // extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects) {
        //     // convert all names of output flow to out_$1 apart from "default"
        //     if (gltfBlock.type !== "flow/switch" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
        //         throw new Error("Switch should have a single configuration object, the cases array");
        //     }
        //     const serializedObject = serializedObjects[0];
        //     serializedObject.signalOutputs.forEach((output) => {
        //         if (output.name !== "default") {
        //             output.name = "out_" + output.name;
        //         }
        //     });
        //     return serializedObjects;
        // },
    },
    "flow/while": {
        blocks: [FlowGraphBlockNames.WhileLoop],
        outputs: {
            flows: {
                loopBody: { name: "executionFlow" },
            },
        },
    },
    "flow/for": {
        blocks: [FlowGraphBlockNames.ForLoop],
        configuration: {
            initialIndex: { name: "initialIndex", gltfType: "number", inOptions: true },
        },
        inputs: {
            values: {
                startIndex: { name: "startIndex", gltfType: "number" },
                endIndex: { name: "endIndex", gltfType: "number" },
                // TODO no step available
                // step: { name: "step", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                index: { name: "index" },
            },
        },
    },
    "flow/doN": {
        blocks: [FlowGraphBlockNames.DoN],
        configuration: {},
        inputs: {
            values: {
                n: { name: "maxExecutions", gltfType: "number" },
            },
        },
        outputs: {
            values: {
                currentCount: { name: "executionCount" },
            },
        },
    },
    "flow/multiGate": {
        blocks: [FlowGraphBlockNames.MultiGate],
        configuration: {
            isRandom: { name: "isRandom", gltfType: "boolean", inOptions: true },
            isLoop: { name: "isLoop", gltfType: "boolean", inOptions: true },
        },
        // extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects) {
        //     if (gltfBlock.type !== "flow/multiGate" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
        //         throw new Error("MultiGate should have a single configuration object, the number of output flows");
        //     }
        //     const serializedObject = serializedObjects[0];
        //     serializedObject.config = serializedObject.config || {};
        //     serializedObject.config.numberOutputFlows = Object.keys(gltfBlock.flows).length;
        //     return serializedObjects;
        // },
    },
    "flow/waitAll": {
        blocks: [FlowGraphBlockNames.WaitAll],
        configuration: {
            inputFlows: { name: "inputFlows", gltfType: "number", inOptions: true },
        },
        // extraProcessor(_gltfBlock, _mapping, _arrays, serializedObjects) {
        //     // process the input flows and add them to the inFlow array
        //     // take all input flows and convert their names correctly to "in_$1"
        //     const serializedObject = serializedObjects[0];
        //     serializedObject.signalInputs.forEach((input) => {
        //         input.name = "in_" + input.name;
        //     });
        //     return serializedObjects;
        // },
    },
    "flow/throttle": {
        blocks: [FlowGraphBlockNames.Throttle],
        outputs: {
            flows: {
                // out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
    "flow/setDelay": {
        blocks: [FlowGraphBlockNames.SetDelay],
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
    },
    "flow/cancelDelay": {
        blocks: [FlowGraphBlockNames.CancelDelay],
    },
    "variable/get": {
        blocks: [FlowGraphBlockNames.GetVariable],
        configuration: {
            variable: {
                name: "variable",
                gltfType: "number",
                flowGraphType: "string",
                inOptions: true,
                isVariable: true,
                dataTransformer(index, variables) {
                    return variables?.[index].name;
                },
            },
        },
    },
    "variable/set": {
        blocks: [FlowGraphBlockNames.SetVariable],
        configuration: {
            variable: {
                name: "variable",
                gltfType: "number",
                flowGraphType: "string",
                inOptions: true,
                isVariable: true,
                dataTransformer(index, variables) {
                    return variables?.[index].name;
                },
            },
        },
    },
    "pointer/get": {
        blocks: [FlowGraphBlockNames.GetProperty, FlowGraphBlockNames.JsonPointerParser],
        configuration: {
            pointer: { name: "jsonPointer", toBlock: FlowGraphBlockNames.JsonPointerParser },
        },
        inputs: {
            values: {
                "[segment]": { name: "$1", toBlock: FlowGraphBlockNames.JsonPointerParser },
            },
        },
        interBlockConnectors: [
            {
                input: "object",
                output: "object",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "propertyName",
                output: "propertyName",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "customGetFunction",
                output: "getFunction",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
        ],
        // extraProcessor(_gltfBlock, _mapping, arrays, serializedObjects, _context, _globalGLTF) {
        //     // // connect the pointer to the getProperty block
        //     // connectFlowGraphNodes("object", "object", serializedObjects[0], serializedObjects[1], true);
        //     // connectFlowGraphNodes("propertyName", "propertyName", serializedObjects[0], serializedObjects[1], true);
        //     // connectFlowGraphNodes("customGetFunction", "getFunction", serializedObjects[0], serializedObjects[1], true);
        //     // return serializedObjects;
        // },
    },
    "pointer/set": {
        blocks: [FlowGraphBlockNames.SetProperty, FlowGraphBlockNames.JsonPointerParser],
        configuration: {
            pointer: { name: "jsonPointer", toBlock: FlowGraphBlockNames.JsonPointerParser },
        },
        inputs: {
            values: {
                // must be defined due to the array taking over
                value: { name: "value" },
                "[segment]": { name: "$1", toBlock: FlowGraphBlockNames.JsonPointerParser },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
        interBlockConnectors: [
            {
                input: "object",
                output: "object",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "propertyName",
                output: "propertyName",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "customSetFunction",
                output: "setFunction",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
        ],
        // extraProcessor(_gltfBlock, _mapping, arrays, serializedObjects) {
        //     // connect the pointer to the setProperty block
        //     connectFlowGraphNodes("object", "object", serializedObjects[0], serializedObjects[1], true);
        //     connectFlowGraphNodes("propertyName", "propertyName", serializedObjects[0], serializedObjects[1], true);
        //     connectFlowGraphNodes("customSetFunction", "setFunction", serializedObjects[0], serializedObjects[1], true);
        //     return serializedObjects;
        // },
    },
    "pointer/interpolate": {
        // interpolate, parse the pointer and play the animation generated. 3 blocks!
        blocks: [FlowGraphBlockNames.ValueInterpolation, FlowGraphBlockNames.JsonPointerParser, FlowGraphBlockNames.PlayAnimation, FlowGraphBlockNames.Easing],
        configuration: {
            pointer: { name: "jsonPointer", toBlock: FlowGraphBlockNames.JsonPointerParser },
        },
        inputs: {
            values: {
                value: { name: "value-1" },
                "[segment]": { name: "$1", toBlock: FlowGraphBlockNames.JsonPointerParser },
                duration: { name: "duration-1", gltfType: "number" /*, inOptions: true */ },
                p1: { name: "controlPoint1", toBlock: FlowGraphBlockNames.Easing },
                p2: { name: "controlPoint2", toBlock: FlowGraphBlockNames.Easing },
            },
            flows: {
                in: { name: "in", toBlock: FlowGraphBlockNames.PlayAnimation },
            },
        },
        outputs: {
            flows: {
                err: { name: "error", toBlock: FlowGraphBlockNames.PlayAnimation },
                out: { name: "out", toBlock: FlowGraphBlockNames.PlayAnimation },
                done: { name: "done", toBlock: FlowGraphBlockNames.PlayAnimation },
            },
        },
        interBlockConnectors: [
            {
                input: "object",
                output: "object",
                inputBlockIndex: 2,
                outputBlockIndex: 1,
            },
            {
                input: "propertyName",
                output: "propertyName",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "customBuildAnimation",
                output: "generateAnimationsFunction",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "animation",
                output: "animation",
                inputBlockIndex: 2,
                outputBlockIndex: 0,
            },
            {
                input: "easingFunction",
                output: "easingFunction",
                inputBlockIndex: 0,
                outputBlockIndex: 3,
            },
            {
                input: "value-0",
                output: "value",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
        ],
        // extraProcessor(_gltfBlock, _mapping, _arrays, serializedObjects) {
        //     // connect the pointer to the getProperty block
        //     // connectFlowGraphNodes("object", "object", serializedObjects[2], serializedObjects[1], true);
        //     // connectFlowGraphNodes("propertyName", "propertyName", serializedObjects[0], serializedObjects[1], true);
        //     // connectFlowGraphNodes("value-0", "value", serializedObjects[0], serializedObjects[1], true);
        //     // connectFlowGraphNodes("customBuildAnimation", "generateAnimationsFunction", serializedObjects[0], serializedObjects[1], true);
        //     // connectFlowGraphNodes("animation", "animation", serializedObjects[2], serializedObjects[0], true);
        //     // connectFlowGraphNodes("easingFunction", "easingFunction", serializedObjects[0], serializedObjects[3], true);
        //     // search for p1 and p2 and remove them, for now
        //     serializedObjects.forEach((serializedObject) => {
        //         // check if it is the json pointer block
        //         if (serializedObject.className === FlowGraphBlockNames.JsonPointerParser) {
        //             serializedObject.config = serializedObject.config || {};
        //             serializedObject.config.outputValue = true;
        //         } else if (serializedObject.className === FlowGraphBlockNames.ValueInterpolation) {
        //             // remove the p1 and p2
        //             serializedObject.config = serializedObject.config || {};
        //             // get the type of the pointer interpolation
        //             _gltfBlock.values?.forEach((value) => {
        //                 if (value.id === "value") {
        //                     // get the type of the value
        //                     const type = value.type;
        //                     if (type !== undefined) {
        //                         serializedObject.config.animationType = _arrays.types[type];
        //                     }
        //                 }
        //             });
        //         }
        //     });
        //     return serializedObjects;
        // },
    },
    "animation/start": {
        blocks: [FlowGraphBlockNames.PlayAnimation],
        inputs: {
            values: {
                // TODO - fix the animation reference
                animation: { name: "animationGroup", gltfType: "number", flowGraphType: "animation" /*isIndex: "animations"*/ },
                speed: { name: "speed", gltfType: "number" },
                // 60 is a const from the glTF loader
                startTime: { name: "from", gltfType: "number", dataTransformer: (time: number) => time * 60 },
                endTime: { name: "to", gltfType: "number", dataTransformer: (time: number) => time * 60 },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
        // extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects, context, globalGLTF) {
        //     const animation = gltfBlock.values?.find((config) => config.id === "animation")?.value;
        //     if (animation === undefined) {
        //         throw new Error("animation not found in configuration");
        //     }
        //     const variableName = serializedObjects[0].dataInputs[0].uniqueId;
        //     // connect the mesh to the asset input
        //     // connectFlowGraphNodes("asset", "value", serializedObjects[0], serializedObjects[1], true);

        //     // find the nodeIndex value
        //     // serializedObjects[0].dataInputs = variableName;
        //     context._connectionValues[variableName] = {
        //         className: "AnimationGroup",
        //         name: globalGLTF?.animations?.[animation]._babylonAnimationGroup?.name,
        //         uniqueId: globalGLTF?.animations?.[animation]._babylonAnimationGroup?.uniqueId,
        //     };
        //     return serializedObjects;
        // },
    },
    "animation/stop": {
        blocks: [FlowGraphBlockNames.StopAnimation],
        inputs: {
            values: {
                animation: { name: "animation", gltfType: "number", flowGraphType: "animation" /*, isIndex: "animations"*/ },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
    },
    "animation/stopAt": {
        blocks: [FlowGraphBlockNames.StopAnimation],
        configuration: {},
        inputs: {
            values: {
                animation: { name: "animation", gltfType: "number", flowGraphType: "animation" /*, isIndex: "animations"*/ },
                stopTime: { name: "stopAtFrame", gltfType: "number", dataTransformer: (time: number) => time / 60 },
            },
            flows: {
                // in: { name: "in" },
            },
        },
        outputs: {
            flows: {
                // out: { name: "out" },
                err: { name: "error" },
            },
        },
    },
};

function getSimpleInputMapping(type: FlowGraphBlockNames, inputs: string[] = ["a"]): IGLTFToFlowGraphMapping {
    return {
        blocks: [type],
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
