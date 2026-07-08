import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";

// Side-effect import to register the WebGL2ParticleSystem class.
import "core/Particles/webgl2ParticleSystem";

describe("GPUParticleSystem.emitRateControl setter", () => {
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
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // The render effect defines are derived from emitRateControl, so they reflect the current value.
    const hasEmitRateControlDefine = (ps: GPUParticleSystem): boolean => {
        const defines: string[] = [];
        ps.fillDefines(defines, 0);
        return defines.includes("#define EMITRATECTRL");
    };

    it("defaults to false and can be toggled at runtime, updating the shader defines", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        expect(ps.emitRateControl).toBe(false);
        expect(hasEmitRateControlDefine(ps)).toBe(false);

        ps.emitRateControl = true;
        expect(ps.emitRateControl).toBe(true);
        expect(hasEmitRateControlDefine(ps)).toBe(true);

        ps.emitRateControl = false;
        expect(ps.emitRateControl).toBe(false);
        expect(hasEmitRateControlDefine(ps)).toBe(false);

        ps.dispose();
    });

    it("honors emitRateControl provided via the constructor options", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100, emitRateControl: true }, scene);

        expect(ps.emitRateControl).toBe(true);
        expect(hasEmitRateControlDefine(ps)).toBe(true);

        ps.dispose();
    });
});
