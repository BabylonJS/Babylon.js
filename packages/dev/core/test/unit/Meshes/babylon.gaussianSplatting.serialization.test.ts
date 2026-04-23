import { NullEngine } from "core/Engines/nullEngine";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
import { LoadAssetContainerFromSerializedScene } from "core/Loading/Plugins/babylonFileLoader";
import { Vector3 } from "core/Maths/math.vector";
import "core/Materials/standardMaterial";
import { GaussianSplattingCompoundMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh";
import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { SceneSerializer } from "core/Misc/sceneSerializer";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const createTestSplatData = (position: [number, number, number], color: [number, number, number, number]): ArrayBuffer => {
    const data = new ArrayBuffer(32);
    const floats = new Float32Array(data);
    const bytes = new Uint8Array(data);

    floats[0] = position[0];
    floats[1] = position[1];
    floats[2] = position[2];
    floats[3] = 0.5;
    floats[4] = 0.5;
    floats[5] = 0.5;

    bytes[24] = color[0];
    bytes[25] = color[1];
    bytes[26] = color[2];
    bytes[27] = color[3];

    // Identity quaternion in the packed splat layout.
    bytes[28] = 0;
    bytes[29] = 128;
    bytes[30] = 128;
    bytes[31] = 128;

    return data;
};

const createTestShData = (seed: number): Uint8Array[] => {
    const texture = new Uint8Array(16);
    for (let i = 0; i < texture.length; i++) {
        texture[i] = (seed + i) & 0xff;
    }

    return [texture];
};

const createMultiTextureShData = (seed: number, textureCount: number): Uint8Array[] => {
    return Array.from({ length: textureCount }, (_, textureIndex) => {
        const texture = new Uint8Array(16);
        for (let i = 0; i < texture.length; i++) {
            texture[i] = (seed + textureIndex * 17 + i) & 0xff;
        }

        return texture;
    });
};

describe("GaussianSplatting serialization", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("creates retained part sources as shared views into merged splat and SH buffers", () => {
        const sourceASplat = createTestSplatData([1, 2, 3], [255, 0, 0, 255]);
        const sourceBSplat = createTestSplatData([4, 5, 6], [0, 255, 0, 255]);
        const sourceASh = createTestShData(11);
        const sourceBSh = createTestShData(37);

        const sourceA = new GaussianSplattingMesh("sourceA", null, scene);
        sourceA.disableDepthSort = true;
        sourceA.updateData(sourceASplat, sourceASh, undefined, undefined, 1);

        const sourceB = new GaussianSplattingMesh("sourceB", null, scene);
        sourceB.disableDepthSort = true;
        sourceB.updateData(sourceBSplat, sourceBSh, undefined, undefined, 1);

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene, true);
        compound.disableDepthSort = true;

        const proxies = compound.addParts([sourceA, sourceB], false);
        const retainedPart = (compound as any)._createRetainedPartSource(proxies[1]);

        expect(retainedPart).toBeTruthy();
        expect(ArrayBuffer.isView(retainedPart._splatsData)).toBe(true);
        expect(retainedPart._splatsData.buffer).toBe((compound as any)._splatsData);
        expect(retainedPart._splatsData.byteOffset).toBe(32);
        expect(retainedPart._splatsData.byteLength).toBe(32);
        expect(Array.from(retainedPart._splatsData as Uint8Array)).toEqual(Array.from(new Uint8Array(sourceBSplat)));

        expect(retainedPart._shData).toBeTruthy();
        expect(retainedPart._shData).toHaveLength(1);
        expect(retainedPart._shData[0].buffer).toBe((compound as any)._shData[0].buffer);
        expect(retainedPart._shData[0].byteOffset).toBe(16);
        expect(retainedPart._shData[0].byteLength).toBe(16);
        expect(Array.from(retainedPart._shData[0])).toEqual(Array.from(sourceBSh[0]));
    });

    it("round-trips compound meshes and keeps part metadata valid after removePart", () => {
        const sourceASplat = createTestSplatData([1, 2, 3], [255, 0, 0, 255]);
        const sourceBSplat = createTestSplatData([4, 5, 6], [0, 255, 0, 255]);
        const sourceASh = createTestShData(11);
        const sourceBSh = createTestShData(37);

        const sourceA = new GaussianSplattingMesh("sourceA", null, scene);
        sourceA.disableDepthSort = true;
        sourceA.updateData(sourceASplat, sourceASh, undefined, undefined, 1);

        const sourceB = new GaussianSplattingMesh("sourceB", null, scene);
        sourceB.disableDepthSort = true;
        sourceB.updateData(sourceBSplat, sourceBSh, undefined, undefined, 1);

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene, true);
        compound.disableDepthSort = true;

        const proxies = compound.addParts([sourceA, sourceB], false);
        proxies[1].position = new Vector3(7, 8, 9);
        proxies[1].visibility = 0.25;
        proxies[1].computeWorldMatrix(true);

        const serialized = compound.serialize();

        expect(serialized._isCompound).toBe(true);
        expect(serialized.partIndices).toBeDefined();
        expect(serialized.partProxies).toHaveLength(2);
        expect(serialized.partProxies[1].splatsDataOffset).toBe(1);
        expect(serialized.partProxies[1].shDataOffset).toBe(1);

        const parsedScene = new Scene(engine);
        const parsed = Mesh.Parse(serialized, parsedScene, "") as GaussianSplattingCompoundMesh;
        const parsedProxies = (parsed as any)._partProxies.filter(Boolean);

        expect(parsed).toBeInstanceOf(GaussianSplattingCompoundMesh);
        expect(parsed.partCount).toBe(2);
        expect(parsedProxies).toHaveLength(2);
        expect(parsedProxies[1].visibility).toBeCloseTo(0.25);
        expect(parsedProxies[1].position.asArray()).toEqual([7, 8, 9]);

        expect(() => parsed.removePart(0)).not.toThrow();
        expect(parsed.partCount).toBe(1);

        const rebuiltProxy = (parsed as any)._partProxies.filter(Boolean)[0];
        const rebuiltRetainedPart = (parsed as any)._createRetainedPartSource(rebuiltProxy);
        expect(ArrayBuffer.isView(rebuiltRetainedPart._splatsData)).toBe(true);
        expect(rebuiltRetainedPart._splatsData.buffer).toBe((parsed as any)._splatsData);
        expect(rebuiltRetainedPart._splatsData.byteOffset).toBe(0);
        expect(rebuiltRetainedPart._shData[0].buffer).toBe((parsed as any)._shData[0].buffer);
        expect(rebuiltRetainedPart._shData[0].byteOffset).toBe(0);

        const rebuiltSplats = parsed.splatsData;
        expect(rebuiltSplats).toBeTruthy();
        expect(Array.from(new Uint8Array(rebuiltSplats!))).toEqual(Array.from(new Uint8Array(sourceBSplat)));

        const rebuiltSh = parsed.shData;
        expect(rebuiltSh).toBeTruthy();
        expect(rebuiltSh).toHaveLength(1);
        expect(Array.from(rebuiltSh![0])).toEqual(Array.from(sourceBSh[0]));

        const reparsedSerialized = parsed.serialize();
        expect(reparsedSerialized.partProxies).toHaveLength(1);
        expect(reparsedSerialized.partProxies[0].partIndex).toBe(0);
        expect(reparsedSerialized.partProxies[0].vertexCount).toBe(1);
        expect(reparsedSerialized.partProxies[0].splatsDataOffset).toBe(0);
        expect(reparsedSerialized.partProxies[0].shDataOffset).toBe(0);

        parsedScene.dispose();
    });

    it("reconnects nodes parented to part proxies through the scene loader", async () => {
        const sourceA = new GaussianSplattingMesh("sourceA", null, scene);
        sourceA.disableDepthSort = true;
        sourceA.updateData(createTestSplatData([1, 2, 3], [255, 0, 0, 255]));

        const sourceB = new GaussianSplattingMesh("sourceB", null, scene);
        sourceB.disableDepthSort = true;
        sourceB.updateData(createTestSplatData([4, 5, 6], [0, 255, 0, 255]));

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene);
        compound.disableDepthSort = true;

        const proxies = compound.addParts([sourceA, sourceB], false);
        const child = new TransformNode("proxyChild", scene);
        child.parent = proxies[1];

        const serializedScene = SceneSerializer.Serialize(scene);

        const loadedScene = new Scene(engine);
        await AppendSceneAsync(`data:${JSON.stringify(serializedScene)}`, loadedScene, { pluginExtension: ".babylon" });

        const loadedChild = loadedScene.getTransformNodeByName("proxyChild");
        expect(loadedChild).toBeTruthy();
        expect(loadedChild!.parent).toBeTruthy();
        expect(loadedChild!.parent!.getClassName()).toBe("GaussianSplattingPartProxyMesh");

        loadedScene.dispose();
    });

    it("rebuilds retained SH data as the exact concatenation of surviving parts after removePart", () => {
        const sourceASplat = createTestSplatData([1, 2, 3], [255, 0, 0, 255]);
        const sourceBSplat = createTestSplatData([4, 5, 6], [0, 255, 0, 255]);
        const sourceCSplat = createTestSplatData([7, 8, 9], [0, 0, 255, 255]);
        const sourceASh = createMultiTextureShData(11, 3);
        const sourceBSh = createMultiTextureShData(67, 3);
        const sourceCSh = createMultiTextureShData(123, 3);

        const sourceA = new GaussianSplattingMesh("sourceA", null, scene);
        sourceA.disableDepthSort = true;
        sourceA.updateData(sourceASplat, sourceASh, undefined, undefined, 3);

        const sourceB = new GaussianSplattingMesh("sourceB", null, scene);
        sourceB.disableDepthSort = true;
        sourceB.updateData(sourceBSplat, sourceBSh, undefined, undefined, 3);

        const sourceC = new GaussianSplattingMesh("sourceC", null, scene);
        sourceC.disableDepthSort = true;
        sourceC.updateData(sourceCSplat, sourceCSh, undefined, undefined, 3);

        const compound = new GaussianSplattingCompoundMesh("compound", null, scene, true);
        compound.disableDepthSort = true;
        compound.addParts([sourceA, sourceB, sourceC], false);

        compound.removePart(1);

        const rebuiltSh = compound.shData;
        expect(rebuiltSh).toBeTruthy();
        expect(rebuiltSh).toHaveLength(3);

        for (let textureIndex = 0; textureIndex < 3; textureIndex++) {
            const expected = new Uint8Array(32);
            expected.set(sourceASh[textureIndex], 0);
            expected.set(sourceCSh[textureIndex], 16);

            expect(Array.from(rebuiltSh![textureIndex])).toEqual(Array.from(expected));
        }

        const rebuiltPartIndices = (compound as any)._partIndices as Uint8Array;
        expect(Array.from(rebuiltPartIndices.subarray(0, 2))).toEqual([0, 1]);
    });

    it("round-trips serialized multi-texture SH compounds through LoadAssetContainerFromSerializedScene", () => {
        const compound = new GaussianSplattingCompoundMesh("renderMesh", null, scene, true);
        compound.disableDepthSort = true;

        const sourceShData: Uint8Array[][] = [];
        const sources: GaussianSplattingMesh[] = [];

        for (let i = 0; i < 5; i++) {
            const source = new GaussianSplattingMesh(`source${i}`, null, scene, true);
            source.disableDepthSort = true;
            const shData = createMultiTextureShData(31 + i * 23, 3);
            sourceShData.push(shData);
            source.updateData(createTestSplatData([i + 1, i + 2, i + 3], [255 - i * 20, 32 + i * 10, 64 + i * 15, 255]), shData, undefined, undefined, 3);
            sources.push(source);
        }

        const proxies = compound.addParts(sources);
        proxies.forEach((part, i) => {
            part.name = `Part ${i}`;
            part.visibility = 0.5 - i * 0.12;
            part.position.set(i * 2 - 3, -2, 0);
            part.computeWorldMatrix(true);
        });

        compound.removePart(1);

        const serializedScene = SceneSerializer.Serialize(scene);

        const loadedScene = new Scene(engine);
        const container = LoadAssetContainerFromSerializedScene(loadedScene, serializedScene, "");

        const loadedCompound = container.meshes.find((mesh) => mesh.getClassName() === "GaussianSplattingMesh" && mesh.name === "renderMesh") as GaussianSplattingMesh | undefined;
        expect(loadedCompound).toBeTruthy();

        const expectedSurvivorIndices = [0, 2, 3, 4];
        const expectedSh = Array.from({ length: 3 }, (_, textureIndex) => {
            const merged = new Uint8Array(expectedSurvivorIndices.length * 16);
            expectedSurvivorIndices.forEach((sourceIndex, survivorIndex) => {
                merged.set(sourceShData[sourceIndex][textureIndex], survivorIndex * 16);
            });
            return merged;
        });
        const loadedSh = (loadedCompound as any)._shData as Uint8Array[];
        expect(loadedSh).toBeTruthy();
        expect(loadedSh).toHaveLength(3);
        for (let textureIndex = 0; textureIndex < 3; textureIndex++) {
            expect(Array.from(loadedSh[textureIndex])).toEqual(Array.from(expectedSh[textureIndex]));
        }

        loadedScene.dispose();
    });
});
