import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Texture } from "core/Materials/Textures/texture";
import { _CopyTextureMetadata } from "core/Materials/Textures/textureSampling.functions";
import { Scene } from "core/scene";

describe("_CopyTextureMetadata", () => {
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

    it.each([false, true])("preserves the texture matrix of a rotation around a non-default center (homogeneous: %s)", (homogeneous) => {
        // KHR_texture_transform rotates around (0, 0), unlike the (0.5, 0.5) default of a new texture.
        const source = new Texture(null, scene);
        source.uOffset = 0.25;
        source.vOffset = -0.5;
        source.uScale = 2;
        source.vScale = 3;
        source.wAng = Math.PI / 4;
        source.uRotationCenter = 0;
        source.vRotationCenter = 0;
        source.homogeneousRotationInUVTransform = homogeneous;
        const target = new Texture(null, scene);

        _CopyTextureMetadata(source, target, true);

        expect(target.getTextureMatrix().equalsWithEpsilon(source.getTextureMatrix(), 1e-6)).toBe(true);
        expect(target.getTextureMatrix().isIdentity()).toBe(false);
    });
});
