import { describe, expect, it } from "vitest";
import { ComposeLayerStack, ResolveSdfListOp } from "loaders/USD/resolution/composition/composeLayerStack";
import { type ISdfLayer, type ISdfPrimSpec, type ISdfPropertySpec, type ISdfReference } from "loaders/USD/resolution/sdf";

describe("USD composition", () => {
    it("layers sublayers so stronger fields win and weaker fields survive", () => {
        const weakLayer = createLayer("weak.usd", [
            createPrim("/World", {
                properties: {
                    color: tokenAttribute("weak"),
                    size: intAttribute(2),
                },
                children: [createPrim("/World/WeakChild")],
            }),
        ]);
        const rootLayer = createLayer(
            "root.usd",
            [
                createPrim("/World", {
                    properties: {
                        color: tokenAttribute("strong"),
                    },
                }),
            ],
            [{ assetPath: "weak.usd" }]
        );

        const { layer, diagnostics } = ComposeLayerStack(rootLayer, (assetPath) => (assetPath === "weak.usd" ? weakLayer : undefined));
        const world = layer.rootPrims[0];

        expect(diagnostics).toEqual([]);
        expectTokenValue(world.properties.color, "strong");
        expectIntValue(world.properties.size, 2);
        expect(world.children.map((child) => child.path)).toEqual(["/World/WeakChild"]);
    });

    it("grafts referenced prims and keeps local opinions stronger", () => {
        const assetLayer = createLayer("asset.usd", [
            createPrim("/Asset", {
                properties: {
                    color: tokenAttribute("referenced"),
                },
                children: [
                    createPrim("/Asset/Mesh", {
                        typeName: "Mesh",
                        properties: {
                            points: intAttribute(4),
                        },
                    }),
                ],
            }),
        ]);
        const rootLayer = createLayer("root.usd", [
            createPrim("/World", {
                properties: {
                    color: tokenAttribute("local"),
                },
                references: explicitReferences([{ assetPath: "asset.usd", primPath: "/Asset" }]),
            }),
        ]);

        const { layer, diagnostics } = ComposeLayerStack(rootLayer, (assetPath) => (assetPath === "asset.usd" ? assetLayer : undefined));
        const world = layer.rootPrims[0];

        expect(diagnostics).toEqual([]);
        expectTokenValue(world.properties.color, "local");
        expect(world.children.map((child) => child.path)).toEqual(["/World/Mesh"]);
        expectIntValue(world.children[0].properties.points, 4);
        expect(world.references).toBeUndefined();
    });

    it("grafts selected variants and leaves unselected variant sets unapplied", () => {
        const rootLayer = createLayer("root.usd", [
            createPrim("/Model", {
                variantSelections: { shape: "high" },
                variantSets: [
                    {
                        name: "shape",
                        variants: {
                            low: {
                                properties: {
                                    detail: tokenAttribute("low"),
                                },
                                children: [createPrim("/Model/LowChild")],
                            },
                            high: {
                                properties: {
                                    detail: tokenAttribute("high"),
                                },
                                children: [createPrim("/Model/HighChild")],
                            },
                        },
                    },
                ],
            }),
            createPrim("/Fallback", {
                variantSets: [
                    {
                        name: "shape",
                        variants: {
                            first: {
                                properties: {
                                    detail: tokenAttribute("first"),
                                },
                                children: [createPrim("/Fallback/FirstChild")],
                            },
                            second: {
                                properties: {
                                    detail: tokenAttribute("second"),
                                },
                                children: [createPrim("/Fallback/SecondChild")],
                            },
                        },
                    },
                ],
            }),
        ]);

        const { layer, diagnostics } = ComposeLayerStack(rootLayer, () => undefined);
        const model = layer.rootPrims.find((prim) => prim.path === "/Model")!;
        const fallback = layer.rootPrims.find((prim) => prim.path === "/Fallback")!;

        expect(diagnostics).toEqual([]);
        expectTokenValue(model.properties.detail, "high");
        expect(model.children.map((child) => child.path)).toEqual(["/Model/HighChild"]);
        expect(fallback.properties.detail).toBeUndefined();
        expect(fallback.children).toEqual([]);
    });

    it("resolves reference list operations with prepended and deleted items", () => {
        const assetA = createReferencedAssetLayer("asset-a.usd", "A");
        const assetB = createReferencedAssetLayer("asset-b.usd", "B");
        const assetC = createReferencedAssetLayer("asset-c.usd", "C");
        const weakLayer = createLayer("weak.usd", [
            createPrim("/World", {
                references: explicitReferences([
                    { assetPath: "asset-a.usd", primPath: "/Asset" },
                    { assetPath: "asset-c.usd", primPath: "/Asset" },
                ]),
            }),
        ]);
        const rootLayer = createLayer(
            "root.usd",
            [
                createPrim("/World", {
                    references: {
                        isExplicit: false,
                        prepended: [{ assetPath: "asset-b.usd", primPath: "/Asset" }],
                        deleted: [{ assetPath: "asset-a.usd", primPath: "/Asset" }],
                    },
                }),
            ],
            [{ assetPath: "weak.usd" }]
        );
        const layersByIdentifier = new Map([
            [weakLayer.identifier, weakLayer],
            [assetA.identifier, assetA],
            [assetB.identifier, assetB],
            [assetC.identifier, assetC],
        ]);

        const { layer, diagnostics } = ComposeLayerStack(rootLayer, (assetPath) => layersByIdentifier.get(assetPath));
        const world = layer.rootPrims[0];

        expect(diagnostics).toEqual([]);
        expect(world.children.map((child) => child.name)).toEqual(["C", "B"]);
    });

    it("applies list-op deletion before appended items", () => {
        expect(
            ResolveSdfListOp<string>([
                {
                    isExplicit: false,
                    appended: ["X"],
                    deleted: ["X"],
                },
            ])
        ).toEqual(["X"]);
    });

    it("produces the same composed structure and diagnostics on every run", () => {
        const asset = createReferencedAssetLayer("asset.usd", "Child");
        const root = createLayer("root.usd", [
            createPrim("/World", {
                references: explicitReferences([{ assetPath: "asset.usd", primPath: "/Asset" }]),
            }),
        ]);
        const resolve = (assetPath: string) => (assetPath === asset.identifier ? asset : undefined);

        const first = ComposeLayerStack(root, resolve);
        const second = ComposeLayerStack(root, resolve);

        expect(second).toEqual(first);
    });

    it("gives earlier same-kind references stronger opinions", () => {
        const first = createLayer("first.usd", [createPrim("/Asset", { properties: { value: tokenAttribute("first") } })]);
        const second = createLayer("second.usd", [createPrim("/Asset", { properties: { value: tokenAttribute("second") } })]);
        const root = createLayer("root.usd", [
            createPrim("/World", {
                references: explicitReferences([
                    { assetPath: "first.usd", primPath: "/Asset" },
                    { assetPath: "second.usd", primPath: "/Asset" },
                ]),
            }),
        ]);

        const { layer } = ComposeLayerStack(root, (assetPath) => (assetPath === "first.usd" ? first : second));

        expectTokenValue(layer.rootPrims[0].properties.value, "first");
    });

    it("applies automatic rate scaling before an authored layer offset", () => {
        const animated = createLayer("animated.usd", [
            createPrim("/Animated", {
                properties: {
                    value: {
                        kind: "attribute",
                        typeName: "float",
                        timeSamples: { times: [1], values: [{ type: "float", value: 1 }] },
                    },
                },
            }),
        ]);
        animated.timeCodesPerSecond = 12;
        const root = createLayer("root.usd", [], [{ assetPath: "animated.usd", layerOffset: { scale: 2, offset: 10 } }]);
        root.timeCodesPerSecond = 24;

        const { layer } = ComposeLayerStack(root, () => animated);

        const property = layer.rootPrims[0].properties.value;
        expect(property.kind === "attribute" ? property.timeSamples?.times : undefined).toEqual([14]);
    });

    it.each([0, -1])("ignores an invalid layer offset scale of %s", (scale) => {
        const animated = createLayer("animated.usd", [
            createPrim("/Animated", {
                properties: {
                    value: {
                        kind: "attribute",
                        typeName: "float",
                        timeSamples: { times: [1], values: [{ type: "float", value: 1 }] },
                    },
                },
            }),
        ]);
        const root = createLayer("root.usd", [], [{ assetPath: "animated.usd", layerOffset: { scale, offset: 10 } }]);

        const { layer, diagnostics } = ComposeLayerStack(root, () => animated);

        const property = layer.rootPrims[0].properties.value;
        expect(property.kind === "attribute" ? property.timeSamples?.times : undefined).toEqual([1]);
        expect(diagnostics).toContainEqual(
            expect.objectContaining({
                code: "composition-invalid-layer-offset",
                severity: "error",
                layerIdentifier: "root.usd",
                assetPath: "animated.usd",
            })
        );
    });

    it("automatically remaps referenced animation samples into the source layer rate", () => {
        const animated = createLayer("animated.usd", [
            createPrim("/Animated", {
                properties: {
                    value: {
                        kind: "attribute",
                        typeName: "float",
                        timeSamples: { times: [12], values: [{ type: "float", value: 1 }] },
                    },
                },
            }),
        ]);
        animated.timeCodesPerSecond = 12;
        const root = createLayer("root.usd", [
            createPrim("/World", {
                references: explicitReferences([{ assetPath: "animated.usd", primPath: "/Animated" }]),
            }),
        ]);
        root.timeCodesPerSecond = 24;

        const { layer } = ComposeLayerStack(root, () => animated);

        const property = layer.rootPrims[0].properties.value;
        expect(property.kind === "attribute" ? property.timeSamples?.times : undefined).toEqual([24]);
    });

    it("applies automatic rate scaling across a nested sublayer stack", () => {
        const base = createLayer("base.usd", [
            createPrim("/Animated", {
                properties: {
                    value: {
                        kind: "attribute",
                        typeName: "float",
                        timeSamples: { times: [6], values: [{ type: "float", value: 1 }] },
                    },
                },
            }),
        ]);
        base.timeCodesPerSecond = 6;
        const middle = createLayer("middle.usd", [], [{ assetPath: "base.usd" }]);
        middle.timeCodesPerSecond = 12;
        const root = createLayer("root.usd", [], [{ assetPath: "middle.usd" }]);
        root.timeCodesPerSecond = 24;
        const layers = new Map([
            [base.identifier, base],
            [middle.identifier, middle],
        ]);

        const { layer } = ComposeLayerStack(root, (assetPath) => layers.get(assetPath));

        const property = layer.rootPrims[0].properties.value;
        expect(property.kind === "attribute" ? property.timeSamples?.times : undefined).toEqual([24]);
    });

    it("uses the root framesPerSecond before a sublayer timeCodesPerSecond", () => {
        const animated = createLayer("animated.usd", [
            createPrim("/Animated", {
                properties: {
                    value: {
                        kind: "attribute",
                        typeName: "float",
                        timeSamples: { times: [60], values: [{ type: "float", value: 1 }] },
                    },
                },
            }),
        ]);
        animated.timeCodesPerSecond = 60;
        const root = createLayer("root.usd", [], [{ assetPath: "animated.usd" }]);
        root.framesPerSecond = 30;

        const { layer } = ComposeLayerStack(root, () => animated);

        const property = layer.rootPrims[0].properties.value;
        expect(layer.timeCodesPerSecond).toBe(30);
        expect(property.kind === "attribute" ? property.timeSamples?.times : undefined).toEqual([30]);
    });

    it("does not promote stage metadata from a sublayer into the root layer", () => {
        const subLayer = createLayer("metadata.usd", [createPrim("/SubLayerDefault")]);
        subLayer.upAxis = "Z";
        subLayer.metersPerUnit = 1;
        subLayer.startTimeCode = 10;
        subLayer.endTimeCode = 20;
        subLayer.defaultPrim = "SubLayerDefault";
        const root = createLayer("root.usd", [], [{ assetPath: "metadata.usd" }]);

        const { layer } = ComposeLayerStack(root, () => subLayer);

        expect(layer.upAxis).toBe("Y");
        expect(layer.metersPerUnit).toBe(0.01);
        expect(layer.startTimeCode).toBeUndefined();
        expect(layer.endTimeCode).toBeUndefined();
        expect(layer.defaultPrim).toBeUndefined();
    });

    it("does not use a sublayer defaultPrim for an internal root-layer reference", () => {
        const subLayer = createLayer("defaults.usd", [createPrim("/Source", { properties: { value: tokenAttribute("source") } })]);
        subLayer.defaultPrim = "Source";
        const root = createLayer(
            "root.usd",
            [
                createPrim("/Target", {
                    references: explicitReferences([{ assetPath: "" }]),
                }),
            ],
            [{ assetPath: "defaults.usd" }]
        );

        const { layer, diagnostics } = ComposeLayerStack(root, () => subLayer);

        expect(layer.rootPrims.find((prim) => prim.path === "/Target")!.properties.value).toBeUndefined();
        expect(diagnostics).toContainEqual(
            expect.objectContaining({
                code: "composition-missing-internal-reference",
                primPath: "/Target",
            })
        );
    });

    it("resolves an internal reference without a prim path through defaultPrim", () => {
        const root = createLayer("root.usd", [
            createPrim("/Source", { properties: { value: tokenAttribute("source") } }),
            createPrim("/Target", { references: explicitReferences([{ assetPath: "" }]) }),
        ]);
        root.defaultPrim = "Source";

        const { layer } = ComposeLayerStack(root, () => undefined);

        expectTokenValue(layer.rootPrims.find((prim) => prim.path === "/Target")!.properties.value, "source");
    });
});

