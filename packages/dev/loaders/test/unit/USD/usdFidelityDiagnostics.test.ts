import { describe, expect, it } from "vitest";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer, type ISdfPrimSpec, type ISdfPropertySpec } from "loaders/USD/resolution/sdf";

// The USD loader must be honest about the fidelity it can deliver: approximated or unsupported
// features should surface as IResolvedDiagnostic entries instead of silently degrading, and animation
// semantics (held visibility, matrix decomposition) must match USD.

const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function layerOf(rootPrims: ISdfPrimSpec[], metadata?: ISdfLayer["metadata"]): ISdfLayer {
    return { identifier: "/Scenes/fidelity.usda", timeCodesPerSecond: 24, subLayers: [], rootPrims, metadata };
}

const triPoints: ISdfPropertySpec = {
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
};
const triCounts: ISdfPropertySpec = { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [3] } };
const triIndices: ISdfPropertySpec = { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0, 1, 2] } };

function meshPrim(name: string, extra: Record<string, ISdfPropertySpec> = {}): ISdfPrimSpec {
    return {
        name,
        path: `/${name}`,
        specifier: "def",
        typeName: "Mesh",
        properties: { points: triPoints, faceVertexCounts: triCounts, faceVertexIndices: triIndices, ...extra },
        children: [],
    };
}

function tokenAttribute(typeName: string, value: unknown): ISdfPropertySpec {
    return { kind: "attribute", typeName, default: { type: typeName, value } } as ISdfPropertySpec;
}

describe("USD fidelity diagnostics", () => {
    it("emits a diagnostic when a mesh is subdivided under USD's default catmullClark scheme", () => {
        const stage = MapLayerToResolvedStage(layerOf([meshPrim("M")]));
        const subdivision = stage.diagnostics.find((diagnostic) => /subdivision/i.test(diagnostic.message));
        expect(subdivision).toBeDefined();
        expect(subdivision!.severity).toBe("info");
        expect(subdivision!.message).toMatch(/catmullClark/i);
    });

    it("does not flag subdivision when the mesh opts out with subdivisionScheme none", () => {
        const stage = MapLayerToResolvedStage(layerOf([meshPrim("M", { subdivisionScheme: tokenAttribute("token", "none") })]));
        expect(stage.diagnostics.find((diagnostic) => /subdivision/i.test(diagnostic.message))).toBeUndefined();
    });

    it("flags loop subdivision as an approximation", () => {
        const stage = MapLayerToResolvedStage(layerOf([meshPrim("M", { subdivisionScheme: tokenAttribute("token", "loop") })]));
        expect(stage.diagnostics.find((diagnostic) => /subdivision/i.test(diagnostic.message))?.message).toMatch(/loop/i);
    });

    it("reports an unknown authored subdivisionScheme token without relabeling it catmullClark", () => {
        const stage = MapLayerToResolvedStage(layerOf([meshPrim("M", { subdivisionScheme: tokenAttribute("token", "frobnicate") })]));
        const diagnostic = stage.diagnostics.find((entry) => /subdivision/i.test(entry.message) && entry.path === "/M");
        expect(diagnostic?.message).toContain("frobnicate");
    });

    it("reports the unauthored-default subdivision advisory exactly once per stage", () => {
        const stage = MapLayerToResolvedStage(layerOf([meshPrim("A"), meshPrim("B"), meshPrim("C")]));
        expect(stage.diagnostics.filter((entry) => /subdivision/i.test(entry.message))).toHaveLength(1);
    });

    it("diagnoses UsdLux lights as unsupported and skips them", () => {
        const stage = MapLayerToResolvedStage(
            layerOf([
                { name: "Sun", path: "/Sun", specifier: "def", typeName: "DistantLight", properties: {}, children: [] },
                { name: "Rect", path: "/Rect", specifier: "def", typeName: "RectLight", properties: {}, children: [] },
                { name: "Sphere", path: "/Sphere", specifier: "def", typeName: "SphereLight", properties: {}, children: [] },
                { name: "Sky", path: "/Sky", specifier: "def", typeName: "DomeLight", properties: {}, children: [] },
            ])
        );
        for (const path of ["/Sun", "/Rect", "/Sphere", "/Sky"]) {
            expect(stage.diagnostics.find((diagnostic) => diagnostic.path === path)?.message).toMatch(/not supported/i);
        }
    });

    it.each([
        "Plane",
        "BasisCurves",
        "NurbsCurves",
        "HermiteCurves",
        "Points",
        "NurbsPatch",
        "TetMesh",
        "Volume",
        "Cube",
        "Sphere",
        "Cylinder",
        "Cone",
        "Capsule",
        "PointInstancer",
    ])("emits exactly one diagnostic naming an unsupported %s prim and creates no mesh", (typeName) => {
        const prim: ISdfPrimSpec = { name: typeName, path: `/${typeName}`, specifier: "def", typeName, properties: {}, children: [] };
        const stage = MapLayerToResolvedStage(layerOf([prim]));
        const diagnostics = stage.diagnostics.filter((entry) => entry.path === `/${typeName}`);
        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].message).toContain(typeName);
        expect(stage.meshes).toHaveLength(0);
    });

    it("skips PointInstancer prototype targets instead of rendering them once at their authored pose", () => {
        const prototype = meshPrim("Prototype");
        prototype.path = "/Prototypes/Prototype";
        const stage = MapLayerToResolvedStage(
            layerOf([
                {
                    name: "Instancer",
                    path: "/Instancer",
                    specifier: "def",
                    typeName: "PointInstancer",
                    properties: {
                        prototypes: {
                            kind: "relationship",
                            targets: { isExplicit: true, explicit: ["../Prototypes/Prototype"] },
                        },
                    },
                    children: [],
                },
                {
                    name: "Prototypes",
                    path: "/Prototypes",
                    specifier: "def",
                    typeName: "Scope",
                    properties: {},
                    children: [prototype],
                },
            ])
        );

        expect(stage.diagnostics.find((diagnostic) => diagnostic.path === "/Instancer")?.message).toMatch(/prototype targets.*skipped/i);
        expect(stage.meshes).toHaveLength(0);
        expect(stage.root.children.find((prim) => prim.path === "/Prototypes")?.children).toHaveLength(0);
    });

    it("does not flag a supported Mesh as unsupported", () => {
        const stage = MapLayerToResolvedStage(layerOf([meshPrim("M")]));
        expect(stage.diagnostics.some((entry) => /not supported/i.test(entry.message) && entry.path === "/M")).toBe(false);
    });
});

