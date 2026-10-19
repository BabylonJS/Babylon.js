import { describe, expect, it } from "vitest";
import { resolveConnections } from "loaders/FBX/interpreter/connections";
import { parseAsciiFBX } from "loaders/FBX/parsers/fbxAsciiParser";
import { type FBXNode } from "loaders/FBX/types/fbxTypes";

describe("resolveConnections", () => {
    it("diagnoses unsupported or unresolved connections without adding them to the graph", () => {
        const map = resolveConnections({
            version: 7500,
            nodes: [
                {
                    name: "Objects",
                    properties: [],
                    children: [createObject("Model", 1, "Root", "Null")],
                },
                {
                    name: "Connections",
                    properties: [],
                    children: [createConnection("XX", 1, 0), createConnection("OO", "MissingLegacy", "Scene", "Connect")],
                },
            ],
        });

        expect(map.connections).toHaveLength(0);
        expect(map.connectionEntries).toHaveLength(2);
        expect(map.diagnostics.map((diagnostic) => diagnostic.reason)).toEqual(["unsupported-connection-type", "unresolved-legacy-endpoint"]);
    });

    it("keeps legacy synthetic mesh geometry IDs separate from object names", () => {
        const map = resolveConnections({
            version: 6100,
            nodes: [
                {
                    name: "Objects",
                    properties: [],
                    children: [createLegacyObject("Model", "MeshA", "Mesh"), createLegacyObject("Model", "MeshA\0Geometry", "Null")],
                },
                {
                    name: "Connections",
                    properties: [],
                    children: [createConnection("OO", "MeshA", "Scene", "Connect")],
                },
            ],
        });

        const syntheticGeometryEntries = map.objectEntries.filter((entry) => entry.source === "legacySyntheticGeometry");
        expect(syntheticGeometryEntries).toHaveLength(1);
        expect(syntheticGeometryEntries[0].id).not.toBe(map.objectEntries.find((entry) => entry.legacyName === "MeshA")?.id);
        expect(map.childrenOf.get(syntheticGeometryEntries[0].id)).toBeUndefined();
    });

    it("diagnoses duplicate parents while preserving existing last-parent behavior", () => {
        const map = resolveConnections({
            version: 7500,
            nodes: [
                {
                    name: "Objects",
                    properties: [],
                    children: [createObject("Model", 1, "Child", "Null"), createObject("Model", 2, "ParentA", "Null"), createObject("Model", 3, "ParentB", "Null")],
                },
                {
                    name: "Connections",
                    properties: [],
                    children: [createConnection("OO", 1, 2), createConnection("OO", 1, 3)],
                },
            ],
        });

        expect(map.parentOf.get(1)?.id).toBe(3);
        expect(map.diagnostics.some((diagnostic) => diagnostic.reason === "duplicate-parent")).toBe(true);
    });

    it("keeps distinct object IDs beyond 2^53 distinct", () => {
        // 2^53 and 2^53 + 1 round to the same double; the parsers keep the exact text so the ids stay apart.
        const map = resolveConnections(
            parseAsciiFBX(`; FBX 7.5.0 project file
Objects: {
    Model: 9007199254740993, "Model::A", "Null" {
        Version: 232
    }
    Model: 9007199254740992, "Model::B", "Null" {
        Version: 232
    }
}
Connections: {
    C: "OO", 9007199254740993, 0
}`)
        );

        expect(map.objects.size).toBe(2);
        const a = map.objectEntries.find((entry) => entry.node.properties[1].value === "Model::A")!;
        const b = map.objectEntries.find((entry) => entry.node.properties[1].value === "Model::B")!;
        expect(a.id).not.toBe(b.id);
        expect(map.connections).toHaveLength(1);
        expect(map.connections[0].childId).toBe(a.id);
        expect(map.parentOf.get(a.id)?.id).toBe(0);
        expect(map.parentOf.get(b.id)).toBeUndefined();
    });

    it("rejects fractional and non-finite object IDs", () => {
        const map = resolveConnections({
            version: 7500,
            nodes: [
                {
                    name: "Objects",
                    properties: [],
                    children: [createObject("Model", 1.5, "Fraction", "Null"), createObject("Model", NaN, "NotANumber", "Null"), createObject("Model", 2, "Ok", "Null")],
                },
            ],
        });

        expect(Array.from(map.objects.keys())).toEqual([2]);
    });

    it("keeps synthetic IDs clear of the IDs used by the file", () => {
        // A 7.1 style geometry with an inline Shape gets a synthetic deformer, channel and shape geometry.
        const geometry: FBXNode = {
            ...createObject("Geometry", -1, "Geometry::Cube", "Mesh"),
            children: [{ name: "Shape", properties: [{ type: "string", value: "Smile" }], children: [] }],
        };
        const map = resolveConnections({
            version: 7100,
            nodes: [
                {
                    name: "Objects",
                    properties: [],
                    children: [geometry, createObject("Model", -2, "Model::Cube", "Mesh"), createObject("Model", -3, "Model::Other", "Null")],
                },
                { name: "Connections", properties: [], children: [createConnection("OO", -1, -2)] },
            ],
        });

        expect(map.objects.get(-1)?.name).toBe("Geometry");
        expect(map.objects.get(-2)?.name).toBe("Model");
        expect(map.objects.get(-3)?.name).toBe("Model");
        const synthetic = map.objectEntries.filter((entry) => entry.synthetic);
        expect(synthetic).toHaveLength(3);
        expect(synthetic.every((entry) => entry.id !== -1 && entry.id !== -2 && entry.id !== -3)).toBe(true);
    });
});

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

function createLegacyObject(name: string, objectName: string, subType: string): FBXNode {
    return {
        name,
        properties: [
            { type: "string", value: objectName },
            { type: "string", value: subType },
        ],
        children: [],
    };
}

function createConnection(type: string, child: number | string, parent: number | string, nodeName = "C"): FBXNode {
    return {
        name: nodeName,
        properties: [
            { type: "string", value: type },
            typeof child === "number" ? { type: "int64", value: child } : { type: "string", value: child },
            typeof parent === "number" ? { type: "int64", value: parent } : { type: "string", value: parent },
        ],
        children: [],
    };
}
