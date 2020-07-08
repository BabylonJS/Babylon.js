import { AccessorType, IBufferView, IAccessor, INode, IScene, IMesh, IMaterial, ITexture, IImage, ISampler, IAnimation, ImageMimeType, IMeshPrimitive, IBuffer, IGLTF, MeshPrimitiveMode, AccessorComponentType, ITextureInfo, ISkin } from "babylonjs-gltf2interface";

import { FloatArray, Nullable, IndicesArray } from "babylonjs/types";
import { Vector2, Vector3, Vector4, Quaternion, Matrix } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";
import { Tools } from "babylonjs/Misc/tools";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { Node } from "babylonjs/node";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { LinesMesh } from "babylonjs/Meshes/linesMesh";
import { InstancedMesh } from "babylonjs/Meshes/instancedMesh";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { Material } from "babylonjs/Materials/material";
import { MultiMaterial } from "babylonjs/Materials/multiMaterial";
import { Engine } from "babylonjs/Engines/engine";
import { Scene } from "babylonjs/scene";

import { IGLTFExporterExtensionV2 } from "./glTFExporterExtension";
import { _GLTFMaterialExporter } from "./glTFMaterialExporter";
import { IExportOptions } from "./glTFSerializer";
import { _GLTFUtilities } from "./glTFUtilities";
import { GLTFData } from "./glTFData";
import { _GLTFAnimation } from "./glTFAnimation";
import { Viewport } from 'babylonjs/Maths/math.viewport';
import { Epsilon } from 'babylonjs/Maths/math.constants';

/**
 * Utility interface for storing vertex attribute data
 * @hidden
 */
interface _IVertexAttributeData {
    /**
     * Specifies the Babylon Vertex Buffer Type (Position, Normal, Color, etc.)
    */
    kind: string;

    /**
     * Specifies the glTF Accessor Type (VEC2, VEC3, etc.)
    */
    accessorType: AccessorType;

    /**
     * Specifies the glTF Accessor Component Type (BYTE, UNSIGNED_BYTE, FLOAT, SHORT, INT, etc..)
     */
    accessorComponentType: AccessorComponentType;

    /**
     * Specifies the BufferView index for the vertex attribute data
    */
    bufferViewIndex?: number;

    byteStride?: number;
}
/**
 * Converts Babylon Scene into glTF 2.0.
 * @hidden
 */
export class _Exporter {
    /**
     * Stores the glTF to export
     */
    public _glTF: IGLTF;
    /**
     * Stores all generated buffer views, which represents views into the main glTF buffer data
     */
    public _bufferViews: IBufferView[];
    /**
     * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
     */
    public _accessors: IAccessor[];
    /**
     * Stores all the generated nodes, which contains transform and/or mesh information per node
     */
    public _nodes: INode[];
    /**
     * Stores all the generated glTF scenes, which stores multiple node hierarchies
     */
    private _scenes: IScene[];
    /**
     * Stores all the generated mesh information, each containing a set of primitives to render in glTF
     */
    private _meshes: IMesh[];
    /**
     * Stores all the generated material information, which represents the appearance of each primitive
     */
    public _materials: IMaterial[];

    public _materialMap: { [materialID: number]: number };
    /**
     * Stores all the generated texture information, which is referenced by glTF materials
     */
    public _textures: ITexture[];
    /**
     * Stores all the generated image information, which is referenced by glTF textures
     */
    public _images: IImage[];

