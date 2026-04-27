import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { CreateGroundFromHeightMap } from "core/Meshes/Builders/groundBuilder";
import { Tools } from "core/Misc/tools";

describe("CreateGroundFromHeightMap scene readiness", () => {
    let engine: NullEngine;
    let scene: Scene;
    let capturedOnLoad: ((img: HTMLImageElement | ImageBitmap) => void) | null;
    let capturedOnError: ((message?: string, exception?: any) => void) | null;
    let originalLoadImage: typeof Tools.LoadImage;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        capturedOnLoad = null;
        capturedOnError = null;

        originalLoadImage = Tools.LoadImage;
        // Intercept Tools.LoadImage so the load never completes unless the test chooses.
        Tools.LoadImage = ((_input, onLoad, onError) => {
            capturedOnLoad = onLoad;
            capturedOnError = onError;
            return null;
        }) as typeof Tools.LoadImage;
    });

    afterEach(() => {
        Tools.LoadImage = originalLoadImage;
        scene.dispose();
        engine.dispose();
    });

    it("keeps scene not ready while the heightmap image load is in flight", () => {
        CreateGroundFromHeightMap("ground", "heightMap.png", {}, scene);

        // The ground mesh has no subMeshes yet (vertex data is applied inside onLoad),
        // so without the fix scene.isReady() would return true. With the fix, the
        // pending-data entry keeps the scene un-ready until onLoad/onError fires.
        expect(scene.isReady()).toBe(false);
        expect(scene.getWaitingItemsCount()).toBeGreaterThan(0);
    });

    it("clears pending data when the image fails to load", () => {
        CreateGroundFromHeightMap("ground", "heightMap.png", {}, scene);
        expect(scene.getWaitingItemsCount()).toBeGreaterThan(0);

        // Simulate load failure.
        capturedOnError!("failed to load");

        expect(scene.getWaitingItemsCount()).toBe(0);
    });

    it("clears pending data when the scene is disposed before the image loads", () => {
        CreateGroundFromHeightMap("ground", "heightMap.png", {}, scene);
        expect(scene.getWaitingItemsCount()).toBeGreaterThan(0);

        scene.dispose();

        // Simulate the load arriving after dispose; the disposed-scene early-return
        // should still remove the pending-data entry.
        const fakeImage = { width: 1, height: 1 } as unknown as HTMLImageElement;
        capturedOnLoad!(fakeImage);

        expect(scene.getWaitingItemsCount()).toBe(0);
    });

    it("does not register pending data when a raw buffer is provided (no async load)", () => {
        const data = new Uint8Array(4); // 1x1 image
        CreateGroundFromHeightMap("ground", { data, width: 1, height: 1 }, {}, scene);

        expect(scene.getWaitingItemsCount()).toBe(0);
    });
});
