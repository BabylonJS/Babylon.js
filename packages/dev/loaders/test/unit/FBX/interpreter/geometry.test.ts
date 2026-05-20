import { describe, expect, it } from "vitest";
import { extractGeometry } from "loaders/FBX/interpreter/geometry";
import { type FBXNode, type FBXPropertyValue } from "loaders/FBX/types/fbxTypes";

describe("FBX geometry fidelity", () => {
    it("ear-clips concave polygons while preserving per-polygon material indices", () => {
        const geometry = extractGeometry(
            createGeometryNode([0, 0, 0, 2, 0, 0, 1, 1, 0, 2, 2, 0, 0, 2, 0, 3, 0, 0, 4, 0, 0, 3, 1, 0], [0, 1, 2, 3, -5, 5, 6, -8], [createLayerElementMaterial([7, 3])]),
            1
        );

        expect(geometry.indices.length).toBe(12);
        expect(Array.from(geometry.materialIndices ?? [])).toEqual([7, 7, 7, 3]);
        expect(geometry.diagnostics).toEqual([]);
    });

    it("falls back for degenerate n-gons and records diagnostics", () => {
        const geometry = extractGeometry(createGeometryNode([0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0], [0, 1, 2, -4]), 1);

        expect(geometry.indices.length).toBe(6);
        expect(geometry.diagnostics.some((diagnostic) => diagnostic.type === "degenerate-polygon")).toBe(true);
    });

    it("expands tangent and binormal layer elements", () => {
        const geometry = extractGeometry(
            createGeometryNode(
                [0, 0, 0, 1, 0, 0, 0, 1, 0],
                [0, 1, -3],
                [
                    createLayerElement("LayerElementNormal", "Normals", "NormalsIndex", [0, 0, 1, 0, 0, 1, 0, 0, 1]),
                    createLayerElement("LayerElementTangent", "Tangents", "TangentsIndex", [1, 0, 0, 1, 0, 0, 1, 0, 0]),
                    createLayerElement("LayerElementBinormal", "Binormals", "BinormalsIndex", [0, 1, 0, 0, 1, 0, 0, 1, 0]),
                ]
            ),
            1
        );

        expect(Array.from(geometry.tangents ?? [])).toEqual([1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1]);
        expect(Array.from(geometry.binormals ?? [])).toEqual([0, 1, 0, 0, 1, 0, 0, 1, 0]);
    });
});

function createGeometryNode(vertices: number[], polygonVertexIndex: number[], children: FBXNode[] = []): FBXNode {
    return {
        name: "Geometry",
        properties: [
            { type: "int64", value: 1 },
            { type: "string", value: "Geometry::Synthetic" },
            { type: "string", value: "Mesh" },
        ],
        children: [
            { name: "Vertices", properties: [{ type: "float64[]", value: new Float64Array(vertices) }], children: [] },
            { name: "PolygonVertexIndex", properties: [{ type: "int32[]", value: new Int32Array(polygonVertexIndex) }], children: [] },
            ...children,
        ],
    };
}

function createLayerElementMaterial(materials: number[]): FBXNode {
    return {
        name: "LayerElementMaterial",
        properties: [{ type: "int32", value: 0 }],
        children: [
            child("MappingInformationType", "ByPolygon"),
            child("ReferenceInformationType", "Direct"),
            { name: "Materials", properties: [{ type: "int32[]", value: new Int32Array(materials) }], children: [] },
        ],
    };
}

function createLayerElement(name: string, dataName: string, indexName: string, data: number[]): FBXNode {
    return {
        name,
        properties: [{ type: "int32", value: 0 }],
        children: [
            child("MappingInformationType", "ByPolygonVertex"),
            child("ReferenceInformationType", "Direct"),
            { name: dataName, properties: [{ type: "float64[]", value: new Float64Array(data) }], children: [] },
            { name: indexName, properties: [{ type: "int32[]", value: new Int32Array([]) }], children: [] },
        ],
    };
}

function child(name: string, value: FBXPropertyValue): FBXNode {
    return {
        name,
        properties: [{ type: typeof value === "number" ? "int32" : "string", value }],
        children: [],
    };
}
