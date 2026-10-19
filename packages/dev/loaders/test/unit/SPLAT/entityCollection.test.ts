import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { SPLATFileLoader } from "loaders/SPLAT/splatFileLoader.pure";
import { Mode, type IParsedSplat } from "loaders/SPLAT/splatDefs";

describe("SPLAT entity collection scopes", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("does not block normal scene entities while an asset-container PLY conversion is pending", async () => {
        let resolveConversion!: (value: IParsedSplat) => void;
        vi.spyOn(SPLATFileLoader as any, "_ConvertPLYToSplat").mockReturnValue(
            new Promise<IParsedSplat>((resolve) => {
                resolveConversion = resolve;
            })
        );

        const loader = new SPLATFileLoader();
        const loading = loader.loadAssetContainerAsync(scene, new ArrayBuffer(1) as unknown as string, "");
        await Promise.resolve();

        const normalMesh = new Mesh("normal", scene);
        expect(scene.meshes).toEqual([normalMesh]);
        expect(scene._blockEntityCollection).toBe(false);

        const pointData = new ArrayBuffer(32);
        new Float32Array(pointData, 0, 3).set([1, 2, 3]);
        new Uint8Array(pointData).set([255, 128, 64, 255], 24);
        resolveConversion({ mode: Mode.PointCloud, data: pointData });

        const container = await loading;
        expect(container.meshes).toHaveLength(1);
        expect(container.meshes[0]._parentContainer).toBe(container);
        expect(container.materials[0]._parentContainer).toBe(container);
        expect(container.geometries[0]._parentContainer).toBe(container);
        expect(scene.meshes).toEqual([normalMesh]);
        expect(scene.materials).toHaveLength(0);
        expect(scene.getGeometries()).toHaveLength(0);
        container.dispose();
    });
});
