import { ThinEngine } from "core/Engines/thinEngine";
import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { describe, expect, it, vi } from "vitest";

describe("EngineInstrumentation", () => {
    it("records shader compilation time with ThinEngine", () => {
        const engine = new ThinEngine(null);
        const shader = {} as WebGLShader;
        const program = {} as WebGLProgram;
        engine._gl = {
            COMPILE_STATUS: 0x8b81,
            FRAGMENT_SHADER: 0x8b30,
            LINK_STATUS: 0x8b82,
            VERTEX_SHADER: 0x8b31,
            attachShader: vi.fn(),
            compileShader: vi.fn(),
            createProgram: vi.fn(() => program),
            createShader: vi.fn(() => shader),
            deleteShader: vi.fn(),
            getExtension: vi.fn(() => null),
            getProgramParameter: vi.fn(() => true),
            linkProgram: vi.fn(),
            shaderSource: vi.fn(),
        } as unknown as WebGLRenderingContext;
        const instrumentation = new EngineInstrumentation(engine);
        instrumentation.captureShaderCompilationTime = true;

        try {
            const pipelineContext = new WebGLPipelineContext();
            engine.createShaderProgram(pipelineContext, "void main() {}", "void main() {}", null);

            expect(instrumentation.shaderCompilationTimeCounter.count).toBe(1);
        } finally {
            instrumentation.dispose();
            engine.dispose();
        }
    });
});
