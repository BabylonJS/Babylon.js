import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ThinEngine } from "core/Engines/thinEngine";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { FreeCamera } from "core/Cameras/freeCamera";
import type { Effect } from "core/Materials/effect";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

const ATTRIBUTES = ["position", "age"];
const RENDER_VAO = { name: "render VAO" };

/**
 * Minimal WebGL2 state for the real ThinEngine buffer binding code: vertex attribute divisors are vertex array
 * state, so they are kept per VAO (null = default VAO). The render VAO was recorded with instanced attributes.
 */
function createGlState() {
    const divisors = new Map<object | null, Map<number, number>>([
        [null, new Map()],
        [RENDER_VAO, new Map(ATTRIBUTES.map((_, location) => [location, 1]))],
    ]);
    let boundVao: object | null = null;

    const gl = {
        ARRAY_BUFFER: 34962,
        FLOAT: 5126,
        bindVertexArray: (vao: object | null) => {
            boundVao = vao;
        },
        vertexAttribDivisor: (location: number, divisor: number) => {
            divisors.get(boundVao)!.set(location, divisor);
        },
        bindBuffer: () => {},
        enableVertexAttribArray: () => {},
        disableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        deleteVertexArray: () => {},
    };

    return {
        gl,
        divisor: (vao: object | null) => divisors.get(vao)!.get(0) ?? 0,
        boundDivisor: () => divisors.get(boundVao)!.get(0) ?? 0,
    };
}

function createEffect(): Effect {
    return {
        defines: "",
        _multiTarget: false,
        getAttributesNames: () => ATTRIBUTES,
        getAttributeLocation: (index: number) => index,
        setMatrix: vi.fn(),
        setTexture: vi.fn(),
        setVector2: vi.fn(),
        setVector3: vi.fn(),
        setFloat: vi.fn(),
        setFloat3: vi.fn(),
        setFloat4: vi.fn(),
        setDirectColor4: vi.fn(),
        setColor3: vi.fn(),
        setColor4: vi.fn(),
    } as unknown as Effect;
}

function createInstancedVertexBuffers() {
    const vertexBuffer = {
        type: 5126,
        normalized: false,
        byteStride: 0,
        byteOffset: 0,
        getBuffer: () => ({ references: 1, underlyingResource: {} }),
        getSize: () => 3,
        getIsInstanced: () => true,
        getInstanceDivisor: () => 1,
    };
    const vertexBuffers: { [name: string]: typeof vertexBuffer } = {};
    for (const name of ATTRIBUTES) {
        vertexBuffers[name] = vertexBuffer;
    }
    return vertexBuffers;
}

