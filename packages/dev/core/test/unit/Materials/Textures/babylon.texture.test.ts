import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Scene } from "core/scene";

interface PendingTexture {
    texture: InternalTexture;
    complete(): void;
    fail(): void;
}

describe("Texture cache loading", () => {
    let engine: NullEngine;
    let scene: Scene;
    let pending: PendingTexture[];

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        pending = [];

        const createTexture = engine.createTexture.bind(engine);
        vi.spyOn(engine, "createTexture").mockImplementation((url, noMipmap, invertY, hostingScene, samplingMode, onLoad, onError, ...rest) => {
            const texture = createTexture(url, noMipmap, invertY, hostingScene, samplingMode, null, null, ...rest);
            texture.isReady = false;
            pending.push({
                texture,
                complete: () => {
                    texture.isReady = true;
                    onLoad?.(texture);
                    texture.onLoadedObservable.notifyObservers(texture);
                },
                fail: () => {
                    const message = "Texture request failed";
                    const exception = new Error("404 Not Found");
                    texture._setError(message, exception);
                    onError?.(message, exception);
                },
            });
            return texture;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("notifies every wrapper sharing a pending internal texture when loading fails", () => {
        const firstError = vi.fn();
        const secondError = vi.fn();
        const first = new Texture("/assets/color.png", scene, { onError: firstError });
        const second = new Texture("/assets/color.png", scene, { onError: secondError });

        expect(pending).toHaveLength(1);
        expect(first.getInternalTexture()).toBe(second.getInternalTexture());

        pending[0].fail();

        expect(firstError).toHaveBeenCalledWith("Texture request failed", expect.any(Error));
        expect(secondError).toHaveBeenCalledWith("Texture request failed", expect.any(Error));
        expect(first.loadingError).toBe(true);
        expect(second.loadingError).toBe(true);
    });

    it("retries for an awaiting consumer after a non-waiting consumer's cached texture failed", async () => {
        const first = new Texture("/assets/color.png", scene);
        const failedInternalTexture = first.getInternalTexture();

        pending[0].fail();
        expect(first.loadingError).toBe(true);

        let resolveLoad!: () => void;
        let rejectLoad!: (error: Error) => void;
        const loading = new Promise<void>((resolve, reject) => {
            resolveLoad = resolve;
            rejectLoad = reject;
        });
        const second = new Texture("/assets/color.png", scene, {
            onLoad: resolveLoad,
            onError: (message, exception) => rejectLoad(new Error(exception?.message || message)),
        });

        expect(pending).toHaveLength(2);
        expect(second.getInternalTexture()).not.toBe(failedInternalTexture);
        pending[1].complete();

        await loading;
        expect(second.isReady()).toBe(true);
    });
});
