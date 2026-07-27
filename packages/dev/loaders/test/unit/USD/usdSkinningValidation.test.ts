import { describe, expect, it } from "vitest";
import { MapLayerToResolvedStage } from "loaders/USD/resolution/mapping/stageMapper";
import { type ISdfLayer, type ISdfPrimSpec, type ISdfPropertySpec } from "loaders/USD/resolution/sdf";

// skel:joints and jointIndices are untrusted: only an authored token[] skel:joints is honored, and
// every influence index must be a finite, non-negative integer within the binding/skeleton bounds.
// Invalid influences are reported once and bound to the root joint with their weight preserved so the
// vertex keeps its normalization rather than collapsing to the skeleton origin.

const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

interface ISkinnedStageOptions {
    skeletonJoints?: string[];
    skelJoints?: ISdfPropertySpec;
    jointIndices: number[];
    jointWeights: number[];
    influencesPerVertex?: number;
}

function buildSkinnedStage(options: ISkinnedStageOptions) {
    const skeletonJoints = options.skeletonJoints ?? ["Root", "Hip"];
    const elementSize = options.influencesPerVertex ?? 1;
    const mesh: ISdfPrimSpec = {
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
            faceVertexIndices: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0, 1, 2] } },
            "skel:skeleton": { kind: "relationship", targets: { isExplicit: true, explicit: ["/World/Rig"] } },
            "primvars:skel:jointIndices": {
                kind: "attribute",
                typeName: "int[]",
                metadata: { elementSize: { type: "int", value: elementSize } },
                default: { type: "int[]", value: options.jointIndices },
            },
            "primvars:skel:jointWeights": {
                kind: "attribute",
                typeName: "float[]",
                metadata: { elementSize: { type: "int", value: elementSize } },
                default: { type: "float[]", value: options.jointWeights },
            },
        },
        children: [],
    };
    if (options.skelJoints) {
        mesh.properties["skel:joints"] = options.skelJoints;
    }

    const layer: ISdfLayer = {
        identifier: "/Scenes/skin.usda",
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
                            joints: { kind: "attribute", typeName: "token[]", default: { type: "token[]", value: skeletonJoints } },
                            bindTransforms: { kind: "attribute", typeName: "matrix4d[]", default: { type: "matrix4d[]", value: skeletonJoints.map(() => identityMatrix) } },
                            restTransforms: { kind: "attribute", typeName: "matrix4d[]", default: { type: "matrix4d[]", value: skeletonJoints.map(() => identityMatrix) } },
                        },
                        children: [],
                    },
                    mesh,
                ],
            },
        ],
    };

    const stage = MapLayerToResolvedStage(layer);
    const resolvedMesh = stage.root.children[0].children.find((child) => child.name === "Mesh")!;
    return { stage, skinning: resolvedMesh.skinning!, diagnostics: stage.diagnostics };
}

function tokenArray(value: string[]): ISdfPropertySpec {
    return { kind: "attribute", typeName: "token[]", default: { type: "token[]", value } };
}

function jointBindingWarnings(diagnostics: { severity: string; message: string }[]): { severity: string; message: string }[] {
    return diagnostics.filter((diagnostic) => /joint/i.test(diagnostic.message) || /skel:joints/i.test(diagnostic.message));
}

describe("USD skel:joints type validation", () => {
    it("ignores a wrong-typed skel:joints attribute with a diagnostic and falls back to direct skeleton indexing", () => {
        const { skinning, diagnostics } = buildSkinnedStage({
            skelJoints: { kind: "attribute", typeName: "int[]", default: { type: "int[]", value: [0, 1] } },
            jointIndices: [0, 1, 0],
            jointWeights: [1, 1, 1],
        });
        expect(jointBindingWarnings(diagnostics).some((d) => /token\[\]/i.test(d.message))).toBe(true);
        // Falls back to direct skeleton indexing (0 -> Root, 1 -> Hip), which are valid.
        expect(Array.from(skinning.jointIndices)).toEqual([0, 1, 0]);
    });

    it("ignores a skel:joints relationship with a diagnostic", () => {
        const { diagnostics } = buildSkinnedStage({
            skelJoints: { kind: "relationship", targets: { isExplicit: true, explicit: ["/World/Rig/Root"] } },
            jointIndices: [0, 1, 0],
            jointWeights: [1, 1, 1],
        });
        expect(jointBindingWarnings(diagnostics).some((d) => /relationship/i.test(d.message))).toBe(true);
    });

    it("remaps a valid authored token[] skel:joints binding, first-occurrence-wins on duplicates", () => {
        const { skinning, diagnostics } = buildSkinnedStage({
            skeletonJoints: ["Root", "Hip"],
            skelJoints: tokenArray(["Hip", "Root"]),
            jointIndices: [0, 1, 0],
            jointWeights: [1, 1, 1],
        });
        // binding[0]=Hip->1, binding[1]=Root->0
        expect(Array.from(skinning.jointIndices)).toEqual([1, 0, 1]);
        expect(jointBindingWarnings(diagnostics)).toEqual([]);
    });
});

describe("USD skel:joints influence validation", () => {
    it.each([
        ["negative", [-1, 0, 1]],
        ["fractional", [0.5, 0, 1]],
        ["NaN", [Number.NaN, 0, 1]],
        ["out-of-range without a binding list", [9, 0, 1]],
    ])("binds a %s influence to the root joint with a diagnostic and preserved weight", (_label, indices) => {
        const { skinning, diagnostics } = buildSkinnedStage({ jointIndices: indices, jointWeights: [0.5, 0.5, 0.5] });
        expect(Array.from(skinning.jointIndices)).toEqual([0, 0, 1]);
        expect(Array.from(skinning.jointWeights)).toEqual([0.5, 0.5, 0.5]);
        expect(jointBindingWarnings(diagnostics).some((d) => d.severity === "warning")).toBe(true);
    });

    it("reports many invalid influences with a single diagnostic and binds them all to the root", () => {
        const { skinning, diagnostics } = buildSkinnedStage({ jointIndices: [-1, 5, -3], jointWeights: [0.25, 0.5, 0.25] });
        expect(Array.from(skinning.jointIndices)).toEqual([0, 0, 0]);
        expect(Array.from(skinning.jointWeights)).toEqual([0.25, 0.5, 0.25]);
        expect(jointBindingWarnings(diagnostics)).toHaveLength(1);
    });

    it("passes through zero weights unchanged", () => {
        const { skinning, diagnostics } = buildSkinnedStage({ jointIndices: [0, 1, 0], jointWeights: [0, 0, 0] });
        expect(Array.from(skinning.jointWeights)).toEqual([0, 0, 0]);
        expect(Array.from(skinning.jointIndices)).toEqual([0, 1, 0]);
        expect(jointBindingWarnings(diagnostics)).toEqual([]);
    });

    it("accepts valid in-range direct indices without a diagnostic", () => {
        const { skinning, diagnostics } = buildSkinnedStage({ jointIndices: [0, 1, 1], jointWeights: [1, 1, 1] });
        expect(Array.from(skinning.jointIndices)).toEqual([0, 1, 1]);
        expect(jointBindingWarnings(diagnostics)).toEqual([]);
    });
});
