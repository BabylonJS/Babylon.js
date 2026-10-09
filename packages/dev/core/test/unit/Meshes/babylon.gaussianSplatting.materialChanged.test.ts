import { NullEngine } from "core/Engines/nullEngine";
import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { Mesh } from "core/Meshes/mesh";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Gaussian splat material changes", () => {
    let engine: NullEngine;
    let scene: Scene;
    let mesh: GaussianSplattingMesh;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        mesh = new GaussianSplattingMesh("splats", null, scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("notifies once after a changed material is propagated to camera views, including null", () => {
        const proxy = new Mesh("cameraProxy", scene);
        const cameraViews = (
            mesh as unknown as {
                _cameraViewInfos: Map<number, { mesh: Mesh }>;
            }
        )._cameraViewInfos;
        cameraViews.set(1, { mesh: proxy });
        const replacement = new GaussianSplattingMaterial("replacement", scene);
        const onChange = vi.fn(() => {
            expect(proxy.material).toBe(mesh.material);
        });
        mesh.onMaterialChangedObservable.add(onChange);

        mesh.material = replacement;
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0]).toBe(mesh);
        mesh.material = replacement;
        expect(onChange).toHaveBeenCalledTimes(1);
        mesh.material = null;
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.calls[1][0]).toBe(mesh);
        mesh.material = null;
        expect(onChange).toHaveBeenCalledTimes(2);
        cameraViews.delete(1);
    });
});
