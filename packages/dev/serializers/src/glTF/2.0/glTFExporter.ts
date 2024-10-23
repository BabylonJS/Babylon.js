/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable babylonjs/available */

import type {
    IBufferView,
    IAccessor,
    INode,
    IScene,
    IMesh,
    IMaterial,
    ITexture,
    IImage,
    ISampler,
    IAnimation,
    IMeshPrimitive,
    IBuffer,
    IGLTF,
    ITextureInfo,
    ISkin,
    ICamera,
} from "babylonjs-gltf2interface";
import { AccessorComponentType, AccessorType, CameraType, ImageMimeType } from "babylonjs-gltf2interface";

import type { FloatArray, IndicesArray, Nullable } from "core/types";
import { TmpVectors, Quaternion } from "core/Maths/math.vector";
import type { Matrix } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";
import type { Buffer } from "core/Buffers/buffer";
import { VertexBuffer } from "core/Buffers/buffer";
import type { Node } from "core/node";
import { TransformNode } from "core/Meshes/transformNode";
import type { SubMesh } from "core/Meshes/subMesh";
import { Mesh } from "core/Meshes/mesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Texture } from "core/Materials/Textures/texture";
import { Material } from "core/Materials/material";
import { Engine } from "core/Engines/engine";
import type { Scene } from "core/scene";
import { EngineStore } from "core/Engines/engineStore";

import type { IGLTFExporterExtensionV2 } from "./glTFExporterExtension";
import { GLTFMaterialExporter } from "./glTFMaterialExporter";
import type { IExportOptions } from "./glTFSerializer";
import { GLTFData } from "./glTFData";
import {
    areIndices32Bits,
    convertToRightHandedPosition,
    convertToRightHandedRotation,
    createAccessor,
    createBufferView,
    dataArrayToUint8Array,
    getAccessorType,
    getAttributeType,
    getMinMax,
    getPrimitiveMode,
    indicesArrayToUint8Array,
    isNoopNode,
    isTriangleFillMode,
} from "./glTFUtilities";
import { DataWriter } from "./dataWriter";
import { Camera } from "core/Cameras/camera";
import { MultiMaterial, PBRMaterial, StandardMaterial } from "core/Materials";
import { Logger } from "core/Misc/logger";
import { enumerateFloatValues } from "core/Buffers/bufferUtils";
import type { Bone, Skeleton } from "core/Bones";
import { _GLTFAnimation } from "./glTFAnimation";
import type { MorphTarget } from "core/Morph";
import { buildMorphTargetBuffers } from "./glTFMorphTargetsUtilities";
import type { GlTFMorphTarget } from "./glTFMorphTargetsUtilities";

// 180 degrees rotation in Y.
const rotation180Y = new Quaternion(0, 1, 0, 0);

class ExporterState {
    // Babylon indices array, start, count, offset, flip -> glTF accessor index
    private _indicesAccessorMap = new Map<Nullable<IndicesArray>, Map<number, Map<number, Map<number, Map<boolean, number>>>>>();

    // Babylon buffer -> glTF buffer view index
    private _vertexBufferViewMap = new Map<Buffer, number>();

    // Babylon vertex buffer, start, count -> glTF accessor index
    private _vertexAccessorMap = new Map<VertexBuffer, Map<number, Map<number, number>>>();

    private _remappedBufferView = new Map<Buffer, Map<VertexBuffer, number>>();

    private _meshMorphTargetMap = new Map<Mesh, GlTFMorphTarget[]>();

    private _vertexMapColorAlpha = new Map<VertexBuffer, boolean>();

    // Babylon mesh -> glTF mesh index
    private _meshMap = new Map<Mesh, number>();

    public constructor(convertToRightHanded: boolean, userUint16SkinIndex: boolean) {
        this.convertToRightHanded = convertToRightHanded;
        this.userUint16SkinIndex = userUint16SkinIndex;
    }

    public readonly convertToRightHanded: boolean;

    public readonly userUint16SkinIndex: boolean;

    // Only used when convertToRightHanded is true.
    public readonly convertedToRightHandedBuffers = new Map<Buffer, Uint8Array>();

    public getIndicesAccessor(indices: Nullable<IndicesArray>, start: number, count: number, offset: number, flip: boolean): number | undefined {
        return this._indicesAccessorMap.get(indices)?.get(start)?.get(count)?.get(offset)?.get(flip);
    }

    public setIndicesAccessor(indices: Nullable<IndicesArray>, start: number, count: number, offset: number, flip: boolean, accessorIndex: number): void {
        let map1 = this._indicesAccessorMap.get(indices);
        if (!map1) {
            map1 = new Map<number, Map<number, Map<number, Map<boolean, number>>>>();
            this._indicesAccessorMap.set(indices, map1);
        }

        let map2 = map1.get(start);
        if (!map2) {
            map2 = new Map<number, Map<number, Map<boolean, number>>>();
            map1.set(start, map2);
        }

        let map3 = map2.get(count);
        if (!map3) {
            map3 = new Map<number, Map<boolean, number>>();
            map2.set(count, map3);
        }

        let map4 = map3.get(offset);
        if (!map4) {
            map4 = new Map<boolean, number>();
            map3.set(offset, map4);
        }

        map4.set(flip, accessorIndex);
    }

    public getVertexBufferView(buffer: Buffer): number | undefined {
        return this._vertexBufferViewMap.get(buffer);
    }

    public setVertexBufferView(buffer: Buffer, bufferViewIndex: number): void {
        this._vertexBufferViewMap.set(buffer, bufferViewIndex);
    }

    public setRemappedBufferView(buffer: Buffer, vertexBuffer: VertexBuffer, bufferViewIndex: number) {
        this._remappedBufferView.set(buffer, new Map<VertexBuffer, number>());
        this._remappedBufferView.get(buffer)?.set(vertexBuffer, bufferViewIndex);
    }

    public getRemappedBufferView(buffer: Buffer, vertexBuffer: VertexBuffer): number | undefined {
        return this._remappedBufferView.get(buffer)?.get(vertexBuffer);
    }

    public getVertexAccessor(vertexBuffer: VertexBuffer, start: number, count: number): number | undefined {
        return this._vertexAccessorMap.get(vertexBuffer)?.get(start)?.get(count);
    }

    public setVertexAccessor(vertexBuffer: VertexBuffer, start: number, count: number, accessorIndex: number): void {
        let map1 = this._vertexAccessorMap.get(vertexBuffer);
        if (!map1) {
            map1 = new Map<number, Map<number, number>>();
            this._vertexAccessorMap.set(vertexBuffer, map1);
        }

        let map2 = map1.get(start);
        if (!map2) {
            map2 = new Map<number, number>();
            map1.set(start, map2);
        }

        map2.set(count, accessorIndex);
    }

    public hasVertexColorAlpha(vertexBuffer: VertexBuffer): boolean {
        return this._vertexMapColorAlpha.get(vertexBuffer) || false;
    }

    public setHasVertexColorAlpha(vertexBuffer: VertexBuffer, hasAlpha: boolean) {
        return this._vertexMapColorAlpha.set(vertexBuffer, hasAlpha);
    }

    public getMesh(mesh: Mesh): number | undefined {
        return this._meshMap.get(mesh);
    }

    public setMesh(mesh: Mesh, meshIndex: number): void {
        this._meshMap.set(mesh, meshIndex);
    }

    public bindMorphDataToMesh(mesh: Mesh, morphData: GlTFMorphTarget) {
        const morphTargets = this._meshMorphTargetMap.get(mesh) || [];
        this._meshMorphTargetMap.set(mesh, morphTargets);
        if (morphTargets.indexOf(morphData) === -1) {
            morphTargets.push(morphData);
        }
    }

    public getMorphTargetsFromMesh(mesh: Mesh): GlTFMorphTarget[] | undefined {
        return this._meshMorphTargetMap.get(mesh);
    }
}

/** @internal */
export class GLTFExporter {
    public readonly _glTF: IGLTF = {
        asset: { generator: `Babylon.js v${Engine.Version}`, version: "2.0" },
    };

    public readonly _animations: IAnimation[] = [];
    public readonly _accessors: IAccessor[] = [];
    public readonly _bufferViews: IBufferView[] = [];
    public readonly _cameras: ICamera[] = [];
    public readonly _images: IImage[] = [];
    public readonly _materials: IMaterial[] = [];
    public readonly _meshes: IMesh[] = [];
    public readonly _nodes: INode[] = [];
    public readonly _samplers: ISampler[] = [];
    public readonly _scenes: IScene[] = [];
    public readonly _skins: ISkin[] = [];
    public readonly _textures: ITexture[] = [];

    public readonly _babylonScene: Scene;
    public readonly _imageData: { [fileName: string]: { data: ArrayBuffer; mimeType: ImageMimeType } } = {};
    private readonly _orderedImageData: Array<{ data: ArrayBuffer; mimeType: ImageMimeType }> = [];

    // /**
    //  * Baked animation sample rate
    //  */
    private _animationSampleRate: number;

    private readonly _options: Required<IExportOptions>;

    private readonly _materialExporter = new GLTFMaterialExporter(this);

    private readonly _extensions: { [name: string]: IGLTFExporterExtensionV2 } = {};

    private readonly _dataWriter = new DataWriter(4);

    private readonly _shouldExportNodeMap = new Map<Node, boolean>();

    // Babylon node -> glTF node index
    private readonly _nodeMap = new Map<Node, number>();

    // Babylon material -> glTF material index
    public readonly _materialMap = new Map<Material, number>();
    private readonly _camerasMap = new Map<Camera, ICamera>();
    private readonly _nodesCameraMap = new Map<ICamera, INode[]>();
    private readonly _skinMap = new Map<Skeleton, ISkin>();
    private readonly _nodesSkinMap = new Map<ISkin, INode[]>();

