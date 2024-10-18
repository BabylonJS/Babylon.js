/* eslint-disable @typescript-eslint/naming-convention */
import type { IKHRInteractivity_Node } from "babylonjs-gltf2interface";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";
import type { ISerializedFlowGraphBlock, ISerializedFlowGraphContext } from "core/FlowGraph/typeDefinitions";
import type { IGLTF } from "../glTFLoaderInterfaces";
import { RandomGUID } from "core/Misc/guid";
import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";

export interface InteractivityVariable {
    name: string;
    value: {
        className: string;
        value: any;
    };
}

export interface InteractivityEvent {
    eventId: string;
    eventData?: { [key: string]: string };
}

export interface IConvertedInteractivityObject {
    variables: InteractivityVariable[];
    events: InteractivityEvent[];
    types: FlowGraphTypes[];
    /**
     * The nodes of the flow graph.
     * Note that there is no guarantee that the nodes' index corresponds to the glTF node index.
     * You can read the glTF node id from the block's metadata.
     */
    nodes: ISerializedFlowGraphBlock[];
}

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
    isIndex?: keyof IConvertedInteractivityObject;

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
     * This is used if we need extra information for the constructor/options that is not provided directly by the glTF node.
     * This function can return more than one node, if extra nodes are needed for this block to function correctly.
     * Returning more than one block will usually happen when a json pointer was provided.
     * @param gltfBlock the glTF node
     * @param mapping the mapping object
     * @param arrays the arrays of the interactivity object
     * @param serializedObjects the serialized object
     * @returns an array of serialized nodes that will be added to the graph.
     */
    extraProcessor?: (
        gltfBlock: IKHRInteractivity_Node,
        mapping: IGLTFToFlowGraphMapping,
        arrays: IConvertedInteractivityObject,
        serializedObjects: ISerializedFlowGraphBlock[],
        context: ISerializedFlowGraphContext,
        globalGLTF: IGLTF
    ) => ISerializedFlowGraphBlock[];
}

export function convertGLTFValueToFlowGraph(value: any, mapping: IGLTFToFlowGraphMappingObject, convertedObject?: IConvertedInteractivityObject) {
    if (mapping.isPointer) {
        throw new Error("Function not supporting glTF JSON pointers. Please use getJSONPointerNode instead");
    }
    const flowGraphKeyName = mapping.name;
    let convertedValue = value;
    if (mapping.isIndex) {
        if (!convertedObject?.[mapping.isIndex]) {
            throw new Error("missing array " + mapping.isIndex);
        } else {
            if (!mapping.dataTransformer) {
                throw new Error("dataTransform must be defined if isIndex is set");
            }
            convertedValue = mapping.dataTransformer(value, convertedObject[mapping.isIndex]);
        }
    } else {
        if (mapping.dataTransformer) {
            convertedValue = mapping.dataTransformer(value);
        }
    }

    return {
        key: flowGraphKeyName,
        value: convertedValue,
    };
}

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
export function connectFlowGraphNodes(input: string, output: string, serializedInput: ISerializedFlowGraphBlock, serializedOutput: ISerializedFlowGraphBlock, isVariable: boolean) {
    const inputArray = isVariable ? serializedInput.dataInputs : serializedInput.signalInputs;
    const outputArray = isVariable ? serializedOutput.dataOutputs : serializedOutput.signalOutputs;
    const inputConnection = inputArray.find((s) => s.name === input) || {
        uniqueId: RandomGUID(),
        name: input,
        _connectionType: FlowGraphConnectionType.Input, // Input
        connectedPointIds: [] as string[],
    };
    const outputConnection = outputArray.find((s) => s.name === output) || {
        uniqueId: RandomGUID(),
        name: output,
        _connectionType: FlowGraphConnectionType.Output, // Output
        connectedPointIds: [] as string[],
    };
    // of not found add it to the array
    if (!inputArray.find((s) => s.name === input)) {
        inputArray.push(inputConnection);
    }
    if (!outputArray.find((s) => s.name === output)) {
        outputArray.push(outputConnection);
    }
    // connect the sockets
    inputConnection.connectedPointIds.push(outputConnection.uniqueId);
    outputConnection.connectedPointIds.push(inputConnection.uniqueId);
}

