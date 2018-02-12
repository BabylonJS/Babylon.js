/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>

/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally.
 * @ignore - capitalization of GLTF2 module.
 */
module BABYLON.GLTF2 {
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
            if (options !== undefined) {
                this.options = options;
            }

            let totalByteLength = 0;

            totalByteLength = this.createScene(this.babylonScene, totalByteLength, null);

            this.totalByteLength = totalByteLength;
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
            if (byteOffset > 0) {
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
         * @param bufferviewIndex 
         * @param name 
         * @param type 
         * @param componentType 
         * @param count 
         * @param min 
         * @param max 
         * @returns - accessor for glTF 
         */
        private createAccessor(bufferviewIndex: number, name: string, type: AccessorType, componentType: AccessorComponentType, count: number, byteOffset?: number, min?: number[], max?: number[]): IAccessor {
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
         * Calculates the minimum and maximum values of an array of floats, based on stride
         * @param buff - Data to check for min and max values.
         * @param vertexStart - Start offset to calculate min and max values.
         * @param vertexCount - Number of vertices to check for min and max values.
         * @param stride - Offset between consecutive attributes.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
         * @returns - min number array and max number array.
         */
        private calculateMinMax(buff: FloatArray, vertexStart: number, vertexCount: number, stride: number, useRightHandedSystem: boolean): { min: number[], max: number[] } {
            let min = [Infinity, Infinity, Infinity];
            let max = [-Infinity, -Infinity, -Infinity];
            let end = vertexStart + vertexCount;
            if (vertexCount > 0) {
                for (let i = vertexStart; i < end; ++i) {
                    let index = stride * i;
                    let scale = 1;

                    for (let j = 0; j < stride; ++j) {
                        if (j === (stride - 1) && !useRightHandedSystem) {
                            scale = -1;
                        }
                        let num = scale * buff[index];
                        if (num < min[j]) {
                            min[j] = num;
                        }
                        if (num > max[j]) {
                            max[j] = num;
                        }
                        ++index;
                    }
                }
            }
            return { min, max };
        }

        /**
         * Writes mesh attribute data to a data buffer.
         * Returns the bytelength of the data.
         * @param vertexBufferKind - Indicates what kind of vertex data is being passed in.
         * @param meshAttributeArray - Array containing the attribute data. 
         * @param strideSize - Represents the offset between consecutive attributes
         * @param byteOffset - The offset to start counting bytes from.
         * @param dataBuffer - The buffer to write the binary data to.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system. 
         * @returns - Byte length of the attribute data.
         */
        private writeAttributeData(vertexBufferKind: string, meshAttributeArray: FloatArray, strideSize: number, vertexBufferOffset: number, byteOffset: number, dataBuffer: DataView, useRightHandedSystem: boolean): number {
            let byteOff = byteOffset;

            const start = 0;
            const end = meshAttributeArray.length / strideSize;

            let byteLength = 0;

            switch (vertexBufferKind) {
                case VertexBuffer.PositionKind: {
                    for (let k = start; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4;

                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4;

                        if (useRightHandedSystem) {
                            dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        }
                        else {
                            dataBuffer!.setFloat32(byteOff, -meshAttributeArray![index + 2], true);
                        }

                        byteOff += 4;
                    }

                    byteLength = meshAttributeArray.length * 4;
                    break;
                }
                case VertexBuffer.NormalKind: {
                    for (let k = start; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4;
                        if (useRightHandedSystem) {
                            dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        }
                        else {
                            dataBuffer!.setFloat32(byteOff, -meshAttributeArray![index + 2], true);
                        }

                        byteOff += 4;
                    }
                    byteLength = meshAttributeArray.length * 4;
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let k = start; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4;
                        if (useRightHandedSystem) {
                            dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        }
                        else {
                            dataBuffer!.setFloat32(byteOff, -meshAttributeArray![index + 2], true);
                        }
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 3], true);
                        byteOff += 4;
                    }
                    byteLength = meshAttributeArray.length * 4;
                    break;
                }
                case VertexBuffer.ColorKind: {
                    for (let k = start; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 3], true);
                        byteOff += 4;
                    }
                    byteLength = meshAttributeArray.length * 4;
                    break;
                }
                case VertexBuffer.UVKind: {
                    for (let k = start; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4;
                    }
                    byteLength = meshAttributeArray.length * 4;
                    break;
                }
                case VertexBuffer.UV2Kind: {
                    for (let k = start; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4;
                    }
                    byteLength = meshAttributeArray.length * 4;
                    break;
                }
                default: {
                    throw new Error("Unsupported vertex buffer type: " + vertexBufferKind);
                }
            }

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
            if (buffer.byteLength > 0) {
                glTF.buffers = [buffer];
            }
            if (this.nodes && this.nodes.length !== 0) {
                glTF.nodes = this.nodes;
            }
            if (this.meshes && this.meshes.length !== 0) {
                glTF.meshes = this.meshes;
            }
            if (this.scenes && this.scenes.length !== 0) {
                glTF.scenes = this.scenes;
                glTF.scene = 0;
            }
            if (this.bufferViews && this.bufferViews.length !== 0) {
                glTF.bufferViews = this.bufferViews;
            }
            if (this.accessors && this.accessors.length !== 0) {
                glTF.accessors = this.accessors;
            }
            if (this.materials && this.materials.length !== 0) {
                glTF.materials = this.materials;
            }
            if (this.textures && this.textures.length !== 0) {
                glTF.textures = this.textures;
            }
            if (this.images && this.images.length !== 0) {
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
                        if (image.uri !== undefined) {
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
            const jsonText = this.generateJSON(false, glTFPrefix, true);
            const binaryBuffer = this.generateBinary();
            const bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });

            const glTFFileName = glTFPrefix + '.gltf';
            const glTFBinFile = glTFPrefix + '.bin';

            const container = new _GLTFData();

            container.glTFFiles[glTFFileName] = jsonText;
            container.glTFFiles[glTFBinFile] = bin;

            if (this.imageData !== null) {
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
            let binaryBuffer = new ArrayBuffer(this.totalByteLength);
            let dataBuffer = new DataView(binaryBuffer);
            byteOffset = this.createScene(this.babylonScene, byteOffset, dataBuffer);

            return binaryBuffer;
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
            const jsonText = this.generateJSON(true);
            const binaryBuffer = this.generateBinary();
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
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system. 
         */
        private setNodeTransformation(node: INode, babylonMesh: AbstractMesh, useRightHandedSystem: boolean): void {
            if (!(babylonMesh.position.x === 0 && babylonMesh.position.y === 0 && babylonMesh.position.z === 0)) {
                if (useRightHandedSystem) {
                    node.translation = babylonMesh.position.asArray();
                }
                else {
                    node.translation = [babylonMesh.position.x, babylonMesh.position.y, -babylonMesh.position.z];
                }

            }
            if (!(babylonMesh.scaling.x === 1 && babylonMesh.scaling.y === 1 && babylonMesh.scaling.z === 1)) {
                if (useRightHandedSystem) {
                    node.scale = babylonMesh.scaling.asArray();
                }
                else {
                    node.scale = [babylonMesh.scaling.x, babylonMesh.scaling.y, -babylonMesh.scaling.z];
                }
            }
            let rotationQuaternion = Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
            if (babylonMesh.rotationQuaternion) {
                rotationQuaternion = rotationQuaternion.multiply(babylonMesh.rotationQuaternion);
            }
            if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                if (useRightHandedSystem) {
                    node.rotation = rotationQuaternion.asArray();
                }
                else {
                    node.rotation = [-rotationQuaternion.x, -rotationQuaternion.y, rotationQuaternion.z, rotationQuaternion.w];
                }
            }
        }

        /**
         * Creates a bufferview based on the vertices type for the Babylon mesh
         * @param kind - Indicates the type of vertices data.
         * @param babylonMesh - The Babylon mesh to get the vertices data from.
         * @param byteOffset - The offset from the buffer to start indexing from.
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system. 
         * @param dataBuffer - The buffer to write the bufferview data to.
         * @returns bytelength of the bufferview data.
         */
        private createBufferViewKind(kind: string, babylonMesh: AbstractMesh, byteOffset: number, useRightHandedSystem: boolean, dataBuffer: Nullable<DataView>): number {
            let bufferMesh = null;
            let byteLength = 0;
            if (babylonMesh instanceof Mesh) {
                bufferMesh = (babylonMesh as Mesh);
            }
            else if (babylonMesh instanceof InstancedMesh) {
                bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
            }
            if (bufferMesh !== null) {
                let vertexBuffer = null;
                let vertexBufferOffset = null;
                let vertexData = null;
                let vertexStrideSize = null;
                if (bufferMesh.getVerticesDataKinds().indexOf(kind) > -1) {
                    vertexBuffer = bufferMesh.getVertexBuffer(kind);
                    vertexBufferOffset = vertexBuffer!.getOffset();
                    vertexData = vertexBuffer!.getData();
                    vertexStrideSize = vertexBuffer!.getStrideSize();

                    if (dataBuffer && vertexData) { // write data to buffer
                        byteLength = this.writeAttributeData(
                            kind,
                            vertexData,
                            vertexStrideSize,
                            vertexBufferOffset,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem
                        );
                        byteOffset += byteLength;
                    }
                    else {
                        let bufferViewName: Nullable<string> = null;
                        switch (kind) {
                            case VertexBuffer.PositionKind: {
                                byteLength = vertexData!.length * 4;
                                bufferViewName = "Position - " + bufferMesh.name;
                                break;
                            }
                            case VertexBuffer.NormalKind: {
                                byteLength = vertexData!.length * 4;
                                bufferViewName = "Normal - " + bufferMesh.name;
                                break;
                            }
                            case VertexBuffer.TangentKind: {
                                byteLength = vertexData!.length * 4;
                                bufferViewName = "Tangent - " + bufferMesh.name;
                                break;
                            }
                            case VertexBuffer.ColorKind: {
                                byteLength = vertexData!.length * 4;
                                bufferViewName = "Color - " + bufferMesh.name;
                                break;
                            }
                            case VertexBuffer.UVKind: {
                                byteLength = vertexData!.length * 4;
                                bufferViewName = "TexCoord 0 - " + bufferMesh.name;
                                break;
                            }
                            case VertexBuffer.UV2Kind: {
                                byteLength = vertexData!.length * 4;
                                bufferViewName = "TexCoord 1 - " + bufferMesh.name;
                                break;
                            }
                            default: {
                                Tools.Warn("Unsupported VertexBuffer kind: " + kind);
                            }
                        }

                        if (bufferViewName !== null) {
                            const bufferView = this.createBufferView(0, byteOffset, byteLength, vertexStrideSize * 4, bufferViewName);
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferView);
                        }
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
         * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system. 
         * @param dataBuffer - Buffer to write the attribute data to.
         * @returns - bytelength of the primitive attributes plus the passed in byteOffset.
         */
        private setPrimitiveAttributes(mesh: IMesh, babylonMesh: AbstractMesh, byteOffset: number, useRightHandedSystem: boolean, dataBuffer: Nullable<DataView>): number {
            let bufferMesh = null;
            if (babylonMesh instanceof Mesh) {
                bufferMesh = (babylonMesh as Mesh);
            }
            else if (babylonMesh instanceof InstancedMesh) {
                bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
            }
            let positionBufferViewIndex: Nullable<number> = null;
            let normalBufferViewIndex: Nullable<number> = null;
            let colorBufferViewIndex: Nullable<number> = null;
            let tangentBufferViewIndex: Nullable<number> = null;
            let texCoord0BufferViewIndex: Nullable<number> = null;
            let texCoord1BufferViewIndex: Nullable<number> = null;
            let indexBufferViewIndex: Nullable<number> = null;

            if (bufferMesh !== null) {
                // For each BabylonMesh, create bufferviews for each 'kind'
                if (bufferMesh.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                    byteOffset += this.createBufferViewKind(VertexBuffer.PositionKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                    positionBufferViewIndex = this.bufferViews.length - 1;
                }
                if (bufferMesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    byteOffset += this.createBufferViewKind(VertexBuffer.NormalKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                    normalBufferViewIndex = this.bufferViews.length - 1;
                }
                if (bufferMesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    byteOffset += this.createBufferViewKind(VertexBuffer.ColorKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                    colorBufferViewIndex = this.bufferViews.length - 1;
                }
                if (bufferMesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                    byteOffset += this.createBufferViewKind(VertexBuffer.TangentKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                    colorBufferViewIndex = this.bufferViews.length - 1;
                }
                if (bufferMesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    byteOffset += this.createBufferViewKind(VertexBuffer.UVKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                    texCoord0BufferViewIndex = this.bufferViews.length - 1;
                }
                if (bufferMesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    byteOffset += this.createBufferViewKind(VertexBuffer.UV2Kind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                    texCoord1BufferViewIndex = this.bufferViews.length - 1;
                }
                if (bufferMesh.getTotalIndices() > 0) {
                    const indices = bufferMesh.getIndices()!;
                    if (dataBuffer) {
                        const end = indices!.length;
                        let byteOff = byteOffset;

                        for (let k = 0; k < end; ++k) {
                            dataBuffer.setUint32(byteOff, indices![k], true);
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

            // go through all mesh primitives (submeshes)
            for (let j = 0; j < babylonMesh.subMeshes.length; ++j) {

                const submesh = babylonMesh.subMeshes[j];
                const meshPrimitive: IMeshPrimitive = { attributes: {} };

                if (bufferMesh !== null) {
                    // Create a bufferview storing all the positions
                    if (!dataBuffer) {
                        // Loop through each attribute of the submesh (mesh primitive)
                        if (positionBufferViewIndex !== null) {

                            const positionVertexBuffer = bufferMesh.getVertexBuffer(VertexBuffer.PositionKind);
                            const positions = positionVertexBuffer!.getData();
                            const positionStrideSize = positionVertexBuffer!.getStrideSize();

                            // Create accessor
                            const result = this.calculateMinMax(positions!, 0, positions!.length / positionStrideSize, positionStrideSize!, useRightHandedSystem);
                            const accessor = this.createAccessor(positionBufferViewIndex, "Position", AccessorType.VEC3, AccessorComponentType.FLOAT, positions!.length / positionStrideSize, 0, result.min, result.max);
                            this.accessors.push(accessor);

                            meshPrimitive.attributes.POSITION = this.accessors.length - 1;

                        }
                        if (normalBufferViewIndex !== null) {
                            const normalVertexBuffer = bufferMesh.getVertexBuffer(VertexBuffer.NormalKind);
                            const normals = normalVertexBuffer!.getData();
                            const normalStrideSize = normalVertexBuffer!.getStrideSize();

                            // Create accessor
                            const accessor = this.createAccessor(normalBufferViewIndex, "Normal", AccessorType.VEC3, AccessorComponentType.FLOAT, normals!.length / normalStrideSize);
                            this.accessors.push(accessor);

                            meshPrimitive.attributes.NORMAL = this.accessors.length - 1;

                        }
                        if (tangentBufferViewIndex !== null) {
                            const tangentVertexBuffer = bufferMesh.getVertexBuffer(VertexBuffer.TangentKind);
                            const tangents = tangentVertexBuffer!.getData();
                            const tangentStrideSize = tangentVertexBuffer!.getStrideSize();

                            // Create accessor
                            const accessor = this.createAccessor(tangentBufferViewIndex, "Tangent", AccessorType.VEC4, AccessorComponentType.FLOAT, tangents!.length / tangentStrideSize);
                            this.accessors.push(accessor);

                            meshPrimitive.attributes.TANGENT = this.accessors.length - 1;

                        }
                        if (colorBufferViewIndex !== null) {
                            const colorVertexBuffer = bufferMesh.getVertexBuffer(VertexBuffer.ColorKind);
                            const colors = colorVertexBuffer!.getData();
                            const colorStrideSize = colorVertexBuffer!.getStrideSize();

                            // Create accessor
                            const accessor = this.createAccessor(colorBufferViewIndex, "Color", AccessorType.VEC4, AccessorComponentType.FLOAT, colors!.length / colorStrideSize);
                            this.accessors.push(accessor);

                            meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;

                        }
                        if (texCoord0BufferViewIndex !== null) {
                            // Create accessor
                            const texCoord0VertexBuffer = bufferMesh.getVertexBuffer(VertexBuffer.UVKind);
                            const texCoord0s = texCoord0VertexBuffer!.getData();
                            const texCoord0StrideSize = texCoord0VertexBuffer!.getStrideSize();
                            const accessor = this.createAccessor(texCoord0BufferViewIndex, "Texture Coords 0", AccessorType.VEC2, AccessorComponentType.FLOAT, texCoord0s!.length / texCoord0StrideSize);
                            this.accessors.push(accessor);

                            meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;

                        }
                        if (texCoord1BufferViewIndex !== null) {
                            // Create accessor
                            const texCoord1VertexBuffer = bufferMesh.getVertexBuffer(VertexBuffer.UV2Kind);
                            const texCoord1s = texCoord1VertexBuffer!.getData();
                            const texCoord1StrideSize = texCoord1VertexBuffer!.getStrideSize();
                            const accessor = this.createAccessor(texCoord1BufferViewIndex, "Texture Coords 1", AccessorType.VEC2, AccessorComponentType.FLOAT, texCoord1s!.length / texCoord1StrideSize);
                            this.accessors.push(accessor);

                            meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;

                        }
                        if (indexBufferViewIndex) {
                            // Create accessor
                            const accessor = this.createAccessor(indexBufferViewIndex, "Indices", AccessorType.SCALAR, AccessorComponentType.UNSIGNED_INT, submesh.indexCount, submesh.indexStart * 4);
                            this.accessors.push(accessor);

                            meshPrimitive.indices = this.accessors.length - 1;

                        }
                    }
                    if (bufferMesh.material) {
                        if (bufferMesh.material instanceof StandardMaterial || bufferMesh.material instanceof PBRMetallicRoughnessMaterial) {
                            const materialIndex = babylonMesh.getScene().materials.indexOf(bufferMesh.material);
                            meshPrimitive.material = materialIndex;
                        }
                        else if (bufferMesh.material instanceof MultiMaterial) {
                            const babylonMultiMaterial = bufferMesh.material as MultiMaterial;

                            const material = babylonMultiMaterial.subMaterials[submesh.materialIndex];

                            if (material !== null) {
                                const materialIndex = babylonMesh.getScene().materials.indexOf(material);
                                meshPrimitive.material = materialIndex;
                            }
                        }
                        else {
                            Tools.Warn("Material type " + bufferMesh.material.getClassName() + " for material " + bufferMesh.material.name + " is not yet implemented in glTF serializer.");
                        }
                    }
                    mesh.primitives.push(meshPrimitive);
                }
            }
            return byteOffset;
        }

        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param babylonScene - Babylon scene to get the mesh data from. 
         * @param byteOffset - Offset to start from in bytes.
         * @param dataBuffer - Buffer to write geometry data to.
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene: Scene, byteOffset: number, dataBuffer: Nullable<DataView>): number {
            if (babylonScene.meshes.length > 0) {
                const babylonMeshes = babylonScene.meshes;
                const scene = { nodes: new Array<number>() };
                if (dataBuffer == null) {
                    _GLTFMaterial.ConvertMaterialsToGLTF(babylonScene.materials, ImageMimeType.JPEG, this.images, this.textures, this.materials, this.imageData, true);
                }

                for (let i = 0; i < babylonMeshes.length; ++i) {
                    if (this.options &&
                        this.options.shouldExportMesh !== undefined &&
                        !this.options.shouldExportMesh(babylonMeshes[i])) {
                        continue;
                    }
                    else {
                        // create node to hold translation/rotation/scale and the mesh
                        const node: INode = { mesh: -1 };
                        const babylonMesh = babylonMeshes[i];
                        const useRightHandedSystem = babylonMesh.getScene().useRightHandedSystem;

                        // Set transformation
                        this.setNodeTransformation(node, babylonMesh, useRightHandedSystem);

                        // create mesh
                        const mesh: IMesh = { primitives: new Array<IMeshPrimitive>() };
                        mesh.primitives = [];
                        byteOffset = this.setPrimitiveAttributes(mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        // go through all mesh primitives (submeshes)

                        this.meshes.push(mesh);

                        node.mesh = this.meshes.length - 1;
                        if (babylonMesh.name) {
                            node.name = babylonMesh.name;
                        }
                        this.nodes.push(node);

                        scene.nodes.push(this.nodes.length - 1);
                    }
                }
                this.scenes.push(scene);
            }

            return byteOffset;
        }
    }
}