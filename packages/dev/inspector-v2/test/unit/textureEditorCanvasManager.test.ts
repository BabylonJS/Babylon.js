import { afterEach, describe, expect, it, vi } from "vitest";
import { FramebufferToImagePixels, TextureCanvasManager } from "../../src/components/textureEditor/canvasManager";

describe("FramebufferToImagePixels", () => {
    it("flips rows and converts premultiplied alpha to straight alpha", () => {
        // Bottom row: translucent full-intensity red (premultiplied). Top row: opaque green. Then a fully transparent texel.
        const framebuffer = new Uint8Array([128, 0, 0, 128, 0, 0, 0, 0, 0, 255, 0, 255, 0, 64, 0, 255]);

        expect([...FramebufferToImagePixels(framebuffer, 2, 2)]).toEqual([0, 255, 0, 255, 0, 64, 0, 255, 255, 0, 0, 128, 0, 0, 0, 0]);
    });
});

describe("TextureCanvasManager reset", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("does not let writes queued by a 3D tool reset overwrite the restored texture", async () => {
        vi.useFakeTimers();
        let resolveReadback!: (pixels: Uint8Array) => void;
        const readPixels = vi.fn(async () => await new Promise<Uint8Array>((resolve) => (resolveReadback = resolve)));
        const source = { writePixelsAsync: vi.fn(async () => {}), resetAsync: vi.fn(async () => {}) };
        const manager = Object.create(TextureCanvasManager.prototype) as TextureCanvasManager;
        const pushTexture = Reflect.get(manager, "pushTexture") as () => Promise<void>;
        Object.assign(manager, {
            PUSH_FREQUENCY: 32,
            _source: source,
            _editing3D: true,
            _3DEngine: { readPixels },
            _size: { width: 1, height: 1 },
            _canPush: true,
            _shouldPush: false,
            _pushGeneration: 0,
            _activePush: Promise.resolve(),
            _isDisposed: false,
            // Like Contrast/Exposure, resetting the tool updates the texture twice.
            _tool: { reset: () => void [pushTexture.call(manager), pushTexture.call(manager)] },
            _reportError: vi.fn(),
            _onUpdate: vi.fn(),
            grabOriginalTexture: vi.fn(async () => {}),
            makePlane: vi.fn(),
        });

        const reset = manager.reset();
        resolveReadback(new Uint8Array([10, 20, 30, 255]));
        await reset;
        await vi.runAllTimersAsync();

        expect(source.resetAsync).toHaveBeenCalledOnce();
        expect(readPixels).toHaveBeenCalledOnce();
        expect(source.writePixelsAsync).not.toHaveBeenCalled();
        expect(Reflect.get(manager, "_reportError")).not.toHaveBeenCalled();
    });
});
