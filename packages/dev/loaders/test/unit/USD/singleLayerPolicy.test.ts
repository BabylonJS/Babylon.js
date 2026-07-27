import { describe, expect, it } from "vitest";
import { ResolveUsdStageAsync } from "loaders/USD/resolution/usdResolver";
import { type IResolvedPrim, type IResolvedStage } from "loaders/USD/resolution/resolvedStage";

// The single-layer policy never fetches an external layer; it validates and normalizes one parsed
// USDA layer in place.
async function resolveUsda(usda: string): Promise<IResolvedStage> {
    return await ResolveUsdStageAsync(usda, "", "stage.usda", {});
}

function findPrim(stage: IResolvedStage, path: string): IResolvedPrim | undefined {
    const stack = [...stage.root.children];
    while (stack.length > 0) {
        const prim = stack.pop()!;
        if (prim.path === path) {
            return prim;
        }
        stack.push(...prim.children);
    }
    return undefined;
}

function findDiagnostic(stage: IResolvedStage, code: string) {
    return stage.diagnostics.find((diagnostic) => diagnostic.message.includes(`[${code}]`));
}

const quadBody = `        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]`;

describe("USD single-layer policy rejects composition-bearing constructs", () => {
    // Each row authors exactly one composition-bearing or undefined-prim construct on a prim that would
    // otherwise map to a scene object. The policy must emit the expected coded diagnostic naming the USD
    // path and drop the prim so no Babylon object can be instantiated from it.
    const rejectionCases: { title: string; usda: string; code: string; rejectedPath: string }[] = [
        {
            title: "reference arc",
            usda: `#usda 1.0\ndef Xform "World" (\n    prepend references = @./child.usda@</Shape>\n)\n{\n}\n`,
            code: "usda-references-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "payload arc",
            usda: `#usda 1.0\ndef Xform "World" (\n    prepend payload = @./child.usda@</Shape>\n)\n{\n}\n`,
            code: "usda-payloads-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "inherits arc",
            usda: `#usda 1.0\ndef Xform "A" (\n    inherits = </_Base>\n)\n{\n}\n`,
            code: "usda-inherits-unsupported",
            rejectedPath: "/A",
        },
        {
            title: "specializes arc",
            usda: `#usda 1.0\ndef Xform "A" (\n    specializes = </_Base>\n)\n{\n}\n`,
            code: "usda-specializes-unsupported",
            rejectedPath: "/A",
        },
        {
            title: "variant set",
            usda: `#usda 1.0\ndef Xform "Model"\n{\n    variantSet "shape" = {\n        "high" {\n            double3 xformOp:translate = (1, 0, 0)\n            uniform token[] xformOpOrder = ["xformOp:translate"]\n        }\n    }\n}\n`,
            code: "usda-variants-unsupported",
            rejectedPath: "/Model",
        },
        {
            title: "relocates",
            usda: `#usda 1.0\ndef Xform "World" (\n    relocates = {\n        </World/A>: </World/B>\n    }\n)\n{\n}\n`,
            code: "usda-relocates-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "override-only prim",
            usda: `#usda 1.0\nover "World"\n{\n    double3 xformOp:translate = (9, 0, 0)\n    uniform token[] xformOpOrder = ["xformOp:translate"]\n}\n`,
            code: "usda-over-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "abstract class prim",
            usda: `#usda 1.0\nclass Xform "_Base"\n{\n    double3 xformOp:translate = (4, 0, 0)\n    uniform token[] xformOpOrder = ["xformOp:translate"]\n}\n`,
            code: "usda-class-unsupported",
            rejectedPath: "/_Base",
        },
        {
            title: "explicit-empty reference list-op",
            usda: `#usda 1.0\ndef Xform "World" (\n    references = []\n)\n{\n}\n`,
            code: "usda-references-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "delete-only reference list-op",
            usda: `#usda 1.0\ndef Xform "World" (\n    delete references = @./child.usda@</Shape>\n)\n{\n}\n`,
            code: "usda-references-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "empty variant set",
            usda: `#usda 1.0\ndef Xform "World"\n{\n    variantSet "shape" = {\n    }\n}\n`,
            code: "usda-variants-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "empty variant selection",
            usda: `#usda 1.0\ndef Xform "World" (\n    variants = {\n    }\n)\n{\n}\n`,
            code: "usda-variants-unsupported",
            rejectedPath: "/World",
        },
        {
            title: "empty relocates",
            usda: `#usda 1.0\ndef Xform "World" (\n    relocates = {\n    }\n)\n{\n}\n`,
            code: "usda-relocates-unsupported",
            rejectedPath: "/World",
        },
    ];

    it.each(rejectionCases)("rejects $title before mapping", async ({ usda, code, rejectedPath }) => {
        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, code);
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("error");
        expect(diagnostic!.path).toBe(rejectedPath);
        expect(findPrim(stage, rejectedPath)).toBeUndefined();
    });

    it("rejects layer-level relocates while retaining the layer's prims", async () => {
        const usda = `#usda 1.0\n(\n    relocates = {\n        </World/A>: </World/B>\n    }\n)\ndef Xform "World"\n{\n}\n`;

        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, "usda-relocates-unsupported");
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("error");
        expect(diagnostic!.path).toBe("stage.usda");
        expect(findPrim(stage, "/World")).toBeDefined();
    });

    it("rejects a sublayer without fetching it and keeps the root layer's own prims", async () => {
        const usda = `#usda 1.0\n(\n    subLayers = [\n        @./base.usda@\n    ]\n)\n\ndef Xform "World"\n{\n}\n`;

        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, "usda-sublayer-unsupported");
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("error");
        expect(diagnostic!.path).toBe("stage.usda");
        // Sublayer rejection removes only the sublayer; a clean root prim is still mapped.
        expect(findPrim(stage, "/World")).toBeDefined();
    });
});

