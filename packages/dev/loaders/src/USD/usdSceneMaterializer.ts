/* eslint-disable @typescript-eslint/naming-convention */

import { Animation } from "core/Animations/animation.pure";
import { AnimationGroup } from "core/Animations/animationGroup.pure";
import { AbstractAssetContainer, AssetContainer } from "core/assetContainer";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { Color3 } from "core/Maths/math.color.pure";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector.pure";
import { Material } from "core/Materials/material.pure";
import { MultiMaterial } from "core/Materials/multiMaterial.pure";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial.pure";
import { Texture } from "core/Materials/Textures/texture.pure";
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

class DirectAssetContainer extends AbstractAssetContainer {
    public dispose(): void {
        for (const animationGroup of this.animationGroups.splice(0)) {
            animationGroup.dispose();
        }
        for (const mesh of this.meshes.splice(0)) {
            mesh.dispose();
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
    const textures = new Map<number, Texture>();
    const materials = new Map<number, PBRMaterial>();
    const doubleSidedMaterials = new Map<number, PBRMaterial>();
    const skeletons = new Map<number, Skeleton>();
    const bones = new Map<number, Bone>();
    const geometries = new Map<number, GeometryDescriptor>();
    const meshes = new Map<number, Mesh>();
    const animationGroups = new Map<number, AnimationGroup>();
    const textureLoads: Promise<void>[] = [];
    const textureUrls = new Set<string>();
    const assetContainer = container instanceof AssetContainer ? container : undefined;
    let root: TransformNode | undefined;
    let timeCodesPerSecond = 24;

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
                        const nameOffset = payload.u32();
                        const nameLength = payload.u32();
                        const mime = mimeType(payload.u32());
                        const imageOffset = payload.u32();
                        const imageLength = payload.u32();
                        const coordinatesIndex = payload.u32();
                        const transformOffset = payload.u32();
                        const wrapU = payload.u32();
                        const wrapV = payload.u32();
                        assertRange(dataBuffer, transformOffset, 5, 4, "texture transform");
                        assertRange(dataBuffer, imageOffset, imageLength, 1, "texture image");
                        const transform = new Float32Array(dataBuffer, transformOffset, 5);
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
                        textures.set(id, texture);
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
                        const baseTexture = payload.u32();
                        const opacityTexture = payload.u32();
                        const normalTexture = payload.u32();
                        const ormTexture = payload.u32();
                        const emissiveTexture = payload.u32();
                        const opacityChannel = payload.u32();
                        const roughnessChannel = payload.u32();
                        const metallicChannel = payload.u32();
                        const occlusionChannel = payload.u32();
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
                        if (baseTexture !== MISSING_OFFSET) {
                            material.albedoTexture = textures.get(baseTexture) ?? null;
                            if (material.albedoTexture && opacityTexture === MISSING_OFFSET && flags & MaterialFlags.AlphaBlend) {
                                material.albedoTexture.hasAlpha = true;
                                material.useAlphaFromAlbedoTexture = true;
                            }
                        }
                        if (opacityTexture !== MISSING_OFFSET) {
                            material.opacityTexture = textures.get(opacityTexture) ?? null;
                            if (material.opacityTexture) {
                                material.opacityTexture.gammaSpace = false;
                                material.opacityTexture.getAlphaFromRGB = opacityChannel !== 3;
                            }
                        }
                        if (normalTexture !== MISSING_OFFSET) {
                            material.bumpTexture = textures.get(normalTexture) ?? null;
                            if (material.bumpTexture) {
                                material.bumpTexture.gammaSpace = false;
                                material.bumpTexture.level = normalScale;
                            }
                        }
                        if (ormTexture !== MISSING_OFFSET) {
                            material.metallicTexture = textures.get(ormTexture) ?? null;
                            if (material.metallicTexture) {
                                material.metallicTexture.gammaSpace = false;
                                material.useRoughnessFromMetallicTextureAlpha = roughnessChannel === 3;
                                material.useRoughnessFromMetallicTextureGreen = roughnessChannel === 1;
                                material.useMetallnessFromMetallicTextureBlue = metallicChannel === 2;
                                material.useAmbientOcclusionFromMetallicTextureRed = occlusionChannel === 0;
                            }
                        }
                        if (emissiveTexture !== MISSING_OFFSET) {
                            material.emissiveTexture = textures.get(emissiveTexture) ?? null;
                        }
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
                        assertRange(dataBuffer, jointsOffset, jointCount * 5, 4, "skeleton joints");
                        const created: Bone[] = [];
                        for (let index = 0; index < jointCount; ++index) {
                            const offset = jointsOffset + index * 20;
                            const parentIndex = jointView.getUint32(offset, true);
                            const boneId = jointView.getUint32(offset + 4, true);
                            const jointNameOffset = jointView.getUint32(offset + 8, true);
                            const jointNameLength = jointView.getUint32(offset + 12, true);
                            const matrixOffset = jointView.getUint32(offset + 16, true);
                            if (parentIndex !== MISSING_OFFSET && parentIndex >= index) {
                                throw new Error(`Skeleton ${id} has an invalid parent joint index.`);
                            }
                            const bone = new Bone(
                                stringAt(dataBuffer, jointNameOffset, jointNameLength),
                                skeleton,
                                parentIndex === MISSING_OFFSET ? null : created[parentIndex],
                                matrixAt(dataBuffer, matrixOffset),
                                matrixAt(dataBuffer, matrixOffset),
                                undefined,
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
                        const instance = source.createInstance(stringAt(dataBuffer, nameOffset, nameLength));
                        trackAsset(container.meshes, instance);
                        instance.parent = nodes.get(nodeId) ?? root ?? null;
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
                        if (targetKind !== AnimationTarget.Node && targetKind !== AnimationTarget.Bone) {
                            throw new Error(`Invalid animation target kind ${targetKind}.`);
                        }
                        const expectedStride =
                            property === AnimationProperty.Position || property === AnimationProperty.Scaling
                                ? 3
                                : property === AnimationProperty.RotationQuaternion
                                  ? 4
                                  : property === AnimationProperty.Matrix
                                    ? 16
                                    : 0;
                        if (stride !== expectedStride) {
                            throw new Error(`Invalid animation value stride ${stride} for property ${property}.`);
                        }
                        const target = targetKind === AnimationTarget.Node ? nodes.get(targetId) : bones.get(targetId);
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
                                    : targetKind === AnimationTarget.Node
                                      ? NODE_MATRIX_PROPERTY
                                      : "_matrix";
                        const dataType =
                            property === AnimationProperty.RotationQuaternion
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
        } finally {
            if (!addToScene) {
                scene._blockEntityCollection = previousBlockEntityCollection;
            }
        }

        const texturesLoaded = Promise.all(textureLoads);
        if (signal) {
            let onAbort: (() => void) | undefined;
            const aborted = new Promise<never>((_resolve, reject) => {
                onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error("USD materialization was aborted."));
                if (signal.aborted) {
                    onAbort();
                } else {
                    signal.addEventListener("abort", onAbort, { once: true });
                }
            });
            try {
                await Promise.race([texturesLoaded, aborted]);
                signal.throwIfAborted();
            } finally {
                if (onAbort) {
                    signal.removeEventListener("abort", onAbort);
                }
            }
        } else {
            await texturesLoaded;
        }
        for (const { node, parentId } of pendingParents) {
            node.parent = nodes.get(parentId) ?? root ?? null;
        }
        return { container, materializeMs: performance.now() - started };
    } catch (error) {
        // Decode callbacks can arrive after rollback; observe their rejections without
        // delaying cancellation on an image load that may never finish.
        void Promise.allSettled(textureLoads);
        container.dispose();
        for (const url of textureUrls) {
            URL.revokeObjectURL(url);
        }
        throw error;
    }
}