    // A material in this set requires UVs
    public readonly _materialNeedsUVsSet = new Set<Material>();

    private static readonly _ExtensionNames = new Array<string>();
    private static readonly _ExtensionFactories: { [name: string]: (exporter: GLTFExporter) => IGLTFExporterExtensionV2 } = {};

    private _applyExtension<T>(
        node: Nullable<T>,
        extensions: IGLTFExporterExtensionV2[],
        index: number,
        actionAsync: (extension: IGLTFExporterExtensionV2, node: Nullable<T>) => Promise<Nullable<T>> | undefined
    ): Promise<Nullable<T>> {
        if (index >= extensions.length) {
            return Promise.resolve(node);
        }

        const currentPromise = actionAsync(extensions[index], node);

        if (!currentPromise) {
            return this._applyExtension(node, extensions, index + 1, actionAsync);
        }

        return currentPromise.then((newNode) => this._applyExtension(newNode, extensions, index + 1, actionAsync));
    }

    private _applyExtensions<T>(
        node: Nullable<T>,
        actionAsync: (extension: IGLTFExporterExtensionV2, node: Nullable<T>) => Promise<Nullable<T>> | undefined
    ): Promise<Nullable<T>> {
        const extensions: IGLTFExporterExtensionV2[] = [];
        for (const name of GLTFExporter._ExtensionNames) {
            extensions.push(this._extensions[name]);
        }

        return this._applyExtension(node, extensions, 0, actionAsync);
    }

    public _extensionsPreExportTextureAsync(context: string, babylonTexture: Nullable<Texture>, mimeType: ImageMimeType): Promise<Nullable<BaseTexture>> {
        return this._applyExtensions(babylonTexture, (extension, node) => extension.preExportTextureAsync && extension.preExportTextureAsync(context, node, mimeType));
    }

    public _extensionsPostExportMeshPrimitiveAsync(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh): Promise<Nullable<IMeshPrimitive>> {
        return this._applyExtensions(
            meshPrimitive,
            (extension, node) => extension.postExportMeshPrimitiveAsync && extension.postExportMeshPrimitiveAsync(context, node, babylonSubMesh)
        );
    }

    public _extensionsPostExportNodeAsync(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap: { [key: number]: number }): Promise<Nullable<INode>> {
        return this._applyExtensions(node, (extension, node) => extension.postExportNodeAsync && extension.postExportNodeAsync(context, node, babylonNode, nodeMap));
    }

    public _extensionsPostExportMaterialAsync(context: string, material: Nullable<IMaterial>, babylonMaterial: Material): Promise<Nullable<IMaterial>> {
        return this._applyExtensions(material, (extension, node) => extension.postExportMaterialAsync && extension.postExportMaterialAsync(context, node, babylonMaterial));
    }

    public _extensionsPostExportMaterialAdditionalTextures(context: string, material: IMaterial, babylonMaterial: Material): BaseTexture[] {
        const output: BaseTexture[] = [];

        for (const name of GLTFExporter._ExtensionNames) {
            const extension = this._extensions[name];

            if (extension.postExportMaterialAdditionalTextures) {
                output.push(...extension.postExportMaterialAdditionalTextures(context, material, babylonMaterial));
            }
        }

        return output;
    }