    /**
     * Stores all the texture samplers
     */
    public _samplers: ISampler[];
    /**
     * Stores all the generated glTF skins
     */
    public _skins: ISkin[];
    /**
     * Stores all the generated animation samplers, which is referenced by glTF animations
     */
    /**
     * Stores the animations for glTF models
     */
    private _animations: IAnimation[];
    /**
     * Stores the total amount of bytes stored in the glTF buffer
     */
    private _totalByteLength: number;
    /**
     * Stores a reference to the Babylon scene containing the source geometry and material information
     */
    public _babylonScene: Scene;
    /**
     * Stores a map of the image data, where the key is the file name and the value
     * is the image data
     */
    public _imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } };

    /**
     * Stores a map of the unique id of a node to its index in the node array
     */
    public _nodeMap: { [key: number]: number };

    /**
     * Specifies if the source Babylon scene was left handed, and needed conversion.
     */
    public _convertToRightHandedSystem: boolean;

    /**
     * Specifies if a Babylon node should be converted to right-handed on export
     */
    public _convertToRightHandedSystemMap: { [nodeId: number]: boolean };

    /*
    * Specifies if root Babylon empty nodes that act as a coordinate space transform should be included in export
    */
    public _includeCoordinateSystemConversionNodes: boolean = false;

    /**
     * Baked animation sample rate
     */
    private _animationSampleRate: number;

    private _options: IExportOptions;

    private _localEngine: Engine;

    public _glTFMaterialExporter: _GLTFMaterialExporter;

    private _extensions: { [name: string]: IGLTFExporterExtensionV2 } = {};

    private static _ExtensionNames = new Array<string>();
    private static _ExtensionFactories: { [name: string]: (exporter: _Exporter) => IGLTFExporterExtensionV2 } = {};

    private _applyExtension<T>(node: Nullable<T>, extensions: IGLTFExporterExtensionV2[], index: number, actionAsync: (extension: IGLTFExporterExtensionV2, node: Nullable<T>) => Promise<Nullable<T>> | undefined): Promise<Nullable<T>> {
        if (index >= extensions.length) {
            return Promise.resolve(node);
        }

        let currentPromise = actionAsync(extensions[index], node);

        if (!currentPromise) {
            return this._applyExtension(node, extensions, index + 1, actionAsync);
        }

        return currentPromise.then((newNode) => this._applyExtension(newNode, extensions, index + 1, actionAsync));
    }

    private _applyExtensions<T>(node: Nullable<T>, actionAsync: (extension: IGLTFExporterExtensionV2, node: Nullable<T>) => Promise<Nullable<T>> | undefined): Promise<Nullable<T>> {
        var extensions: IGLTFExporterExtensionV2[] = [];
        for (const name of _Exporter._ExtensionNames) {
            extensions.push(this._extensions[name]);
        }

        return this._applyExtension(node, extensions, 0, actionAsync);
    }

    public _extensionsPreExportTextureAsync(context: string, babylonTexture: Nullable<Texture>, mimeType: ImageMimeType): Promise<Nullable<BaseTexture>> {
        return this._applyExtensions(babylonTexture, (extension, node) => extension.preExportTextureAsync && extension.preExportTextureAsync(context, node, mimeType));
    }

    public _extensionsPostExportMeshPrimitiveAsync(context: string, meshPrimitive: IMeshPrimitive, babylonSubMesh: SubMesh, binaryWriter: _BinaryWriter): Promise<Nullable<IMeshPrimitive>> {
        return this._applyExtensions(meshPrimitive, (extension, node) => extension.postExportMeshPrimitiveAsync && extension.postExportMeshPrimitiveAsync(context, node, babylonSubMesh, binaryWriter));
    }

    public _extensionsPostExportNodeAsync(context: string, node: Nullable<INode>, babylonNode: Node, nodeMap?: {[key: number]: number}): Promise<Nullable<INode>> {
        return this._applyExtensions(node, (extension, node) => extension.postExportNodeAsync && extension.postExportNodeAsync(context, node, babylonNode, nodeMap));
    }

    public _extensionsPostExportMaterialAsync(context: string, material: Nullable<IMaterial>, babylonMaterial: Material): Promise<Nullable<IMaterial>> {
        return this._applyExtensions(material, (extension, node) => extension.postExportMaterialAsync && extension.postExportMaterialAsync(context, node, babylonMaterial));
    }

    public _extensionsPostExportMaterialAdditionalTextures(context: string, material: IMaterial, babylonMaterial: Material): BaseTexture[] {
        let output: BaseTexture[] = [];

        for (const name of _Exporter._ExtensionNames) {
            var extension = this._extensions[name];

            if (extension.postExportMaterialAdditionalTextures) {
                output.push(...extension.postExportMaterialAdditionalTextures(context, material, babylonMaterial));
            }
        }

        return output;
    }

    public _extensionsPostExportTextures(context: string, textureInfo: ITextureInfo, babylonTexture: BaseTexture): void {
        for (const name of _Exporter._ExtensionNames) {
            var extension = this._extensions[name];

            if (extension.postExportTexture) {
                extension.postExportTexture(context, textureInfo, babylonTexture);
            }
        }
    }

    private _forEachExtensions(action: (extension: IGLTFExporterExtensionV2) => void): void {
        for (const name of _Exporter._ExtensionNames) {
            const extension = this._extensions[name];
            if (extension.enabled) {
                action(extension);
            }
        }
    }

    private _extensionsOnExporting(): void {
        this._forEachExtensions((extension) => {
            if (extension.wasUsed) {
                if (this._glTF.extensionsUsed == null) {
                    this._glTF.extensionsUsed = [];
                }

                if (this._glTF.extensionsUsed.indexOf(extension.name) === -1) {
                    this._glTF.extensionsUsed.push(extension.name);
                }

                if (extension.required) {
                    if (this._glTF.extensionsRequired == null) {
                        this._glTF.extensionsRequired = [];
                    }
                    if (this._glTF.extensionsRequired.indexOf(extension.name) === -1) {
                        this._glTF.extensionsRequired.push(extension.name);
                    }
                }

                if (this._glTF.extensions == null) {
                    this._glTF.extensions = {};
                }

                if (extension.onExporting) {
                    extension.onExporting();
                }
            }
        });
    }

    /**
     * Load glTF serializer extensions
     */
    private _loadExtensions(): void {
        for (const name of _Exporter._ExtensionNames) {
            const extension = _Exporter._ExtensionFactories[name](this);
            this._extensions[name] = extension;
        }
    }

    /**
     * Creates a glTF Exporter instance, which can accept optional exporter options
     * @param babylonScene Babylon scene object
     * @param options Options to modify the behavior of the exporter
     */
    public constructor(babylonScene: Scene, options?: IExportOptions) {
        this._glTF = {
            asset: { generator: "BabylonJS", version: "2.0" }
        };
        this._babylonScene = babylonScene;
        this._bufferViews = [];
        this._accessors = [];
        this._meshes = [];
        this._scenes = [];
        this._nodes = [];
        this._images = [];
        this._materials = [];
        this._materialMap = [];
        this._textures = [];
        this._samplers = [];
        this._skins = [];
        this._animations = [];
        this._imageData = {};
        this._options = options || {};
        this._animationSampleRate = options && options.animationSampleRate ? options.animationSampleRate : 1 / 60;
        this._includeCoordinateSystemConversionNodes = options && options.includeCoordinateSystemConversionNodes ? true : false;

        this._glTFMaterialExporter = new _GLTFMaterialExporter(this);
        this._loadExtensions();
    }

    public dispose() {
        for (var extensionKey in this._extensions) {
            const extension = this._extensions[extensionKey];

            extension.dispose();
        }
    }

    /**
     * Registers a glTF exporter extension
     * @param name Name of the extension to export
     * @param factory The factory function that creates the exporter extension
     */
    public static RegisterExtension(name: string, factory: (exporter: _Exporter) => IGLTFExporterExtensionV2): void {
        if (_Exporter.UnregisterExtension(name)) {
            Tools.Warn(`Extension with the name ${name} already exists`);
        }

        _Exporter._ExtensionFactories[name] = factory;
        _Exporter._ExtensionNames.push(name);
    }

    /**
     * Un-registers an exporter extension
     * @param name The name fo the exporter extension
     * @returns A boolean indicating whether the extension has been un-registered
     */
    public static UnregisterExtension(name: string): boolean {
        if (!_Exporter._ExtensionFactories[name]) {
            return false;
        }
        delete _Exporter._ExtensionFactories[name];

        const index = _Exporter._ExtensionNames.indexOf(name);
        if (index !== -1) {
            _Exporter._ExtensionNames.splice(index, 1);
        }

        return true;
    }

    /**
     * Lazy load a local engine
     */
    public _getLocalEngine(): Engine {
        if (!this._localEngine) {
            const localCanvas = document.createElement('canvas');
            localCanvas.id = "WriteCanvas";
            localCanvas.width = 2048;
            localCanvas.height = 2048;
            this._localEngine = new Engine(localCanvas, true, { premultipliedAlpha: Tools.IsSafari(), preserveDrawingBuffer: true });
            this._localEngine.setViewport(new Viewport(0, 0, 1, 1));
        }

        return this._localEngine;
    }

    private reorderIndicesBasedOnPrimitiveMode(submesh: SubMesh, primitiveMode: number, babylonIndices: IndicesArray, byteOffset: number, binaryWriter: _BinaryWriter) {
        switch (primitiveMode) {
            case Material.TriangleFillMode: {
                if (!byteOffset) { byteOffset = 0; }
                for (let i = submesh.indexStart, length = submesh.indexStart + submesh.indexCount; i < length; i = i + 3) {
                    const index = byteOffset + i * 4;
                    // swap the second and third indices
                    const secondIndex = binaryWriter.getUInt32(index + 4);
                    const thirdIndex = binaryWriter.getUInt32(index + 8);
                    binaryWriter.setUInt32(thirdIndex, index + 4);
                    binaryWriter.setUInt32(secondIndex, index + 8);
                }
                break;
            }
            case Material.TriangleFanDrawMode: {
                for (let i = submesh.indexStart + submesh.indexCount - 1, start = submesh.indexStart; i >= start; --i) {
                    binaryWriter.setUInt32(babylonIndices[i], byteOffset);
                    byteOffset += 4;
                }
                break;
            }
            case Material.TriangleStripDrawMode: {
                if (submesh.indexCount >= 3) {
                    binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 2], byteOffset + 4);
                    binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 1], byteOffset + 8);
                }
                break;
            }
        }
    }

    /**
     * Reorders the vertex attribute data based on the primitive mode.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private reorderVertexAttributeDataBasedOnPrimitiveMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean): void {
        if (convertToRightHandedSystem && sideOrientation === Material.ClockWiseSideOrientation) {
            switch (primitiveMode) {
                case Material.TriangleFillMode: {
                    this.reorderTriangleFillMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter, convertToRightHandedSystem);
                    break;
                }
                case Material.TriangleStripDrawMode: {
                    this.reorderTriangleStripDrawMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter, convertToRightHandedSystem);
                    break;
                }
                case Material.TriangleFanDrawMode: {
                    this.reorderTriangleFanMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter, convertToRightHandedSystem);
                    break;
                }
            }
        }
    }

    /**
     * Reorders the vertex attributes in the correct triangle mode order .  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private reorderTriangleFillMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean) {
        const vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh() as Mesh);
        if (vertexBuffer) {
            let stride = vertexBuffer.byteStride / VertexBuffer.GetTypeByteLength(vertexBuffer.type);
            if (submesh.verticesCount % 3 !== 0) {
                Tools.Error('The submesh vertices for the triangle fill mode is not divisible by 3!');
            }
            else {
                let vertexData: Vector2[] | Vector3[] | Vector4[] = [];
                let index = 0;
                switch (vertexBufferKind) {
                    case VertexBuffer.PositionKind:
                    case VertexBuffer.NormalKind: {
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index));
                            (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                            (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    case VertexBuffer.TangentKind: {
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index));
                            (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index + 2 * stride));
                            (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    case VertexBuffer.ColorKind: {
                        const size = vertexBuffer.getSize();
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + size) {
                            index = x * stride;
                            if (size === 4) {
                                (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index));
                                (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index + 2 * stride));
                                (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index + stride));
                            }
                            else {
                                (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index));
                                (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                                (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index + stride));
                            }
                        }
                        break;
                    }
                    case VertexBuffer.UVKind:
                    case VertexBuffer.UV2Kind: {
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            (vertexData as Vector2[]).push(Vector2.FromArray(meshAttributeArray, index));
                            (vertexData as Vector2[]).push(Vector2.FromArray(meshAttributeArray, index + 2 * stride));
                            (vertexData as Vector2[]).push(Vector2.FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    default: {
                        Tools.Error(`Unsupported Vertex Buffer type: ${vertexBufferKind}`);
                    }
                }
                this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter, convertToRightHandedSystem);
            }
        }
        else {
            Tools.Warn(`reorderTriangleFillMode: Vertex Buffer Kind ${vertexBufferKind} not present!`);
        }
    }

    /**
     * Reorders the vertex attributes in the correct triangle strip order.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private reorderTriangleStripDrawMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean) {
        const vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh() as Mesh);
        if (vertexBuffer) {
            const stride = vertexBuffer.byteStride / VertexBuffer.GetTypeByteLength(vertexBuffer.type);

            let vertexData: Vector2[] | Vector3[] | Vector4[] = [];
            let index = 0;
            switch (vertexBufferKind) {
                case VertexBuffer.PositionKind:
                case VertexBuffer.NormalKind: {
                    index = submesh.verticesStart;
                    (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                    (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index + stride));
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.ColorKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexBuffer.getSize() === 4 ? (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index)) : (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.UVKind:
                case VertexBuffer.UV2Kind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        (vertexData as Vector2[]).push(Vector2.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                default: {
                    Tools.Error(`Unsupported Vertex Buffer type: ${vertexBufferKind}`);
                }
            }
            this.writeVertexAttributeData(vertexData, byteOffset + 12, vertexBufferKind, meshAttributeArray, binaryWriter, convertToRightHandedSystem);
        }
        else {
            Tools.Warn(`reorderTriangleStripDrawMode: Vertex buffer kind ${vertexBufferKind} not present!`);
        }
    }

    /**
     * Reorders the vertex attributes in the correct triangle fan order.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param sideOrientation the winding order of the submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private reorderTriangleFanMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean) {
        const vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh() as Mesh);
        if (vertexBuffer) {
            let stride = vertexBuffer.byteStride / VertexBuffer.GetTypeByteLength(vertexBuffer.type);

            let vertexData: Vector2[] | Vector3[] | Vector4[] = [];
            let index = 0;
            switch (vertexBufferKind) {
                case VertexBuffer.PositionKind:
                case VertexBuffer.NormalKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index));
                    }
                    break;

                }
                case VertexBuffer.ColorKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index));
                        vertexBuffer.getSize() === 4 ? (vertexData as Vector4[]).push(Vector4.FromArray(meshAttributeArray, index)) : (vertexData as Vector3[]).push(Vector3.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.UVKind:
                case VertexBuffer.UV2Kind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        (vertexData as Vector2[]).push(Vector2.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                default: {
                    Tools.Error(`Unsupported Vertex Buffer type: ${vertexBufferKind}`);
                }
            }
            this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter, convertToRightHandedSystem);
        }
        else {
            Tools.Warn(`reorderTriangleFanMode: Vertex buffer kind ${vertexBufferKind} not present!`);
        }
    }

    /**
     * Writes the vertex attribute data to binary
     * @param vertices The vertices to write to the binary writer
     * @param byteOffset The offset into the binary writer to overwrite binary data
     * @param vertexAttributeKind The vertex attribute type
     * @param meshAttributeArray The vertex attribute data
     * @param binaryWriter The writer containing the binary data
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private writeVertexAttributeData(vertices: Vector2[] | Vector3[] | Vector4[], byteOffset: number, vertexAttributeKind: string, meshAttributeArray: FloatArray, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean) {
        for (let vertex of vertices) {
            if (convertToRightHandedSystem && !(vertexAttributeKind === VertexBuffer.ColorKind) && !(vertex instanceof Vector2)) {
                if (vertex instanceof Vector3) {
                    if (vertexAttributeKind === VertexBuffer.NormalKind) {
                        _GLTFUtilities._GetRightHandedNormalVector3FromRef(vertex);
                    }
                    else if (vertexAttributeKind === VertexBuffer.PositionKind) {
                        _GLTFUtilities._GetRightHandedPositionVector3FromRef(vertex);
                    }
                    else {
                        Tools.Error('Unsupported vertex attribute kind!');
                    }
                }
                else {
                    _GLTFUtilities._GetRightHandedVector4FromRef(vertex);
                }
            }
            if (vertexAttributeKind === VertexBuffer.NormalKind) {
                vertex.normalize();
            }
            else if (vertexAttributeKind === VertexBuffer.TangentKind && vertex instanceof Vector4) {
                _GLTFUtilities._NormalizeTangentFromRef(vertex);
            }

            for (let component of vertex.asArray()) {
                binaryWriter.setFloat32(component, byteOffset);
                byteOffset += 4;
            }
        }
    }

    /**
     * Writes mesh attribute data to a data buffer
     * Returns the bytelength of the data
     * @param vertexBufferKind Indicates what kind of vertex data is being passed in
     * @param meshAttributeArray Array containing the attribute data
     * @param byteStride Specifies the space between data
     * @param binaryWriter The buffer to write the binary data to
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    public writeAttributeData(vertexBufferKind: string, attributeComponentKind: AccessorComponentType, meshAttributeArray: FloatArray, stride: number, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean, babylonTransformNode: TransformNode) {
        let vertexAttributes: number[][] = [];
        let index: number;

        switch (vertexBufferKind) {
            case VertexBuffer.PositionKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    if (convertToRightHandedSystem) {
                        _GLTFUtilities._GetRightHandedPositionVector3FromRef(vertexData);
                    }
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.NormalKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    if (convertToRightHandedSystem) {
                        _GLTFUtilities._GetRightHandedNormalVector3FromRef(vertexData);
                    }
                    vertexData.normalize();
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.TangentKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    if (convertToRightHandedSystem) {
                        _GLTFUtilities._GetRightHandedVector4FromRef(vertexData);
                    }
                    _GLTFUtilities._NormalizeTangentFromRef(vertexData);

                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.ColorKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = stride === 3 ? Vector3.FromArray(meshAttributeArray, index) : Vector4.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.UVKind:
            case VertexBuffer.UV2Kind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    vertexAttributes.push(convertToRightHandedSystem ? [meshAttributeArray[index], meshAttributeArray[index + 1]] : [meshAttributeArray[index], meshAttributeArray[index + 1]]);
                }
                break;
            }
            case VertexBuffer.MatricesIndicesKind:
            case VertexBuffer.MatricesIndicesExtraKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.MatricesWeightsKind:
            case VertexBuffer.MatricesWeightsExtraKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    vertexData.normalize();
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            default: {
                Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                vertexAttributes = [];
            }
        }

        let writeBinaryFunc;
        switch (attributeComponentKind){
            case AccessorComponentType.UNSIGNED_BYTE: {
                writeBinaryFunc = binaryWriter.setUInt8.bind(binaryWriter);
                break;
            }
            case AccessorComponentType.UNSIGNED_SHORT: {
                writeBinaryFunc = binaryWriter.setUInt16.bind(binaryWriter);
                break;
            }
            case AccessorComponentType.UNSIGNED_INT: {
                writeBinaryFunc = binaryWriter.setUInt32.bind(binaryWriter);
            }
            case AccessorComponentType.FLOAT: {
                writeBinaryFunc = binaryWriter.setFloat32.bind(binaryWriter);
                break;
            }
            default: {
                Tools.Warn("Unsupported Attribute Component kind: " + attributeComponentKind);
                return;
            }
        }

        for (let vertexAttribute of vertexAttributes) {
            for (let component of vertexAttribute) {
                writeBinaryFunc(component);
            }
        }
    }

    /**
     * Generates glTF json data
     * @param shouldUseGlb Indicates whether the json should be written for a glb file
     * @param glTFPrefix Text to use when prefixing a glTF file
     * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
     * @returns json data as string
     */
    private generateJSON(shouldUseGlb: boolean, glTFPrefix?: string, prettyPrint?: boolean): string {
        let buffer: IBuffer = { byteLength: this._totalByteLength };
        let imageName: string;
        let imageData: { data: Uint8Array, mimeType: ImageMimeType };
        let bufferView: IBufferView;
        let byteOffset: number = this._totalByteLength;

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
            }
            else {
                this._glTF.images = [];

                this._images.forEach((image) => {
                    if (image.uri) {
                        imageData = this._imageData[image.uri];
                        imageName = image.uri.split('.')[0] + " image";
                        bufferView = _GLTFUtilities._CreateBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                        byteOffset += imageData.data.buffer.byteLength;
                        this._bufferViews.push(bufferView);
                        image.bufferView = this._bufferViews.length - 1;
                        image.name = imageName;
                        image.mimeType = imageData.mimeType;
                        image.uri = undefined;
                        if (!this._glTF.images) {
                            this._glTF.images = [];
                        }
                        this._glTF.images.push(image);
                    }
                });
                // Replace uri with bufferview and mime type for glb
                buffer.byteLength = byteOffset;
            }
        }

        if (!shouldUseGlb) {
            buffer.uri = glTFPrefix + ".bin";
        }

        const jsonText = prettyPrint ? JSON.stringify(this._glTF, null, 2) : JSON.stringify(this._glTF);

        return jsonText;
    }

    /**
     * Generates data for .gltf and .bin files based on the glTF prefix string
     * @param glTFPrefix Text to use when prefixing a glTF file
     * @param dispose Dispose the exporter
     * @returns GLTFData with glTF file data
     */
    public _generateGLTFAsync(glTFPrefix: string, dispose = true): Promise<GLTFData> {
        return this._generateBinaryAsync().then((binaryBuffer) => {
            this._extensionsOnExporting();
            const jsonText = this.generateJSON(false, glTFPrefix, true);
            const bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });

            const glTFFileName = glTFPrefix + '.gltf';
            const glTFBinFile = glTFPrefix + '.bin';

            const container = new GLTFData();

            container.glTFFiles[glTFFileName] = jsonText;
            container.glTFFiles[glTFBinFile] = bin;

            if (this._imageData) {
                for (let image in this._imageData) {
                    container.glTFFiles[image] = new Blob([this._imageData[image].data], { type: this._imageData[image].mimeType });
                }
            }

            if (dispose) {
                this.dispose();
            }

            return container;
        });

    }

    /**
     * Creates a binary buffer for glTF
     * @returns array buffer for binary data
     */
    private _generateBinaryAsync(): Promise<ArrayBuffer> {
        let binaryWriter = new _BinaryWriter(4);
        return this.createSceneAsync(this._babylonScene, binaryWriter).then(() => {
            if (this._localEngine) {
                this._localEngine.dispose();
            }
            return binaryWriter.getArrayBuffer();
        });
    }

    /**
     * Pads the number to a multiple of 4
     * @param num number to pad
     * @returns padded number
     */
    private _getPadding(num: number): number {
        let remainder = num % 4;
        let padding = remainder === 0 ? remainder : 4 - remainder;

        return padding;
    }

    /**
     * @hidden
     */
    public _generateGLBAsync(glTFPrefix: string, dispose = true): Promise<GLTFData> {
        return this._generateBinaryAsync().then((binaryBuffer) => {
            this._extensionsOnExporting();
            const jsonText = this.generateJSON(true);
            const glbFileName = glTFPrefix + '.glb';
            const headerLength = 12;
            const chunkLengthPrefix = 8;
            const jsonLength = jsonText.length;
            let imageByteLength = 0;

            for (let key in this._imageData) {
                imageByteLength += this._imageData[key].data.byteLength;
            }
            const jsonPadding = this._getPadding(jsonLength);
            const binPadding = this._getPadding(binaryBuffer.byteLength);
            const imagePadding = this._getPadding(imageByteLength);

            const byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength + imagePadding;

            //header
            const headerBuffer = new ArrayBuffer(headerLength);
            const headerBufferView = new DataView(headerBuffer);
            headerBufferView.setUint32(0, 0x46546C67, true); //glTF
            headerBufferView.setUint32(4, 2, true); // version
            headerBufferView.setUint32(8, byteLength, true); // total bytes in file

            //json chunk
            const jsonChunkBuffer = new ArrayBuffer(chunkLengthPrefix + jsonLength + jsonPadding);
            const jsonChunkBufferView = new DataView(jsonChunkBuffer);
            jsonChunkBufferView.setUint32(0, jsonLength + jsonPadding, true);
            jsonChunkBufferView.setUint32(4, 0x4E4F534A, true);

            //json chunk bytes
            const jsonData = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix);
            for (let i = 0; i < jsonLength; ++i) {
                jsonData[i] = jsonText.charCodeAt(i);
            }

            //json padding
            const jsonPaddingView = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix + jsonLength);
            for (let i = 0; i < jsonPadding; ++i) {
                jsonPaddingView[i] = 0x20;
            }

            //binary chunk
            const binaryChunkBuffer = new ArrayBuffer(chunkLengthPrefix);
            const binaryChunkBufferView = new DataView(binaryChunkBuffer);
            binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + imageByteLength + imagePadding, true);
            binaryChunkBufferView.setUint32(4, 0x004E4942, true);

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
            for (let key in this._imageData) {
                glbData.push(this._imageData[key].data.buffer);
            }
            glbData.push(binPaddingBuffer);

            glbData.push(imagePaddingBuffer);

            const glbFile = new Blob(glbData, { type: 'application/octet-stream' });

            const container = new GLTFData();
            container.glTFFiles[glbFileName] = glbFile;

            if (this._localEngine != null) {
                this._localEngine.dispose();
            }

            if (dispose) {
                this.dispose();
            }

            return container;
        });
    }

    /**
     * Sets the TRS for each node
     * @param node glTF Node for storing the transformation data
     * @param babylonTransformNode Babylon mesh used as the source for the transformation data
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private setNodeTransformation(node: INode, babylonTransformNode: TransformNode, convertToRightHandedSystem: boolean): void {
        if (!babylonTransformNode.getPivotPoint().equalsToFloats(0, 0, 0)) {
            Tools.Warn("Pivot points are not supported in the glTF serializer");
        }
        if (!babylonTransformNode.position.equalsToFloats(0, 0, 0)) {
            node.translation = convertToRightHandedSystem ? _GLTFUtilities._GetRightHandedPositionVector3(babylonTransformNode.position).asArray() : babylonTransformNode.position.asArray();
        }

        if (!babylonTransformNode.scaling.equalsToFloats(1, 1, 1)) {
            node.scale = babylonTransformNode.scaling.asArray();
        }

        let rotationQuaternion = Quaternion.RotationYawPitchRoll(babylonTransformNode.rotation.y, babylonTransformNode.rotation.x, babylonTransformNode.rotation.z);
        if (babylonTransformNode.rotationQuaternion) {
            rotationQuaternion.multiplyInPlace(babylonTransformNode.rotationQuaternion);
        }
        if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
            if (convertToRightHandedSystem) {
                _GLTFUtilities._GetRightHandedQuaternionFromRef(rotationQuaternion);

            }
            node.rotation = rotationQuaternion.normalize().asArray();
        }
    }

    private getVertexBufferFromMesh(attributeKind: string, bufferMesh: Mesh): Nullable<VertexBuffer> {
        if (bufferMesh.isVerticesDataPresent(attributeKind)) {
            const vertexBuffer = bufferMesh.getVertexBuffer(attributeKind);
            if (vertexBuffer) {
                return vertexBuffer;
            }
        }
        return null;
    }

    /**
     * Creates a bufferview based on the vertices type for the Babylon mesh
     * @param kind Indicates the type of vertices data
     * @param componentType Indicates the numerical type used to store the data
     * @param babylonTransformNode The Babylon mesh to get the vertices data from
     * @param binaryWriter The buffer to write the bufferview data to
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private createBufferViewKind(kind: string, attributeComponentKind: AccessorComponentType, babylonTransformNode: TransformNode, binaryWriter: _BinaryWriter, byteStride: number, convertToRightHandedSystem: boolean) {
        const bufferMesh = babylonTransformNode instanceof Mesh ?
            babylonTransformNode as Mesh : babylonTransformNode instanceof InstancedMesh ?
                (babylonTransformNode as InstancedMesh).sourceMesh : null;

        if (bufferMesh) {
            const vertexBuffer = bufferMesh.getVertexBuffer(kind);
            const vertexData = bufferMesh.getVerticesData(kind);

            if (vertexBuffer && vertexData) {
                const typeByteLength = VertexBuffer.GetTypeByteLength(attributeComponentKind);
                const byteLength = vertexData.length * typeByteLength;
                const bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                this._bufferViews.push(bufferView);

                this.writeAttributeData(
                    kind,
                    attributeComponentKind,
                    vertexData,
                    byteStride / typeByteLength,
                    binaryWriter,
                    convertToRightHandedSystem,
                    babylonTransformNode
                );
            }
        }
    }

    /**
     * The primitive mode of the Babylon mesh
     * @param babylonMesh The BabylonJS mesh
     */
    private getMeshPrimitiveMode(babylonMesh: AbstractMesh): number {
        if (babylonMesh instanceof LinesMesh) {
            return Material.LineListDrawMode;
        }
        return babylonMesh.material ? babylonMesh.material.fillMode : Material.TriangleFillMode;
    }

    /**
     * Sets the primitive mode of the glTF mesh primitive
     * @param meshPrimitive glTF mesh primitive
     * @param primitiveMode The primitive mode
     */
    private setPrimitiveMode(meshPrimitive: IMeshPrimitive, primitiveMode: number) {
        switch (primitiveMode) {
            case Material.TriangleFillMode: {
                // glTF defaults to using Triangle Mode
                break;
            }
            case Material.TriangleStripDrawMode: {
                meshPrimitive.mode = MeshPrimitiveMode.TRIANGLE_STRIP;
                break;
            }
            case Material.TriangleFanDrawMode: {
                meshPrimitive.mode = MeshPrimitiveMode.TRIANGLE_FAN;
                break;
            }
            case Material.PointListDrawMode: {
                meshPrimitive.mode = MeshPrimitiveMode.POINTS;
            }
            case Material.PointFillMode: {
                meshPrimitive.mode = MeshPrimitiveMode.POINTS;
                break;
            }
            case Material.LineLoopDrawMode: {
                meshPrimitive.mode = MeshPrimitiveMode.LINE_LOOP;
                break;
            }
            case Material.LineListDrawMode: {
                meshPrimitive.mode = MeshPrimitiveMode.LINES;
                break;
            }
            case Material.LineStripDrawMode: {
                meshPrimitive.mode = MeshPrimitiveMode.LINE_STRIP;
                break;
            }
        }
    }

    /**
     * Sets the vertex attribute accessor based of the glTF mesh primitive
     * @param meshPrimitive glTF mesh primitive
     * @param attributeKind vertex attribute
     * @returns boolean specifying if uv coordinates are present
     */
    private setAttributeKind(meshPrimitive: IMeshPrimitive, attributeKind: string): void {
        switch (attributeKind) {
            case VertexBuffer.PositionKind: {
                meshPrimitive.attributes.POSITION = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.NormalKind: {
                meshPrimitive.attributes.NORMAL = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.ColorKind: {
                meshPrimitive.attributes.COLOR_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.TangentKind: {
                meshPrimitive.attributes.TANGENT = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.UVKind: {
                meshPrimitive.attributes.TEXCOORD_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.UV2Kind: {
                meshPrimitive.attributes.TEXCOORD_1 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesIndicesKind: {
                meshPrimitive.attributes.JOINTS_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesIndicesExtraKind: {
                meshPrimitive.attributes.JOINTS_1 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesWeightsKind: {
                meshPrimitive.attributes.WEIGHTS_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesWeightsExtraKind: {
                meshPrimitive.attributes.WEIGHTS_1 = this._accessors.length - 1;
                break;
            }
            default: {
                Tools.Warn("Unsupported Vertex Buffer Type: " + attributeKind);
            }
        }
    }

    /**
     * Sets data for the primitive attributes of each submesh
     * @param mesh glTF Mesh object to store the primitive attribute information
     * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
     * @param binaryWriter Buffer to write the attribute data to
     * @param convertToRightHandedSystem Converts the values to right-handed
     */
    private setPrimitiveAttributesAsync(mesh: IMesh, babylonTransformNode: TransformNode, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean): Promise<void> {
        let promises: Promise<IMeshPrimitive>[] = [];
        let bufferMesh: Nullable<Mesh> = null;
        let bufferView: IBufferView;
        let minMax: { min: Nullable<number[]>, max: Nullable<number[]> };

        if (babylonTransformNode instanceof Mesh) {
            bufferMesh = (babylonTransformNode as Mesh);
        }
        else if (babylonTransformNode instanceof InstancedMesh) {
            bufferMesh = (babylonTransformNode as InstancedMesh).sourceMesh;
        }
        const attributeData: _IVertexAttributeData[] = [
            { kind: VertexBuffer.PositionKind, accessorType: AccessorType.VEC3, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 12 },
            { kind: VertexBuffer.NormalKind, accessorType: AccessorType.VEC3, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 12 },
            { kind: VertexBuffer.ColorKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
            { kind: VertexBuffer.TangentKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
            { kind: VertexBuffer.UVKind, accessorType: AccessorType.VEC2, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 8  },
            { kind: VertexBuffer.UV2Kind, accessorType: AccessorType.VEC2, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 8  },
            { kind: VertexBuffer.MatricesIndicesKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.UNSIGNED_SHORT, byteStride: 8 },
            { kind: VertexBuffer.MatricesIndicesExtraKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.UNSIGNED_SHORT, byteStride: 8 },
            { kind: VertexBuffer.MatricesWeightsKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
            { kind: VertexBuffer.MatricesWeightsExtraKind, accessorType: AccessorType.VEC4, accessorComponentType: AccessorComponentType.FLOAT, byteStride: 16 },
        ];

        if (bufferMesh) {
            let indexBufferViewIndex: Nullable<number> = null;
            const primitiveMode = this.getMeshPrimitiveMode(bufferMesh);
            let vertexAttributeBufferViews: { [attributeKind: string]: number } = {};

            // For each BabylonMesh, create bufferviews for each 'kind'
            for (const attribute of attributeData) {
                const attributeKind = attribute.kind;
                const attributeComponentKind = attribute.accessorComponentType;
                if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                    const vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                    attribute.byteStride = vertexBuffer ? vertexBuffer.getSize() * VertexBuffer.GetTypeByteLength(attribute.accessorComponentType) : VertexBuffer.DeduceStride(attributeKind) * 4;
                    if (attribute.byteStride === 12) {
                        attribute.accessorType = AccessorType.VEC3;
                    }

                    this.createBufferViewKind(attributeKind, attributeComponentKind, babylonTransformNode, binaryWriter, attribute.byteStride, convertToRightHandedSystem);
                    attribute.bufferViewIndex = this._bufferViews.length - 1;
                    vertexAttributeBufferViews[attributeKind] = attribute.bufferViewIndex;
                }
            }

            if (bufferMesh.getTotalIndices()) {
                const indices = bufferMesh.getIndices();
                if (indices) {
                    const byteLength = indices.length * 4;
                    bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                    this._bufferViews.push(bufferView);
                    indexBufferViewIndex = this._bufferViews.length - 1;

                    for (let k = 0, length = indices.length; k < length; ++k) {
                        binaryWriter.setUInt32(indices[k]);
                    }
                }
            }

            if (bufferMesh.subMeshes) {
                // go through all mesh primitives (submeshes)
                for (const submesh of bufferMesh.subMeshes) {
                    let babylonMaterial = submesh.getMaterial() || bufferMesh.getScene().defaultMaterial;

                    let materialIndex: Nullable<number> = null;
                    if (babylonMaterial) {
                        if (bufferMesh instanceof LinesMesh) {
                            // get the color from the lines mesh and set it in the material
                            const material: IMaterial = {
                                name: bufferMesh.name + ' material'
                            };
                            if (!bufferMesh.color.equals(Color3.White()) || bufferMesh.alpha < 1) {
                                material.pbrMetallicRoughness = {
                                    baseColorFactor: bufferMesh.color.asArray().concat([bufferMesh.alpha])
                                };
                            }
                            this._materials.push(material);
                            materialIndex = this._materials.length - 1;
                        }
                        else if (babylonMaterial instanceof MultiMaterial) {
                            const subMaterial = babylonMaterial.subMaterials[submesh.materialIndex];
                            if (subMaterial) {
                                babylonMaterial = subMaterial;
                                materialIndex = this._materialMap[babylonMaterial.uniqueId];
                            }
                        }
                        else {
                            materialIndex = this._materialMap[babylonMaterial.uniqueId];
                        }
                    }

                    let glTFMaterial: Nullable<IMaterial> = materialIndex != null ? this._materials[materialIndex] : null;

                    const meshPrimitive: IMeshPrimitive = { attributes: {} };
                    this.setPrimitiveMode(meshPrimitive, primitiveMode);

                    for (const attribute of attributeData) {
                        const attributeKind = attribute.kind;
                        if (attributeKind === VertexBuffer.UVKind || attributeKind === VertexBuffer.UV2Kind) {
                            if (glTFMaterial && !this._glTFMaterialExporter._hasTexturesPresent(glTFMaterial)) {
                                continue;
                            }
                        }
                        let vertexData = bufferMesh.getVerticesData(attributeKind);
                        if (vertexData) {
                            const vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                            if (vertexBuffer) {
                                const stride = vertexBuffer.getSize();
                                const bufferViewIndex = attribute.bufferViewIndex;
                                if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                    minMax = { min: null, max: null };
                                    if (attributeKind == VertexBuffer.PositionKind) {
                                        minMax = _GLTFUtilities._CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride, convertToRightHandedSystem);
                                    }
                                    const accessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonTransformNode.name, attribute.accessorType, attribute.accessorComponentType, vertexData.length / stride, 0, minMax.min, minMax.max);
                                    this._accessors.push(accessor);
                                    this.setAttributeKind(meshPrimitive, attributeKind);
                                }
                            }
                        }
                    }
                    if (indexBufferViewIndex) {
                        // Create accessor
                        const accessor = _GLTFUtilities._CreateAccessor(indexBufferViewIndex, "indices - " + babylonTransformNode.name, AccessorType.SCALAR, AccessorComponentType.UNSIGNED_INT, submesh.indexCount, submesh.indexStart * 4, null, null);
                        this._accessors.push(accessor);
                        meshPrimitive.indices = this._accessors.length - 1;
                    }
                    if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                        let sideOrientation = bufferMesh.overrideMaterialSideOrientation !== null ? bufferMesh.overrideMaterialSideOrientation : babylonMaterial.sideOrientation;

                        if ((sideOrientation == Material.ClockWiseSideOrientation && this._babylonScene.useRightHandedSystem)
                            || (sideOrientation == Material.ClockWiseSideOrientation && convertToRightHandedSystem && bufferMesh.overrideMaterialSideOrientation !== bufferMesh.material?.sideOrientation)) {
                            let byteOffset = indexBufferViewIndex != null ? this._bufferViews[indexBufferViewIndex].byteOffset : null;
                            if (byteOffset == null) { byteOffset = 0; }
                            let babylonIndices: Nullable<IndicesArray> = null;
                            if (indexBufferViewIndex != null) {
                                babylonIndices = bufferMesh.getIndices();
                            }
                            if (babylonIndices) {
                                this.reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter);
                            }
                            else {
                                for (let attribute of attributeData) {
                                    let vertexData = bufferMesh.getVerticesData(attribute.kind);
                                    if (vertexData) {
                                        let byteOffset = this._bufferViews[vertexAttributeBufferViews[attribute.kind]].byteOffset;
                                        if (!byteOffset) {
                                            byteOffset = 0;
                                        }
                                        this.reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, sideOrientation, attribute.kind, vertexData, byteOffset, binaryWriter, convertToRightHandedSystem);
                                    }
                                }
                            }
                        }

                        meshPrimitive.material = materialIndex;

                    }
                    mesh.primitives.push(meshPrimitive);

                    const promise = this._extensionsPostExportMeshPrimitiveAsync("postExport", meshPrimitive, submesh, binaryWriter);
                    if (promise) {
                        promises.push();
                    }
                }
            }
        }
        return Promise.all(promises).then(() => {
            /* do nothing */
        });
    }

    /**
     * Check if the node is used to convert its descendants from a right handed coordinate system to the Babylon scene's coordinate system.
     * @param node The node to check
     * @returns True if the node is used to convert its descendants from right-handed to left-handed. False otherwise
     */
    private isBabylonCoordinateSystemConvertingNode(node: Node): boolean {
        if (node instanceof TransformNode)
        {
            if (node.name !== "__root__") {
                return false;
            }
            // Transform
            let matrix = node.getWorldMatrix();
            let matrixToLeftHanded = Matrix.Compose(this._convertToRightHandedSystem ? new Vector3(-1, 1, 1) : Vector3.One(), Quaternion.Identity(), Vector3.Zero());
            let matrixProduct = matrix.multiply(matrixToLeftHanded);
            let matrixIdentity = Matrix.IdentityReadOnly;

            for (let i = 0; i < 16; i++) {
                if (Math.abs(matrixProduct.m[i] - matrixIdentity.m[i]) > Epsilon) {
                    return false;
                }
            }

            // Geometry
            if ((node instanceof Mesh && node.geometry !== null) ||
                (node instanceof InstancedMesh && node.sourceMesh.geometry !== null)) {
                return false;
            }

            if (this._includeCoordinateSystemConversionNodes) {
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * Creates a glTF scene based on the array of meshes
     * Returns the the total byte offset
     * @param babylonScene Babylon scene to get the mesh data from
     * @param binaryWriter Buffer to write binary data to
     */
    private createSceneAsync(babylonScene: Scene, binaryWriter: _BinaryWriter): Promise<void> {
        const scene: IScene = { nodes: [] };
        let glTFNodeIndex: number;
        let glTFNode: INode;
        let directDescendents: Node[];
        const nodes: Node[] = [...babylonScene.transformNodes, ...babylonScene.meshes, ...babylonScene.lights];
        let rootNodesToLeftHanded: Node[] = [];

        this._convertToRightHandedSystem = !babylonScene.useRightHandedSystem;
        this._convertToRightHandedSystemMap = {};

        // Set default values for all nodes
        babylonScene.rootNodes.forEach((rootNode) => {
            this._convertToRightHandedSystemMap[rootNode.uniqueId] = this._convertToRightHandedSystem;
            rootNode.getDescendants(false).forEach((descendant) => {
                this._convertToRightHandedSystemMap[descendant.uniqueId] = this._convertToRightHandedSystem;
            });
        });

        // Check if root nodes converting to left-handed are present
        babylonScene.rootNodes.forEach((rootNode) => {
            if (this.isBabylonCoordinateSystemConvertingNode(rootNode)) {
                rootNodesToLeftHanded.push(rootNode);

                // Exclude the node from list of nodes to export
                const indexRootNode = nodes.indexOf(rootNode);
                if (indexRootNode !== -1) { // should always be true
                    nodes.splice(indexRootNode, 1);
                }

                // Cancel conversion to right handed system
                rootNode.getDescendants(false).forEach((descendant) => {
                    this._convertToRightHandedSystemMap[descendant.uniqueId] = false;
                });
            }
        });

        return this._glTFMaterialExporter._convertMaterialsToGLTFAsync(babylonScene.materials, ImageMimeType.PNG, true).then(() => {
            return this.createNodeMapAndAnimationsAsync(babylonScene, nodes, binaryWriter).then((nodeMap) => {
                return this.createSkinsAsync(babylonScene, nodeMap, binaryWriter).then((skinMap) => {
                    this._nodeMap = nodeMap;

                    this._totalByteLength = binaryWriter.getByteOffset();
                    if (this._totalByteLength == undefined) {
                        throw new Error("undefined byte length!");
                    }

                    // Build Hierarchy with the node map.
                    for (let babylonNode of nodes) {
                        glTFNodeIndex = this._nodeMap[babylonNode.uniqueId];
                        if (glTFNodeIndex !== undefined) {
                            glTFNode = this._nodes[glTFNodeIndex];

                            if (babylonNode.metadata) {
                                if (this._options.metadataSelector) {
                                    glTFNode.extras = this._options.metadataSelector(babylonNode.metadata);
                                } else if (babylonNode.metadata.gltf) {
                                    glTFNode.extras = babylonNode.metadata.gltf.extras;
                                }
                            }

                            if (!babylonNode.parent || rootNodesToLeftHanded.indexOf(babylonNode.parent) !== -1) {
                                if (this._options.shouldExportNode && !this._options.shouldExportNode(babylonNode)) {
                                    Tools.Log("Omitting " + babylonNode.name + " from scene.");
                                }
                                else {
                                    let convertToRightHandedSystem = this._convertToRightHandedSystemMap[babylonNode.uniqueId];
                                    if (convertToRightHandedSystem) {
                                        if (glTFNode.translation) {
                                            glTFNode.translation[2] *= -1;
                                            glTFNode.translation[0] *= -1;
                                        }
                                        glTFNode.rotation = glTFNode.rotation ? Quaternion.FromArray([0, 1, 0, 0]).multiply(Quaternion.FromArray(glTFNode.rotation)).asArray() : (Quaternion.FromArray([0, 1, 0, 0])).asArray();
                                    }

                                    scene.nodes.push(glTFNodeIndex);
                                }
                            }

                            if (babylonNode instanceof Mesh) {
                                let babylonMesh : Mesh = babylonNode;
                                if (babylonMesh.skeleton) {
                                    glTFNode.skin = skinMap[babylonMesh.skeleton.uniqueId];
                                }
                            }

                            directDescendents = babylonNode.getDescendants(true);
                            if (!glTFNode.children && directDescendents && directDescendents.length) {
                                const children: number[] = [];
                                for (let descendent of directDescendents) {
                                    if (this._nodeMap[descendent.uniqueId] != null) {
                                        children.push(this._nodeMap[descendent.uniqueId]);
                                    }
                                }
                                if (children.length) {
                                    glTFNode.children = children;
                                }
                            }
                        }
                    }
                    if (scene.nodes.length) {
                        this._scenes.push(scene);
                    }
                });
            });
        });
    }

    /**
     * Creates a mapping of Node unique id to node index and handles animations
     * @param babylonScene Babylon Scene
     * @param nodes Babylon transform nodes
     * @param binaryWriter Buffer to write binary data to
     * @returns Node mapping of unique id to index
     */
    private createNodeMapAndAnimationsAsync(babylonScene: Scene, nodes: Node[], binaryWriter: _BinaryWriter): Promise<{ [key: number]: number }> {
        let promiseChain = Promise.resolve();
        const nodeMap: { [key: number]: number } = {};
        let nodeIndex: number;
        let runtimeGLTFAnimation: IAnimation = {
            name: 'runtime animations',
            channels: [],
            samplers: []
        };
        let idleGLTFAnimations: IAnimation[] = [];

        for (let babylonNode of nodes) {
            if (!this._options.shouldExportNode || this._options.shouldExportNode(babylonNode)) {
                promiseChain = promiseChain.then(() => {
                    let convertToRightHandedSystem = this._convertToRightHandedSystemMap[babylonNode.uniqueId];
                    return this.createNodeAsync(babylonNode, binaryWriter, convertToRightHandedSystem, nodeMap).then((node) => {
                        const promise = this._extensionsPostExportNodeAsync("createNodeAsync", node, babylonNode, nodeMap);
                        if (promise == null) {
                            Tools.Warn(`Not exporting node ${babylonNode.name}`);
                            return Promise.resolve();
                        }
                        else {
                            return promise.then((node) => {
                                if (!node) {
                                    return;
                                }
                                this._nodes.push(node);
                                nodeIndex = this._nodes.length - 1;
                                nodeMap[babylonNode.uniqueId] = nodeIndex;

                                if (!babylonScene.animationGroups.length && babylonNode.animations.length) {
                                    _GLTFAnimation._CreateNodeAnimationFromNodeAnimations(babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, this._nodes, binaryWriter, this._bufferViews, this._accessors, convertToRightHandedSystem, this._animationSampleRate);
                                }
                            });
                        }
                    });
                });
            }
            else {
                `Excluding node ${babylonNode.name}`;
            }
        }

        return promiseChain.then(() => {
            if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                this._animations.push(runtimeGLTFAnimation);
            }
            idleGLTFAnimations.forEach((idleGLTFAnimation) => {
                if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                    this._animations.push(idleGLTFAnimation);
                }
            });

            if (babylonScene.animationGroups.length) {
                _GLTFAnimation._CreateNodeAnimationFromAnimationGroups(babylonScene, this._animations, nodeMap, this._nodes, binaryWriter, this._bufferViews, this._accessors, this._convertToRightHandedSystemMap, this._animationSampleRate);
            }

            return nodeMap;
        });
    }

    /**
     * Creates a glTF node from a Babylon mesh
     * @param babylonMesh Source Babylon mesh
     * @param binaryWriter Buffer for storing geometry data
     * @param convertToRightHandedSystem Converts the values to right-handed
     * @param nodeMap Node mapping of unique id to glTF node index
     * @returns glTF node
     */
    private createNodeAsync(babylonNode: Node, binaryWriter: _BinaryWriter, convertToRightHandedSystem: boolean, nodeMap?: {[key: number]: number}): Promise<INode> {
        return Promise.resolve().then(() => {
            // create node to hold translation/rotation/scale and the mesh
            const node: INode = {};
            // create mesh
            const mesh: IMesh = { primitives: [] };

            if (babylonNode.name) {
                node.name = babylonNode.name;
            }

            if (babylonNode instanceof TransformNode) {
                // Set transformation
                this.setNodeTransformation(node, babylonNode, convertToRightHandedSystem);

                return this.setPrimitiveAttributesAsync(mesh, babylonNode, binaryWriter, convertToRightHandedSystem).then(() => {
                    if (mesh.primitives.length) {
                        this._meshes.push(mesh);
                        node.mesh = this._meshes.length - 1;
                    }
                    return node;
                });
            }
            else {
                return node;
            }
        });
    }

    /**
     * Creates a glTF skin from a Babylon skeleton
     * @param babylonScene Babylon Scene
     * @param nodes Babylon transform nodes
     * @param binaryWriter Buffer to write binary data to
     * @returns Node mapping of unique id to index
     */
    private createSkinsAsync(babylonScene: Scene, nodeMap: { [key: number]: number }, binaryWriter: _BinaryWriter): Promise<{ [key: number]: number }> {
        let promiseChain = Promise.resolve();
        const skinMap: { [key: number]: number } = {};
        for (let skeleton of babylonScene.skeletons) {
            // create skin
            const skin: ISkin = { joints: []};
            let inverseBindMatrices : Matrix[] = [];
            let skeletonMesh = babylonScene.meshes.find((mesh) => {mesh.skeleton === skeleton; });
            skin.skeleton = skeleton.overrideMesh === null ? (skeletonMesh ? nodeMap[skeletonMesh.uniqueId] : undefined) : nodeMap[skeleton.overrideMesh.uniqueId];
            for (let bone of skeleton.bones) {
                if (bone._index != -1) {
                    let transformNode = bone.getTransformNode();
                    if (transformNode) {
                        let boneMatrix = bone.getInvertedAbsoluteTransform();
                        if (this._convertToRightHandedSystem) {
                            _GLTFUtilities._GetRightHandedMatrixFromRef(boneMatrix);
                        }
                        inverseBindMatrices.push(boneMatrix);
                        skin.joints.push(nodeMap[transformNode.uniqueId]);
                    }
                }
            }
            // create buffer view for inverse bind matrices
            let byteStride = 64; // 4 x 4 matrix of 32 bit float
            let byteLength = inverseBindMatrices.length * byteStride;
            let bufferViewOffset = binaryWriter.getByteOffset();
            let bufferView = _GLTFUtilities._CreateBufferView(0, bufferViewOffset, byteLength, byteStride, "InverseBindMatrices" + " - " + skeleton.name);
            this._bufferViews.push(bufferView);
            let bufferViewIndex =  this._bufferViews.length - 1;
            let bindMatrixAccessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, "InverseBindMatrices" + " - " + skeleton.name, AccessorType.MAT4, AccessorComponentType.FLOAT, inverseBindMatrices.length, null, null, null);
            let inverseBindAccessorIndex = this._accessors.push(bindMatrixAccessor) - 1;
            skin.inverseBindMatrices = inverseBindAccessorIndex;
            this._skins.push(skin);
            skinMap[skeleton.uniqueId] = this._skins.length - 1;

            inverseBindMatrices.forEach((mat) => {
                mat.m.forEach((cell) => {
                    binaryWriter.setFloat32(cell);
                });
            });
        }
        return promiseChain.then(() => {
            return skinMap;
        });
    }
}

/**
 * @hidden
 *
 * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
 */
export class _BinaryWriter {
    /**
     * Array buffer which stores all binary data
     */
    private _arrayBuffer: ArrayBuffer;
    /**
     * View of the array buffer
     */
    private _dataView: DataView;
    /**
     * byte offset of data in array buffer
     */
    private _byteOffset: number;
    /**
     * Initialize binary writer with an initial byte length
     * @param byteLength Initial byte length of the array buffer
     */
    constructor(byteLength: number) {
        this._arrayBuffer = new ArrayBuffer(byteLength);
        this._dataView = new DataView(this._arrayBuffer);
        this._byteOffset = 0;
    }
    /**
     * Resize the array buffer to the specified byte length
     * @param byteLength
     */
    private resizeBuffer(byteLength: number): ArrayBuffer {
        let newBuffer = new ArrayBuffer(byteLength);
        let oldUint8Array = new Uint8Array(this._arrayBuffer);
        let newUint8Array = new Uint8Array(newBuffer);
        for (let i = 0, length = newUint8Array.byteLength; i < length; ++i) {
            newUint8Array[i] = oldUint8Array[i];
        }
        this._arrayBuffer = newBuffer;
        this._dataView = new DataView(this._arrayBuffer);

        return newBuffer;
    }
    /**
     * Get an array buffer with the length of the byte offset
     * @returns ArrayBuffer resized to the byte offset
     */
    public getArrayBuffer(): ArrayBuffer {
        return this.resizeBuffer(this.getByteOffset());
    }
    /**
     * Get the byte offset of the array buffer
     * @returns byte offset
     */
    public getByteOffset(): number {
        if (this._byteOffset == undefined) {
            throw new Error("Byte offset is undefined!");
        }
        return this._byteOffset;
    }
    /**
     * Stores an UInt8 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    public setUInt8(entry: number, byteOffset?: number) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint8(byteOffset, entry);
            }
            else {
                Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            }
        }
        else {
            if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint8(this._byteOffset, entry);
            this._byteOffset += 1;
        }
    }

    /**
     * Stores an UInt16 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    public setUInt16(entry: number, byteOffset?: number) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint16(byteOffset, entry, true);
            }
            else {
                Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            }
        }
        else {
            if (this._byteOffset + 2 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint16(this._byteOffset, entry, true);
            this._byteOffset += 2;
        }
    }

    /**
     * Gets an UInt32 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    public getUInt32(byteOffset: number): number {
        if (byteOffset < this._byteOffset) {
            return this._dataView.getUint32(byteOffset, true);
        }
        else {
            Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            throw new Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
        }
    }

    public getVector3Float32FromRef(vector3: Vector3, byteOffset: number): void {
        if (byteOffset + 8 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            vector3.x = this._dataView.getFloat32(byteOffset, true);
            vector3.y = this._dataView.getFloat32(byteOffset + 4, true);
            vector3.z = this._dataView.getFloat32(byteOffset + 8, true);
        }
    }

    public setVector3Float32FromRef(vector3: Vector3, byteOffset: number): void {
        if (byteOffset + 8 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            this._dataView.setFloat32(byteOffset, vector3.x, true);
            this._dataView.setFloat32(byteOffset + 4, vector3.y, true);
            this._dataView.setFloat32(byteOffset + 8, vector3.z, true);
        }
    }

    public getVector4Float32FromRef(vector4: Vector4, byteOffset: number): void {
        if (byteOffset + 12 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            vector4.x = this._dataView.getFloat32(byteOffset, true);
            vector4.y = this._dataView.getFloat32(byteOffset + 4, true);
            vector4.z = this._dataView.getFloat32(byteOffset + 8, true);
            vector4.w = this._dataView.getFloat32(byteOffset + 12, true);
        }
    }

    public setVector4Float32FromRef(vector4: Vector4, byteOffset: number): void {
        if (byteOffset + 12 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            this._dataView.setFloat32(byteOffset, vector4.x, true);
            this._dataView.setFloat32(byteOffset + 4, vector4.y, true);
            this._dataView.setFloat32(byteOffset + 8, vector4.z, true);
            this._dataView.setFloat32(byteOffset + 12, vector4.w, true);
        }
    }
    /**
     * Stores a Float32 in the array buffer
     * @param entry
     */
    public setFloat32(entry: number, byteOffset?: number) {
        if (isNaN(entry)) {
            Tools.Error('Invalid data being written!');
        }
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setFloat32(byteOffset, entry, true);
            }
            else {
                Tools.Error('BinaryWriter: byteoffset is greater than the current binary length!');
            }
        }
        if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
            this.resizeBuffer(this._arrayBuffer.byteLength * 2);
        }
        this._dataView.setFloat32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    }
    /**
     * Stores an UInt32 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    public setUInt32(entry: number, byteOffset?: number) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint32(byteOffset, entry, true);
            }
            else {
                Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
            }
        }
        else {
            if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint32(this._byteOffset, entry, true);
            this._byteOffset += 4;
        }
    }
}