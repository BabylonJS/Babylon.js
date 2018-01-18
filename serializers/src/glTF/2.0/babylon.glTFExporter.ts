module BABYLON {
    /**
     * glTF Asset interface
     */
    interface _IGLTFAsset {
        generator: string;
        version: string;
    }

    /**
     * glTF Scene interface
     */
    interface _IGLTFScene {
        nodes: number[];
    }

    /**
     * glTF Node interface
     */
    interface _IGLTFNode {
        mesh: number;
        name?: string;
        translation?: number[];
        scale?: number[];
        rotation?: number[];
    }

    /**
     * glTF Mesh Primitive interface
     */
    interface _IGLTFMeshPrimitive {
        attributes: { [index: string]: number };
        indices?: number;
        material?: number;
    }

    /**
     * glTF Texture interface
     */
    interface _IGLTFTexture {
        name?: string;
        sampler?: number;
        source: number;
    }

    /**
     * glTF texture info interface
     */
    interface _IGLTFTextureInfo {
        index: number;
        texCoord?: number;
    }

    /**
     * glTF Image mimetype enum
     */
    enum _EGLTFImageMimeTypeEnum {
        PNG = "image/png",
        JPG = "image/jpeg"
    }

    /**
     * glTF Image interface
     */
    interface _IGLTFImage {
        name?: string;
        uri?: string;
        bufferView?: number;
        mimeType?: _EGLTFImageMimeTypeEnum;
    }

    /**
     * glTF Mesh interface
     */
    interface _IGLTFMesh {
        primitives: _IGLTFMeshPrimitive[];
    }

    /**
     * glTF Alpha Mode Enum
     */
    export enum _EGLTFAlphaModeEnum {
        OPAQUE = "OPAQUE",
        MASK = "MASK",
        BLEND = "BLEND"
    }
    
    /**
     * glTF Occlusion texture interface
     */
    interface _IGLTFOcclusionTexture extends _IGLTFTextureInfo {
        strength?: number;
    }

    /**
     * glTF Normal texture interface
     */
    interface _IGLTFNormalTexture extends _IGLTFTextureInfo {
        scale?: number;
    }

    /**
     * glTF Material interface
     */
    interface _IGLTFMaterial {
        name?: string;
        doubleSided?: boolean;
        alphaMode?: string;
        alphaCutoff?: number;
        emissiveTexture?: _IGLTFTextureInfo;
        emissiveFactor?: number[];
        occlusionTexture?: _IGLTFOcclusionTexture;
        normalTexture?: _IGLTFNormalTexture;
        pbrMetallicRoughness?: _IGLTFPBRMetallicRoughnessMaterial;
    }

    /**
     * glTF Metallic Roughness Material interface
     */
    interface _IGLTFPBRMetallicRoughnessMaterial {
        baseColorFactor?: number[];
        baseColorTexture?: _IGLTFTextureInfo;
        metallicFactor?: number;
        roughnessFactor?: number;
        metallicRoughnessTexture?: _IGLTFTexture;
    }

    /**
     * glTF Buffer interface
     */
    interface _IGLTFBuffer {
        byteLength: number;
        uri?: string;
    }

    /**
     * glTF BufferView interface
     */
    interface _IGLTFBufferView {
        name?: string;
        buffer: number;
        byteOffset?: number;
        byteLength: number;
    }

    /**
     * glTF Accessor interface
     */
    interface _IGLTFAccessor {
        name: string;
        bufferView: number;
        componentType: number;
        count: number;
        type: string;
        min?: number[];
        max?: number[];
    }

    /**
     * glTF file interface
     */
    interface _IGLTF {
        buffers?: _IGLTFBuffer[];
        asset: _IGLTFAsset;
        meshes?: _IGLTFMesh[];
        materials?: _IGLTFMaterial[];
        scenes?: _IGLTFScene[];
        scene?: number;
        nodes?: _IGLTFNode[];
        bufferViews?: _IGLTFBufferView[];
        accessors?: _IGLTFAccessor[];
        textures?: _IGLTFTexture[];
        images?: _IGLTFImage[];
    }

    /**
     * Babylon Specular Glossiness interface
     */
    export interface _IBabylonSpecularGlossiness {
        diffuse: Color3;
        opacity: number;
        specular: Color3;
        glossiness: number;
    }

    /**
     * Babylon Metallic Roughness interface
     */
    export interface _IBabylonMetallicRoughness {
        baseColor: Color3;
        opacity: number;
        metallic: number;
        roughness: number;
    }

    /**
     * Converts Babylon Scene into glTF 2.0
     */
    export class _GLTF2Exporter {
        private bufferViews: _IGLTFBufferView[];
        private accessors: _IGLTFAccessor[];
        private nodes: _IGLTFNode[];
        private asset: _IGLTFAsset;
        private scenes: _IGLTFScene[];
        private meshes: _IGLTFMesh[];
        private materials: _IGLTFMaterial[];
        private textures: _IGLTFTexture[];
        private images: _IGLTFImage[];
        private totalByteLength: number;
        private babylonScene: Scene;
        private options?: IGLTFExporterOptions;
        private imageData: { [fileName: string]: { data: Uint8Array, mimeType: _EGLTFImageMimeTypeEnum } };

        public constructor(babylonScene: Scene, options?: IGLTFExporterOptions) {
            this.asset = { generator: "BabylonJS", version: "2.0" };
            this.babylonScene = babylonScene;
            this.bufferViews = new Array<_IGLTFBufferView>();
            this.accessors = new Array<_IGLTFAccessor>();
            this.meshes = new Array<_IGLTFMesh>();
            this.scenes = new Array<_IGLTFScene>();
            this.nodes = new Array<_IGLTFNode>();
            this.images = new Array<_IGLTFImage>();
            this.materials = new Array<_IGLTFMaterial>();
            this.imageData = {};
            if (options !== undefined) {
                this.options = options;
            }

            let totalByteLength = 0;

            totalByteLength = this.createScene(this.babylonScene, totalByteLength);

            this.totalByteLength = totalByteLength;
        }

        /**
         * Creates a buffer view based on teh supplied arguments
         * @param {number} bufferIndex - index value of the specified buffer
         * @param {number} byteOffset - byte offset value
         * @param {number} byteLength - byte length of the bufferView
         * @returns - bufferView for glTF
         */
        private createBufferView(bufferIndex: number, byteOffset: number, byteLength: number, name?: string): _IGLTFBufferView {
            let bufferview: _IGLTFBufferView = { buffer: bufferIndex, byteLength: byteLength };
            if (byteOffset > 0) {
                bufferview.byteOffset = byteOffset;
            }
            if (name) {
                bufferview.name = name;
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
        private createAccessor(bufferviewIndex: number, name: string, type: string, componentType: number, count: number, min?: number[], max?: number[]): _IGLTFAccessor {
            let accessor: _IGLTFAccessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };

            if (min) {
                accessor.min = min;
            }
            if (max) {
                accessor.max = max;
            }

            return accessor;
        }

        /**
         * Calculates the minimum and maximum values of an array of floats, based on stride
         * @param buff 
         * @param vertexStart 
         * @param vertexCount 
         * @param arrayOffset 
         * @param stride 
         * @returns - min number array and max number array
         */
        private calculateMinMax(buff: FloatArray, vertexStart: number, vertexCount: number, arrayOffset: number, stride: number): { min: number[], max: number[] } {
            let min = [Infinity, Infinity, Infinity];
            let max = [-Infinity, -Infinity, -Infinity];
            let end = vertexStart + vertexCount;
            if (vertexCount > 0) {
                for (let i = vertexStart; i < end; ++i) {
                    let index = stride * i;
                    for (let j = 0; j < stride; ++j) {
                        if (buff[index] < min[j]) {
                            min[j] = buff[index];
                        }
                        if (buff[index] > max[j]) {
                            max[j] = buff[index];
                        }
                        ++index;
                    }
                }
            }
            return { min, max };
        }

        /**
         * Write mesh attribute data to buffer.
         * Returns the bytelength of the data.
         * @param vertexBufferType 
         * @param submesh 
         * @param meshAttributeArray 
         * @param strideSize 
         * @param byteOffset 
         * @param dataBuffer 
         * @param useRightHandedSystem 
         * @returns - byte length
         */
        private writeAttributeData(vertexBufferType: string, submesh: SubMesh, meshAttributeArray: FloatArray, strideSize: number, byteOffset: number, dataBuffer: DataView, useRightHandedSystem: boolean): number {
            let byteOff = byteOffset;
            const end = submesh.verticesStart + submesh.verticesCount;
            let byteLength = 0;

            switch (vertexBufferType) {
                case VertexBuffer.PositionKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                        if (useRightHandedSystem) {
                            dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        }
                        else {
                            dataBuffer!.setFloat32(byteOff, -meshAttributeArray![index + 2], true);
                        }

                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 12;
                    break;
                }
                case VertexBuffer.NormalKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                        if (useRightHandedSystem) {
                            dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        }
                        else {
                            dataBuffer!.setFloat32(byteOff, -meshAttributeArray![index + 2], true);
                        }

                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 12;
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let k = submesh.indexStart; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                        if (useRightHandedSystem) {
                            dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        }
                        else {
                            dataBuffer!.setFloat32(byteOff, -meshAttributeArray![index + 2], true);
                        }
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 3], true);
                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 16;
                    break;
                }
                case VertexBuffer.ColorKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 2], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 3], true);
                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 16;
                    break;
                }
                case VertexBuffer.UVKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 8;
                    break;
                }
                case VertexBuffer.UV2Kind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        const index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 8;
                    break;
                }
                default: {
                    throw new Error("Unsupported vertex buffer type: " + vertexBufferType);
                }
            }

            return byteLength;
        }

        /**
         * Generates glTF json data
         * @param glb 
         * @param glTFPrefix 
         * @param prettyPrint 
         * @returns - json data as string
         */
        private generateJSON(glb: boolean, glTFPrefix?: string, prettyPrint?: boolean): string {
            let buffer: _IGLTFBuffer = { byteLength: this.totalByteLength };

            let glTF: _IGLTF = {
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
                if (!glb) {
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
                            const bufferView = this.createBufferView(0, byteOffset, imageData.data.length, imageName);
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

            if (!glb) {
                buffer.uri = glTFPrefix + ".bin";
            }

            const jsonText = prettyPrint ? JSON.stringify(glTF, null, 2) : JSON.stringify(glTF);

            return jsonText;
        }

        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix 
         * @returns - object with glTF json tex filename 
         * and binary file name as keys and their data as values
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
         * Pads the number to a power of 4
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
         * @param jsonText 
         * @param binaryBuffer 
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

            const byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength;

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
            binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + imageByteLength, true);
            binaryChunkBufferView.setUint32(4, 0x004E4942, true);

            // binary padding
            const binPaddingBuffer = new ArrayBuffer(binPadding);
            const binPaddingView = new Uint8Array(binPaddingBuffer);
            for (let i = 0; i < binPadding; ++i) {
                binPaddingView[i] = 0;
            }

            const glbData = [headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer];

            // binary data
            for (let key in this.imageData) {
                glbData.push(this.imageData[key].data.buffer);
            }

            glbData.push(binPaddingBuffer);

            const glbFile = new Blob(glbData, { type: 'application/octet-stream' });

            const container = new _GLTFData();
            container.glTFFiles[glbFileName] = glbFile;

            return container;
        }

        /**
         * Sets the TRS for each node
         * @param node 
         * @param babylonMesh 
         * @param useRightHandedSystem 
         */
        private setNodeTransformation(node: _IGLTFNode, babylonMesh: AbstractMesh, useRightHandedSystem: boolean): void {
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
         * 
         * @param babylonTexture 
         * @return - glTF texture, or null if the texture format is not supported
         */
        private exportTexture(babylonTexture: BaseTexture, mimeType: _EGLTFImageMimeTypeEnum = _EGLTFImageMimeTypeEnum.JPG): Nullable<_IGLTFTextureInfo> {
            let textureInfo: Nullable<_IGLTFTextureInfo> = null;

            let glTFTexture: Nullable<_IGLTFTexture>;

            glTFTexture = {
                source: this.images.length
            };

            let textureName = babylonTexture.getInternalTexture()!.url;
            if (textureName.search('/') !== -1) {
                const splitFilename = textureName.split('/');
                textureName = splitFilename[splitFilename.length - 1];
                const basefile = textureName.split('.')[0];
                let extension = textureName.split('.')[1];
                if (mimeType === _EGLTFImageMimeTypeEnum.JPG) {
                    extension = ".jpg";
                }
                else if (mimeType === _EGLTFImageMimeTypeEnum.PNG) {
                    extension = ".png";
                }
                else {
                    throw new Error("Unsupported mime type " + mimeType);
                }
                textureName = basefile + extension;
            }

            const pixels = babylonTexture!.readPixels() as Uint8Array;

            const imageCanvas = document.createElement('canvas');
            imageCanvas.id = "ImageCanvas";

            const ctx = <CanvasRenderingContext2D>imageCanvas.getContext('2d');
            const size = babylonTexture.getSize();
            imageCanvas.width = size.width;
            imageCanvas.height = size.height;

            const imgData = ctx.createImageData(size.width, size.height);


            imgData.data.set(pixels!);
            ctx.putImageData(imgData, 0, 0);
            const base64Data = imageCanvas.toDataURL(mimeType);
            const binStr = atob(base64Data.split(',')[1]);
            const arr = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; ++i) {
                arr[i] = binStr.charCodeAt(i);
            }
            const imageValues = { data: arr, mimeType: mimeType };

            this.imageData[textureName] = imageValues;
            if (mimeType === _EGLTFImageMimeTypeEnum.JPG) {
                const glTFImage: _IGLTFImage = {
                    uri: textureName
                }
                let foundIndex = -1;
                for (let i = 0; i < this.images.length; ++i) {
                    if (this.images[i].uri === textureName) {
                        foundIndex = i;
                        break;
                    }
                }

                if (foundIndex === -1) {
                    this.images.push(glTFImage);
                    glTFTexture.source = this.images.length - 1;
                    this.textures.push({
                        source: this.images.length - 1
                    });

                    textureInfo = {
                        index: this.images.length - 1
                    }
                }
                else {
                    glTFTexture.source = foundIndex;

                    textureInfo = {
                        index: foundIndex
                    }
                }
            }

            return textureInfo;
        }

        /**
         * Sets data for the primitive attributes of each submesh
         * @param mesh 
         * @param babylonMesh 
         * @param byteOffset 
         * @param useRightHandedSystem 
         * @param dataBuffer 
         * @returns - bytelength of the primitive attributes plus the passed in byteOffset
         */
        private setPrimitiveAttributes(mesh: _IGLTFMesh, babylonMesh: AbstractMesh, byteOffset: number, useRightHandedSystem: boolean, dataBuffer?: DataView): number {
            // go through all mesh primitives (submeshes)
            for (let j = 0; j < babylonMesh.subMeshes.length; ++j) {
                let bufferMesh = null;
                const submesh = babylonMesh.subMeshes[j];
                const meshPrimitive: _IGLTFMeshPrimitive = { attributes: {} };

                if (babylonMesh instanceof Mesh) {
                    bufferMesh = (babylonMesh as Mesh);
                }
                else if (babylonMesh instanceof InstancedMesh) {
                    bufferMesh = (babylonMesh as InstancedMesh).sourceMesh;
                }

                // Loop through each attribute of the submesh (mesh primitive)
                if (bufferMesh!.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                    const positionVertexBuffer = bufferMesh!.getVertexBuffer(VertexBuffer.PositionKind);
                    const positionVertexBufferOffset = positionVertexBuffer!.getOffset();
                    const positions = positionVertexBuffer!.getData();
                    const positionStrideSize = positionVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            VertexBuffer.PositionKind,
                            submesh,
                            positions!,
                            positionStrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        const byteLength = submesh.verticesCount * 12;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Positions");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const result = this.calculateMinMax(positions!, submesh.verticesStart, submesh.verticesCount, positionVertexBufferOffset!, positionStrideSize!);
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Position", "VEC3", 5126, submesh.verticesCount, result.min, result.max);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.POSITION = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    const normalVertexBuffer = bufferMesh!.getVertexBuffer(VertexBuffer.NormalKind);
                    const normals = normalVertexBuffer!.getData();
                    const normalStrideSize = normalVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            VertexBuffer.NormalKind,
                            submesh,
                            normals!,
                            normalStrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        const byteLength = submesh.verticesCount * 12;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Normals");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Normal", "VEC3", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.NORMAL = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(VertexBuffer.TangentKind)) {
                    const tangentVertexBuffer = bufferMesh!.getVertexBuffer(VertexBuffer.TangentKind);
                    const tangents = tangentVertexBuffer!.getData();
                    const tangentStrideSize = tangentVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            VertexBuffer.TangentKind,
                            submesh,
                            tangents!,
                            tangentStrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        const byteLength = submesh.verticesCount * 16;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Tangents");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Tangent", "VEC4", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.TANGENT = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    const colorVertexBuffer = bufferMesh!.getVertexBuffer(VertexBuffer.ColorKind);
                    const colors = colorVertexBuffer!.getData();
                    const colorStrideSize = colorVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            VertexBuffer.ColorKind,
                            submesh,
                            colors!,
                            colorStrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        const byteLength = submesh.verticesCount * 16;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Colors");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Color", "VEC4", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    const texCoord0VertexBuffer = bufferMesh!.getVertexBuffer(VertexBuffer.UVKind);
                    const texCoords0 = texCoord0VertexBuffer!.getData();
                    const texCoord0StrideSize = texCoord0VertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            VertexBuffer.UVKind,
                            submesh,
                            texCoords0!,
                            texCoord0StrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        const byteLength = submesh.verticesCount * 8;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Texture Coords0");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    const texCoord1VertexBuffer = bufferMesh!.getVertexBuffer(VertexBuffer.UV2Kind);
                    const texCoords1 = texCoord1VertexBuffer!.getData();
                    const texCoord1StrideSize = texCoord1VertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            VertexBuffer.UV2Kind,
                            submesh,
                            texCoords1!,
                            texCoord1StrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        const byteLength = submesh.verticesCount * 8;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Texture Coords 1");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
                    }
                }

                if (bufferMesh!.getTotalIndices() > 0) {
                    if (dataBuffer) {
                        const indices = bufferMesh!.getIndices();
                        const start = submesh.indexStart;
                        const end = submesh.indexCount + start;
                        let byteOff = byteOffset;

                        for (let k = start; k < end; k = k + 3) {
                            dataBuffer!.setUint32(byteOff, indices![k], true);
                            byteOff += 4;
                            dataBuffer!.setUint32(byteOff, indices![k + 1], true);
                            byteOff += 4;
                            dataBuffer!.setUint32(byteOff, indices![k + 2], true);
                            byteOff += 4;
                        }

                        const byteLength = submesh.indexCount * 4;
                        byteOffset += byteLength;
                    }
                    else {
                        // Create bufferview
                        const indicesCount = submesh.indexCount;
                        const byteLength = indicesCount * 4;
                        const bufferview = this.createBufferView(0, byteOffset, byteLength, "Indices");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Indices", "SCALAR", 5125, indicesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.indices = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.material) {
                    if (bufferMesh!.material instanceof StandardMaterial) {
                        const babylonStandardMaterial = bufferMesh!.material as StandardMaterial;

                        const glTFMaterial: _IGLTFMaterial = { name: babylonStandardMaterial.name };
                        if (!babylonStandardMaterial.backFaceCulling) {
                            glTFMaterial.doubleSided = true;
                        }
                        if (babylonStandardMaterial.bumpTexture) {
                            const glTFTexture = this.exportTexture(babylonStandardMaterial.bumpTexture);
                            if (glTFTexture) {
                                glTFMaterial.normalTexture = glTFTexture;
                            }
                        }
                        if (babylonStandardMaterial.emissiveTexture) {
                            const glTFEmissiveTexture = this.exportTexture(babylonStandardMaterial.emissiveTexture);
                            if (glTFEmissiveTexture) {
                                glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                            }
                            glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                        }
                        if (babylonStandardMaterial.ambientTexture) {
                            const glTFOcclusionTexture = this.exportTexture(babylonStandardMaterial.ambientTexture);
                            if (glTFOcclusionTexture) {
                                glTFMaterial.occlusionTexture = glTFOcclusionTexture;
                            }
                        }
                        // Spec Gloss
                        const babylonSpecularGlossiness: _IBabylonSpecularGlossiness = {
                            diffuse: babylonStandardMaterial.diffuseColor,
                            opacity: babylonStandardMaterial.alpha,
                            specular: babylonStandardMaterial.specularColor || Color3.Black(),
                            glossiness: babylonStandardMaterial.specularPower / 256
                        };
                        if (babylonStandardMaterial.specularTexture) {

                        }
                        const babylonMetallicRoughness = _GLTFMaterial.ConvertToMetallicRoughness(babylonSpecularGlossiness);

                        const glTFPbrMetallicRoughness: _IGLTFPBRMetallicRoughnessMaterial = {
                            baseColorFactor: [
                                babylonMetallicRoughness.baseColor.r,
                                babylonMetallicRoughness.baseColor.g,
                                babylonMetallicRoughness.baseColor.b,
                                babylonMetallicRoughness.opacity
                            ],
                            metallicFactor: babylonMetallicRoughness.metallic,
                            roughnessFactor: babylonMetallicRoughness.roughness
                        };
                        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;

                        // TODO: Handle Textures
                        this.materials.push(glTFMaterial);
                        meshPrimitive.material = this.materials.length - 1;
                    }
                    else if (bufferMesh!.material instanceof PBRMetallicRoughnessMaterial) {
                        if (!this.textures) {
                            this.textures = new Array<_IGLTFTexture>();
                        }
                        const babylonPBRMaterial = bufferMesh!.material as PBRMetallicRoughnessMaterial;
                        const glTFPbrMetallicRoughness: _IGLTFPBRMetallicRoughnessMaterial = {};

                        if (babylonPBRMaterial.baseColor) {
                            glTFPbrMetallicRoughness.baseColorFactor = [
                                babylonPBRMaterial.baseColor.r,
                                babylonPBRMaterial.baseColor.g,
                                babylonPBRMaterial.baseColor.b,
                                babylonPBRMaterial.alpha
                            ];
                        }
                        if (babylonPBRMaterial.baseTexture !== undefined) {
                            const glTFTexture = this.exportTexture(babylonPBRMaterial.baseTexture);
                            if (glTFTexture !== null) {
                                glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                            }
                            glTFPbrMetallicRoughness.baseColorTexture
                        }
                        if (babylonPBRMaterial.metallic !== undefined) {
                            glTFPbrMetallicRoughness.metallicFactor = babylonPBRMaterial.metallic;
                        }
                        if (babylonPBRMaterial.roughness !== undefined) {
                            glTFPbrMetallicRoughness.roughnessFactor = babylonPBRMaterial.roughness;
                        }

                        const glTFMaterial: _IGLTFMaterial = {
                            name: babylonPBRMaterial.name
                        };
                        if (babylonPBRMaterial.doubleSided) {
                            glTFMaterial.doubleSided = babylonPBRMaterial.doubleSided;
                        }
                        if (babylonPBRMaterial.normalTexture) {
                            const glTFTexture = this.exportTexture(babylonPBRMaterial.normalTexture);
                            if (glTFTexture) {
                                glTFMaterial.normalTexture = glTFTexture;
                            }
                        }
                        if (babylonPBRMaterial.occlusionTexture) {
                            const glTFTexture = this.exportTexture(babylonPBRMaterial.occlusionTexture);
                            if (glTFTexture) {
                                glTFMaterial.occlusionTexture = glTFTexture;
                                if (babylonPBRMaterial.occlusionStrength !== undefined) {
                                    glTFMaterial.occlusionTexture.strength = babylonPBRMaterial.occlusionStrength;
                                }
                            }
                        }
                        if (babylonPBRMaterial.emissiveTexture) {
                            const glTFTexture = this.exportTexture(babylonPBRMaterial.emissiveTexture);
                            if (glTFTexture !== null) {
                                glTFMaterial.emissiveTexture = glTFTexture;
                            }
                        }
                        if (!babylonPBRMaterial.emissiveColor.equals(new Color3(0.0, 0.0, 0.0))) {
                            glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
                        }
                        if (babylonPBRMaterial.transparencyMode) {
                            const alphaMode = _GLTFMaterial.GetAlphaMode(babylonPBRMaterial);

                            if (alphaMode !== _EGLTFAlphaModeEnum.OPAQUE) { //glTF defaults to opaque
                                glTFMaterial.alphaMode = alphaMode;
                                if (alphaMode === _EGLTFAlphaModeEnum.BLEND) {
                                    glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                                }
                            }
                        }

                        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;

                        // TODO: Handle Textures
                        this.materials.push(glTFMaterial);
                        meshPrimitive.material = this.materials.length - 1;
                    }
                }
                mesh.primitives.push(meshPrimitive);
            }
            return byteOffset;
        }

        /**
         * Creates a glTF scene based on the array of meshes.
         * Returns the the total byte offset.
         * @param gltf 
         * @param byteOffset 
         * @param buffer 
         * @param dataBuffer 
         * @returns bytelength + byteoffset
         */
        private createScene(babylonScene: Scene, byteOffset: number, dataBuffer?: DataView): number {
            if (babylonScene.meshes.length > 0) {
                const babylonMeshes = babylonScene.meshes;
                const scene = { nodes: new Array<number>() };

                for (let i = 0; i < babylonMeshes.length; ++i) {
                    if (this.options &&
                        this.options.shouldExportMesh !== undefined &&
                        !this.options.shouldExportMesh(babylonMeshes[i])) {
                        continue;
                    }
                    else {
                        // create node to hold translation/rotation/scale and the mesh
                        const node: _IGLTFNode = { mesh: -1 };
                        const babylonMesh = babylonMeshes[i];
                        const useRightHandedSystem = babylonMesh.getScene().useRightHandedSystem;

                        // Set transformation
                        this.setNodeTransformation(node, babylonMesh, useRightHandedSystem);

                        // create mesh
                        const mesh: _IGLTFMesh = { primitives: new Array<_IGLTFMeshPrimitive>() };
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