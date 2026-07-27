import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { USDFileLoader } from "loaders/USD/usdFileLoader";
import { ResolveUsdStageWithFetcherAsync } from "loaders/USD/resolution/usdResolver";
import { type IResolvedPrim, type IResolvedStage } from "loaders/USD/resolution/resolvedStage";

// Issue #63: honor single-layer transform stacks (order/invert/reset), parent-child accumulation,
// inherited (namespace) visibility, and diagnose unsupported inherited purpose. These fixtures drive
// real USDA text through parse -> compose -> map (parse-to-stage seam) and, for the transform/visibility
// behavior the adapter owns, all the way to a NullEngine scene graph. Everything is offline (no network,
// no external layers), so the injected fetcher must never be called.

const noFetch = async (): Promise<ArrayBuffer> => {
    throw new Error("These fixtures reference no external assets.");
};

async function ResolveStageAsync(usda: string): Promise<IResolvedStage> {
    return await ResolveUsdStageWithFetcherAsync(usda, "", "stage.usda", {}, noFetch);
}

function FindPrim(prim: IResolvedPrim, path: string): IResolvedPrim | undefined {
    if (prim.path === path) {
        return prim;
    }
    for (const child of prim.children) {
        const found = FindPrim(child, path);
        if (found) {
            return found;
        }
    }
    return undefined;
}

function DiagnosticMessages(stage: IResolvedStage): string[] {
    return stage.diagnostics.map((diagnostic) => diagnostic.message);
}

// A minimal valid quad so a Mesh prim maps to real Babylon geometry in the NullEngine cases.
const quadBody = `        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]`;

