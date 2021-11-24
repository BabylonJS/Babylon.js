export const GUIEditorNodeMaterial = {
    "tags": null,
    "ignoreAlpha": false,
    "maxSimultaneousLights": 4,
    "mode": 0,
    "id": "node",
    "name": "node",
    "checkReadyOnEveryCall": false,
    "checkReadyOnlyOnce": false,
    "state": "",
    "alpha": 1,
    "backFaceCulling": true,
    "cullBackFaces": true,
    "sideOrientation": 1,
    "alphaMode": 2,
    "_needDepthPrePass": false,
    "disableDepthWrite": false,
    "disableColorWrite": false,
    "forceDepthWrite": false,
    "depthFunction": 0,
    "separateCullingPass": false,
    "fogEnabled": true,
    "pointSize": 1,
    "zOffset": 0,
    "zOffsetUnits": 0,
    "pointsCloud": false,
    "fillMode": 0,
    "editorData": {
        "locations": [
            {
                "blockId": 211,
                "x": -1460,
                "y": -100
            },
            {
                "blockId": 212,
                "x": -1740,
                "y": -100
            },
            {
                "blockId": 213,
                "x": -2000,
                "y": -160
            },
            {
                "blockId": 214,
                "x": -2260,
                "y": -180
            },
            {
                "blockId": 215,
                "x": -2240,
                "y": -80
            },
            {
                "blockId": 216,
                "x": -2000,
                "y": -20
            },
            {
                "blockId": 217,
                "x": 3380,
                "y": 740
            },
            {
                "blockId": 218,
                "x": 2720,
                "y": 540
            },
            {
                "blockId": 219,
                "x": 2960,
                "y": 200
            },
            {
                "blockId": 220,
                "x": 2400,
                "y": 320
            },
            {
                "blockId": 221,
                "x": 2080,
                "y": 320
            },
            {
                "blockId": 222,
                "x": 1600,
                "y": 560
            },
            {
                "blockId": 223,
                "x": 1320,
                "y": 500
            },
            {
                "blockId": 224,
                "x": 1080,
                "y": 420
            },
            {
                "blockId": 225,
                "x": 820,
                "y": 520
            },
            {
                "blockId": 226,
                "x": 540,
                "y": 520
            },
            {
                "blockId": 227,
                "x": 280,
                "y": 520
            },
            {
                "blockId": 228,
                "x": -60,
                "y": 440
            },
            {
                "blockId": 229,
                "x": -340,
                "y": 420
            },
            {
                "blockId": 230,
                "x": -620,
                "y": 340
            },
            {
                "blockId": 231,
                "x": -880,
                "y": 340
            },
            {
                "blockId": 232,
                "x": -1160,
                "y": 160
            },
            {
                "blockId": 233,
                "x": -1480,
                "y": 260
            },
            {
                "blockId": 234,
                "x": -1160,
                "y": 460
            },
            {
                "blockId": 235,
                "x": -880,
                "y": 480
            },
            {
                "blockId": 236,
                "x": -60,
                "y": 700
            },
            {
                "blockId": 237,
                "x": -340,
                "y": 700
            },
            {
                "blockId": 238,
                "x": -620,
                "y": 700
            },
            {
                "blockId": 239,
                "x": -300,
                "y": 920
            },
            {
                "blockId": 240,
                "x": 540,
                "y": 420
            },
            {
                "blockId": 241,
                "x": 820,
                "y": 660
            },
            {
                "blockId": 242,
                "x": 540,
                "y": 660
            },
            {
                "blockId": 243,
                "x": 280,
                "y": 660
            },
            {
                "blockId": 244,
                "x": 1340,
                "y": 660
            },
            {
                "blockId": 245,
                "x": 1080,
                "y": 800
            },
            {
                "blockId": 246,
                "x": 2160,
                "y": 160
            },
            {
                "blockId": 247,
                "x": 2280,
                "y": 1000
            },
            {
                "blockId": 248,
                "x": 2040,
                "y": 780
            },
            {
                "blockId": 249,
                "x": 2860,
                "y": 840
            }
        ],
        "frames": [
            {
                "x": 1920,
                "y": 80,
                "width": 1859.67,
                "height": 1260,
                "color": [
                    0.2823529411764706,
                    0.2823529411764706,
                    0.2823529411764706
                ],
                "name": "Checkered",
                "isCollapsed": false,
                "blocks": [
                    221,
                    246,
                    220,
                    219,
                    248,
                    247,
                    218,
                    249,
                    217
                ]
            }
        ],
        "x": 155.3919960630531,
        "y": 164.5512292933413,
        "zoom": 0.2532192552683995
    },
    "customType": "BABYLON.NodeMaterial",
    "outputNodes": [
        211,
        217
    ],
    "blocks": [
        {
            "customType": "BABYLON.VertexOutputBlock",
            "id": 211,
            "name": "VertexOutput",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [
                {
                    "name": "vector",
                    "inputName": "vector",
                    "targetBlockId": 212,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": []
        },
        {
            "customType": "BABYLON.TransformBlock",
            "id": 212,
            "name": "WorldPos * ViewProjectionTransform",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [
                {
                    "name": "vector",
                    "inputName": "vector",
                    "targetBlockId": 213,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "transform",
                    "inputName": "transform",
                    "targetBlockId": 216,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                },
                {
                    "name": "xyz"
                }
            ],
            "complementZ": 0,
            "complementW": 1
        },
        {
            "customType": "BABYLON.TransformBlock",
            "id": 213,
            "name": "WorldPos",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [
                {
                    "name": "vector",
                    "inputName": "vector",
                    "targetBlockId": 214,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "transform",
                    "inputName": "transform",
                    "targetBlockId": 215,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                },
                {
                    "name": "xyz"
                }
            ],
            "complementZ": 0,
            "complementW": 1
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 214,
            "name": "position",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 8,
            "mode": 1,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 215,
            "name": "World",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 128,
            "mode": 0,
            "systemValue": 1,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 216,
            "name": "ViewProjection",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 128,
            "mode": 0,
            "systemValue": 4,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false
        },
        {
            "customType": "BABYLON.FragmentOutputBlock",
            "id": 217,
            "name": "FragmentOutput",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 2,
            "inputs": [
                {
                    "name": "rgba",
                    "displayName": "rgba"
                },
                {
                    "name": "rgb",
                    "displayName": "rgb",
                    "inputName": "rgb",
                    "targetBlockId": 218,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "a",
                    "displayName": "a",
                    "inputName": "a",
                    "targetBlockId": 249,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [],
            "convertToGammaSpace": false,
            "convertToLinearSpace": false
        },
        {
            "customType": "BABYLON.LerpBlock",
            "id": 218,
            "name": "Lerp",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "displayName": "left",
                    "inputName": "left",
                    "targetBlockId": 219,
                    "targetConnectionName": "rgb",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "displayName": "right",
                    "inputName": "right",
                    "targetBlockId": 247,
                    "targetConnectionName": "rgb",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "gradient",
                    "displayName": "gradient",
                    "inputName": "gradient",
                    "targetBlockId": 247,
                    "targetConnectionName": "a",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output",
                    "displayName": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.ColorSplitterBlock",
            "id": 219,
            "name": "ColorSplitter",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "rgba",
                    "displayName": "rgba",
                    "inputName": "rgba",
                    "targetBlockId": 220,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "rgb ",
                    "displayName": "rgb ",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": 3
                }
            ],
            "outputs": [
                {
                    "name": "rgb",
                    "displayName": "rgb"
                },
                {
                    "name": "r",
                    "displayName": "r"
                },
                {
                    "name": "g",
                    "displayName": "g"
                },
                {
                    "name": "b",
                    "displayName": "b"
                },
                {
                    "name": "a",
                    "displayName": "a"
                }
            ]
        },
        {
            "customType": "BABYLON.MaxBlock",
            "id": 220,
            "name": "Max",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "displayName": "left",
                    "inputName": "left",
                    "targetBlockId": 221,
                    "targetConnectionName": "rgba",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "displayName": "right",
                    "inputName": "right",
                    "targetBlockId": 246,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output",
                    "displayName": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.ColorMergerBlock",
            "id": 221,
            "name": "ColorMerger",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "rgb ",
                    "displayName": "rgb "
                },
                {
                    "name": "r",
                    "displayName": "r",
                    "inputName": "r",
                    "targetBlockId": 222,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": 0
                },
                {
                    "name": "g",
                    "displayName": "g",
                    "inputName": "g",
                    "targetBlockId": 222,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": 1
                },
                {
                    "name": "b",
                    "displayName": "b",
                    "inputName": "b",
                    "targetBlockId": 222,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": 2
                },
                {
                    "name": "a",
                    "displayName": "a"
                }
            ],
            "outputs": [
                {
                    "name": "rgba",
                    "displayName": "rgba"
                },
                {
                    "name": "rgb",
                    "displayName": "rgb"
                }
            ],
            "rSwizzle": "r",
            "gSwizzle": "g",
            "bSwizzle": "b",
            "aSwizzle": "a"
        },
        {
            "customType": "BABYLON.MaxBlock",
            "id": 222,
            "name": "Max",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 223,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 244,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.MultiplyBlock",
            "id": 223,
            "name": "Multiply",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 224,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 241,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.OneMinusBlock",
            "id": 224,
            "name": "One minus",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "input",
                    "inputName": "input",
                    "targetBlockId": 225,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.ModBlock",
            "id": 225,
            "name": "Mod",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 226,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 240,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.TrigonometryBlock",
            "id": 226,
            "name": "Round",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "input",
                    "inputName": "input",
                    "targetBlockId": 227,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "operation": 5
        },
        {
            "customType": "BABYLON.MultiplyBlock",
            "id": 227,
            "name": "Multiply",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 228,
                    "targetConnectionName": "x",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 236,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.VectorSplitterBlock",
            "id": 228,
            "name": "VectorSplitter",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "xyzw"
                },
                {
                    "name": "xyz "
                },
                {
                    "name": "xy ",
                    "inputName": "xy ",
                    "targetBlockId": 229,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "xyz"
                },
                {
                    "name": "xy"
                },
                {
                    "name": "zw"
                },
                {
                    "name": "x"
                },
                {
                    "name": "y"
                },
                {
                    "name": "z"
                },
                {
                    "name": "w"
                }
            ]
        },
        {
            "customType": "BABYLON.AddBlock",
            "id": 229,
            "name": "Add",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 230,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 235,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.MultiplyBlock",
            "id": 230,
            "name": "Multiply",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 231,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 235,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.DivideBlock",
            "id": 231,
            "name": "Divide",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 232,
                    "targetConnectionName": "xy",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 234,
                    "targetConnectionName": "xy",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.VectorMergerBlock",
            "id": 232,
            "name": "VectorMerger",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "xyzw "
                },
                {
                    "name": "xyz "
                },
                {
                    "name": "xy "
                },
                {
                    "name": "zw "
                },
                {
                    "name": "x",
                    "inputName": "x",
                    "targetBlockId": 233,
                    "targetConnectionName": "x",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "y",
                    "inputName": "y",
                    "targetBlockId": 233,
                    "targetConnectionName": "y",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "z"
                },
                {
                    "name": "w"
                }
            ],
            "outputs": [
                {
                    "name": "xyzw"
                },
                {
                    "name": "xyz"
                },
                {
                    "name": "xy"
                },
                {
                    "name": "zw"
                }
            ],
            "xSwizzle": "x",
            "ySwizzle": "y",
            "zSwizzle": "z",
            "wSwizzle": "w"
        },
        {
            "customType": "BABYLON.VectorSplitterBlock",
            "id": 233,
            "name": "VectorSplitter",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "xyzw",
                    "inputName": "xyzw",
                    "targetBlockId": 212,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "xyz ",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "xy "
                }
            ],
            "outputs": [
                {
                    "name": "xyz"
                },
                {
                    "name": "xy"
                },
                {
                    "name": "zw"
                },
                {
                    "name": "x"
                },
                {
                    "name": "y"
                },
                {
                    "name": "z"
                },
                {
                    "name": "w"
                }
            ]
        },
        {
            "customType": "BABYLON.VectorMergerBlock",
            "id": 234,
            "name": "VectorMerger",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "xyzw "
                },
                {
                    "name": "xyz "
                },
                {
                    "name": "xy "
                },
                {
                    "name": "zw "
                },
                {
                    "name": "x",
                    "inputName": "x",
                    "targetBlockId": 233,
                    "targetConnectionName": "w",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "y",
                    "inputName": "y",
                    "targetBlockId": 233,
                    "targetConnectionName": "w",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "z"
                },
                {
                    "name": "w"
                }
            ],
            "outputs": [
                {
                    "name": "xyzw"
                },
                {
                    "name": "xyz"
                },
                {
                    "name": "xy"
                },
                {
                    "name": "zw"
                }
            ],
            "xSwizzle": "x",
            "ySwizzle": "y",
            "zSwizzle": "z",
            "wSwizzle": "w"
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 235,
            "name": "Vector2",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 4,
            "mode": 0,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false,
            "valueType": "BABYLON.Vector2",
            "value": [
                0.5,
                0.5
            ]
        },
        {
            "customType": "BABYLON.MultiplyBlock",
            "id": 236,
            "name": "Multiply",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 237,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 239,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.DivideBlock",
            "id": 237,
            "name": "Divide",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 238,
                    "targetConnectionName": "x",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 238,
                    "targetConnectionName": "y",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.ScreenSizeBlock",
            "id": 238,
            "name": "ScreenSize",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 2,
            "inputs": [],
            "outputs": [
                {
                    "name": "xy"
                },
                {
                    "name": "x"
                },
                {
                    "name": "y"
                }
            ]
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 239,
            "name": "resolution",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 1,
            "mode": 0,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false,
            "valueType": "number",
            "value": 100
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 240,
            "name": "Float",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 1,
            "mode": 0,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false,
            "valueType": "number",
            "value": 2
        },
        {
            "customType": "BABYLON.ModBlock",
            "id": 241,
            "name": "Mod",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 242,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 240,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.TrigonometryBlock",
            "id": 242,
            "name": "Round",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "input",
                    "inputName": "input",
                    "targetBlockId": 243,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "operation": 5
        },
        {
            "customType": "BABYLON.MultiplyBlock",
            "id": 243,
            "name": "Multiply",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 228,
                    "targetConnectionName": "y",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 239,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.MultiplyBlock",
            "id": 244,
            "name": "Multiply",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "inputName": "left",
                    "targetBlockId": 225,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "inputName": "right",
                    "targetBlockId": 245,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.OneMinusBlock",
            "id": 245,
            "name": "One minus",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "input",
                    "inputName": "input",
                    "targetBlockId": 241,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output"
                }
            ]
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 246,
            "name": "Color4",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 64,
            "mode": 0,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false,
            "valueType": "BABYLON.Color4",
            "value": [
                0.8862745098039215,
                0.8862745098039215,
                0.8862745098039215,
                1
            ]
        },
        {
            "customType": "BABYLON.TextureBlock",
            "id": 247,
            "name": "Texture",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 3,
            "inputs": [
                {
                    "name": "uv",
                    "displayName": "uv",
                    "inputName": "uv",
                    "targetBlockId": 248,
                    "targetConnectionName": "output",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "source",
                    "displayName": "source"
                }
            ],
            "outputs": [
                {
                    "name": "rgba",
                    "displayName": "rgba"
                },
                {
                    "name": "rgb",
                    "displayName": "rgb"
                },
                {
                    "name": "r",
                    "displayName": "r"
                },
                {
                    "name": "g",
                    "displayName": "g"
                },
                {
                    "name": "b",
                    "displayName": "b"
                },
                {
                    "name": "a",
                    "displayName": "a"
                },
                {
                    "name": "level",
                    "displayName": "level"
                }
            ],
            "convertToGammaSpace": false,
            "convertToLinearSpace": false,
            "fragmentOnly": false,
            "disableLevelMultiplication": false
        },
        {
            "customType": "BABYLON.InputBlock",
            "id": 248,
            "name": "uv",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 1,
            "inputs": [],
            "outputs": [
                {
                    "name": "output"
                }
            ],
            "type": 4,
            "mode": 1,
            "animationType": 0,
            "min": 0,
            "max": 0,
            "isBoolean": false,
            "matrixMode": 0,
            "isConstant": false,
            "groupInInspector": "",
            "convertToGammaSpace": false,
            "convertToLinearSpace": false
        },
        {
            "customType": "BABYLON.AddBlock",
            "id": 249,
            "name": "Add",
            "comments": "",
            "visibleInInspector": false,
            "visibleOnFrame": false,
            "target": 4,
            "inputs": [
                {
                    "name": "left",
                    "displayName": "left",
                    "inputName": "left",
                    "targetBlockId": 219,
                    "targetConnectionName": "a",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                },
                {
                    "name": "right",
                    "displayName": "right",
                    "inputName": "right",
                    "targetBlockId": 247,
                    "targetConnectionName": "a",
                    "isExposedOnFrame": true,
                    "exposedPortPosition": -1
                }
            ],
            "outputs": [
                {
                    "name": "output",
                    "displayName": "output"
                }
            ]
        }
    ]
}