import { describe, expect, it } from "vitest";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer } from "loaders/USD/resolution/sdf";

const flattenedLayer: ISdfLayer = {
    identifier: "/Scenes/quad.usda",
    subLayers: [],
    rootPrims: [
        {
            name: "World",
            path: "/World",
            specifier: "def",
            typeName: "Xform",
            properties: {
                "xformOp:translate": {
                    kind: "attribute",
                    typeName: "double3",
                    default: { type: "vec3d", value: [1, 2, 3] },
                    timeSamples: {
                        times: [0, 24],
                        values: [
                            { type: "vec3d", value: [1, 2, 3] },
                            { type: "vec3d", value: [4, 5, 6] },
                        ],
                    },
                },
                xformOpOrder: {
                    kind: "attribute",
                    typeName: "token[]",
                    default: { type: "token[]", value: ["xformOp:translate"] },
                },
            },
            children: [
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
                                    [-1, -1, 0],
                                    [1, -1, 0],
                                    [1, 1, 0],
                                    [-1, 1, 0],
                                ],
                            },
                        },
                        faceVertexCounts: {
                            kind: "attribute",
                            typeName: "int[]",
                            default: { type: "int[]", value: [4] },
                        },
                        faceVertexIndices: {
                            kind: "attribute",
                            typeName: "int[]",
                            default: { type: "int[]", value: [0, 1, 2, 3] },
                        },
                        "primvars:st": {
                            kind: "attribute",
                            typeName: "texCoord2f[]",
                            interpolation: "faceVarying",
                            default: {
                                type: "vec2f[]",
                                value: [
                                    [0, 0],
                                    [1, 0],
                                    [1, 1],
                                    [0, 1],
                                ],
                            },
                        },
                        "material:binding": {
                            kind: "relationship",
                            targets: { isExplicit: true, explicit: ["/World/Mat"] },
                        },
                    },
                    children: [],
                },
                {
                    name: "Mat",
                    path: "/World/Mat",
                    specifier: "def",
                    typeName: "Material",
                    properties: {
                        "outputs:surface": {
                            kind: "attribute",
                            typeName: "token",
                            connections: { isExplicit: true, explicit: ["/World/Mat/Preview.outputs:surface"] },
                        },
                    },
                    children: [
                        {
                            name: "Preview",
                            path: "/World/Mat/Preview",
                            specifier: "def",
                            typeName: "Shader",
                            properties: {
                                "info:id": {
                                    kind: "attribute",
                                    typeName: "token",
                                    default: { type: "token", value: "UsdPreviewSurface" },
                                },
                                "inputs:diffuseColor": {
                                    kind: "attribute",
                                    typeName: "color3f",
                                    default: { type: "color3f", value: [0.8, 0.7, 0.6] },
                                    connections: { isExplicit: true, explicit: ["/World/Mat/DiffuseTexture.outputs:rgb"] },
                                },
                            },
                            children: [],
                        },
                        {
                            name: "DiffuseTexture",
                            path: "/World/Mat/DiffuseTexture",
                            specifier: "def",
                            typeName: "Shader",
                            properties: {
                                "info:id": {
                                    kind: "attribute",
                                    typeName: "token",
                                    default: { type: "token", value: "UsdUVTexture" },
                                },
                                "inputs:file": {
                                    kind: "attribute",
                                    typeName: "asset",
                                    default: { type: "asset", value: { authoredPath: "./textures/baseColor.png" } },
                                },
                                "inputs:sourceColorSpace": {
                                    kind: "attribute",
                                    typeName: "token",
                                    default: { type: "token", value: "sRGB" },
                                },
                                "inputs:st": {
                                    kind: "attribute",
                                    typeName: "float2",
                                    connections: { isExplicit: true, explicit: ["/World/Mat/StReader.outputs:result"] },
                                },
                            },
                            children: [],
                        },
                        {
                            name: "StReader",
                            path: "/World/Mat/StReader",
                            specifier: "def",
                            typeName: "Shader",
                            properties: {
                                "info:id": {
                                    kind: "attribute",
                                    typeName: "token",
                                    default: { type: "token", value: "UsdPrimvarReader_float2" },
                                },
                                "inputs:varname": {
                                    kind: "attribute",
                                    typeName: "token",
                                    default: { type: "token", value: "st" },
                                },
                            },
                            children: [],
                        },
                    ],
                },
            ],
        },
    ],
};

