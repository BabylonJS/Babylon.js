import { describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Constants } from "core/Engines/constants";
import { IblCdfGenerator } from "core/Rendering/iblCdfGenerator";

// Regression coverage for the scaled-luminance texture format: r32float mip generation requires
// filtered sampling, which on WebGPU hard-fails bind group validation (dropping the whole command
// buffer) when the optional `float32-filterable` adapter feature is absent. r16float is filterable
// everywhere but loses range/precision that the CDF importance-sampling ratio does NOT cancel out
// (see iblIcdf.fragment: it divides a fresh full-precision iblSource sample by the mip-averaged
// scaled-luminance value, which are independently sampled). So the r16float fallback must only
// apply to the WebGPU adapters that actually need it.
describe("IblCdfGenerator scaled-luminance texture format", () => {
    function createScaledLuminanceType(configureEngine: (engine: NullEngine) => void): number | undefined {
        const engine = new NullEngine();
        engine.getCaps().texelFetch = true; // required by IblCdfGenerator.isSupported
        configureEngine(engine);
        const scene = new Scene(engine);

        const generator = new IblCdfGenerator(scene);
        (generator as any)._createTextures();
        const type = (generator as any)._scaledLuminancePT.getInternalTexture()?.type;

        scene.dispose();
        engine.dispose();
        return type;
    }

    it("uses r32float when float32 linear filtering is supported", () => {
        const type = createScaledLuminanceType((engine) => {
            engine.getCaps().textureFloatLinearFiltering = true;
        });
        expect(type).toBe(Constants.TEXTURETYPE_FLOAT);
    });

    it("falls back to r16float on WebGPU adapters lacking float32-filterable", () => {
        const type = createScaledLuminanceType((engine) => {
            (engine as any)._isWebGPU = true;
            engine.getCaps().textureFloatLinearFiltering = false;
        });
        expect(type).toBe(Constants.TEXTURETYPE_HALF_FLOAT);
    });

    it("keeps r32float on non-WebGPU engines even without float32 linear filtering", () => {
        const type = createScaledLuminanceType((engine) => {
            engine.getCaps().textureFloatLinearFiltering = false;
        });
        expect(type).toBe(Constants.TEXTURETYPE_FLOAT);
    });
});
