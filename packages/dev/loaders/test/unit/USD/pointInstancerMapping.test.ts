import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AdaptResolvedStageToScene } from "loaders/USD/adapter/usdAdapter";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer, type ISdfPrimSpec } from "loaders/USD/resolution/sdf";

const prototypeMesh: ISdfPrimSpec = {
    name: "Triangle",
    path: "/World/Instancer/Prototypes/Triangle",
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
        faceVertexIndices: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0, 1, 2] } },
    },
    children: [],
};

describe("USD point instancer mapping", () => {
    it("maps PointInstancer payloads and pools prototype meshes without emitting prototype children", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/instancer.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "World",
                    path: "/World",
                    specifier: "def",
                    typeName: "Xform",
                    properties: {},
                    children: [
                        {
                            name: "Instancer",
                            path: "/World/Instancer",
                            specifier: "def",
                            typeName: "PointInstancer",
                            properties: {
                                prototypes: { kind: "relationship", targets: { isExplicit: true, explicit: ["/World/Instancer/Prototypes/Triangle"] } },
                                protoIndices: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0, 0] } },
                                positions: {
                                    kind: "attribute",
                                    typeName: "point3f[]",
                                    default: {
                                        type: "point3f[]",
                                        value: [
                                            [1, 2, 3],
                                            [4, 5, 6],
                                        ],
                                    },
                                },
                                orientations: {
                                    kind: "attribute",
                                    typeName: "quatf[]",
                                    default: {
                                        type: "quatf[]",
                                        value: [
                                            [0, 0, 0, 1],
                                            [0, 0.5, 0, 0.5],
                                        ],
                                    },
                                },
                                scales: {
                                    kind: "attribute",
                                    typeName: "float3[]",
                                    default: {
                                        type: "vec3f[]",
                                        value: [
                                            [1, 1, 1],
                                            [2, 2, 2],
                                        ],
                                    },
                                },
                                invisibleIds: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [1] } },
                            },
                            children: [
                                {
                                    name: "Prototypes",
                                    path: "/World/Instancer/Prototypes",
                                    specifier: "def",
                                    typeName: "Scope",
                                    properties: {},
                                    children: [prototypeMesh],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const instancer = stage.root.children[0].children[0];

        expect(instancer.kind).toBe("pointInstancer");
        expect(instancer.children).toEqual([]);
        expect(stage.meshes).toHaveLength(1);
        expect(instancer.instancer?.prototypeMeshIndices).toEqual([0]);
        expect(Array.from(instancer.instancer!.protoIndices)).toEqual([0, 0]);
        expect(Array.from(instancer.instancer!.positions)).toEqual([1, 2, 3, 4, 5, 6]);
        expect(Array.from(instancer.instancer!.orientations!)).toEqual([0, 0, 0, 1, 0, 0.5, 0, 0.5]);
        expect(Array.from(instancer.instancer!.scales!)).toEqual([1, 1, 1, 2, 2, 2]);
        expect(Array.from(instancer.instancer!.invisibleIds!)).toEqual([1]);
        expect(Array.from(stage.meshes[0].indices)).toEqual([0, 1, 2]);
        // The pooled prototype mesh has no authored subdivisionScheme, so it now carries an honest
        // subdivision info diagnostic; nothing else (no errors or warnings) should be reported.
        expect(stage.diagnostics.filter((diagnostic) => !/subdivision/i.test(diagnostic.message))).toEqual([]);
    });

    it("omits optional PointInstancer buffers when they are not authored", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/minimalInstancer.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "Instancer",
                    path: "/Instancer",
                    specifier: "def",
                    typeName: "PointInstancer",
                    properties: {
                        prototypes: { kind: "relationship", targets: { isExplicit: true, explicit: ["/Instancer/Prototypes/Triangle"] } },
                        protoIndices: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0] } },
                        positions: { kind: "attribute", typeName: "point3f[]", default: { type: "point3f[]", value: [[1, 2, 3]] } },
                    },
                    children: [
                        {
                            name: "Prototypes",
                            path: "/Instancer/Prototypes",
                            specifier: "def",
                            typeName: "Scope",
                            properties: {},
                            children: [{ ...prototypeMesh, path: "/Instancer/Prototypes/Triangle" }],
                        },
                    ],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const instancer = stage.root.children[0].instancer!;

        expect(Array.from(instancer.positions)).toEqual([1, 2, 3]);
        expect(instancer.orientations).toBeUndefined();
        expect(instancer.scales).toBeUndefined();
        expect(instancer.invisibleIds).toBeUndefined();
    });

    it("preserves authored prototype slots when an unsupported hierarchy is skipped", () => {
        const supportedPrototype = { ...prototypeMesh, path: "/Instancer/Supported" };
        const layer: ISdfLayer = {
            identifier: "/Scenes/prototypeSlots.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "Instancer",
                    path: "/Instancer",
                    specifier: "def",
                    typeName: "PointInstancer",
                    properties: {
                        prototypes: {
                            kind: "relationship",
                            targets: { isExplicit: true, explicit: ["/Instancer/Unsupported", "/Instancer/Supported"] },
                        },
                        protoIndices: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0, 1] } },
                        positions: {
                            kind: "attribute",
                            typeName: "point3f[]",
                            default: {
                                type: "point3f[]",
                                value: [
                                    [0, 0, 0],
                                    [2, 0, 0],
                                ],
                            },
                        },
                    },
                    children: [
                        {
                            name: "Unsupported",
                            path: "/Instancer/Unsupported",
                            specifier: "def",
                            typeName: "Xform",
                            properties: {},
                            children: [{ ...prototypeMesh, path: "/Instancer/Unsupported/Nested" }],
                        },
                        supportedPrototype,
                    ],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const instancer = stage.root.children[0].instancer!;

        expect(instancer.prototypeMeshIndices).toEqual([undefined, 0]);
        expect(Array.from(instancer.protoIndices)).toEqual([0, 1]);
        expect(stage.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    severity: "warning",
                    path: "/Instancer/Unsupported",
                    message: expect.stringContaining("prototype hierarchies"),
                }),
            ])
        );

        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const result = AdaptResolvedStageToScene(stage, scene, null, {});
            const supported = result.meshes.find((mesh) => mesh.name === "Instancer_proto1");
            expect(result.meshes.some((mesh) => mesh.name === "Instancer_proto0")).toBe(false);
            expect(supported?.thinInstanceCount).toBe(1);
            expect(supported?._thinInstanceDataStorage.matrixData?.[12]).toBe(2);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
