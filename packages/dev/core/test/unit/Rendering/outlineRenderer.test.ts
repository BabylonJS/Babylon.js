import { describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Vector3 } from "core/Maths/math.vector";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import "core/Rendering/outlineRenderer";

describe("OutlineRenderer", () => {
    it("resets the material cache after rendering an overlay", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        new FreeCamera("camera", new Vector3(0, 0, -5), scene);

        const material = new StandardMaterial("material", scene);
        const mesh = MeshBuilder.CreateBox("mesh", undefined, scene);
        mesh.material = material;
        mesh.renderOverlay = true;

        const subMesh = mesh.subMeshes[0];
        const outlineRenderer = scene.getOutlineRenderer();
        await vi.waitFor(() => {
            expect(outlineRenderer.isReady(subMesh, false)).toBe(true);
        });

        scene._cachedMaterial = material;
        outlineRenderer.render(subMesh, mesh._getInstancesRenderList(subMesh._id), true);
        expect(scene.getCachedMaterial()).toBeNull();

        scene.dispose();
        engine.dispose();
    });
});
