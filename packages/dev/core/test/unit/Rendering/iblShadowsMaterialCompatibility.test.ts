import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { PBRSpecularGlossinessMaterial } from "core/Materials/PBR/pbrSpecularGlossinessMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { type Material } from "core/Materials/material";
import { IsIBLShadowsReceiverCompatible } from "core/Rendering/IBLShadows/iblShadowsMaterialCompatibility.pure";
import { Scene } from "core/scene";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * The shared predicate is used by both the legacy `IblShadowsRenderPipeline` and the Frame Graph
 * `FrameGraphIblShadowsRendererTask`, so these assertions guard both paths against drift.
 */
describe("IsIBLShadowsReceiverCompatible", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        scene = new Scene(engine);
    });

    it("accepts PBR (incl. subclasses), Standard, and OpenPBR materials", () => {
        expect(IsIBLShadowsReceiverCompatible(new PBRMaterial("pbr", scene))).toBe(true);
        expect(IsIBLShadowsReceiverCompatible(new PBRSpecularGlossinessMaterial("pbrsg", scene))).toBe(true);
        expect(IsIBLShadowsReceiverCompatible(new StandardMaterial("std", scene))).toBe(true);
        expect(IsIBLShadowsReceiverCompatible(new OpenPBRMaterial("openpbr", scene))).toBe(true);
    });

    it("accepts ShadowOnlyMaterial (identified by class name, since it lives in the materials package)", () => {
        // Avoid a core→materials dependency: a stub whose getClassName() reports "ShadowOnlyMaterial"
        // exercises the exact branch the real class hits.
        const shadowOnlyLike = { getClassName: () => "ShadowOnlyMaterial" } as unknown as Material;
        expect(IsIBLShadowsReceiverCompatible(shadowOnlyLike)).toBe(true);
    });

    it("rejects unrelated materials", () => {
        const other = { getClassName: () => "GridMaterial" } as unknown as Material;
        expect(IsIBLShadowsReceiverCompatible(other)).toBe(false);
    });
});
