import { ThinNativeEngine } from "core/Engines/thinNativeEngine";
import { describe, expect, it } from "vitest";

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
