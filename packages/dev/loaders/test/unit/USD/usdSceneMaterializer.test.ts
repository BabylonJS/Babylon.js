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
import { createUSDMeshTestBuffers, createUSDProcessedMaterialTestBuffers, createUSDSeparateMaterialTestBuffers, createUSDThinInstanceTestBuffers } from "./usdTestUtils";
import { deferUSDTextureLoads } from "./usdTextureTestUtils";
import { GetEnvironmentBRDFTexture } from "core/Misc/brdfTextureTools";
import { TextureChannel, type ITextureProcessOperand } from "core/Materials/Textures/textureProcessor";

const textureProcessorCalls = vi.hoisted(() => [] as unknown[][]);
const textureProcessorState = vi.hoisted(() => ({
    defer: false,
    pending: [] as Array<() => void>,
    textures: [] as Array<{ dispose: ReturnType<typeof vi.fn> }>,
}));
vi.mock("core/Materials/Textures/textureProcessor", async (importOriginal) => {
    const actual = await importOriginal<typeof import("core/Materials/Textures/textureProcessor")>();
    const { Texture: MockTexture } = await import("core/Materials/Textures/texture.pure");
    return {
        ...actual,
        LerpTexturesAsync: vi.fn(async (...args: unknown[]) => {
            textureProcessorCalls.push(args);
            const targetScene = args[4] as Scene;
            const texture = new MockTexture(null, targetScene);
            textureProcessorState.textures.push(texture as unknown as { dispose: ReturnType<typeof vi.fn> });
            const dispose = vi.spyOn(texture, "dispose");
            textureProcessorState.textures[textureProcessorState.textures.length - 1] = { dispose };
            if (textureProcessorState.defer) {
                await new Promise<void>((resolve) => textureProcessorState.pending.push(resolve));
            }
            return { texture, dispose: () => texture.dispose() };
        }),
    };
});

