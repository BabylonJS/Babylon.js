import { vi } from "vitest";
import { type NullEngine } from "core/Engines/nullEngine";

// Keep real Babylon textures and ownership; defer only the simulated image decode.
export function deferUSDTextureLoads(engine: NullEngine) {
    const loads: Array<{ succeed: () => void; fail: () => void }> = [];
    const createTexture = engine.createTexture;
    vi.spyOn(engine, "createTexture").mockImplementation((...args) => {
        const onLoad = args[5];
        const onError = args[6];
        args[5] = null;
        const texture = createTexture.call(engine, ...args);
        loads.push({
            succeed: () => onLoad?.(texture),
            fail: () => onError?.("Image decode failed", new Error("Image decode failed")),
        });
        return texture;
    });
    return loads;
}
