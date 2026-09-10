/* eslint-disable @typescript-eslint/naming-convention */

import { Animation } from "core/Animations/animation.pure";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { AbstractAssetContainer, AssetContainer } from "core/assetContainer";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { Color3, Color4 } from "core/Maths/math.color.pure";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { Material } from "core/Materials/material.pure";
import { MultiMaterial } from "core/Materials/multiMaterial.pure";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { Texture } from "core/Materials/Textures/texture.pure";
import {
    CreateFactorOperand,
    CreateTextureOperand,
    LerpTexturesAsync,
    TextureChannel,
    TextureColorSpace,
    type ITextureProcessOperand,
} from "core/Materials/Textures/textureProcessor";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";
import { CreateBox } from "core/Meshes/Builders/boxBuilder.pure";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder.pure";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder.pure";
import { Mesh } from "core/Meshes/mesh.pure";
import { SubMesh } from "core/Meshes/subMesh";
import { TransformNode } from "core/Meshes/transformNode.pure";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { type Scene } from "core/scene.pure";
import { type IAssetContainer } from "core/IAssetContainer";

import {
    AnalyticPrimitiveType,
    AnimationProperty,
    AnimationTarget,
    Command,
    GeometryFlags,
    MaterialFlags,
    MeshFlags,
    MISSING_OFFSET,
    PayloadReader,
    PrimitiveAxis,
    TextureOutputChannel,
    USDTextureColorSpace,
    readCommands,
} from "./usdCommandProtocol";

interface GeometryDescriptor {
    vertexCount: number;
    indexCount: number;
    flags: number;
    positions: number;
    normals: number;
    tangents: number;
    uv0: number;
    colors: number;
    joints0: number;
    weights0: number;
    joints1: number;
    weights1: number;
    indices: number;
    influences: number;
}

interface TextureDescriptor {
    id: number;
    texture: Texture;
    sourceColorSpace: USDTextureColorSpace;
    scale: Float32Array;
    bias: Float32Array;
}

interface TextureBinding {
    descriptor: TextureDescriptor;
    channel: TextureOutputChannel;
}

interface MaterialTextureBindings {
    id: number;
    material: PBRMaterial;
    normalScale: number;
    base?: TextureBinding;
    opacity?: TextureBinding;
    normal?: TextureBinding;
    metallic?: TextureBinding;
    roughness?: TextureBinding;
    occlusion?: TextureBinding;
    emissive?: TextureBinding;
}

class DirectAssetContainer extends AbstractAssetContainer {
    public dispose(): void {
        for (const animationGroup of this.animationGroups.splice(0)) {
            animationGroup.dispose();
        }
        for (const mesh of this.meshes.splice(0)) {
            mesh.dispose();
        }
        for (const manager of this.morphTargetManagers.splice(0)) {
            manager.dispose();
        }
        for (const skeleton of this.skeletons.splice(0)) {
            skeleton.dispose();
        }
        for (const multiMaterial of this.multiMaterials.splice(0)) {
            multiMaterial.dispose();
        }
        for (const material of this.materials.splice(0)) {
            material.dispose();
        }
        for (const geometry of this.geometries.splice(0)) {
            geometry.dispose();
        }
        for (const transformNode of this.transformNodes.splice(0)) {
            transformNode.dispose();
        }
        for (const texture of this.textures.splice(0)) {
            texture.dispose();
        }
        this.rootNodes.length = 0;
    }
}

export interface MaterializationResult {
    container: AbstractAssetContainer & { dispose(): void };
    materializeMs: number;
}

const decoder = new TextDecoder();
const NODE_MATRIX_PROPERTY = "__babylonUsdLocalMatrix";

function assertRange(data: ArrayBuffer, offset: number, count: number, bytesPerElement: number, label: string): void {
    if (
        !Number.isInteger(offset) ||
        !Number.isInteger(count) ||
        offset < 0 ||
        count < 0 ||
        offset % Math.min(bytesPerElement, 4) !== 0 ||
        count > Math.floor((data.byteLength - offset) / bytesPerElement)
    ) {
        throw new Error(`Invalid ${label} range in OpenUSD Babylon data buffer.`);
    }
}

function stringAt(data: ArrayBuffer, offset: number, length: number): string {
    assertRange(data, offset, length, 1, "string");
    return decoder.decode(new Uint8Array(data, offset, length));
}

function matrixAt(data: ArrayBuffer, offset: number): Matrix {
    assertRange(data, offset, 16, 4, "matrix");
    const values = new Float32Array(data, offset, 16);
    return Matrix.FromValues(
        values[0],
        values[1],
        values[2],
        values[3],
        values[4],
        values[5],
        values[6],
        values[7],
        values[8],
        values[9],
        values[10],
        values[11],
        values[12],
        values[13],
        values[14],
        values[15]
    );
}

function mimeType(value: number): string {
    switch (value) {
        case 2:
            return "image/jpeg";
        case 3:
            return "image/bmp";
        case 4:
            return "image/webp";
        default:
            return "image/png";
    }
}

function wrapMode(value: number): number {
    switch (value) {
        case 0:
            return Texture.CLAMP_ADDRESSMODE;
        case 1:
            return Texture.WRAP_ADDRESSMODE;
        case 2:
            return Texture.MIRROR_ADDRESSMODE;
        default:
            throw new Error(`Invalid texture wrap mode ${value}.`);
    }
}

async function awaitAbortableAsync<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) {
        return await promise;
    }
    let onAbort: (() => void) | undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
        onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error("USD materialization was aborted."));
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted) {
            onAbort();
        }
    });
    try {
        return await Promise.race([promise, aborted]);
    } finally {
        if (onAbort) {
            signal.removeEventListener("abort", onAbort);
        }
    }
}