describe("USD transform stacks and inherited visibility (parse-to-stage)", () => {
    it("treats an authored xformOpOrder as authoritative and ignores unlisted xformOps", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    double3 xformOp:translate = (1, 2, 3)
    double3 xformOp:scale = (2, 2, 2)
    uniform token[] xformOpOrder = ["xformOp:translate"]
}
`;
        const stage = await ResolveStageAsync(usda);
        const world = FindPrim(stage.root, "/World")!;

        expect(world.transform.translation).toEqual([1, 2, 3]);
        // scale is authored but not listed in xformOpOrder, so it must not be applied.
        expect(world.transform.scale).toEqual([1, 1, 1]);
        expect(world.transform.resetsXformStack).toBeFalsy();
    });

    it("applies !invert! deterministically (inverse of a pure translate negates it)", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    double3 xformOp:translate = (5, -4, 3)
    uniform token[] xformOpOrder = ["!invert!xformOp:translate"]
}
`;
        const stage = await ResolveStageAsync(usda);
        const world = FindPrim(stage.root, "/World")!;

        expect(world.transform.translation[0]).toBeCloseTo(-5, 6);
        expect(world.transform.translation[1]).toBeCloseTo(4, 6);
        expect(world.transform.translation[2]).toBeCloseTo(-3, 6);
    });

    it("resets the xform stack only when !resetXformStack! is the first entry", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "Reset"
{
    double3 xformOp:translate = (3, 0, 0)
    uniform token[] xformOpOrder = ["!resetXformStack!", "xformOp:translate"]
}

def Xform "Normal"
{
    double3 xformOp:translate = (3, 0, 0)
    uniform token[] xformOpOrder = ["xformOp:translate"]
}
`;
        const stage = await ResolveStageAsync(usda);
        const reset = FindPrim(stage.root, "/Reset")!;
        const normal = FindPrim(stage.root, "/Normal")!;

        expect(reset.transform.resetsXformStack).toBe(true);
        expect(reset.transform.translation).toEqual([3, 0, 0]);
        expect(normal.transform.resetsXformStack).toBeFalsy();
    });

    it("diagnoses and ignores a misplaced !resetXformStack! entry", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    double3 xformOp:translate = (7, 0, 0)
    uniform token[] xformOpOrder = ["xformOp:translate", "!resetXformStack!"]
}
`;
        const stage = await ResolveStageAsync(usda);
        const world = FindPrim(stage.root, "/World")!;

        expect(world.transform.resetsXformStack).toBeFalsy();
        expect(world.transform.translation).toEqual([7, 0, 0]);
        expect(DiagnosticMessages(stage)).toEqual(expect.arrayContaining([expect.stringContaining("only valid as the first xformOpOrder entry")]));
    });

    it("diagnoses an xformOpOrder entry that references an unauthored xformOp", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    double3 xformOp:scale = (2, 2, 2)
    uniform token[] xformOpOrder = ["xformOp:translate"]
}
`;
        const stage = await ResolveStageAsync(usda);
        const world = FindPrim(stage.root, "/World")!;

        expect(world.transform.translation).toEqual([0, 0, 0]);
        expect(world.transform.scale).toEqual([1, 1, 1]);
        expect(DiagnosticMessages(stage)).toEqual(expect.arrayContaining([expect.stringContaining("no authored xformOp attribute")]));
    });

    it("makes descendants of an invisible ancestor invisible regardless of their own value", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    def Xform "Hidden"
    {
        token visibility = "invisible"

        def Xform "Child"
        {
            token visibility = "inherited"

            def Xform "GrandChild"
            {
            }
        }
    }

    def Xform "Shown"
    {
    }
}
`;
        const stage = await ResolveStageAsync(usda);

        expect(FindPrim(stage.root, "/World")!.visible).toBe(true);
        expect(FindPrim(stage.root, "/World/Hidden")!.visible).toBe(false);
        // Descendant re-authored "inherited" but the invisible ancestor still hides it.
        expect(FindPrim(stage.root, "/World/Hidden/Child")!.visible).toBe(false);
        expect(FindPrim(stage.root, "/World/Hidden/Child/GrandChild")!.visible).toBe(false);
        // A sibling with no invisible ancestor stays visible.
        expect(FindPrim(stage.root, "/World/Shown")!.visible).toBe(true);
    });

    it("diagnoses a non-default (inherited) purpose without changing visibility", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "Proxy"
{
    uniform token purpose = "proxy"

    def Xform "Child"
    {
    }
}

def Xform "Default"
{
    uniform token purpose = "default"
}
`;
        const stage = await ResolveStageAsync(usda);

        // Purpose is diagnosed but the profile is unchanged: the prims stay visible/imported.
        expect(FindPrim(stage.root, "/Proxy")!.visible).toBe(true);
        const messages = DiagnosticMessages(stage);
        expect(messages).toEqual(expect.arrayContaining([expect.stringContaining("purpose 'proxy' is not supported")]));
        // "default" purpose is fully supported, so it must not be diagnosed.
        expect(messages.some((message) => message.includes("purpose 'default'"))).toBe(false);
    });
});

describe("USD transform stacks and inherited visibility (NullEngine)", () => {
    async function LoadAsync(usda: string): Promise<{ scene: Scene; dispose: () => void }> {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        await new USDFileLoader().importMeshAsync(null, scene, usda, "");
        return {
            scene,
            dispose: () => {
                scene.dispose();
                engine.dispose();
            },
        };
    }

    it("accumulates parent and child transforms onto the world matrix", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "Parent"
{
    double3 xformOp:translate = (10, 0, 0)
    uniform token[] xformOpOrder = ["xformOp:translate"]

    def Xform "Child"
    {
        double3 xformOp:translate = (0, 5, 0)
        uniform token[] xformOpOrder = ["xformOp:translate"]

        def Mesh "Quad"
        {
${quadBody}
        }
    }
}
`;
        const { scene, dispose } = await LoadAsync(usda);
        const quad = scene.getMeshByName("Quad")!;
        quad.computeWorldMatrix(true);
        const position = quad.getAbsolutePosition();

        expect(position.x).toBeCloseTo(10, 5);
        expect(position.y).toBeCloseTo(5, 5);
        expect(position.z).toBeCloseTo(0, 5);

        dispose();
    });

    it("ignores ancestor transforms for a prim that resets the xform stack", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "Parent"
{
    double3 xformOp:translate = (10, 0, 0)
    uniform token[] xformOpOrder = ["xformOp:translate"]

    def Xform "Reset"
    {
        double3 xformOp:translate = (2, 0, 0)
        uniform token[] xformOpOrder = ["!resetXformStack!", "xformOp:translate"]

        def Mesh "Quad"
        {
${quadBody}
        }
    }
}
`;
        const { scene, dispose } = await LoadAsync(usda);
        const quad = scene.getMeshByName("Quad")!;
        quad.computeWorldMatrix(true);
        const position = quad.getAbsolutePosition();

        // Without the reset the mesh would sit at x = 12; the reset drops the parent's translate.
        expect(position.x).toBeCloseTo(2, 5);
        expect(position.y).toBeCloseTo(0, 5);
        expect(position.z).toBeCloseTo(0, 5);

        dispose();
    });

    it("disables a mesh whose ancestor is invisible", async () => {
        const usda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "Hidden"
{
    token visibility = "invisible"

    def Mesh "Quad"
    {
${quadBody}
    }
}
`;
        const { scene, dispose } = await LoadAsync(usda);
        const quad = scene.getMeshByName("Quad")!;

        expect(quad.isEnabled()).toBe(false);

        dispose();
    });
});
