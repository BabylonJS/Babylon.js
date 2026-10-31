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
        options: {
            invertY?: boolean;
            noMipmap?: boolean;
            samplingMode?: number;
            gammaSpace?: boolean;
            imageGamma?: boolean | null;
            invertVScale?: boolean;
            source?: InternalTextureSource;
            cube?: boolean;
        } = {},
        inScene = scene
    ): Texture {
        const samplingMode = options.samplingMode ?? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        const texture = new Texture(null, inScene, options.noMipmap ?? false, options.invertY ?? true, samplingMode);
        texture.url = url;
        const image = new InternalTexture(inScene.getEngine(), options.source ?? InternalTextureSource.Url);
        image.isReady = true;
        image.samplingMode = samplingMode;
        image.isCube = !!options.cube;
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
        const source = loaded("source.png", { noMipmap: true, samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE });
        const image = source.getInternalTexture()!;

        expect(texture.replaceImage(source)).toBe(true);
        expect(texture.getInternalTexture()).toBe(image);
        expect(image._references).toBe(2);
        expect(previous._references).toBe(0);
        expect(texture.url).toBe("source.png");
        expect(texture.noMipmap).toBe(true);
        expect(texture.uScale).toBe(2);
        expect(texture.coordinatesIndex).toBe(1);
        expect(texture.samplingMode).toBe(Constants.TEXTURE_NEAREST_SAMPLINGMODE);

        // a later load uses the sampling mode it showed
        texture.releaseInternalTexture();
        expect(texture.samplingMode).toBe(Constants.TEXTURE_NEAREST_SAMPLINGMODE);
    });

    it("refuses what it cannot take or replace, leaving both textures unchanged", () => {
        const refused: Array<[string, () => [Texture, Texture]]> = [
            ["another orientation", () => [loaded("texture.png"), loaded("flipped.png", { invertY: false })]],
            ["a V scale inverted by its loading", () => [loaded("texture.png"), loaded("vscale.png", { invertVScale: true })]],
            [
                "an image still loading",
                () => {
                    const source = loaded("loading.png");
                    source.getInternalTexture()!.isReady = false;
                    return [loaded("texture.png"), source];
                },
            ],
            [
                "no loading description",
                () => {
                    const source = loaded("nourl.png");
                    source.url = null;
                    return [loaded("texture.png"), source];
                },
            ],
            ["a cube image", () => [loaded("texture.png"), loaded("cube.dds", { cube: true })]],
            ["a raw image", () => [loaded("texture.png"), loaded("raw.png", { source: InternalTextureSource.Raw })]],
            ["a render target", () => [loaded("texture.png"), new RenderTargetTexture("target", 4, scene)]],
            ["a render target taking an image", () => [new RenderTargetTexture("target", 4, scene), loaded("source.png")]],
            ["a dynamic image replaced", () => [loaded("dynamic.png", { source: InternalTextureSource.Dynamic }), loaded("source.png")]],
            [
                "another engine",
                () => {
                    const other = new NullEngine();
                    others.push(other);
                    return [loaded("texture.png"), loaded("other.png", {}, new Scene(other))];
                },
            ],
        ];
        for (const [why, make] of refused) {
            const [texture, source] = make();
            const own = texture.getInternalTexture();
            const ownReferences = own?._references;
            const url = texture.url;
            const image = source.getInternalTexture();
            const references = image?._references;
            expect(texture.replaceImage(source), why).toBe(false);
            expect(texture.getInternalTexture(), why).toBe(own);
            expect(own?._references, why).toBe(ownReferences);
            expect(texture.url, why).toBe(url);
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

    it("records a snapshot again, in the STANDARD mode as in the FAST one", () => {
        vi.spyOn(engine, "snapshotRendering", "get").mockReturnValue(true);
        const mode = vi.spyOn(engine, "snapshotRenderingMode", "get");
        const reset = vi.spyOn(engine, "snapshotRenderingReset").mockImplementation(() => {});
        for (const snapshotMode of [Constants.SNAPSHOTRENDERING_STANDARD, Constants.SNAPSHOTRENDERING_FAST]) {
            mode.mockReturnValue(snapshotMode);
            reset.mockClear();
            loaded("texture.png").replaceImage(loaded("source.png"));
            expect(reset, `mode ${snapshotMode}`).toHaveBeenCalledTimes(1);
        }
    });
});
