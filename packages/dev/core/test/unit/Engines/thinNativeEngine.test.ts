import { ThinNativeEngine } from "core/Engines/thinNativeEngine";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { describe, expect, it, vi } from "vitest";

type NativeFrameRequester = {
    requestAnimationFrame: (callback: () => void) => number;
};

type TestThinNativeEngine = {
    _engine: {
        requestAnimationFrame: (callback: () => void) => void;
    };
    _queueNewFrame: (callback: () => void, requester?: NativeFrameRequester) => number;
};

describe("ThinNativeEngine", () => {
    describe("dynamic textures", () => {
        it("coerces fractional canvas dimensions before allocating native texture data", () => {
            const thinNativeEngine = Object.create(ThinNativeEngine.prototype) as ThinNativeEngine;
            const createRawTexture = vi.spyOn(thinNativeEngine, "createRawTexture").mockReturnValue({} as InternalTexture);

            thinNativeEngine.createDynamicTexture(3379.2, 102.4, false, 3);

            const [data, width, height] = createRawTexture.mock.calls[0];
            expect(width).toBe(3379);
            expect(height).toBe(102);
            expect(data).toBeInstanceOf(Uint8Array);
            expect(data?.byteLength).toBe(3379 * 102 * 4);
        });
    });

    describe("render loop", () => {
        it("returns the custom animation frame request id", () => {
            const thinNativeEngine = Object.create(ThinNativeEngine.prototype) as TestThinNativeEngine;
            let nativeRequestUsed = false;
            let requestedCallback: (() => void) | undefined;
            const renderFunction = () => {};

            thinNativeEngine._engine = {
                requestAnimationFrame: () => {
                    nativeRequestUsed = true;
                },
            };

            const requestId = thinNativeEngine._queueNewFrame(renderFunction, {
                requestAnimationFrame: (callback: () => void) => {
                    requestedCallback = callback;
                    return 23;
                },
            });

            expect(requestId).toBe(23);
            expect(requestedCallback).toBe(renderFunction);
            expect(nativeRequestUsed).toBe(false);
        });
    });
});
