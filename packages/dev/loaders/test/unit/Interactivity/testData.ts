import { IKHRInteractivity_Graph } from "babylonjs-gltf2interface";

export const loggerExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "flow/log", extension: "BABYLON" }, { op: "math/add" }],
    nodes: [
        {
            declaration: 0,
            flows: {
                out: {
                    node: 2,
                    socket: "in",
                },
            },
        },
        {
            declaration: 2,
            values: {
                a: {
                    value: [1, 2, 3, 4],
                    type: 0,
                },
                b: {
                    value: [1, 2, 3, 4],
                    type: 0,
                },
            },
        },
        {
            declaration: 1,
            values: {
                message: {
                    node: 1,
                    socket: "value",
                },
            },
        },
    ],
    types: [{ signature: "float4" }],
};

export const mathExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "math/dot" }, { op: "math/mul" }, { op: "math/sub" }, { op: "flow/log", extension: "BABYLON" }],
    nodes: [
        {
            // was type: "event/onStart"
            declaration: 0,
            flows: {
                out: { node: 4, socket: "in" },
            },
        },
        {
            // was type: "math/dot"
            declaration: 1,
            values: {
                a: { value: [10, 10, 10], type: 1 },
                b: { value: [1, 2, 3], type: 1 },
            },
        },
        {
            // was type: "math/mul"
            declaration: 2,
            values: {
                b: { value: [2], type: 0 },
                a: { node: 1, socket: "value" },
            },
        },
        {
            // was type: "math/sub"
            declaration: 3,
            values: {
                b: { value: [78], type: 0 },
                a: { node: 2, socket: "value" },
            },
        },
        {
            // was type: "babylon/log"
            declaration: 4,
            values: {
                message: { node: 3, socket: "value" },
            },
        },
    ],
    types: [{ signature: "float" }, { signature: "float3" }],
};

export const intMathExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "math/div" }, { op: "flow/log", extension: "BABYLON" }],
    nodes: [
        {
            declaration: 0,
            flows: {
                out: { node: 2, socket: "in" },
            },
        },
        {
            declaration: 1,
            values: {
                a: { value: [3], type: 0 },
                b: { value: [2], type: 0 },
            },
        },
        {
            declaration: 2,
            values: {
                message: { node: 1, socket: "value" },
            },
        },
    ],
    types: [{ signature: "int" }],
};

export const matrixMathExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "math/matmul" }, { op: "math/transpose" }, { op: "flow/log", extension: "BABYLON" }],
    nodes: [
        {
            declaration: 0,
            flows: {
                out: { node: 3, socket: "in" },
            },
        },
        {
            declaration: 1,
            values: {
                a: { value: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1], type: 0 },
                b: { value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], type: 0 },
            },
        },
        {
            declaration: 2,
            values: {
                a: { node: 1, socket: "value" },
            },
        },
        {
            declaration: 3,
            values: {
                message: { node: 2, socket: "value" },
            },
        },
    ],
    types: [{ signature: "float4x4" }],
};

export const customEventExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "event/send" }, { op: "event/receive" }, { op: "flow/log", extension: "BABYLON" }],
    nodes: [
        {
            declaration: 0,
            flows: {
                out: { node: 1, socket: "in" },
            },
        },
        {
            declaration: 1,
            configuration: {
                event: { value: [0] },
            },
            values: {
                float3ToSend: { value: [1.0, 2.0, 3.0], type: 3 },
            },
        },
        {
            declaration: 2,
            configuration: {
                event: { value: [0] },
            },
            flows: {
                out: { node: 3, socket: "in" },
            },
        },
        {
            declaration: 3,
            values: {
                message: { node: 2, socket: "float3ToSend" },
            },
        },
    ],
    variables: [],
    events: [
        {
            id: "logTwo",
            values: {
                float3ToSend: { type: 3, value: [0, 0, 0] },
            },
        },
    ],
    types: [{ signature: "bool" }, { signature: "int" }, { signature: "float" }, { signature: "float3" }],
};

export const worldPointerExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
    nodes: [
        {
            declaration: 0,
            flows: {
                out: { node: 1, socket: "in" },
            },
        },
        {
            declaration: 1,
            configuration: {
                pointer: { value: ["/nodes/0/translation"] },
            },
            values: {
                value: { value: [1, 1, 1], type: 4 },
            },
            flows: {
                out: { node: 3, socket: "in" },
            },
        },
        {
            declaration: 2,
            configuration: {
                pointer: { value: ["/nodes/{nodeIndex}/translation"] },
            },
            values: {
                nodeIndex: { value: [0], type: 1 },
            },
        },
        {
            declaration: 3,
            values: {
                message: { node: 2, socket: "value" },
            },
        },
    ],
    variables: [],
    events: [],
    types: [{ signature: "bool" }, { signature: "int" }, { signature: "float" }, { signature: "float2" }, { signature: "float3" }],
};

export const doNExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onTick" }, { op: "flow/doN" }, { op: "flow/log", extension: "BABYLON" }],
    nodes: [
        {
            // was type: "event/onTick"
            declaration: 0,
            flows: {
                out: { node: 1, socket: "in" },
            },
            values: {},
            configuration: {},
        },
        {
            // was type: "flow/doN"
            declaration: 1,
            flows: {
                out: { node: 2, socket: "in" },
            },
            values: {
                n: { value: [5], type: 1 },
            },
            configuration: {
                startCount: { value: [0] },
            },
        },
        {
            // was type: "babylon/log"
            declaration: 2,
            flows: {},
            values: {
                message: { node: 1, socket: "currentCount" },
            },
            configuration: {},
        },
    ],
    variables: [],
    events: [],
    types: [{ signature: "bool" }, { signature: "int" }, { signature: "float" }, { signature: "float2" }, { signature: "float3" }],
};
