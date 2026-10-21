import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import { type Effect } from "core/Materials/effect";
import { describe, expect, it, vi } from "vitest";

describe("WebGLPipelineContext", () => {
    it.each([false, true])("preserves samplers compiled during context loss (restored: %s)", (restoreContext) => {
        const pipelineContext = new WebGLPipelineContext();
        const samplerList = ["codes", "colour"];
        const uniforms: Record<string, WebGLUniformLocation | null> = {};
        const isContextLost = vi.fn(() => true);
        const getUniforms = vi.fn<() => (WebGLUniformLocation | null)[]>(() => [null, null]);
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
        let samplers: Record<string, number> = {};

        pipelineContext._fillEffectInformation(effect, {}, ["codes", "colour"], uniforms, samplerList, samplers, [], []);

        if (restoreContext) {
            isContextLost.mockReturnValue(false);
            getUniforms.mockReturnValue([{} as WebGLUniformLocation, {} as WebGLUniformLocation]);
            samplers = {};
            pipelineContext._fillEffectInformation(effect, {}, ["codes", "colour"], uniforms, samplerList, samplers, [], []);
        }

        expect(samplerList).toEqual(["codes", "colour"]);
        expect(samplers).toEqual({ codes: 0, colour: 1 });
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
