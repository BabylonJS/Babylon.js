import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Constants } from "core/Engines/constants";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Light } from "core/Lights/light";
import { RectAreaLight } from "core/Lights/rectAreaLight";
import { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

// A valid 1x1 transparent PNG used as the stand-in for the processed emission texture pixels.
const MockEmissionBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Constructing an AreaLight kicks off a network fetch for the shared LTC textures.
// Mock the decode helper so the serialization tests stay offline and deterministic.
vi.mock("core/Lights/LTC/ltcTextureTool", () => ({
    DecodeLTCTextureDataAsync: vi.fn().mockResolvedValue([new Uint16Array(64 * 64 * 4), new Uint16Array(64 * 64 * 4)]),
}));

// The processed emission texture has no readable pixels under the NullEngine, so mock the
// base64 generation helpers to return a deterministic data URL.
vi.mock("core/Misc/copyTools", () => ({
    GenerateBase64StringFromTexture: vi.fn(() => MockEmissionBase64),
    GenerateBase64StringFromTextureAsync: vi.fn(async () => MockEmissionBase64),
}));

describe("RectAreaLight serialization", () => {
    let engine: Engine;
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

    it("should serialize position, width and height", () => {
        const light = new RectAreaLight("rect", new Vector3(1, 2, 3), 4, 5, scene);

        const serialized = light.serialize();

        expect(serialized.type).toBe(Light.LIGHTTYPEID_RECT_AREALIGHT);
        expect(serialized.position).toEqual([1, 2, 3]);
        expect(serialized.width).toBe(4);
        expect(serialized.height).toBe(5);
    });

    it("should round-trip position, width and height through parse", () => {
        const light = new RectAreaLight("rect", new Vector3(1, 2, 3), 4, 5, scene);

        const parsed = Light.Parse(light.serialize(), scene) as RectAreaLight;

        expect(parsed).toBeInstanceOf(RectAreaLight);
        expect(parsed.position.asArray()).toEqual([1, 2, 3]);
        expect(parsed.width).toBe(4);
        expect(parsed.height).toBe(5);
    });

    it("should keep a non-zero photometric scale after parse so the light still emits", () => {
        const light = new RectAreaLight("rect", new Vector3(1, 2, 3), 4, 5, scene);
        light.intensity = 1.1;

        // Sanity: a freshly created area light already has a usable scaled intensity.
        expect(light.getScaledIntensity()).toBeCloseTo(1.1);

        // Parsing applies the serialized intensityMode/radius setters, which recompute the
        // photometric scale. Without a RECT_AREALIGHT case in _getPhotometricScale() this
        // collapsed to 0, leaving the parsed light dark even though it appears in the scene.
        const parsed = Light.Parse(light.serialize(), scene) as RectAreaLight;

        expect(parsed.getScaledIntensity()).toBeCloseTo(1.1);
        expect(parsed.getScaledIntensity()).toBeGreaterThan(0);
    });

    it("should not serialize an emission texture when none is assigned", () => {
        const light = new RectAreaLight("rect", new Vector3(0, 0, 0), 1, 1, scene);

        const serialized = light.serialize();

        expect(serialized.emissionTexture).toBeUndefined();
    });

    it("should serialize and round-trip a referenced (URL) emission texture", () => {
        const light = new RectAreaLight("rect", new Vector3(0, 0, 0), 1, 1, scene);
        light.emissionTexture = new Texture("test-emission.png", scene);

        const serialized = light.serialize();
        expect(serialized.emissionTexture).toBeDefined();
        expect(serialized.emissionTexture.name).toBe("test-emission.png");

        const parsed = Light.Parse(serialized, scene) as RectAreaLight;
        expect(parsed.emissionTexture).not.toBeNull();
        expect(parsed.emissionTexture!.name).toBe("test-emission.png");
        // Parsing must go through the public setter, which forces clamp wrap modes.
        expect(parsed.emissionTexture!.wrapU).toBe(Constants.TEXTURE_CLAMP_ADDRESSMODE);
        expect(parsed.emissionTexture!.wrapV).toBe(Constants.TEXTURE_CLAMP_ADDRESSMODE);
    });

    it("should embed a runtime-processed emission texture as base64 and restore it on parse", () => {
        const light = new RectAreaLight("rect", new Vector3(0, 0, 0), 1, 1, scene);

        // Emulate the texture returned by AreaLightTextureTools: a render-target-backed texture with
        // no source URL, so it cannot be serialized by reference and must embed its pixels instead.
        const processed = new BaseTexture(engine);
        vi.spyOn(processed, "serialize").mockReturnValue(null);
        vi.spyOn(processed, "getInternalTexture").mockReturnValue({ invertY: false } as any);
        light.emissionTexture = processed;

        // NullEngine reports no synchronous texture read; force it so the deterministic sync path runs.
        (engine as any)._features.supportSyncTextureRead = true;

        const serialized = light.serialize();
        expect(serialized.emissionTexture).toBeDefined();
        expect(serialized.emissionTexture.name).toBe("areaLightEmissionTexture");
        expect(serialized.emissionTexture.base64String).toBe(MockEmissionBase64);

        const parsed = Light.Parse(serialized, scene) as RectAreaLight;
        expect(parsed.emissionTexture).not.toBeNull();
    });
});
