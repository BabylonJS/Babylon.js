import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AssetContainer } from "core/assetContainer";
import { Tools } from "core/Misc/tools";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { StandardMaterial } from "core/Materials/standardMaterial.pure";
import { type Mesh } from "core/Meshes/mesh";
import { Texture } from "core/Materials/Textures/texture";
import { OBJFileLoader } from "loaders/OBJ/objFileLoader.pure";
import { MTLFileLoader } from "loaders/OBJ/mtlFileLoader";

const Triangle = "o triangle\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n";
const TexturedTriangle = "mtllib model.mtl\no triangle\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl Used\nf 1 2 3\n";
const TexturedMaterial = "newmtl Used\nKd 1 1 1\nmap_Kd color.png\n";

interface PendingTexture {
    texture: InternalTexture;
    complete(): void;
    fail(): void;
}

describe("OBJ asset containers and texture loading", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    function mockMTL(data = TexturedMaterial): void {
        vi.spyOn(Tools, "LoadFile").mockImplementation((_url, onSuccess) => {
            queueMicrotask(() => onSuccess(data));
            return { abort: vi.fn() } as unknown as ReturnType<typeof Tools.LoadFile>;
        });
    }

    function holdTextureRequests(): PendingTexture[] {
        const pending: PendingTexture[] = [];
        const createTexture = engine.createTexture.bind(engine);
        vi.spyOn(engine, "createTexture").mockImplementation((url, noMipmap, invertY, hostingScene, samplingMode, onLoad, onError, ...rest) => {
            const texture = createTexture(url, noMipmap, invertY, hostingScene, samplingMode, null, null, ...rest);
            texture.isReady = false;
            pending.push({
                texture,
                complete: () => {
                    texture.isReady = true;
                    onLoad?.(texture);
                    texture.onLoadedObservable.notifyObservers(texture);
                },
                fail: () => {
                    const error = { message: "Texture request failed", exception: new Error("404 Not Found") };
                    onError?.(error.message, error.exception);
                    texture.onErrorObservable.notifyObservers(error);
                },
            });
            return texture;
        });
        return pending;
    }

    it("returns geometries from normal mesh imports", async () => {
        const result = await new OBJFileLoader().importMeshAsync(null, scene, Triangle, "");

        expect(result.geometries).toHaveLength(1);
        expect(result.geometries[0]).toBe((result.meshes[0] as Mesh).geometry);
        expect(scene.getGeometries()).toEqual(result.geometries);
        expect(result.geometries[0]._parentContainer).toBeNull();
    });

    it("keeps all model resources out of the scene until the container is added", async () => {
        mockMTL();
        const container = await new OBJFileLoader().loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        expect(container.meshes).toHaveLength(1);
        expect(container.geometries).toHaveLength(1);
        expect(container.materials).toHaveLength(1);
        expect(container.textures).toHaveLength(1);
        expect(container.meshes[0]._parentContainer).toBe(container);
        expect(container.geometries[0]._parentContainer).toBe(container);
        expect(container.materials[0]._parentContainer).toBe(container);
        expect(container.textures[0]._parentContainer).toBe(container);
        expect(container.textures[0].isReady()).toBe(true);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.getGeometries()).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
        expect(scene.textures).toHaveLength(0);

        container.addAllToScene();
        expect(scene.meshes).toEqual(container.meshes);
        expect(scene.getGeometries()).toEqual(container.geometries);
        expect(scene.materials).toEqual(container.materials);
        expect(scene.textures).toEqual(container.textures);

        container.removeAllFromScene();
        expect(scene.meshes).toHaveLength(0);
        expect(scene.getGeometries()).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
        expect(scene.textures).toHaveLength(0);
        container.dispose();
    });

    it("keeps generated point-cloud materials in the container", async () => {
        const container = await new OBJFileLoader().loadAssetContainerAsync(scene, "v 0 0 0\nv 1 0 0\n", "");

        expect(container.materials).toHaveLength(1);
        expect(container.materials[0].pointsCloud).toBe(true);
        expect(container.materials[0]._parentContainer).toBe(container);
        expect(scene.materials).toHaveLength(0);
        container.dispose();
    });

    it("keeps generated line materials in the container", async () => {
        const container = await new OBJFileLoader().loadAssetContainerAsync(scene, "o line\nv 0 0 0\nv 1 0 0\nl 1 2\n", "");

        expect(container.materials).toHaveLength(1);
        expect(container.materials[0].wireframe).toBe(true);
        expect(container.materials[0]._parentContainer).toBe(container);
        expect(scene.materials).toHaveLength(0);
        container.dispose();
    });

    it("clones line materials while sharing all MTL texture slots with the original", async () => {
        mockMTL(TexturedMaterial + "map_Ka ambient.png\nmap_Ks specular.png\nmap_bump bump.png\nmap_d opacity.png\n");
        const cloneTexture = vi.spyOn(Texture.prototype, "clone");
        const data = TexturedTriangle + "o line\nusemtl Used\nl 1 2\n";
        const container = await new OBJFileLoader().loadAssetContainerAsync(scene, data, "/assets/");

        expect(container.materials).toHaveLength(2);
        expect(container.textures).toHaveLength(5);
        expect(cloneTexture).not.toHaveBeenCalled();
        const original = container.meshes[0].material as StandardMaterial;
        const line = container.meshes[1].material as StandardMaterial;
        expect(line).not.toBe(original);
        expect(original.wireframe).toBe(false);
        expect(line.wireframe).toBe(true);
        expect(line.ambientTexture).toBe(original.ambientTexture);
        expect(line.diffuseTexture).toBe(original.diffuseTexture);
        expect(line.specularTexture).toBe(original.specularTexture);
        expect(line.bumpTexture).toBe(original.bumpTexture);
        expect(line.opacityTexture).toBe(original.opacityTexture);
        expect(line.diffuseColor).toEqual(original.diffuseColor);
        expect(line.diffuseColor).not.toBe(original.diffuseColor);
        for (let i = 0; i < container.materials.length; ++i) {
            expect(container.materials[i]._parentContainer).toBe(container);
        }
        for (let i = 0; i < container.textures.length; ++i) {
            expect(container.textures[i]._parentContainer).toBe(container);
            expect(container.textures[i].isReady()).toBe(true);
        }
        expect(scene.materials).toHaveLength(0);
        expect(scene.textures).toHaveLength(0);
        container.dispose();
    });

    it("restores the original textures and scene collection when material cloning throws", async () => {
        mockMTL(TexturedMaterial + "map_Ka ambient.png\nmap_Ks specular.png\nmap_bump bump.png\nmap_d opacity.png\n");
        let sourceMaterial: StandardMaterial | undefined;
        vi.spyOn(StandardMaterial.prototype, "clone").mockImplementation(function (this: StandardMaterial) {
            sourceMaterial = this;
            expect(this.ambientTexture).toBeNull();
            expect(this.diffuseTexture).toBeNull();
            expect(this.specularTexture).toBeNull();
            expect(this.bumpTexture).toBeNull();
            expect(this.opacityTexture).toBeNull();
            throw new Error("Material clone failed");
        });
        const data = TexturedTriangle + "o line\nusemtl Used\nl 1 2\n";

        await expect(new OBJFileLoader().loadAssetContainerAsync(scene, data, "/assets/")).rejects.toThrow("Material clone failed");
        const material = sourceMaterial!;
        expect(material.ambientTexture).not.toBeNull();
        expect(material.diffuseTexture).not.toBeNull();
        expect(material.specularTexture).not.toBeNull();
        expect(material.bumpTexture).not.toBeNull();
        expect(material.opacityTexture).not.toBeNull();
        expect(scene._blockEntityCollection).toBe(false);
        material.dispose(false, true);
    });

    it("does not create materials or request textures that the OBJ does not use", async () => {
        mockMTL("newmtl Unused\nmap_Kd missing.png\n" + TexturedMaterial + "newmtl AlsoUnused\nmap_Kd missing2.png\n");
        const createTexture = vi.spyOn(engine, "createTexture");
        const container = await new OBJFileLoader().loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        expect(container.materials).toHaveLength(1);
        expect(container.materials[0].name).toBe("Used");
        expect(createTexture).toHaveBeenCalledTimes(1);
        expect(createTexture.mock.calls[0][0]).toBe("/assets/color.png");
        container.dispose();
        expect(scene.textures).toHaveLength(0);
    });

    it.each([undefined, false])("returns before textures finish loading when waitForTextures is %s", async (waitForTextures) => {
        mockMTL();
        const pending = holdTextureRequests();
        const loader = new OBJFileLoader(waitForTextures === undefined ? undefined : { waitForTextures });
        const container = await loader.loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        expect(pending).toHaveLength(1);
        expect(container.textures[0].isReady()).toBe(false);
        pending[0].complete();
        expect(container.textures[0].isReady()).toBe(true);
        container.dispose();
    });

    it.each([undefined, false])("does not start delayed textures when waitForTextures is %s", async (waitForTextures) => {
        scene.useDelayedTextureLoading = true;
        mockMTL();
        const delayLoad = vi.spyOn(Texture.prototype, "delayLoad");
        const createTexture = vi.spyOn(engine, "createTexture");
        const loader = new OBJFileLoader(waitForTextures === undefined ? undefined : { waitForTextures });
        const container = await loader.loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        expect(container.textures).toHaveLength(1);
        expect(container.textures[0].getInternalTexture()).toBeNull();
        expect(delayLoad).not.toHaveBeenCalled();
        expect(createTexture).not.toHaveBeenCalled();
        container.dispose();
    });

    it("waits for every referenced texture without blocking scene registration while awaiting", async () => {
        mockMTL(TexturedMaterial + "map_Ks specular.png\n");
        const pending = holdTextureRequests();
        let settled = false;
        const loading = new OBJFileLoader({ waitForTextures: true }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/").then((container) => {
            settled = true;
            return container;
        });

        await vi.waitFor(() => expect(pending).toHaveLength(2));
        expect(settled).toBe(false);
        expect(scene._blockEntityCollection).toBe(false);
        expect(scene.textures).toHaveLength(0);
        pending[0].complete();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(settled).toBe(false);
        pending[1].complete();

        const container = await loading;
        expect(container.textures[0].isReady()).toBe(true);
        expect(container.textures[1].isReady()).toBe(true);
        container.dispose();
    });

    it("waits for multiple texture wrappers sharing one pending internal texture", async () => {
        mockMTL(TexturedMaterial + "map_Ks color.png\n");
        const pending = holdTextureRequests();
        const loading = new OBJFileLoader({ waitForTextures: true }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        await vi.waitFor(() => expect(pending).toHaveLength(1));
        pending[0].complete();
        const container = await loading;
        expect(container.textures).toHaveLength(2);
        expect(container.textures[0].getInternalTexture()).toBe(container.textures[1].getInternalTexture());
        container.dispose();
    });

    it.each(["complete", "fail"] as const)("waits for remaining textures to %s before rejecting when materialLoadingFailsSilently is false", async (settle) => {
        mockMTL(TexturedMaterial + "map_Ks specular.png\n");
        const pending = holdTextureRequests();
        const loading = new OBJFileLoader({ waitForTextures: true, materialLoadingFailsSilently: false }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");
        const rejection = expect(loading).rejects.toThrow("/assets/color.png: 404 Not Found");
        const onRejected = vi.fn();
        void loading.catch(onRejected);

        await vi.waitFor(() => expect(pending).toHaveLength(2));
        pending[0].fail();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(onRejected).not.toHaveBeenCalled();
        pending[1][settle]();

        await rejection;
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("preserves the default materialLoadingFailsSilently behavior when waiting for textures", async () => {
        mockMTL();
        const pending = holdTextureRequests();
        const loading = new OBJFileLoader({ waitForTextures: true }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        await vi.waitFor(() => expect(pending).toHaveLength(1));
        pending[0].fail();
        const container = await loading;
        expect(container.textures[0].loadingError).toBe(true);
        container.dispose();
    });

    it.each(["complete", "fail"] as const)("waits for remaining textures to %s after a silent texture failure", async (settle) => {
        mockMTL(TexturedMaterial + "map_Ks specular.png\n");
        const pending = holdTextureRequests();
        let settled = false;
        const loading = new OBJFileLoader({ waitForTextures: true }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/").then((container) => {
            settled = true;
            return container;
        });

        await vi.waitFor(() => expect(pending).toHaveLength(2));
        pending[0].fail();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(settled).toBe(false);
        pending[1][settle]();

        const container = await loading;
        expect(container.textures).toHaveLength(2);
        const material = container.meshes[0].material as StandardMaterial;
        expect(material.diffuseTexture!.loadingError).toBe(true);
        expect(material.specularTexture!.isReady()).toBe(settle === "complete");
        expect(material.specularTexture!.loadingError).toBe(settle === "fail");
        container.dispose();
    });

    it("starts delayed textures without requiring the container to render", async () => {
        scene.useDelayedTextureLoading = true;
        mockMTL();
        const container = await new OBJFileLoader({ waitForTextures: true }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        expect(container.textures[0].isReady()).toBe(true);
        expect(scene.useDelayedTextureLoading).toBe(true);
        expect(scene.textures).toHaveLength(0);
        container.dispose();
    });

    it("uses the per-loader texture orientation without changing the static default", async () => {
        mockMTL();
        const defaultInvertY = MTLFileLoader.INVERT_TEXTURE_Y;
        const container = await new OBJFileLoader({ invertTextureY: !defaultInvertY }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/");

        expect((container.textures[0] as Texture).invertY).toBe(!defaultInvertY);
        expect(MTLFileLoader.INVERT_TEXTURE_Y).toBe(defaultInvertY);
        container.dispose();
    });

    it("returns an empty array without texture tracking and assigns texture container ownership synchronously", () => {
        const loader = new MTLFileLoader();
        const container = new AssetContainer(scene);
        expect(loader.parseMTL(scene, TexturedMaterial, "/assets/", container)).toEqual([]);

        expect(loader.materials).toHaveLength(1);
        expect(loader.materials[0].diffuseTexture!._parentContainer).toBe(container);
        expect(scene.materials).toHaveLength(0);
        expect(scene.textures).toHaveLength(0);
        loader.materials[0].dispose(false, true);
        container.dispose();
    });

    it.each([undefined, false])("does not start delayed textures when trackTextureLoading is %s", (trackTextureLoading) => {
        scene.useDelayedTextureLoading = true;
        const loader = new MTLFileLoader();
        const container = new AssetContainer(scene);
        const delayLoad = vi.spyOn(Texture.prototype, "delayLoad");
        const createTexture = vi.spyOn(engine, "createTexture");

        expect(loader.parseMTL(scene, TexturedMaterial, "/assets/", container, undefined, undefined, trackTextureLoading)).toEqual([]);
        expect(loader.materials).toHaveLength(1);
        expect(loader.materials[0].diffuseTexture!._parentContainer).toBe(container);
        expect(delayLoad).not.toHaveBeenCalled();
        expect(createTexture).not.toHaveBeenCalled();
        loader.materials[0].dispose(false, true);
        container.dispose();
    });

    it("returns individual texture promises that the caller can await together", async () => {
        scene.useDelayedTextureLoading = true;
        const loader = new MTLFileLoader();
        const container = new AssetContainer(scene);
        const pending = holdTextureRequests();
        const textureLoadPromises = loader.parseMTL(scene, TexturedMaterial + "map_Ks specular.png\n", "/assets/", container, undefined, undefined, true);
        const loading = Promise.all(textureLoadPromises);

        expect(loader.materials).toHaveLength(1);
        expect(textureLoadPromises).toHaveLength(2);
        expect(pending).toHaveLength(2);
        let settled = false;
        void loading.then(() => {
            settled = true;
        });
        pending[0].complete();
        await Promise.resolve();
        expect(settled).toBe(false);
        pending[1].complete();
        await expect(loading).resolves.toEqual([undefined, undefined]);
        expect(loader.materials[0].diffuseTexture!.isReady()).toBe(true);
        expect(loader.materials[0].specularTexture!.isReady()).toBe(true);
        loader.materials[0].dispose(false, true);
        container.dispose();
    });

    it.each([false, true])("restores scene collection when texture creation throws synchronously with waitForTextures = %s", async (waitForTextures) => {
        mockMTL();
        vi.spyOn(engine, "createTexture").mockImplementation(() => {
            throw new Error("Texture allocation failed");
        });

        await expect(new OBJFileLoader({ waitForTextures, materialLoadingFailsSilently: false }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/")).rejects.toThrow(
            "Texture allocation failed"
        );
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("observes earlier texture rejections after parsing throws before returning its promises", async () => {
        mockMTL(TexturedMaterial + "map_Ks specular.png\n");
        const pending = holdTextureRequests();
        const createTexture = vi.mocked(engine.createTexture);
        createTexture.mockImplementationOnce(createTexture.getMockImplementation()!).mockImplementationOnce(() => {
            throw new Error("Texture allocation failed");
        });

        await expect(
            new OBJFileLoader({ waitForTextures: true, materialLoadingFailsSilently: false }).loadAssetContainerAsync(scene, TexturedTriangle, "/assets/")
        ).rejects.toThrow("Texture allocation failed");
        expect(pending).toHaveLength(1);
        expect(scene._blockEntityCollection).toBe(false);
        pending[0].fail();
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
});