describe("USD stage mapper", () => {
    it("maps a flattened Sdf layer into a resolved stage", () => {
        const stage = MapLayerToResolvedStage(flattenedLayer);
        const world = stage.root.children[0];
        const meshPrim = world.children[0];

        expect(stage.metadata).toMatchObject({
            upAxis: "Y",
            metersPerUnit: 0.01,
            timeCodesPerSecond: 24,
            startTimeCode: 0,
            endTimeCode: 0,
        });
        expect(world.path).toBe("/World");
        expect(world.kind).toBe("transform");
        expect(world.transform.translation).toEqual([1, 2, 3]);
        expect(world.children.map((child) => child.name)).toEqual(["Mesh", "Mat"]);

        expect(meshPrim.kind).toBe("mesh");
        expect(meshPrim.materialBinding?.materialIndex).toBe(0);
        const mesh = stage.meshes[meshPrim.meshIndex!];
        expect(Array.from(mesh.indices)).toEqual([0, 1, 2, 0, 2, 3]);
        expect(Array.from(mesh.faceVertexCounts!)).toEqual([4]);
        expect(Array.from(mesh.faceVertexIndices!)).toEqual([0, 1, 2, 3]);
        expect(mesh.subdivisionScheme).toBe("catmullClark");
        expect(mesh.uvSets).toHaveLength(1);
        expect(Array.from(mesh.uvSets![0])).toEqual([0, 0, 1, 0, 1, 1, 0, 1]);

        expect(stage.materials).toHaveLength(1);
        expect(stage.materials[0].baseColor).toEqual([0.8, 0.7, 0.6]);
        expect(stage.materials[0].textures.baseColor).toMatchObject({
            uri: "/Scenes/textures/baseColor.png",
            uvSet: 0,
            colorSpace: "sRGB",
        });

        expect(world.animation?.tracks).toHaveLength(1);
        expect(world.animation?.tracks[0].target).toBe("translation");
        expect(world.animation?.tracks[0].interpolation).toBe("held");
        expect(Array.from(world.animation!.tracks[0].times)).toEqual([0, 1]);
        expect(Array.from(world.animation!.tracks[0].values)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("preserves the USD row-major layout of an xformOp:transform matrix", () => {
        // USD GfMatrix4d is row-major with row-vector semantics (v' = v * M) and translation
        // in the last row, which is byte-identical to Babylon's Matrix storage. The resolved
        // matrix must therefore be a direct copy of the authored matrix, never its transpose.
        // This matrix is a +90 deg rotation about Z that maps the row vector (1,0,0) to (0,1,0)
        // plus a translation of (10, 20, 30). A transpose would invert the rotation and move
        // the translation out of indices [12,13,14], so it is a sharp signal for the layout bug.
        // prettier-ignore
        const rotateZTranslate = [
            0, 1, 0, 0,
            -1, 0, 0, 0,
            0, 0, 1, 0,
            10, 20, 30, 1,
        ];
        const layer: ISdfLayer = {
            identifier: "/transform.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "World",
                    path: "/World",
                    specifier: "def",
                    typeName: "Xform",
                    properties: {
                        "xformOp:transform": {
                            kind: "attribute",
                            typeName: "matrix4d",
                            default: { type: "matrix4d", value: rotateZTranslate },
                        },
                        xformOpOrder: {
                            kind: "attribute",
                            typeName: "token[]",
                            default: { type: "token[]", value: ["xformOp:transform"] },
                        },
                    },
                    children: [],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const world = stage.root.children[0];

        expect(world.transform.matrix).toEqual(rotateZTranslate);
    });

    it("inherits a material binding authored on an ancestor prim", () => {
        // Exporters such as three.js author material:binding on an Xform that references geometry,
        // leaving the referenced Mesh itself unbound. USD direct bindings inherit down namespace, so
        // the Mesh must resolve to the ancestor's material.
        const layer: ISdfLayer = {
            identifier: "/inherited.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "Bound",
                    path: "/Bound",
                    specifier: "def",
                    typeName: "Xform",
                    properties: {
                        "material:binding": {
                            kind: "relationship",
                            targets: { isExplicit: true, explicit: ["/Bound/Mat"] },
                        },
                    },
                    children: [
                        {
                            name: "Geom",
                            path: "/Bound/Geom",
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
                        },
                        {
                            name: "Mat",
                            path: "/Bound/Mat",
                            specifier: "def",
                            typeName: "Material",
                            properties: {
                                "outputs:surface": {
                                    kind: "attribute",
                                    typeName: "token",
                                    connections: { isExplicit: true, explicit: ["/Bound/Mat/Preview.outputs:surface"] },
                                },
                            },
                            children: [
                                {
                                    name: "Preview",
                                    path: "/Bound/Mat/Preview",
                                    specifier: "def",
                                    typeName: "Shader",
                                    properties: {
                                        "info:id": { kind: "attribute", typeName: "token", default: { type: "token", value: "UsdPreviewSurface" } },
                                        "inputs:diffuseColor": { kind: "attribute", typeName: "color3f", default: { type: "color3f", value: [0.1, 0.2, 0.3] } },
                                    },
                                    children: [],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const stage = MapLayerToResolvedStage(layer);
        const geom = stage.root.children[0].children.find((child) => child.name === "Geom");

        expect(geom?.kind).toBe("mesh");
        expect(geom?.materialBinding).toBeDefined();
        expect(stage.materials[geom!.materialBinding!.materialIndex].baseColor).toEqual([0.1, 0.2, 0.3]);
    });

    it("records unsupported material, animation, skeleton, light, camera, and instancing fidelity", () => {
        const triangleProperties = {
            points: {
                kind: "attribute" as const,
                typeName: "point3f[]",
                default: {
                    type: "point3f[]" as const,
                    value: [
                        [0, 0, 0],
                        [1, 0, 0],
                        [0, 1, 0],
                    ],
                },
            },
            faceVertexCounts: {
                kind: "attribute" as const,
                typeName: "int[]",
                default: { type: "int[]" as const, value: [3] },
            },
            faceVertexIndices: {
                kind: "attribute" as const,
                typeName: "int[]",
                default: { type: "int[]" as const, value: [0, 1, 2] },
            },
            "material:binding": {
                kind: "relationship" as const,
                targets: { isExplicit: true, explicit: ["/MissingMaterial"] },
            },
            "skel:skeleton": {
                kind: "relationship" as const,
                targets: { isExplicit: true, explicit: ["/MissingSkeleton"] },
            },
        };
        const layer: ISdfLayer = {
            identifier: "/diagnostics.usda",
            subLayers: [],
            rootPrims: [
                {
                    name: "Animated",
                    path: "/Animated",
                    specifier: "def",
                    typeName: "Xform",
                    properties: {
                        "xformOp:rotateZYX": {
                            kind: "attribute",
                            typeName: "float3",
                            timeSamples: {
                                times: [0],
                                values: [{ type: "vec3f", value: [0, 0, 0] }],
                            },
                        },
                    },
                    children: [],
                },
                {
                    name: "Portal",
                    path: "/Portal",
                    specifier: "def",
                    typeName: "PortalLight",
                    properties: {},
                    children: [],
                },
                {
                    name: "Camera",
                    path: "/Camera",
                    specifier: "def",
                    typeName: "Camera",
                    properties: {
                        fStop: { kind: "attribute", typeName: "float", default: { type: "float", value: 2.8 } },
                        focusDistance: { kind: "attribute", typeName: "float", default: { type: "float", value: 5 } },
                    },
                    children: [],
                },
                {
                    name: "Instancer",
                    path: "/Instancer",
                    specifier: "def",
                    typeName: "PointInstancer",
                    properties: {
                        prototypes: {
                            kind: "relationship",
                            targets: { isExplicit: true, explicit: ["/MissingPrototype"] },
                        },
                    },
                    children: [],
                },
                {
                    name: "Mesh",
                    path: "/Mesh",
                    specifier: "def",
                    typeName: "Mesh",
                    properties: triangleProperties,
                    children: [],
                },
            ],
        };

        const messages = MapLayerToResolvedStage(layer).diagnostics.map((diagnostic) => diagnostic.message);

        expect(messages).toEqual(
            expect.arrayContaining([
                expect.stringContaining("Animation for 'xformOp:rotateZYX' is deferred"),
                expect.stringContaining("Schema PortalLight mapping is not supported"),
                expect.stringContaining("depth-of-field"),
                expect.stringContaining("PointInstancer prototype target was not found"),
                expect.stringContaining("Material binding target was not found"),
                expect.stringContaining("Skel binding target was not found"),
            ])
        );
    });
});
