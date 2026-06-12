import { describe, expect, it } from "vitest";
import { extractBlendShapes } from "loaders/FBX/interpreter/blendShapes";
import { resolveConnections } from "loaders/FBX/interpreter/connections";
import { type FBXDocument, type FBXNode, type FBXProperty } from "loaders/FBX/types/fbxTypes";

describe("FBX blend shape in-betweens", () => {
    it("extracts FullWeights and sorts in-between shapes by weight", () => {
        const blendShapes = extractBlendShapes(resolveConnections(createBlendShapeDocument()));
        const channel = blendShapes[0].channels[0];

        expect(channel.fullWeights).toEqual([50, 100]);
        expect(Array.from(channel.shapes[0].vertices)).toEqual([0.5, 0, 0]);
        expect(Array.from(channel.shapes[1].vertices)).toEqual([1, 0, 0]);
        expect(channel.diagnostics).toEqual([]);
    });

    it("ignores mismatched FullWeights when a channel has only one shape", () => {
        const blendShapes = extractBlendShapes(resolveConnections(createSingleShapeFullWeightsDocument()));
        const channel = blendShapes[0].channels[0];

        expect(channel.fullWeights).toBeNull();
        expect(channel.shapes).toHaveLength(1);
        expect(Array.from(channel.shapes[0].vertices)).toEqual([1, 0, 0]);
        expect(channel.diagnostics).toEqual([]);
    });

    it("extracts ASCII shape indexes parsed as Float64Array", () => {
        const blendShapes = extractBlendShapes(resolveConnections(createAsciiShapeIndexesDocument()));
        const shape = blendShapes[0].channels[0].shapes[0];

        expect(Array.from(shape.indices)).toEqual([0]);
        expect(Array.from(shape.vertices)).toEqual([1, 0, 0]);
    });
});

function createBlendShapeDocument(): FBXDocument {
    return {
        version: 7500,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Geometry", 1, "Geometry::Base", "Mesh"),
                    createObject("Deformer", 2, "Deformer::BlendShape", "BlendShape"),
                    {
                        ...createObject("Deformer", 3, "SubDeformer::Smile", "BlendShapeChannel"),
                        children: [{ name: "FullWeights", properties: [{ type: "float64[]", value: new Float64Array([100, 50]) }], children: [] }],
                    },
                    createShape(4, [1, 0, 0]),
                    createShape(5, [0.5, 0, 0]),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [createConnection("OO", 2, 1), createConnection("OO", 3, 2), createConnection("OO", 4, 3), createConnection("OO", 5, 3)],
            },
        ],
    };
}

function createSingleShapeFullWeightsDocument(): FBXDocument {
    return {
        version: 7500,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Geometry", 1, "Geometry::Base", "Mesh"),
                    createObject("Deformer", 2, "Deformer::BlendShape", "BlendShape"),
                    {
                        ...createObject("Deformer", 3, "SubDeformer::Blink", "BlendShapeChannel"),
                        children: [{ name: "FullWeights", properties: [{ type: "float64[]", value: new Float64Array([50, 100]) }], children: [] }],
                    },
                    createShape(4, [1, 0, 0]),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [createConnection("OO", 2, 1), createConnection("OO", 3, 2), createConnection("OO", 4, 3)],
            },
        ],
    };
}

function createAsciiShapeIndexesDocument(): FBXDocument {
    return {
        version: 7400,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Geometry", 1, "Geometry::Base", "Mesh"),
                    createObject("Deformer", 2, "Deformer::BlendShape", "BlendShape"),
                    createObject("Deformer", 3, "SubDeformer::Smile", "BlendShapeChannel"),
                    createShape(4, [1, 0, 0], new Float64Array([0])),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [createConnection("OO", 2, 1), createConnection("OO", 3, 2), createConnection("OO", 4, 3)],
            },
        ],
    };
}

function createShape(id: number, vertices: number[], indexes: Int32Array | Float64Array = new Int32Array([0])): FBXNode {
    return {
        ...createObject("Geometry", id, `Geometry::Shape${id.toString()}`, "Shape"),
        children: [
            { name: "Indexes", properties: [{ type: indexes instanceof Int32Array ? "int32[]" : "float64[]", value: indexes }], children: [] },
            { name: "Vertices", properties: [{ type: "float64[]", value: new Float64Array(vertices) }], children: [] },
        ],
    };
}

function createObject(name: string, id: number, objectName: string, subType: string): FBXNode {
    return {
        name,
        properties: [
            { type: "int64", value: id },
            { type: "string", value: objectName },
            { type: "string", value: subType },
        ],
        children: [],
    };
}

function createConnection(type: string, child: number, parent: number): FBXNode {
    const properties: FBXProperty[] = [
        { type: "string", value: type },
        { type: "int64", value: child },
        { type: "int64", value: parent },
    ];
    return { name: "C", properties, children: [] };
}
