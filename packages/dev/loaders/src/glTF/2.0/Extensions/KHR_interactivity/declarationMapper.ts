/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity_Declaration, IKHRInteractivity_Node } from "babylonjs-gltf2interface";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { Logger } from "core/Misc/logger";
import type { ISerializedFlowGraphBlock, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import type { InteractivityEvent, InteractivityGraphToFlowGraphParser } from "./interactivityGraphParser";
import type { IGLTF } from "../../glTFLoaderInterfaces";
import { Constants } from "core/Engines/constants";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";

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
    dataTransformer?: (data: I, parser: InteractivityGraphToFlowGraphParser) => O;
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

    /**
     * Used in configuration values. If defined, this will be the default value, if no value is provided/
     */
    defaultValue?: O;
}

export interface IGLTFToFlowGraphMapping {
    /**
     * The type of the FlowGraph block(s).
     * Typically will be a single element in an array.
     * When adding blocks defined in this module use the KHR_interactivity prefix.
     */
    blocks: (FlowGraphBlockNames | string)[];
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
     * This optional function will allow to validate the node, according to the glTF specs.
     * For example, if a node has a configuration object, it must be present and correct.
     * This is a basic node-based validation.
     * This functions is expected to return false and log the error if the node is not valid.
     * Note that this function can also modify the node, if needed.
     *
     * @param gltfBlock the glTF node to validate
     * @param globalGLTF the global glTF object
     * @returns true if validated, false if not.
     */
    validation?: (gltfBlock: IKHRInteractivity_Node, globalGLTF?: IGLTF) => boolean;

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
            const eventId = eventConfiguration.value[0] as number;
            if (typeof eventId !== "number") {
                throw new Error("Event id should be a number");
            }
            const event: InteractivityEvent = parser.arrays.events[eventId];
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
        extraProcessor(gltfBlock, declaration, _mapping, parser, serializedObjects) {
            // set eventId and eventData. The configuration object of the glTF shoudl have a single(!) object.
            // validate that we are running it on the right block.
            if (declaration.op !== "event/receive" || !gltfBlock.configuration || Object.keys(gltfBlock.configuration).length !== 1) {
                throw new Error("Receive event should have a single configuration object, the event itself");
            }
            const eventConfiguration = gltfBlock.configuration[0];
            const eventId = eventConfiguration.value[0] as number;
            if (typeof eventId !== "number") {
                throw new Error("Event id should be a number");
            }
            const event: InteractivityEvent = parser.arrays.events[eventId];
            const serializedObject = serializedObjects[0];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.eventId = event.eventId;
            serializedObject.config.eventData = event.eventData;
            return serializedObjects;
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
    "math/round": {
        blocks: [FlowGraphBlockNames.Round],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
        extraProcessor(gltfBlock, declaration, _mapping, parser, serializedObjects) {
            // configure it to work the way glTF specifies
            serializedObjects[0].config = serializedObjects[0].config || {};
            serializedObjects[0].config.roundHalfAwayFromZero = true;
            return serializedObjects;
        },
    },
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
                value: { name: "value" }, // TODO - output or value?
            },
        },
    },
    "math.random": {
        blocks: [FlowGraphBlockNames.Random],
        outputs: {
            values: {
                value: { name: "value" },
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
        // glTF transform is vectorN with matrixN
        blocks: [FlowGraphBlockNames.TransformVector],
        configuration: {},
        inputs: {
            values: {
                a: { name: "a", gltfType: "floatN" },
                b: { name: "b", gltfType: "floatN" },
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
    "math/combine2x2": {
        blocks: [FlowGraphBlockNames.CombineMatrix2D],
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
    "math/extract2x2": {
        blocks: [FlowGraphBlockNames.ExtractMatrix2D],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input", gltfType: "float2x2" },
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
    "math/combine3x3": {
        blocks: [FlowGraphBlockNames.CombineMatrix3D],
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
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
    },
    "math/extract3x3": {
        blocks: [FlowGraphBlockNames.ExtractMatrix3D],
        configuration: {},
        inputs: {
            values: {
                a: { name: "input", gltfType: "float3x3" },
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
            },
        },
    },
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
    "math/not": {
        blocks: [FlowGraphBlockNames.BitwiseNot],
        inputs: {
            values: {
                a: { name: "input" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
        extraProcessor(_gltfBlock, _declaration, _mapping, _parser, serializedObjects, context) {
            // configure it to work the way glTF specifies
            serializedObjects[0].config = serializedObjects[0].config || {};
            // try to infer the type or fallback to Integer
            const socketIn = serializedObjects[0].dataInputs[0];
            serializedObjects[0].config.valueType = context._connectionValues[socketIn.uniqueId]?.type ?? FlowGraphTypes.Integer;
            return serializedObjects;
        },
    },
    "math/and": {
        blocks: [FlowGraphBlockNames.BitwiseAnd],
        inputs: {
            values: {
                a: { name: "a" },
                b: { name: "b" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
        extraProcessor(_gltfBlock, _declaration, _mapping, _parser, serializedObjects, context) {
            // configure it to work the way glTF specifies
            serializedObjects[0].config = serializedObjects[0].config || {};
            // try to infer the type or fallback to Integer
            const socketInA = serializedObjects[0].dataInputs[0];
            const socketInB = serializedObjects[0].dataInputs[1];
            serializedObjects[0].config.valueType =
                context._connectionValues[socketInA.uniqueId]?.type ?? context._connectionValues[socketInB.uniqueId]?.type ?? FlowGraphTypes.Integer;
            return serializedObjects;
        },
    },
    "math/or": {
        blocks: [FlowGraphBlockNames.BitwiseOr],
        inputs: {
            values: {
                a: { name: "a" },
                b: { name: "b" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
        extraProcessor(_gltfBlock, _declaration, _mapping, _parser, serializedObjects, context) {
            // configure it to work the way glTF specifies
            serializedObjects[0].config = serializedObjects[0].config || {};
            // try to infer the type or fallback to Integer
            const socketInA = serializedObjects[0].dataInputs[0];
            const socketInB = serializedObjects[0].dataInputs[1];
            serializedObjects[0].config.valueType =
                context._connectionValues[socketInA.uniqueId]?.type ?? context._connectionValues[socketInB.uniqueId]?.type ?? FlowGraphTypes.Integer;
            return serializedObjects;
        },
    },
    "math/xor": {
        blocks: [FlowGraphBlockNames.BitwiseXor],
        inputs: {
            values: {
                a: { name: "a" },
                b: { name: "b" },
            },
        },
        outputs: {
            values: {
                value: { name: "value" },
            },
        },
        extraProcessor(_gltfBlock, _declaration, _mapping, _parser, serializedObjects, context) {
            // configure it to work the way glTF specifies
            serializedObjects[0].config = serializedObjects[0].config || {};
            // try to infer the type or fallback to Integer
            const socketInA = serializedObjects[0].dataInputs[0];
            const socketInB = serializedObjects[0].dataInputs[1];
            serializedObjects[0].config.valueType =
                context._connectionValues[socketInA.uniqueId]?.type ?? context._connectionValues[socketInB.uniqueId]?.type ?? FlowGraphTypes.Integer;
            return serializedObjects;
        },
    },
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
        extraProcessor(gltfBlock, _declaration, _mapping, _arrays, serializedObjects) {
            // TODO - removing this prevents proper validation
            // if (gltfBlock.type !== "flow/sequence" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
            //     throw new Error("Sequence should have a single configuration object, the number of output flows");
            // }
            const serializedObject = serializedObjects[0];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.numberOutputFlows = Object.keys(gltfBlock.flows || []).length;
            serializedObject.signalOutputs.forEach((output, index) => {
                output.name = "out_" + index;
            });
            return serializedObjects;
        },
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
            cases: { name: "cases", inOptions: true, defaultValue: [] },
        },
        validation(gltfBlock) {
            if (gltfBlock.configuration && gltfBlock.configuration.cases) {
                const cases = gltfBlock.configuration.cases.value;
                const onlyIntegers = cases.every((caseValue) => {
                    // case value should be an integer. Since Number.isInteger(1.0) is true, we need to check if toString has only digits.
                    return typeof caseValue === "number" && /^\d+$/.test(caseValue.toString());
                });
                if (!onlyIntegers) {
                    gltfBlock.configuration.cases.value = [] as number[];
                    return true;
                }
                // check for duplicates
                const uniqueCases = new Set(cases);
                gltfBlock.configuration.cases.value = Array.from(uniqueCases) as number[];
            }
            return true;
        },
        extraProcessor(gltfBlock, declaration, _mapping, _arrays, serializedObjects) {
            // convert all names of output flow to out_$1 apart from "default"
            if (declaration.op !== "flow/switch" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
                throw new Error("Switch should have a single configuration object, the cases array");
            }
            const serializedObject = serializedObjects[0];
            serializedObject.signalOutputs.forEach((output) => {
                if (output.name !== "default") {
                    output.name = "out_" + output.name;
                }
            });
            return serializedObjects;
        },
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
            initialIndex: { name: "initialIndex", gltfType: "number", inOptions: true, defaultValue: 0 },
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
            flows: {
                loopBody: { name: "executionFlow" },
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
            isRandom: { name: "isRandom", gltfType: "boolean", inOptions: true, defaultValue: false },
            isLoop: { name: "isLoop", gltfType: "boolean", inOptions: true, defaultValue: false },
        },
        extraProcessor(gltfBlock, declaration, _mapping, _arrays, serializedObjects) {
            if (declaration.op !== "flow/multiGate" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
                throw new Error("MultiGate should have a single configuration object, the number of output flows");
            }
            const serializedObject = serializedObjects[0];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.numberOutputFlows = Object.keys(gltfBlock.flows).length;
            return serializedObjects;
        },
    },
    "flow/waitAll": {
        blocks: [FlowGraphBlockNames.WaitAll],
        configuration: {
            inputFlows: { name: "inputFlows", gltfType: "number", inOptions: true, defaultValue: 0 },
        },
        validation(gltfBlock) {
            // check that the configuration value is an integer
            if (typeof gltfBlock.configuration?.inputFlows?.value[0] !== "number") {
                gltfBlock.configuration = gltfBlock.configuration || {
                    inputFlows: { value: [0] },
                };
                gltfBlock.configuration.inputFlows.value = [0];
            }
            // go over all output flows, check that they are all integers as strings
            return Object.keys(gltfBlock.flows || {}).every((flow) => {
                return typeof flow === "string" && /^\d+$/.test(flow);
            });
        },
        extraProcessor(_gltfBlock, _declaration, _mapping, _arrays, serializedObjects) {
            // process the input flows and add them to the inFlow array
            // take all input flows and convert their names correctly to "in_$1"
            const serializedObject = serializedObjects[0];
            serializedObject.signalInputs.forEach((input) => {
                input.name = "in_" + input.name;
            });
            return serializedObjects;
        },
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
        validation(gltfBlock) {
            if (!gltfBlock.configuration?.variable?.value) {
                Logger.Error("Variable get block should have a variable configuration");
                return false;
            }
            return true;
        },
        configuration: {
            variable: {
                name: "variable",
                gltfType: "number",
                flowGraphType: "string",
                inOptions: true,
                isVariable: true,
                dataTransformer(index, parser) {
                    return parser.getVariableName(index);
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
                dataTransformer(index, parser) {
                    return parser.getVariableName(index);
                },
            },
        },
    },
    "variable/interpolate": {
        blocks: [FlowGraphBlockNames.ValueInterpolation, FlowGraphBlockNames.Context, FlowGraphBlockNames.PlayAnimation, FlowGraphBlockNames.Easing],
        configuration: {
            variable: {
                name: "propertyName",
                gltfType: "number",
                flowGraphType: "string",
                inOptions: true,
                isVariable: true,
                dataTransformer(index, parser) {
                    return parser.getVariableName(index);
                },
            },
            useSlerp: {
                name: "animationType",
                gltfType: "boolean",
                inOptions: true,
                defaultValue: false,
                dataTransformer: (value) => {
                    if (value === true) {
                        return FlowGraphTypes.Quaternion;
                    } else {
                        // TODO - should we return undefined or the default value?
                        return undefined;
                    }
                },
            },
        },
        inputs: {
            values: {
                value: { name: "value-1" },
                duration: { name: "duration-1", gltfType: "number" },
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
                output: "userVariables",
                inputBlockIndex: 2,
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
        extraProcessor(_gltfBlock, _declaration, _mapping, _parser, serializedObjects) {
            // is useSlerp is used, animationType should be set to be quaternion!
            const serializedValueInterpolation = serializedObjects[0];
            if (serializedValueInterpolation.config.useSlerp) {
                serializedValueInterpolation.config.animationType = Constants.ANIMATIONTYPE_QUATERNION;
                serializedValueInterpolation.config.useSlerp = undefined;
            }

            return serializedObjects;
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
        extraProcessor(gltfBlock, _declaration, _mapping, parser, serializedObjects) {
            serializedObjects.forEach((serializedObject) => {
                // check if it is the json pointer block
                if (serializedObject.className === FlowGraphBlockNames.JsonPointerParser) {
                    serializedObject.config = serializedObject.config || {};
                    serializedObject.config.outputValue = true;
                } else if (serializedObject.className === FlowGraphBlockNames.ValueInterpolation) {
                    serializedObject.config = serializedObject.config || {};
                    Object.keys(gltfBlock.values || []).forEach((key) => {
                        const value = gltfBlock.values?.[key];
                        if (key === "value" && value) {
                            // get the type of the value
                            const type = value.type;
                            if (type !== undefined) {
                                serializedObject.config.animationType = parser.arrays.types[type];
                            }
                        }
                    });
                }
            });
            return serializedObjects;
        },
    },
    "animation/start": {
        blocks: [FlowGraphBlockNames.PlayAnimation, FlowGraphBlockNames.ArrayIndex, "KHR_interactivity/FlowGraphGLTFDataProvider"],
        inputs: {
            values: {
                animation: { name: "index", gltfType: "number", toBlock: FlowGraphBlockNames.ArrayIndex },
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
        interBlockConnectors: [
            {
                input: "animationGroup",
                output: "value",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "array",
                output: "animationGroups",
                inputBlockIndex: 1,
                outputBlockIndex: 2,
            },
        ],
        extraProcessor(_gltfBlock, _declaration, _mapping, _arrays, serializedObjects, _context, globalGLTF) {
            // add the glTF to the configuration of the last serialized object
            const serializedObject = serializedObjects[serializedObjects.length - 1];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.glTF = globalGLTF;
            return serializedObjects;
        },
    },
    "animation/stop": {
        blocks: [FlowGraphBlockNames.StopAnimation, FlowGraphBlockNames.ArrayIndex, "KHR_interactivity/FlowGraphGLTFDataProvider"],
        inputs: {
            values: {
                animation: { name: "index", gltfType: "number", toBlock: FlowGraphBlockNames.ArrayIndex },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
        interBlockConnectors: [
            {
                input: "animationGroup",
                output: "value",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "array",
                output: "animationGroups",
                inputBlockIndex: 1,
                outputBlockIndex: 2,
            },
        ],
        extraProcessor(_gltfBlock, _declaration, _mapping, _arrays, serializedObjects, _context, globalGLTF) {
            // add the glTF to the configuration of the last serialized object
            const serializedObject = serializedObjects[serializedObjects.length - 1];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.glTF = globalGLTF;
            return serializedObjects;
        },
    },
    "animation/stopAt": {
        blocks: [FlowGraphBlockNames.StopAnimation, FlowGraphBlockNames.ArrayIndex, "KHR_interactivity/FlowGraphGLTFDataProvider"],
        configuration: {},
        inputs: {
            values: {
                animation: { name: "index", gltfType: "number", toBlock: FlowGraphBlockNames.ArrayIndex },
                stopTime: { name: "stopAtFrame", gltfType: "number", dataTransformer: (time: number) => time * 60 },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
        interBlockConnectors: [
            {
                input: "animationGroup",
                output: "value",
                inputBlockIndex: 0,
                outputBlockIndex: 1,
            },
            {
                input: "array",
                output: "animationGroups",
                inputBlockIndex: 1,
                outputBlockIndex: 2,
            },
        ],
        extraProcessor(_gltfBlock, _declaration, _mapping, _arrays, serializedObjects, _context, globalGLTF) {
            // add the glTF to the configuration of the last serialized object
            const serializedObject = serializedObjects[serializedObjects.length - 1];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.glTF = globalGLTF;
            return serializedObjects;
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

/**
 * 
 * These are the nodes from the specs:

### Math Nodes
1. **Constants**
   - E (`math/e`) FlowGraphBlockNames.E
   - Pi (`math/pi`) FlowGraphBlockNames.PI
   - Infinity (`math/inf`) FlowGraphBlockNames.Inf
   - Not a Number (`math/nan`) FlowGraphBlockNames.NaN
2. **Arithmetic Nodes**
   - Absolute Value (`math/abs`) FlowGraphBlockNames.Abs
   - Sign (`math/sign`) FlowGraphBlockNames.Sign
   - Truncate (`math/trunc`) FlowGraphBlockNames.Trunc
   - Floor (`math/floor`) FlowGraphBlockNames.Floor
   - Ceil (`math/ceil`) FlowGraphBlockNames.Ceil
   - Round (`math/round`)  FlowGraphBlockNames.Round
   - Fraction (`math/fract`) FlowGraphBlockNames.Fract
   - Negation (`math/neg`) FlowGraphBlockNames.Negation
   - Addition (`math/add`) FlowGraphBlockNames.Add
   - Subtraction (`math/sub`) FlowGraphBlockNames.Subtract
   - Multiplication (`math/mul`) FlowGraphBlockNames.Multiply
   - Division (`math/div`) FlowGraphBlockNames.Divide
   - Remainder (`math/rem`) FlowGraphBlockNames.Modulo
   - Minimum (`math/min`) FlowGraphBlockNames.Min
   - Maximum (`math/max`) FlowGraphBlockNames.Max
   - Clamp (`math/clamp`) FlowGraphBlockNames.Clamp
   - Saturate (`math/saturate`) FlowGraphBlockNames.Saturate
   - Interpolate (`math/mix`) FlowGraphBlockNames.MathInterpolation
3. **Comparison Nodes**
   - Equality (`math/eq`) FlowGraphBlockNames.Equality
   - Less Than (`math/lt`) FlowGraphBlockNames.LessThan
   - Less Than Or Equal To (`math/le`) FlowGraphBlockNames.LessThanOrEqual
   - Greater Than (`math/gt`) FlowGraphBlockNames.GreaterThan
   - Greater Than Or Equal To (`math/ge`) FlowGraphBlockNames.GreaterThanOrEqual
4. **Special Nodes**
   - Is Not a Number (`math/isnan`) FlowGraphBlockNames.IsNaN
   - Is Infinity (`math/isinf`) FlowGraphBlockNames.IsInfinity
   - Select (`math/select`) FlowGraphBlockNames.Conditional
   - Random (`math/random`) FlowGraphBlockNames.Random
5. **Angle and Trigonometry Nodes**
   - Degrees-To-Radians (`math/rad`) FlowGraphBlockNames.DegToRad
   - Radians-To-Degrees (`math/deg`) FlowGraphBlockNames.RadToDeg
   - Sine (`math/sin`)  FlowGraphBlockNames.Sin
   - Cosine (`math/cos`) FlowGraphBlockNames.Cos
   - Tangent (`math/tan`) FlowGraphBlockNames.Tan
   - Arcsine (`math/asin`) FlowGraphBlockNames.Asin
   - Arccosine (`math/acos`) FlowGraphBlockNames.Acos
   - Arctangent (`math/atan`) FlowGraphBlockNames.Atan
   - Arctangent 2 (`math/atan2`) FlowGraphBlockNames.Atan2
6. **Hyperbolic Nodes**
   - Hyperbolic Sine (`math/sinh`) FlowGraphBlockNames.Sinh
   - Hyperbolic Cosine (`math/cosh`) FlowGraphBlockNames.Cosh
   - Hyperbolic Tangent (`math/tanh`) FlowGraphBlockNames.Tanh
   - Inverse Hyperbolic Sine (`math/asinh`) FlowGraphBlockNames.Asinh
   - Inverse Hyperbolic Cosine (`math/acosh`) FlowGraphBlockNames.Acosh
   - Inverse Hyperbolic Tangent (`math/atanh`) FlowGraphBlockNames.Atanh
7. **Exponential Nodes**
   - Exponent (`math/exp`) FlowGraphBlockNames.Exponential
   - Natural Logarithm (`math/log`) FlowGraphBlockNames.Log
   - Base-2 Logarithm (`math/log2`) FlowGraphBlockNames.Log2
   - Base-10 Logarithm (`math/log10`) FlowGraphBlockNames.Log10
   - Square Root (`math/sqrt`) FlowGraphBlockNames.SquareRoot
   - Cube Root (`math/cbrt`) FlowGraphBlockNames.CubeRoot
   - Power (`math/pow`) FlowGraphBlockNames.Power
8. **Vector Nodes**
   - Length (`math/length`) FlowGraphBlockNames.Length
   - Normalize (`math/normalize`) FlowGraphBlockNames.Normalize
   - Dot Product (`math/dot`) FlowGraphBlockNames.Dot
   - Cross Product (`math/cross`) FlowGraphBlockNames.Cross
   - Rotate 2D (`math/rotate2d`) FlowGraphBlockNames.Rotate2D
   - Rotate 3D (`math/rotate3d`) FlowGraphBlockNames.Rotate3D
   - Transform (`math/transform`) FlowGraphBlockNames.TransformVector
9. **Matrix Nodes**
   - Transpose (`math/transpose`) FlowGraphBlockNames.Transpose
   - Determinant (`math/determinant`) FlowGraphBlockNames.Determinant
   - Inverse (`math/inverse`) FlowGraphBlockNames.InvertMatrix
   - Multiplication (`math/matmul`) FlowGraphBlockNames.MatrixMultiplication
10. **Swizzle Nodes**
    - Combine (`math/combine2`, `math/combine3`, `math/combine4`, `math/combine2x2`, `math/combine3x3`, `math/combine4x4`)
        FlowGraphBlockNames.CombineVector2, FlowGraphBlockNames.CombineVector3, FlowGraphBlockNames.CombineVector4
        FlowGraphBlockNames.CombineMatrix2D, FlowGraphBlockNames.CombineMatrix3D, FlowGraphBlockNames.CombineMatrix
    - Extract (`math/extract2`, `math/extract3`, `math/extract4`, `math/extract2x2`, `math/extract3x3`, `math/extract4x4`)
        FlowGraphBlockNames.ExtractVector2, FlowGraphBlockNames.ExtractVector3, FlowGraphBlockNames.ExtractVector4
        FlowGraphBlockNames.ExtractMatrix2D, FlowGraphBlockNames.ExtractMatrix3D, FlowGraphBlockNames.ExtractMatrix
11. **Integer Arithmetic Nodes**
    - Absolute Value (`math/abs`) FlowGraphBlockNames.Abs
    - Sign (`math/sign`) FlowGraphBlockNames.Sign
    - Negation (`math/neg`) FlowGraphBlockNames.Negation
    - Addition (`math/add`) FlowGraphBlockNames.Add
    - Subtraction (`math/sub`) FlowGraphBlockNames.Subtract
    - Multiplication (`math/mul`) FlowGraphBlockNames.Multiply
    - Division (`math/div`) FlowGraphBlockNames.Divide
    - Remainder (`math/rem`) FlowGraphBlockNames.Modulo
    - Minimum (`math/min`) FlowGraphBlockNames.Min
    - Maximum (`math/max`) FlowGraphBlockNames.Max
    - Clamp (`math/clamp`) FlowGraphBlockNames.Clamp
12. **Integer Comparison Nodes**
    - Equality (`math/eq`) FlowGraphBlockNames.Equality
    - Less Than (`math/lt`) FlowGraphBlockNames.LessThan
    - Less Than Or Equal To (`math/le`) FlowGraphBlockNames.LessThanOrEqual
    - Greater Than (`math/gt`) FlowGraphBlockNames.GreaterThan
    - Greater Than Or Equal To (`math/ge`) FlowGraphBlockNames.GreaterThanOrEqual
13. **Integer Bitwise Nodes**
    - Bitwise NOT (`math/not`) FlowGraphBlockNames.BitwiseNot
    - Bitwise AND (`math/and`) FlowGraphBlockNames.BitwiseAnd
    - Bitwise OR (`math/or`) FlowGraphBlockNames.BitwiseOr
    - Bitwise XOR (`math/xor`) FlowGraphBlockNames.BitwiseXor
    - Right Shift (`math/asr`) FlowGraphBlockNames.BitwiseRightShift
    - Left Shift (`math/lsl`) FlowGraphBlockNames.BitwiseLeftShift
    - Count Leading Zeros (`math/clz`) FlowGraphBlockNames.LeadingZeros
    - Count Trailing Zeros (`math/ctz`) FlowGraphBlockNames.TrailingZeros
    - Count One Bits (`math/popcnt`) FlowGraphBlockNames.OneBitsCounter
14. **Boolean Arithmetic Nodes**
    - Equality (`math/eq`) FlowGraphBlockNames.Equality
    - Boolean NOT (`math/not`) FlowGraphBlockNames.BitwiseNot
    - Boolean AND (`math/and`) FlowGraphBlockNames.BitwiseAnd
    - Boolean OR (`math/or`) FlowGraphBlockNames.BitwiseOr
    - Boolean XOR (`math/xor`) FlowGraphBlockNames.BitwiseXor

### Type Conversion Nodes
1. **Boolean Conversion Nodes**
   - Boolean to Integer (`type/boolToInt`) FlowGraphBlockNames.BooleanToInt
   - Boolean to Float (`type/boolToFloat`) FlowGraphBlockNames.BooleanToFloat
2. **Integer Conversion Nodes**
   - Integer to Boolean (`type/intToBool`) FlowGraphBlockNames.IntToBoolean
   - Integer to Float (`type/intToFloat`) FlowGraphBlockNames.IntToFloat
3. **Float Conversion Nodes**
   - Float to Boolean (`type/floatToBool`) FlowGraphBlockNames.FloatToBoolean
   - Float to Integer (`type/floatToInt`) FlowGraphBlockNames.FloatToInt

### Control Flow Nodes
1. **Sync Nodes**
   - Sequence (`flow/sequence`) FlowGraphBlockNames.Sequence
   - Branch (`flow/branch`) FlowGraphBlockNames.Branch
   - Switch (`flow/switch`) FlowGraphBlockNames.Switch
   - While Loop (`flow/while`) FlowGraphBlockNames.WhileLoop
   - For Loop (`flow/for`) FlowGraphBlockNames.ForLoop
   - Do N (`flow/doN`) FlowGraphBlockNames.DoN
   - Multi Gate (`flow/multiGate`) FlowGraphBlockNames.MultiGate
   - Wait All (`flow/waitAll`) FlowGraphBlockNames.WaitAll
   - Throttle (`flow/throttle`) FlowGraphBlockNames.Throttle
2. **Delay Nodes**
   - Set Delay (`flow/setDelay`) FlowGraphBlockNames.SetDelay
   - Cancel Delay (`flow/cancelDelay`) FlowGraphBlockNames.CancelDelay

### State Manipulation Nodes
1. **Custom Variable Access**
   - Variable Get (`variable/get`) FlowGraphBlockNames.GetVariable
   - Variable Set (`variable/set`) FlowGraphBlockNames.SetVariable
   - Variable Interpolate (`variable/interpolate`) TODO
2. **Object Model Access** // TODO fully test this!!!
   - JSON Pointer Template Parsing (`pointer/get`) [FlowGraphBlockNames.GetProperty, FlowGraphBlockNames.JsonPointerParser]
   - Effective JSON Pointer Generation (`pointer/set`) [FlowGraphBlockNames.SetProperty, FlowGraphBlockNames.JsonPointerParser]
   - Pointer Get (`pointer/get`) [FlowGraphBlockNames.GetProperty, FlowGraphBlockNames.JsonPointerParser]
   - Pointer Set (`pointer/set`) [FlowGraphBlockNames.SetProperty, FlowGraphBlockNames.JsonPointerParser]
   - Pointer Interpolate (`pointer/interpolate`) [FlowGraphBlockNames.ValueInterpolation, FlowGraphBlockNames.JsonPointerParser, FlowGraphBlockNames.PlayAnimation, FlowGraphBlockNames.Easing]

### Animation Control Nodes
1. **Animation Play** (`animation/start`) FlowGraphBlockNames.PlayAnimation
2. **Animation Stop** (`animation/stop`) FlowGraphBlockNames.StopAnimation TODO!
3. **Animation Stop At** (`animation/stopAt`) FlowGraphBlockNames.StopAnimation TODO!

### Event Nodes
1. **Lifecycle Event Nodes**
   - On Start (`event/onStart`) FlowGraphBlockNames.SceneReadyEvent
   - On Tick (`event/onTick`) FlowGraphBlockNames.SceneTickEvent
2. **Custom Event Nodes**
   - Receive (`event/receive`) FlowGraphBlockNames.ReceiveCustomEvent
   - Send (`event/send`) FlowGraphBlockNames.SendCustomEvent

 */
