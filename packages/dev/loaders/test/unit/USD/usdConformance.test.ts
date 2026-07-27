import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { USDFileLoader } from "loaders/USD/usdFileLoader";

// These conformance tests drive flagship "exceed three.js" capabilities all the way from USDA text
// through parse -> validate -> map -> adapt, asserting on the resulting Babylon scene graph.
// They are fully offline and deterministic (NullEngine, no network, no binary fixtures).

async function LoadUsdaAsync(source: string): Promise<{ scene: Scene; dispose: () => void; result: Awaited<ReturnType<USDFileLoader["importMeshAsync"]>> }> {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const loader = new USDFileLoader();
    const result = await loader.importMeshAsync(null, scene, source, "");
    return {
        scene,
        result,
        dispose: () => {
            scene.dispose();
            engine.dispose();
        },
    };
}

describe("USD conformance", () => {
    it("bakes xform timeSamples into an animation group", async () => {
        const usda = `#usda 1.0
(
    timeCodesPerSecond = 24
    startTimeCode = 0
    endTimeCode = 24
)

def Xform "Mover"
{
    double3 xformOp:translate.timeSamples = {
        0: (0, 0, 0),
        24: (10, 0, 0),
    }
    uniform token[] xformOpOrder = ["xformOp:translate"]

    def Mesh "Quad"
    {
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
    }
}
`;

        const { result, dispose } = await LoadUsdaAsync(usda);

        expect(result.animationGroups.length).toBeGreaterThanOrEqual(1);
        const mover = result.transformNodes.find((node) => node.name === "Mover");
        expect(mover).toBeDefined();
        expect(result.animationGroups[0].targetedAnimations.some((targeted) => targeted.target === mover)).toBe(true);

        dispose();
    });

    it("binds a UsdSkel skeleton and skinned mesh to Babylon", async () => {
        const usda = `#usda 1.0

def SkelRoot "Character"
{
    def Skeleton "Skel"
    {
        uniform token[] joints = ["Root", "Root/Tip"]
        uniform matrix4d[] bindTransforms = [
            ( (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1) ),
            ( (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 1, 0), (0, 1, 0, 1) )
        ]
        uniform matrix4d[] restTransforms = [
            ( (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1) ),
            ( (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 1, 0), (0, 1, 0, 1) )
        ]
    }

    def Mesh "Body"
    {
        int[] faceVertexCounts = [3]
        int[] faceVertexIndices = [0, 1, 2]
        point3f[] points = [(0, 0, 0), (1, 0, 0), (0, 1, 0)]
        rel skel:skeleton = </Character/Skel>
        int[] primvars:skel:jointIndices = [0, 0, 1] (
            elementSize = 1
            interpolation = "vertex"
        )
        float[] primvars:skel:jointWeights = [1, 1, 1] (
            elementSize = 1
            interpolation = "vertex"
        )
    }
}
`;

        const { result, dispose } = await LoadUsdaAsync(usda);

        expect(result.skeletons.length).toBe(1);
        expect(result.skeletons[0].bones.length).toBe(2);
        const body = result.meshes.find((mesh) => mesh.name === "Body");
        expect(body).toBeDefined();
        expect(body!.skeleton).toBe(result.skeletons[0]);

        dispose();
    });
});
