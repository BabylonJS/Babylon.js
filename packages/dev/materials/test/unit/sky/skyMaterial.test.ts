import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Constants } from "core/Engines/constants";
import { MaxHalfFloat } from "core/Misc/halfFloat";
import { SkyMaterial, _MaxColorValueForRenderTarget } from "materials/sky/skyMaterial";
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
        const settle = async (material: SkyMaterial, mesh: ReturnType<typeof CreateBox>): Promise<void> => {
            const subMesh = mesh.subMeshes[0];
            for (let i = 0; i < 100 && !material.isReadyForSubMesh(mesh, subMesh); i++) {
                await new Promise((resolve) => setTimeout(resolve, 2));
            }
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

    describe("Raw HDR clamp ceiling", () => {
        // In raw-HDR mode the shader clamps to the bound render target's max representable value so a
        // bright sun stores as that max rather than overflowing to +Inf (which would corrupt readback,
        // e.g. an IBL CDF): half-float at 65504, float effectively unbounded, and anything else (8-bit
        // LDR or the default framebuffer, textureType undefined) at [0, 1].
        it("maps the render target texture type to the correct clamp ceiling", () => {
            expect(_MaxColorValueForRenderTarget(Constants.TEXTURETYPE_HALF_FLOAT)).toBe(MaxHalfFloat);
            expect(_MaxColorValueForRenderTarget(Constants.TEXTURETYPE_FLOAT)).toBeGreaterThan(MaxHalfFloat);
            expect(_MaxColorValueForRenderTarget(Constants.TEXTURETYPE_UNSIGNED_BYTE)).toBe(1.0);
            expect(_MaxColorValueForRenderTarget(undefined)).toBe(1.0);
        });
    });
});
