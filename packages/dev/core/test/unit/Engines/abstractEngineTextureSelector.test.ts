import { describe, it, expect, beforeEach } from "vitest";

import { NullEngine } from "core/Engines";
import { AbstractEngine } from "core/Engines/abstractEngine";
// Side-effect import: registers the texture-selector augmentation on AbstractEngine.prototype.
import "core/Engines/AbstractEngine/abstractEngine.textureSelector";

describe("AbstractEngine texture selector", () => {
    describe("Prototype augmentation", () => {
        it("registers methods on AbstractEngine.prototype (not Engine.prototype)", () => {
            // This is the core regression check: the methods must live on AbstractEngine so
            // they are inherited by every engine implementation, including WebGPU and Native
            // engines that do not extend Engine.
            expect(typeof (AbstractEngine.prototype as any).setTextureFormatToUse).toBe("function");
            expect(typeof (AbstractEngine.prototype as any).setCompressedTextureExclusions).toBe("function");
            expect(Object.getOwnPropertyDescriptor(AbstractEngine.prototype, "texturesSupported")).toBeDefined();
            expect(Object.getOwnPropertyDescriptor(AbstractEngine.prototype, "textureFormatInUse")).toBeDefined();
        });
    });

    describe("setTextureFormatToUse", () => {
        let engine: NullEngine;

        beforeEach(() => {
            engine = new NullEngine();
            // Reset state from any previous test.
            engine._transformTextureUrl = null;
            (engine as any)._textureFormatInUse = "";
        });

        it("selects the matching format and sets the URL transform when caps are supported", () => {
            engine.getCaps().astc = true as any;

            const result = engine.setTextureFormatToUse(["-astc.ktx", "-dxt.ktx"]);

            expect(result).toBe("-astc.ktx");
            expect(engine.textureFormatInUse).toBe("-astc.ktx");
            expect(engine._transformTextureUrl).not.toBeNull();
        });

        it("clears the URL transform and returns null when no format matches", () => {
            engine.getCaps().astc = undefined as any;
            engine.getCaps().s3tc = undefined as any;
            engine.getCaps().etc1 = undefined as any;
            engine.getCaps().etc2 = undefined as any;
            engine.getCaps().pvrtc = undefined as any;
            // Pre-set state to verify it gets reset.
            engine._transformTextureUrl = (url: string) => url;
            (engine as any)._textureFormatInUse = "-astc.ktx";

            const result = engine.setTextureFormatToUse(["-astc.ktx"]);

            expect(result).toBeNull();
            expect(engine.textureFormatInUse).toBeNull();
            expect(engine._transformTextureUrl).toBeNull();
        });

        it("rewrites texture URLs based on the selected format", () => {
            engine.getCaps().s3tc = true as any;
            engine.setTextureFormatToUse(["-dxt.ktx"]);

            expect(engine._transformTextureUrl).not.toBeNull();
            const transformed = engine._transformTextureUrl!("https://example.com/path/texture.png?v=1");
            expect(transformed).toBe("https://example.com/path/texture-dxt.ktx?v=1");
        });

        it("setCompressedTextureExclusions skips the URL rewrite for excluded files", () => {
            engine.getCaps().s3tc = true as any;
            engine.setTextureFormatToUse(["-dxt.ktx"]);
            engine.setCompressedTextureExclusions([".env"]);

            const transformed = engine._transformTextureUrl!("https://example.com/skybox.env");
            expect(transformed).toBe("https://example.com/skybox.env");
        });
    });
});
