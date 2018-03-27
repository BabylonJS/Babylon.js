/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally.
 * @ignore - capitalization of GLTF2 module.
 */
module BABYLON.GLTF2 {
    /** 
     * Utility interface for storing vertex attribute data.
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
         * Specifies the BufferView index for the vertex attribute data.
        */
        bufferViewIndex?: number;
    }
    /**
     * Converts Babylon Scene into glTF 2.0.
     */
    export class _Exporter {
        /**
         * Stores all generated buffer views, which represents views into the main glTF buffer data.
         */
        private bufferViews: IBufferView[];
        /**
         * Stores all the generated accessors, which is used for accessing the data within the buffer views in glTF.
         */
        private accessors: IAccessor[];
        /**
         * Stores all the generated nodes, which contains transform and/or mesh information per node.
         */
        private nodes: INode[];
        /**
         * Stores the glTF asset information, which represents the glTF version and this file generator.
         */
        private asset: IAsset;
        /**
         * Stores all the generated glTF scenes, which stores multiple node hierarchies.
         */
        private scenes: IScene[];
        /**
         * Stores all the generated mesh information, each containing a set of primitives to render in glTF.
         */
        private meshes: IMesh[];
        /**
         * Stores all the generated material information, which represents the appearance of each primitive.
         */
        private materials: IMaterial[];
        /**
         * Stores all the generated texture information, which is referenced by glTF materials.
         */
        private textures: ITexture[];
        /**
         * Stores all the generated image information, which is referenced by glTF textures.
         */
        private images: IImage[];
        /**
         * Stores the total amount of bytes stored in the glTF buffer.
         */
        private totalByteLength: number;
        /**
         * Stores a reference to the Babylon scene containing the source geometry and material information.
         */
        private babylonScene: Scene;
        /**
         * Stores the exporter options, which are optionally passed in from the glTF serializer.
         */
        private options?: IExporterOptions;
        /**
         * Stores a map of the image data, where the key is the file name and the value
         * is the image data.
         */
        private imageData: { [fileName: string]: { data: Uint8Array, mimeType: ImageMimeType } };

        /**
         * Stores a map of the unique id of a node to its index in the node array.
         */
        private nodeMap: { [key: number]: number };

        /**
         * Stores the binary buffer used to store geometry data.
         */
        private binaryBuffer: ArrayBuffer;

        /**
         * Specifies if the Babylon scene should be converted to right-handed on export.
         */
        private convertToRightHandedSystem: boolean;

        /**
         * Creates a glTF Exporter instance, which can accept optional exporter options.
         * @param babylonScene - Babylon scene object
         * @param options - Options to modify the behavior of the exporter.
         */
        public constructor(babylonScene: Scene, options?: IExporterOptions) {
            this.asset = { generator: "BabylonJS", version: "2.0" };
            this.babylonScene = babylonScene;
            this.bufferViews = new Array<IBufferView>();
            this.accessors = new Array<IAccessor>();
            this.meshes = new Array<IMesh>();
            this.scenes = new Array<IScene>();
            this.nodes = new Array<INode>();
            this.images = new Array<IImage>();
            this.materials = new Array<IMaterial>();
            this.textures = new Array<ITexture>();
            this.imageData = {};
            this.convertToRightHandedSystem = this.babylonScene.useRightHandedSystem ? false : true;

            if (options) {
                this.options = options;
            }
        }

        /**
         * Creates a buffer view based on teh supplied arguments
         * @param bufferIndex - index value of the specified buffer
         * @param byteOffset - byte offset value
         * @param byteLength - byte length of the bufferView
         * @param byteStride - byte distance between conequential elements.
         * @param name - name of the buffer view
         * @returns - bufferView for glTF
         */
        private createBufferView(bufferIndex: number, byteOffset: number, byteLength: number, byteStride?: number, name?: string): IBufferView {
            let bufferview: IBufferView = { buffer: bufferIndex, byteLength: byteLength };
            if (byteOffset) {
                bufferview.byteOffset = byteOffset;
            }
            if (name) {
                bufferview.name = name;
            }
            if (byteStride) {
                bufferview.byteStride = byteStride;
            }

            return bufferview;
        }

        /**
         * Creates an accessor based on the supplied arguments
         * @param bufferviewIndex - The index of the bufferview referenced by this accessor.
         * @param name - The name of the accessor.
         * @param type - The type of the accessor.
         * @param componentType - The datatype of components in the attribute.
         * @param count - The number of attributes referenced by this accessor.
         * @param byteOffset - The offset relative to the start of the bufferView in bytes.
         * @param min - Minimum value of each component in this attribute.
         * @param max - Maximum value of each component in this attribute.
         * @returns - accessor for glTF 
         */
        private createAccessor(bufferviewIndex: number, name: string, type: AccessorType, componentType: AccessorComponentType, count: number, byteOffset: Nullable<number>, min: Nullable<number[]>, max: Nullable<number[]>): IAccessor {
            let accessor: IAccessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };

            if (min) {
                accessor.min = min;
            }
            if (max) {
                accessor.max = max;
            }
            if (byteOffset) {
                accessor.byteOffset = byteOffset;
            }

            return accessor;
        }

        /**
         * Calculates the minimum and maximum values of an array of position floats.
         * @param positions - Positions array of a mesh.
         * @param vertexStart - Starting vertex offset to calculate min and max values.
         * @param vertexCount - Number of vertices to check for min and max values.
         * @returns - min number array and max number array.
         */
        private calculateMinMaxPositions(positions: FloatArray, vertexStart: number, vertexCount: number): { min: number[], max: number[] } {
            const min = [Infinity, Infinity, Infinity];
            const max = [-Infinity, -Infinity, -Infinity];
            const positionStrideSize = 3;
            const end = vertexStart + vertexCount;

            if (vertexCount) {
                for (let i = vertexStart; i < end; ++i) {
                    let indexOffset = positionStrideSize * i;

                    const position = Vector3.FromArray(positions, indexOffset);
                    const vector = this.convertToRightHandedSystem ? _Exporter.GetRightHandedVector3(position).asArray() : position.asArray();

                    for (let j = 0; j < positionStrideSize; ++j) {
                        let num = vector[j];
                        if (num < min[j]) {
                            min[j] = num;
                        }
                        if (num > max[j]) {
                            max[j] = num;
                        }
                        ++indexOffset;
                    }
                }
            }
            return { min, max };
        }

        /**
         * Converts a vector3 array to right-handed.
         * @param vector - vector3 Array to convert to right-handed.
         * @returns - right-handed Vector3 array.
         */
        private static GetRightHandedVector3(vector: Vector3): Vector3 {
            return new Vector3(vector.x, vector.y, -vector.z);
        }

        /**
         * Converts a vector4 array to right-handed.
         * @param vector - vector4 Array to convert to right-handed.
         * @returns - right-handed vector4 array.
         */
        private static GetRightHandedVector4(vector: Vector4): Vector4 {
            return new Vector4(vector.x, vector.y, -vector.z, -vector.w);
        }

        /**
         * Converts a quaternion to right-handed.
         * @param quaternion - Source quaternion to convert to right-handed.
         */
        private static GetRightHandedQuaternion(quaternion: Quaternion): Quaternion {
            return new Quaternion(-quaternion.x, -quaternion.y, quaternion.z, quaternion.w);
        }

        /**
         * Writes mesh attribute data to a data buffer.
         * Returns the bytelength of the data.
         * @param vertexBufferKind - Indicates what kind of vertex data is being passed in.
         * @param meshAttributeArray - Array containing the attribute data. 
         * @param byteOffset - The offset to start counting bytes from.
         * @param dataBuffer - The buffer to write the binary data to.
         * @returns - Byte length of the attribute data.
         */
        private writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, byteOffset: number, dataBuffer: DataView): number {
            let byteOff = byteOffset;

            const stride = VertexBuffer.DeduceStride(vertexBufferKind);
            const end = meshAttributeArray.length / stride;

            let byteLength = 0;

            for (let k = 0; k < end; ++k) {
                const index = k * stride;
                let vector: number[] = [];

                if (vertexBufferKind === VertexBuffer.PositionKind || vertexBufferKind === VertexBuffer.NormalKind) {
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    vector = this.convertToRightHandedSystem ? _Exporter.GetRightHandedVector3(vertexData).asArray() : vertexData.asArray();
                }
                else if (vertexBufferKind === VertexBuffer.TangentKind || vertexBufferKind === VertexBuffer.ColorKind) {
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    vector = (this.convertToRightHandedSystem && !(vertexBufferKind === VertexBuffer.ColorKind)) ? _Exporter.GetRightHandedVector4(vertexData).asArray() : vertexData.asArray();
                }
                else if (vertexBufferKind === VertexBuffer.UVKind || vertexBufferKind === VertexBuffer.UV2Kind) {
                    vector = [meshAttributeArray[index], meshAttributeArray[index + 1]];
                }
                else {
                    Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                }

                for (let i = 0; i < vector.length; ++i) {
                    dataBuffer.setFloat32(byteOff, vector[i], true);
                    byteOff += 4;
                }
            }

            byteLength = meshAttributeArray.length * 4;

            return byteLength;
        }

        /**
         * Generates glTF json data
         * @param shouldUseGlb - Indicates whether the json should be written for a glb file.
         * @param glTFPrefix - Text to use when prefixing a glTF file.
         * @param prettyPrint - Indicates whether the json file should be pretty printed (true) or not (false).
         * @returns - json data as string
         */
        private generateJSON(shouldUseGlb: boolean, glTFPrefix?: string, prettyPrint?: boolean): string {
            let buffer: IBuffer = { byteLength: this.totalByteLength };

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
                    // Replace uri with bufferview and mime type for glb
                    const imageLength = this.images.length;
                    let byteOffset = this.totalByteLength;
                    for (let i = 0; i < imageLength; ++i) {
                        const image = this.images[i];
                        if (image.uri) {
                            const imageData = this.imageData[image.uri];
                            const imageName = image.uri.split('.')[0] + " image";
                            const bufferView = this.createBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                            byteOffset += imageData.data.buffer.byteLength;
                            this.bufferViews.push(bufferView);
                            image.bufferView = this.bufferViews.length - 1;
                            image.name = imageName;
                            image.mimeType = imageData.mimeType;
                            image.uri = undefined;
                            glTF.images.push(image);
                        }
                    }
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
         * @param glTFPrefix - Text to use when prefixing a glTF file.
         * @returns - GLTFData with glTF file data. 
         */
        public _generateGLTF(glTFPrefix: string): _GLTFData {
            const binaryBuffer = this.generateBinary();
            const jsonText = this.generateJSON(false, glTFPrefix, true);
            const bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });

            const glTFFileName = glTFPrefix + '.gltf';
            const glTFBinFile = glTFPrefix + '.bin';

            const container = new _GLTFData();

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
         * @returns - array buffer for binary data
         */
        private generateBinary(): ArrayBuffer {
            let byteOffset = 0;
            byteOffset = this.createScene(this.babylonScene, byteOffset);
            return this.binaryBuffer;
        }

        /**
         * Pads the number to a multiple of 4
         * @param num - number to pad
         * @returns - padded number
         */
        private _getPadding(num: number): number {
            let remainder = num % 4;
            let padding = remainder === 0 ? remainder : 4 - remainder;

            return padding;
        }

        /**
         * Generates a glb file from the json and binary data.  
         * Returns an object with the glb file name as the key and data as the value.
         * @param glTFPrefix 
         * @returns - object with glb filename as key and data as value
         */
        public _generateGLB(glTFPrefix: string): _GLTFData {
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

            const container = new _GLTFData();
            container.glTFFiles[glbFileName] = glbFile;

            return container;
        }

        /**
         * Sets the TRS for each node
         * @param node - glTF Node for storing the transformation data.
         * @param babylonMesh - Babylon mesh used as the source for the transformation data.
         */
        private setNodeTransformation(node: INode, babylonMesh: AbstractMesh): void {
            
            if (!babylonMesh.position.equalsToFloats(0, 0, 0)) {
                node.translation = this.convertToRightHandedSystem ? _Exporter.GetRightHandedVector3(babylonMesh.position).asArray() : babylonMesh.position.asArray();
            }

            if (!babylonMesh.scaling.equalsToFloats(1, 1, 1)) {
                node.scale = babylonMesh.scaling.asArray();
            }

            let rotationQuaternion = Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
            if (babylonMesh.rotationQuaternion) {
                rotationQuaternion = rotationQuaternion.multiply(babylonMesh.rotationQuaternion);
            }
            if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                node.rotation = this.convertToRightHandedSystem ? _Exporter.GetRightHandedQuaternion(rotationQuaternion).asArray() : rotationQuaternion.asArray();
            }
        }

        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind - Indicates the type of vertices data.
         * @param babylonMesh - The Babylon mesh to get the vertices data from.
         * @param byteOffset - The offset from the buffer to start indexing from.
         * @param dataBuffer - The buffer to write the bufferview data to.
         * @returns bytelength of the bufferview data.
         */
        private createBufferViewKind(kind: string, babylonMesh: AbstractMesh, byteOffset: number, dataBuffer: Nullable<DataView>): number {
            let bufferMesh = null;
            let byteLength = 0;
            if (babylonMesh instanceof Mesh) {
                bufferMesh = (babylonMesh as Mesh);
            }
            else if (babylonMesh instanceof InstancedMesh) {
                bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
            }
            if (bufferMesh) {
                const vertexData = bufferMesh.getVerticesData(kind);
                if (vertexData) {
                    if (dataBuffer && vertexData) { // write data to buffer
                        byteLength = this.writeAttributeData(
                            kind,
                            vertexData,
                            byteOffset,
                            dataBuffer,
                        );
                        byteOffset += byteLength;
                    }
                    else {
                        byteLength = vertexData.length * 4;
                        const bufferView = this.createBufferView(0, byteOffset, byteLength, undefined, kind + " - " + bufferMesh.name);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferView);
                    }
                }
            }
            return byteLength;
        }

        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh - glTF Mesh object to store the primitive attribute information.
         * @param babylonMesh - Babylon mesh to get the primitive attribute data from.
         * @param byteOffset - The offset in bytes of the buffer data.
         * @param dataBuffer - Buffer to write the attribute data to.
         * @returns - bytelength of the primitive attributes plus the passed in byteOffset.
         */
        private setPrimitiveAttributes(mesh: IMesh, babylonMesh: AbstractMesh, byteOffset: number, dataBuffer: Nullable<DataView>): number {
            let bufferMesh = null;
            if (babylonMesh instanceof Mesh) {
                bufferMesh = (babylonMesh as Mesh);
            }
            else if (babylonMesh instanceof InstancedMesh) {
                bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
            }
            const attributeData: _IVertexAttributeData[] = [
                { kind: VertexBuffer.PositionKind, accessorType: AccessorType.VEC3 },
                { kind: VertexBuffer.NormalKind, accessorType: AccessorType.VEC3 },
                { kind: VertexBuffer.ColorKind, accessorType: AccessorType.VEC4 },
                { kind: VertexBuffer.TangentKind, accessorType: AccessorType.VEC4 },
                { kind: VertexBuffer.UVKind, accessorType: AccessorType.VEC2 },
                { kind: VertexBuffer.UV2Kind, accessorType: AccessorType.VEC2 },
            ];

            let indexBufferViewIndex: Nullable<number> = null;

            if (bufferMesh) {
                // For each BabylonMesh, create bufferviews for each 'kind'
                for (const attribute of attributeData) {
                    const attributeKind = attribute.kind;
                    if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                        byteOffset += this.createBufferViewKind(attributeKind, babylonMesh, byteOffset, dataBuffer);
                        attribute.bufferViewIndex = this.bufferViews.length - 1;
                    }
                }
                if (bufferMesh.getTotalIndices()) {
                    const indices = bufferMesh.getIndices();
                    if (indices) {
                        if (dataBuffer) {
                            const end = indices.length;
                            let byteOff = byteOffset;

                            for (let k = 0; k < end; ++k) {
                                dataBuffer.setUint32(byteOff, indices[k], true);
                                byteOff += 4;
                            }
                            byteOffset = byteOff;
                        }
                        else {
                            const byteLength = indices.length * 4;
                            const bufferView = this.createBufferView(0, byteOffset, byteLength, undefined, "Indices - " + bufferMesh.name);
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferView);
                            indexBufferViewIndex = this.bufferViews.length - 1;
                        }
                    }
                }

                if (babylonMesh.subMeshes) {
                    let uvCoordsPresent = false;
                    // go through all mesh primitives (submeshes)
                    for (const submesh of babylonMesh.subMeshes) {
                        const meshPrimitive: IMeshPrimitive = { attributes: {} };

                        // Create a bufferview storing all the positions
                        if (!dataBuffer) {
                            for (const attribute of attributeData) {
                                const attributeKind = attribute.kind;
                                const vertexData = bufferMesh.getVerticesData(attributeKind);
                                if (vertexData) {
                                    const stride = VertexBuffer.DeduceStride(attributeKind);
                                    let minMax: Nullable<{ min: number[], max: number[] }>;
                                    let min = null;
                                    let max = null;
                                    const bufferViewIndex = attribute.bufferViewIndex;
                                    if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                        if (attributeKind == VertexBuffer.PositionKind) {
                                            minMax = this.calculateMinMaxPositions(vertexData, 0, vertexData.length / stride);
                                            min = minMax.min;
                                            max = minMax.max;
                                        }
                                        const accessor = this.createAccessor(bufferViewIndex, attributeKind + " - " + babylonMesh.name, attribute.accessorType, AccessorComponentType.FLOAT, vertexData.length / stride, 0, min, max);
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
                                const accessor = this.createAccessor(indexBufferViewIndex, "indices - " + babylonMesh.name, AccessorType.SCALAR, AccessorComponentType.UNSIGNED_INT, submesh.indexCount, submesh.indexStart * 4, null, null);
                                this.accessors.push(accessor);

                                meshPrimitive.indices = this.accessors.length - 1;
                            }
                        }
                        if (bufferMesh.material) {
                            let materialIndex: Nullable<number> = null;
                            if (bufferMesh.material instanceof StandardMaterial || bufferMesh.material instanceof PBRMetallicRoughnessMaterial || bufferMesh.material instanceof PBRMaterial) {
                                materialIndex = babylonMesh.getScene().materials.indexOf(bufferMesh.material);
                            }
                            else if (bufferMesh.material instanceof MultiMaterial) {
                                const babylonMultiMaterial = bufferMesh.material as MultiMaterial;

                                const material = babylonMultiMaterial.subMaterials[submesh.materialIndex];

                                if (material) {
                                    materialIndex = babylonMesh.getScene().materials.indexOf(material);
                                }
                            }
                            else {
                                Tools.Warn("Material type " + bufferMesh.material.getClassName() + " for material " + bufferMesh.material.name + " is not yet implemented in glTF serializer.");
                            }
                            if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                                if (uvCoordsPresent || !_GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                    meshPrimitive.material = materialIndex;
                                }
                                else {
                                    // If no texture coordinate information is present, make a copy of the material without the textures to be glTF compliant.
                                    const newMat = _GLTFMaterial._StripTexturesFromMaterial(this.materials[materialIndex]);
                                    this.materials.push(newMat);
                                    meshPrimitive.material = this.materials.length - 1;
                                }
                            }
                        }
                        mesh.primitives.push(meshPrimitive);
                    }
                }
            }
            return byteOffset;
        }

        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param babylonScene - Babylon scene to get the mesh data from. 
         * @param byteOffset - Offset to start from in bytes.
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene: Scene, byteOffset: number): number {
            if (babylonScene.meshes.length) {
                const babylonMeshes = babylonScene.meshes;
                const scene = { nodes: new Array<number>() };

                _GLTFMaterial._ConvertMaterialsToGLTF(babylonScene.materials, ImageMimeType.PNG, this.images, this.textures, this.materials, this.imageData, true);
                const result = this.createNodeMap(babylonScene, byteOffset);
                this.nodeMap = result.nodeMap;
                this.totalByteLength = result.byteOffset;

                this.binaryBuffer = new ArrayBuffer(this.totalByteLength);
                const dataBuffer = new DataView(this.binaryBuffer);


                for (let i = 0; i < babylonMeshes.length; ++i) {
                    const babylonMesh = babylonMeshes[i];

                    // Build Hierarchy with the node map.
                    const glTFNodeIndex = this.nodeMap[babylonMesh.uniqueId];
                    const glTFNode = this.nodes[glTFNodeIndex];
                    if (!babylonMesh.parent) {
                        if (this.options &&
                            this.options.shouldExportMesh != undefined &&
                            !this.options.shouldExportMesh(babylonMesh)) {
                            Tools.Log("Omitting " + babylonMesh.name + " from scene.");
                        }
                        else {
                            scene.nodes.push(glTFNodeIndex);
                        }

                    }

                    const directDescendents = babylonMesh.getDescendants(true);
                    if (!glTFNode.children && directDescendents && directDescendents.length) {
                        glTFNode.children = [];
                        for (let descendent of directDescendents) {
                            glTFNode.children.push(this.nodeMap[descendent.uniqueId]);
                        }
                    }
                    const mesh = { primitives: new Array<IMeshPrimitive>() };
                    byteOffset = this.setPrimitiveAttributes(mesh, babylonMesh, byteOffset, dataBuffer);
                }
                this.scenes.push(scene);
            }

            return byteOffset;
        }

        /**
         * Creates a mapping of Node unique id to node index
         * @param scene - Babylon Scene.
         * @param byteOffset - The initial byte offset.
         * @returns - Node mapping of unique id to index.
         */
        private createNodeMap(scene: Scene, byteOffset: number): { nodeMap: { [key: number]: number }, byteOffset: number } {
            const nodeMap: { [key: number]: number } = {};
            for (let babylonMesh of scene.meshes) {
                const result = this.createNode(babylonMesh, byteOffset, null);

                this.nodes.push(result.node);
                nodeMap[babylonMesh.uniqueId] = this.nodes.length - 1;
                byteOffset = result.byteOffset;
            }
            return { nodeMap, byteOffset };
        }

        /**
         * Creates a glTF node from a Babylon mesh.
         * @param babylonMesh - Source Babylon mesh.
         * @param byteOffset - The initial byte offset.
         * @param dataBuffer - Buffer for storing geometry data.
         * @returns - Object containing an INode and byteoffset.
         */
        private createNode(babylonMesh: AbstractMesh, byteOffset: number, dataBuffer: Nullable<DataView>): { node: INode, byteOffset: number } {
            // create node to hold translation/rotation/scale and the mesh
            const node: INode = {};

            if (babylonMesh.name) {
                node.name = babylonMesh.name;
            }

            // Set transformation
            this.setNodeTransformation(node, babylonMesh);

            // create mesh
            const mesh: IMesh = { primitives: new Array<IMeshPrimitive>() };
            mesh.primitives = [];
            byteOffset = this.setPrimitiveAttributes(mesh, babylonMesh, byteOffset, dataBuffer);

            if (mesh.primitives.length) {
                this.meshes.push(mesh);
                node.mesh = this.meshes.length - 1;
            }

            return { node, byteOffset };
        }
    }
}