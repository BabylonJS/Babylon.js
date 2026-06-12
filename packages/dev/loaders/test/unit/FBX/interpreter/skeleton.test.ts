import { describe, expect, it } from "vitest";
import { resolveConnections } from "loaders/FBX/interpreter/connections";
import { resolveRigs } from "loaders/FBX/interpreter/rig";
import { extractSkins } from "loaders/FBX/interpreter/skeleton";
import { type FBXDocument, type FBXNode } from "loaders/FBX/types/fbxTypes";

describe("FBX skeleton interpretation", () => {
    it("includes skeleton ancestors, sorts cluster weights, and resolves rig skin bindings", () => {
        const objectMap = resolveConnections(createSkinDocument());
        const skins = extractSkins(objectMap);
        const rigs = resolveRigs(objectMap, skins);

        expect(skins).toHaveLength(1);
        expect(skins[0].bones.map((bone) => ({ name: bone.name, parentIndex: bone.parentIndex, isCluster: bone.isCluster }))).toEqual([
            { name: "Root", parentIndex: -1, isCluster: false },
            { name: "BoneA", parentIndex: 0, isCluster: true },
            { name: "BoneB", parentIndex: 0, isCluster: true },
        ]);
        expect(skins[0].boneIndices).toEqual([
            [2, 1],
            [1, 2],
        ]);
        expect(skins[0].boneWeights).toEqual([
            [0.8, 0.2],
            [0.9, 0.1],
        ]);

        expect(rigs).toHaveLength(1);
        expect(rigs[0].rootModelIds).toEqual([10]);
        expect(rigs[0].skinBindings[0].skinBoneIndexToRigBoneIndex).toEqual([0, 1, 2]);
        expect(Array.from(rigs[0].skinBindings[0].clusterModelIds)).toEqual([11, 12]);
    });
});

function createSkinDocument(): FBXDocument {
    return {
        version: 7400,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Geometry", 1, "Geometry::Mesh", "Mesh"),
                    createObject("Model", 2, "Model::Mesh", "Mesh"),
                    createObject("Deformer", 3, "Deformer::Skin", "Skin"),
                    createCluster(4, "Deformer::ClusterA", [0, 1], [0.2, 0.9]),
                    createCluster(5, "Deformer::ClusterB", [0, 1], [0.8, 0.1]),
                    createObject("Model", 10, "Model::Root", "Root"),
                    createObject("Model", 11, "Model::BoneA", "LimbNode"),
                    createObject("Model", 12, "Model::BoneB", "LimbNode"),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [
                    createConnection("OO", 1, 2),
                    createConnection("OO", 2, 0),
                    createConnection("OO", 3, 1),
                    createConnection("OO", 4, 3),
                    createConnection("OO", 5, 3),
                    createConnection("OO", 11, 4),
                    createConnection("OO", 12, 5),
                    createConnection("OO", 11, 10),
                    createConnection("OO", 12, 10),
                    createConnection("OO", 10, 0),
                ],
            },
        ],
    };
}

function createObject(name: string, id: number, objectName: string, subType: string, children: FBXNode[] = []): FBXNode {
    return {
        name,
        properties: [
            { type: "int64", value: id },
            { type: "string", value: objectName },
            { type: "string", value: subType },
        ],
        children,
    };
}

function createCluster(id: number, objectName: string, indexes: number[], weights: number[]): FBXNode {
    return createObject("Deformer", id, objectName, "Cluster", [
        { name: "Indexes", properties: [{ type: "int32[]", value: new Int32Array(indexes) }], children: [] },
        { name: "Weights", properties: [{ type: "float64[]", value: new Float64Array(weights) }], children: [] },
        { name: "Mode", properties: [{ type: "string", value: "Normalize" }], children: [] },
        { name: "Transform", properties: [{ type: "float64[]", value: identityMatrix() }], children: [] },
        { name: "TransformLink", properties: [{ type: "float64[]", value: identityMatrix() }], children: [] },
    ]);
}

function identityMatrix(): Float64Array {
    return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function createConnection(type: string, child: number, parent: number): FBXNode {
    return {
        name: "C",
        properties: [
            { type: "string", value: type },
            { type: "int64", value: child },
            { type: "int64", value: parent },
        ],
        children: [],
    };
}
