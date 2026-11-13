import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Repro for the Babylon Native "Invalid argument" crash: on Native, `_postToWorker` enters the
// `Native.sortSplats` path before honoring `disableDepthSort`, and can call it with a null `_splatIndex`.
describe("GaussianSplatting - Native sorting with disableDepthSort", () => {
    let sortSplats: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        sortSplats = vi.fn();
        // `IsNative`/`Native` are module-level consts derived from the global `_native`, so it must
        // exist before the GS module is imported.
        (globalThis as any)._native = { sortSplats };
        vi.resetModules();
    });

    afterEach(() => {
        delete (globalThis as any)._native;
        vi.resetModules();
    });

    const createScene = async () => {
        const { NullEngine } = await import("core/Engines/nullEngine");
        const { Scene } = await import("core/scene");
        const { FreeCamera } = await import("core/Cameras/freeCamera");
        const { Vector3 } = await import("core/Maths/math.vector");
        await import("core/Materials/GaussianSplatting/gaussianSplattingMaterial");
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        scene.activeCamera = camera;
        return { engine, scene };
    };

    const createSplatData = (count: number) => {
        const data = new ArrayBuffer(count * 32);
        const floats = new Float32Array(data);
        const bytes = new Uint8Array(data);
        for (let i = 0; i < count; i++) {
            floats[i * 8 + 0] = i;
            floats[i * 8 + 3] = 0.5;
            floats[i * 8 + 4] = 0.5;
            floats[i * 8 + 5] = 0.5;
            bytes[i * 32 + 24] = 255;
            bytes[i * 32 + 25] = 255;
            bytes[i * 32 + 26] = 255;
            bytes[i * 32 + 27] = 255;
            bytes[i * 32 + 29] = 128;
            bytes[i * 32 + 30] = 128;
            bytes[i * 32 + 31] = 128;
        }
        return data;
    };

    it("does not call the native sort with a null splat index buffer before data is loaded", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.disableDepthSort = true;

        // isReady()/render() reach _postToWorker before any splat data has been committed.
        expect(() => mesh._postToWorker(true)).not.toThrow();

        for (const call of sortSplats.mock.calls) {
            // args: (modelViewProjection, splatPositions, splatIndex, rightHanded)
            expect(call[1], "splatPositions passed to Native.sortSplats must not be null").not.toBeNull();
            expect(call[2], "splatIndex passed to Native.sortSplats must not be null").not.toBeNull();
        }

        scene.dispose();
        engine.dispose();
        // Generous timeout: each test in this suite pays the full core re-import cost because vi.resetModules() runs in beforeEach.
    }, 30000);

    it("does not run the native sort at all when depth sort is disabled", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.disableDepthSort = true;

        mesh.updateData(createSplatData(4));

        sortSplats.mockClear();
        mesh._postToWorker(true);

        expect(sortSplats).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    });

    it("keeps the splat index buffer allocated when depth sort is disabled after loading", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));
        mesh.disableDepthSort = true;

        sortSplats.mockClear();
        expect(() => mesh._postToWorker(true)).not.toThrow();

        expect((mesh as any)._splatIndex).not.toBeNull();
        expect(sortSplats).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    });

    it("settles the depth sort after synchronous native sorting", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));

        sortSplats.mockClear();
        mesh.position.x = 1;
        mesh._postToWorker(true);

        expect(sortSplats).toHaveBeenCalledOnce();
        expect(mesh._isDepthSortSettled).toBe(true);

        scene.dispose();
        engine.dispose();
    });

    it("uploads updated splat data immediately when there is no sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));

        const updateSubTextures = vi.spyOn(mesh as any, "_updateSubTextures");
        mesh.updateData(createSplatData(4));

        expect(updateSubTextures).toHaveBeenCalledOnce();
        expect((mesh as any)._delayedTextureUpdate).toBeNull();

        scene.dispose();
        engine.dispose();
    });

    it("uploads updated splat data that adds spherical harmonics when there is no sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));
        expect((mesh as any)._shTextures).toBeNull();

        const textureSize = (mesh as any)._getTextureSize(4);
        const sh = [new Uint8Array(textureSize.x * textureSize.y * 16)];
        const updateShTextureData = vi.spyOn(mesh as any, "_updateShTextureData");
        expect(() => mesh.updateData(createSplatData(4), sh, { flipY: true }, undefined, 1)).not.toThrow();

        expect((mesh as any)._shTextures).toHaveLength(1);
        expect((mesh as any)._delayedTextureUpdate).toBeNull();
        expect(updateShTextureData).toHaveBeenCalledOnce();

        scene.dispose();
        engine.dispose();
    });

    it("grows existing spherical harmonics textures when an update raises the SH degree without a sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const textureSize = (mesh as any)._getTextureSize(4);
        const shTextureBytes = textureSize.x * textureSize.y * 16;
        mesh.updateData(createSplatData(4), [new Uint8Array(shTextureBytes)], { flipY: true }, undefined, 1);
        const firstShTexture = (mesh as any)._shTextures[0];
        expect((mesh as any)._shTextures).toHaveLength(1);

        const sh = [new Uint8Array(shTextureBytes), new Uint8Array(shTextureBytes)];
        const updateShTextureData = vi.spyOn(mesh as any, "_updateShTextureData");
        expect(() => mesh.updateData(createSplatData(4), sh, { flipY: true }, undefined, 2)).not.toThrow();

        const shTextures = (mesh as any)._shTextures;
        expect(shTextures).toHaveLength(2);
        expect(shTextures[0]).toBe(firstShTexture);
        expect((mesh as any)._delayedTextureUpdate).toBeNull();
        expect(updateShTextureData.mock.calls.map((call) => call[0])).toEqual(shTextures);

        scene.dispose();
        engine.dispose();
    }, 30000);

    it("uploads existing rotation and scale textures once per update when there is no sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.needsRotationScaleTextures = true;
        mesh.updateData(createSplatData(4));
        const rotationTextures = [(mesh as any)._rotationsATexture, (mesh as any)._rotationsBTexture, (mesh as any)._rotationScaleTexture];
        expect(rotationTextures.every((texture) => !!texture)).toBe(true);

        const updateTextureFromData = vi.spyOn(mesh as any, "_updateTextureFromData");
        mesh.updateData(createSplatData(4));

        for (const texture of rotationTextures) {
            expect(updateTextureFromData.mock.calls.filter((call) => call[0] === texture)).toHaveLength(1);
        }

        scene.dispose();
        engine.dispose();
    });

    it("sorts only the active splat ranges with sortSplatIndices and retries a rejected sort", async () => {
        const sortSplatIndices = vi.fn(() => true);
        (globalThis as any)._native.sortSplatIndices = sortSplatIndices;
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(40));
        sortSplatIndices.mockClear();
        sortSplatIndices.mockReturnValueOnce(false);
        mesh.setSplatIndexRanges([
            { offset: 3, count: 2 },
            { offset: 20, count: 18 },
        ]);

        expect(sortSplatIndices).toHaveBeenCalledOnce();
        const [, worldMatrices, positions, splatIndex, vertexCount, intervals, partIndices] = sortSplatIndices.mock.calls[0] as any[];
        expect(worldMatrices).toEqual([mesh.getWorldMatrix()]);
        expect(positions).toBe((mesh as any)._splatPositions);
        expect(splatIndex).toBe((mesh as any)._splatIndex);
        expect(splatIndex.length).toBe(32);
        expect(vertexCount).toBe(40);
        expect(Array.from(intervals)).toEqual([3, 2, 20, 18]);
        expect(partIndices).toBeNull();
        expect(sortSplats).not.toHaveBeenCalled();
        expect(mesh._isDepthSortSettled).toBe(false);

        mesh._postToWorker();
        expect(sortSplatIndices).toHaveBeenCalledTimes(2);
        expect(mesh._isDepthSortSettled).toBe(true);

        scene.dispose();
        engine.dispose();
    }, 30000);

    it("sorts compound parts with their own world matrices with sortSplatIndices", async () => {
        const sortSplatIndices = vi.fn(() => true);
        (globalThis as any)._native.sortSplatIndices = sortSplatIndices;
        const { GaussianSplattingCompoundMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh");
        const { Matrix } = await import("core/Maths/math.vector");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingCompoundMesh("compound", null, scene);
        const parts = Uint8Array.from({ length: 40 }, (_, i) => (i < 20 ? 0 : 1));
        mesh.updateData(createSplatData(40), undefined, undefined, parts);
        mesh.setWorldMatrixForPart(0, Matrix.Translation(-1, 0, 0));
        sortSplatIndices.mockClear();
        mesh.setWorldMatrixForPart(1, Matrix.Translation(0, 0, 3));

        expect(sortSplatIndices).toHaveBeenCalledOnce();
        const [, worldMatrices, , , vertexCount, intervals, partIndices] = sortSplatIndices.mock.calls[0] as any[];
        expect(worldMatrices.map((matrix: any) => Array.from(matrix.m))).toEqual([Array.from(Matrix.Translation(-1, 0, 0).m), Array.from(Matrix.Translation(0, 0, 3).m)]);
        expect(vertexCount).toBe(40);
        expect(intervals).toBeNull();
        expect(Array.from(partIndices.subarray(0, 40))).toEqual(Array.from(parts));
        expect(sortSplats).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    }, 30000);

    it("uploads only the requested rows of a spherical harmonics texture", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { RawTexture } = await import("core/Materials/Textures/rawTexture");
        const { Constants } = await import("core/Engines/constants");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const width = 4;
        const height = 3;
        const bytesPerTexel = 16; // RGBA32UI
        const bytesPerRow = width * bytesPerTexel;
        const texture = new RawTexture(
            null,
            width,
            height,
            Constants.TEXTUREFORMAT_RGBA_INTEGER,
            scene,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_INTEGER
        );
        const uploads: Uint8Array[] = [];
        const updateRawTexture = vi.spyOn(engine, "updateRawTexture").mockImplementation((_texture, data) => {
            uploads.push(new Uint8Array(data!.buffer, data!.byteOffset, data!.byteLength).slice());
        });
        const updateTextureData = vi.fn();
        (engine as any).updateTextureData = updateTextureData;

        // An incremental update only owns the rows from lineStart: the rows above hold neutral placeholder SH.
        const shData = new Uint8Array(bytesPerRow * height).fill(7);
        (mesh as any)._updateShTextureData(texture, shData, width, 1, 2);

        expect(updateRawTexture).toHaveBeenCalledOnce();
        expect(updateTextureData).not.toHaveBeenCalled();
        expect(Array.from(uploads[0].subarray(0, bytesPerRow))).toEqual(Array(bytesPerRow).fill(0));
        expect(Array.from(uploads[0].subarray(bytesPerRow))).toEqual(Array(bytesPerRow * 2).fill(7));

        scene.dispose();
        engine.dispose();
    });

    it("uploads the requested rows of an unaligned spherical harmonics view", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { RawTexture } = await import("core/Materials/Textures/rawTexture");
        const { Constants } = await import("core/Engines/constants");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const width = 4;
        const height = 3;
        const bytesPerTexel = 16; // RGBA32UI
        const bytesPerRow = width * bytesPerTexel;
        const texture = new RawTexture(
            null,
            width,
            height,
            Constants.TEXTUREFORMAT_RGBA_INTEGER,
            scene,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_INTEGER
        );
        const uploads: Uint8Array[] = [];
        vi.spyOn(engine, "updateRawTexture").mockImplementation((_texture, data) => {
            uploads.push(new Uint8Array(data!.buffer, data!.byteOffset, data!.byteLength).slice());
        });
        const updateTextureData = vi.fn();
        (engine as any).updateTextureData = updateTextureData;

        const shData = new Uint8Array(new ArrayBuffer(bytesPerRow * height + 1), 1, bytesPerRow * height);
        shData.forEach((_, index) => (shData[index] = index & 0xff));

        (mesh as any)._updateShTextureData(texture, shData, width, 1, 2);

        expect(updateTextureData).not.toHaveBeenCalled();
        expect(Array.from(uploads[0].subarray(0, bytesPerRow))).toEqual(Array(bytesPerRow).fill(0));
        expect(Array.from(uploads[0].subarray(bytesPerRow))).toEqual(Array.from(shData.subarray(bytesPerRow, bytesPerRow * 3)));

        scene.dispose();
        engine.dispose();
    });

    it("keeps complete uploads ordered between two camera draws", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { RawTexture } = await import("core/Materials/Textures/rawTexture");
        const { Constants } = await import("core/Engines/constants");
        const { FreeCamera } = await import("core/Cameras/freeCamera");
        const { Vector3 } = await import("core/Maths/math.vector");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.setEnabled(false);
        const texture = new RawTexture(null, 1, 1, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        const commands: Array<() => void> = [];
        const readbacks: number[] = [];
        let gpuData = new Uint8Array(4);
        vi.spyOn(engine, "updateRawTexture").mockImplementation((_texture, data) => {
            const snapshot = new Uint8Array(data!.buffer, data!.byteOffset, data!.byteLength).slice();
            commands.push(() => {
                gpuData = snapshot;
            });
        });
        vi.spyOn(engine, "updateTextureData").mockImplementation((_texture, data) => {
            // Models Babylon Native's immediate updateTextureData path: both queued draws would observe the last value.
            gpuData = new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
        });

        const firstCamera = scene.activeCamera!;
        const secondCamera = new FreeCamera("secondCamera", new Vector3(0, 0, -10), scene);
        scene.activeCameras = [firstCamera, secondCamera];
        scene.onBeforeCameraRenderObservable.add((camera) => {
            const value = camera === firstCamera ? 1 : 2;
            (mesh as any)._updateTextureFromData(texture, new Uint8Array([value, 0, 0, 0]), 1, 0, 1);
        });
        scene.onAfterCameraRenderObservable.add(() => {
            commands.push(() => readbacks.push(gpuData[0]));
        });

        scene.render();
        commands.forEach((command) => command());

        expect(readbacks).toEqual([1, 2]);
        expect(engine.updateTextureData).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    });

    it("keeps partial Native uploads in call order by staging complete texture images", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { RawTexture } = await import("core/Materials/Textures/rawTexture");
        const { Constants } = await import("core/Engines/constants");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const texture = new RawTexture(null, 2, 2, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        const uploads: Uint8Array[] = [];
        vi.spyOn(engine, "updateRawTexture").mockImplementation((_texture, data) => {
            uploads.push(new Uint8Array(data!.buffer, data!.byteOffset, data!.byteLength).slice());
        });
        const updateTextureData = vi.spyOn(engine, "updateTextureData");

        (mesh as any)._updateTextureFromData(texture, new Uint8Array([1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0]), 2, 0, 2);
        (mesh as any)._updateTextureFromDataRect(texture, new Uint8Array([9, 0, 0, 0]), 1, 0, 1, 1);

        expect(uploads.map((upload) => [upload[0], upload[4], upload[8], upload[12]])).toEqual([
            [1, 2, 3, 4],
            [1, 9, 3, 4],
        ]);
        expect(updateTextureData).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    });

    it("records complete uploads and ignores partial ones on NullEngine", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { RawTexture } = await import("core/Materials/Textures/rawTexture");
        const { Constants } = await import("core/Engines/constants");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const width = 4;
        const height = 3;
        const texture = new RawTexture(null, width, height, Constants.TEXTUREFORMAT_RGBA, scene, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        const internalTexture = texture.getInternalTexture()!;
        const full = new Uint8Array(width * height * 4);

        // NullEngine has no GL context: neither upload may reach the WebGL implementation.
        expect(() => (mesh as any)._updateTextureFromData(texture, full, width, 0, height)).not.toThrow();
        expect(Array.from(internalTexture._bufferView as Uint8Array)).toEqual(Array.from(full));
        expect(() => (mesh as any)._updateTextureFromData(texture, new Uint8Array(width * 2 * 4), width, 1, 2)).not.toThrow();
        expect((internalTexture._bufferView as Uint8Array).byteLength).toBe(full.byteLength);
        engine.updateTextureData(internalTexture, full, 0, 0, width, height, 0, 0, true);

        scene.dispose();
        engine.dispose();
    });

    it("keeps the existing SH rows when a part is appended without growing the atlas", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { GaussianSplattingCompoundMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh");
        const { engine, scene } = await createScene();
        // Atlas width 16: 20 splats use rows [0, 2), and 4 more still fit in row 1, so the append is incremental.
        (engine.getCaps() as { maxTextureSize: number }).maxTextureSize = 16;

        const createSource = (name: string, count: number) => {
            const source = new GaussianSplattingMesh(name, null, scene);
            source.disableDepthSort = true;
            source.updateData(createSplatData(count), [new Uint8Array(count * 16).fill(7)], undefined, undefined, 1);
            return source;
        };

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene, true);
        compound.disableDepthSort = true;
        compound.addPart(createSource("a", 20), false);
        const shTextures = (compound as any)._shTextures as any[];
        expect(shTextures?.length).toBe(1);
        const shInternalTexture = shTextures[0].getInternalTexture();
        const textureHeight = shInternalTexture.height;

        const updateRawTexture = vi.spyOn(engine, "updateRawTexture").mockImplementation(() => {});
        const updateTextureData = vi.fn();
        (engine as any).updateTextureData = updateTextureData;

        compound.addPart(createSource("b", 4), false);

        expect((compound as any)._shTextures[0]).toBe(shTextures[0]);
        expect(shInternalTexture.height).toBe(textureHeight);
        const shUploads = updateRawTexture.mock.calls.filter((call) => call[0] === shInternalTexture);
        expect(shUploads.length).toBeGreaterThan(0);
        const uploadedBytes = new Uint8Array(shUploads.at(-1)![1]!.buffer, shUploads.at(-1)![1]!.byteOffset, shUploads.at(-1)![1]!.byteLength);
        expect(Array.from(uploadedBytes.subarray(0, 20 * 16))).toEqual(Array(20 * 16).fill(7));
        expect(updateTextureData.mock.calls.filter((call) => call[0] === shInternalTexture)).toHaveLength(0);

        scene.dispose();
        engine.dispose();
    }, 30000);

    it("keeps streaming reservations working on a NullEngine created in a Native runtime", async () => {
        const { GaussianSplattingCompoundMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh");
        const { engine, scene } = await createScene();

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene);
        compound.disableDepthSort = true;
        const handle = compound.reserveStreamingPart(30);

        // NullEngine has no MRT support, so the render-target atlas must not be created even though `_native` exists.
        expect((compound as any)._mrtAtlas).toBeFalsy();
        expect(handle.base).toBe(0);
        expect(compound.partCount).toBe(1);
        expect((compound as any)._vertexCount).toBe(handle.capacity);

        scene.dispose();
        engine.dispose();
    });
});
