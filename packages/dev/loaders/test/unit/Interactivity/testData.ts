import { IKHRInteractivity_Graph } from "babylonjs-gltf2interface";

export const loggerExample: IKHRInteractivity_Graph = {
    declarations: [{ op: "event/onStart" }, { op: "babylon/log", extension: "BABYLON_Logging" }, { op: "math/add" }],
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

export const mathExample = {
    nodes: [
        {
            type: "event/onStart",
            flows: [
                {
                    id: "out",
                    node: 4,
                    socket: "in",
                },
            ],
        },
        {
            type: "math/dot",
            values: [
                {
                    id: "a",
                    value: [10, 10, 10],
                    type: 4,
                },
                {
                    id: "b",
                    value: [1, 2, 3],
                    type: 4,
                },
            ],
        },
        {
            type: "math/mul",
            values: [
                {
                    id: "b",
                    value: [2],
                    type: 2,
                },
                {
                    id: "a",
                    node: 1,
                    socket: "value",
                },
            ],
        },
        {
            type: "math/sub",
            values: [
                {
                    id: "b",
                    value: [78],
                    type: 2,
                },
                {
                    id: "a",
                    node: 2,
                    socket: "value",
                },
            ],
        },
        {
            type: "babylon/log",
            values: [
                {
                    id: "message",
                    node: 3,
                    socket: "value",
                },
            ],
        },
    ],
    types: [
        {
            signature: "bool",
        },
        {
            signature: "int",
        },
        {
            signature: "float",
        },
        {
            signature: "float2",
        },
        {
            signature: "float3",
        },
    ],
};

export const intMathExample = {
    nodes: [
        {
            type: "event/onStart",
            flows: [
                {
                    id: "out",
                    node: 2,
                    socket: "in",
                },
            ],
        },
        {
            type: "math/div",
            values: [
                {
                    id: "a",
                    value: [3],
                    type: 0,
                },
                {
                    id: "b",
                    value: [2],
                    type: 0,
                },
            ],
        },
        {
            type: "babylon/log",
            values: [
                {
                    id: "message",
                    node: 1,
                    socket: "value",
                },
            ],
        },
    ],
    types: [
        {
            signature: "int",
        },
    ],
};

export const matrixMathExample = {
    nodes: [
        {
            type: "event/onStart",
            flows: [
                {
                    id: "out",
                    node: 3,
                    socket: "in",
                },
            ],
        },
        {
            type: "math/matmul",
            values: [
                {
                    id: "a",
                    value: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
                    type: 0,
                },
                {
                    id: "b",
                    value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                    type: 0,
                },
            ],
        },
        {
            type: "math/transpose",
            values: [
                {
                    id: "a",
                    node: 1,
                    socket: "value",
                },
            ],
        },
        {
            type: "babylon/log",
            values: [
                {
                    id: "message",
                    node: 2,
                    socket: "value",
                },
            ],
        },
    ],
    types: [
        {
            signature: "float4x4",
        },
    ],
};

export const customEventExample = {
    nodes: [
        {
            type: "event/onStart",
            flows: [
                {
                    id: "out",
                    node: 1,
                    socket: "in",
                },
            ],
        },
        {
            type: "event/send",
            configuration: [
                {
                    id: "customEvent",
                    value: [0],
                },
            ],
            values: [
                {
                    id: "float3ToSend",
                    value: [1.0, 2.0, 3.0],
                    type: 3,
                },
            ],
        },
        {
            type: "event/receive",
            configuration: [
                {
                    id: "customEvent",
                    value: [0],
                },
            ],
            flows: [
                {
                    id: "out",
                    node: 3,
                    socket: "in",
                },
            ],
        },
        {
            type: "babylon/log",
            values: [
                {
                    id: "message",
                    node: 2,
                    socket: "float3ToSend",
                },
            ],
        },
    ],
    variables: [],
    events: [
        {
            id: "logTwo",
            values: [
                {
                    id: "float3ToSend",
                    type: 3,
                    description: "",
                },
            ],
        },
    ],
    types: [
        {
            signature: "bool",
        },
        {
            signature: "int",
        },
        {
            signature: "float",
        },
        {
            signature: "float3",
        },
    ],
};

export const worldPointerExample = {
    nodes: [
        {
            type: "event/onStart",
            values: [],
            configuration: [],
            flows: [
                {
                    id: "out",
                    node: 1,
                    socket: "in",
                },
            ],
        },
        {
            type: "pointer/set",
            values: [
                {
                    id: "value",
                    value: [1, 1, 1],
                    type: 4,
                },
            ],
            configuration: [
                {
                    id: "pointer",
                    value: "/nodes/0/translation",
                },
            ],
            flows: [
                {
                    id: "out",
                    node: 3,
                    socket: "in",
                },
            ],
        },
        {
            type: "pointer/get",
            values: [
                {
                    id: "nodeIndex",
                    value: [0],
                    type: 1,
                },
            ],
            configuration: [
                {
                    id: "pointer",
                    value: "/nodes/{nodeIndex}/translation",
                },
            ],
            flows: [],
        },
        {
            type: "babylon/log",
            values: [
                {
                    id: "message",
                    node: 2,
                    socket: "value",
                },
            ],
        },
    ],
    variables: [],
    events: [],
    types: [
        {
            signature: "bool",
        },
        {
            signature: "int",
        },
        {
            signature: "float",
        },
        {
            signature: "float2",
        },
        {
            signature: "float3",
        },
    ],
};

export const doNExample = {
    nodes: [
        {
            type: "event/onTick",
            values: [],
            configuration: [],
            flows: [
                {
                    id: "out",
                    node: 1,
                    socket: "in",
                },
            ],
        },
        {
            type: "flow/doN",
            values: [
                {
                    id: "n",
                    value: [5],
                    type: 1,
                },
            ],
            configuration: [
                {
                    id: "startCount",
                    value: [0],
                },
            ],
            flows: [
                {
                    id: "out",
                    node: 2,
                    socket: "in",
                },
            ],
        },
        {
            type: "babylon/log",
            values: [
                {
                    id: "message",
                    node: 1,
                    socket: "currentCount",
                },
            ],
            flows: [],
        },
    ],
    variables: [],
    events: [],
    types: [
        {
            signature: "bool",
        },
        {
            signature: "int",
        },
        {
            signature: "float",
        },
        {
            signature: "float2",
        },
        {
            signature: "float3",
        },
    ],
};
