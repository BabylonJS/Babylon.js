import { Engine } from "core/Engines/engine";
import { ThinEngine } from "core/Engines/thinEngine";
import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { describe, expect, it, vi } from "vitest";

describe("EngineInstrumentation", () => {
    it("records shader compilation time and honors before-observer validation for ThinEngine and Engine", () => {
        for (const EngineType of [ThinEngine, Engine]) {
            const engine = new EngineType(null);
            const shader = {} as WebGLShader;
            const program = {} as WebGLProgram;
            const validatedPrograms: WebGLProgram[] = [];
            engine._gl = {
                COMPILE_STATUS: 0x8b81,
                FRAGMENT_SHADER: 0x8b30,
                LINK_STATUS: 0x8b82,
                VALIDATE_STATUS: 0x8b83,
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
                validateProgram: vi.fn((value: WebGLProgram) => validatedPrograms.push(value)),
            } as unknown as WebGLRenderingContext;
            const events: string[] = [];
            engine.onBeforeShaderCompilationObservable.add(() => {
                events.push("before");
                engine.validateShaderPrograms = true;
            });
            engine.onAfterShaderCompilationObservable.add(() => events.push("after"));
            const instrumentation = new EngineInstrumentation(engine);
            instrumentation.captureShaderCompilationTime = true;

            try {
                const pipelineContext = new WebGLPipelineContext();
                engine.createShaderProgram(pipelineContext, "void main() {}", "void main() {}", null);

                expect(events).toEqual(["before", "after"]);
                expect(instrumentation.shaderCompilationTimeCounter.count).toBe(1);
                expect(validatedPrograms).toEqual([program]);
            } finally {
                instrumentation.dispose();
                engine.dispose();
            }
        }
    });
});
