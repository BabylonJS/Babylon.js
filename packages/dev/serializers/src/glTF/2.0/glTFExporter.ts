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
    ImageMimeType,
} from "babylonjs-gltf2interface";
import { AccessorComponentType, AccessorType, CameraType } from "babylonjs-gltf2interface";
import type { FloatArray, IndicesArray, Nullable } from "core/types";
import { TmpVectors, Quaternion } from "core/Maths/math.vector";
import type { Matrix } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";
import type { Buffer } from "core/Buffers/buffer";
import { VertexBuffer } from "core/Buffers/buffer";
import type { Node } from "core/node";
import { TransformNode } from "core/Meshes/transformNode";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Material } from "core/Materials/material";
import { Engine } from "core/Engines/engine";
import type { Scene } from "core/scene";
import { EngineStore } from "core/Engines/engineStore";

import type { IGLTFExporterExtensionV2 } from "./glTFExporterExtension";
import { GLTFMaterialExporter } from "./glTFMaterialExporter";
import type { IExportOptions } from "./glTFSerializer";
import { GLTFData } from "./glTFData";
import {
    ConvertToRightHandedPosition,
    ConvertToRightHandedRotation,
    DataArrayToUint8Array,
    GetAccessorType,
    GetAttributeType,
    GetMinMax,
    GetPrimitiveMode,
    IsTriangleFillMode,
    IsChildCollapsible,
    FloatsNeed16BitInteger,
    IsStandardVertexAttribute,
    IndicesArrayToTypedArray,
    GetVertexBufferInfo,
    CollapseChildIntoParent,
    Rotate180Y,
    DefaultTranslation,
    DefaultScale,
    DefaultRotation,
    ConvertToRightHandedTransformMatrix,
} from "./glTFUtilities";
import { IsNoopNode } from "../../exportUtils";
import { BufferManager } from "./bufferManager";
import { Camera } from "core/Cameras/camera";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Logger } from "core/Misc/logger";
import { EnumerateFloatValues, AreIndices32Bits } from "core/Buffers/bufferUtils";
import type { Bone, Skeleton } from "core/Bones";
import { _GLTFAnimation } from "./glTFAnimation";
import type { MorphTarget } from "core/Morph";
import { BuildMorphTargetBuffers } from "./glTFMorphTargetsUtilities";
import type { IMorphTargetData } from "./glTFMorphTargetsUtilities";
import { LinesMesh } from "core/Meshes/linesMesh";
import { GreasedLineBaseMesh } from "core/Meshes/GreasedLine/greasedLineBaseMesh";
import { Color3, Color4 } from "core/Maths/math.color";
import { TargetCamera } from "core/Cameras/targetCamera";
import { Epsilon } from "core/Maths/math.constants";
import { DataWriter } from "./dataWriter";
import { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";

class ExporterState {
    // Babylon indices array, start, count, offset, flip -> glTF accessor index
    private _indicesAccessorMap = new Map<Nullable<IndicesArray>, Map<number, Map<number, Map<number, Map<boolean, number>>>>>();

    // Babylon buffer -> glTF buffer view
    private _vertexBufferViewMap = new Map<Buffer, IBufferView>();

    // Babylon vertex buffer, start, count -> glTF accessor index
    private _vertexAccessorMap = new Map<VertexBuffer, Map<number, Map<number, number>>>();

    private _remappedBufferView = new Map<Buffer, Map<VertexBuffer, IBufferView>>();

    private _meshMorphTargetMap = new Map<AbstractMesh, IMorphTargetData[]>();

    private _vertexMapColorAlpha = new Map<VertexBuffer, boolean>();

    private _exportedNodes = new Set<Node>();

    // Babylon mesh -> glTF mesh index
    private _meshMap = new Map<AbstractMesh, number>();

    public constructor(convertToRightHanded: boolean, wasAddedByNoopNode: boolean) {
        this.convertToRightHanded = convertToRightHanded;
        this.wasAddedByNoopNode = wasAddedByNoopNode;
    }

    public readonly convertToRightHanded: boolean;

    public readonly wasAddedByNoopNode: boolean;

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

    public pushExportedNode(node: Node) {
        if (!this._exportedNodes.has(node)) {
            this._exportedNodes.add(node);
        }
    }

    public getNodesSet(): Set<Node> {
        return this._exportedNodes;
    }

    public getVertexBufferView(buffer: Buffer): IBufferView | undefined {
        return this._vertexBufferViewMap.get(buffer);
    }

    public setVertexBufferView(buffer: Buffer, bufferView: IBufferView): void {
        this._vertexBufferViewMap.set(buffer, bufferView);
    }

    public setRemappedBufferView(buffer: Buffer, vertexBuffer: VertexBuffer, bufferView: IBufferView) {
        this._remappedBufferView.set(buffer, new Map<VertexBuffer, IBufferView>());
        this._remappedBufferView.get(buffer)!.set(vertexBuffer, bufferView);
    }

    public getRemappedBufferView(buffer: Buffer, vertexBuffer: VertexBuffer): IBufferView | undefined {
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

    public getMesh(mesh: AbstractMesh): number | undefined {
        return this._meshMap.get(mesh);
    }

    public setMesh(mesh: AbstractMesh, meshIndex: number): void {
        this._meshMap.set(mesh, meshIndex);
    }

    public bindMorphDataToMesh(mesh: AbstractMesh, morphData: IMorphTargetData) {
        const morphTargets = this._meshMorphTargetMap.get(mesh) || [];
        this._meshMorphTargetMap.set(mesh, morphTargets);
        if (morphTargets.indexOf(morphData) === -1) {
            morphTargets.push(morphData);
        }
    }

    public getMorphTargetsFromMesh(mesh: AbstractMesh): IMorphTargetData[] | undefined {
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

    /**
     * Baked animation sample rate
     */
    private _animationSampleRate: number;

    private readonly _options: Required<IExportOptions>;

    public _shouldUseGlb: boolean = false;

    public readonly _materialExporter = new GLTFMaterialExporter(this);

    private readonly _extensions: { [name: string]: IGLTFExporterExtensionV2 } = {};

    public readonly _bufferManager = new BufferManager();

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

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/promise-function-async
    private _ApplyExtension<T>(
        node: T,
        extensions: IGLTFExporterExtensionV2[],
        index: number,
        actionAsync: (extension: IGLTFExporterExtensionV2, node: T) => Promise<Nullable<T>> | undefined
    ): Promise<Nullable<T>> {
        if (index >= extensions.length) {
            return Promise.resolve(node);
        }

        const currentPromise = actionAsync(extensions[index], node);

        if (!currentPromise) {
            return this._ApplyExtension(node, extensions, index + 1, actionAsync);
        }

        // eslint-disable-next-line github/no-then
        return currentPromise.then(async (newNode) => (newNode ? await this._ApplyExtension(newNode, extensions, index + 1, actionAsync) : null));
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/promise-function-async
    private _ApplyExtensions<T>(node: T, actionAsync: (extension: IGLTFExporterExtensionV2, node: T) => Promise<Nullable<T>> | undefined): Promise<Nullable<T>> {
        const extensions: IGLTFExporterExtensionV2[] = [];
        for (const name of GLTFExporter._ExtensionNames) {
            extensions.push(this._extensions[name]);
        }

        return this._ApplyExtension(node, extensions, 0, actionAsync);
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    public _extensionsPostExportNodeAsync(context: string, node: INode, babylonNode: Node, nodeMap: Map<Node, number>, convertToRightHanded: boolean): Promise<Nullable<INode>> {
        return this._ApplyExtensions(
            node,
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            (extension, node) => extension.postExportNodeAsync && extension.postExportNodeAsync(context, node, babylonNode, nodeMap, convertToRightHanded, this._bufferManager)
        );
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    public _extensionsPostExportMaterialAsync(context: string, material: IMaterial, babylonMaterial: Material): Promise<Nullable<IMaterial>> {
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        return this._ApplyExtensions(material, (extension, node) => extension.postExportMaterialAsync && extension.postExportMaterialAsync(context, node, babylonMaterial));
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

    public _extensionsPostExportMeshPrimitive(primitive: IMeshPrimitive): void {
        for (const name of GLTFExporter._ExtensionNames) {
            const extension = this._extensions[name];

            if (extension.postExportMeshPrimitive) {
                extension.postExportMeshPrimitive(primitive, this._bufferManager, this._accessors);
            }
        }
    }

    public async _extensionsPreGenerateBinaryAsync(): Promise<void> {
        for (const name of GLTFExporter._ExtensionNames) {
            const extension = this._extensions[name];

            if (extension.preGenerateBinaryAsync) {
                // eslint-disable-next-line no-await-in-loop
                await extension.preGenerateBinaryAsync(this._bufferManager);
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

                this._glTF.extensions ||= {};
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
            metadataSelector: (metadata) => metadata?.gltf?.extras,
            animationSampleRate: 1 / 60,
            exportWithoutWaitingForScene: false,
            exportUnusedUVs: false,
            removeNoopRootNodes: true,
            includeCoordinateSystemConversionNodes: false,
            meshCompressionMethod: "None",
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

    private _generateJSON(bufferByteLength: number, fileName?: string, prettyPrint?: boolean): string {
        const buffer: IBuffer = { byteLength: bufferByteLength };

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
            this._glTF.images = this._images;
        }

        if (!this._shouldUseGlb) {
            buffer.uri = fileName + ".bin";
        }

        return prettyPrint ? JSON.stringify(this._glTF, null, 2) : JSON.stringify(this._glTF);
    }

    public async generateGLTFAsync(glTFPrefix: string): Promise<GLTFData> {
        const binaryBuffer = await this._generateBinaryAsync();
        this._extensionsOnExporting();
        const jsonText = this._generateJSON(binaryBuffer.byteLength, glTFPrefix, true);

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
        await this._extensionsPreGenerateBinaryAsync();
        return this._bufferManager.generateBinary(this._bufferViews);
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
        this._shouldUseGlb = true;
        const binaryBuffer = await this._generateBinaryAsync();
        this._extensionsOnExporting();
        const jsonText = this._generateJSON(binaryBuffer.byteLength);

        const glbFileName = glTFPrefix + ".glb";
        const headerLength = 12;
        const chunkLengthPrefix = 8;
        let jsonLength = jsonText.length;
        let encodedJsonText;
        // Make use of TextEncoder when available
        if (typeof TextEncoder !== "undefined") {
            const encoder = new TextEncoder();
            encodedJsonText = encoder.encode(jsonText);
            jsonLength = encodedJsonText.length;
        }
        const jsonPadding = this._getPadding(jsonLength);
        const binPadding = this._getPadding(binaryBuffer.byteLength);

        const byteLength = headerLength + 2 * chunkLengthPrefix + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding;

        const dataWriter = new DataWriter(byteLength);

        // Header
        dataWriter.writeUInt32(0x46546c67); // "glTF"
        dataWriter.writeUInt32(2); // Version
        dataWriter.writeUInt32(byteLength); // Total bytes in file

        // JSON chunk length prefix
        dataWriter.writeUInt32(jsonLength + jsonPadding);
        dataWriter.writeUInt32(0x4e4f534a); // "JSON"

        // JSON chunk bytes
        if (encodedJsonText) {
            // If TextEncoder was available, we can simply copy the encoded array
            dataWriter.writeTypedArray(encodedJsonText);
        } else {
            const blankCharCode = "_".charCodeAt(0);
            for (let i = 0; i < jsonLength; ++i) {
                const charCode = jsonText.charCodeAt(i);
                // If the character doesn't fit into a single UTF-16 code unit, just put a blank character
                if (charCode != jsonText.codePointAt(i)) {
                    dataWriter.writeUInt8(blankCharCode);
                } else {
                    dataWriter.writeUInt8(charCode);
                }
            }
        }

        // JSON padding
        for (let i = 0; i < jsonPadding; ++i) {
            dataWriter.writeUInt8(0x20);
        }

        // Binary chunk length prefix
        dataWriter.writeUInt32(binaryBuffer.byteLength + binPadding);
        dataWriter.writeUInt32(0x004e4942); // "BIN"

        // Binary chunk bytes
        dataWriter.writeTypedArray(binaryBuffer);

        // Binary padding
        for (let i = 0; i < binPadding; ++i) {
            dataWriter.writeUInt8(0);
        }

        const container = new GLTFData();
        container.files[glbFileName] = new Blob([dataWriter.getOutputData()], { type: "application/octet-stream" });

        return container;
    }

    private _setNodeTransformation(node: INode, babylonTransformNode: TransformNode, convertToRightHanded: boolean): void {
        if (!babylonTransformNode.getPivotPoint().equalsWithEpsilon(DefaultTranslation, Epsilon)) {
            Tools.Warn("Pivot points are not supported in the glTF serializer");
        }

        if (!babylonTransformNode.position.equalsWithEpsilon(DefaultTranslation, Epsilon)) {
            const translation = TmpVectors.Vector3[0].copyFrom(babylonTransformNode.position);
            if (convertToRightHanded) {
                ConvertToRightHandedPosition(translation);
            }

            node.translation = translation.asArray();
        }

        if (!babylonTransformNode.scaling.equalsWithEpsilon(DefaultScale, Epsilon)) {
            node.scale = babylonTransformNode.scaling.asArray();
        }

        const rotationQuaternion =
            babylonTransformNode.rotationQuaternion?.clone() ||
            Quaternion.FromEulerAngles(babylonTransformNode.rotation.x, babylonTransformNode.rotation.y, babylonTransformNode.rotation.z);

        if (!rotationQuaternion.equalsWithEpsilon(DefaultRotation, Epsilon)) {
            if (convertToRightHanded) {
                ConvertToRightHandedRotation(rotationQuaternion);
            }

            node.rotation = rotationQuaternion.normalize().asArray();
        }
    }

    private _setCameraTransformation(node: INode, babylonCamera: TargetCamera, convertToRightHanded: boolean): void {
        if (!babylonCamera.position.equalsWithEpsilon(DefaultTranslation, Epsilon)) {
            const translation = TmpVectors.Vector3[0].copyFrom(babylonCamera.position);
            if (convertToRightHanded) {
                ConvertToRightHandedPosition(translation);
            }
            node.translation = translation.asArray();
        }

        const rotationQuaternion = babylonCamera.rotationQuaternion || Quaternion.FromEulerAngles(babylonCamera.rotation.x, babylonCamera.rotation.y, babylonCamera.rotation.z);

        if (convertToRightHanded) {
            ConvertToRightHandedRotation(rotationQuaternion);
        }

        // Left-handed scenes have cameras that always face Z+ (opposite of glTF's Z-).
        // Use scene coordinate system rather than convertToRightHanded, since some
        // cameras may not need convertToRightHanded but still need correction to face Z-.
        if (!this._babylonScene.useRightHandedSystem) {
            Rotate180Y(rotationQuaternion);
        }

        if (!rotationQuaternion.equalsWithEpsilon(DefaultRotation, Epsilon)) {
            node.rotation = rotationQuaternion.asArray();
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
        const gltfCameras = Array.from(this._camerasMap.values());
        for (const gltfCamera of gltfCameras) {
            const usedNodes = this._nodesCameraMap.get(gltfCamera);
            if (usedNodes !== undefined) {
                this._cameras.push(gltfCamera);
                for (const node of usedNodes) {
                    node.camera = this._cameras.length - 1;
                }
            }
        }
    }

    // Collects all skins in a skins map so nodes can reference it during node parsing.
    private _listAvailableSkeletons(): void {
        for (const skeleton of this._babylonScene.skeletons) {
            if (skeleton.bones.length <= 0) {
                continue;
            }

            const skin: ISkin = { joints: [] };
            this._skinMap.set(skeleton, skin);
        }
    }

    private _exportAndAssignSkeletons(leftHandNodes: Set<Node>): void {
        for (const skeleton of this._babylonScene.skeletons) {
            if (skeleton.bones.length <= 0) {
                continue;
            }

            const skin = this._skinMap.get(skeleton);
            if (skin == undefined) {
                continue;
            }

            // The bones (joints) of a skeleton (skin) must be exported in the same order as they appear in vertex attributes,
            // which is indicated by getIndex and may not match a bone's index in skeleton.bones
            const boneIndexMap: { [index: number]: Bone } = {};
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

            // Set joints indices to scene nodes.
            const inverseBindMatrices: Matrix[] = [];
            for (let boneIndex = 0; boneIndex <= maxBoneIndex; ++boneIndex) {
                const bone = boneIndexMap[boneIndex]; // Assumes no gaps in bone indices
                const transformNode = bone.getTransformNode();
                const nodeIndex = transformNode ? this._nodeMap.get(transformNode) : undefined;
                if (nodeIndex === undefined) {
                    Tools.Warn("Exporting a bone without a linked transform node is currently unsupported.");
                    continue; // The indices may be out-of-sync after this and break the skinning.
                }
                skin.joints.push(nodeIndex);

                const boneMatrix = bone.getAbsoluteInverseBindMatrix().clone();
                if (leftHandNodes.has(transformNode!)) {
                    ConvertToRightHandedTransformMatrix(boneMatrix);
                }
                inverseBindMatrices.push(boneMatrix);
            }

            // Nodes that use this skin.
            const skinnedNodes = this._nodesSkinMap.get(skin);

            // Only export the skin if it has at least one joint and is used by a mesh.
            if (skin.joints.length > 0 && skinnedNodes !== undefined) {
                const inverseBindMatricesData = new Float32Array(inverseBindMatrices.length * 16); // Always a 4 x 4 matrix of 32 bit float
                inverseBindMatrices.forEach((mat: Matrix, index: number) => {
                    inverseBindMatricesData.set(mat.m, index * 16);
                });

                const bufferView = this._bufferManager.createBufferView(inverseBindMatricesData);
                this._accessors.push(this._bufferManager.createAccessor(bufferView, AccessorType.MAT4, AccessorComponentType.FLOAT, inverseBindMatrices.length));
                skin.inverseBindMatrices = this._accessors.length - 1;

                this._skins.push(skin);
                const skinIndex = this._skins.length - 1;
                for (const skinnedNode of skinnedNodes) {
                    skinnedNode.skin = skinIndex;
                }
            }
        }
    }

    private async _exportSceneAsync(): Promise<void> {
        const scene: IScene = { nodes: [] };

        // Scene metadata
        if (this._babylonScene.metadata) {
            const extras = this._options.metadataSelector(this._babylonScene.metadata);
            if (extras) {
                scene.extras = extras;
            }
        }

        //  TODO:
        //  deal with this from the loader:
        //  babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
        //  babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;

        const rootNodesRH = new Array<Node>();
        const rootNodesLH = new Array<Node>();
        const rootNoopNodesRH = new Array<Node>();

        for (const rootNode of this._babylonScene.rootNodes) {
            if (this._options.removeNoopRootNodes && !this._options.includeCoordinateSystemConversionNodes && IsNoopNode(rootNode, this._babylonScene.useRightHandedSystem)) {
                rootNoopNodesRH.push(...rootNode.getChildren());
            } else if (this._babylonScene.useRightHandedSystem) {
                rootNodesRH.push(rootNode);
            } else {
                rootNodesLH.push(rootNode);
            }
        }

        this._listAvailableCameras();
        this._listAvailableSkeletons();

        const stateLH = new ExporterState(true, false);
        scene.nodes.push(...(await this._exportNodesAsync(rootNodesLH, stateLH)));
        const stateRH = new ExporterState(false, false);
        scene.nodes.push(...(await this._exportNodesAsync(rootNodesRH, stateRH)));
        const noopRH = new ExporterState(false, true);
        scene.nodes.push(...(await this._exportNodesAsync(rootNoopNodesRH, noopRH)));

        if (scene.nodes.length) {
            this._scenes.push(scene);
        }

        this._exportAndAssignCameras();
        this._exportAndAssignSkeletons(stateLH.getNodesSet());

        if (this._babylonScene.animationGroups.length) {
            _GLTFAnimation._CreateNodeAndMorphAnimationFromAnimationGroups(
                this._babylonScene,
                this._animations,
                this._nodeMap,
                this._bufferManager,
                this._bufferViews,
                this._accessors,
                this._animationSampleRate,
                stateLH.getNodesSet(),
                this._options.shouldExportAnimation
            );
        }
    }

    private _shouldExportNode(babylonNode: Node): boolean {
        let result = this._shouldExportNodeMap.get(babylonNode);

        if (result === undefined) {
            result = this._options.shouldExportNode(babylonNode);
            this._shouldExportNodeMap.set(babylonNode, result);
        }

        return result;
    }

    private async _exportNodesAsync(babylonRootNodes: Node[], state: ExporterState): Promise<number[]> {
        const nodes = new Array<number>();

        this._exportBuffers(babylonRootNodes, state);

        for (const babylonNode of babylonRootNodes) {
            // eslint-disable-next-line no-await-in-loop
            await this._exportNodeAsync(babylonNode, nodes, state);
        }

        return nodes;
    }

    private _collectBuffers(
        babylonNode: Node,
        bufferToVertexBuffersMap: Map<Buffer, VertexBuffer[]>,
        vertexBufferToMeshesMap: Map<VertexBuffer, AbstractMesh[]>,
        morphTargetsToMeshesMap: Map<MorphTarget, AbstractMesh[]>,
        state: ExporterState
    ): void {
        if (this._shouldExportNode(babylonNode) && babylonNode instanceof AbstractMesh && babylonNode.geometry) {
            const vertexBuffers = babylonNode.geometry.getVertexBuffers();
            if (vertexBuffers) {
                for (const kind in vertexBuffers) {
                    if (!IsStandardVertexAttribute(kind)) {
                        continue;
                    }
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

    private _exportBuffers(babylonRootNodes: Node[], state: ExporterState): void {
        const bufferToVertexBuffersMap = new Map<Buffer, VertexBuffer[]>();
        const vertexBufferToMeshesMap = new Map<VertexBuffer, AbstractMesh[]>();
        const morphTargetsMeshesMap = new Map<MorphTarget, AbstractMesh[]>();

        for (const babylonNode of babylonRootNodes) {
            this._collectBuffers(babylonNode, bufferToVertexBuffersMap, vertexBufferToMeshesMap, morphTargetsMeshesMap, state);
        }

        const buffers = Array.from(bufferToVertexBuffersMap.keys());

        for (const buffer of buffers) {
            const data = buffer.getData();
            if (!data) {
                throw new Error("Buffer data is not available");
            }

            const vertexBuffers = bufferToVertexBuffersMap.get(buffer);

            if (!vertexBuffers) {
                continue;
            }

            const byteStride = vertexBuffers[0].byteStride;
            if (vertexBuffers.some((vertexBuffer) => vertexBuffer.byteStride !== byteStride)) {
                throw new Error("Vertex buffers pointing to the same buffer must have the same byte stride");
            }

            const bytes = DataArrayToUint8Array(data).slice();

            // Apply normalizations and color corrections to buffer data in-place.
            for (const vertexBuffer of vertexBuffers) {
                const meshes = vertexBufferToMeshesMap.get(vertexBuffer)!;
                const { byteOffset, byteStride, componentCount, type, count, normalized, kind } = GetVertexBufferInfo(vertexBuffer, meshes);

                switch (kind) {
                    // Normalize normals and tangents.
                    case VertexBuffer.NormalKind:
                    case VertexBuffer.TangentKind: {
                        EnumerateFloatValues(bytes, byteOffset, byteStride, componentCount, type, count, normalized, (values) => {
                            const length = Math.sqrt(values[0] * values[0] + values[1] * values[1] + values[2] * values[2]);
                            if (length > 0) {
                                const invLength = 1 / length;
                                values[0] *= invLength;
                                values[1] *= invLength;
                                values[2] *= invLength;
                            }
                        });
                        break;
                    }
                    // Convert StandardMaterial vertex colors from gamma to linear space.
                    case VertexBuffer.ColorKind: {
                        const stdMaterialCount = meshes.filter((mesh) => mesh.material instanceof StandardMaterial || mesh.material == null).length;
                        if (stdMaterialCount == 0) {
                            break; // Buffer not used by StandardMaterials, so no conversion needed.
                        }
                        // TODO: Implement this case.
                        if (stdMaterialCount != meshes.length) {
                            Logger.Warn("Not converting vertex color space, as buffer is shared by StandardMaterials and other material types. Results may look incorrect.");
                            break;
                        }
                        if (type == VertexBuffer.UNSIGNED_BYTE) {
                            Logger.Warn("Converting uint8 vertex colors to linear space. Results may look incorrect.");
                        }

                        const vertexData3 = new Color3();
                        const vertexData4 = new Color4();
                        const useExactSrgbConversions = this._babylonScene.getEngine().useExactSrgbConversions;

                        EnumerateFloatValues(bytes, byteOffset, byteStride, componentCount, type, count, normalized, (values) => {
                            // Using separate Color3 and Color4 objects to ensure the right functions are called.
                            if (values.length === 3) {
                                vertexData3.fromArray(values, 0);
                                vertexData3.toLinearSpaceToRef(vertexData3, useExactSrgbConversions);
                                vertexData3.toArray(values, 0);
                            } else {
                                vertexData4.fromArray(values, 0);
                                vertexData4.toLinearSpaceToRef(vertexData4, useExactSrgbConversions);
                                vertexData4.toArray(values, 0);
                            }
                        });
                    }
                }
            }

            // Perform coordinate conversions, if needed, to buffer data in-place (only for positions, normals and tangents).
            if (state.convertToRightHanded) {
                for (const vertexBuffer of vertexBuffers) {
                    const meshes = vertexBufferToMeshesMap.get(vertexBuffer)!;
                    const { byteOffset, byteStride, componentCount, type, count, normalized, kind } = GetVertexBufferInfo(vertexBuffer, meshes);

                    switch (kind) {
                        case VertexBuffer.PositionKind:
                        case VertexBuffer.NormalKind:
                        case VertexBuffer.TangentKind: {
                            EnumerateFloatValues(bytes, byteOffset, byteStride, componentCount, type, count, normalized, (values) => {
                                values[0] = -values[0];
                            });
                        }
                    }
                }

                // Save converted bytes for min/max computation.
                state.convertedToRightHandedBuffers.set(buffer, bytes);
            }

            // Create buffer view, but defer accessor creation for later. Instead, track it via ExporterState.
            const bufferView = this._bufferManager.createBufferView(bytes, byteStride);
            state.setVertexBufferView(buffer, bufferView);

            const floatMatricesIndices = new Map<VertexBuffer, FloatArray>();

            // If buffers are of type MatricesIndicesKind and have float values, we need to create a new buffer instead.
            for (const vertexBuffer of vertexBuffers) {
                const meshes = vertexBufferToMeshesMap.get(vertexBuffer)!;
                const { kind, totalVertices } = GetVertexBufferInfo(vertexBuffer, meshes);
                switch (kind) {
                    case VertexBuffer.MatricesIndicesKind:
                    case VertexBuffer.MatricesIndicesExtraKind: {
                        if (vertexBuffer.type == VertexBuffer.FLOAT) {
                            const floatData = vertexBuffer.getFloatData(totalVertices);
                            if (floatData !== null) {
                                floatMatricesIndices.set(vertexBuffer, floatData);
                            }
                        }
                    }
                }
            }

            if (floatMatricesIndices.size !== 0) {
                Logger.Warn(
                    `Joint indices conversion needed: some joint indices are stored as floats in Babylon but GLTF requires UNSIGNED BYTES. We will perform the conversion but this might lead to unused data in the buffer.`
                );
            }

            const floatArrayVertexBuffers = Array.from(floatMatricesIndices.keys());

            for (const vertexBuffer of floatArrayVertexBuffers) {
                const array = floatMatricesIndices.get(vertexBuffer);

                if (!array) {
                    continue;
                }

                const is16Bit = FloatsNeed16BitInteger(array);
                const newArray = new (is16Bit ? Uint16Array : Uint8Array)(array.length);
                for (let index = 0; index < array.length; index++) {
                    newArray[index] = array[index];
                }
                const bufferView = this._bufferManager.createBufferView(newArray, 4 * (is16Bit ? 2 : 1));
                state.setRemappedBufferView(buffer, vertexBuffer, bufferView);
            }
        }

        // Build morph targets buffers
        const morphTargets = Array.from(morphTargetsMeshesMap.keys());

        for (const morphTarget of morphTargets) {
            const meshes = morphTargetsMeshesMap.get(morphTarget);

            if (!meshes) {
                continue;
            }

            const glTFMorphTarget = BuildMorphTargetBuffers(morphTarget, meshes[0], this._bufferManager, this._bufferViews, this._accessors, state.convertToRightHanded);

            for (const mesh of meshes) {
                state.bindMorphDataToMesh(mesh, glTFMorphTarget);
            }
        }
    }

    /**
     * Processes a node to be exported to the glTF file
     * @returns A promise that resolves once the node has been exported
     * @internal
     */
    private async _exportNodeAsync(babylonNode: Node, parentNodeChildren: Array<number>, state: ExporterState): Promise<void> {
        let nodeIndex = this._nodeMap.get(babylonNode);
        if (nodeIndex !== undefined) {
            if (!parentNodeChildren.includes(nodeIndex)) {
                parentNodeChildren.push(nodeIndex);
            }
            return;
        }

        const node = await this._createNodeAsync(babylonNode, state);

        if (node) {
            nodeIndex = this._nodes.length;
            this._nodes.push(node);
            this._nodeMap.set(babylonNode, nodeIndex);
            state.pushExportedNode(babylonNode);
            parentNodeChildren.push(nodeIndex);

            // Process node's animations once the node has been added to nodeMap (TODO: This should be refactored)
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
                    this._bufferManager,
                    this._bufferViews,
                    this._accessors,
                    this._animationSampleRate,
                    state.convertToRightHanded,
                    this._options.shouldExportAnimation
                );
                if (babylonNode.animations.length) {
                    _GLTFAnimation._CreateNodeAnimationFromNodeAnimations(
                        babylonNode,
                        runtimeGLTFAnimation,
                        idleGLTFAnimations,
                        this._nodeMap,
                        this._nodes,
                        this._bufferManager,
                        this._bufferViews,
                        this._accessors,
                        this._animationSampleRate,
                        state.convertToRightHanded,
                        this._options.shouldExportAnimation
                    );
                }
            }

            if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                this._animations.push(runtimeGLTFAnimation);
            }
            idleGLTFAnimations.forEach((idleGLTFAnimation) => {
                if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                    this._animations.push(idleGLTFAnimation);
                }
            });
        }

        // Begin processing child nodes once parent has been added to the node list
        const children = node ? [] : parentNodeChildren;
        for (const babylonChildNode of babylonNode.getChildren()) {
            // eslint-disable-next-line no-await-in-loop
            await this._exportNodeAsync(babylonChildNode, children, state);
        }

        if (node && children.length) {
            node.children = children;
        }
    }

    /**
     * Creates a glTF node from a Babylon.js node. If skipped, returns null.
     * @internal
     */
    private async _createNodeAsync(babylonNode: Node, state: ExporterState): Promise<Nullable<INode>> {
        if (!this._shouldExportNode(babylonNode)) {
            return null;
        }

        const node: INode = {};

        if (babylonNode.name) {
            node.name = babylonNode.name;
        }

        // Node metadata
        if (babylonNode.metadata) {
            const extras = this._options.metadataSelector(babylonNode.metadata);
            if (extras) {
                node.extras = extras;
            }
        }

        if (babylonNode instanceof TransformNode) {
            this._setNodeTransformation(node, babylonNode, state.convertToRightHanded);

            if (babylonNode instanceof AbstractMesh) {
                const babylonMesh = babylonNode instanceof InstancedMesh ? babylonNode.sourceMesh : (babylonNode as Mesh);
                if (babylonMesh.subMeshes && babylonMesh.subMeshes.length > 0) {
                    node.mesh = await this._exportMeshAsync(babylonMesh, state);
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
            }
        }

        if (babylonNode instanceof TargetCamera) {
            const gltfCamera = this._camerasMap.get(babylonNode);

            if (gltfCamera) {
                if (this._nodesCameraMap.get(gltfCamera) === undefined) {
                    this._nodesCameraMap.set(gltfCamera, []);
                }

                this._setCameraTransformation(node, babylonNode, state.convertToRightHanded);

                // If a parent node exists and can be collapsed, merge their transformations and mark the parent as the camera-containing node.
                const parentBabylonNode = babylonNode.parent;
                if (parentBabylonNode !== null && IsChildCollapsible(babylonNode, parentBabylonNode)) {
                    const parentNodeIndex = this._nodeMap.get(parentBabylonNode);
                    if (parentNodeIndex !== undefined) {
                        const parentNode = this._nodes[parentNodeIndex];
                        CollapseChildIntoParent(node, parentNode);
                        this._nodesCameraMap.get(gltfCamera)?.push(parentNode);
                        return null; // Skip exporting the original child node
                    }
                }

                this._nodesCameraMap.get(gltfCamera)?.push(node);
            }
        }

        // Apply extensions to the node. If this resolves to null, it means we should skip exporting this node
        const processedNode = await this._extensionsPostExportNodeAsync("exportNodeAsync", node, babylonNode, this._nodeMap, state.convertToRightHanded);
        if (!processedNode) {
            Logger.Warn(`Not exporting node ${babylonNode.name}`);
            return null;
        }

        return node;
    }

    private _exportIndices(
        indices: Nullable<IndicesArray>,
        is32Bits: boolean,
        start: number,
        count: number,
        offset: number,
        fillMode: number,
        sideOrientation: number,
        state: ExporterState,
        primitive: IMeshPrimitive
    ): void {
        let indicesToExport = indices;

        primitive.mode = GetPrimitiveMode(fillMode);

        // Flip indices if triangle winding order is not CCW, as glTF is always CCW.
        const flip = sideOrientation !== Material.CounterClockWiseSideOrientation && IsTriangleFillMode(fillMode);
        if (flip) {
            if (fillMode === Material.TriangleStripDrawMode || fillMode === Material.TriangleFanDrawMode) {
                throw new Error("Triangle strip/fan fill mode is not implemented");
            }

            primitive.mode = GetPrimitiveMode(fillMode);

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
                const bytes = IndicesArrayToTypedArray(indicesToExport, 0, count, is32Bits);
                const bufferView = this._bufferManager.createBufferView(bytes);

                const componentType = is32Bits ? AccessorComponentType.UNSIGNED_INT : AccessorComponentType.UNSIGNED_SHORT;
                this._accessors.push(this._bufferManager.createAccessor(bufferView, AccessorType.SCALAR, componentType, count, 0));
                accessorIndex = this._accessors.length - 1;
                state.setIndicesAccessor(indices, start, count, offset, flip, accessorIndex);
            }

            primitive.indices = accessorIndex;
        }
    }

    private _exportVertexBuffer(vertexBuffer: VertexBuffer, babylonMaterial: Material, start: number, count: number, state: ExporterState, primitive: IMeshPrimitive): void {
        const kind = vertexBuffer.getKind();

        if (!IsStandardVertexAttribute(kind)) {
            return;
        }

        if (kind.startsWith("uv") && !this._options.exportUnusedUVs) {
            if (!babylonMaterial || !this._materialNeedsUVsSet.has(babylonMaterial)) {
                return;
            }
        }

        let accessorIndex = state.getVertexAccessor(vertexBuffer, start, count);

        if (accessorIndex === undefined) {
            // Get min/max from converted or original data.
            const data = state.convertedToRightHandedBuffers.get(vertexBuffer._buffer) || vertexBuffer._buffer.getData()!;
            const minMax = kind === VertexBuffer.PositionKind ? GetMinMax(data, vertexBuffer, start, count) : undefined;

            // For the remapped buffer views we created for float matrices indices, make sure to use their updated information.
            const isFloatMatricesIndices =
                (kind === VertexBuffer.MatricesIndicesKind || kind === VertexBuffer.MatricesIndicesExtraKind) && vertexBuffer.type === VertexBuffer.FLOAT;

            const vertexBufferType = isFloatMatricesIndices ? VertexBuffer.UNSIGNED_BYTE : vertexBuffer.type;
            const vertexBufferNormalized = isFloatMatricesIndices ? undefined : vertexBuffer.normalized;
            const bufferView = isFloatMatricesIndices ? state.getRemappedBufferView(vertexBuffer._buffer, vertexBuffer)! : state.getVertexBufferView(vertexBuffer._buffer)!;

            const byteOffset = vertexBuffer.byteOffset + start * vertexBuffer.byteStride;
            this._accessors.push(
                this._bufferManager.createAccessor(
                    bufferView,
                    GetAccessorType(kind, state.hasVertexColorAlpha(vertexBuffer)),
                    vertexBufferType,
                    count,
                    byteOffset,
                    minMax,
                    vertexBufferNormalized // TODO: Find other places where this is needed.
                )
            );
            accessorIndex = this._accessors.length - 1;
            state.setVertexAccessor(vertexBuffer, start, count, accessorIndex);
        }

        primitive.attributes[GetAttributeType(kind)] = accessorIndex;
    }

    private async _exportMaterialAsync(babylonMaterial: Material, vertexBuffers: { [kind: string]: VertexBuffer }, subMesh: SubMesh, primitive: IMeshPrimitive): Promise<void> {
        let materialIndex = this._materialMap.get(babylonMaterial);
        if (materialIndex === undefined) {
            const hasUVs = vertexBuffers && Object.keys(vertexBuffers).some((kind) => kind.startsWith("uv"));
            babylonMaterial = babylonMaterial instanceof MultiMaterial ? babylonMaterial.subMaterials[subMesh.materialIndex]! : babylonMaterial;
            if (babylonMaterial instanceof PBRBaseMaterial) {
                materialIndex = await this._materialExporter.exportPBRMaterialAsync(babylonMaterial, hasUVs);
            } else if (babylonMaterial instanceof StandardMaterial) {
                materialIndex = await this._materialExporter.exportStandardMaterialAsync(babylonMaterial, hasUVs);
            } else if (babylonMaterial instanceof OpenPBRMaterial) {
                materialIndex = await this._materialExporter.exportOpenPBRMaterialAsync(babylonMaterial, hasUVs);
            } else {
                Logger.Warn(`Unsupported material '${babylonMaterial.name}' with type ${babylonMaterial.getClassName()}`);
                return;
            }

            this._materialMap.set(babylonMaterial, materialIndex);
        }

        primitive.material = materialIndex;
    }

    private async _exportMeshAsync(babylonMesh: Mesh, state: ExporterState): Promise<number> {
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

        const isLinesMesh = babylonMesh instanceof LinesMesh;
        const isGreasedLineMesh = babylonMesh instanceof GreasedLineBaseMesh;

        const subMeshes = babylonMesh.subMeshes;
        if (vertexBuffers && subMeshes && subMeshes.length > 0) {
            for (const subMesh of subMeshes) {
                const primitive: IMeshPrimitive = { attributes: {} };

                const babylonMaterial = subMesh.getMaterial() || this._babylonScene.defaultMaterial;

                if (isGreasedLineMesh) {
                    const material: IMaterial = {
                        name: babylonMaterial.name,
                    };

                    const babylonLinesMesh = babylonMesh;

                    const colorWhite = Color3.White();
                    const alpha = babylonLinesMesh.material?.alpha ?? 1;
                    const color = babylonLinesMesh.greasedLineMaterial?.color ?? colorWhite;
                    if (!color.equalsWithEpsilon(colorWhite, Epsilon) || alpha < 1) {
                        material.pbrMetallicRoughness = {
                            baseColorFactor: [...color.asArray(), alpha],
                        };
                    }

                    this._materials.push(material);
                    primitive.material = this._materials.length - 1;
                } else if (isLinesMesh) {
                    // Special case for LinesMesh
                    const material: IMaterial = {
                        name: babylonMaterial.name,
                    };

                    const babylonLinesMesh = babylonMesh;

                    if (!babylonLinesMesh.color.equalsWithEpsilon(Color3.White(), Epsilon) || babylonLinesMesh.alpha < 1) {
                        material.pbrMetallicRoughness = {
                            baseColorFactor: [...babylonLinesMesh.color.asArray(), babylonLinesMesh.alpha],
                        };
                    }

                    this._materials.push(material);
                    primitive.material = this._materials.length - 1;
                } else {
                    // Material
                    // eslint-disable-next-line no-await-in-loop
                    await this._exportMaterialAsync(babylonMaterial, vertexBuffers, subMesh, primitive);
                }

                // Index buffer
                const fillMode = isLinesMesh || isGreasedLineMesh ? Material.LineListDrawMode : (babylonMesh.overrideRenderingFillMode ?? babylonMaterial.fillMode);

                let sideOrientation = babylonMaterial._getEffectiveOrientation(babylonMesh);
                if (state.wasAddedByNoopNode && !babylonMesh.getScene().useRightHandedSystem) {
                    // To properly remove a conversion node, we must also cancel out the implicit flip in its children's side orientations.
                    sideOrientation = sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation;
                }

                this._exportIndices(
                    indices,
                    indices ? AreIndices32Bits(indices, subMesh.indexCount, subMesh.indexStart, subMesh.verticesStart) : subMesh.verticesCount > 65535,
                    indices ? subMesh.indexStart : subMesh.verticesStart,
                    indices ? subMesh.indexCount : subMesh.verticesCount,
                    -subMesh.verticesStart,
                    fillMode,
                    sideOrientation,
                    state,
                    primitive
                );

                // Vertex buffers
                for (const vertexBuffer of Object.values(vertexBuffers)) {
                    this._exportVertexBuffer(vertexBuffer, babylonMaterial, subMesh.verticesStart, subMesh.verticesCount, state, primitive);
                }

                if (morphTargets) {
                    primitive.targets = [];
                    for (const gltfMorphTarget of morphTargets) {
                        primitive.targets.push(gltfMorphTarget.attributes);
                    }
                }

                mesh.primitives.push(primitive);
                this._extensionsPostExportMeshPrimitive(primitive);
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
}
