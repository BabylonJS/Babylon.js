import { describe, expect, it } from "vitest";
import { type ISdfLayer, type ISdfPropertySpec } from "loaders/USD/resolution/sdf";

const representativeLayer: ISdfLayer = {
    identifier: "memory:representative.usda",
    upAxis: "Y",
    metersPerUnit: 1,
    timeCodesPerSecond: 24,
    startTimeCode: 1,
    endTimeCode: 48,
    defaultPrim: "World",
    subLayers: [
        {
            assetPath: "./base.usda",
            layerOffset: {
                offset: 0,
                scale: 1,
            },
        },
    ],
    rootPrims: [
        {
            name: "World",
            path: "/World",
            specifier: "def",
            typeName: "Xform",
            properties: {},
            children: [
                {
                    name: "Mesh",
                    path: "/World/Mesh",
                    specifier: "def",
                    typeName: "Mesh",
                    references: {
                        isExplicit: false,
                        appended: [
                            {
                                assetPath: "./meshAsset.usda",
                                primPath: "/AssetRoot",
                                layerOffset: {
                                    offset: 1,
                                    scale: 2,
                                },
                            },
                        ],
                    },
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
                            interpolation: "vertex",
                        },
                        "material:binding": {
                            kind: "relationship",
                            targets: {
                                isExplicit: true,
                                explicit: ["/World/Looks/Default"],
                            },
                        },
                    },
                    children: [],
                    variantSelections: {
                        modelingVariant: "high",
                    },
                    variantSets: [
                        {
                            name: "modelingVariant",
                            variants: {
                                high: {
                                    properties: {
                                        purpose: {
                                            kind: "attribute",
                                            typeName: "token",
                                            default: {
                                                type: "token",
                                                value: "render",
                                            },
                                        },
                                    },
                                    children: [
                                        {
                                            name: "HighDetail",
                                            path: "/World/Mesh/HighDetail",
                                            specifier: "def",
                                            typeName: "Scope",
                                            properties: {},
                                            children: [],
                                        },
                                    ],
                                },
                                low: {
                                    properties: {},
                                    children: [
                                        {
                                            name: "LowDetail",
                                            path: "/World/Mesh/LowDetail",
                                            specifier: "def",
                                            typeName: "Scope",
                                            properties: {},
                                            children: [],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ],
};

describe("Sdf data model", () => {
    it("represents layer metadata, prim hierarchy, and composition arcs as plain data", () => {
        const world = representativeLayer.rootPrims[0];
        const mesh = world.children[0];

        expect(representativeLayer.defaultPrim).toBe("World");
        expect(representativeLayer.subLayers[0].layerOffset?.scale).toBe(1);
        expect(world.path).toBe("/World");
        expect(mesh.references?.isExplicit).toBe(false);
        expect(mesh.references?.appended?.[0].assetPath).toBe("./meshAsset.usda");
        expect(mesh.references?.appended?.[0].layerOffset?.scale).toBe(2);
    });

    it("supports ergonomic discriminant narrowing for property specs", () => {
        const mesh = representativeLayer.rootPrims[0].children[0];
        const points: ISdfPropertySpec = mesh.properties.points;
        const materialBinding: ISdfPropertySpec = mesh.properties["material:binding"];

        expect(points.kind).toBe("attribute");
        if (points.kind !== "attribute") {
            throw new Error("Expected points to be an attribute");
        }
        expect(points.typeName).toBe("point3f[]");
        expect(points.default?.type).toBe("point3f[]");
        expect(points.interpolation).toBe("vertex");

        expect(materialBinding.kind).toBe("relationship");
        if (materialBinding.kind !== "relationship") {
            throw new Error("Expected material:binding to be a relationship");
        }
        expect(materialBinding.targets.isExplicit).toBe(true);
        expect(materialBinding.targets.explicit).toEqual(["/World/Looks/Default"]);
    });

    it("models variant sets as nested specs selected by authored variant selections", () => {
        const mesh = representativeLayer.rootPrims[0].children[0];
        const variantSet = mesh.variantSets?.[0];

        expect(mesh.variantSelections?.modelingVariant).toBe("high");
        expect(variantSet?.name).toBe("modelingVariant");
        expect(variantSet?.variants.high.children[0].path).toBe("/World/Mesh/HighDetail");
        expect(variantSet?.variants.low.children[0].path).toBe("/World/Mesh/LowDetail");
    });
});