describe("USD scene materializer protocol", () => {
    let engine: NullEngine;
    let scene: Scene;
    beforeEach(() => {
        textureProcessorCalls.length = 0;
        textureProcessorState.defer = false;
        textureProcessorState.pending.length = 0;
        textureProcessorState.textures.length = 0;
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
        expect(skeleton.bones[1].getBindMatrix().m[13]).toBeCloseTo(2);
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

    it("binds point-instancer matrices as one thin-instance buffer", async () => {
        const buffers = createUSDThinInstanceTestBuffers();
        const { container } = await materializeCommandBuffers(scene, buffers.commands, buffers.data, true);
        const source = container.meshes[0];
        if (!(source instanceof Mesh)) {
            throw new Error("Expected thin-instance source mesh");
        }
        expect(source.thinInstanceCount).toBe(2);
        expect(source.thinInstanceEnablePicking).toBe(true);
        expect(source.thinInstanceGetWorldMatrices().map((matrix) => matrix.m[12])).toEqual([4, 8]);
        expect(container.meshes).toHaveLength(1);
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
        expect(material.useAlphaFromAlbedoTexture).toBe(false);
        expect(material.alpha).toBeCloseTo(0.8);
        expect(masked.albedoTexture).toBe(texture);
        expect(masked.useAlphaFromAlbedoTexture).toBe(true);
        expect(masked.opacityTexture).toBeNull();
        expect(masked.alphaCutOff).toBeCloseTo(0.5);
        expect(masked.backFaceCulling).toBe(false);
        expect(masked.unlit).toBe(true);
        expect(material.metallic).toBe(1);
        expect(material.roughness).toBe(1);
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

    it("preserves separate metallic, roughness, and occlusion textures", async () => {
        GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const buffers = createUSDSeparateMaterialTestBuffers();
        const loading = materializeCommandBuffers(scene, buffers.commands, buffers.data, false);
        expect(loads).toHaveLength(5);
        loads.forEach((load) => load.succeed());
        const { container } = await loading;
        const material = container.materials[0];
        if (!(material instanceof PBRMaterial)) {
            throw new Error("Expected PBR material");
        }
        expect(material.metallicTexture).toBe(container.textures[2]);
        expect(material.microSurfaceTexture).toBe(container.textures[3]);
        expect(material.ambientTexture).toBe(container.textures[4]);
        expect(material.metallicTexture).not.toBe(material.microSurfaceTexture);
        expect(material.microSurfaceTexture).not.toBe(material.ambientTexture);
        expect(material.useRoughnessFromMetallicTextureAlpha).toBe(false);
        expect(material.useRoughnessFromMetallicTextureGreen).toBe(false);
        expect(material.useMetallnessFromMetallicTextureBlue).toBe(false);
        expect(material.useAmbientOcclusionFromMetallicTextureRed).toBe(false);
        expect(material.useAmbientInGrayScale).toBe(true);
        expect(material.metallic).toBeCloseTo(0.75);
        expect(material.roughness).toBeCloseTo(0.5);
        expect(material.metallicTexture!.gammaSpace).toBe(false);
        expect(material.albedoTexture!.gammaSpace).toBe(true);
        container.dispose();
    });

    it("extracts arbitrary scalar channels and bakes scale and bias once", async () => {
        const existingTexture = GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        const buffers = createUSDProcessedMaterialTestBuffers();
        const loading = materializeCommandBuffers(scene, buffers.commands, buffers.data, false);
        loads.forEach((load) => load.succeed());
        const { container } = await loading;
        const material = container.materials[0];
        if (!(material instanceof PBRMaterial)) {
            throw new Error("Expected PBR material");
        }
        expect(container.textures).toHaveLength(8);
        expect(material.metallicTexture).toBe(container.textures[5]);
        expect(material.microSurfaceTexture).toBe(container.textures[6]);
        expect(material.ambientTexture).toBe(container.textures[7]);
        expect(material.metallic).toBe(1);
        expect(material.roughness).toBe(1);
        expect(material.metallicTexture!.gammaSpace).toBe(false);
        expect(material.microSurfaceTexture!.gammaSpace).toBe(false);
        expect(material.ambientTexture!.gammaSpace).toBe(false);
        expect((material.metallicTexture as Texture).uRotationCenter).toBe(0);
        expect((material.metallicTexture as Texture).vRotationCenter).toBe(0);
        expect(textureProcessorCalls).toHaveLength(3);
        expect(scene.textures).toEqual([existingTexture]);
        if (!(container instanceof AssetContainer)) {
            throw new Error("Expected detached AssetContainer");
        }
        container.addAllToScene();
        expect(scene.textures).toHaveLength(9);
        expect(new Set(scene.textures).size).toBe(9);
        const processed = textureProcessorCalls.map((call) => ({
            bias: (call[1] as ITextureProcessOperand).factor!.r,
            end: (call[2] as ITextureProcessOperand).factor!.r,
            channel: (call[3] as ITextureProcessOperand).channel,
        }));
        expect(processed).toEqual([
            { bias: expect.closeTo(0.2), end: expect.closeTo(0.8), channel: TextureChannel.G },
            { bias: expect.closeTo(0.1), end: expect.closeTo(0.6), channel: TextureChannel.B },
            { bias: expect.closeTo(0.1), end: expect.closeTo(0.9), channel: TextureChannel.A },
        ]);
        container.dispose();
    });

    it("cancels texture processing without publishing or resurrecting processed textures", async () => {
        const existingTexture = GetEnvironmentBRDFTexture(scene);
        const loads = deferUSDTextureLoads(engine);
        textureProcessorState.defer = true;
        const controller = new AbortController();
        const buffers = createUSDProcessedMaterialTestBuffers();
        const loading = materializeCommandBuffers(scene, buffers.commands, buffers.data, false, controller.signal);
        loads.forEach((load) => load.succeed());
        await vi.waitFor(() => expect(textureProcessorState.pending).toHaveLength(1));

        controller.abort(new Error("Canceled during texture processing"));
        await expect(loading).rejects.toThrow("Canceled during texture processing");
        expect(scene.textures).toEqual([existingTexture]);

        textureProcessorState.pending.forEach((resolve) => resolve());
        await vi.waitFor(() => expect(textureProcessorState.textures.every(({ dispose }) => dispose.mock.calls.length === 1)).toBe(true));
        expect(scene.textures).toEqual([existingTexture]);
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
        [Command.Texture, 44, "texture value transform"],
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

    it("rejects an invalid thin-instance transform range", async () => {
        const buffers = createUSDThinInstanceTestBuffers();
        const command = readCommands(buffers.commands).find((record) => record.opcode === Command.ThinInstances)!;
        new DataView(buffers.commands).setUint32(command.payloadOffset + 4, 0xfffffffc, true);
        await expect(materializeCommandBuffers(scene, buffers.commands, buffers.data, false)).rejects.toThrow("thin instance transforms");
        expect(scene.meshes).toHaveLength(0);
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