describe("GPUParticleSystem resets instance attributes after drawing", () => {
    let engine: NullEngine;
    let scene: Scene;
    let glState: ReturnType<typeof createGlState>;
    let drawDivisors: number[];

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
        // render() reads the active camera's position for billboard particles
        scene.activeCamera = new FreeCamera("camera", Vector3.Zero(), scene);

        // NullEngine has no GL context and replaces bindBuffers()/drawArraysType() with no-ops. Give it a minimal
        // GL state and run the real ThinEngine binding code; unbindInstanceAttributes(), bindVertexArrayObject() and
        // bindArrayBuffer() are not overridden by NullEngine.
        glState = createGlState();
        const internals = engine as any;
        internals._gl = glState.gl;
        internals._currentBufferPointers = Array.from({ length: 16 }, () => ({ active: false }));
        vi.spyOn(engine, "bindBuffers").mockImplementation(function (this: ThinEngine, ...args) {
            return ThinEngine.prototype.bindBuffers.apply(this, args);
        });
        drawDivisors = [];
        vi.spyOn(engine, "drawArraysType").mockImplementation(() => {
            drawDivisors.push(glState.boundDivisor());
        });
        vi.spyOn(engine, "enableEffect").mockImplementation(() => {});
        vi.spyOn(engine, "releaseVertexArrayObject").mockImplementation(() => {});
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    /**
     * Creates a system with one render VAO recorded with `recordedEffect`. `effectForBlendMode` decides which effect
     * each render pass uses: a pass whose effect differs from the recorded one falls back to engine.bindBuffers() on
     * the default VAO.
     */
    function createSystem(blendMode: number, recordedEffect: Effect, effectForBlendMode: (blendMode: number) => Effect): GPUParticleSystem {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        ps.blendMode = blendMode;

        vi.spyOn(ps, "_getWrapper").mockImplementation((mode: number) => ({ effect: effectForBlendMode(mode) }) as any);
        vi.spyOn(ps, "isReady").mockReturnValue(true);
        vi.spyOn(ps as any, "_initialize").mockImplementation(() => {});
        // Nothing else binds between render operations, as with updateInAnimate = true
        vi.spyOn(ps as any, "_update").mockImplementation(() => {});
        (ps as any)._started = true;
        ps.manualEmitCount = 10;

        const platform = (ps as any)._platform;
        platform._renderVAO = [RENDER_VAO];
        platform._renderVAOEffects = [recordedEffect];
        platform._renderVertexBuffers = [createInstancedVertexBuffers()];

        return ps;
    }

    function renderFrame(ps: GPUParticleSystem): void {
        // render() draws once per render id and camera
        (ps as any)._currentRenderId = -1;
        ps.render();
    }

    it("resets the default VAO divisors after rendering on the default VAO, and restores them for the next render", () => {
        // A define changed after initialization: the pass effect no longer matches the recorded one
        const staleEffect = createEffect();
        const ps = createSystem(ParticleSystem.BLENDMODE_ONEONE, createEffect(), () => staleEffect);

        renderFrame(ps);
        expect(glState.divisor(null)).toBe(0);

        // Same buffers and effect, nothing bound in between: the second render must not draw with divisor 0
        renderFrame(ps);
        expect(drawDivisors).toEqual([1, 1]);
        expect(glState.divisor(null)).toBe(0);

        ps.dispose();
    });

    it("keeps the divisors for both MULTIPLYADD passes sharing one custom effect, across render operations", () => {
        // setCustomEffect() with the default blend-mode argument: both passes resolve to the same effect
        const customEffect = createEffect();
        const ps = createSystem(ParticleSystem.BLENDMODE_MULTIPLYADD, createEffect(), () => customEffect);

        renderFrame(ps);
        renderFrame(ps);

        // A reset between the passes would let the additive pass draw with divisor 0 ([1, 0, ...])
        expect(drawDivisors).toEqual([1, 1, 1, 1]);
        expect(glState.divisor(null)).toBe(0);

        ps.dispose();
    });

    it("records the MULTIPLYADD render VAO with the ADD pass effect, not the MULTIPLY pass effect", () => {
        // Premise of the next test, checked against the real effect creation (on an engine without the GL stub)
        const effectEngine = new NullEngine();
        const effectScene = new Scene(effectEngine);
        const ps = new GPUParticleSystem("test", { capacity: 100 }, effectScene);
        ps.blendMode = ParticleSystem.BLENDMODE_MULTIPLYADD;

        const recordedEffect = ps._getWrapper(ParticleSystem.BLENDMODE_MULTIPLYADD).effect;

        expect(ps._getWrapper(ParticleSystem.BLENDMODE_ADD).effect).toBe(recordedEffect);
        expect(ps._getWrapper(ParticleSystem.BLENDMODE_MULTIPLY).effect).not.toBe(recordedEffect);

        ps.dispose();
        effectScene.dispose();
        effectEngine.dispose();
    });

    it("resets the default VAO and leaves the render VAO intact for a regular MULTIPLYADD system", () => {
        // The MULTIPLY pass adds BLENDMULTIPLYMODE, so it always uses the default VAO, while the ADD pass matches the
        // recorded effect and uses the render VAO. The cleanup runs while the render VAO is bound and must still
        // reach the default VAO.
        const addEffect = createEffect();
        const multiplyEffect = createEffect();
        const ps = createSystem(ParticleSystem.BLENDMODE_MULTIPLYADD, addEffect, (mode) => (mode === ParticleSystem.BLENDMODE_MULTIPLY ? multiplyEffect : addEffect));

        renderFrame(ps);
        renderFrame(ps);

        expect(drawDivisors).toEqual([1, 1, 1, 1]);
        expect(glState.divisor(null)).toBe(0);
        expect(glState.divisor(RENDER_VAO)).toBe(1);

        ps.dispose();
    });
});