function createReferencedAssetLayer(identifier: string, childName: string): ISdfLayer {
    return createLayer(identifier, [
        createPrim("/Asset", {
            children: [createPrim(`/Asset/${childName}`)],
        }),
    ]);
}

function createLayer(identifier: string, rootPrims: ISdfPrimSpec[], subLayers: ISdfLayer["subLayers"] = []): ISdfLayer {
    return {
        identifier,
        subLayers,
        rootPrims,
    };
}

function createPrim(path: string, overrides: Partial<ISdfPrimSpec> = {}): ISdfPrimSpec {
    return {
        name: path.slice(path.lastIndexOf("/") + 1),
        path,
        specifier: "def",
        typeName: "Xform",
        properties: {},
        children: [],
        ...overrides,
    };
}

function explicitReferences(references: ISdfReference[]): ISdfPrimSpec["references"] {
    return {
        isExplicit: true,
        explicit: references,
    };
}

function tokenAttribute(value: string): ISdfPropertySpec {
    return {
        kind: "attribute",
        typeName: "token",
        default: {
            type: "token",
            value,
        },
    };
}

function intAttribute(value: number): ISdfPropertySpec {
    return {
        kind: "attribute",
        typeName: "int",
        default: {
            type: "int",
            value,
        },
    };
}

function expectTokenValue(property: ISdfPropertySpec, value: string): void {
    expect(property.kind).toBe("attribute");
    expect(property.kind === "attribute" ? property.default : undefined).toEqual({
        type: "token",
        value,
    });
}

function expectIntValue(property: ISdfPropertySpec, value: number): void {
    expect(property.kind).toBe("attribute");
    expect(property.kind === "attribute" ? property.default : undefined).toEqual({
        type: "int",
        value,
    });
}
