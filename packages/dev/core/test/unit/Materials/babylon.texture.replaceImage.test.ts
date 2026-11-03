import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Constants } from "core/Engines/constants";
import { Material } from "core/Materials/material";
import { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { TransformBlock } from "core/Materials/Node/Blocks/transformBlock";
import { VertexOutputBlock } from "core/Materials/Node/Blocks/Vertex/vertexOutputBlock";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
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

        // what the browser fetches for a url relative to the page
        const fetched = (url?: string) => new URL(url!, "https://example.com/app/").href;

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

            // also when it is given after a replacement that went up from the root
            const renamed = loaded("scenes/old.png");
            renamed.name = "old.png";
            expect(renamed.replaceImage(loaded("other/a.png"))).toBe(true);
            renamed.name = "ground";
            expect(renamed.replaceImage(loaded("other/b.png"))).toBe(true);
            expect(renamed.name).toBe("ground");
        });

        it("goes up from the root for a source outside it, and takes a source's absolute url", () => {
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

        it("keeps the root across replacements: a name that went up from it follows the next source, back into the root too", () => {
            const texture = loaded("scenes/x.png");
            texture.name = "x.png";
            expect(texture.replaceImage(loaded("other/a.png"))).toBe(true);
            expect(texture.replaceImage(loaded("other/b.png"))).toBe(true);
            expect(texture.name).toBe("../other/b.png");
            expect(fetched(reloaded(texture, "scenes/"))).toBe(fetched("other/b.png"));

            expect(texture.replaceImage(loaded("scenes/c.png"))).toBe(true);
            expect(texture.name).toBe("c.png");
            expect(reloaded(texture, "scenes/")).toBe("scenes/c.png");
        });

        it("gives a clone the root its name is relative to", () => {
            const texture = loaded("scenes/x.png");
            texture.name = "x.png";
            expect(texture.replaceImage(loaded("other/a.png"))).toBe(true);
            const clone = texture.clone();
            expect(clone.name).toBe("../other/a.png");
            expect(clone.replaceImage(loaded("other/b.png"))).toBe(true);
            expect(fetched(reloaded(clone, "scenes/"))).toBe(fetched("other/b.png"));
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

    it("keeps the source's gamma for an image two wrappers already share and that has none set yet", () => {
        const source = loaded("shared.png", { gammaSpace: false, imageGamma: null });
        const image = source.getInternalTexture()!;
        const texture = new Texture(null, scene);
        texture.url = "shared.png";
        image.incrementReferences();
        texture._texture = image;
        const markDirty = vi.spyOn(drawnWith(texture).material, "markDirty");

        // this texture is gamma space (the default), the source linear: the image takes the source's gamma, not this texture's
        expect(image._gammaSpace).toBeNull();
        expect(texture.replaceImage(source)).toBe(true);
        expect(image._gammaSpace).toBe(false);
        expect(texture.gammaSpace).toBe(false);
        expect(source.gammaSpace).toBe(false);
        // the materials of this texture read it as gamma space before
        expect(markDirty).toHaveBeenCalledTimes(1);
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
        // the material and another one that is not frozen are not even asked whether they use the texture
        const hasTexture = vi.spyOn(material, "hasTexture");
        const otherHasTexture = vi.spyOn(new Material("other", scene), "hasTexture");

        // the material writes the size into its uniforms at each bind
        expect(texture.replaceImage(loaded("larger.png", { size: 1024, gammaSpace: false, imageGamma: false }))).toBe(true);
        expect(markAsDirty).not.toHaveBeenCalled();
        expect(drawWrapper._wasPreviouslyReady).toBe(true);
        expect(hasTexture).not.toHaveBeenCalled();
        expect(otherHasTexture).not.toHaveBeenCalled();

        expect(texture.replaceImage(loaded("gamma.png", { size: 1024, gammaSpace: true, imageGamma: true }))).toBe(true);
        expect(markAsDirty).toHaveBeenCalledWith(Constants.MATERIAL_TextureDirtyFlag);
        expect(otherHasTexture).toHaveBeenCalledTimes(1);
    });

    it("reaches the materials that read it as the scene's environment texture, frozen ones included", () => {
        const environment = loaded("environment.png", { gammaSpace: true, imageGamma: true, size: 256 });
        environment.coordinatesMode = Texture.EQUIRECTANGULAR_MODE;
        scene.environmentTexture = environment;
        // PBR materials without a reflection texture of their own read the scene's environment texture, which hasTexture does not tell
        const material = new PBRMaterial("pbr", scene);
        const frozen = new PBRMaterial("frozen", scene);
        frozen.freeze();
        expect(material.hasTexture(environment)).toBe(false);
        expect((material as any)._getReflectionTexture()).toBe(environment);
        const markAsDirty = vi.spyOn(material, "markAsDirty");
        const markDirty = vi.spyOn(frozen, "markDirty");

        // another gamma: the defines of both are computed again
        expect(environment.replaceImage(loaded("linear.png", { gammaSpace: false, imageGamma: false, size: 256 }))).toBe(true);
        expect(markAsDirty).toHaveBeenCalledWith(Constants.MATERIAL_TextureDirtyFlag);
        expect(markDirty).toHaveBeenCalledWith(true);

        // another size only: the frozen one writes its uniforms again, the other one at its next bind
        markAsDirty.mockClear();
        markDirty.mockClear();
        expect(environment.replaceImage(loaded("larger.png", { gammaSpace: false, imageGamma: false, size: 1024 }))).toBe(true);
        expect(markAsDirty).not.toHaveBeenCalled();
        expect(markDirty).toHaveBeenCalledWith(true);
    });

    it("converts a node material's texture to gamma space once its gamma space image is replaced with a linear one", async () => {
        const texture = loaded("gamma.png", { gammaSpace: true, imageGamma: true });
        // a node material that shows the texture in gamma space: its texture block converts the texture when the image is linear
        const material = new NodeMaterial("node material", scene);
        const position = new InputBlock("position");
        position.setAsAttribute("position");
        const world = new InputBlock("world");
        world.setAsSystemValue(NodeMaterialSystemValues.World);
        const viewProjection = new InputBlock("viewProjection");
        viewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
        const worldPosition = new TransformBlock("worldPosition");
        position.output.connectTo(worldPosition.vector);
        world.output.connectTo(worldPosition.transform);
        const clipPosition = new TransformBlock("clipPosition");
        worldPosition.output.connectTo(clipPosition.vector);
        viewProjection.output.connectTo(clipPosition.transform);
        const vertexOutput = new VertexOutputBlock("vertexOutput");
        clipPosition.output.connectTo(vertexOutput.vector);
        const uv = new InputBlock("uv");
        uv.setAsAttribute("uv");
        const textureBlock = new TextureBlock("texture");
        textureBlock.texture = texture;
        textureBlock.convertToGammaSpace = true;
        uv.output.connectTo(textureBlock.uv);
        const fragmentOutput = new FragmentOutputBlock("fragmentOutput");
        textureBlock.rgb.connectTo(fragmentOutput.rgb);
        material.addOutputNode(vertexOutput);
        material.addOutputNode(fragmentOutput);
        const built = new Promise<void>((resolve, reject) => {
            material.onBuildObservable.addOnce(() => resolve());
            material.onBuildErrorObservable.addOnce((error) => reject(new Error(error)));
        });
        material.build();
        await built;

        const plane = CreatePlane("plane", {}, scene);
        plane.material = material;
        // the texture block's conversion of its output to gamma space, written under a define
        const output = textureBlock.rgb.associatedVariableName;
        const conversion = new RegExp(`#ifdef (\\w+)\\s+${output} = toGammaSpace\\(${output}\\);`);
        // whether the effect the material draws the plane with in a frame, once compiled, converts the texture: the conversion is in its
        // fragment shader, and the effect sets its define
        const convertsAsync = async () => {
            const ready = () => {
                scene.incrementRenderId();
                return material.isReadyForSubMesh(plane, plane.subMeshes[0]);
            };
            for (let i = 0; i < 50 && !ready(); i++) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            expect(ready()).toBe(true);
            const effect = plane.subMeshes[0].effect!;
            const match = conversion.exec(effect.fragmentSourceCode);
            return !!match && effect.defines.split("\n").includes(`#define ${match[1]}`);
        };

        expect(await convertsAsync()).toBe(false);
        expect(texture.replaceImage(loaded("linear.png", { gammaSpace: false, imageGamma: false }))).toBe(true);
        expect(await convertsAsync()).toBe(true);
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
