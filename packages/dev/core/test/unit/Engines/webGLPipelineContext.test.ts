import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import { type Effect } from "core/Materials/effect";
import { describe, expect, it, vi } from "vitest";

describe("WebGLPipelineContext", () => {
    it.each([
        [false, ["unused", "codes", "colour"], { unused: 0, codes: 1, colour: 2 }],
        [true, ["codes", "colour"], { codes: 0, colour: 1 }],
    ])("preserves samplers compiled during context loss (restored: %s)", (restoreContext, expectedList, expectedSamplers) => {
        const pipelineContext = new WebGLPipelineContext();
        const names = ["unused", "codes", "colour"];
        const samplerList = [...names];
        const uniforms: Record<string, WebGLUniformLocation | null> = {};
        const isContextLost = vi.fn(() => true);
        const getUniforms = vi.fn<() => (WebGLUniformLocation | null)[]>(() => [null, null, null]);
        pipelineContext.engine = {
            supportsUniformBuffers: false,
            getUniforms,
            getAttributes: vi.fn(() => []),
            _gl: { isContextLost },
        } as unknown as WebGLPipelineContext["engine"];
        const effect = {
            getUniform: vi.fn((name: string) => uniforms[name]),
            bindUniformBlock: vi.fn(),
        } as unknown as Effect;
        const samplers: Record<string, number> = {};

        pipelineContext._fillEffectInformation(effect, {}, [...names], uniforms, samplerList, samplers, [], []);

        if (restoreContext) {
            isContextLost.mockReturnValue(false);
            getUniforms.mockReturnValue([null, {} as WebGLUniformLocation, {} as WebGLUniformLocation]);
            // The same sampler dictionary is reused on restoration, as in the production path.
            pipelineContext._fillEffectInformation(effect, {}, [...names], uniforms, samplerList, samplers, [], []);
        }

        expect(samplerList).toEqual(expectedList);
        expect(samplers).toEqual(expectedSamplers);
    });

    it.each([
        ["a live WebGL context", { isContextLost: () => false }],
        ["no WebGL context", undefined],
    ])("prunes unused samplers and renumbers the remaining samplers with %s", (_name, gl) => {
        const pipelineContext = new WebGLPipelineContext();
        const samplerList = ["unused", "codes", "unusedMiddle", "colour"];
        const uniforms: Record<string, WebGLUniformLocation | null> = {};
        pipelineContext.engine = {
            supportsUniformBuffers: false,
            getUniforms: vi.fn(() => [null, {} as WebGLUniformLocation, null, {} as WebGLUniformLocation]),
            getAttributes: vi.fn(() => []),
            _gl: gl,
        } as unknown as WebGLPipelineContext["engine"];
        const effect = {
            getUniform: vi.fn((name: string) => uniforms[name]),
            bindUniformBlock: vi.fn(),
        } as unknown as Effect;
        const samplers: Record<string, number> = {};

        pipelineContext._fillEffectInformation(effect, {}, [...samplerList], uniforms, samplerList, samplers, [], []);

        expect(samplerList).toEqual(["codes", "colour"]);
        expect(samplers).toEqual({ codes: 0, colour: 1 });
    });
});
