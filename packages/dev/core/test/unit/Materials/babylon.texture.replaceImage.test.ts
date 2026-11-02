import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Constants } from "core/Engines/constants";
import { Material } from "core/Materials/material";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";

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
            size?: number;
        } = {},
        inScene: Scene | NullEngine = scene
    ): Texture {
        const samplingMode = options.samplingMode ?? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        const texture = new Texture(null, inScene, options.noMipmap ?? false, options.invertY ?? true, samplingMode);
        texture.url = url;
        const image = new InternalTexture(inScene instanceof Scene ? inScene.getEngine() : inScene, options.source ?? InternalTextureSource.Url);
        image.url = url;
        image.isReady = true;
        image.width = image.height = image.baseWidth = image.baseHeight = options.size ?? 256;
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

    describe("serialize and parse", () => {
        // a texture saved and loaded in another session: without the internal texture's id, Texture.Parse loads from rootUrl + name
        // (the url it leaves on the texture is the serialized one, so what was loaded is read from the internal texture)
        function reloaded(texture: Texture, rootUrl: string): string | undefined {
            const serialized = texture.serialize();
            delete serialized.internalTextureUniqueId;
            return (Texture.Parse(serialized, scene, rootUrl) as Texture).getInternalTexture()?.url;
        }

        it("loads the image it shows when the name was the url (an empty root url)", () => {
            const texture = loaded("old.png");
            texture.name = "old.png";
            expect(texture.replaceImage(loaded("images/new.png"))).toBe(true);
            expect(texture.name).toBe("images/new.png");
            expect(reloaded(texture, "")).toBe("images/new.png");
        });

        it("loads the image it shows when the name is relative to a root url (a parsed scene)", () => {
            const original = loaded("old.png");
            original.name = "old.png";
            const serialized = original.serialize();
            delete serialized.internalTextureUniqueId;
            const fromScene = Texture.Parse(serialized, scene, "scenes/") as Texture;
            expect(fromScene.getInternalTexture()?.url).toBe("scenes/old.png");
            expect(fromScene.replaceImage(loaded("scenes/new.png"))).toBe(true);
            expect(fromScene.name).toBe("new.png");
            expect(reloaded(fromScene, "scenes/")).toBe("scenes/new.png");
        });

        it("keeps a name of its own, which Texture.Parse loads from as for a texture never replaced", () => {
            const plain = loaded("old.png");
            plain.name = "ground";
            expect(reloaded(plain, "")).toBe("ground");

            const named = loaded("old.png");
            named.name = "ground";
            expect(named.replaceImage(loaded("new.png"))).toBe(true);
            expect(named.name).toBe("ground");
            expect(reloaded(named, "")).toBe("ground");
        });

        it("goes up from the root for a source outside it, and takes a source's absolute url", () => {
            // what the browser fetches for a url relative to the page
            const fetched = (url?: string) => new URL(url!, "https://example.com/app/").href;
            const texture = loaded("scenes/old.png");
            texture.name = "old.png";
            expect(texture.replaceImage(loaded("other/new.png"))).toBe(true);
            expect(texture.name).toBe("../other/new.png");
            expect(fetched(reloaded(texture, "scenes/"))).toBe(fetched("other/new.png"));

            const deep = loaded("a/b/old.png");
            deep.name = "old.png";
            expect(deep.replaceImage(loaded("../shared/new.png"))).toBe(true);
            expect(fetched(reloaded(deep, "a/b/"))).toBe(fetched("../shared/new.png"));

            const absolute = loaded("scenes/old.png");
            absolute.name = "old.png";
            expect(absolute.replaceImage(loaded("https://cdn.example.com/new.png"))).toBe(true);
            expect(absolute.name).toBe("https://cdn.example.com/new.png");
            expect(reloaded(absolute, "scenes/")).toBe("https://cdn.example.com/new.png");
        });
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

        vi.spyOn(engine, "snapshotRendering", "get").mockReturnValue(true);
        const reset = vi.spyOn(engine, "snapshotRenderingReset").mockImplementation(() => {});
        expect(texture.replaceImage(source)).toBe(true);
        expect(texture.getInternalTexture()).toBe(image);
        expect(image._references).toBe(2);
        // the same image, read the same way: the recorded snapshot still draws it
        expect(reset).not.toHaveBeenCalled();
    });

    it("takes a source of the same engine that has no scene", () => {
        const source = loaded("preloaded.png", {}, engine);
        expect(source.getScene()).toBeNull();
        expect(loaded("texture.png").replaceImage(source)).toBe(true);
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

    // a material drawn once with the texture
    function drawnWith(texture: Texture, frozen = true) {
        const material = new Material("material", scene);
        material.hasTexture = (t) => t === texture;
        if (frozen) {
            material.freeze();
        }
        const plane = CreatePlane("plane", {}, scene);
        plane.material = material;
        const drawWrapper = plane.subMeshes[0]._getDrawWrapper(undefined, true)!;
        drawWrapper._wasPreviouslyReady = true;
        return { material, drawWrapper };
    }

    it("marks no material that is not frozen when only the size changes, as streaming does, and marks it when its defines change", () => {
        const texture = loaded("texture.png", { size: 256, gammaSpace: false, imageGamma: false });
        const { material, drawWrapper } = drawnWith(texture, false);
        const markAsDirty = vi.spyOn(material, "markAsDirty");

        // the material writes the size into its uniforms at each bind
        expect(texture.replaceImage(loaded("larger.png", { size: 1024, gammaSpace: false, imageGamma: false }))).toBe(true);
        expect(markAsDirty).not.toHaveBeenCalled();
        expect(drawWrapper._wasPreviouslyReady).toBe(true);

        expect(texture.replaceImage(loaded("gamma.png", { size: 1024, gammaSpace: true, imageGamma: true }))).toBe(true);
        expect(markAsDirty).toHaveBeenCalledWith(Constants.MATERIAL_TextureDirtyFlag);
    });

    it("makes a frozen material that uses it compute again what it reads from the image, only when it changes", () => {
        const texture = loaded("texture.png", { size: 256 });
        const { drawWrapper } = drawnWith(texture);

        expect(texture.replaceImage(loaded("same.png", { size: 256 }))).toBe(true);
        expect(drawWrapper._wasPreviouslyReady).toBe(true);

        // a PBR 2D reflection texture's width and LOD go to the uniform buffer, which a frozen material only writes when forced
        expect(texture.replaceImage(loaded("larger.png", { size: 1024 }))).toBe(true);
        expect(drawWrapper._wasPreviouslyReady).toBe(false);
        expect(drawWrapper._forceRebindOnNextCall).toBe(true);
    });

    it("keeps the source's gamma when its image has none set yet, and marks the materials dirty only when the effective gamma changes", () => {
        const texture = loaded("texture.png", { gammaSpace: true, imageGamma: true });
        const markDirty = vi.spyOn(drawnWith(texture).material, "markDirty");

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