    public _extensionsPostExportTextures(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void {
        for (const name of GLTFExporter._ExtensionNames) {
            const extension = this._extensions[name];

            if (extension.postExportTexture) {
                extension.postExportTexture(context, textureInfo, babylonTexture);
            }
        }
    }

    private _forEachExtensions(action: (extension: IGLTFExporterExtensionV2) => void): void {
        for (const name of GLTFExporter._ExtensionNames) {
            const extension = this._extensions[name];
            if (extension.enabled) {
                action(extension);
            }
        }
    }

    private _extensionsOnExporting(): void {
        this._forEachExtensions((extension) => {
            if (extension.wasUsed) {
                this._glTF.extensionsUsed ||= [];
                if (this._glTF.extensionsUsed.indexOf(extension.name) === -1) {
                    this._glTF.extensionsUsed.push(extension.name);
                }

                if (extension.required) {
                    this._glTF.extensionsRequired ||= [];
                    if (this._glTF.extensionsRequired.indexOf(extension.name) === -1) {
                        this._glTF.extensionsRequired.push(extension.name);
                    }
                }

                if (extension.onExporting) {
                    extension.onExporting();
                }
            }
        });
    }

    private _loadExtensions(): void {
        for (const name of GLTFExporter._ExtensionNames) {
            const extension = GLTFExporter._ExtensionFactories[name](this);
            this._extensions[name] = extension;
        }
    }

    public constructor(babylonScene: Nullable<Scene> = EngineStore.LastCreatedScene, options?: IExportOptions) {
        if (!babylonScene) {
            throw new Error("No scene available to export");
        }

        this._babylonScene = babylonScene;

        this._options = {
            shouldExportNode: () => true,
            shouldExportAnimation: () => true,
            metadataSelector: (metadata) => metadata,
            animationSampleRate: 1 / 60,
            exportWithoutWaitingForScene: false,
            exportUnusedUVs: false,
            removeNoopRootNodes: true,
            includeCoordinateSystemConversionNodes: false,
            userUint16SkinIndex: false,
            ...options,
        };

        this._loadExtensions();
    }

    public dispose() {
        for (const key in this._extensions) {
            const extension = this._extensions[key];
            extension.dispose();
        }
    }

    public get options() {
        return this._options;
    }

    public static RegisterExtension(name: string, factory: (exporter: GLTFExporter) => IGLTFExporterExtensionV2): void {
        if (GLTFExporter.UnregisterExtension(name)) {
            Tools.Warn(`Extension with the name ${name} already exists`);
        }

        GLTFExporter._ExtensionFactories[name] = factory;
        GLTFExporter._ExtensionNames.push(name);
    }

    public static UnregisterExtension(name: string): boolean {
        if (!GLTFExporter._ExtensionFactories[name]) {
            return false;
        }
        delete GLTFExporter._ExtensionFactories[name];

        const index = GLTFExporter._ExtensionNames.indexOf(name);
        if (index !== -1) {
            GLTFExporter._ExtensionNames.splice(index, 1);
        }

        return true;
    }

    // /**
    //  * Writes mesh attribute data to a data buffer
    //  * Returns the bytelength of the data
    //  * @param vertexBufferKind Indicates what kind of vertex data is being passed in
    //  * @param attributeComponentKind
    //  * @param meshPrimitive
    //  * @param morphTarget
    //  * @param meshAttributeArray Array containing the attribute data
    //  * @param morphTargetAttributeArray
    //  * @param stride Specifies the space between data
    //  * @param dataWriter The buffer to write the binary data to
    //  * @param minMax
    //  */
    // public writeMorphTargetAttributeData(
    //     vertexBufferKind: string,
    //     attributeComponentKind: AccessorComponentType,
    //     meshPrimitive: SubMesh,
    //     meshAttributeArray: FloatArray,
    //     morphTargetAttributeArray: FloatArray,
    //     stride: number,
    //     dataWriter: DataWriter,
    //     minMax?: any
    // ) {
    //     let vertexAttributes: number[][] = [];
    //     let index: number;
    //     let difference: Vector3 = new Vector3();
    //     let difference4: Vector4 = new Vector4(0, 0, 0, 0);

    //     switch (vertexBufferKind) {
    //         case VertexBuffer.PositionKind: {
    //             for (let k = meshPrimitive.verticesStart; k < meshPrimitive.verticesCount; ++k) {
    //                 index = meshPrimitive.indexStart + k * stride;
    //                 const vertexData = Vector3.FromArray(meshAttributeArray, index);
    //                 const morphData = Vector3.FromArray(morphTargetAttributeArray, index);
    //                 difference = morphData.subtractToRef(vertexData, difference);
    //                 if (minMax) {
    //                     minMax.min.copyFromFloats(Math.min(difference.x, minMax.min.x), Math.min(difference.y, minMax.min.y), Math.min(difference.z, minMax.min.z));
    //                     minMax.max.copyFromFloats(Math.max(difference.x, minMax.max.x), Math.max(difference.y, minMax.max.y), Math.max(difference.z, minMax.max.z));
    //                 }
    //                 vertexAttributes.push(difference.asArray());
    //             }
    //             break;
    //         }
    //         case VertexBuffer.NormalKind: {
    //             for (let k = meshPrimitive.verticesStart; k < meshPrimitive.verticesCount; ++k) {
    //                 index = meshPrimitive.indexStart + k * stride;
    //                 const vertexData = Vector3.FromArray(meshAttributeArray, index).normalize();
    //                 const morphData = Vector3.FromArray(morphTargetAttributeArray, index).normalize();
    //                 difference = morphData.subtractToRef(vertexData, difference);
    //                 vertexAttributes.push(difference.asArray());
    //             }
    //             break;
    //         }
    //         case VertexBuffer.TangentKind: {
    //             for (let k = meshPrimitive.verticesStart; k < meshPrimitive.verticesCount; ++k) {
    //                 index = meshPrimitive.indexStart + k * (stride + 1);
    //                 const vertexData = Vector4.FromArray(meshAttributeArray, index);
    //                 normalizeTangent(vertexData);
    //                 const morphData = Vector4.FromArray(morphTargetAttributeArray, index);
    //                 normalizeTangent(morphData);
    //                 difference4 = morphData.subtractToRef(vertexData, difference4);
    //                 vertexAttributes.push([difference4.x, difference4.y, difference4.z]);
    //             }
    //             break;
    //         }
    //         default: {
    //             Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
    //             vertexAttributes = [];
    //         }
    //     }

    //     let writeBinaryFunc;
    //     switch (attributeComponentKind) {
    //         case AccessorComponentType.UNSIGNED_BYTE: {
    //             writeBinaryFunc = dataWriter.writeUInt8.bind(dataWriter);
    //             break;
    //         }
    //         case AccessorComponentType.UNSIGNED_SHORT: {
    //             writeBinaryFunc = dataWriter.writeUInt16.bind(dataWriter);
    //             break;
    //         }
    //         case AccessorComponentType.UNSIGNED_INT: {
    //             writeBinaryFunc = dataWriter.writeUInt32.bind(dataWriter);
    //             break;
    //         }
    //         case AccessorComponentType.FLOAT: {
    //             writeBinaryFunc = dataWriter.writeFloat32.bind(dataWriter);
    //             break;
    //         }
    //         default: {
    //             Tools.Warn("Unsupported Attribute Component kind: " + attributeComponentKind);
    //             return;
    //         }
    //     }

    //     for (const vertexAttribute of vertexAttributes) {
    //         for (const component of vertexAttribute) {
    //             writeBinaryFunc(component);
    //         }
    //     }
    // }

    private _generateJSON(shouldUseGlb: boolean, bufferByteLength: number, fileName?: string, prettyPrint?: boolean): string {
        const buffer: IBuffer = { byteLength: bufferByteLength };
        let imageName: string;
        let imageData: { data: ArrayBuffer; mimeType: ImageMimeType };
        let bufferView: IBufferView;
        let byteOffset: number = bufferByteLength;

        if (buffer.byteLength) {
            this._glTF.buffers = [buffer];
        }
        if (this._nodes && this._nodes.length) {
            this._glTF.nodes = this._nodes;
        }
        if (this._meshes && this._meshes.length) {
            this._glTF.meshes = this._meshes;
        }
        if (this._scenes && this._scenes.length) {
            this._glTF.scenes = this._scenes;
            this._glTF.scene = 0;
        }
        if (this._cameras && this._cameras.length) {
            this._glTF.cameras = this._cameras;
        }
        if (this._bufferViews && this._bufferViews.length) {
            this._glTF.bufferViews = this._bufferViews;
        }
        if (this._accessors && this._accessors.length) {
            this._glTF.accessors = this._accessors;
        }
        if (this._animations && this._animations.length) {
            this._glTF.animations = this._animations;
        }
        if (this._materials && this._materials.length) {
            this._glTF.materials = this._materials;
        }
        if (this._textures && this._textures.length) {
            this._glTF.textures = this._textures;
        }
        if (this._samplers && this._samplers.length) {
            this._glTF.samplers = this._samplers;
        }
        if (this._skins && this._skins.length) {
            this._glTF.skins = this._skins;
        }
        if (this._images && this._images.length) {
            if (!shouldUseGlb) {
                this._glTF.images = this._images;
            } else {
                this._glTF.images = [];

                this._images.forEach((image) => {
                    if (image.uri) {
                        imageData = this._imageData[image.uri];
                        this._orderedImageData.push(imageData);
                        bufferView = createBufferView(0, byteOffset, imageData.data.byteLength, undefined);
                        byteOffset += imageData.data.byteLength;
                        this._bufferViews.push(bufferView);
                        image.bufferView = this._bufferViews.length - 1;
                        image.name = imageName;
                        image.mimeType = imageData.mimeType;
                        image.uri = undefined;
                        this._glTF.images!.push(image);
                    }
                });

                // Replace uri with bufferview and mime type for glb
                buffer.byteLength = byteOffset;
            }
        }

        if (!shouldUseGlb) {
            buffer.uri = fileName + ".bin";
        }

        return prettyPrint ? JSON.stringify(this._glTF, null, 2) : JSON.stringify(this._glTF);
    }

    public async generateGLTFAsync(glTFPrefix: string): Promise<GLTFData> {
        const binaryBuffer = await this._generateBinaryAsync();

        this._extensionsOnExporting();
        const jsonText = this._generateJSON(false, binaryBuffer.byteLength, glTFPrefix, true);
        const bin = new Blob([binaryBuffer], { type: "application/octet-stream" });

        const glTFFileName = glTFPrefix + ".gltf";
        const glTFBinFile = glTFPrefix + ".bin";

        const container = new GLTFData();

        container.files[glTFFileName] = jsonText;
        container.files[glTFBinFile] = bin;

        if (this._imageData) {
            for (const image in this._imageData) {
                container.files[image] = new Blob([this._imageData[image].data], { type: this._imageData[image].mimeType });
            }
        }

        return container;
    }

    private async _generateBinaryAsync(): Promise<Uint8Array> {
        await this._exportSceneAsync();
        return this._dataWriter.getOutputData();
    }

    /**
     * Pads the number to a multiple of 4
     * @param num number to pad
     * @returns padded number
     */
    private _getPadding(num: number): number {
        const remainder = num % 4;
        const padding = remainder === 0 ? remainder : 4 - remainder;

        return padding;
    }

    public async generateGLBAsync(glTFPrefix: string): Promise<GLTFData> {
        const binaryBuffer = await this._generateBinaryAsync();

        this._extensionsOnExporting();
        const jsonText = this._generateJSON(true, binaryBuffer.byteLength);
        const glbFileName = glTFPrefix + ".glb";
        const headerLength = 12;
        const chunkLengthPrefix = 8;
        let jsonLength = jsonText.length;
        let encodedJsonText;
        let imageByteLength = 0;
        // make use of TextEncoder when available
        if (typeof TextEncoder !== "undefined") {
            const encoder = new TextEncoder();
            encodedJsonText = encoder.encode(jsonText);
            jsonLength = encodedJsonText.length;
        }
        for (let i = 0; i < this._orderedImageData.length; ++i) {
            imageByteLength += this._orderedImageData[i].data.byteLength;
        }
        const jsonPadding = this._getPadding(jsonLength);
        const binPadding = this._getPadding(binaryBuffer.byteLength);
        const imagePadding = this._getPadding(imageByteLength);

        const byteLength = headerLength + 2 * chunkLengthPrefix + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength + imagePadding;

        // header
        const headerBuffer = new ArrayBuffer(headerLength);
        const headerBufferView = new DataView(headerBuffer);
        headerBufferView.setUint32(0, 0x46546c67, true); //glTF
        headerBufferView.setUint32(4, 2, true); // version
        headerBufferView.setUint32(8, byteLength, true); // total bytes in file

        // json chunk
        const jsonChunkBuffer = new ArrayBuffer(chunkLengthPrefix + jsonLength + jsonPadding);
        const jsonChunkBufferView = new DataView(jsonChunkBuffer);
        jsonChunkBufferView.setUint32(0, jsonLength + jsonPadding, true);
        jsonChunkBufferView.setUint32(4, 0x4e4f534a, true);

        // json chunk bytes
        const jsonData = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix);
        // if TextEncoder was available, we can simply copy the encoded array
        if (encodedJsonText) {
            jsonData.set(encodedJsonText);
        } else {
            const blankCharCode = "_".charCodeAt(0);
            for (let i = 0; i < jsonLength; ++i) {
                const charCode = jsonText.charCodeAt(i);
                // if the character doesn't fit into a single UTF-16 code unit, just put a blank character
                if (charCode != jsonText.codePointAt(i)) {
                    jsonData[i] = blankCharCode;
                } else {
                    jsonData[i] = charCode;
                }
            }
        }

        // json padding
        const jsonPaddingView = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix + jsonLength);
        for (let i = 0; i < jsonPadding; ++i) {
            jsonPaddingView[i] = 0x20;
        }

