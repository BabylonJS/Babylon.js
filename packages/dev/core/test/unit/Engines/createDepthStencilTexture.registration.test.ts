import { describe, expect, it } from "vitest";

// Regression coverage for the tree-shaking split dropping the createDepthStencilTexture
// prototype augmentation. That method is installed by the abstractEngine.texture
// registration. Concrete engines (engine.ts / webgpuEngine.ts) import it, but the
// tree-shakeable features that actually create depth-stencil textures (render target
// textures, shadow generators, the fluid renderer) must not rely on that — they must
// pull the registration in themselves so they work with any engine build.
//
// We deliberately import the pure AbstractEngine base class (which does NOT run the
// registration) instead of a concrete engine, so the prototype method is present ONLY
// because importing the render target texture entry point registered it.
import { AbstractEngine } from "core/Engines/abstractEngine.pure";
import "core/Materials/Textures/renderTargetTexture";

describe("createDepthStencilTexture registration", () => {
    it("is installed on AbstractEngine by importing the render target texture entry point", () => {
        expect(typeof (AbstractEngine.prototype as unknown as { createDepthStencilTexture?: unknown }).createDepthStencilTexture).toBe("function");
    });
});
