export const loggerExample = {
    nodes: [
        {
            type: "lifecycle/onStart",
            flows: [
                {
                    id: "out",
                    node: 2,
                    socket: "in",
                },
            ],
        },
        {
            type: "math/add",
            values: [
                {
                    id: "a",
                    value: [1, 2, 3, 4],
                    type: 0,
                },
                {
                    id: "b",
                    value: [1, 2, 3, 4],
                    type: 0,
                },
            ],
        },
        {
            type: "log",
            values: [
                {
                    id: "message",
                    node: 1,
                    socket: "value",
                },
            ],
        },
    ],
    types: [{ signature: "float4" }],
};

export const mathExample = {
    nodes: [
        {
            type: "lifecycle/onStart",
            values: [],
            configuration: [],
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
            configuration: [],
            flows: [],
        },
        {
            type: "math/mul",
            values: [
                {
                    id: "b",
                    value: 2,
                    type: 2,
                },
                {
                    id: "a",
                    node: 1,
                    socket: "value",
                },
            ],
            configuration: [],
            flows: [],
        },
        {
            type: "math/sub",
            values: [
                {
                    id: "b",
                    value: 78,
                    type: 2,
                },
                {
                    id: "a",
                    node: 2,
                    socket: "value",
                },
            ],
            configuration: [],
            flows: [],
        },
        {
            type: "log",
            values: [
                {
                    id: "message",
                    node: 3,
                    socket: "value",
                },
            ],
            configuration: [],
            flows: [],
        },
    ],
    variables: [],
    customEvents: [],
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
            type: "lifecycle/onStart",
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
                    value: 3,
                    type: 0,
                },
                {
                    id: "b",
                    value: 2,
                    type: 0,
                },
            ],
        },
        {
            type: "log",
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
            type: "lifecycle/onStart",
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
            type: "log",
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
            type: "lifecycle/onStart",
            flows: [
                {
                    id: "out",
                    node: 1,
                    socket: "in",
                },
            ],
        },
        {
            type: "customEvent/send",
            configuration: [
                {
                    id: "customEvent",
                    value: 0,
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
            type: "customEvent/receive",
            configuration: [
                {
                    id: "customEvent",
                    value: 0,
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
            type: "log",
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
    customEvents: [
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
            type: "lifecycle/onStart",
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
            type: "world/set",
            values: [
                {
                    id: "a",
                    value: [1, 1, 1],
                    type: 4,
                },
            ],
            configuration: [
                {
                    id: "path",
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
            type: "world/get",
            values: [
                {
                    id: "nodeIndex",
                    value: 0,
                    type: 1,
                },
            ],
            configuration: [
                {
                    id: "path",
                    value: "/nodes/{nodeIndex}/translation",
                },
            ],
            flows: [],
        },
        {
            type: "log",
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
    customEvents: [],
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
            type: "lifecycle/onTick",
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
                    value: 5,
                    type: 1,
                },
            ],
            configuration: [
                {
                    id: "startCount",
                    value: 0,
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
            type: "log",
            values: [
                {
                    id: "message",
                    node: 1,
                    socket: "value",
                },
            ],
            flows: [],
        },
    ],
    variables: [],
    customEvents: [],
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
