import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { USDFileLoader } from "loaders/USD/usdFileLoader";

// Phase 0 vertical-slice fixture: a single translated Xform containing a quad Mesh.
const quadUsda = `#usda 1.0
(
    upAxis = "Y"
    metersPerUnit = 1
)

def Xform "World"
{
    double3 xformOp:translate = (1, 2, 3)
    uniform token[] xformOpOrder = ["xformOp:translate"]

    def Mesh "Quad"
    {
        int[] faceVertexCounts = [4]
        int[] faceVertexIndices = [0, 1, 2, 3]
        point3f[] points = [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)]
    }
}
`;

describe("USD loader (Phase 0 spike)", () => {
    it("loads a trivial USDA mesh into the scene", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        const result = await loader.importMeshAsync(null, scene, quadUsda, "");

        const mesh = result.meshes.find((m) => m.name === "Quad");
        expect(mesh).toBeDefined();
        expect(mesh!.getTotalVertices()).toBe(9);
        expect(mesh!.getIndices()!.length).toBe(24);

        scene.dispose();
        engine.dispose();
    });

    it("bakes the parent xform translate into the mesh world position", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        await loader.importMeshAsync(null, scene, quadUsda, "");

        const mesh = scene.meshes.find((m) => m.name === "Quad")!;
        mesh.computeWorldMatrix(true);
        const position = mesh.getAbsolutePosition();
        expect(position.x).toBeCloseTo(1, 4);
        expect(position.y).toBeCloseTo(2, 4);
        expect(position.z).toBeCloseTo(3, 4);

        scene.dispose();
        engine.dispose();
    });

    it("rejects data that is not a valid USD document", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        await expect(loader.importMeshAsync(null, scene, "not a usd file", "")).rejects.toThrow(/USDA/i);

        scene.dispose();
        engine.dispose();
    });

    it("clears asset-container loading state after a failed load", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const loader = new USDFileLoader();

        await expect(loader.loadAssetContainerAsync(scene, "not a usd file", "")).rejects.toThrow(/USDA/i);

        const result = await loader.importMeshAsync(null, scene, quadUsda, "");
        expect(result.meshes.some((mesh) => mesh.name === "Quad")).toBe(true);

        scene.dispose();
        engine.dispose();
    });
});
