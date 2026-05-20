import { describe, expect, it } from "vitest";
import { resolveConnections } from "loaders/FBX/interpreter/connections";
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
