/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { Texture } from "core/Materials/Textures/texture";
import { VideoTexture } from "core/Materials/Textures/videoTexture";
import { Scene } from "core/scene";

/**
 * Texture.replaceImage takes and replaces only the image of a plain texture: a video texture showing its poster, or a procedural texture
 * showing its fallback, has a ready image loaded from a url, but its wrapper manages that image.
 */
describe("Texture.replaceImage, the wrappers it takes and replaces", () => {
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

    // a texture loaded from a url (a NullEngine loads nothing: its image is an internal texture marked ready)
    function loaded(url: string, invertY: boolean): Texture {
        const texture = new Texture(null, scene, false, invertY);
        texture.url = url;
        const image = new InternalTexture(engine, InternalTextureSource.Url);
        image.url = url;
        image.isReady = true;
        image.width = image.height = image.baseWidth = image.baseHeight = 256;
        texture._texture = image;
        return texture;
    }

    // the image of a ready texture loaded from a url, as replaceImage checks it
    function isLoadedImage(texture: Texture): boolean {
        const image = texture.getInternalTexture();
        return !!image && image.isReady && image.source === InternalTextureSource.Url && !image.isCube && !image.is3D && !image.is2DArray;
    }

    function refusedBothWays(texture: Texture): void {
        // a plain texture with the same orientation, so that only the wrapper differs
        const plain = loaded("plain.png", texture.invertY);
        const images = [texture.getInternalTexture(), plain.getInternalTexture()];
        expect(texture.replaceImage(plain)).toBe(false);
        expect(plain.replaceImage(texture)).toBe(false);
        expect([texture.getInternalTexture(), plain.getInternalTexture()]).toEqual(images);
    }

    it("refuses a video texture showing its poster, as the source and as the texture", () => {
        const video = new VideoTexture("video", document.createElement("video"), scene, false, false, Texture.TRILINEAR_SAMPLINGMODE, {
            autoPlay: false,
            poster: "poster.png",
        });
        // the poster is an image loaded from a url, which playback replaces with the video
        expect(isLoadedImage(video)).toBe(true);
        refusedBothWays(video);
        video.dispose();
    });

    it("refuses a procedural texture showing its fallback texture, as the source and as the texture", () => {
        const fallback = loaded("fallback.png", true);
        // the procedural texture's effect fails to compile: it shows its fallback texture's image
        const createEffect = engine.createEffect.bind(engine);
        vi.spyOn(engine, "createEffect").mockImplementation((...args: any[]) => {
            const onError = args[7] as () => void;
            onError();
            return createEffect(...(args as Parameters<typeof engine.createEffect>));
        });
        const procedural = new ProceduralTexture("procedural", 64, "procedural-test", scene, fallback);
        procedural.isReady();
        expect(procedural.getInternalTexture()).toBe(fallback.getInternalTexture());
        expect(isLoadedImage(procedural)).toBe(true);
        refusedBothWays(procedural);
        procedural.dispose();
    });
});
