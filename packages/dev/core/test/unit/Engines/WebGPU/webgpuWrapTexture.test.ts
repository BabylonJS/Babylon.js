/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// wrapWebGPUTexture only constructs a WebGPUHardwareTexture + InternalTexture around the passed GPUTexture;
// it does not touch the GPU device, so we can exercise it via prototype.call with a NullEngine as `this`
// and a minimally-shaped fake GPUTexture.
function wrap(engine: NullEngine, texture: any) {
    return (WebGPUEngine.prototype as any).wrapWebGPUTexture.call(engine, texture);
}

describe("WebGPUEngine.wrapWebGPUTexture", () => {
    let engine: NullEngine;

    beforeEach(() => {
        engine = new NullEngine();
    });

    afterEach(() => {
        engine.dispose();
    });

    it("reports the wrapped GPUTexture's real format on the hardware texture (non-default)", () => {
        const fakeTexture = { width: 128, height: 128, format: "bgra8unorm" };
        const wrapped = wrap(engine, fakeTexture);

        // Both format and originalFormat must reflect the wrapped texture, not the RGBA8Unorm default.
        expect(wrapped._hardwareTexture.format).toBe("bgra8unorm");
        expect(wrapped._hardwareTexture.originalFormat).toBe("bgra8unorm");
    });

    it("carries the dimensions of the wrapped GPUTexture", () => {
        const fakeTexture = { width: 640, height: 480, format: "rgba8unorm" };
        const wrapped = wrap(engine, fakeTexture);

        expect(wrapped.width).toBe(640);
        expect(wrapped.height).toBe(480);
        expect(wrapped._hardwareTexture.format).toBe("rgba8unorm");
    });
});