        // binary chunk
        const binaryChunkBuffer = new ArrayBuffer(chunkLengthPrefix);
        const binaryChunkBufferView = new DataView(binaryChunkBuffer);
        binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + binPadding + imageByteLength + imagePadding, true);
        binaryChunkBufferView.setUint32(4, 0x004e4942, true);

        // binary padding
        const binPaddingBuffer = new ArrayBuffer(binPadding);
        const binPaddingView = new Uint8Array(binPaddingBuffer);
        for (let i = 0; i < binPadding; ++i) {
            binPaddingView[i] = 0;
        }

        const imagePaddingBuffer = new ArrayBuffer(imagePadding);
        const imagePaddingView = new Uint8Array(imagePaddingBuffer);
        for (let i = 0; i < imagePadding; ++i) {
            imagePaddingView[i] = 0;
        }

        const glbData = [headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer];

        // binary data
        for (let i = 0; i < this._orderedImageData.length; ++i) {
            glbData.push(this._orderedImageData[i].data);
        }

        glbData.push(binPaddingBuffer);

        glbData.push(imagePaddingBuffer);

        const glbFile = new Blob(glbData, { type: "application/octet-stream" });

        const container = new GLTFData();
        container.files[glbFileName] = glbFile;

        return container;
    }

    private _setNodeTransformation(node: INode, babylonTransformNode: TransformNode, convertToRightHanded: boolean): void {
        if (!babylonTransformNode.getPivotPoint().equalsToFloats(0, 0, 0)) {
            Tools.Warn("Pivot points are not supported in the glTF serializer");
        }

        if (!babylonTransformNode.position.equalsToFloats(0, 0, 0)) {
            const translation = TmpVectors.Vector3[0].copyFrom(babylonTransformNode.position);
            if (convertToRightHanded) {
                convertToRightHandedPosition(translation);
            }

            node.translation = translation.asArray();
        }

        if (!babylonTransformNode.scaling.equalsToFloats(1, 1, 1)) {
            node.scale = babylonTransformNode.scaling.asArray();
        }

        const rotationQuaternion = Quaternion.FromEulerAngles(babylonTransformNode.rotation.x, babylonTransformNode.rotation.y, babylonTransformNode.rotation.z);
        if (babylonTransformNode.rotationQuaternion) {
            rotationQuaternion.multiplyInPlace(babylonTransformNode.rotationQuaternion);
        }
        if (!Quaternion.IsIdentity(rotationQuaternion)) {
            if (convertToRightHanded) {
                convertToRightHandedRotation(rotationQuaternion);
            }

            node.rotation = rotationQuaternion.normalize().asArray();
        }
    }

    private _setCameraTransformation(node: INode, babylonCamera: Camera, convertToRightHanded: boolean): void {
        const translation = TmpVectors.Vector3[0];
        const rotation = TmpVectors.Quaternion[0];
        babylonCamera.getWorldMatrix().decompose(undefined, rotation, translation);

        if (!translation.equalsToFloats(0, 0, 0)) {
            if (convertToRightHanded) {
                convertToRightHandedPosition(translation);
            }

            node.translation = translation.asArray();
        }

        // Rotation by 180 as glTF has a different convention than Babylon.
        rotation.multiplyInPlace(rotation180Y);

        if (!Quaternion.IsIdentity(rotation)) {
            if (convertToRightHanded) {
                convertToRightHandedRotation(rotation);
            }

            node.rotation = rotation.asArray();
        }
    }

    // Export babylon cameras to glTF cameras
    private _listAvailableCameras(): void {
        for (const camera of this._babylonScene.cameras) {
            const glTFCamera: ICamera = {
                type: camera.mode === Camera.PERSPECTIVE_CAMERA ? CameraType.PERSPECTIVE : CameraType.ORTHOGRAPHIC,
            };

            if (camera.name) {
                glTFCamera.name = camera.name;
            }

            if (glTFCamera.type === CameraType.PERSPECTIVE) {
                glTFCamera.perspective = {
                    aspectRatio: camera.getEngine().getAspectRatio(camera),
                    yfov: camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED ? camera.fov : camera.fov * camera.getEngine().getAspectRatio(camera),
                    znear: camera.minZ,
                    zfar: camera.maxZ,
                };
            } else if (glTFCamera.type === CameraType.ORTHOGRAPHIC) {
                const halfWidth = camera.orthoLeft && camera.orthoRight ? 0.5 * (camera.orthoRight - camera.orthoLeft) : camera.getEngine().getRenderWidth() * 0.5;
                const halfHeight = camera.orthoBottom && camera.orthoTop ? 0.5 * (camera.orthoTop - camera.orthoBottom) : camera.getEngine().getRenderHeight() * 0.5;
                glTFCamera.orthographic = {
                    xmag: halfWidth,
                    ymag: halfHeight,
                    znear: camera.minZ,
                    zfar: camera.maxZ,
                };
            }
            this._camerasMap.set(camera, glTFCamera);
        }
    }

    // Cleanup unused cameras and assign index to nodes.
    private _exportAndAssignCameras(): void {
        for (const [, gltfCamera] of this._camerasMap) {
            const usedNodes = this._nodesCameraMap.get(gltfCamera);
            if (usedNodes !== undefined) {
                this._cameras.push(gltfCamera);
                for (const node of usedNodes) {
                    node.camera = this._cameras.length - 1;
                }
            }
        }
    }

    // Builds all skins in the skins array so nodes can reference it during node parsing.
    private _listAvailableSkeletons(): void {
        for (const skeleton of this._babylonScene.skeletons) {
            if (skeleton.bones.length <= 0) {
                continue;
            }

            const skin: ISkin = { joints: [] };
            //this._skins.push(skin);
            this._skinMap.set(skeleton, skin);
        }
    }

    private _exportAndAssignSkeletons() {
        for (const skeleton of this._babylonScene.skeletons) {
            if (skeleton.bones.length <= 0) {
                continue;
            }

            const skin = this._skinMap.get(skeleton);

            if (skin == undefined) {
                continue;
            }

            const boneIndexMap: { [index: number]: Bone } = {};
            const inverseBindMatrices: Matrix[] = [];

            let maxBoneIndex = -1;
            for (let i = 0; i < skeleton.bones.length; ++i) {
                const bone = skeleton.bones[i];
                const boneIndex = bone.getIndex() ?? i;
                if (boneIndex !== -1) {
                    boneIndexMap[boneIndex] = bone;
                    if (boneIndex > maxBoneIndex) {
                        maxBoneIndex = boneIndex;
                    }
                }
            }

            // Set joints index to scene node.
            for (let boneIndex = 0; boneIndex <= maxBoneIndex; ++boneIndex) {
                const bone = boneIndexMap[boneIndex];
                inverseBindMatrices.push(bone.getAbsoluteInverseBindMatrix());
                const transformNode = bone.getTransformNode();

                if (transformNode !== null) {
                    const nodeID = this._nodeMap.get(transformNode);
                    if (transformNode && nodeID !== null && nodeID !== undefined) {
                        skin.joints.push(nodeID);
                    } else {
                        Tools.Warn("Exporting a bone without a linked transform node is currently unsupported");
                    }
                } else {
                    Tools.Warn("Exporting a bone without a linked transform node is currently unsupported");
                }
            }

            // Nodes that use this skin.
            const skinedNodes = this._nodesSkinMap.get(skin);

            // Only create skeleton if it has at least one joint and is used by a mesh.
            if (skin.joints.length > 0 && skinedNodes !== undefined) {
                // create buffer view for inverse bind matrices
                const byteStride = 64; // 4 x 4 matrix of 32 bit float
                const byteLength = inverseBindMatrices.length * byteStride;
                const bufferViewOffset = this._dataWriter.byteOffset;
                const bufferView = createBufferView(0, bufferViewOffset, byteLength, undefined);
                this._bufferViews.push(bufferView);
                const bufferViewIndex = this._bufferViews.length - 1;
                const bindMatrixAccessor = createAccessor(bufferViewIndex, AccessorType.MAT4, AccessorComponentType.FLOAT, inverseBindMatrices.length, null, null);
                const inverseBindAccessorIndex = this._accessors.push(bindMatrixAccessor) - 1;
                skin.inverseBindMatrices = inverseBindAccessorIndex;
                inverseBindMatrices.forEach((mat) => {
                    mat.m.forEach((cell: number) => {
                        this._dataWriter.writeFloat32(cell);
                    });
                });

                this._skins.push(skin);
                for (const skinedNode of skinedNodes) {
                    skinedNode.skin = this._skins.length - 1;
                }
            }
        }
    }

    // /**
    //  * Creates a bufferview based on the vertices type for the Babylon mesh
    //  * @param babylonSubMesh The Babylon submesh that the morph target is applied to
    //  * @param meshPrimitive
    //  * @param babylonMorphTarget the morph target to be exported
    //  * @param dataWriter The buffer to write the bufferview data to
    //  */
    // private _setMorphTargetAttributes(babylonSubMesh: SubMesh, meshPrimitive: IMeshPrimitive, babylonMorphTarget: MorphTarget, dataWriter: DataWriter) {
    //     if (babylonMorphTarget) {
    //         if (!meshPrimitive.targets) {
    //             meshPrimitive.targets = [];
    //         }
    //         const target: { [attribute: string]: number } = {};
    //         const mesh = babylonSubMesh.getMesh() as Mesh;
    //         if (babylonMorphTarget.hasNormals) {
    //             const vertexNormals = mesh.getVerticesData(VertexBuffer.NormalKind, undefined, undefined, true)!;
    //             const morphNormals = babylonMorphTarget.getNormals()!;
    //             const count = babylonSubMesh.verticesCount;
    //             const byteStride = 12; // 3 x 4 byte floats
    //             const byteLength = count * byteStride;
    //             const bufferView = createBufferView(0, dataWriter.byteOffset, byteLength, byteStride);
    //             this._bufferViews.push(bufferView);

    //             const bufferViewIndex = this._bufferViews.length - 1;
    //             const accessor = createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, count, 0, null);
    //             this._accessors.push(accessor);
    //             target.NORMAL = this._accessors.length - 1;

    //             this.writeMorphTargetAttributeData(VertexBuffer.NormalKind, AccessorComponentType.FLOAT, babylonSubMesh, vertexNormals, morphNormals, byteStride / 4, dataWriter);
    //         }
    //         if (babylonMorphTarget.hasPositions) {
    //             const vertexPositions = mesh.getVerticesData(VertexBuffer.PositionKind, undefined, undefined, true)!;
    //             const morphPositions = babylonMorphTarget.getPositions()!;
    //             const count = babylonSubMesh.verticesCount;
    //             const byteStride = 12; // 3 x 4 byte floats
    //             const byteLength = count * byteStride;
    //             const bufferView = createBufferView(0, dataWriter.byteOffset, byteLength, byteStride);
    //             this._bufferViews.push(bufferView);

    //             const bufferViewIndex = this._bufferViews.length - 1;
    //             const minMax = { min: new Vector3(Infinity, Infinity, Infinity), max: new Vector3(-Infinity, -Infinity, -Infinity) };
    //             const accessor = createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, count, 0, null);
    //             this._accessors.push(accessor);
    //             target.POSITION = this._accessors.length - 1;

    //             this.writeMorphTargetAttributeData(
    //                 VertexBuffer.PositionKind,
    //                 AccessorComponentType.FLOAT,
    //                 babylonSubMesh,
    //                 vertexPositions,
    //                 morphPositions,
    //                 byteStride / 4,
    //                 dataWriter,
    //                 minMax
    //             );
    //             accessor.min = minMax.min!.asArray();
    //             accessor.max = minMax.max!.asArray();
    //         }
    //         if (babylonMorphTarget.hasTangents) {
    //             const vertexTangents = mesh.getVerticesData(VertexBuffer.TangentKind, undefined, undefined, true)!;
    //             const morphTangents = babylonMorphTarget.getTangents()!;
    //             const count = babylonSubMesh.verticesCount;
    //             const byteStride = 12; // 3 x 4 byte floats
    //             const byteLength = count * byteStride;
    //             const bufferView = createBufferView(0, dataWriter.byteOffset, byteLength, byteStride);
    //             this._bufferViews.push(bufferView);

    //             const bufferViewIndex = this._bufferViews.length - 1;
    //             const accessor = createAccessor(bufferViewIndex, AccessorType.VEC3, AccessorComponentType.FLOAT, count, 0, null);
    //             this._accessors.push(accessor);
    //             target.TANGENT = this._accessors.length - 1;

    //             this.writeMorphTargetAttributeData(
    //                 VertexBuffer.TangentKind,
    //                 AccessorComponentType.FLOAT,
    //                 babylonSubMesh,
    //                 vertexTangents,
    //                 morphTangents,
    //                 byteStride / 4,
    //                 dataWriter
    //             );
    //         }
    //         meshPrimitive.targets.push(target);
    //     }
    // }

    // /**
    //  * Sets data for the primitive attributes of each submesh
    //  * @param mesh glTF Mesh object to store the primitive attribute information
    //  * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
    //  * @param convertToRightHanded Whether to convert from left-handed to right-handed
    //  * @param dataWriter Buffer to write the attribute data to
    //  */
    // private _setPrimitiveAttributesAsync(mesh: IMesh, babylonTransformNode: TransformNode, convertToRightHanded: boolean, dataWriter: DataWriter): Promise<void> {
    //     const promises: Promise<IMeshPrimitive>[] = [];
    //     let bufferMesh: Nullable<Mesh> = null;
    //     let bufferView: IBufferView;
    //     let minMax: { min: Nullable<number[]>; max: Nullable<number[]> };

    //     if (babylonTransformNode instanceof Mesh) {
    //         bufferMesh = babylonTransformNode as Mesh;
    //     } else if (babylonTransformNode instanceof InstancedMesh) {
    //         bufferMesh = (babylonTransformNode as InstancedMesh).sourceMesh;
    //     }
    //     const attributeData: _IVertexAttributeData[] = [
    //         { kind: VertexBuffer.PositionKind, accessorType: AccessorType.VEC3, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 12 },
    //         { kind: VertexBuffer.NormalKind, accessorType: AccessorType.VEC3, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 12 },
    //         { kind: VertexBuffer.ColorKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
    //         { kind: VertexBuffer.TangentKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
    //         { kind: VertexBuffer.UVKind, accessorType: AccessorType.VEC2, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 8 },
    //         { kind: VertexBuffer.UV2Kind, accessorType: AccessorType.VEC2, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 8 },
    //         { kind: VertexBuffer.MatricesIndicesKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.UNSIGNED_SHORT, byteStride: 8 },
    //         { kind: VertexBuffer.MatricesIndicesExtraKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.UNSIGNED_SHORT, byteStride: 8 },
    //         { kind: VertexBuffer.MatricesWeightsKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
    //         { kind: VertexBuffer.MatricesWeightsExtraKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
    //     ];

    //     if (bufferMesh) {
    //         let indexBufferViewIndex: Nullable<number> = null;
    //         const primitiveMode = this._getMeshPrimitiveMode(bufferMesh);
    //         const vertexAttributeBufferViews: { [attributeKind: string]: number } = {};
    //         const morphTargetManager = bufferMesh.morphTargetManager;

    //         // For each BabylonMesh, create bufferviews for each 'kind'
    //         for (const attribute of attributeData) {
    //             const attributeKind = attribute.kind;
    //             const attributeComponentKind = attribute.accessorComponentType;
    //             if (bufferMesh.isVerticesDataPresent(attributeKind, true)) {
    //                 const vertexBuffer = this._getVertexBuffer(attributeKind, bufferMesh);
    //                 attribute.byteStride = vertexBuffer
    //                     ? vertexBuffer.getSize() * VertexBuffer.GetTypeByteLength(attribute.accessorComponentType)
    //                     : VertexBuffer.DeduceStride(attributeKind) * 4;
    //                 if (attribute.byteStride === 12) {
    //                     attribute.accessorType = AccessorType.VEC3;
    //                 }

    //                 this._createBufferViewKind(attributeKind, attributeComponentKind, babylonTransformNode, dataWriter, attribute.byteStride);
    //                 attribute.bufferViewIndex = this._bufferViews.length - 1;
    //                 vertexAttributeBufferViews[attributeKind] = attribute.bufferViewIndex;
    //             }
    //         }

    //         if (bufferMesh.getTotalIndices()) {
    //             const indices = bufferMesh.getIndices();
    //             if (indices) {
    //                 const byteLength = indices.length * 4;
    //                 bufferView = createBufferView(0, dataWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
    //                 this._bufferViews.push(bufferView);
    //                 indexBufferViewIndex = this._bufferViews.length - 1;

    //                 for (let k = 0, length = indices.length; k < length; ++k) {
    //                     dataWriter.setUInt32(indices[k]);
    //                 }
    //             }
    //         }

    //         if (bufferMesh.subMeshes) {
    //             // go through all mesh primitives (submeshes)
    //             for (const submesh of bufferMesh.subMeshes) {
    //                 let babylonMaterial = submesh.getMaterial() || bufferMesh.getScene().defaultMaterial;

    //                 let materialIndex: Nullable<number> = null;
    //                 if (babylonMaterial) {
    //                     if (bufferMesh instanceof LinesMesh) {
    //                         // get the color from the lines mesh and set it in the material
    //                         const material: IMaterial = {
    //                             name: bufferMesh.name + " material",
    //                         };
    //                         if (!bufferMesh.color.equals(Color3.White()) || bufferMesh.alpha < 1) {
    //                             material.pbrMetallicRoughness = {
    //                                 baseColorFactor: bufferMesh.color.asArray().concat([bufferMesh.alpha]),
    //                             };
    //                         }
    //                         this._materials.push(material);
    //                         materialIndex = this._materials.length - 1;
    //                     } else if (babylonMaterial instanceof MultiMaterial) {
    //                         const subMaterial = babylonMaterial.subMaterials[submesh.materialIndex];
    //                         if (subMaterial) {
    //                             babylonMaterial = subMaterial;
    //                             materialIndex = this._materialMap[babylonMaterial.uniqueId];
    //                         }
    //                     } else {
    //                         materialIndex = this._materialMap[babylonMaterial.uniqueId];
    //                     }
    //                 }

    //                 const glTFMaterial: Nullable<IMaterial> = materialIndex != null ? this._materials[materialIndex] : null;

    //                 const meshPrimitive: IMeshPrimitive = { attributes: {} };
    //                 this._setPrimitiveMode(meshPrimitive, primitiveMode);

    //                 for (const attribute of attributeData) {
    //                     const attributeKind = attribute.kind;
    //                     if ((attributeKind === VertexBuffer.UVKind || attributeKind === VertexBuffer.UV2Kind) && !this._options.exportUnusedUVs) {
    //                         if (!glTFMaterial || !this._glTFMaterialExporter._hasTexturesPresent(glTFMaterial)) {
    //                             continue;
    //                         }
    //                     }
    //                     const vertexData = bufferMesh.getVerticesData(attributeKind, undefined, undefined, true);
    //                     if (vertexData) {
    //                         const vertexBuffer = this._getVertexBuffer(attributeKind, bufferMesh);
    //                         if (vertexBuffer) {
    //                             const stride = vertexBuffer.getSize();
    //                             const bufferViewIndex = attribute.bufferViewIndex;
    //                             if (bufferViewIndex != undefined) {
    //                                 // check to see if bufferviewindex has a numeric value assigned.
    //                                 minMax = { min: null, max: null };
    //                                 if (attributeKind == VertexBuffer.PositionKind) {
    //                                     minMax = calculateMinMaxPositions(vertexData, 0, vertexData.length / stride);
    //                                 }
    //                                 const accessor = createAccessor(
    //                                     bufferViewIndex,
    //                                     attributeKind + " - " + babylonTransformNode.name,
    //                                     attribute.accessorType,
    //                                     attribute.accessorComponentType,
    //                                     vertexData.length / stride,
    //                                     0,
    //                                     minMax.min,
    //                                     minMax.max
    //                                 );
    //                                 this._accessors.push(accessor);
    //                                 this._setAttributeKind(meshPrimitive, attributeKind);
    //                             }
    //                         }
    //                     }
    //                 }

    //                 if (indexBufferViewIndex) {
    //                     // Create accessor
    //                     const accessor = createAccessor(
    //                         indexBufferViewIndex,
    //                         "indices - " + babylonTransformNode.name,
    //                         AccessorType.SCALAR,
    //                         AccessorComponentType.UNSIGNED_INT,
    //                         submesh.indexCount,
    //                         submesh.indexStart * 4,
    //                         null,
    //                         null
    //                     );
    //                     this._accessors.push(accessor);
    //                     meshPrimitive.indices = this._accessors.length - 1;
    //                 }

    //                 if (Object.keys(meshPrimitive.attributes).length > 0) {
    //                     const sideOrientation = bufferMesh.overrideMaterialSideOrientation !== null ? bufferMesh.overrideMaterialSideOrientation : babylonMaterial.sideOrientation;

    //                     if (sideOrientation === (this._babylonScene.useRightHandedSystem ? Material.ClockWiseSideOrientation : Material.CounterClockWiseSideOrientation)) {
    //                         let byteOffset = indexBufferViewIndex != null ? this._bufferViews[indexBufferViewIndex].byteOffset : null;
    //                         if (byteOffset == null) {
    //                             byteOffset = 0;
    //                         }
    //                         let babylonIndices: Nullable<IndicesArray> = null;
    //                         if (indexBufferViewIndex != null) {
    //                             babylonIndices = bufferMesh.getIndices();
    //                         }
    //                         if (babylonIndices) {
    //                             this._reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, dataWriter);
    //                         } else {
    //                             for (const attribute of attributeData) {
    //                                 const vertexData = bufferMesh.getVerticesData(attribute.kind, undefined, undefined, true);
    //                                 if (vertexData) {
    //                                     const byteOffset = this._bufferViews[vertexAttributeBufferViews[attribute.kind]].byteOffset || 0;
    //                                     this._reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, attribute.kind, vertexData, byteOffset, dataWriter);
    //                                 }
    //                             }
    //                         }
    //                     }

    //                     if (materialIndex != null) {
    //                         meshPrimitive.material = materialIndex;
    //                     }
    //                 }
    //                 if (morphTargetManager) {
    //                     // By convention, morph target names are stored in the mesh extras.
    //                     if (!mesh.extras) {
    //                         mesh.extras = {};
    //                     }
    //                     mesh.extras.targetNames = [];

    //                     for (let i = 0; i < morphTargetManager.numTargets; ++i) {
    //                         const target = morphTargetManager.getTarget(i);
    //                         this._setMorphTargetAttributes(submesh, meshPrimitive, target, dataWriter);
    //                         mesh.extras.targetNames.push(target.name);
    //                     }
    //                 }

    //                 mesh.primitives.push(meshPrimitive);

    //                 this._extensionsPostExportMeshPrimitiveAsync("postExport", meshPrimitive, submesh, dataWriter);
    //                 promises.push();
    //             }
    //         }
    //     }
    //     return Promise.all(promises).then(() => {
    //         /* do nothing */
    //     });
    // }

    private async _exportSceneAsync(): Promise<void> {
        const scene: IScene = { nodes: [] };

        // Scene metadata
        if (this._babylonScene.metadata) {
            if (this._options.metadataSelector) {
                scene.extras = this._options.metadataSelector(this._babylonScene.metadata);
            } else if (this._babylonScene.metadata.gltf) {
                scene.extras = this._babylonScene.metadata.gltf.extras;
            }
        }

        // TODO:
        // deal with this from the loader:
        //  babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
        //  babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;

        const rootNodesRH = new Array<Node>();
        const rootNodesLH = new Array<Node>();

        for (const rootNode of this._babylonScene.rootNodes) {
            if (this._options.removeNoopRootNodes && !this._options.includeCoordinateSystemConversionNodes && isNoopNode(rootNode, this._babylonScene.useRightHandedSystem)) {
                rootNodesRH.push(...rootNode.getChildren());
            } else if (this._babylonScene.useRightHandedSystem) {
                rootNodesRH.push(rootNode);
            } else {
                rootNodesLH.push(rootNode);
            }
        }

        this._listAvailableCameras();
        this._listAvailableSkeletons();

        // await this._materialExporter.convertMaterialsToGLTFAsync(this._getMaterials(nodes));
        scene.nodes.push(...(await this._exportNodesAsync(rootNodesLH, true, this._options.userUint16SkinIndex)));
        scene.nodes.push(...(await this._exportNodesAsync(rootNodesRH, false, this._options.userUint16SkinIndex)));
        this._scenes.push(scene);

        this._exportAndAssignCameras();
        this._exportAndAssignSkeletons();

        if (this._babylonScene.animationGroups.length) {
            _GLTFAnimation._CreateNodeAndMorphAnimationFromAnimationGroups(
                this._babylonScene,
                this._animations,
                this._nodeMap,
                this._dataWriter,
                this._bufferViews,
                this._accessors,
                this._animationSampleRate,
                this._babylonScene.useRightHandedSystem
            );
        }

        //     return this._exportNodesAndAnimationsAsync(nodes, convertToRightHandedMap, dataWriter).then((nodeMap) => {
        //         return this._createSkinsAsync(nodeMap, dataWriter).then((skinMap) => {
        //             for (const babylonNode of nodes) {
        //                 const glTFNodeIndex = nodeMap[babylonNode.uniqueId];
        //                 if (glTFNodeIndex !== undefined) {
        //                     const glTFNode = this._nodes[glTFNodeIndex];

        //                     if (babylonNode.metadata) {
        //                         if (this._options.metadataSelector) {
        //                             glTFNode.extras = this._options.metadataSelector(babylonNode.metadata);
        //                         } else if (babylonNode.metadata.gltf) {
        //                             glTFNode.extras = babylonNode.metadata.gltf.extras;
        //                         }
        //                     }

        //                     if (babylonNode instanceof Camera) {
        //                         glTFNode.camera = cameraMap.get(babylonNode);
        //                     }

        //                     if (!babylonNode.parent || removedRootNodes.has(babylonNode.parent)) {
        //                         scene.nodes.push(glTFNodeIndex);
        //                     }

        //                     if (babylonNode instanceof Mesh) {
        //                         if (babylonNode.skeleton) {
        //                             glTFNode.skin = skinMap[babylonNode.skeleton.uniqueId];
        //                         }
        //                     }

        //                     const directDescendents = babylonNode.getDescendants(true);
        //                     if (!glTFNode.children && directDescendents && directDescendents.length) {
        //                         const children: number[] = [];
        //                         for (const descendent of directDescendents) {
        //                             if (nodeMap[descendent.uniqueId] != null) {
        //                                 children.push(nodeMap[descendent.uniqueId]);
        //                             }
        //                         }
        //                         if (children.length) {
        //                             glTFNode.children = children;
        //                         }
        //                     }
        //                 }
        //             }

        //             if (scene.nodes.length) {
        //                 this._scenes.push(scene);
        //             }
        //         });
        //     });
        // });
    }

    private _shouldExportNode(babylonNode: Node): boolean {
        let result = this._shouldExportNodeMap.get(babylonNode);

        if (result === undefined) {
            result = this._options.shouldExportNode(babylonNode);
            this._shouldExportNodeMap.set(babylonNode, result);
        }

        return result;
    }

    private async _exportNodesAsync(babylonRootNodes: Node[], convertToRightHanded: boolean, useUint16SkinIndex: boolean): Promise<number[]> {
        const nodes = new Array<number>();
        const state = new ExporterState(convertToRightHanded, useUint16SkinIndex);

        this._exportBuffers(babylonRootNodes, convertToRightHanded, state);

        for (const babylonNode of babylonRootNodes) {
            if (this._shouldExportNode(babylonNode)) {
                nodes.push(await this._exportNodeAsync(babylonNode, state, convertToRightHanded));
            }
        }

        return nodes;
    }

    private _collectBuffers(
        babylonNode: Node,
        bufferToVertexBuffersMap: Map<Buffer, VertexBuffer[]>,
        vertexBufferToMeshesMap: Map<VertexBuffer, Mesh[]>,
        morphTargetsToMeshesMap: Map<MorphTarget, Mesh[]>,
        state: ExporterState
    ): void {
        if (!this._shouldExportNode(babylonNode)) {
            return;
        }

        if (babylonNode instanceof Mesh && babylonNode.geometry) {
            const vertexBuffers = babylonNode.geometry.getVertexBuffers();
            if (vertexBuffers) {
                for (const kind in vertexBuffers) {
                    const vertexBuffer = vertexBuffers[kind];
                    state.setHasVertexColorAlpha(vertexBuffer, babylonNode.hasVertexAlpha);
                    const buffer = vertexBuffer._buffer;
                    const vertexBufferArray = bufferToVertexBuffersMap.get(buffer) || [];
                    bufferToVertexBuffersMap.set(buffer, vertexBufferArray);
                    if (vertexBufferArray.indexOf(vertexBuffer) === -1) {
                        vertexBufferArray.push(vertexBuffer);
                    }

                    const meshes = vertexBufferToMeshesMap.get(vertexBuffer) || [];
                    vertexBufferToMeshesMap.set(vertexBuffer, meshes);
                    if (meshes.indexOf(babylonNode) === -1) {
                        meshes.push(babylonNode);
                    }
                }
            }

            const morphTargetManager = babylonNode.morphTargetManager;

            if (morphTargetManager) {
                for (let morphIndex = 0; morphIndex < morphTargetManager.numTargets; morphIndex++) {
                    const morphTarget = morphTargetManager.getTarget(morphIndex);

                    const meshes = morphTargetsToMeshesMap.get(morphTarget) || [];
                    morphTargetsToMeshesMap.set(morphTarget, meshes);
                    if (meshes.indexOf(babylonNode) === -1) {
                        meshes.push(babylonNode);
                    }
                }
            }
        }

        for (const babylonChildNode of babylonNode.getChildren()) {
            this._collectBuffers(babylonChildNode, bufferToVertexBuffersMap, vertexBufferToMeshesMap, morphTargetsToMeshesMap, state);
        }
    }

    private _exportBuffers(babylonRootNodes: Node[], convertToRightHanded: boolean, state: ExporterState): void {
        const bufferToVertexBuffersMap = new Map<Buffer, VertexBuffer[]>();
        const vertexBufferToMeshesMap = new Map<VertexBuffer, Mesh[]>();
        const morphTagetsMeshesMap = new Map<MorphTarget, Mesh[]>();

        for (const babylonNode of babylonRootNodes) {
            this._collectBuffers(babylonNode, bufferToVertexBuffersMap, vertexBufferToMeshesMap, morphTagetsMeshesMap, state);
        }

        for (const [buffer, vertexBuffers] of bufferToVertexBuffersMap) {
            const data = buffer.getData();
            if (!data) {
                throw new Error("Buffer data is not available");
            }

            const byteStride = vertexBuffers[0].byteStride;
            if (vertexBuffers.some((vertexBuffer) => vertexBuffer.byteStride !== byteStride)) {
                throw new Error("Vertex buffers pointing to the same buffer must have the same byte stride");
            }

            const bytes = dataArrayToUint8Array(data).slice();

            // Normalize normals and tangents.
            for (const vertexBuffer of vertexBuffers) {
                switch (vertexBuffer.getKind()) {
                    case VertexBuffer.NormalKind:
                    case VertexBuffer.TangentKind: {
                        for (const mesh of vertexBufferToMeshesMap.get(vertexBuffer)!) {
                            const { byteOffset, byteStride, type, normalized } = vertexBuffer;
                            const size = vertexBuffer.getSize();
                            enumerateFloatValues(bytes, byteOffset, byteStride, size, type, mesh.getTotalVertices() * size, normalized, (values) => {
                                const invLength = 1 / Math.sqrt(values[0] * values[0] + values[1] * values[1] + values[2] * values[2]);
                                values[0] *= invLength;
                                values[1] *= invLength;
                                values[2] *= invLength;
                            });
                        }
                    }
                }
            }

            // Performs coordinate conversion if needed (only for position, normal and tanget).
            if (convertToRightHanded) {
                for (const vertexBuffer of vertexBuffers) {
                    switch (vertexBuffer.getKind()) {
                        case VertexBuffer.PositionKind:
                        case VertexBuffer.NormalKind:
                        case VertexBuffer.TangentKind: {
                            for (const mesh of vertexBufferToMeshesMap.get(vertexBuffer)!) {
                                const { byteOffset, byteStride, type, normalized } = vertexBuffer;
                                const size = vertexBuffer.getSize();
                                enumerateFloatValues(bytes, byteOffset, byteStride, size, type, mesh.getTotalVertices() * size, normalized, (values) => {
                                    values[0] = -values[0];
                                });
                            }
                        }
                    }
                }

                // Save converted bytes for min/max computation.
                state.convertedToRightHandedBuffers.set(buffer, bytes);
            }

            const byteOffset = this._dataWriter.byteOffset;
            this._dataWriter.writeUint8Array(bytes);
            this._bufferViews.push(createBufferView(0, byteOffset, bytes.length, byteStride));
            state.setVertexBufferView(buffer, this._bufferViews.length - 1);

            const floatMatricesIndices = new Map<VertexBuffer, FloatArray>();

            // If buffers are of type MatricesWeightsKind and have float values, we need to create a new buffer instead.
            for (const vertexBuffer of vertexBuffers) {
                switch (vertexBuffer.getKind()) {
                    case VertexBuffer.MatricesIndicesKind:
                    case VertexBuffer.MatricesIndicesExtraKind: {
                        if (vertexBuffer.type == VertexBuffer.FLOAT) {
                            for (const mesh of vertexBufferToMeshesMap.get(vertexBuffer)!) {
                                const floatData = vertexBuffer.getFloatData(mesh.getTotalVertices());
                                if (floatData !== null) {
                                    floatMatricesIndices.set(vertexBuffer, floatData);
                                }
                            }
                        }
                    }
                }
            }

            if (floatMatricesIndices.size !== 0) {
                Logger.Warn(
                    `Joints conversion needed: some joints are stored as floats in Babylon but GLTF requires UNSIGNED BYTES. We will perform the conversion but this might lead to unused data in the buffer.`
                );
            }

            for (const [vertexBuffer, array] of floatMatricesIndices) {
                const byteOffset = this._dataWriter.byteOffset;
                if (state.userUint16SkinIndex) {
                    const newArray = new Uint16Array(array.length);
                    for (let index = 0; index < array.length; index++) {
                        newArray[index] = array[index];
                    }
                    this._dataWriter.writeUint16Array(newArray);
                    this._bufferViews.push(createBufferView(0, byteOffset, newArray.byteLength, 4 * 2));
                } else {
                    const newArray = new Uint8Array(array.length);
                    for (let index = 0; index < array.length; index++) {
                        newArray[index] = array[index];
                    }
                    this._dataWriter.writeUint8Array(newArray);
                    this._bufferViews.push(createBufferView(0, byteOffset, newArray.byteLength, 4));
                }

                state.setRemappedBufferView(buffer, vertexBuffer, this._bufferViews.length - 1);
            }
        }

        for (const [morphTarget, meshes] of morphTagetsMeshesMap) {
            const glTFMorphTarget = buildMorphTargetBuffers(morphTarget, this._dataWriter, this._bufferViews, this._accessors, convertToRightHanded);

            for (const mesh of meshes) {
                state.bindMorphDataToMesh(mesh, glTFMorphTarget);
            }
        }
    }

    private async _exportNodeAsync(babylonNode: Node, state: ExporterState, convertToRightHanded: boolean): Promise<number> {
        let nodeIndex = this._nodeMap.get(babylonNode);
        if (nodeIndex !== undefined) {
            return nodeIndex;
        }

        const node: INode = {};
        nodeIndex = this._nodes.length;
        this._nodes.push(node);
        this._nodeMap.set(babylonNode, nodeIndex);

        if (babylonNode.name) {
            node.name = babylonNode.name;
        }

        if (babylonNode instanceof TransformNode) {
            this._setNodeTransformation(node, babylonNode, state.convertToRightHanded);

            if (babylonNode instanceof Mesh || babylonNode instanceof InstancedMesh) {
                const babylonMesh = babylonNode instanceof Mesh ? babylonNode : babylonNode.sourceMesh;
                if (babylonMesh.subMeshes && babylonMesh.subMeshes.length > 0) {
                    node.mesh = await this._exportMeshAsync(babylonMesh, state, convertToRightHanded);
                }

                if (babylonNode.skeleton) {
                    const skin = this._skinMap.get(babylonNode.skeleton);

                    if (skin !== undefined) {
                        if (this._nodesSkinMap.get(skin) === undefined) {
                            this._nodesSkinMap.set(skin, []);
                        }

                        this._nodesSkinMap.get(skin)?.push(node);
                    }
                }
            } else {
                // TODO: handle other Babylon node types
            }
        }

        if (babylonNode instanceof Camera) {
            const gltfCamera = this._camerasMap.get(babylonNode);

            if (gltfCamera) {
                if (this._nodesCameraMap.get(gltfCamera) === undefined) {
                    this._nodesCameraMap.set(gltfCamera, []);
                }

                this._nodesCameraMap.get(gltfCamera)?.push(node);
                this._setCameraTransformation(node, babylonNode, convertToRightHanded);
            }
        }

        for (const babylonChildNode of babylonNode.getChildren()) {
            if (this._shouldExportNode(babylonChildNode)) {
                node.children ||= [];
                node.children.push(await this._exportNodeAsync(babylonChildNode, state, convertToRightHanded));
            }
        }

        const runtimeGLTFAnimation: IAnimation = {
            name: "runtime animations",
            channels: [],
            samplers: [],
        };
        const idleGLTFAnimations: IAnimation[] = [];

        if (!this._babylonScene.animationGroups.length) {
            _GLTFAnimation._CreateMorphTargetAnimationFromMorphTargetAnimations(
                babylonNode,
                runtimeGLTFAnimation,
                idleGLTFAnimations,
                this._nodeMap,
                this._nodes,
                this._dataWriter,
                this._bufferViews,
                this._accessors,
                this._animationSampleRate,
                convertToRightHanded,
                this._options.shouldExportAnimation
            );
            if (babylonNode.animations.length) {
                _GLTFAnimation._CreateNodeAnimationFromNodeAnimations(
                    babylonNode,
                    runtimeGLTFAnimation,
                    idleGLTFAnimations,
                    this._nodeMap,
                    this._nodes,
                    this._dataWriter,
                    this._bufferViews,
                    this._accessors,
                    this._animationSampleRate,
                    convertToRightHanded,
                    this._options.shouldExportAnimation
                );
            }
        }

        return nodeIndex;
    }

    private _exportIndices(
        indices: Nullable<IndicesArray>,
        start: number,
        count: number,
        offset: number,
        fillMode: number,
        sideOrientation: number,
        state: ExporterState,
        primitive: IMeshPrimitive,
        convertToRightHanded: boolean
    ): void {
        const is32Bits = areIndices32Bits(indices, count);
        let indicesToExport = indices;

        primitive.mode = getPrimitiveMode(fillMode);

        // Flip if triangle winding order is not CCW as glTF is always CCW.
        const flip = isTriangleFillMode(fillMode) && sideOrientation !== Material.CounterClockWiseSideOrientation;
        if ((flip && !convertToRightHanded) || (!flip && convertToRightHanded)) {
            if (fillMode === Material.TriangleStripDrawMode || fillMode === Material.TriangleFanDrawMode) {
                throw new Error("Triangle strip/fan fill mode is not implemented");
            }

            primitive.mode = getPrimitiveMode(fillMode);

            const newIndices = is32Bits ? new Uint32Array(count) : new Uint16Array(count);

            if (indices) {
                for (let i = 0; i + 2 < count; i += 3) {
                    newIndices[i] = indices[start + i] + offset;
                    newIndices[i + 1] = indices[start + i + 2] + offset;
                    newIndices[i + 2] = indices[start + i + 1] + offset;
                }
            } else {
                for (let i = 0; i + 2 < count; i += 3) {
                    newIndices[i] = i;
                    newIndices[i + 1] = i + 2;
                    newIndices[i + 2] = i + 1;
                }
            }

            indicesToExport = newIndices;
        } else if (indices && offset !== 0) {
            const newIndices = is32Bits ? new Uint32Array(count) : new Uint16Array(count);
            for (let i = 0; i < count; i++) {
                newIndices[i] = indices[start + i] + offset;
            }

            indicesToExport = newIndices;
        }

        if (indicesToExport) {
            let accessorIndex = state.getIndicesAccessor(indices, start, count, offset, flip);
            if (accessorIndex === undefined) {
                const bufferViewByteOffset = this._dataWriter.byteOffset;
                const bytes = indicesArrayToUint8Array(indicesToExport, start, count, is32Bits);
                this._dataWriter.writeUint8Array(bytes);
                this._bufferViews.push(createBufferView(0, bufferViewByteOffset, bytes.length));
                const bufferViewIndex = this._bufferViews.length - 1;

                const componentType = is32Bits ? AccessorComponentType.UNSIGNED_INT : AccessorComponentType.UNSIGNED_SHORT;
                this._accessors.push(createAccessor(bufferViewIndex, AccessorType.SCALAR, componentType, count, 0));
                accessorIndex = this._accessors.length - 1;
                state.setIndicesAccessor(indices, start, count, offset, flip, accessorIndex);
            }

            primitive.indices = accessorIndex;
        }
    }

    private _exportVertexBuffer(vertexBuffer: VertexBuffer, babylonMaterial: Material, start: number, count: number, state: ExporterState, primitive: IMeshPrimitive): void {
        const kind = vertexBuffer.getKind();
        if (kind.startsWith("uv") && !this._options.exportUnusedUVs) {
            if (!babylonMaterial || !this._materialNeedsUVsSet.has(babylonMaterial)) {
                return;
            }
        }

        let accessorIndex = state.getVertexAccessor(vertexBuffer, start, count);

        if (accessorIndex === undefined) {
            // Get min/max from converted or original data.
            const data = state.convertedToRightHandedBuffers.get(vertexBuffer._buffer) || vertexBuffer._buffer.getData()!;
            const minMax = kind === VertexBuffer.PositionKind ? getMinMax(data, vertexBuffer, start, count) : null;

            if ((kind === VertexBuffer.MatricesIndicesKind || kind === VertexBuffer.MatricesIndicesExtraKind) && vertexBuffer.type === VertexBuffer.FLOAT) {
                const bufferViewIndex = state.getRemappedBufferView(vertexBuffer._buffer, vertexBuffer);
                if (bufferViewIndex !== undefined) {
                    const byteOffset = vertexBuffer.byteOffset + start * vertexBuffer.byteStride;
                    this._accessors.push(
                        createAccessor(bufferViewIndex, getAccessorType(kind, state.hasVertexColorAlpha(vertexBuffer)), VertexBuffer.UNSIGNED_BYTE, count, byteOffset, minMax)
                    );
                    accessorIndex = this._accessors.length - 1;
                    state.setVertexAccessor(vertexBuffer, start, count, accessorIndex);
                    primitive.attributes[getAttributeType(kind)] = accessorIndex;
                }
            } else {
                const bufferViewIndex = state.getVertexBufferView(vertexBuffer._buffer)!;
                const byteOffset = vertexBuffer.byteOffset + start * vertexBuffer.byteStride;
                this._accessors.push(createAccessor(bufferViewIndex, getAccessorType(kind, state.hasVertexColorAlpha(vertexBuffer)), vertexBuffer.type, count, byteOffset, minMax));
                accessorIndex = this._accessors.length - 1;
                state.setVertexAccessor(vertexBuffer, start, count, accessorIndex);
                primitive.attributes[getAttributeType(kind)] = accessorIndex;
            }
        }

        // TODO: StandardMaterial color spaces
        // probably have to create new buffer view to store new colors during collectBuffers and figure out if only standardMaterial is using it
        // separate map by color space
    }

    private async _exportMaterialAsync(babylonMaterial: Material, vertexBuffers: { [kind: string]: VertexBuffer }, subMesh: SubMesh, primitive: IMeshPrimitive): Promise<void> {
        let materialIndex = this._materialMap.get(babylonMaterial);
        if (materialIndex === undefined) {
            // TODO: Handle LinesMesh
            // if (babylonMesh instanceof LinesMesh) {
            //     const material: IMaterial = {
            //         name: babylonMaterial.name,
            //     };

            //     if (!babylonMesh.color.equals(Color3.White()) || babylonMesh.alpha < 1) {
            //         material.pbrMetallicRoughness = {
            //             baseColorFactor: [...babylonMesh.color.asArray(), babylonMesh.alpha],
            //         };
            //     }

            //     this._materials.push(material);
            //     materialIndex = this._materials.length - 1;
            // }

            const hasUVs = vertexBuffers && Object.keys(vertexBuffers).some((kind) => kind.startsWith("uv"));
            babylonMaterial = babylonMaterial instanceof MultiMaterial ? babylonMaterial.subMaterials[subMesh.materialIndex]! : babylonMaterial;
            if (babylonMaterial instanceof PBRMaterial) {
                materialIndex = await this._materialExporter.exportPBRMaterialAsync(babylonMaterial, ImageMimeType.PNG, hasUVs);
            } else if (babylonMaterial instanceof StandardMaterial) {
                materialIndex = await this._materialExporter.exportStandardMaterialAsync(babylonMaterial, ImageMimeType.PNG, hasUVs);
            } else {
                Logger.Warn(`Unsupported material '${babylonMaterial.name}' with type ${babylonMaterial.getClassName()}`);
                return;
            }

            this._materialMap.set(babylonMaterial, materialIndex);
        }

        primitive.material = materialIndex;
    }

    private async _exportMeshAsync(babylonMesh: Mesh, state: ExporterState, convertToRightHanded: boolean): Promise<number> {
        let meshIndex = state.getMesh(babylonMesh);
        if (meshIndex !== undefined) {
            return meshIndex;
        }

        const mesh: IMesh = { primitives: [] };
        meshIndex = this._meshes.length;
        this._meshes.push(mesh);
        state.setMesh(babylonMesh, meshIndex);

        const indices = babylonMesh.isUnIndexed ? null : babylonMesh.getIndices();
        const vertexBuffers = babylonMesh.geometry?.getVertexBuffers();
        const morphTargets = state.getMorphTargetsFromMesh(babylonMesh);

        const subMeshes = babylonMesh.subMeshes;
        if (vertexBuffers && subMeshes && subMeshes.length > 0) {
            for (const subMesh of subMeshes) {
                const primitive: IMeshPrimitive = { attributes: {} };

                // Material
                const babylonMaterial = subMesh.getMaterial() || this._babylonScene.defaultMaterial;
                await this._exportMaterialAsync(babylonMaterial, vertexBuffers, subMesh, primitive);

                // Index buffer
                const fillMode = babylonMesh.overrideRenderingFillMode ?? babylonMaterial.fillMode;
                const sideOrientation = babylonMaterial._getEffectiveOrientation(babylonMesh);
                this._exportIndices(indices, subMesh.indexStart, subMesh.indexCount, -subMesh.verticesStart, fillMode, sideOrientation, state, primitive, convertToRightHanded);

                // Vertex buffers
                for (const vertexBuffer of Object.values(vertexBuffers)) {
                    this._exportVertexBuffer(vertexBuffer, babylonMaterial, subMesh.verticesStart, subMesh.verticesCount, state, primitive);
                }

                mesh.primitives.push(primitive);

                if (morphTargets) {
                    primitive.targets = [];
                    for (const gltfMorphTarget of morphTargets) {
                        primitive.targets.push(gltfMorphTarget.attributes);
                    }
                }
            }
        }

        if (morphTargets) {
            mesh.weights = [];

            if (!mesh.extras) {
                mesh.extras = {};
            }
            mesh.extras.targetNames = [];

            for (const gltfMorphTarget of morphTargets) {
                mesh.weights.push(gltfMorphTarget.influence);
                mesh.extras.targetNames.push(gltfMorphTarget.name);
            }
        }

        return meshIndex;
    }

    // const promise = this._extensionsPostExportNodeAsync("createNodeAsync", node, babylonNode, nodeMap);
    //         if (promise == null) {
    //             Tools.Warn(`Not exporting node ${babylonNode.name}`);
    //             return Promise.resolve();
    //         } else {
    //             return promise.then((node) => {
    //                 if (!node) {
    //                     return;
    //                 }

    // if (!this._babylonScene.animationGroups.length) {
    //     _GLTFAnimation._CreateMorphTargetAnimationFromMorphTargetAnimations(
    //         babylonNode,
    //         runtimeGLTFAnimation,
    //         idleGLTFAnimations,
    //         nodeMap,
    //         this._nodes,
    //         dataWriter,
    //         this._bufferViews,
    //         this._accessors,
    //         this._animationSampleRate,
    //         this._options.shouldExportAnimation
    //     );
    //     if (babylonNode.animations.length) {
    //         _GLTFAnimation._CreateNodeAnimationFromNodeAnimations(
    //             babylonNode,
    //             runtimeGLTFAnimation,
    //             idleGLTFAnimations,
    //             nodeMap,
    //             this._nodes,
    //             dataWriter,
    //             this._bufferViews,
    //             this._accessors,
    //             this._animationSampleRate,
    //             this._options.shouldExportAnimation
    //         );
    //     }
    // }
    //                 });
    //             }
    //         });
    //     });
    // }

    // return promise.then(() => {
    //     if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
    //         this._animations.push(runtimeGLTFAnimation);
    //     }
    //     idleGLTFAnimations.forEach((idleGLTFAnimation) => {
    //         if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
    //             this._animations.push(idleGLTFAnimation);
    //         }
    //     });

    //     if (this._babylonScene.animationGroups.length) {
    //         _GLTFAnimation._CreateNodeAndMorphAnimationFromAnimationGroups(
    //             this._babylonScene,
    //             this._animations,
    //             nodeMap,
    //             dataWriter,
    //             this._bufferViews,
    //             this._accessors,
    //             this._animationSampleRate,
    //             this._options.shouldExportAnimation
    //         );
    //     }

    //     return nodeMap;
    // });

    //     return nodeMap;
    // }
}