describe("USD single-layer policy normalizes retained single-layer semantics", () => {
    it("prunes an inactive prim and keeps its active siblings", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n    def Xform "Hidden" (\n        active = false\n    )\n    {\n    }\n    def Xform "Shown"\n    {\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, "usda-inactive-prim");
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("info");
        expect(diagnostic!.path).toBe("/World/Hidden");
        expect(findPrim(stage, "/World/Hidden")).toBeUndefined();
        expect(findPrim(stage, "/World/Shown")).toBeDefined();
    });

    it("rejects duplicate sibling prim specs rather than merging them", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n}\n\ndef Xform "World"\n{\n}\n`;

        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, "usda-duplicate-prim");
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("error");
        expect(diagnostic!.path).toBe("/World");
        expect(stage.root.children.filter((prim) => prim.path === "/World")).toHaveLength(0);
    });

    it("drops an instanceable prim after reporting it rather than mapping it as a regular mesh", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n    def Mesh "Inst" (\n        instanceable = true\n    )\n    {\n${quadBody}\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, "usda-instanceable-unsupported");
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("error");
        expect(diagnostic!.path).toBe("/World/Inst");
        expect(findPrim(stage, "/World/Inst")).toBeUndefined();
        expect(findPrim(stage, "/World")).toBeDefined();
    });

    it("drops only the composition-bearing prim and still maps its clean sibling", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n    def Xform "Bad" (\n        prepend references = @./child.usda@</Shape>\n    )\n    {\n    }\n    def Mesh "Good"\n    {\n${quadBody}\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        expect(findDiagnostic(stage, "usda-references-unsupported")!.path).toBe("/World/Bad");
        expect(findPrim(stage, "/World/Bad")).toBeUndefined();
        expect(findPrim(stage, "/World/Good")).toBeDefined();
        expect(findPrim(stage, "/World/Good")!.kind).toBe("mesh");
    });

    it("passes a clean in-profile single layer through with no policy diagnostics", async () => {
        const usda = `#usda 1.0\n(\n    upAxis = "Y"\n    metersPerUnit = 1\n)\ndef Xform "World"\n{\n    def Mesh "Quad"\n    {\n${quadBody}\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        expect(stage.diagnostics.filter((diagnostic) => diagnostic.message.startsWith("[usda-"))).toEqual([]);
        expect(findPrim(stage, "/World")).toBeDefined();
        expect(findPrim(stage, "/World/Quad")!.kind).toBe("mesh");
    });
});

describe("USD single-layer policy rejects external USD layers authored as asset property values", () => {
    it("rejects an asset default value that points at a USD layer", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n    def Xform "Reader"\n    {\n        asset inputs:file = @other.usda@\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        const diagnostic = findDiagnostic(stage, "usda-asset-layer-unsupported");
        expect(diagnostic).toBeDefined();
        expect(diagnostic!.severity).toBe("error");
        expect(diagnostic!.path).toBe("/World/Reader");
        expect(findPrim(stage, "/World/Reader")).toBeUndefined();
        expect(findPrim(stage, "/World")).toBeDefined();
    });

    it("rejects an asset time sample that points at a USD layer", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n    def Xform "Reader"\n    {\n        asset inputs:file.timeSamples = { 0: @anim.usdc@ }\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        expect(findDiagnostic(stage, "usda-asset-layer-unsupported")!.path).toBe("/World/Reader");
        expect(findPrim(stage, "/World/Reader")).toBeUndefined();
    });

    it("preserves a non-USD sidecar asset value (texture) and maps its prim", async () => {
        const usda = `#usda 1.0\ndef Xform "World"\n{\n    def Xform "Reader"\n    {\n        asset inputs:file = @texture.png@\n    }\n}\n`;

        const stage = await resolveUsda(usda);

        expect(findDiagnostic(stage, "usda-asset-layer-unsupported")).toBeUndefined();
        expect(findPrim(stage, "/World/Reader")).toBeDefined();
    });
});