export async function materializeCommandBuffers(
    scene: Scene,
    commandBuffer: ArrayBuffer,
    dataBuffer: ArrayBuffer,
    addToScene: boolean,
    signal?: AbortSignal
): Promise<MaterializationResult> {
    signal?.throwIfAborted();
    const started = performance.now();
    const commands = readCommands(commandBuffer);
    const container = addToScene ? new DirectAssetContainer() : new AssetContainer(scene);
    const nodes = new Map<number, TransformNode>();
    const pendingParents: Array<{ node: TransformNode; parentId: number }> = [];
    const textures = new Map<number, TextureDescriptor>();
    const materials = new Map<number, PBRMaterial>();
    const doubleSidedMaterials = new Map<number, PBRMaterial>();
    const skeletons = new Map<number, Skeleton>();
    const bones = new Map<number, Bone>();
    const geometries = new Map<number, GeometryDescriptor>();
    const meshes = new Map<number, Mesh>();
    const morphTargetManagers = new Map<number, MorphTargetManager>();
    const morphTargets = new Map<number, MorphTarget>();
    const classicInstanceSources = new Set<number>();
    const thinInstanceSources = new Set<number>();
    const animationGroups = new Map<number, AnimationGroup>();
    const textureLoads: Promise<void>[] = [];
    const textureUrls = new Set<string>();
    const materialTextureBindings: MaterialTextureBindings[] = [];
    const processedTextures = new Map<string, Promise<BaseTexture>>();
    const assetContainer = container instanceof AssetContainer ? container : undefined;
    let root: TransformNode | undefined;
    let timeCodesPerSecond = 24;
    let rollingBack = false;

    const trackAsset = <T extends { _parentContainer: IAssetContainer | null }>(assets: T[], asset: T): void => {
        assets.push(asset);
        if (assetContainer) {
            asset._parentContainer = assetContainer;
        }
    };
    const applyMeshOrientation = (mesh: Mesh, flags: number): void => {
        const sourceIsRightHanded = !(flags & MeshFlags.LeftHanded);
        mesh.sideOrientation = scene.useRightHandedSystem === sourceIsRightHanded ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
    };
    const materialForMesh = (id: number, doubleSided: boolean): PBRMaterial | null => {
        const material = materials.get(id);
        if (!material || !doubleSided || !material.backFaceCulling) {
            return material ?? null;
        }
        let variant = doubleSidedMaterials.get(id);
        if (!variant) {
            variant = material.clone(`${material.name} (double-sided)`);
            trackAsset(container.materials, variant);
            variant.backFaceCulling = false;
            variant.twoSidedLighting = true;
            doubleSidedMaterials.set(id, variant);
        }
        return variant;
    };
    const binding = (textureId: number, channel: number, label: string): TextureBinding | undefined => {
        if (textureId === MISSING_OFFSET) {
            if (channel !== MISSING_OFFSET) {
                throw new Error(`USD ${label} binding has a channel without a texture.`);
            }
            return undefined;
        }
        const descriptor = textures.get(textureId);
        if (!descriptor) {
            throw new Error(`USD ${label} binding references missing texture ${textureId}.`);
        }
        if (channel < TextureOutputChannel.R || channel > TextureOutputChannel.RGB) {
            throw new Error(`USD ${label} binding has invalid output channel ${channel}.`);
        }
        return { descriptor, channel };
    };
    const channelIndex = (channel: TextureOutputChannel): number => {
        if (channel === TextureOutputChannel.RGB) {
            throw new Error("A scalar USD texture binding cannot use the RGB output.");
        }
        return channel;
    };
    const processorChannel = (channel: TextureOutputChannel): TextureChannel => {
        switch (channel) {
            case TextureOutputChannel.R:
                return TextureChannel.R;
            case TextureOutputChannel.G:
                return TextureChannel.G;
            case TextureOutputChannel.B:
                return TextureChannel.B;
            case TextureOutputChannel.A:
                return TextureChannel.A;
            default:
                return TextureChannel.RGBA;
        }
    };
    const processorColorSpace = (descriptor: TextureDescriptor): TextureColorSpace =>
        descriptor.sourceColorSpace === USDTextureColorSpace.Raw ? TextureColorSpace.Linear : TextureColorSpace.SRGB;
    const scalarTextureIsLinear = (binding: TextureBinding): boolean => binding.descriptor.sourceColorSpace === USDTextureColorSpace.Raw;
    const valueTransformIs = (descriptor: TextureDescriptor, scale: readonly number[] | Float32Array, bias: readonly number[] | Float32Array): boolean =>
        scale.every((value, index) => descriptor.scale[index] === value) && bias.every((value, index) => descriptor.bias[index] === value);
    const trackProcessedTexture = (texture: BaseTexture): BaseTexture => {
        trackAsset(container.textures, texture);
        return texture;
    };
    const processTextureAsync = async (
        name: string,
        binding: TextureBinding,
        scale: readonly number[] | Float32Array,
        bias: readonly number[] | Float32Array,
        channel = binding.channel
    ): Promise<BaseTexture> => {
        const source = binding.descriptor;
        const key = `${source.id}:${channel}:${scale.join(",")}:${bias.join(",")}`;
        const cached = processedTextures.get(key);
        if (cached) {
            return await cached;
        }
        const processing = (async () => {
            const a = new Color4(bias[0], bias[1], bias[2], bias[3]);
            const b = new Color4(bias[0] + scale[0], bias[1] + scale[1], bias[2] + scale[2], bias[3] + scale[3]);
            const previousBlockEntityCollection = scene._blockEntityCollection;
            scene._blockEntityCollection = true;
            let processingPromise: Promise<ITextureProcessOperand>;
            try {
                processingPromise = LerpTexturesAsync(
                    name,
                    CreateFactorOperand(a),
                    CreateFactorOperand(b),
                    CreateTextureOperand(source.texture, processorChannel(channel), processorColorSpace(source)),
                    scene,
                    TextureColorSpace.Linear
                );
            } finally {
                scene._blockEntityCollection = previousBlockEntityCollection;
            }
            const processed = await processingPromise;
            if (!processed.texture) {
                throw new Error(`USD texture processing for '${name}' did not produce a texture.`);
            }
            if (rollingBack || signal?.aborted) {
                processed.dispose?.();
                if (signal?.aborted) {
                    signal.throwIfAborted();
                }
                throw new Error("USD materialization was rolled back.");
            }
            if (!assetContainer) {
                scene.addTexture(processed.texture);
            }
            const texture = trackProcessedTexture(processed.texture);
            texture.gammaSpace = false;
            const transformedTexture = texture as Texture;
            transformedTexture.uRotationCenter = source.texture.uRotationCenter;
            transformedTexture.vRotationCenter = source.texture.vRotationCenter;
            transformedTexture.wRotationCenter = source.texture.wRotationCenter;
            transformedTexture.homogeneousRotationInUVTransform = source.texture.homogeneousRotationInUVTransform;
            return texture;
        })();
        processedTextures.set(key, processing);
        try {
            return await processing;
        } catch (error) {
            processedTextures.delete(key);
            throw error;
        }
    };
    const processScalarTextureAsync = async (name: string, binding: TextureBinding): Promise<BaseTexture> => {
        const index = channelIndex(binding.channel);
        const scale = binding.descriptor.scale[index];
        const bias = binding.descriptor.bias[index];
        return await processTextureAsync(name, binding, [scale, scale, scale, 1], [bias, bias, bias, 0], binding.channel);
    };
    const applyMaterialTextureBindingsAsync = async (bindings: MaterialTextureBindings): Promise<void> => {
        const { material, normalScale, base, opacity, normal, metallic, roughness, occlusion, emissive } = bindings;
        if (base) {
            if (base.channel !== TextureOutputChannel.RGB) {
                throw new Error("A USD base-color texture must use the RGB output.");
            }
            material.albedoColor = Color3.White();
            material.albedoTexture = valueTransformIs(base.descriptor, [1, 1, 1, 1], [0, 0, 0, 0])
                ? base.descriptor.texture
                : await processTextureAsync(`${material.name} base color`, base, base.descriptor.scale, base.descriptor.bias);
        }
        if (emissive) {
            if (emissive.channel !== TextureOutputChannel.RGB) {
                throw new Error("A USD emissive texture must use the RGB output.");
            }
            material.emissiveColor = Color3.White();
            material.emissiveTexture = valueTransformIs(emissive.descriptor, [1, 1, 1, 1], [0, 0, 0, 0])
                ? emissive.descriptor.texture
                : await processTextureAsync(`${material.name} emissive`, emissive, emissive.descriptor.scale, emissive.descriptor.bias);
        }
        if (normal) {
            if (normal.channel !== TextureOutputChannel.RGB) {
                throw new Error("A USD normal texture must use the RGB output.");
            }
            const canonicalNormal = normal.descriptor.sourceColorSpace === USDTextureColorSpace.Raw && valueTransformIs(normal.descriptor, [2, 2, 2, 1], [-1, -1, -1, 0]);
            if (canonicalNormal) {
                material.bumpTexture = normal.descriptor.texture;
            } else {
                const scale = Array.from(normal.descriptor.scale, (value) => value * 0.5);
                const bias = Array.from(normal.descriptor.bias, (value, index) => (index < 3 ? (value + 1) * 0.5 : value));
                material.bumpTexture = await processTextureAsync(`${material.name} normal`, normal, scale, bias);
            }
            material.bumpTexture.gammaSpace = false;
            material.bumpTexture.level = normalScale;
        }

        const packedMetallicRoughness =
            metallic &&
            roughness &&
            metallic.descriptor === roughness.descriptor &&
            (metallic.channel === TextureOutputChannel.R || metallic.channel === TextureOutputChannel.B) &&
            (roughness.channel === TextureOutputChannel.G || roughness.channel === TextureOutputChannel.A) &&
            scalarTextureIsLinear(metallic) &&
            metallic.descriptor.bias[channelIndex(metallic.channel)] === 0 &&
            roughness.descriptor.bias[channelIndex(roughness.channel)] === 0;
        let packedOcclusion = false;
        if (packedMetallicRoughness) {
            const descriptor = metallic.descriptor;
            material.metallicTexture = descriptor.texture;
            material.metallic = (material.metallic ?? 1) * descriptor.scale[channelIndex(metallic.channel)];
            material.roughness = (material.roughness ?? 1) * descriptor.scale[channelIndex(roughness.channel)];
            material.useRoughnessFromMetallicTextureAlpha = roughness.channel === TextureOutputChannel.A;
            material.useRoughnessFromMetallicTextureGreen = roughness.channel === TextureOutputChannel.G;
            material.useMetallnessFromMetallicTextureBlue = metallic.channel === TextureOutputChannel.B;
            packedOcclusion =
                occlusion?.descriptor === descriptor &&
                occlusion.channel === TextureOutputChannel.R &&
                descriptor.scale[TextureOutputChannel.R] === 1 &&
                descriptor.bias[TextureOutputChannel.R] === 0;
            material.useAmbientOcclusionFromMetallicTextureRed = packedOcclusion;
        } else {
            if (metallic) {
                const index = channelIndex(metallic.channel);
                const direct =
                    scalarTextureIsLinear(metallic) &&
                    (metallic.channel === TextureOutputChannel.R || metallic.channel === TextureOutputChannel.B) &&
                    metallic.descriptor.bias[index] === 0;
                material.metallicTexture = direct ? metallic.descriptor.texture : await processScalarTextureAsync(`${material.name} metallic`, metallic);
                material.useRoughnessFromMetallicTextureAlpha = false;
                material.useRoughnessFromMetallicTextureGreen = false;
                material.useMetallnessFromMetallicTextureBlue = direct && metallic.channel === TextureOutputChannel.B;
                material.metallic = direct ? (material.metallic ?? 1) * metallic.descriptor.scale[index] : 1;
            }
            if (roughness) {
                const index = channelIndex(roughness.channel);
                const direct = scalarTextureIsLinear(roughness) && roughness.channel === TextureOutputChannel.R && roughness.descriptor.bias[index] === 0;
                material.microSurfaceTexture = direct ? roughness.descriptor.texture : await processScalarTextureAsync(`${material.name} roughness`, roughness);
                material.microSurfaceTexture.gammaSpace = direct ? roughness.descriptor.texture.gammaSpace : false;
                material.roughness = direct ? (material.roughness ?? 1) * roughness.descriptor.scale[index] : 1;
            }
        }
        if (occlusion && !packedOcclusion) {
            const index = channelIndex(occlusion.channel);
            const direct =
                scalarTextureIsLinear(occlusion) &&
                occlusion.channel === TextureOutputChannel.R &&
                occlusion.descriptor.scale[index] === 1 &&
                occlusion.descriptor.bias[index] === 0;
            material.ambientTexture = direct ? occlusion.descriptor.texture : await processScalarTextureAsync(`${material.name} occlusion`, occlusion);
            material.useAmbientInGrayScale = true;
        }
        if (opacity) {
            material.alpha = 1;
            if (
                base &&
                material.albedoTexture &&
                opacity.descriptor === base.descriptor &&
                opacity.channel === TextureOutputChannel.A &&
                opacity.descriptor.scale[TextureOutputChannel.A] === 1 &&
                opacity.descriptor.bias[TextureOutputChannel.A] === 0
            ) {
                material.albedoTexture.hasAlpha = true;
                material.useAlphaFromAlbedoTexture = true;
            } else {
                const direct =
                    opacity.channel === TextureOutputChannel.A && opacity.descriptor.scale[TextureOutputChannel.A] === 1 && opacity.descriptor.bias[TextureOutputChannel.A] === 0;
                material.opacityTexture = direct ? opacity.descriptor.texture : await processScalarTextureAsync(`${material.name} opacity`, opacity);
                material.opacityTexture.gammaSpace = direct ? opacity.descriptor.texture.gammaSpace : false;
                material.opacityTexture.getAlphaFromRGB = !direct;
            }
        }
        const doubleSidedVariant = doubleSidedMaterials.get(bindings.id);
        if (doubleSidedVariant) {
            doubleSidedVariant.albedoColor.copyFrom(material.albedoColor);
            doubleSidedVariant.albedoTexture = material.albedoTexture;
            doubleSidedVariant.emissiveColor.copyFrom(material.emissiveColor);
            doubleSidedVariant.emissiveTexture = material.emissiveTexture;
            doubleSidedVariant.bumpTexture = material.bumpTexture;
            doubleSidedVariant.metallic = material.metallic;
            doubleSidedVariant.roughness = material.roughness;
            doubleSidedVariant.metallicTexture = material.metallicTexture;
            doubleSidedVariant.microSurfaceTexture = material.microSurfaceTexture;
            doubleSidedVariant.ambientTexture = material.ambientTexture;
            doubleSidedVariant.opacityTexture = material.opacityTexture;
            doubleSidedVariant.alpha = material.alpha;
            doubleSidedVariant.useAlphaFromAlbedoTexture = material.useAlphaFromAlbedoTexture;
            doubleSidedVariant.useRoughnessFromMetallicTextureAlpha = material.useRoughnessFromMetallicTextureAlpha;
            doubleSidedVariant.useRoughnessFromMetallicTextureGreen = material.useRoughnessFromMetallicTextureGreen;
            doubleSidedVariant.useMetallnessFromMetallicTextureBlue = material.useMetallnessFromMetallicTextureBlue;
            doubleSidedVariant.useAmbientOcclusionFromMetallicTextureRed = material.useAmbientOcclusionFromMetallicTextureRed;
            doubleSidedVariant.useAmbientInGrayScale = material.useAmbientInGrayScale;
        }
    };

    try {
        const previousBlockEntityCollection = scene._blockEntityCollection;
        if (!addToScene) {
            scene._blockEntityCollection = true;
        }
        try {
            for (const command of commands) {
                const payload = new PayloadReader(commandBuffer, command.payloadOffset, command.payloadLength);
                switch (command.opcode) {
                    case Command.Scene: {
                        const zUp = payload.u32() === 1;
                        const metersPerUnit = payload.f32();
                        timeCodesPerSecond = payload.f32() || 24;
                        root = new TransformNode("USD Root", scene);
                        trackAsset(container.transformNodes, root);
                        container.rootNodes.push(root);
                        root.rotationQuaternion = zUp ? Quaternion.FromArray([-0.7071068, 0, 0, 0.7071068]) : Quaternion.Identity();
                        root.scaling.copyFrom(
                            scene.useRightHandedSystem
                                ? new Vector3(metersPerUnit, metersPerUnit, metersPerUnit)
                                : zUp
                                  ? new Vector3(metersPerUnit, -metersPerUnit, metersPerUnit)
                                  : new Vector3(metersPerUnit, metersPerUnit, -metersPerUnit)
                        );
                        break;
                    }
                    case Command.Texture: {
                        const id = payload.u32();
                        if (textures.has(id)) {
                            throw new Error(`Duplicate USD texture ${id}.`);
                        }
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const mime = mimeType(payload.u32());
                        const imageOffset = payload.u32();
                        const imageLength = payload.u32();
                        const coordinatesIndex = payload.u32();
                        const transformOffset = payload.u32();
                        const wrapU = payload.u32();
                        const wrapV = payload.u32();
                        const sourceColorSpace = payload.u32();
                        const valueTransformOffset = payload.u32();
                        assertRange(dataBuffer, transformOffset, 5, 4, "texture transform");
                        assertRange(dataBuffer, valueTransformOffset, 8, 4, "texture value transform");
                        assertRange(dataBuffer, imageOffset, imageLength, 1, "texture image");
                        if (sourceColorSpace < USDTextureColorSpace.Auto || sourceColorSpace > USDTextureColorSpace.SRGB) {
                            throw new Error(`Invalid USD texture color space ${sourceColorSpace}.`);
                        }
                        const transform = new Float32Array(dataBuffer, transformOffset, 5);
                        const valueTransform = new Float32Array(dataBuffer, valueTransformOffset, 8);
                        if (![...transform, ...valueTransform].every(Number.isFinite)) {
                            throw new Error(`USD texture ${id} has a non-finite transform.`);
                        }
                        const bytes = new Uint8Array(dataBuffer, imageOffset, imageLength);
                        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
                        textureUrls.add(url);
                        let resolveLoad!: () => void;
                        let rejectLoad!: (error: Error) => void;
                        const loaded = new Promise<void>((resolve, reject) => {
                            resolveLoad = resolve;
                            rejectLoad = reject;
                        });
                        textureLoads.push(loaded);
                        const texture = new Texture(url, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE, resolveLoad, (message, exception) => {
                            URL.revokeObjectURL(url);
                            rejectLoad(exception instanceof Error ? exception : new Error(message || `Could not load texture '${url}'.`));
                        });
                        trackAsset(container.textures, texture);
                        texture.onDisposeObservable.addOnce(() => URL.revokeObjectURL(url));
                        texture.name = stringAt(dataBuffer, nameOffset, nameLength);
                        texture.coordinatesIndex = coordinatesIndex;
                        texture.uScale = transform[0];
                        texture.vScale = transform[1];
                        texture.uRotationCenter = 0;
                        texture.vRotationCenter = 0;
                        texture.uOffset = transform[2] - transform[1] * Math.sin(transform[4]);
                        texture.vOffset = 1 - transform[1] * Math.cos(transform[4]) - transform[3];
                        texture.wAng = -transform[4];
                        texture.wrapU = wrapMode(wrapU);
                        texture.wrapV = wrapMode(wrapV);
                        texture.gammaSpace = sourceColorSpace !== USDTextureColorSpace.Raw;
                        textures.set(id, {
                            id,
                            texture,
                            sourceColorSpace,
                            scale: valueTransform.subarray(0, 4),
                            bias: valueTransform.subarray(4, 8),
                        });
                        break;
                    }
                    case Command.Material: {
                        const id = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const baseOffset = payload.u32();
                        const emissiveOffset = payload.u32();
                        const metallic = payload.f32();
                        const roughness = payload.f32();
                        const normalScale = payload.f32();
                        const alphaCutoff = payload.f32();
                        const flags = payload.u32();
                        const textureIds = Array.from({ length: 7 }, () => payload.u32());
                        const textureChannels = Array.from({ length: 7 }, () => payload.u32());
                        assertRange(dataBuffer, baseOffset, 4, 4, "material base color");
                        assertRange(dataBuffer, emissiveOffset, 3, 4, "material emissive color");
                        const base = new Float32Array(dataBuffer, baseOffset, 4);
                        const emissive = new Float32Array(dataBuffer, emissiveOffset, 3);
                        const material = new PBRMaterial(stringAt(dataBuffer, nameOffset, nameLength), scene);
                        trackAsset(container.materials, material);
                        material.id = `usd-material-${id}`;
                        material.albedoColor = new Color3(base[0], base[1], base[2]);
                        material.alpha = base[3];
                        material.metallic = metallic;
                        material.roughness = roughness;
                        material.emissiveColor = new Color3(emissive[0], emissive[1], emissive[2]);
                        const doubleSided = Boolean(flags & MaterialFlags.DoubleSided);
                        material.backFaceCulling = !doubleSided;
                        material.twoSidedLighting = doubleSided;
                        material.unlit = Boolean(flags & MaterialFlags.Unlit);
                        if (flags & MaterialFlags.AlphaBlend) {
                            material.transparencyMode = 2;
                        }
                        if (alphaCutoff > 0) {
                            material.transparencyMode = 1;
                            material.alphaCutOff = alphaCutoff;
                        }
                        materialTextureBindings.push({
                            id,
                            material,
                            normalScale,
                            base: binding(textureIds[0], textureChannels[0], "base-color texture"),
                            opacity: binding(textureIds[1], textureChannels[1], "opacity texture"),
                            normal: binding(textureIds[2], textureChannels[2], "normal texture"),
                            metallic: binding(textureIds[3], textureChannels[3], "metallic texture"),
                            roughness: binding(textureIds[4], textureChannels[4], "roughness texture"),
                            occlusion: binding(textureIds[5], textureChannels[5], "occlusion texture"),
                            emissive: binding(textureIds[6], textureChannels[6], "emissive texture"),
                        });
                        materials.set(id, material);
                        break;
                    }
                    case Command.TransformNode: {
                        const id = payload.u32();
                        const parentId = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const matrixOffset = payload.u32();
                        const node = new TransformNode(stringAt(dataBuffer, nameOffset, nameLength), scene);
                        trackAsset(container.transformNodes, node);
                        node.setPreTransformMatrix(matrixAt(dataBuffer, matrixOffset));
                        Object.defineProperty(node, NODE_MATRIX_PROPERTY, {
                            configurable: true,
                            get: () => node.getPivotMatrix(),
                            set: (matrix: Matrix) => node.setPreTransformMatrix(matrix),
                        });
                        nodes.set(id, node);
                        if (parentId === MISSING_OFFSET) {
                            node.parent = root ?? null;
                        } else {
                            pendingParents.push({ node, parentId });
                        }
                        break;
                    }
                    case Command.Skeleton: {
                        const id = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const jointCount = payload.u32();
                        const jointsOffset = payload.u32();
                        const skeleton = new Skeleton(stringAt(dataBuffer, nameOffset, nameLength), `usd-skeleton-${id}`, scene);
                        trackAsset(container.skeletons, skeleton);
                        const jointView = new DataView(dataBuffer);
                        assertRange(dataBuffer, jointsOffset, jointCount * 6, 4, "skeleton joints");
                        const created: Bone[] = [];
                        for (let index = 0; index < jointCount; ++index) {
                            const offset = jointsOffset + index * 24;
                            const parentIndex = jointView.getUint32(offset, true);
                            const boneId = jointView.getUint32(offset + 4, true);
                            const jointNameOffset = jointView.getUint32(offset + 8, true);
                            const jointNameLength = jointView.getUint32(offset + 12, true);
                            const restMatrixOffset = jointView.getUint32(offset + 16, true);
                            const bindMatrixOffset = jointView.getUint32(offset + 20, true);
                            if (parentIndex !== MISSING_OFFSET && parentIndex >= index) {
                                throw new Error(`Skeleton ${id} has an invalid parent joint index.`);
                            }
                            const bone = new Bone(
                                stringAt(dataBuffer, jointNameOffset, jointNameLength),
                                skeleton,
                                parentIndex === MISSING_OFFSET ? null : created[parentIndex],
                                matrixAt(dataBuffer, restMatrixOffset),
                                matrixAt(dataBuffer, restMatrixOffset),
                                matrixAt(dataBuffer, bindMatrixOffset),
                                index
                            );
                            created.push(bone);
                            bones.set(boneId, bone);
                        }
                        skeletons.set(id, skeleton);
                        break;
                    }
                    case Command.Geometry: {
                        const id = payload.u32();
                        geometries.set(id, {
                            vertexCount: payload.u32(),
                            indexCount: payload.u32(),
                            flags: payload.u32(),
                            positions: payload.u32(),
                            normals: payload.u32(),
                            tangents: payload.u32(),
                            uv0: payload.u32(),
                            colors: payload.u32(),
                            joints0: payload.u32(),
                            weights0: payload.u32(),
                            joints1: payload.u32(),
                            weights1: payload.u32(),
                            indices: payload.u32(),
                            influences: payload.u32(),
                        });
                        break;
                    }
                    case Command.Mesh: {
                        const id = payload.u32();
                        const nodeId = payload.u32();
                        const geometryId = payload.u32();
                        const materialId = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const flags = payload.u32();
                        const skeletonId = payload.u32();
                        const submeshesOffset = payload.u32();
                        const submeshCount = payload.u32();
                        const descriptor = geometries.get(geometryId);
                        if (!descriptor) {
                            throw new Error(`Mesh ${id} references missing geometry ${geometryId}.`);
                        }
                        const mesh = new Mesh(stringAt(dataBuffer, nameOffset, nameLength), scene);
                        trackAsset(container.meshes, mesh);
                        applyMeshOrientation(mesh, flags);
                        mesh.parent = nodes.get(nodeId) ?? root ?? null;
                        const vertexData = new VertexData();
                        assertRange(dataBuffer, descriptor.positions, descriptor.vertexCount * 3, 4, "positions");
                        vertexData.positions = new Float32Array(dataBuffer, descriptor.positions, descriptor.vertexCount * 3);
                        if (descriptor.flags & GeometryFlags.Normals) {
                            assertRange(dataBuffer, descriptor.normals, descriptor.vertexCount * 3, 4, "normals");
                            vertexData.normals = new Float32Array(dataBuffer, descriptor.normals, descriptor.vertexCount * 3);
                        }
                        if (descriptor.flags & GeometryFlags.Tangents) {
                            assertRange(dataBuffer, descriptor.tangents, descriptor.vertexCount * 4, 4, "tangents");
                            vertexData.tangents = new Float32Array(dataBuffer, descriptor.tangents, descriptor.vertexCount * 4);
                        }
                        if (descriptor.flags & GeometryFlags.Uv0) {
                            assertRange(dataBuffer, descriptor.uv0, descriptor.vertexCount * 2, 4, "texture coordinates");
                            vertexData.uvs = new Float32Array(dataBuffer, descriptor.uv0, descriptor.vertexCount * 2);
                        }
                        if (descriptor.flags & GeometryFlags.Colors) {
                            assertRange(dataBuffer, descriptor.colors, descriptor.vertexCount * 4, 4, "vertex colors");
                            vertexData.colors = new Float32Array(dataBuffer, descriptor.colors, descriptor.vertexCount * 4);
                        }
                        if (descriptor.flags & GeometryFlags.Skin0) {
                            assertRange(dataBuffer, descriptor.joints0, descriptor.vertexCount * 4, 2, "joint indices");
                            assertRange(dataBuffer, descriptor.weights0, descriptor.vertexCount * 4, 4, "joint weights");
                            vertexData.matricesIndices = Float32Array.from(new Uint16Array(dataBuffer, descriptor.joints0, descriptor.vertexCount * 4));
                            vertexData.matricesWeights = new Float32Array(dataBuffer, descriptor.weights0, descriptor.vertexCount * 4);
                        }
                        if (descriptor.flags & GeometryFlags.Skin1) {
                            assertRange(dataBuffer, descriptor.joints1, descriptor.vertexCount * 4, 2, "extra joint indices");
                            assertRange(dataBuffer, descriptor.weights1, descriptor.vertexCount * 4, 4, "extra joint weights");
                            vertexData.matricesIndicesExtra = Float32Array.from(new Uint16Array(dataBuffer, descriptor.joints1, descriptor.vertexCount * 4));
                            vertexData.matricesWeightsExtra = new Float32Array(dataBuffer, descriptor.weights1, descriptor.vertexCount * 4);
                        }
                        assertRange(dataBuffer, descriptor.indices, descriptor.indexCount, 4, "indices");
                        vertexData.indices = new Uint32Array(dataBuffer, descriptor.indices, descriptor.indexCount);
                        vertexData.applyToMesh(mesh, true);
                        if (mesh.geometry) {
                            trackAsset(container.geometries, mesh.geometry);
                        }
                        mesh.numBoneInfluencers = Math.min(descriptor.influences, 8);
                        if (skeletonId !== MISSING_OFFSET) {
                            mesh.skeleton = skeletons.get(skeletonId) ?? null;
                        }

                        const submeshView = new DataView(dataBuffer);
                        assertRange(dataBuffer, submeshesOffset, submeshCount * 5, 4, "submeshes");
                        const doubleSided = Boolean(flags & MeshFlags.DoubleSided);
                        if (submeshCount === 1 && materialId !== MISSING_OFFSET) {
                            mesh.material = materialForMesh(materialId, doubleSided);
                        } else {
                            const multi = new MultiMaterial(`${mesh.name} materials`, scene);
                            trackAsset(container.multiMaterials, multi);
                            for (let index = 0; index < submeshCount; ++index) {
                                const offset = submeshesOffset + index * 20;
                                multi.subMaterials.push(materialForMesh(submeshView.getUint32(offset, true), doubleSided));
                            }
                            mesh.material = multi;
                        }
                        mesh.releaseSubMeshes();
                        for (let index = 0; index < submeshCount; ++index) {
                            const offset = submeshesOffset + index * 20;
                            new SubMesh(
                                index,
                                submeshView.getUint32(offset + 12, true),
                                submeshView.getUint32(offset + 16, true),
                                submeshView.getUint32(offset + 4, true),
                                submeshView.getUint32(offset + 8, true),
                                mesh
                            );
                        }
                        meshes.set(id, mesh);
                        break;
                    }
                    case Command.MorphTarget: {
                        const id = payload.u32();
                        const meshId = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const vertexCount = payload.u32();
                        const positionsOffset = payload.u32();
                        const normalsOffset = payload.u32();
                        const influence = payload.f32();
                        const mesh = meshes.get(meshId);
                        if (!mesh) {
                            throw new Error(`Morph target references missing mesh ${meshId}.`);
                        }
                        if (morphTargets.has(id) || vertexCount !== mesh.getTotalVertices() || !Number.isFinite(influence)) {
                            throw new Error(`Morph target ${id} has invalid metadata.`);
                        }
                        assertRange(dataBuffer, positionsOffset, vertexCount * 3, 4, "morph target positions");
                        let manager = morphTargetManagers.get(meshId);
                        if (!manager) {
                            manager = new MorphTargetManager(scene, mesh.name);
                            manager.areUpdatesFrozen = true;
                            trackAsset(container.morphTargetManagers, manager);
                            mesh.morphTargetManager = manager;
                            morphTargetManagers.set(meshId, manager);
                        }
                        const target = new MorphTarget(stringAt(dataBuffer, nameOffset, nameLength), influence, scene, manager);
                        target.id = `usd-morph-target-${id}`;
                        target.setPositions(new Float32Array(dataBuffer, positionsOffset, vertexCount * 3));
                        if (normalsOffset !== MISSING_OFFSET) {
                            assertRange(dataBuffer, normalsOffset, vertexCount * 3, 4, "morph target normals");
                            target.setNormals(new Float32Array(dataBuffer, normalsOffset, vertexCount * 3));
                        }
                        manager.addTarget(target);
                        morphTargets.set(id, target);
                        break;
                    }
                    case Command.AnalyticPrimitive: {
                        const id = payload.u32();
                        const nodeId = payload.u32();
                        const type = payload.u32();
                        const materialId = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const flags = payload.u32();
                        const axis = payload.u32();
                        const sizeOrRadius = payload.f32();
                        const height = payload.f32();
                        const tessellation = payload.u32();
                        const name = stringAt(dataBuffer, nameOffset, nameLength);
                        if (!Number.isFinite(sizeOrRadius) || sizeOrRadius <= 0) {
                            throw new Error(`Analytic primitive ${id} has an invalid size or radius.`);
                        }
                        if ((type === AnalyticPrimitiveType.Cylinder || type === AnalyticPrimitiveType.Cone) && (!Number.isFinite(height) || height <= 0)) {
                            throw new Error(`Analytic primitive ${id} has an invalid height.`);
                        }
                        if (type !== AnalyticPrimitiveType.Cube && (!Number.isInteger(tessellation) || tessellation < 3 || tessellation > 512)) {
                            throw new Error(`Analytic primitive ${id} has invalid tessellation.`);
                        }
                        let mesh: Mesh;
                        switch (type) {
                            case AnalyticPrimitiveType.Cube:
                                mesh = CreateBox(name, { size: sizeOrRadius }, scene);
                                break;
                            case AnalyticPrimitiveType.Sphere:
                                mesh = CreateSphere(
                                    name,
                                    {
                                        diameter: sizeOrRadius * 2,
                                        segments: tessellation,
                                    },
                                    scene
                                );
                                break;
                            case AnalyticPrimitiveType.Cylinder:
                            case AnalyticPrimitiveType.Cone:
                                mesh = CreateCylinder(
                                    name,
                                    {
                                        height,
                                        diameterTop: type === AnalyticPrimitiveType.Cone ? 0 : sizeOrRadius * 2,
                                        diameterBottom: sizeOrRadius * 2,
                                        tessellation,
                                    },
                                    scene
                                );
                                break;
                            default:
                                throw new Error(`Unsupported analytic primitive type ${type}.`);
                        }
                        trackAsset(container.meshes, mesh);
                        if (mesh.geometry) {
                            trackAsset(container.geometries, mesh.geometry);
                        }

                        // Babylon builders emit left-handed local winding. Reverse only for USD's
                        // default right-handed convention; normals already point outward.
                        if (!(flags & MeshFlags.LeftHanded)) {
                            const sourceIndices = mesh.getIndices();
                            if (!sourceIndices) {
                                throw new Error(`Analytic primitive ${id} has no generated indices.`);
                            }
                            const reversed = Array.from(sourceIndices);
                            for (let index = 0; index < reversed.length; index += 3) {
                                [reversed[index], reversed[index + 2]] = [reversed[index + 2], reversed[index]];
                            }
                            mesh.setIndices(reversed);
                        }
                        if (axis === PrimitiveAxis.X) {
                            mesh.rotationQuaternion = Quaternion.RotationAxis(new Vector3(0, 0, 1), -Math.PI / 2);
                        } else if (axis === PrimitiveAxis.Z) {
                            mesh.rotationQuaternion = Quaternion.RotationAxis(new Vector3(1, 0, 0), Math.PI / 2);
                        } else if (axis !== PrimitiveAxis.Y) {
                            throw new Error(`Unsupported analytic primitive axis ${axis}.`);
                        }
                        applyMeshOrientation(mesh, flags);
                        mesh.parent = nodes.get(nodeId) ?? root ?? null;
                        mesh.material = materialForMesh(materialId, Boolean(flags & MeshFlags.DoubleSided));
                        meshes.set(id, mesh);
                        break;
                    }
                    case Command.Instance: {
                        const sourceId = payload.u32();
                        const nodeId = payload.u32();
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const source = meshes.get(sourceId);
                        if (!source) {
                            throw new Error(`Instance references missing mesh ${sourceId}.`);
                        }
                        if (thinInstanceSources.has(sourceId)) {
                            throw new Error(`Mesh ${sourceId} cannot mix classic and thin instances.`);
                        }
                        classicInstanceSources.add(sourceId);
                        const instance = source.createInstance(stringAt(dataBuffer, nameOffset, nameLength));
                        trackAsset(container.meshes, instance);
                        instance.parent = nodes.get(nodeId) ?? root ?? null;
                        break;
                    }
                    case Command.ThinInstances: {
                        const sourceId = payload.u32();
                        const transformsOffset = payload.u32();
                        const instanceCount = payload.u32();
                        const source = meshes.get(sourceId);
                        if (!source) {
                            throw new Error(`Thin instances reference missing mesh ${sourceId}.`);
                        }
                        if (thinInstanceSources.has(sourceId) || classicInstanceSources.has(sourceId)) {
                            throw new Error(`Mesh ${sourceId} has duplicate or mixed thin instances.`);
                        }
                        assertRange(dataBuffer, transformsOffset, instanceCount * 16, 4, "thin instance transforms");
                        source.thinInstanceSetBuffer("matrix", new Float32Array(dataBuffer, transformsOffset, instanceCount * 16), 16, true);
                        source.thinInstanceEnablePicking = true;
                        thinInstanceSources.add(sourceId);
                        break;
                    }
                    case Command.Animation: {
                        const targetKind = payload.u32();
                        const targetId = payload.u32();
                        const property = payload.u32();
                        const trackIndex = payload.u32();
                        const keyCount = payload.u32();
                        const timesOffset = payload.u32();
                        const valuesOffset = payload.u32();
                        const stride = payload.u32();
                        if (targetKind !== AnimationTarget.Node && targetKind !== AnimationTarget.Bone && targetKind !== AnimationTarget.MorphTarget) {
                            throw new Error(`Invalid animation target kind ${targetKind}.`);
                        }
                        if ((targetKind === AnimationTarget.MorphTarget) !== (property === AnimationProperty.Influence)) {
                            throw new Error(`Invalid animation property ${property} for target kind ${targetKind}.`);
                        }
                        const expectedStride =
                            property === AnimationProperty.Influence
                                ? 1
                                : property === AnimationProperty.Position || property === AnimationProperty.Scaling
                                  ? 3
                                  : property === AnimationProperty.RotationQuaternion
                                    ? 4
                                    : property === AnimationProperty.Matrix
                                      ? 16
                                      : 0;
                        if (stride !== expectedStride) {
                            throw new Error(`Invalid animation value stride ${stride} for property ${property}.`);
                        }
                        const target =
                            targetKind === AnimationTarget.Node ? nodes.get(targetId) : targetKind === AnimationTarget.Bone ? bones.get(targetId) : morphTargets.get(targetId);
                        if (!target) {
                            break;
                        }
                        const propertyName =
                            property === AnimationProperty.Position
                                ? "position"
                                : property === AnimationProperty.RotationQuaternion
                                  ? "rotationQuaternion"
                                  : property === AnimationProperty.Scaling
                                    ? "scaling"
                                    : property === AnimationProperty.Influence
                                      ? "influence"
                                      : targetKind === AnimationTarget.Node
                                        ? NODE_MATRIX_PROPERTY
                                        : "_matrix";
                        const dataType =
                            property === AnimationProperty.Influence
                                ? Animation.ANIMATIONTYPE_FLOAT
                                : property === AnimationProperty.RotationQuaternion
                                  ? Animation.ANIMATIONTYPE_QUATERNION
                                  : property === AnimationProperty.Matrix
                                    ? Animation.ANIMATIONTYPE_MATRIX
                                    : Animation.ANIMATIONTYPE_VECTOR3;
                        const animation = new Animation(`USD ${propertyName}`, propertyName, timeCodesPerSecond, dataType, Animation.ANIMATIONLOOPMODE_CYCLE);
                        assertRange(dataBuffer, timesOffset, keyCount, 4, "animation times");
                        assertRange(dataBuffer, valuesOffset, keyCount * stride, 4, "animation values");
                        const times = new Float32Array(dataBuffer, timesOffset, keyCount);
                        const values = new Float32Array(dataBuffer, valuesOffset, keyCount * stride);
                        animation.setKeys(
                            Array.from({ length: keyCount }, (_, index) => ({
                                frame: times[index],
                                value:
                                    dataType === Animation.ANIMATIONTYPE_QUATERNION
                                        ? Quaternion.FromArray(values, index * stride)
                                        : dataType === Animation.ANIMATIONTYPE_MATRIX
                                          ? Matrix.FromArray(values, index * stride)
                                          : dataType === Animation.ANIMATIONTYPE_FLOAT
                                            ? values[index * stride]
                                            : Vector3.FromArray(values, index * stride),
                            }))
                        );
                        let group = animationGroups.get(trackIndex);
                        if (!group) {
                            group = new AnimationGroup(`USD Animation ${trackIndex + 1}`, scene);
                            animationGroups.set(trackIndex, group);
                            trackAsset(container.animationGroups, group);
                        }
                        group.addTargetedAnimation(animation, target);
                        break;
                    }
                }
            }
            for (const manager of morphTargetManagers.values()) {
                manager.areUpdatesFrozen = false;
                if (manager.isUsingTextureForTargets || manager.numTargets <= MorphTargetManager.MaxActiveMorphTargetsInVertexAttributeMode) {
                    manager.optimizeInfluencers = false;
                    manager.numMaxInfluencers = manager.numTargets;
                }
            }
        } finally {
            if (!addToScene) {
                scene._blockEntityCollection = previousBlockEntityCollection;
            }
        }

        await awaitAbortableAsync(Promise.all(textureLoads), signal);
        await awaitAbortableAsync(
            Promise.all(
                materialTextureBindings.map(async (bindings) => {
                    await applyMaterialTextureBindingsAsync(bindings);
                })
            ),
            signal
        );
        for (const { node, parentId } of pendingParents) {
            node.parent = nodes.get(parentId) ?? root ?? null;
        }
        return { container, materializeMs: performance.now() - started };
    } catch (error) {
        rollingBack = true;
        // Decode callbacks can arrive after rollback; observe their rejections without
        // delaying cancellation on an image load that may never finish.
        void Promise.allSettled(textureLoads);
        void Promise.allSettled(processedTextures.values());
        container.dispose();
        for (const url of textureUrls) {
            URL.revokeObjectURL(url);
        }
        throw error;
    }
}
