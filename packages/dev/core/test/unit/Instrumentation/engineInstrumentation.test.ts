import { Engine } from "core/Engines/engine";
import { ThinEngine } from "core/Engines/thinEngine";
import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import { EngineInstrumentation } from "core/Instrumentation/engineInstrumentation";
import { PrecisionDate } from "core/Misc/precisionDate";
import { afterEach, describe, expect, it, vi } from "vitest";

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
            } as unknown as WebGL2RenderingContext;
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

describe.each([
    { name: "ThinEngine", EngineType: ThinEngine },
    { name: "Engine", EngineType: Engine },
])("$name parallel shader compilation", ({ EngineType }) => {
    const engines: ThinEngine[] = [];
    const instrumentations: EngineInstrumentation[] = [];

    afterEach(() => {
        for (const instrumentation of instrumentations.splice(0)) {
            instrumentation.dispose();
        }
        for (const engine of engines.splice(0)) {
            engine.dispose();
        }
        vi.restoreAllMocks();
    });

    function createEngine() {
        const engine = new EngineType(null);
        engines.push(engine);
        const completedPrograms = new Set<WebGLProgram>();
        const gl = {
            COMPILE_STATUS: 0x8b81,
            FRAGMENT_SHADER: 0x8b30,
            LINK_STATUS: 0x8b82,
            VALIDATE_STATUS: 0x8b83,
            VERTEX_SHADER: 0x8b31,
            attachShader: vi.fn(),
            compileShader: vi.fn(),
            createProgram: vi.fn(() => ({}) as WebGLProgram),
            createShader: vi.fn(() => ({}) as WebGLShader),
            deleteShader: vi.fn(),
            getExtension: vi.fn(() => ({ COMPLETION_STATUS_KHR: 0x91b1 })),
            getProgramInfoLog: vi.fn(() => "Program failed"),
            getProgramParameter: vi.fn((program: WebGLProgram, parameter: number) => parameter !== 0x91b1 || completedPrograms.has(program)),
            getShaderInfoLog: vi.fn(() => "Shader failed"),
            getShaderParameter: vi.fn(() => true),
            linkProgram: vi.fn(),
            shaderSource: vi.fn(),
            validateProgram: vi.fn(),
        };
        engine._gl = gl as unknown as WebGL2RenderingContext;
        const instrumentation = new EngineInstrumentation(engine);
        instrumentations.push(instrumentation);
        instrumentation.captureShaderCompilationTime = true;

        function createProgram(pipelineContext = new WebGLPipelineContext(), createAsRaw = false) {
            pipelineContext.engine = engine;
            pipelineContext.context = engine._gl;
            pipelineContext.isParallelCompiled = true;
            engine._preparePipelineContextAsync(pipelineContext, "void main() {}", "void main() {}", createAsRaw, "", "", null, null, null, "", () => {});
            return pipelineContext;
        }

        function complete(pipelineContext: WebGLPipelineContext) {
            completedPrograms.add(pipelineContext.program!);
            return pipelineContext.isReady;
        }

        return { engine, gl, instrumentation, createProgram, complete };
    }

    it("waits for completion, preserves callbacks, and notifies once even when an observer checks readiness", () => {
        const { engine, createProgram, complete, instrumentation } = createEngine();
        const pipelineContext = new WebGLPipelineContext();
        const events: string[] = [];
        engine.onBeforeShaderCompilationObservable.add((eventEngine, state) => {
            expect(eventEngine).toBe(engine);
            expect(state.target).toBe(pipelineContext);
            events.push("before");
        });
        engine.onAfterShaderCompilationObservable.add((eventEngine, state) => {
            expect(eventEngine).toBe(engine);
            expect(state.target).toBe(pipelineContext);
            expect(pipelineContext.isReady).toBe(true);
            events.push("after");
        });
        pipelineContext.onCompiled = () => events.push("existing");

        createProgram(pipelineContext);
        engine._executeWhenRenderingStateIsCompiled(pipelineContext, () => events.push("effect"));
        expect(pipelineContext.isReady).toBe(false);
        expect(events).toEqual(["before"]);
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(0);

        expect(complete(pipelineContext)).toBe(true);
        expect(events).toEqual(["before", "existing", "after", "effect"]);
        expect(pipelineContext.isReady).toBe(true);
        expect(events).toEqual(["before", "existing", "after", "effect"]);
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(1);
    });

    it.each(["vertex", "fragment", "link", "validation"])("does not notify successful completion on a %s error", (failure) => {
        const { engine, gl, createProgram, complete, instrumentation } = createEngine();
        const after = vi.fn();
        engine.onAfterShaderCompilationObservable.add(after);
        engine.validateShaderPrograms = failure === "validation";
        const pipelineContext = createProgram();
        gl.getProgramParameter.mockImplementation((_program, parameter) => (failure === "validation" ? parameter !== gl.VALIDATE_STATUS : parameter !== gl.LINK_STATUS));
        gl.getShaderParameter.mockImplementation((_shader?: WebGLShader) => {
            if (failure === "vertex") {
                return false;
            }
            return failure !== "fragment" || _shader !== pipelineContext.fragmentShader;
        });

        expect(() => complete(pipelineContext)).toThrow(failure === "validation" || failure === "link" ? "Program failed" : "Shader failed");
        expect(after).not.toHaveBeenCalled();
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(0);
    });

    it("measures overlapping compilations independently when they finish out of order", () => {
        const { engine, createProgram, complete, instrumentation } = createEngine();
        let now = 10;
        vi.spyOn(PrecisionDate, "Now", "get").mockImplementation(() => now);
        const first = createProgram();
        now = 20;
        const second = createProgram();
        const completed: WebGLPipelineContext[] = [];
        engine.onAfterShaderCompilationObservable.add((_engine, state) => completed.push(state.target));

        now = 50;
        expect(complete(second)).toBe(true);
        expect(instrumentation.shaderCompilationTimeCounter.current).toBe(30);
        now = 100;
        expect(complete(first)).toBe(true);

        expect(completed).toEqual([second, first]);
        expect(instrumentation.shaderCompilationTimeCounter.current).toBe(90);
        expect(instrumentation.shaderCompilationTimeCounter.total).toBe(120);
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(2);
        expect(instrumentation.shaderCompilationTimeCounter.average).toBe(60);
    });

    it("ignores compilations started before capture was enabled or during a previous capture", () => {
        const { createProgram, complete, instrumentation } = createEngine();
        const previousCapture = createProgram();
        instrumentation.captureShaderCompilationTime = false;
        const withoutCapture = createProgram();
        instrumentation.captureShaderCompilationTime = true;

        expect(complete(previousCapture)).toBe(true);
        expect(complete(withoutCapture)).toBe(true);
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(0);
        expect(complete(createProgram())).toBe(true);
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(1);
    });

    it("does not notify completion for a disposed pipeline", () => {
        const { engine, createProgram, complete } = createEngine();
        const after = vi.fn();
        engine.onAfterShaderCompilationObservable.add(after);
        const pipelineContext = createProgram();
        pipelineContext.dispose();

        expect(complete(pipelineContext)).toBe(false);
        expect(after).not.toHaveBeenCalled();
    });

    it("preserves raw-program creation without emitting unmatched compilation events", () => {
        const { engine, createProgram, complete, instrumentation } = createEngine();
        const before = vi.fn();
        const after = vi.fn();
        engine.onBeforeShaderCompilationObservable.add(before);
        engine.onAfterShaderCompilationObservable.add(after);
        const pipelineContext = createProgram(new WebGLPipelineContext(), true);

        expect(complete(pipelineContext)).toBe(true);
        expect(before).not.toHaveBeenCalled();
        expect(after).not.toHaveBeenCalled();
        expect(instrumentation.shaderCompilationTimeCounter.count).toBe(0);
    });
});
