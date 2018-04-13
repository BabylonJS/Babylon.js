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

        private shouldExportMesh: ((mesh: Mesh) => boolean);

        /**
         * @ignore
         * 
         * Creates a glTF Exporter instance, which can accept optional exporter options
         * @param babylonScene Babylon scene object
         * @param options Options to modify the behavior of the exporter
         */
        public constructor(babylonScene: Scene, options?: IExporterOptions) {
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
            this.animations = [];
            this.imageData = {};
            this.convertToRightHandedSystem = this.babylonScene.useRightHandedSystem ? false : true;
            const _options = options || {};
            this.shouldExportMesh = _options.shouldExportMesh ? _options.shouldExportMesh : ((mesh: Mesh) => {return true;});
            this.animationSampleRate = _options.animationSampleRate ? _options.animationSampleRate : 1/60; 
        }

        /**
         * Writes mesh attribute data to a data buffer
         * Returns the bytelength of the data
         * @param vertexBufferKind Indicates what kind of vertex data is being passed in
         * @param meshAttributeArray Array containing the attribute data
         * @param binaryWriter The buffer to write the binary data to
         * @returns Byte length of the attribute data
         */
        private writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, binaryWriter: _BinaryWriter): number {
            const stride = VertexBuffer.DeduceStride(vertexBufferKind);
            let byteLength = 0;
            let vector: number[];
            let index: number;

            for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                index = k * stride;

                if (vertexBufferKind === VertexBuffer.PositionKind || vertexBufferKind === VertexBuffer.NormalKind) {
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    if (this.convertToRightHandedSystem) {
                        _GLTFUtilities.GetRightHandedVector3FromRef(vertexData);
                    }
                    vector = vertexData.asArray();
                }
                else if (vertexBufferKind === VertexBuffer.TangentKind || vertexBufferKind === VertexBuffer.ColorKind) {
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    if (this.convertToRightHandedSystem && !(vertexBufferKind === VertexBuffer.ColorKind)) {
                        _GLTFUtilities.GetRightHandedVector4FromRef(vertexData);
                    }
                    vector = vertexData.asArray();
                }
                else if (vertexBufferKind === VertexBuffer.UVKind || vertexBufferKind === VertexBuffer.UV2Kind) {
                    vector = this.convertToRightHandedSystem ? [meshAttributeArray[index], meshAttributeArray[index + 1]] : [meshAttributeArray[index], meshAttributeArray[index + 1]];
                }
                else {
                    Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                    vector = [];
                }

                vector.forEach(function (entry) {
                    binaryWriter.setFloat32(entry);
                });
            }

            byteLength = meshAttributeArray.length * 4;

            return byteLength;
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
            if (this.images && this.images.length) {
                if (!shouldUseGlb) {
                    glTF.images = this.images;
                }
                else {
                    glTF.images = [];
                    const self = this;

                    this.images.forEach(function (image) {
                        if (image.uri) {
                            imageData = self.imageData[image.uri];
                            imageName = image.uri.split('.')[0] + " image";
                            bufferView = _GLTFUtilities.CreateBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                            byteOffset += imageData.data.buffer.byteLength;
                            self.bufferViews.push(bufferView);
                            image.bufferView = self.bufferViews.length - 1;
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
         * @ignore
         * 
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix Text to use when prefixing a glTF file
         * @returns GLTFData with glTF file data
         */
        public _generateGLTF(glTFPrefix: string): GLTFData {
            const binaryBuffer = this.generateBinary();
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
        }

        /**
         * Creates a binary buffer for glTF
         * @returns array buffer for binary data
         */
        private generateBinary(): ArrayBuffer {
            let binaryWriter = new _BinaryWriter(4);
            this.createScene(this.babylonScene, binaryWriter);
            return binaryWriter.getArrayBuffer();
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
         * @ignore
         * 
         * Generates a glb file from the json and binary data
         * Returns an object with the glb file name as the key and data as the value
         * @param glTFPrefix 
         * @returns object with glb filename as key and data as value
         */
        public _generateGLB(glTFPrefix: string): GLTFData {
            const binaryBuffer = this.generateBinary();
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
        }

        /**
         * Sets the TRS for each node
         * @param node glTF Node for storing the transformation data
         * @param babylonMesh Babylon mesh used as the source for the transformation data
         */
        private setNodeTransformation(node: INode, babylonMesh: AbstractMesh): void {
            if (!babylonMesh.position.equalsToFloats(0, 0, 0)) {
                node.translation = this.convertToRightHandedSystem ? _GLTFUtilities.GetRightHandedVector3(babylonMesh.position).asArray() : babylonMesh.position.asArray();
            }

            if (!babylonMesh.scaling.equalsToFloats(1, 1, 1)) {
                node.scale = babylonMesh.scaling.asArray();
            }

            let rotationQuaternion = Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
            if (babylonMesh.rotationQuaternion) {
                rotationQuaternion = rotationQuaternion.multiply(babylonMesh.rotationQuaternion);
            }
            if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                if (this.convertToRightHandedSystem) {
                    _GLTFUtilities.GetRightHandedQuaternionFromRef(rotationQuaternion);

                }
                node.rotation = rotationQuaternion.normalize().asArray();
            }
        }

        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind Indicates the type of vertices data
         * @param babylonMesh The Babylon mesh to get the vertices data from
         * @param binaryWriter The buffer to write the bufferview data to
         */
        private createBufferViewKind(kind: string, babylonMesh: AbstractMesh, binaryWriter: _BinaryWriter, byteStride: number | undefined) {
            let bufferMesh = null;
            let byteLength: number;
            let vertexData: Nullable<FloatArray>;
            let bufferView: IBufferView;

            if (babylonMesh instanceof Mesh) {
                bufferMesh = (babylonMesh as Mesh);
            }
            else if (babylonMesh instanceof InstancedMesh) {
                bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
            }
            if (bufferMesh) {
                vertexData = bufferMesh.getVerticesData(kind);
                if (vertexData) {
                    byteLength = vertexData.length * 4;
                    bufferView = _GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                    this.bufferViews.push(bufferView);

                    this.writeAttributeData(
                        kind,
                        vertexData,
                        binaryWriter
                    );
                }
            }
        }

        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh glTF Mesh object to store the primitive attribute information
         * @param babylonMesh Babylon mesh to get the primitive attribute data from
         * @param binaryWriter Buffer to write the attribute data to
         */
        private setPrimitiveAttributes(mesh: IMesh, babylonMesh: AbstractMesh, binaryWriter: _BinaryWriter) {
            let bufferMesh: Nullable<Mesh> = null;
            let attributeKind: string;
            let indices: Nullable<IndicesArray>;
            let byteLength: number;
            let bufferView: IBufferView;
            let uvCoordsPresent: boolean;
            let meshPrimitive: IMeshPrimitive;
            let vertexData: Nullable<FloatArray>;
            let stride: number;
            let minMax: { min: Nullable<number[]>, max: Nullable<number[]> };
            let newMat: IMaterial;
            let babylonMultiMaterial: MultiMaterial;
            let material: Nullable<Material>;
            let materialIndex: Nullable<number> = null;
            let indexBufferViewIndex: Nullable<number> = null;
            let accessor: IAccessor;
            let bufferViewIndex: number | undefined;

            if (babylonMesh instanceof Mesh) {
                bufferMesh = (babylonMesh as Mesh);
            }
            else if (babylonMesh instanceof InstancedMesh) {
                bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
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
                // For each BabylonMesh, create bufferviews for each 'kind'
                for (const attribute of attributeData) {
                    attributeKind = attribute.kind;
                    if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                        this.createBufferViewKind(attributeKind, babylonMesh, binaryWriter, attribute.byteStride);
                        attribute.bufferViewIndex = this.bufferViews.length - 1;
                    }
                }
                if (bufferMesh.getTotalIndices()) {
                    indices = bufferMesh.getIndices();
                    if (indices) {
                        byteLength = indices.length * 4;
                        bufferView = _GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                        this.bufferViews.push(bufferView);
                        indexBufferViewIndex = this.bufferViews.length - 1;

                        for (let k = 0, length = indices.length; k < length; ++k) {
                            binaryWriter.setUInt32(indices[k]);
                        }
                    }
                }

                if (babylonMesh.subMeshes) {
                    uvCoordsPresent = false;
                    // go through all mesh primitives (submeshes)
                    for (const submesh of babylonMesh.subMeshes) {
                        meshPrimitive = { attributes: {} };

                        for (const attribute of attributeData) {
                            attributeKind = attribute.kind;
                            vertexData = bufferMesh.getVerticesData(attributeKind);
                            if (vertexData) {
                                stride = VertexBuffer.DeduceStride(attributeKind);
                                bufferViewIndex = attribute.bufferViewIndex;
                                if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                    minMax = { min: null, max: null };
                                    if (attributeKind == VertexBuffer.PositionKind) {
                                        minMax = _GLTFUtilities.CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride, this.convertToRightHandedSystem);
                                    }
                                    accessor = _GLTFUtilities.CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonMesh.name, attribute.accessorType, AccessorComponentType.FLOAT, vertexData.length / stride, 0, minMax.min, minMax.max);
                                    this.accessors.push(accessor);

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
                                            uvCoordsPresent = true;
                                            break;
                                        }
                                        case VertexBuffer.UV2Kind: {
                                            meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
                                            uvCoordsPresent = true;
                                            break;
                                        }
                                        default: {
                                            Tools.Warn("Unsupported Vertex Buffer Type: " + attributeKind);
                                        }
                                    }
                                }
                            }
                        }
                        if (indexBufferViewIndex) {
                            // Create accessor
                            accessor = _GLTFUtilities.CreateAccessor(indexBufferViewIndex, "indices - " + babylonMesh.name, AccessorType.SCALAR, AccessorComponentType.UNSIGNED_INT, submesh.indexCount, submesh.indexStart * 4, null, null);
                            this.accessors.push(accessor);

                            meshPrimitive.indices = this.accessors.length - 1;
                        }
                        if (bufferMesh.material) {
                            materialIndex = null;
                            if (bufferMesh.material instanceof StandardMaterial || bufferMesh.material instanceof PBRMetallicRoughnessMaterial || bufferMesh.material instanceof PBRMaterial) {
                                materialIndex = babylonMesh.getScene().materials.indexOf(bufferMesh.material);
                            }
                            else if (bufferMesh.material instanceof MultiMaterial) {
                                babylonMultiMaterial = bufferMesh.material as MultiMaterial;
                                material = babylonMultiMaterial.subMaterials[submesh.materialIndex];

                                if (material) {
                                    materialIndex = babylonMesh.getScene().materials.indexOf(material);
                                }
                            }
                            else {
                                Tools.Warn("Material type " + bufferMesh.material.getClassName() + " for material " + bufferMesh.material.name + " is not yet implemented in glTF serializer.");
                            }
                            if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                                if (uvCoordsPresent) {
                                    if (!_GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                        delete meshPrimitive.attributes.TEXCOORD_0;
                                        delete meshPrimitive.attributes.TEXCOORD_1;
                                    }
                                    meshPrimitive.material = materialIndex;
                                }
                                else {
                                    if (_GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                        newMat = _GLTFMaterial._StripTexturesFromMaterial(this.materials[materialIndex]);
                                        this.materials.push(newMat);
                                        meshPrimitive.material = this.materials.length - 1;

                                    }
                                }
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
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene: Scene, binaryWriter: _BinaryWriter) {
            if (babylonScene.meshes.length) {
                const babylonMeshes = babylonScene.meshes as Mesh[];
                const scene: IScene = { nodes: [] };
                let glTFNodeIndex: number;
                let glTFNode: INode;
                let directDescendents: Node[];

                _GLTFMaterial._ConvertMaterialsToGLTF(babylonScene.materials, ImageMimeType.PNG, this.images, this.textures, this.materials, this.imageData, true);
                this.nodeMap = this.createNodeMapAndAnimations(babylonScene, binaryWriter);

                this.totalByteLength = binaryWriter.getByteOffset();
                const self = this;

                // Build Hierarchy with the node map.
                babylonMeshes.forEach(function (babylonMesh) {
                    glTFNodeIndex = self.nodeMap[babylonMesh.uniqueId];
                    glTFNode = self.nodes[glTFNodeIndex];
                    if (!babylonMesh.parent) {
                        if (!self.shouldExportMesh(babylonMesh)) {
                            Tools.Log("Omitting " + babylonMesh.name + " from scene.");
                        }
                        else {
                            scene.nodes.push(glTFNodeIndex);
                        }
                    }

                    directDescendents = babylonMesh.getDescendants(true);
                    if (!glTFNode.children && directDescendents && directDescendents.length) {
                        glTFNode.children = [];
                        for (let descendent of directDescendents) {
                            glTFNode.children.push(self.nodeMap[descendent.uniqueId]);
                        }
                    }
                });
                this.scenes.push(scene);
            }
        }

        /**
         * Creates a mapping of Node unique id to node index and handles animations
         * @param scene Babylon Scene
         * @param binaryWriter Buffer to write binary data to
         * @returns Node mapping of unique id to index
         */
        private createNodeMapAndAnimations(scene: Scene, binaryWriter: _BinaryWriter): { [key: number]: number } {
            const nodeMap: { [key: number]: number } = {};
            let nodeIndex: number;
            let runtimeGLTFAnimation: IAnimation = {
                name: 'runtime animations',
                channels: [],
                samplers: []
            };
            let idleGLTFAnimations: IAnimation[] = [];
            let node: INode;
            const self = this;
            (scene.meshes as Mesh[]).forEach(function (babylonMesh) {
                node = self.createNode(babylonMesh, binaryWriter);

                self.nodes.push(node);
                nodeIndex = self.nodes.length - 1;
                nodeMap[babylonMesh.uniqueId] = nodeIndex;

                if (!scene.animationGroups.length && babylonMesh.animations.length) {
                    _GLTFAnimation._CreateNodeAnimationFromMeshAnimations(babylonMesh, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, self.nodes, binaryWriter, self.bufferViews, self.accessors, self.convertToRightHandedSystem, self.animationSampleRate);
                }
            });

            if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                this.animations.push(runtimeGLTFAnimation);
            }
            idleGLTFAnimations.forEach(function (idleGLTFAnimation) {
                if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                    self.animations.push(idleGLTFAnimation);
                }
            });

            if (scene.animationGroups.length) {
                _GLTFAnimation._CreateNodeAnimationFromAnimationGroups(scene, self.animations, nodeMap, this.nodes, binaryWriter, this.bufferViews, this.accessors, this.convertToRightHandedSystem, self.animationSampleRate);
            }

            return nodeMap;
        }

        /**
         * Creates a glTF node from a Babylon mesh
         * @param babylonMesh Source Babylon mesh
         * @param binaryWriter Buffer for storing geometry data
         * @returns glTF node
         */
        private createNode(babylonMesh: AbstractMesh, binaryWriter: _BinaryWriter): INode {
            // create node to hold translation/rotation/scale and the mesh
            const node: INode = {};
            // create mesh
            const mesh: IMesh = { primitives: [] };

            if (babylonMesh.name) {
                node.name = babylonMesh.name;
            }

            // Set transformation
            this.setNodeTransformation(node, babylonMesh);

            this.setPrimitiveAttributes(mesh, babylonMesh, binaryWriter);

            if (mesh.primitives.length) {
                this.meshes.push(mesh);
                node.mesh = this.meshes.length - 1;
            }

            return node;
        }
    }

    /**
     * @ignore
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
         * @ignore
         * 
         * Get an array buffer with the length of the byte offset
         * @returns ArrayBuffer resized to the byte offset
         */
        public getArrayBuffer(): ArrayBuffer {
            this.resizeBuffer(this.getByteOffset());
            return this._arrayBuffer;
        }
        /**
         * @ignore
         * 
         * Get the byte offset of the array buffer
         * @returns byte offset
         */
        public getByteOffset(): number {
            return this._byteOffset;
        }
        /**
         * @ignore
         * 
         * Stores an UInt8 in the array buffer
         * @param entry 
         */
        public setUInt8(entry: number) {
            if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint8(this._byteOffset++, entry);
        }
        /**
         * @ignore
         * 
         * Stores a Float32 in the array buffer
         * @param entry 
         */
        public setFloat32(entry: number) {
            if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setFloat32(this._byteOffset, entry, true);
            this._byteOffset += 4;
        }
        /**
         * @ignore
         * 
         * Stores an UInt32 in the array buffer
         * @param entry 
         */
        public setUInt32(entry: number) {
            if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                this.resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint32(this._byteOffset, entry, true);
            this._byteOffset += 4;
        }
    }
}