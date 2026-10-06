import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { FreeCamera } from "core/Cameras/freeCamera";
import type { Effect } from "core/Materials/effect";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

const DEFAULT_VAO = "default VAO";
const PARTICLE_VAO = "particle VAO";

/**
 * The NullEngine keeps no GL state, so the relevant part of ThinEngine is modelled here:
 * - Divisors are vertex array state: the default VAO and the particle render VAO each keep their own.
 *   The particle VAO was recorded with instanced attributes, so it starts with divisor 1.
 * - bindBuffers() binds onto the default VAO. It only rebinds (setting the divisors to 1 and remembering
 *   the instance locations) when its buffers or effect differ from the cached ones.
 * - bindVertexArrayObject() binds a VAO and invalidates that cache.
 * - unbindInstanceAttributes() rebinds the instance buffers via bindArrayBuffer(), which unbinds any VAO first,
 *   so the remembered locations are reset on the default VAO.
 * - Each draw records the divisor of the bound VAO.
 */
function trackInstanceDivisor(engine: NullEngine) {
    const divisors = new Map<string, number>([
        [DEFAULT_VAO, 0],
        [PARTICLE_VAO, 1],
    ]);
    const state = { divisors, drawDivisors: [] as number[] };
    let boundVao = DEFAULT_VAO;
    let instanceLocationsTracked = false;
    let cachedBuffers: unknown = null;
    let cachedEffect: unknown = null;

    vi.spyOn(engine, "bindBuffers").mockImplementation((vertexBuffers, _indexBuffer, effect) => {
        if (cachedBuffers !== vertexBuffers || cachedEffect !== effect) {
            cachedBuffers = vertexBuffers;
            cachedEffect = effect;
            boundVao = DEFAULT_VAO;
            divisors.set(DEFAULT_VAO, 1);
            instanceLocationsTracked = true;
        }
    });
    vi.spyOn(engine, "bindVertexArrayObject").mockImplementation(() => {
        boundVao = PARTICLE_VAO;
        cachedBuffers = null;
        cachedEffect = null;
    });
    vi.spyOn(engine, "unbindInstanceAttributes").mockImplementation(() => {
        if (instanceLocationsTracked) {
            boundVao = DEFAULT_VAO;
            divisors.set(DEFAULT_VAO, 0);
            instanceLocationsTracked = false;
        }
    });
    vi.spyOn(engine, "drawArraysType").mockImplementation(() => {
        state.drawDivisors.push(divisors.get(boundVao)!);
    });
    vi.spyOn(engine, "enableEffect").mockImplementation(() => {});
    vi.spyOn(engine, "releaseVertexArrayObject").mockImplementation(() => {});

    return state;
}

function createEffect(): Effect {
    return {
        defines: "",
        _multiTarget: false,
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

describe("GPUParticleSystem resets instance attributes after drawing", () => {
    let engine: NullEngine;
    let scene: Scene;

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
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    /**
     * Creates a system with one render VAO recorded with `recordedEffect`. `effectForBlendMode` decides
     * which effect each render pass uses: a pass whose effect differs from the recorded one falls back to
     * engine.bindBuffers() on the default VAO.
     */
    function createSystem(blendMode: number, recordedEffect: Effect, effectForBlendMode: (blendMode: number) => Effect): GPUParticleSystem {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        ps.blendMode = blendMode;

        vi.spyOn(ps, "_getWrapper").mockImplementation((mode: number) => ({ effect: effectForBlendMode(mode) }) as any);
        vi.spyOn(ps, "isReady").mockReturnValue(true);
        vi.spyOn(ps as any, "_initialize").mockImplementation(() => {});
        vi.spyOn(ps as any, "_update").mockImplementation(() => {});
        (ps as any)._started = true;
        ps.manualEmitCount = 10;

        const platform = (ps as any)._platform;
        platform._renderVAO = [PARTICLE_VAO];
        platform._renderVAOEffects = [recordedEffect];
        platform._renderVertexBuffers = [{}];

        return ps;
    }

    function renderFrame(ps: GPUParticleSystem): void {
        // render() draws once per render id and camera
        (ps as any)._currentRenderId = -1;
        ps.render();
    }

    it("resets the divisors after a single pass on the default VAO", () => {
        const state = trackInstanceDivisor(engine);
        // A define changed after initialization: the pass effect no longer matches the recorded one
        const staleEffect = createEffect();
        const ps = createSystem(ParticleSystem.BLENDMODE_ONEONE, createEffect(), () => staleEffect);

        renderFrame(ps);

        expect(state.drawDivisors).toEqual([1]);
        expect(state.divisors.get(DEFAULT_VAO)).toBe(0);

        ps.dispose();
    });

    it("keeps the divisors for both MULTIPLYADD passes sharing one custom effect on the default VAO", () => {
        const state = trackInstanceDivisor(engine);
        // setCustomEffect() with the default blend-mode argument: both passes resolve to the same effect
        const customEffect = createEffect();
        const ps = createSystem(ParticleSystem.BLENDMODE_MULTIPLYADD, createEffect(), () => customEffect);

        renderFrame(ps);

        // A reset between the passes would let the additive pass draw with divisor 0 ([1, 0])
        expect(state.drawDivisors).toEqual([1, 1]);
        expect(state.divisors.get(DEFAULT_VAO)).toBe(0);

        ps.dispose();
    });

    it("records the MULTIPLYADD render VAO with the ADD pass effect, not the MULTIPLY pass effect", () => {
        // Premise of the next test, checked against the real effect creation
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        ps.blendMode = ParticleSystem.BLENDMODE_MULTIPLYADD;

        const recordedEffect = ps._getWrapper(ParticleSystem.BLENDMODE_MULTIPLYADD).effect;

        expect(ps._getWrapper(ParticleSystem.BLENDMODE_ADD).effect).toBe(recordedEffect);
        expect(ps._getWrapper(ParticleSystem.BLENDMODE_MULTIPLY).effect).not.toBe(recordedEffect);

        ps.dispose();
    });

    it("resets the default VAO and leaves the particle VAO intact for a regular MULTIPLYADD system", () => {
        const state = trackInstanceDivisor(engine);
        // The VAO is recorded with the MULTIPLYADD effect. Its defines equal the ADD pass defines, so the
        // engine's effect cache returns the same effect for both, while the MULTIPLY pass adds
        // BLENDMULTIPLYMODE. MULTIPLY therefore always uses the default VAO and ADD the particle VAO, so the
        // cleanup runs while the particle VAO is bound and must still reach the default VAO.
        const addEffect = createEffect();
        const multiplyEffect = createEffect();
        const ps = createSystem(ParticleSystem.BLENDMODE_MULTIPLYADD, addEffect, (mode) => (mode === ParticleSystem.BLENDMODE_MULTIPLY ? multiplyEffect : addEffect));

        renderFrame(ps);
        renderFrame(ps);

        expect(state.drawDivisors).toEqual([1, 1, 1, 1]);
        expect(state.divisors.get(DEFAULT_VAO)).toBe(0);
        expect(state.divisors.get(PARTICLE_VAO)).toBe(1);

        ps.dispose();
    });
});
