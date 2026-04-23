import { NullEngine } from "core/Engines/nullEngine";
import "core/Loading/Plugins/babylonFileLoader";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
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
});
