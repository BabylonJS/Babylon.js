/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally
 * @hidden 
 */
module BABYLON.GLTF2 {
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
         * Stores all generated buffer views, which represents views into the main glTF buffer data
         */
        private bufferViews: IBufferView[];
        /**
         * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF
         */
        private accessors: IAccessor[];
        /**
         * Stores all the generated nodes, which contains transform and/or mesh information per node
         */
        private nodes: INode[];
        /**
         * Stores the glTF asset information, which represents the glTF version and this file generator
         */
        private asset: IAsset;
        /**
         * Stores all the generated glTF scenes, which stores multiple node hierarchies
         */
        private scenes: IScene[];
        /**
         * Stores all the generated mesh information, each containing a set of primitives to render in glTF
         */
        private meshes: IMesh[];
        /**
         * Stores all the generated material information, which represents the appearance of each primitive
         */
        private materials: IMaterial[];
        /**
         * Stores all the generated texture information, which is referenced by glTF materials
         */
        private textures: ITexture[];
        /**
         * Stores all the generated image information, which is referenced by glTF textures
         */
        private images: IImage[];

        /**
         * Stores all the texture samplers
         */
        private samplers: ISampler[];
        /**
         * Stores all the generated animation samplers, which is referenced by glTF animations
         */
        /**
         * Stores the animations for glTF models
         */
        private animations: IAnimation[];
        /**
         * Stores the total amount of bytes stored in the glTF buffer
         */
        private totalByteLength: number;
        /**
         * Stores a reference to the Babylon scene containing the source geometry and material information
         */
        private babylonScene: Scene;
        /**
         * Stores a map of the image data, where the key is the file name and the value
         * is the image data
         */
        private imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } };

        /**
         * Stores a map of the unique id of a node to its index in the node array
         */
        private nodeMap: { [key: number]: number };

        /**
         * Specifies if the Babylon scene should be converted to right-handed on export
         */
        private convertToRightHandedSystem: boolean;

        /**
         * Baked animation sample rate
         */
        private animationSampleRate: number;

        /**
         * Callback which specifies if a transform node should be exported or not
         */
        private shouldExportTransformNode: ((babylonTransformNode: TransformNode) => boolean);

        /**
         * Creates a glTF Exporter instance, which can accept optional exporter options
         * @param babylonScene Babylon scene object
         * @param options Options to modify the behavior of the exporter
         */
        public constructor(babylonScene: Scene, options?: IExportOptions) {
            this.asset = { generator: "BabylonJS", version: "2.0" };
            this.babylonScene = babylonScene;
            this.bufferViews = [];
            this.accessors = [];
            this.meshes = [];
            this.scenes = [];
            this.nodes = [];
            this.images = [];
            this.materials = [];
            this.textures = [];
            this.samplers = [];
            this.animations = [];
            this.imageData = {};
            this.convertToRightHandedSystem = this.babylonScene.useRightHandedSystem ? false : true;
            const _options = options || {};
            this.shouldExportTransformNode = _options.shouldExportTransformNode ? _options.shouldExportTransformNode : (babylonTransformNode: TransformNode) => true;
            this.animationSampleRate = _options.animationSampleRate ? _options.animationSampleRate : 1 / 60;
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
         */
        private reorderVertexAttributeDataBasedOnPrimitiveMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter): void {
            if (this.convertToRightHandedSystem && sideOrientation === Material.ClockWiseSideOrientation) {
                switch (primitiveMode) {
                    case Material.TriangleFillMode: {
                        this.reorderTriangleFillMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                        break;
                    }
                    case Material.TriangleStripDrawMode: {
                        this.reorderTriangleStripDrawMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                        break;
                    }
                    case Material.TriangleFanDrawMode: {
                        this.reorderTriangleFanMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
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
         */
        private reorderTriangleFillMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter) {
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
                    this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter);
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
         */
        private reorderTriangleStripDrawMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter) {
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
                this.writeVertexAttributeData(vertexData, byteOffset + 12, vertexBufferKind, meshAttributeArray, binaryWriter);
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
         */
        private reorderTriangleFanMode(submesh: SubMesh, primitiveMode: number, sideOrientation: number, vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, binaryWriter: _BinaryWriter) {
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
                this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter);
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
         */
        private writeVertexAttributeData(vertices: Vector2[] | Vector3[] | Vector4[], byteOffset: number, vertexAttributeKind: string, meshAttributeArray: FloatArray, binaryWriter: _BinaryWriter) {
            for (let vertex of vertices) {
                if (this.convertToRightHandedSystem && !(vertexAttributeKind === VertexBuffer.ColorKind) && !(vertex instanceof Vector2)) {
                    if (vertex instanceof Vector3) {
                        (vertexAttributeKind === VertexBuffer.PositionKind) ? _GLTFUtilities.GetRightHandedPositionVector3FromRef(vertex) : _GLTFUtilities.GetRightHandedNormalVector3FromRef(vertex);
                    }
                    else {
                        _GLTFUtilities.GetRightHandedVector4FromRef(vertex);
                    }
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
         * @param binaryWriter The buffer to write the binary data to
         * @param indices Used to specify the order of the vertex data
         */
        private writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, byteStride: number, binaryWriter: _BinaryWriter) {
            const stride = byteStride / 4;
            let vertexAttributes: number[][] = [];
            let index: number;

            switch (vertexBufferKind) {
                case VertexBuffer.PositionKind: {
                    for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                        index = k * stride;
                        const vertexData = Vector3.FromArray(meshAttributeArray, index);
                        if (this.convertToRightHandedSystem) {
                            _GLTFUtilities.GetRightHandedPositionVector3FromRef(vertexData);
                        }
                        vertexAttributes.push(vertexData.asArray());
                    }
                    break;
                }
                case VertexBuffer.NormalKind: {
                    for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                        index = k * stride;
                        const vertexData = Vector3.FromArray(meshAttributeArray, index);
                        if (this.convertToRightHandedSystem) {
                            _GLTFUtilities.GetRightHandedNormalVector3FromRef(vertexData);
                        }
                        vertexAttributes.push(vertexData.asArray());
                    }
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                        index = k * stride;
                        const vertexData = Vector4.FromArray(meshAttributeArray, index);
                        if (this.convertToRightHandedSystem) {
                            _GLTFUtilities.GetRightHandedVector4FromRef(vertexData);
                        }
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
                        vertexAttributes.push(this.convertToRightHandedSystem ? [meshAttributeArray[index], meshAttributeArray[index + 1]] : [meshAttributeArray[index], meshAttributeArray[index + 1]]);
                    }
                    break;
                }
                default: {
                    Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                    vertexAttributes = [];
                }
            }
            for (let vertexAttribute of vertexAttributes) {
                for (let component of vertexAttribute) {
                    binaryWriter.setFloat32(component);
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
            let buffer: IBuffer = { byteLength: this.totalByteLength };
            let imageName: string;
            let imageData: { data: Uint8Array, mimeType: ImageMimeType };
            let bufferView: IBufferView;
            let byteOffset: number = this.totalByteLength;

            let glTF: IGLTF = {
                asset: this.asset
            };
            if (buffer.byteLength) {
                glTF.buffers = [buffer];
            }
            if (this.nodes && this.nodes.length) {
                glTF.nodes = this.nodes;
            }
            if (this.meshes && this.meshes.length) {
                glTF.meshes = this.meshes;
            }
            if (this.scenes && this.scenes.length) {
                glTF.scenes = this.scenes;
                glTF.scene = 0;
            }
            if (this.bufferViews && this.bufferViews.length) {
                glTF.bufferViews = this.bufferViews;
            }
            if (this.accessors && this.accessors.length) {
                glTF.accessors = this.accessors;
            }
            if (this.animations && this.animations.length) {
                glTF.animations = this.animations;
            }
            if (this.materials && this.materials.length) {
                glTF.materials = this.materials;
            }
            if (this.textures && this.textures.length) {
                glTF.textures = this.textures;
            }
            if (this.samplers && this.samplers.length) {
                glTF.samplers = this.samplers;
            }
            if (this.images && this.images.length) {
                if (!shouldUseGlb) {
                    glTF.images = this.images;
                }
                else {
                    glTF.images = [];

                    this.images.forEach((image) => {
                        if (image.uri) {
                            imageData = this.imageData[image.uri];
                            imageName = image.uri.split('.')[0] + " image";
                            bufferView = _GLTFUtilities.CreateBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                            byteOffset += imageData.data.buffer.byteLength;
                            this.bufferViews.push(bufferView);
                            image.bufferView = this.bufferViews.length - 1;
                            image.name = imageName;
                            image.mimeType = imageData.mimeType;
                            image.uri = undefined;
                            if (!glTF.images) {
                                glTF.images = [];
                            }
                            glTF.images.push(image);
                        }
                    });
                    // Replace uri with bufferview and mime type for glb
                    buffer.byteLength = byteOffset;
                }
            }

            if (!shouldUseGlb) {
                buffer.uri = glTFPrefix + ".bin";
            }

            const jsonText = prettyPrint ? JSON.stringify(glTF, null, 2) : JSON.stringify(glTF);

            return jsonText;
        }

        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix Text to use when prefixing a glTF file
         * @returns GLTFData with glTF file data
         */
        public _generateGLTFAsync(glTFPrefix: string): Promise<GLTFData> {
            return this._generateBinaryAsync().then(binaryBuffer => {
                const jsonText = this.generateJSON(false, glTFPrefix, true);
                const bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });

                const glTFFileName = glTFPrefix + '.gltf';
                const glTFBinFile = glTFPrefix + '.bin';

                const container = new GLTFData();

                container.glTFFiles[glTFFileName] = jsonText;
                container.glTFFiles[glTFBinFile] = bin;

                if (this.imageData) {
                    for (let image in this.imageData) {
                        container.glTFFiles[image] = new Blob([this.imageData[image].data], { type: this.imageData[image].mimeType });
                    }
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
            return this.createSceneAsync(this.babylonScene, binaryWriter).then(() => {
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
         * Generates a glb file from the json and binary data
         * Returns an object with the glb file name as the key and data as the value
         * @param glTFPrefix 
         * @returns object with glb filename as key and data as value
         */
        public _generateGLBAsync(glTFPrefix: string): Promise<GLTFData> {
            return this._generateBinaryAsync().then(binaryBuffer => {
                const jsonText = this.generateJSON(true);
                const glbFileName = glTFPrefix + '.glb';
                const headerLength = 12;
                const chunkLengthPrefix = 8;
                const jsonLength = jsonText.length;
                let imageByteLength = 0;

                for (let key in this.imageData) {
                    imageByteLength += this.imageData[key].data.byteLength;
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
                for (let key in this.imageData) {
                    glbData.push(this.imageData[key].data.buffer);
                }
                glbData.push(binPaddingBuffer);

                glbData.push(imagePaddingBuffer);

                const glbFile = new Blob(glbData, { type: 'application/octet-stream' });

                const container = new GLTFData();
                container.glTFFiles[glbFileName] = glbFile;

                return container;
            });
        }

        /**
         * Sets the TRS for each node
         * @param node glTF Node for storing the transformation data
         * @param babylonTransformNode Babylon mesh used as the source for the transformation data
         */
        private setNodeTransformation(node: INode, babylonTransformNode: TransformNode): void {
            if (!babylonTransformNode.position.equalsToFloats(0, 0, 0)) {
                node.translation = this.convertToRightHandedSystem ? _GLTFUtilities.GetRightHandedPositionVector3(babylonTransformNode.position).asArray() : babylonTransformNode.position.asArray();
            }

            if (!babylonTransformNode.scaling.equalsToFloats(1, 1, 1)) {
                node.scale = babylonTransformNode.scaling.asArray();
            }

            let rotationQuaternion = Quaternion.RotationYawPitchRoll(babylonTransformNode.rotation.y, babylonTransformNode.rotation.x, babylonTransformNode.rotation.z);
            if (babylonTransformNode.rotationQuaternion) {
                rotationQuaternion.multiplyInPlace(babylonTransformNode.rotationQuaternion);
            }
            if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                if (this.convertToRightHandedSystem) {
                    _GLTFUtilities.GetRightHandedQuaternionFromRef(rotationQuaternion);

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
         * @param babylonTransformNode The Babylon mesh to get the vertices data from
         * @param binaryWriter The buffer to write the bufferview data to
         */
        private createBufferViewKind(kind: string, babylonTransformNode: TransformNode, binaryWriter: _BinaryWriter, byteStride: number) {
            const bufferMesh = babylonTransformNode instanceof Mesh ?
                babylonTransformNode as Mesh : babylonTransformNode instanceof InstancedMesh ?
                    (babylonTransformNode as InstancedMesh).sourceMesh : null;

            if (bufferMesh) {
                const vertexData = bufferMesh.getVerticesData(kind);

                if (vertexData) {
                    const byteLength = vertexData.length * 4;
                    const bufferView = _GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                    this.bufferViews.push(bufferView);

                    this.writeAttributeData(
                        kind,
                        vertexData,
                        byteStride,
                        binaryWriter
                    );
                }
            }
        }

        /**
         * The primitive mode of the Babylon mesh
         * @param babylonMesh The BabylonJS mesh
         */
        private getMeshPrimitiveMode(babylonMesh: AbstractMesh): number {
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
                    meshPrimitive.attributes.POSITION = this.accessors.length - 1;
                    break;
                }
                case VertexBuffer.NormalKind: {
                    meshPrimitive.attributes.NORMAL = this.accessors.length - 1;
                    break;
                }
                case VertexBuffer.ColorKind: {
                    meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;
                    break;
                }
                case VertexBuffer.TangentKind: {
                    meshPrimitive.attributes.TANGENT = this.accessors.length - 1;
                    break;
                }
                case VertexBuffer.UVKind: {
                    meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;
                    break;
                }
                case VertexBuffer.UV2Kind: {
                    meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
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
         */
        private setPrimitiveAttributes(mesh: IMesh, babylonTransformNode: TransformNode, binaryWriter: _BinaryWriter) {
            let bufferMesh: Nullable<Mesh> = null;
            let bufferView: IBufferView;
            let uvCoordsPresent: boolean;
            let minMax: { min: Nullable<number[]>, max: Nullable<number[]> };

            if (babylonTransformNode instanceof Mesh) {
                bufferMesh = (babylonTransformNode as Mesh);
            }
            else if (babylonTransformNode instanceof InstancedMesh) {
                bufferMesh = (babylonTransformNode as InstancedMesh).sourceMesh;
            }
            const attributeData: _IVertexAttributeData[] = [
                { kind: VertexBuffer.PositionKind, accessorType: AccessorType.VEC3, byteStride: 12 },
                { kind: VertexBuffer.NormalKind, accessorType: AccessorType.VEC3, byteStride: 12 },
                { kind: VertexBuffer.ColorKind, accessorType: AccessorType.VEC4, byteStride: 16 },
                { kind: VertexBuffer.TangentKind, accessorType: AccessorType.VEC4, byteStride: 16 },
                { kind: VertexBuffer.UVKind, accessorType: AccessorType.VEC2, byteStride: 8 },
                { kind: VertexBuffer.UV2Kind, accessorType: AccessorType.VEC2, byteStride: 8 },
            ];

            if (bufferMesh) {
                let indexBufferViewIndex: Nullable<number> = null;
                const primitiveMode = this.getMeshPrimitiveMode(bufferMesh);
                let vertexAttributeBufferViews: { [attributeKind: string]: number } = {};

                // For each BabylonMesh, create bufferviews for each 'kind'
                for (const attribute of attributeData) {
                    const attributeKind = attribute.kind;
                    if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                        const vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                        attribute.byteStride = vertexBuffer ? vertexBuffer.getSize() * 4 : VertexBuffer.DeduceStride(attributeKind) * 4;
                        if (attribute.byteStride === 12) {
                            attribute.accessorType = AccessorType.VEC3;
                        }

                        this.createBufferViewKind(attributeKind, babylonTransformNode, binaryWriter, attribute.byteStride);
                        attribute.bufferViewIndex = this.bufferViews.length - 1;
                        vertexAttributeBufferViews[attributeKind] = attribute.bufferViewIndex;
                    }
                }

                if (bufferMesh.getTotalIndices()) {
                    const indices = bufferMesh.getIndices();
                    if (indices) {
                        const byteLength = indices.length * 4;
                        bufferView = _GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                        this.bufferViews.push(bufferView);
                        indexBufferViewIndex = this.bufferViews.length - 1;

                        for (let k = 0, length = indices.length; k < length; ++k) {
                            binaryWriter.setUInt32(indices[k]);
                        }
                    }
                }

                if (bufferMesh.subMeshes) {
                    // go through all mesh primitives (submeshes)
                    for (const submesh of bufferMesh.subMeshes) {
                        uvCoordsPresent = false;
                        let babylonMaterial = submesh.getMaterial();

                        let materialIndex: Nullable<number> = null;
                        if (babylonMaterial) {
                            if (babylonMaterial instanceof MultiMaterial) {
                                babylonMaterial = babylonMaterial.subMaterials[submesh.materialIndex];
                                if (babylonMaterial) {
                                    materialIndex = this.babylonScene.materials.indexOf(babylonMaterial);
                                }
                            }
                            else {
                                materialIndex = this.babylonScene.materials.indexOf(babylonMaterial);
                            }
                        }

                        let glTFMaterial: Nullable<IMaterial> = materialIndex != null ? this.materials[materialIndex] : null;

                        const meshPrimitive: IMeshPrimitive = { attributes: {} };

                        for (const attribute of attributeData) {
                            const attributeKind = attribute.kind;
                            if (attributeKind === VertexBuffer.UVKind || attributeKind === VertexBuffer.UV2Kind) {
                                if (glTFMaterial && !_GLTFMaterial._HasTexturesPresent(glTFMaterial)) {
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
                                            minMax = _GLTFUtilities.CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride, this.convertToRightHandedSystem);
                                        }
                                        const accessor = _GLTFUtilities.CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonTransformNode.name, attribute.accessorType, AccessorComponentType.FLOAT, vertexData.length / stride, 0, minMax.min, minMax.max);
                                        this.accessors.push(accessor);
                                        this.setAttributeKind(meshPrimitive, attributeKind);
                                        if (meshPrimitive.attributes.TEXCOORD_0 != null || meshPrimitive.attributes.TEXCOORD_1 != null) {
                                            uvCoordsPresent = true;
                                        }
                                    }
                                }
                            }
                        }
                        if (indexBufferViewIndex) {
                            // Create accessor
                            const accessor = _GLTFUtilities.CreateAccessor(indexBufferViewIndex, "indices - " + babylonTransformNode.name, AccessorType.SCALAR, AccessorComponentType.UNSIGNED_INT, submesh.indexCount, submesh.indexStart * 4, null, null);
                            this.accessors.push(accessor);
                            meshPrimitive.indices = this.accessors.length - 1;
                        }
                        if (babylonMaterial) {
                            if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                                let sideOrientation = this.babylonScene.materials[materialIndex].sideOrientation;
                                this.setPrimitiveMode(meshPrimitive, primitiveMode);

                                if (this.convertToRightHandedSystem && sideOrientation === Material.ClockWiseSideOrientation) {
                                    //Overwrite the indices to be counter-clockwise
                                    let byteOffset = indexBufferViewIndex != null ? this.bufferViews[indexBufferViewIndex].byteOffset : null;
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
                                                let byteOffset = this.bufferViews[vertexAttributeBufferViews[attribute.kind]].byteOffset;
                                                if (!byteOffset) {
                                                    byteOffset = 0
                                                }
                                                this.reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, sideOrientation, attribute.kind, vertexData, byteOffset, binaryWriter);
                                            }
                                        }
                                    }
                                }

                                if (!uvCoordsPresent && _GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                    const newMat = _GLTFMaterial._StripTexturesFromMaterial(this.materials[materialIndex]);
                                    this.materials.push(newMat);
                                    materialIndex = this.materials.length - 1;
                                }

                                meshPrimitive.material = materialIndex;
                            }
                        }
                        mesh.primitives.push(meshPrimitive);
                    }
                }
            }
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
            const nodes = [...babylonScene.transformNodes, ...babylonScene.meshes];

            return _GLTFMaterial._ConvertMaterialsToGLTFAsync(babylonScene.materials, ImageMimeType.PNG, this.images, this.textures, this.samplers, this.materials, this.imageData, true).then(() => {
                this.nodeMap = this.createNodeMapAndAnimations(babylonScene, nodes, this.shouldExportTransformNode, binaryWriter);

                this.totalByteLength = binaryWriter.getByteOffset();


                // Build Hierarchy with the node map.
                for (let babylonTransformNode of nodes) {
                    glTFNodeIndex = this.nodeMap[babylonTransformNode.uniqueId];
                    if (glTFNodeIndex != null) {
                        glTFNode = this.nodes[glTFNodeIndex];
                        if (!babylonTransformNode.parent) {
                            if (!this.shouldExportTransformNode(babylonTransformNode)) {
                                Tools.Log("Omitting " + babylonTransformNode.name + " from scene.");
                            }
                            else {
                                if (this.convertToRightHandedSystem) {
                                    if (glTFNode.translation) {
                                        glTFNode.translation[2] *= -1;
                                        glTFNode.translation[0] *= -1;
                                    }
                                    glTFNode.rotation = glTFNode.rotation ? Quaternion.FromArray([0, 1, 0, 0]).multiply(Quaternion.FromArray(glTFNode.rotation)).asArray() : (Quaternion.FromArray([0, 1, 0, 0])).asArray();
                                }

                                scene.nodes.push(glTFNodeIndex);
                            }
                        }

                        directDescendents = babylonTransformNode.getDescendants(true);
                        if (!glTFNode.children && directDescendents && directDescendents.length) {
                            glTFNode.children = [];
                            for (let descendent of directDescendents) {
                                if (this.nodeMap[descendent.uniqueId] != null) {
                                    glTFNode.children.push(this.nodeMap[descendent.uniqueId]);
                                }
                            }
                        }
                    }
                };
                if (scene.nodes.length) {
                    this.scenes.push(scene);
                }
            });
        }

        /**
         * Creates a mapping of Node unique id to node index and handles animations
         * @param babylonScene Babylon Scene
         * @param nodes Babylon transform nodes
         * @param shouldExportTransformNode Callback specifying if a transform node should be exported
         * @param binaryWriter Buffer to write binary data to
         * @returns Node mapping of unique id to index
         */
        private createNodeMapAndAnimations(babylonScene: Scene, nodes: TransformNode[], shouldExportTransformNode: (babylonTransformNode: TransformNode) => boolean, binaryWriter: _BinaryWriter): { [key: number]: number } {
            const nodeMap: { [key: number]: number } = {};
            let nodeIndex: number;
            let runtimeGLTFAnimation: IAnimation = {
                name: 'runtime animations',
                channels: [],
                samplers: []
            };
            let idleGLTFAnimations: IAnimation[] = [];
            let node: INode;

            for (let babylonTransformNode of nodes) {
                if (shouldExportTransformNode(babylonTransformNode)) {
                    node = this.createNode(babylonTransformNode, binaryWriter);

                    this.nodes.push(node);
                    nodeIndex = this.nodes.length - 1;
                    nodeMap[babylonTransformNode.uniqueId] = nodeIndex;

                    if (!babylonScene.animationGroups.length && babylonTransformNode.animations.length) {
                        _GLTFAnimation._CreateNodeAnimationFromTransformNodeAnimations(babylonTransformNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, this.nodes, binaryWriter, this.bufferViews, this.accessors, this.convertToRightHandedSystem, this.animationSampleRate);
                    }
                }
                else {
                    `Excluding mesh ${babylonTransformNode.name}`;
                }
            };

            if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                this.animations.push(runtimeGLTFAnimation);
            }
            idleGLTFAnimations.forEach((idleGLTFAnimation) => {
                if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                    this.animations.push(idleGLTFAnimation);
                }
            });

            if (babylonScene.animationGroups.length) {
                _GLTFAnimation._CreateNodeAnimationFromAnimationGroups(babylonScene, this.animations, nodeMap, this.nodes, binaryWriter, this.bufferViews, this.accessors, this.convertToRightHandedSystem, this.animationSampleRate);
            }

            return nodeMap;
        }

        /**
         * Creates a glTF node from a Babylon mesh
         * @param babylonMesh Source Babylon mesh
         * @param binaryWriter Buffer for storing geometry data
         * @returns glTF node
         */
        private createNode(babylonTransformNode: TransformNode, binaryWriter: _BinaryWriter): INode {
            // create node to hold translation/rotation/scale and the mesh
            const node: INode = {};
            // create mesh
            const mesh: IMesh = { primitives: [] };

            if (babylonTransformNode.name) {
                node.name = babylonTransformNode.name;
            }

            // Set transformation
            this.setNodeTransformation(node, babylonTransformNode);
            this.setPrimitiveAttributes(mesh, babylonTransformNode, binaryWriter);

            if (mesh.primitives.length) {
                this.meshes.push(mesh);
                node.mesh = this.meshes.length - 1;
            }

            return node;
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
        private resizeBuffer(byteLength: number) {
            let newBuffer = new ArrayBuffer(byteLength);
            let oldUint8Array = new Uint8Array(this._arrayBuffer);
            let newUint8Array = new Uint8Array(newBuffer);
            for (let i = 0, length = newUint8Array.byteLength; i < length; ++i) {
                newUint8Array[i] = oldUint8Array[i];
            }
            this._arrayBuffer = newBuffer;
            this._dataView = new DataView(this._arrayBuffer);
        }
        /**
         * Get an array buffer with the length of the byte offset
         * @returns ArrayBuffer resized to the byte offset
         */
        public getArrayBuffer(): ArrayBuffer {
            this.resizeBuffer(this.getByteOffset());
            return this._arrayBuffer;
        }
        /**
         * Get the byte offset of the array buffer
         * @returns byte offset
         */
        public getByteOffset(): number {
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
                this._dataView.setUint8(this._byteOffset++, entry);
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
}