/**
 * This function will add new mapping to glTF interactivity.
 * Other extensions can define new types of blocks, this is the way to let interactivity know how to parse them.
 * @param key the type of node, i.e. "variable/get"
 * @param mapping The mapping object. See documentation or examples below.
 */
export function addNewInteractivityFlowGraphMapping(key: string, mapping: IGLTFToFlowGraphMapping) {
    gltfExtensionsToFlowGraphMapping[key] = gltfExtensionsToFlowGraphMapping[key] || mapping;
}

/**
 * Get the mapping for a specific type of node.
 * @param key the type of node, i.e. "variable/get"
 * @returns the mapping gltf to flow graph
 */
export function getMappingForType(key: string) {
    return gltfToFlowGraphMapping[key] || gltfExtensionsToFlowGraphMapping[key];
}

const gltfExtensionsToFlowGraphMapping: { [key: string]: IGLTFToFlowGraphMapping } = {};

// this mapper is just a way to convert the glTF nodes to FlowGraph nodes in terms of input/output connection names and values.
const gltfToFlowGraphMapping: { [key: string]: IGLTFToFlowGraphMapping } = {
    "event/onStart": {
        blocks: [FlowGraphBlockNames.SceneReadyEvent],
    },
    "event/onTick": {
        blocks: [FlowGraphBlockNames.SceneTickEvent],
        inputs: {},
        outputs: {
            values: {
                timeSinceLastTick: { name: "deltaTime", gltfType: "number" /*, dataTransformer: (time: number) => time / 1000*/ },
            },
        },
        configuration: {},
    },
    "event/send": {
        blocks: [FlowGraphBlockNames.SendCustomEvent],
        extraProcessor(gltfBlock, _mapping, arrays, serializedObjects) {
            // set eventId and eventData. The configuration object of the glTF shoudl have a single(!) object.
            // validate that we are running it on the right block.
            if (gltfBlock.type !== "event/send" || !gltfBlock.configuration || Object.keys(gltfBlock.configuration).length !== 1) {
                throw new Error("Receive event should have a single configuration object, the event itself");
            }
            const eventConfiguration = gltfBlock.configuration[0];
            const event: InteractivityEvent = arrays.events[eventConfiguration.value];
            const serializedObject = serializedObjects[0];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.eventId = event.eventId;
            serializedObject.config.eventData = event.eventData;
            return serializedObjects;
        },
    },
    "event/receive": {
        blocks: [FlowGraphBlockNames.ReceiveCustomEvent],
        extraProcessor(gltfBlock, _mapping, arrays, serializedObjects) {
            // set eventId and eventData. The configuration object of the glTF shoudl have a single(!) object.
            // validate that we are running it on the right block.
            if (gltfBlock.type !== "event/receive" || !gltfBlock.configuration || Object.keys(gltfBlock.configuration).length !== 1) {
                throw new Error("Receive event should have a single configuration object, the event itself");
            }
            const eventConfiguration = gltfBlock.configuration[0];
            const event: InteractivityEvent = arrays.events[eventConfiguration.value];
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
    "math/rotate2d": getSimpleInputMapping(FlowGraphBlockNames.Rotate2d, ["a", "b"]),
    "math/rotate3d": getSimpleInputMapping(FlowGraphBlockNames.Rotate3d, ["a", "b", "c"]),
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
    // TODO!!!
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
                a: { name: "position", gltfType: "float3" },
                b: { name: "rotationQuaternion", gltfType: "float4" },
                c: { name: "scaling", gltfType: "float3" },
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
                rotation: { name: "rotation" },
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
    "type/boolToInt": getSimpleInputMapping(FlowGraphBlockNames.BooleanToInt),
    "type/boolToFloat": getSimpleInputMapping(FlowGraphBlockNames.BooleanToFloat),
    "type/intToBool": getSimpleInputMapping(FlowGraphBlockNames.IntToBoolean),
    "type/intToFloat": getSimpleInputMapping(FlowGraphBlockNames.IntToFloat),
    "type/floatToInt": getSimpleInputMapping(FlowGraphBlockNames.FloatToInt),
    "type/floatToBool": getSimpleInputMapping(FlowGraphBlockNames.FloatToBoolean),

    // flows
    "flow/sequence": {
        blocks: [FlowGraphBlockNames.Sequence],
        extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects) {
            // TODO - removing this prevents proper validation
            // if (gltfBlock.type !== "flow/sequence" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
            //     throw new Error("Sequence should have a single configuration object, the number of output flows");
            // }
            const serializedObject = serializedObjects[0];
            serializedObject.config = serializedObject.config || {};
            serializedObject.config.numberOutputFlows = Object.keys(gltfBlock.flows || []).length || 1;
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
            cases: { name: "cases", gltfType: "array", inOptions: true },
        },
        extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects) {
            // convert all names of output flow to out_$1 apart from "default"
            if (gltfBlock.type !== "flow/switch" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
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
        extraProcessor(gltfBlock, _mapping, _arrays, serializedObjects) {
            if (gltfBlock.type !== "flow/multiGate" || !gltfBlock.flows || Object.keys(gltfBlock.flows).length === 0) {
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
            inputFlows: { name: "inputFlows", gltfType: "number", inOptions: true },
        },
        extraProcessor(_gltfBlock, _mapping, _arrays, serializedObjects) {
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
        configuration: {
            variable: {
                name: "variable",
                gltfType: "number",
                flowGraphType: "string",
                inOptions: true,
                isIndex: "variables",
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
                isIndex: "variables",
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
        extraProcessor(_gltfBlock, _mapping, arrays, serializedObjects, _context, _globalGLTF) {
            // connect the pointer to the getProperty block
            connectFlowGraphNodes("object", "object", serializedObjects[0], serializedObjects[1], true);
            connectFlowGraphNodes("propertyName", "propertyName", serializedObjects[0], serializedObjects[1], true);
            return serializedObjects;
        },
    },
    "pointer/set": {
        blocks: [FlowGraphBlockNames.SetProperty],
        configuration: {
            pointer: { name: "jsonPointer", toBlock: FlowGraphBlockNames.JsonPointerParser },
        },
        inputs: {
            values: {
                value: { name: "value" },
                "[segment]": { name: "$1", toBlock: FlowGraphBlockNames.JsonPointerParser },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
    },
    "pointer/interpolate": {
        blocks: [FlowGraphBlockNames.ValueInterpolation],
        configuration: {
            pointer: { name: "object;propertyName" },
        },
        inputs: {
            values: {
                value: { name: "value" },
                "[segment]": { name: "$1", toBlock: FlowGraphBlockNames.JsonPointerParser },
                duration: { name: "duration", gltfType: "number" /*, inOptions: true */ },
                p1: { name: "initialValue", gltfType: "number" /*, inOptions: true*/ },
                p2: { name: "endValue", gltfType: "number" /*, inOptions: true*/ },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
    },
    "animation/start": {
        blocks: [FlowGraphBlockNames.PlayAnimation],
        inputs: {
            values: {
                // TODO - fix the animation reference
                animation: { name: "animation", gltfType: "number", flowGraphType: "animation" /*isIndex: "animations"*/ },
                speed: { name: "speed", gltfType: "number" },
                // 60 is a const from the glTF loader
                startTime: { name: "from", gltfType: "number", dataTransformer: (time: number) => time / 60 },
                endTime: { name: "to", gltfType: "number", dataTransformer: (time: number) => time / 60 },
            },
        },
        outputs: {
            flows: {
                err: { name: "error" },
            },
        },
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

export const gltfTypeToBabylonType: {
    [key: string]: FlowGraphTypes;
} = {
    float: FlowGraphTypes.Number,
    bool: FlowGraphTypes.Boolean,
    float2: FlowGraphTypes.Vector2,
    float3: FlowGraphTypes.Vector3,
    float4: FlowGraphTypes.Vector4,
    float4x4: FlowGraphTypes.Matrix,
    int: FlowGraphTypes.Integer,
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
