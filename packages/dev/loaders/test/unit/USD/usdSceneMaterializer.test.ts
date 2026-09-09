import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { AssetContainer } from "core/assetContainer";
import { Mesh } from "core/Meshes/mesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Animation } from "core/Animations/animation";
import { Command, readCommands } from "loaders/USD/usdCommandProtocol";
import { _RegisterUSDLoaderDependencies } from "loaders/USD/usdFileLoader.pure";
import { materializeCommandBuffers } from "loaders/USD/usdSceneMaterializer";
import { createUSDMeshTestBuffers } from "./usdTestUtils";
import { deferUSDTextureLoads } from "./usdTextureTestUtils";
import { GetEnvironmentBRDFTexture } from "core/Misc/brdfTextureTools";

describe("USD scene materializer protocol", () => {
    let engine: NullEngine;
    let scene: Scene;
    beforeEach(() => {
        _RegisterUSDLoaderDependencies();
        engine = new NullEngine();
        scene = new Scene(engine);
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it.each([true, false])("preserves indexed streams, subsets, skinning and matrix animation (addToScene=%s)", async (addToScene) => {
        const buffers = createUSDMeshTestBuffers();
        const { container } = await materializeCommandBuffers(scene, buffers.commands, buffers.data, addToScene);
        const mesh = container.meshes[0];
        if (!(mesh instanceof Mesh)) {
            throw new Error("Expected source mesh");
        }
        expect(mesh.getTotalVertices()).toBe(4);
        expect(Array.from(mesh.getIndices()!)).toEqual([0, 1, 2, 0, 2, 3]);
        expect(Array.from(mesh.getVerticesData("position")!)).toEqual([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
        expect(mesh.getVerticesData("normal")).toHaveLength(12);
        expect(mesh.getVerticesData("tangent")).toHaveLength(16);
        expect(Array.from(mesh.getVerticesData("uv")!)).toEqual([0, 0, 1, 0, 1, 1, 0, 1]);
        expect(mesh.getVerticesData("color")).toHaveLength(16);
        expect(mesh.numBoneInfluencers).toBe(8);
        expect(Array.from(mesh.getVerticesData("matricesIndices")!).slice(0, 4)).toEqual([0, 1, 0, 1]);
        expect(Array.from(mesh.getVerticesData("matricesIndicesExtra")!).slice(0, 4)).toEqual([1, 0, 1, 0]);
        expect(mesh.getVerticesData("matricesWeights")![0]).toBeCloseTo(0.5);
        expect(mesh.getVerticesData("matricesWeightsExtra")![0]).toBeCloseTo(0.05);
        expect(mesh.material).toBeInstanceOf(MultiMaterial);
        expect(container.multiMaterials[0].subMaterials).toHaveLength(2);
        expect(container.multiMaterials[0].subMaterials[0]).toBe(container.materials[0]);
        expect(container.multiMaterials[0].subMaterials[1]).toBe(container.materials[1]);
        expect(mesh.subMeshes.map((part) => [part.materialIndex, part.indexStart, part.indexCount])).toEqual([
            [0, 0, 3],
            [1, 3, 3],
        ]);
        expect(container.meshes[1]).toBeInstanceOf(InstancedMesh);
        expect(container.meshes[1].geometry).toBe(mesh.geometry);

        const skeleton = container.skeletons[0];
        expect(mesh.skeleton).toBe(skeleton);
        expect(skeleton.bones).toHaveLength(2);
        expect(skeleton.bones[1].getParent()).toBe(skeleton.bones[0]);
        expect(skeleton.bones[1].getRestMatrix().m[13]).toBeCloseTo(1);
        const tracks = container.animationGroups[0].targetedAnimations;
        expect(tracks).toHaveLength(2);
        expect(tracks[0].target).toBe(mesh.parent);
        expect(tracks[1].target).toBe(skeleton.bones[1]);
        expect(tracks[0].animation.dataType).toBe(Animation.ANIMATIONTYPE_MATRIX);
        expect(tracks[0].animation.framePerSecond).toBe(24);
        expect(tracks[0].animation.getKeys().map((key) => key.frame)).toEqual([0, 24]);
        expect(tracks[0].animation.getKeys()[1].value.m[12]).toBe(2);
        expect(tracks[1].animation.getKeys()[1].value.m[13]).toBe(3);

        expect(scene.meshes).toHaveLength(addToScene ? 2 : 0);
        expect(scene.skeletons).toHaveLength(addToScene ? 1 : 0);
        expect(scene.animationGroups).toHaveLength(addToScene ? 1 : 0);
        expect(mesh._parentContainer).toBe(addToScene ? null : container);
        expect(skeleton._parentContainer).toBe(addToScene ? null : container);
        if (!addToScene) {
            if (!(container instanceof AssetContainer)) {
                throw new Error("Expected detached AssetContainer");
            }
            container.addAllToScene();
        }
        expect(scene.meshes).toHaveLength(2);
        container.dispose();
        expect(scene.meshes).toHaveLength(0);
    });

    it("waits for textures and applies PBR slots, alpha and UV transforms", async () => {
        const existingTexture = GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const buffers = createUSDMeshTestBuffers(true);
        const loading = materializeCommandBuffers(scene, buffers.commands, buffers.data, false);
        expect(loads).toHaveLength(3);
        expect(scene.textures).toEqual([existingTexture]);
        loads.forEach((load) => load.succeed());
        const { container } = await loading;
        const material = container.materials[0];
        const masked = container.materials[1];
        if (!(material instanceof PBRMaterial) || !(masked instanceof PBRMaterial)) {
            throw new Error("Expected PBR materials");
        }
        const texture = container.textures[0];
        if (!(texture instanceof Texture)) {
            throw new Error("Expected image texture");
        }
        expect(material.albedoTexture).toBe(texture);
        expect(material.bumpTexture).toBe(container.textures[1]);
        expect(material.metallicTexture).toBe(container.textures[2]);
        expect(material.emissiveTexture).toBe(texture);
        expect(material.useAlphaFromAlbedoTexture).toBe(true);
        expect(masked.opacityTexture).toBe(texture);
        expect(masked.alphaCutOff).toBeCloseTo(0.5);
        expect(masked.backFaceCulling).toBe(false);
        expect(masked.unlit).toBe(true);
        expect(material.metallic).toBeCloseTo(0.4);
        expect(material.roughness).toBeCloseTo(0.6);
        expect(material.bumpTexture!.level).toBeCloseTo(0.7);
        expect(material.useRoughnessFromMetallicTextureGreen).toBe(true);
        expect(material.useMetallnessFromMetallicTextureBlue).toBe(true);
        expect(material.useAmbientOcclusionFromMetallicTextureRed).toBe(true);
        expect(texture.uRotationCenter).toBe(0);
        expect(texture.vRotationCenter).toBe(0);
        expect(texture.wAng).toBeCloseTo(-Math.PI / 4);
        expect(texture.uOffset).toBeCloseTo(0.1 - 3 * Math.sin(Math.PI / 4));
        expect(texture.vOffset).toBeCloseTo(1 - 3 * Math.cos(Math.PI / 4) - 0.2);
        expect(texture.wrapU).toBe(Texture.WRAP_ADDRESSMODE);
        expect(texture.wrapV).toBe(Texture.MIRROR_ADDRESSMODE);
        container.dispose();
    });

    it("rolls back all created assets when image decoding fails", async () => {
        const existingTexture = GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const buffers = createUSDMeshTestBuffers(true);
        const loading = materializeCommandBuffers(scene, buffers.commands, buffers.data, true);
        const rejected = expect(loading).rejects.toThrow("Image decode failed");
        loads[0].fail();
        await rejected;
        loads[1].fail();
        loads[2].succeed();
        expect(scene.meshes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
        expect(scene.skeletons).toHaveLength(0);
        expect(scene.animationGroups).toHaveLength(0);
        expect(scene.textures).toEqual([existingTexture]);
    });

    it.each([
        [Command.Texture, 20, "texture image"],
        [Command.Geometry, 16, "positions"],
        [Command.Skeleton, 16, "skeleton joints"],
        [Command.Animation, 28, "animation value stride"],
    ])("rejects malformed %s data and rolls back", async (opcode, fieldOffset, message) => {
        const buffers = createUSDMeshTestBuffers(opcode === Command.Texture);
        const command = readCommands(buffers.commands).find((record) => record.opcode === opcode)!;
        new DataView(buffers.commands).setUint32(command.payloadOffset + fieldOffset, 0xfffffffc, true);

        await expect(materializeCommandBuffers(scene, buffers.commands, buffers.data, true)).rejects.toThrow(String(message));
        expect(scene.meshes).toHaveLength(0);
        expect(scene.transformNodes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
        expect(scene.skeletons).toHaveLength(0);
        expect(scene.animationGroups).toHaveLength(0);
    });

    it("rejects a bone whose parent has not been created yet", async () => {
        const buffers = createUSDMeshTestBuffers();
        const command = readCommands(buffers.commands).find((record) => record.opcode === Command.Skeleton)!;
        const jointsOffset = new DataView(buffers.commands).getUint32(command.payloadOffset + 16, true);
        new DataView(buffers.data).setUint32(jointsOffset, 1, true);
        await expect(materializeCommandBuffers(scene, buffers.commands, buffers.data, false)).rejects.toThrow("invalid parent joint index");
        expect(scene.skeletons).toHaveLength(0);
        expect(scene._blockEntityCollection).toBe(false);
    });

    it("observes late image errors after synchronous protocol rollback", async () => {
        GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const revokeUrl = vi.spyOn(URL, "revokeObjectURL");
        const buffers = createUSDMeshTestBuffers(true);
        const command = readCommands(buffers.commands).find((record) => record.opcode === Command.Animation)!;
        new DataView(buffers.commands).setUint32(command.payloadOffset + 28, 1, true);
        await expect(materializeCommandBuffers(scene, buffers.commands, buffers.data, true)).rejects.toThrow("animation value stride");
        loads.forEach((load) => load.fail());
        await Promise.resolve();
        expect(new Set(revokeUrl.mock.calls.map(([url]) => url)).size).toBe(3);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
    });
});