describe("USD animation correctness", () => {
    it("holds visibility animation even when the layer default interpolation is linear", () => {
        const mesh = meshPrim("M", {
            visibility: {
                kind: "attribute",
                typeName: "token",
                timeSamples: {
                    times: [0, 24],
                    values: [
                        { type: "token", value: "inherited" },
                        { type: "token", value: "invisible" },
                    ],
                },
            },
            "xformOp:translate": {
                kind: "attribute",
                typeName: "double3",
                timeSamples: {
                    times: [0, 24],
                    values: [
                        { type: "vec3d", value: [0, 0, 0] },
                        { type: "vec3d", value: [1, 0, 0] },
                    ],
                },
            },
            xformOpOrder: tokenAttribute("token[]", ["xformOp:translate"]),
        });
        const stage = MapLayerToResolvedStage(layerOf([mesh], { interpolation: { type: "token", value: "linear" } }));
        const tracks = stage.root.children[0].animation!.tracks;
        expect(tracks.find((track) => track.target === "visibility")!.interpolation).toBe("held");
        expect(tracks.find((track) => track.target === "translation")!.interpolation).toBe("linear");
    });

    it("flags matrix-valued animation approximated via TRS decomposition", () => {
        const mesh = meshPrim("M", {
            "xformOp:transform": {
                kind: "attribute",
                typeName: "matrix4d",
                timeSamples: {
                    times: [0, 24],
                    values: [
                        { type: "matrix4d", value: identityMatrix },
                        { type: "matrix4d", value: identityMatrix },
                    ],
                },
            },
            xformOpOrder: tokenAttribute("token[]", ["xformOp:transform"]),
        });
        const diagnostic = MapLayerToResolvedStage(layerOf([mesh])).diagnostics.find((entry) => /matrix/i.test(entry.message) && /decompos/i.test(entry.message));
        expect(diagnostic).toBeDefined();
    });
});

describe("USD skel:joints binding", () => {
    it("binds influences that reference joints missing from the bound skeleton to the root joint and reports them", () => {
        const layer: ISdfLayer = {
            identifier: "/Scenes/ghost-joint.usda",
            timeCodesPerSecond: 24,
            subLayers: [],
            rootPrims: [
                {
                    name: "World",
                    path: "/World",
                    specifier: "def",
                    typeName: "SkelRoot",
                    properties: {},
                    children: [
                        {
                            name: "Rig",
                            path: "/World/Rig",
                            specifier: "def",
                            typeName: "Skeleton",
                            properties: {
                                joints: tokenAttribute("token[]", ["Root"]),
                                bindTransforms: { kind: "attribute", typeName: "matrix4d[]", default: { type: "matrix4d[]", value: [identityMatrix] } },
                                restTransforms: { kind: "attribute", typeName: "matrix4d[]", default: { type: "matrix4d[]", value: [identityMatrix] } },
                            },
                            children: [],
                        },
                        meshPrim("World/Mesh", {
                            "skel:skeleton": { kind: "relationship", targets: { isExplicit: true, explicit: ["/World/Rig"] } },
                            "skel:joints": tokenAttribute("token[]", ["Root", "Ghost"]),
                            "primvars:skel:jointIndices": {
                                kind: "attribute",
                                typeName: "int[]",
                                metadata: { elementSize: { type: "int", value: 1 } },
                                default: { type: "int[]", value: [0, 1, 0] },
                            },
                            "primvars:skel:jointWeights": {
                                kind: "attribute",
                                typeName: "float[]",
                                metadata: { elementSize: { type: "int", value: 1 } },
                                default: { type: "float[]", value: [1, 1, 1] },
                            },
                        }),
                    ],
                },
            ],
        };
        // meshPrim() sets path "/World/Mesh" via the name argument; fix name to the leaf.
        const mesh = layer.rootPrims[0].children[1];
        mesh.name = "Mesh";
        mesh.path = "/World/Mesh";

        const stage = MapLayerToResolvedStage(layer);
        const resolvedMesh = stage.root.children[0].children.find((child) => child.name === "Mesh")!;

        expect(Array.from(resolvedMesh.skinning!.jointIndices)).toEqual([0, 0, 0]);
        // The unresolved "Ghost" influence is bound to the root joint with its weight preserved
        // (rather than dropped, which would collapse the vertex to the skeleton origin).
        expect(Array.from(resolvedMesh.skinning!.jointWeights)).toEqual([1, 1, 1]);
        const warning = stage.diagnostics.find((diagnostic) => /joint/i.test(diagnostic.message) && /skeleton/i.test(diagnostic.message));
        expect(warning?.severity).toBe("warning");
    });
});
