import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Constants } from "core/Engines/constants";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Flush pending microtasks (and the macrotask queue) so the in-flight cache cleanup runs.
async function flushAsync() {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Scene delay-loaded file coalescing", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    it("coalesces concurrent requests for the same file into a single load", async () => {
        let resolveLoad!: (data: ArrayBuffer) => void;
        const loadPromise = new Promise<ArrayBuffer>((resolve) => {
            resolveLoad = resolve;
        });
        const spy = vi.spyOn(scene, "_loadFileAsync").mockReturnValue(loadPromise as Promise<ArrayBuffer>);

        const url = "scene/shared.babylonbinarymeshdata";
        const p1 = scene._loadDelayedFileAsync(url, true, true);
        const p2 = scene._loadDelayedFileAsync(url, true, true);
        const p3 = scene._loadDelayedFileAsync(url, true, true);

        // Only a single underlying request is issued while the file is in flight.
        expect(spy).toHaveBeenCalledTimes(1);

        const buffer = new ArrayBuffer(8);
        resolveLoad(buffer);

        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        // Every caller receives the exact same buffer instance.
        expect(r1).toBe(buffer);
        expect(r2).toBe(buffer);
        expect(r3).toBe(buffer);
    });

    it("re-fetches once a previous request has settled", async () => {
        const buffer = new ArrayBuffer(8);
        const spy = vi.spyOn(scene, "_loadFileAsync").mockResolvedValue(buffer as ArrayBuffer);
        const url = "scene/shared.babylonbinarymeshdata";

        await scene._loadDelayedFileAsync(url, true, true);
        await flushAsync();
        await scene._loadDelayedFileAsync(url, true, true);

        // Coalescing only applies to concurrent (in-flight) requests, not sequential ones.
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("does not coalesce requests for the same url with different data types", () => {
        const spy = vi.spyOn(scene, "_loadFileAsync").mockReturnValue(new Promise<ArrayBuffer>(() => {}));
        const url = "scene/shared.data";

        void scene._loadDelayedFileAsync(url, true, true);
        void scene._loadDelayedFileAsync(url, false, true);

        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("clears the in-flight entry after a failed load so it can be retried", async () => {
        const buffer = new ArrayBuffer(8);
        const spy = vi
            .spyOn(scene, "_loadFileAsync")
            .mockRejectedValueOnce(new Error("boom"))
            .mockResolvedValueOnce(buffer as ArrayBuffer);
        const url = "scene/shared.babylonbinarymeshdata";

        await expect(scene._loadDelayedFileAsync(url, true, true)).rejects.toThrow("boom");
        await flushAsync();
        await expect(scene._loadDelayedFileAsync(url, true, true)).resolves.toBe(buffer);
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it("loads a shared binary file only once across multiple delay-loaded meshes", async () => {
        const buffer = new ArrayBuffer(8);
        const spy = vi.spyOn(scene, "_loadFileAsync").mockResolvedValue(buffer as ArrayBuffer);

        const sharedFile = "scene/packed.babylonbinarymeshdata";
        const meshes = [new Mesh("a", scene), new Mesh("b", scene), new Mesh("c", scene)];
        for (const mesh of meshes) {
            mesh.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
            mesh.delayLoadingFile = sharedFile;
            // Avoid parsing the (fake) buffer; just record that the geometry import was invoked.
            mesh._delayLoadingFunction = vi.fn();
        }

        for (const mesh of meshes) {
            mesh._checkDelayState();
        }

        await flushAsync();

        // The shared file is fetched a single time even though three meshes requested it.
        expect(spy).toHaveBeenCalledTimes(1);
        for (const mesh of meshes) {
            expect(mesh._delayLoadingFunction).toHaveBeenCalledWith(buffer, mesh);
            expect(mesh.delayLoadState).toBe(Constants.DELAYLOADSTATE_LOADED);
        }
    });

    it("removes pending data and logs when a delay-loaded mesh fails to load", async () => {
        vi.spyOn(scene, "_loadFileAsync").mockRejectedValue(new Error("network down"));
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});

        const mesh = new Mesh("failing", scene);
        mesh.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
        mesh.delayLoadingFile = "scene/missing.babylonbinarymeshdata";
        mesh._delayLoadingFunction = vi.fn();

        mesh._checkDelayState();
        await flushAsync();

        // The failure must not leave the scene waiting forever, and it must be surfaced for debugging.
        expect(scene.getWaitingItemsCount()).toBe(0);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(mesh._delayLoadingFunction).not.toHaveBeenCalled();
    });
});
