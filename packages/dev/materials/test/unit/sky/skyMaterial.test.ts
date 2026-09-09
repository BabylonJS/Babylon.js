import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Constants } from "core/Engines/constants";
import { SkyMaterial, _MaxColorValueForRenderTarget } from "materials/sky/skyMaterial";
import { skyPixelShader } from "materials/sky/sky.fragment";
import { skyPixelShaderWGSL } from "materials/sky/wgsl/sky.fragment";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("SkyMaterial HDR output + cloudiness", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("Defaults (backward compatibility)", () => {
        // The two additions must be opt-in: with these defaults the material reproduces the stock
        // tonemapped, sharp-sun behavior exactly.
        it("defaults rawHdrOutput to false and cloudiness to 0", () => {
            const material = new SkyMaterial("sky", scene);
            expect(material.rawHdrOutput).toBe(false);
            expect(material.cloudiness).toBe(0);
        });
    });

    describe("Serialization", () => {
        // rawHdrOutput/cloudiness are @serialize()'d, so they must round-trip through
        // serialize()/Parse() (the same reflection path clone() uses).
        it("round-trips rawHdrOutput and cloudiness through serialize()/Parse()", () => {
            const material = new SkyMaterial("sky", scene);
            material.rawHdrOutput = true;
            material.cloudiness = 0.375;

            const parsed = SkyMaterial.Parse(material.serialize(), scene, "");

            expect(parsed.rawHdrOutput).toBe(true);
            expect(parsed.cloudiness).toBe(0.375);
        });
    });

    describe("SKY_RAW_HDR_OUTPUT define", () => {
        // The raw-HDR shader branch is behind the SKY_RAW_HDR_OUTPUT preprocessor define; the
        // fragment source always contains both branches, so only the resolved define proves which
        // path is compiled. Awaiting isReadyForSubMesh lets the effect's async shader-include load
        // settle before the scene is torn down (otherwise the abandoned compile errors on teardown).
        // It throws if the effect never becomes ready, so a compilation failure fails the test rather
        // than passing on the define that was written before compilation was attempted.
        const settle = async (material: SkyMaterial, mesh: ReturnType<typeof CreateBox>): Promise<void> => {
            const subMesh = mesh.subMeshes[0];
            for (let i = 0; i < 200; i++) {
                if (material.isReadyForSubMesh(mesh, subMesh)) {
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, 5));
            }
            throw new Error("SkyMaterial effect never became ready (shader compilation likely failed)");
        };

        it("tracks the rawHdrOutput property in both directions", async () => {
            const material = new SkyMaterial("sky", scene);
            // Re-evaluate defines on every isReadyForSubMesh call. In real rendering the per-frame
            // renderId advance does this; a unit test never renders, so without it the cached
            // (clean) defines short-circuit and the second toggle wouldn't be re-processed.
            material.checkReadyOnEveryCall = true;
            const mesh = CreateBox("box", { size: 1 }, scene);
            const defines = () => mesh.subMeshes[0].materialDefines as unknown as { SKY_RAW_HDR_OUTPUT: boolean };

            material.rawHdrOutput = true;
            await settle(material, mesh);
            expect(defines().SKY_RAW_HDR_OUTPUT).toBe(true);

            material.rawHdrOutput = false;
            await settle(material, mesh);
            expect(defines().SKY_RAW_HDR_OUTPUT).toBe(false);
        });
    });

    describe("Shader source integrity (cloud + raw-HDR branches)", () => {
        // A real GLSL/WGSL compile needs a GPU, which unit tests don't have; these assertions instead
        // guard the parts most likely to break when editing this #ifdef-heavy shader — that the new
        // cloud/raw-HDR code survived the .fx -> .ts build, that both output paths are behind the
        // SKY_RAW_HDR_OUTPUT define (raw path taken when defined, tonemapped otherwise), and that the
        // preprocessor guards stay balanced. They do NOT validate GLSL/WGSL syntax.
        it.each([
            { language: "GLSL", source: skyPixelShader.shader },
            { language: "WGSL", source: skyPixelShaderWGSL.shader },
        ])("$language sky fragment embeds the cloud + raw-HDR branches with balanced guards", ({ source }) => {
            // Cloud model additions.
            expect(source).toContain("cloudiness");
            expect(source).toContain("cloudPhase");

            // Raw-HDR output path (guarded), and the tonemapped default path (the #else) both present.
            expect(source).toContain("maxColorValue");
            expect(source).toContain("Uncharted2Tonemap");
            expect(source).toMatch(/#ifdef\s+SKY_RAW_HDR_OUTPUT/); // raw path + maxColorValue clamp
            expect(source).toMatch(/#ifndef\s+SKY_RAW_HDR_OUTPUT/); // skips imageProcessingCompatibility in raw mode

            // Every guard opened is closed (an unbalanced conditional would break compilation).
            // Matches #if, #ifdef, and #ifndef (the openers) against #endif (the closer).
            const opened = (source.match(/#if(?:def|ndef)?\b/g) ?? []).length;
            const closed = (source.match(/#endif\b/g) ?? []).length;
            expect(opened).toBe(closed);
        });
    });

    describe("Raw HDR clamp ceiling", () => {
        // In raw-HDR mode the shader clamps to the bound render target's max representable value so a
        // bright sun stores as that max rather than overflowing to +Inf (which would corrupt readback,
        // e.g. an IBL CDF): half-float at 65504, float effectively unbounded, and anything else (8-bit
        // LDR or the default framebuffer, textureType undefined) at [0, 1].
        it("maps the render target texture type to the correct clamp ceiling", () => {
            expect(_MaxColorValueForRenderTarget(Constants.TEXTURETYPE_HALF_FLOAT)).toBe(65504); // IEEE half-float max
            expect(_MaxColorValueForRenderTarget(Constants.TEXTURETYPE_FLOAT)).toBeGreaterThan(65504);
            expect(_MaxColorValueForRenderTarget(Constants.TEXTURETYPE_UNSIGNED_BYTE)).toBe(1.0);
            expect(_MaxColorValueForRenderTarget(undefined)).toBe(1.0);
        });
    });
});
