import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Vector3 } from "core/Maths/math.vector";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { GLTFFileLoader, type IGLTFLoaderData } from "loaders/glTF/glTFFileLoader.pure";
import { type PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { type Texture } from "core/Materials/Textures/texture";
import "loaders/glTF/2.0/glTFLoader";

/**
 * Builds a minimal glTF with one triangle and one base color texture whose image is
 * embedded in a bufferView.
 *
 * The image must be embedded (bufferView or base64 uri) rather than an external uri:
 * the loader only synthesizes an image url — the thing that collides — when there is no
 * plain uri to use as the id.
 * @param imageFill byte value filling the image, so the two documents differ
 * @param imageByteLength length of the image data, used to tell the two apart
 * @returns the glTF JSON as a string
 */
function buildGltfWithEmbeddedTexture(imageFill: number, imageByteLength: number): string {
    const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const positionBytes = new Uint8Array(positions.buffer);
    const imageBytes = new Uint8Array(imageByteLength).fill(imageFill);

    const buffer = new Uint8Array(positionBytes.length + imageBytes.length);
    buffer.set(positionBytes, 0);
    buffer.set(imageBytes, positionBytes.length);

    let binary = "";
    for (let i = 0; i < buffer.length; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    const base64 = btoa(binary);

    const gltf = {
        asset: { version: "2.0", generator: "test" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
        materials: [
            {
                name: `mat_${imageFill}`,
                pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
            },
        ],
        textures: [{ source: 0 }],
        images: [{ name: `image_${imageFill}`, bufferView: 1, mimeType: "image/png" }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: positionBytes.length },
            { buffer: 0, byteOffset: positionBytes.length, byteLength: imageBytes.length },
        ],
        buffers: [{ byteLength: buffer.length, uri: `data:application/octet-stream;base64,${base64}` }],
    };

    return JSON.stringify(gltf);
}

/**
 * @param material the material to read the base color texture from
 * @returns the base color texture
 */
function getBaseColorTexture(material: PBRMaterial): Texture {
    return material.albedoTexture as Texture;
}

describe("glTF loading from data: urls", () => {
    let engine: NullEngine;
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
        new FreeCamera("camera", new Vector3(0, 0, 0), scene);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    it("does not share embedded textures between two files loaded in the same millisecond", async () => {
        // The collision requires both loads to synthesize the same image url. With no file
        // name the loader falls back to a millisecond timestamp, so pinning Date.now is what
        // makes this deterministic -- otherwise the two loads can straddle a millisecond and
        // the test passes even when the bug is present.
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);

        const containerA = await LoadAssetContainerAsync(`data:${buildGltfWithEmbeddedTexture(0xaa, 64)}`, scene);
        const containerB = await LoadAssetContainerAsync(`data:${buildGltfWithEmbeddedTexture(0xbb, 128)}`, scene);

        const textureA = getBaseColorTexture(containerA.materials[0] as PBRMaterial);
        const textureB = getBaseColorTexture(containerB.materials[0] as PBRMaterial);

        expect(textureA).toBeDefined();
        expect(textureB).toBeDefined();

        // The url is what the texture cache matches on, so equal urls are the defect itself.
        expect(textureA.url).not.toBe(textureB.url);

        // And the consequence: B silently reusing A's uploaded texture. This is the symptom
        // users see -- the second model rendering the first model's images.
        expect(textureB.getInternalTexture()).not.toBe(textureA.getInternalTexture());
    });

    it("keeps each file's own image bytes", async () => {
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);

        const containerA = await LoadAssetContainerAsync(`data:${buildGltfWithEmbeddedTexture(0xaa, 64)}`, scene);
        const containerB = await LoadAssetContainerAsync(`data:${buildGltfWithEmbeddedTexture(0xbb, 128)}`, scene);

        const bufferA = getBaseColorTexture(containerA.materials[0] as PBRMaterial).getInternalTexture()?._buffer as Uint8Array;
        const bufferB = getBaseColorTexture(containerB.materials[0] as PBRMaterial).getInternalTexture()?._buffer as Uint8Array;

        // On a cache hit the supplied buffer is dropped without any warning, so B ends up
        // holding A's bytes. Asserting on the bytes catches that even if the urls were to
        // diverge for some unrelated reason.
        expect(bufferA?.byteLength).toBe(64);
        expect(bufferB?.byteLength).toBe(128);
    });

    it("does not share embedded textures between two file: loads of the same file name", async () => {
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);

        // Drives the plugin directly because this is the drag-and-drop / Inspector shape:
        // a file: root url with a real file name, which SceneLoader only produces from a
        // File object and that needs a FileReader the node test environment lacks.
        //
        // A file: root url always takes the synthesized-url branch whatever the file name,
        // since the same name can be dropped repeatedly with different content -- so two
        // loads in one millisecond collide even though each has a perfectly good name.
        const loadOnce = async (imageFill: number, imageByteLength: number) => {
            const loader = new GLTFFileLoader();
            const json = buildGltfWithEmbeddedTexture(imageFill, imageByteLength);
            const data = (await loader.directLoad(scene, json)) as IGLTFLoaderData;
            return await loader.loadAssetContainerAsync(scene, data, "file:", undefined, "model.gltf");
        };

        const containerA = await loadOnce(0xaa, 64);
        const containerB = await loadOnce(0xbb, 128);

        const textureA = getBaseColorTexture(containerA.materials[0] as PBRMaterial);
        const textureB = getBaseColorTexture(containerB.materials[0] as PBRMaterial);

        expect(textureA.url).not.toBe(textureB.url);
        expect(textureB.getInternalTexture()).not.toBe(textureA.getInternalTexture());
    });
});
