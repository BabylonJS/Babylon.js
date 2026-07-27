import { describe, expect, it } from "vitest";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer } from "loaders/USD/resolution/sdf";

const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
];

describe("USD skeleton mapping", () => {
    it("maps Skeletons, static Mesh skinning, and bound SkelAnimation samples", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/skinned.usda",
            timeCodesPerSecond: 24,
            subLayers: [],
            rootPrims: [
                {
                    name: "World",
                    path: "/World",
                    specifier: "def",
                    typeName: "SkelRoot",
                    properties: {
                        "skel:animationSource": { kind: "relationship", targets: { isExplicit: true, explicit: ["/World/Anim"] } },
                    },
                    children: [
                        {
                            name: "Rig",
                            path: "/World/Rig",
                            specifier: "def",
                            typeName: "Skeleton",
                            properties: {
                                joints: { kind: "attribute", typeName: "token[]", default: { type: "token[]", value: ["Root", "Root/Joint"] } },
                                bindTransforms: { kind: "attribute", typeName: "matrix4d[]", default: { type: "matrix4d[]", value: [identityMatrix, identityMatrix] } },
                                restTransforms: { kind: "attribute", typeName: "matrix4d[]", default: { type: "matrix4d[]", value: [identityMatrix, identityMatrix] } },
                            },
                            children: [],
                        },
                        {
                            name: "Mesh",
                            path: "/World/Mesh",
                            specifier: "def",
                            typeName: "Mesh",
                            properties: {
                                points: {
                                    kind: "attribute",
                                    typeName: "point3f[]",
                                    default: {
                                        type: "point3f[]",
                                        value: [
                                            [0, 0, 0],
                                            [1, 0, 0],
                                            [0, 1, 0],
                                        ],
                                    },
                                },
                                faceVertexCounts: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [3] } },
                                faceVertexIndices: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [2, 0, 1] } },
                                "skel:skeleton": { kind: "relationship", targets: { isExplicit: true, explicit: ["/World/Rig"] } },
                                "skel:joints": { kind: "attribute", typeName: "token[]", default: { type: "token[]", value: ["Root/Joint", "Root"] } },
                                "primvars:skel:jointIndices": {
                                    kind: "attribute",
                                    typeName: "int[]",
                                    metadata: { elementSize: { type: "int", value: 2 } },
                                    default: { type: "int[]", value: [0, 1, 0, 1, 1, 0] },
                                },
                                "primvars:skel:jointWeights": {
                                    kind: "attribute",
                                    typeName: "float[]",
                                    metadata: { elementSize: { type: "int", value: 2 } },
                                    default: { type: "float[]", value: [0.75, 0.25, 0.5, 0.5, 1, 0] },
                                },
                                "primvars:skel:geomBindTransform": { kind: "attribute", typeName: "matrix4d", default: { type: "matrix4d", value: identityMatrix } },
                            },
                            children: [],
                        },
                        {
                            name: "Anim",
                            path: "/World/Anim",
                            specifier: "def",
                            typeName: "SkelAnimation",
                            properties: {
                                joints: { kind: "attribute", typeName: "token[]", default: { type: "token[]", value: ["Root", "Root/Joint"] } },
                                translations: {
                                    kind: "attribute",
                                    typeName: "float3[]",
                                    timeSamples: {
                                        times: [0, 24],
                                        values: [
                                            {
                                                type: "vec3f[]",
                                                value: [
                                                    [0, 0, 0],
                                                    [0, 1, 0],
                                                ],
                                            },
                                            {
                                                type: "vec3f[]",
                                                value: [
                                                    [0, 0, 0],
                                                    [0, 2, 0],
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                            children: [],
                        },
                    ],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const world = stage.root.children[0];
        const mesh = world.children[1];

        expect(world.kind).toBe("transform");
        expect(stage.skeletons).toHaveLength(1);
        expect(stage.skeletons[0].joints).toEqual(["Root", "Root/Joint"]);
        expect(Array.from(stage.skeletons[0].parentIndices)).toEqual([-1, 0]);
        expect(stage.skeletons[0].bindTransforms).toEqual([identityMatrix, identityMatrix]);
        expect(stage.skeletons[0].restTransforms).toEqual([identityMatrix, identityMatrix]);
        expect(Array.from(stage.skeletons[0].animation!.times)).toEqual([0, 1]);
        expect(stage.skeletons[0].animation!.joints[1].jointIndex).toBe(1);
        expect(Array.from(stage.skeletons[0].animation!.joints[1].translations)).toEqual([0, 1, 0, 0, 2, 0]);

        expect(mesh.kind).toBe("mesh");
        expect(mesh.skinning?.skeletonIndex).toBe(0);
        expect(mesh.skinning?.influencesPerVertex).toBe(2);
        expect(Array.from(mesh.skinning!.jointIndices)).toEqual([0, 1, 1, 0, 1, 0]);
        expect(Array.from(mesh.skinning!.jointWeights)).toEqual([1, 0, 0.75, 0.25, 0.5, 0.5]);
        expect(mesh.skinning?.geomBindTransform).toEqual(identityMatrix);
        // The skinned mesh has no authored subdivisionScheme, so it now carries an honest subdivision
        // info diagnostic; nothing else (no errors or warnings) should be reported.
        expect(stage.diagnostics.filter((diagnostic) => !/subdivision/i.test(diagnostic.message))).toEqual([]);
    });
});
