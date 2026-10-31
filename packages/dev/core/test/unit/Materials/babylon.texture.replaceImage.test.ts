import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Constants } from "core/Engines/constants";

/**
 * Texture.replaceImage: a texture takes the image of another one, already loaded, with its loading description, and keeps its own
 * settings for the materials. It refuses, changing neither texture, what it cannot take.
 */
describe("Texture.replaceImage", () => {
    let engine: NullEngine;
    let scene: Scene;
    let others: NullEngine[];

    // a texture loaded from a url (a NullEngine loads nothing: its image is an internal texture marked ready)
    function loaded(
        url: string,
        options: { invertY?: boolean; noMipmap?: boolean; gammaSpace?: boolean; imageGamma?: boolean | null; invertVScale?: boolean } = {},
        inScene = scene
    ): Texture {
        const texture = new Texture(null, inScene, options.noMipmap ?? false, options.invertY ?? true);
        texture.url = url;
        const image = new InternalTexture(inScene.getEngine(), InternalTextureSource.Url);
        image.isReady = true;
        image._invertVScale = !!options.invertVScale;
        image._gammaSpace = options.imageGamma === undefined ? null : options.imageGamma;
        texture._texture = image;
        if (options.gammaSpace !== undefined) {
            (texture as any)._gammaSpace = options.gammaSpace;
        }
        return texture;
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        others = [];
    });

    afterEach(() => {
        for (const other of others) {
            other.dispose();
        }
        engine.dispose();
    });

    it("takes the source's image and loading description, and keeps its own settings for the materials", () => {
        const texture = loaded("texture.png");
        texture.uScale = 2;
        texture.coordinatesIndex = 1;
        const previous = texture.getInternalTexture()!;
        const source = loaded("source.png", { noMipmap: true });
        const image = source.getInternalTexture()!;

        expect(texture.replaceImage(source)).toBe(true);
        expect(texture.getInternalTexture()).toBe(image);
        expect(image._references).toBe(2);
        expect(previous._references).toBe(0);
        expect(texture.url).toBe("source.png");
        expect(texture.noMipmap).toBe(true);
        expect(texture.uScale).toBe(2);
        expect(texture.coordinatesIndex).toBe(1);
    });

    it("refuses what it cannot take, leaving both textures unchanged", () => {
        const texture = loaded("texture.png");
        const own = texture.getInternalTexture()!;
        const refused: Array<[string, () => Texture]> = [
            ["another orientation", () => loaded("flipped.png", { invertY: false })],
            ["a V scale inverted by its loading", () => loaded("vscale.png", { invertVScale: true })],
            [
                "an image still loading",
                () => {
                    const source = loaded("loading.png");
                    source.getInternalTexture()!.isReady = false;
                    return source;
                },
            ],
            [
                "no loading description",
                () => {
                    const source = loaded("nourl.png");
                    source.url = null;
                    return source;
                },
            ],
            ["a render target", () => new RenderTargetTexture("target", 4, scene)],
            [
                "another engine",
                () => {
                    const other = new NullEngine();
                    others.push(other);
                    return loaded("other.png", {}, new Scene(other));
                },
            ],
        ];
        for (const [why, make] of refused) {
            const source = make();
            const image = source.getInternalTexture();
            const references = image?._references;
            expect(texture.replaceImage(source), why).toBe(false);
            expect(texture.getInternalTexture(), why).toBe(own);
            expect(own._references, why).toBe(1);
            expect(texture.url, why).toBe("texture.png");
            expect(source.getInternalTexture(), why).toBe(image);
            expect(image?._references, why).toBe(references);
        }
    });

    it("does nothing when a texture replaces itself", () => {
        const texture = loaded("texture.png");
        const image = texture.getInternalTexture()!;
        expect(texture.replaceImage(texture)).toBe(true);
        expect(texture.getInternalTexture()).toBe(image);
        expect(image._references).toBe(1);
    });

    it("keeps an image two wrappers already share", () => {
        const source = loaded("shared.png");
        const image = source.getInternalTexture()!;
        const texture = new Texture(null, scene);
        texture.url = "shared.png";
        image.incrementReferences();
        texture._texture = image;

        expect(texture.replaceImage(source)).toBe(true);
        expect(texture.getInternalTexture()).toBe(image);
        expect(image._references).toBe(2);
    });

    it("keeps the image when the source is disposed afterwards", () => {
        const texture = loaded("texture.png");
        const source = loaded("source.png");
        const image = source.getInternalTexture()!;
        texture.replaceImage(source);
        source.dispose();
        expect(texture.getInternalTexture()).toBe(image);
        expect(image._references).toBe(1);
    });

    it("keeps the source's gamma when its image has none set yet, and marks the materials dirty only when the effective gamma changes", () => {
        const markDirty = vi.spyOn(scene, "markAllMaterialsAsDirty");
        const texture = loaded("texture.png", { gammaSpace: true, imageGamma: true });

        // the source's wrapper is linear, and its image has no gamma state: the image must stay linear, not take this texture's gamma
        expect(texture.replaceImage(loaded("linear.png", { gammaSpace: false, imageGamma: null }))).toBe(true);
        expect(texture.gammaSpace).toBe(false);
        expect(markDirty).toHaveBeenCalledTimes(1);

        expect(texture.replaceImage(loaded("linear2.png", { gammaSpace: false, imageGamma: false }))).toBe(true);
        expect(markDirty).toHaveBeenCalledTimes(1);
    });

    it("records a FAST snapshot again", () => {
        vi.spyOn(engine, "snapshotRendering", "get").mockReturnValue(true);
        vi.spyOn(engine, "snapshotRenderingMode", "get").mockReturnValue(Constants.SNAPSHOTRENDERING_FAST);
        const reset = vi.spyOn(engine, "snapshotRenderingReset").mockImplementation(() => {});
        loaded("texture.png").replaceImage(loaded("source.png"));
        expect(reset).toHaveBeenCalledTimes(1);
    });
});
