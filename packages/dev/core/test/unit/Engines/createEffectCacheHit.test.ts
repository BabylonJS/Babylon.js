import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ThinEngine } from "core/Engines/thinEngine.pure";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { type Effect, type IEffectCreationOptions } from "core/Materials/effect";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

const shaders = { vertexSource: "void main() { gl_Position = vec4(0.0); }", fragmentSource: "void main() { gl_FragColor = vec4(1.0); }" };

// Without it, the null engine compiles these sources before the effect constructor returns. Like the shader imports of the
// built-in materials, it keeps the effect compiling until the test awaits.
const deferCompilation = async () => {};

type CreateEffect = typeof ThinEngine.prototype.createEffect;

// WebGPUEngine.createEffect runs on the null engine too: it only reads the effect cache and global defines of the engine
const engineVariants: [string, CreateEffect][] = [
    ["ThinEngine", ThinEngine.prototype.createEffect],
    ["WebGPUEngine", WebGPUEngine.prototype.createEffect as unknown as CreateEffect],
];

describe.each(engineVariants)("%s.createEffect cache hits", (_name, createEffect) => {
    let engine: NullEngine;

    const createWithOptions = (options: Partial<IEffectCreationOptions> = {}): Effect =>
        createEffect.call(
            engine,
            shaders,
            {
                attributes: [],
                uniformsNames: [],
                samplers: [],
                defines: "",
                fallbacks: null,
                onCompiled: null,
                onError: null,
                extraInitializationsAsync: deferCompilation,
                ...options,
            },
            engine
        );

    const createWithArguments = (onCompiled: (effect: Effect) => void, onError: (effect: Effect, errors: string) => void): Effect =>
        createEffect.call(engine, shaders, [], [], [], "", undefined, onCompiled, onError, undefined, ShaderLanguage.GLSL, deferCompilation);

    beforeEach(() => {
        engine = new NullEngine();
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
    });

    afterEach(() => {
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("calls the creation options onCompiled of a caller that hits the cache once the effect is ready", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        const secondOnCompiled = vi.fn();
        const second = createWithOptions({ onCompiled: secondOnCompiled });

        expect(second).toBe(first);
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
    });

    it("calls the creation options onCompiled of a caller that hit the cache while the effect was compiling", async () => {
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();

        const first = createWithOptions({ onCompiled: firstOnCompiled });
        const second = createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        expect(second).toBe(first);
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("calls the onCompiled argument of a caller that hit the cache while the effect was compiling", async () => {
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();

        const first = createWithArguments(firstOnCompiled, vi.fn());
        createWithArguments(secondOnCompiled, vi.fn());
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
    });

    it("reports a compilation error to a caller that hit the cache while the effect was compiling", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const firstOnError = vi.fn();
        const secondOnError = vi.fn();
        const secondOnCompiled = vi.fn();

        const first = createWithOptions({ onError: firstOnError });
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        expect(first.getCompilationError()).toBe("");

        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalledOnce());

        expect(first.getCompilationError()).toEqual(expect.stringContaining("Shader stage creation failed"));
        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
    });

    it("reports the compilation error right away to a caller that hits the cache after the effect failed", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const firstOnError = vi.fn();
        const first = createWithOptions({ onError: firstOnError });
        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalledOnce());

        const secondOnError = vi.fn();
        const secondOnCompiled = vi.fn();
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });

        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
    });

    it("waits for the fallbacks of a failed compilation before calling a caller that hits the cache", async () => {
        const fallbacks = new EffectFallbacks();
        fallbacks.addFallback(0, "OPTIONAL");
        let compileFallback: (() => void) | undefined;
        vi.spyOn(engine, "_preparePipelineContextAsync")
            .mockImplementationOnce(() => {
                throw new Error("Optional shader feature is unsupported");
            })
            .mockImplementationOnce((...args) => {
                compileFallback = () => ThinEngine.prototype._preparePipelineContextAsync.apply(engine, args);
            });

        const first = createWithOptions({ defines: "#define OPTIONAL", fallbacks });
        await vi.waitFor(() => expect(compileFallback).toBeDefined());
        expect(first.getCompilationError()).toEqual(expect.stringContaining("Optional shader feature is unsupported"));

        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();
        createWithOptions({ defines: "#define OPTIONAL", fallbacks, onCompiled: secondOnCompiled, onError: secondOnError });
        expect(secondOnError).not.toHaveBeenCalled();

        compileFallback!();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("does not call the callbacks of the cached effect a second time while it is compiling", async () => {
        const onCompiled = vi.fn();
        const onError = vi.fn();

        const first = createWithOptions({ onCompiled, onError });
        createWithOptions({ onCompiled, onError });
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        expect(onCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(onError).not.toHaveBeenCalled();
    });
});

describe("Material.onCompiled with an effect from the engine cache", () => {
    let engine: NullEngine;
    let scene: Scene;

    const createMaterial = (name: string, onCompiled: (effect: Effect) => void) => {
        const material = new ShaderMaterial(
            name,
            scene,
            shaders,
            { attributes: ["position"], uniforms: ["worldViewProjection"], extraInitializationsAsync: deferCompilation },
            false
        );
        material.onCompiled = onCompiled;
        return material;
    };

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("is called for a material that gets the effect another material compiled", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        const secondOnCompiled = vi.fn();
        const second = createMaterial("second", secondOnCompiled);
        second.isReady(mesh);

        expect(second.getEffect()).toBe(first.getEffect());
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first.getEffect());
    });

    it("is called for a material that got the effect while another material was compiling it", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        const secondOnCompiled = vi.fn();
        const second = createMaterial("second", secondOnCompiled);
        expect(first.isReady(mesh)).toBe(false);
        expect(second.isReady(mesh)).toBe(false);
        expect(second.getEffect()).toBe(first.getEffect());

        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first.getEffect());
    });
});
