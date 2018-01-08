module BABYLON {
    interface _IGLTFAsset {
        generator: string;
        version: string;
    }
    interface _IGLTFScene {
        nodes: number[];
    }
    interface _IGLTFNode {
        mesh: number;
        name?: string;
        translation?: number[];
        scale?: number[];
        rotation?: number[];
    }
    interface _IGLTFMeshPrimitive {
        attributes: { [index: string]: number };
        indices?: number;
        material?: number;
    }
    interface _IGLTFMesh {
        primitives: _IGLTFMeshPrimitive[];
    }
    interface _IGLTFMaterial {
    }
    interface _IGLTFBuffer {
        byteLength: number;
        uri?: string;
    }
    interface _IGLTFBufferView {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
    }
    interface _IGLTFAccessor {
        name: string;
        bufferView: number;
        componentType: number;
        count: number;
        type: string;
        min?: number[];
        max?: number[];
    }
    interface _IGLTF {
        buffers: _IGLTFBuffer[];
        asset: _IGLTFAsset;
        meshes: _IGLTFMesh[];
        materials?: _IGLTFMaterial[];
        scenes: _IGLTFScene[];
        scene?: number;
        nodes: _IGLTFNode[];
        bufferViews: _IGLTFBufferView[];
        accessors: _IGLTFAccessor[];
    }

    export class _GLTF2Exporter {
        private bufferViews: _IGLTFBufferView[];
        private accessors: _IGLTFAccessor[];
        private nodes: _IGLTFNode[];
        private asset: _IGLTFAsset;
        private scenes: _IGLTFScene[];
        private meshes: _IGLTFMesh[];
        private totalByteLength: number;
        private babylonScene: BABYLON.Scene;

        public constructor(babylonScene: BABYLON.Scene) {
            this.asset = { generator: "BabylonJS", version: "2.0" };
            this.babylonScene = babylonScene;
            this.bufferViews = new Array<_IGLTFBufferView>();
            this.accessors = new Array<_IGLTFAccessor>();
            this.meshes = new Array<_IGLTFMesh>();
            this.scenes = new Array<_IGLTFScene>();
            this.nodes = new Array<_IGLTFNode>();

            let totalByteLength = 0;

            totalByteLength = this.createScene(this.babylonScene, totalByteLength);

            this.totalByteLength = totalByteLength;
        }

        /**
         * Creates a buffer view based on teh supplied arguments
         * @param bufferIndex 
         * @param byteOffset 
         * @param byteLength 
         * 
         * @returns {_IGLTFBufferView} 
         */
        private createBufferView(bufferIndex: number, byteOffset: number, byteLength: number): _IGLTFBufferView {
            let bufferview: _IGLTFBufferView = { buffer: bufferIndex, byteLength: byteLength };
            if (byteOffset > 0) {
                bufferview.byteOffset = byteOffset;
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
         * 
         * @returns {_IGLTFAccessor} 
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
         * 
         * @returns {min: number[], max: number[]} min number array and max number array
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
         * 
         * @returns {number} byte length
         */
        private writeAttributeData(vertexBufferType: string, submesh: BABYLON.SubMesh, meshAttributeArray: FloatArray, strideSize: number, byteOffset: number, dataBuffer: DataView, useRightHandedSystem: boolean): number {
            let byteOff = byteOffset;
            let end = submesh.verticesStart + submesh.verticesCount;
            let byteLength = 0;

            switch (vertexBufferType) {
                case BABYLON.VertexBuffer.PositionKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        let index = k * strideSize!;
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
                case BABYLON.VertexBuffer.NormalKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        let index = k * strideSize!;
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
                case BABYLON.VertexBuffer.TangentKind: {
                    for (let k = submesh.indexStart; k < end; ++k) {
                        let index = k * strideSize!;
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
                case BABYLON.VertexBuffer.ColorKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        let index = k * strideSize!;
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
                case BABYLON.VertexBuffer.UVKind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        let index = k * strideSize!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index], true);
                        byteOff += 4!;
                        dataBuffer!.setFloat32(byteOff, meshAttributeArray![index + 1], true);
                        byteOff += 4!;
                    }
                    byteLength = submesh.verticesCount * 8;
                    break;
                }
                case BABYLON.VertexBuffer.UV2Kind: {
                    for (let k = submesh.verticesStart; k < end; ++k) {
                        let index = k * strideSize!;
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
         * 
         * @returns {string} json data as string
         */
        private generateJSON(glb: boolean, glTFPrefix?: string, prettyPrint?: boolean): string {
            let buffer: _IGLTFBuffer = { byteLength: this.totalByteLength };

            let glTF: _IGLTF = {
                buffers: [buffer],
                asset: this.asset,
                meshes: this.meshes,
                scenes: this.scenes,
                nodes: this.nodes,
                bufferViews: this.bufferViews,
                accessors: this.accessors
            };
            if (this.scenes.length > 0) {
                glTF.scene = 0;
            }

            if (!glb) {
                buffer.uri = glTFPrefix + ".bin";
            }

            let jsonText = prettyPrint ? JSON.stringify(glTF, null, 2) : JSON.stringify(glTF);

            return jsonText;
        }
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix 
         * 
         * @returns {[x: string]: string | Blob} object with glTF json tex filename 
         * and binary file name as keys and their data as values
         */
        public _generateGLTF(glTFPrefix: string): _GLTFData {
            const jsonText = this.generateJSON(false, glTFPrefix, true);
            const binaryBuffer = this.generateBinary();
            const bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });

            const glTFFileName = glTFPrefix + '.gltf';
            const glTFBinFile = glTFPrefix + '.bin';

            let container = new _GLTFData();
            container._glTFFiles[glTFFileName] = jsonText;
            container._glTFFiles[glTFBinFile] = bin;

            return container;
        }
        /**
         * Creates a binary buffer for glTF
         * 
         * @returns {ArrayBuffer}
         */
        private generateBinary(): ArrayBuffer {
            let byteOffset = 0;
            let binaryBuffer = new ArrayBuffer(this.totalByteLength);
            let dataBuffer = new DataView(binaryBuffer);
            byteOffset = this.createScene(this.babylonScene, byteOffset, dataBuffer);

            return binaryBuffer;
        }
        /**
         * Generates a glb file from the json and binary data.  
         * Returns an object with the glb file name as the key and data as the value.
         * @param jsonText 
         * @param binaryBuffer 
         * @param glTFPrefix 
         * 
         * @returns {[glbFileName: string]: Blob} object with glb filename as key and data as value
         */
        public _generateGLB(glTFPrefix: string): _GLTFData {
            const jsonText = this.generateJSON(true);
            const binaryBuffer = this.generateBinary();
            let glbFileName = glTFPrefix + '.glb';
            let headerLength = 12;
            let chunkLengthPrefix = 8;
            let jsonLength = jsonText.length;
            let jsonRemainder = jsonLength % 4;
            let binRemainder = binaryBuffer.byteLength % 4;
            let jsonPadding = jsonRemainder === 0 ? jsonRemainder : 4 - jsonRemainder;
            let binPadding = binRemainder === 0 ? binRemainder : 4 - binRemainder;
            let byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding;

            //header
            let headerBuffer = new ArrayBuffer(headerLength);
            let headerBufferView = new DataView(headerBuffer);
            headerBufferView.setUint32(0, 0x46546C67, true); //glTF
            headerBufferView.setUint32(4, 2, true); // version
            headerBufferView.setUint32(8, byteLength, true); // total bytes in file

            //json chunk
            let jsonChunkBuffer = new ArrayBuffer(chunkLengthPrefix + jsonLength + jsonPadding);
            let jsonChunkBufferView = new DataView(jsonChunkBuffer);
            jsonChunkBufferView.setUint32(0, jsonLength + jsonPadding, true);
            jsonChunkBufferView.setUint32(4, 0x4E4F534A, true);

            //json chunk bytes
            let jsonData = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix);
            for (let i = 0; i < jsonLength; ++i) {
                jsonData[i] = jsonText.charCodeAt(i);
            }

            //json padding
            let jsonPaddingView = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix + jsonLength);
            for (let i = 0; i < jsonPadding; ++i) {
                jsonPaddingView[i] = 0x20;
            }

            //binary chunk
            let binaryChunkBuffer = new ArrayBuffer(chunkLengthPrefix);
            let binaryChunkBufferView = new DataView(binaryChunkBuffer);
            binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength, true);
            binaryChunkBufferView.setUint32(4, 0x004E4942, true);

            // binary padding
            let binPaddingBuffer = new ArrayBuffer(binPadding);
            let binPaddingView = new Uint8Array(binPaddingBuffer);
            for (let i = 0; i < binPadding; ++i) {
                binPaddingView[i] = 0;
            }

            // binary data
            let glbFile = new Blob([headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer, binPaddingBuffer], { type: 'application/octet-stream' });

            let container = new _GLTFData();
            container._glTFFiles[glbFileName] = glbFile;

            return container;
        }
        /**
         * Sets the TRS for each node
         * @param node 
         * @param babylonMesh 
         * @param useRightHandedSystem 
         */
        private setNodeTransformation(node: _IGLTFNode, babylonMesh: BABYLON.AbstractMesh, useRightHandedSystem: boolean): void {
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
            let rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
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
         * Sets data for the primitive attributes of each submesh
         * @param mesh 
         * @param babylonMesh 
         * @param byteOffset 
         * @param useRightHandedSystem 
         * @param dataBuffer 
         * 
         * @returns {number} bytelength of the primitive attributes plus the passed in byteOffset
         */
        private setPrimitiveAttributes(mesh: _IGLTFMesh, babylonMesh: BABYLON.AbstractMesh, byteOffset: number, useRightHandedSystem: boolean, dataBuffer?: DataView): number {
            // go through all mesh primitives (submeshes)
            for (let j = 0; j < babylonMesh.subMeshes.length; ++j) {
                let bufferMesh = null;
                let submesh = babylonMesh.subMeshes[j];
                let meshPrimitive: _IGLTFMeshPrimitive = { attributes: {} };

                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = (babylonMesh as BABYLON.Mesh);
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = (babylonMesh as BABYLON.InstancedMesh).sourceMesh;
                }

                // Loop through each attribute of the submesh (mesh primitive)
                if (bufferMesh!.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                    const positionVertexBuffer = bufferMesh!.getVertexBuffer(BABYLON.VertexBuffer.PositionKind);
                    const positionVertexBufferOffset = positionVertexBuffer!.getOffset();
                    const positions = positionVertexBuffer!.getData();
                    const positionStrideSize = positionVertexBuffer!.getStrideSize();
                    if (dataBuffer) {

                        byteOffset += this.writeAttributeData(
                            BABYLON.VertexBuffer.PositionKind,
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
                        const bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const result = this.calculateMinMax(positions!, submesh.verticesStart, submesh.verticesCount, positionVertexBufferOffset!, positionStrideSize!);
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Position", "VEC3", 5126, submesh.verticesCount, result.min, result.max);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.POSITION = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    const normalVertexBuffer = bufferMesh!.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);
                    const normals = normalVertexBuffer!.getData();
                    const normalStrideSize = normalVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            BABYLON.VertexBuffer.NormalKind,
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
                        const bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        let accessor = this.createAccessor(this.bufferViews.length - 1, "Normal", "VEC3", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.NORMAL = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                    const tangentVertexBuffer = bufferMesh!.getVertexBuffer(BABYLON.VertexBuffer.TangentKind);
                    const tangents = tangentVertexBuffer!.getData();
                    const tangentStrideSize = tangentVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            BABYLON.VertexBuffer.TangentKind,
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
                        const bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        const accessor = this.createAccessor(this.bufferViews.length - 1, "Tangent", "VEC4", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.TANGENT = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    const colorVertexBuffer = bufferMesh!.getVertexBuffer(BABYLON.VertexBuffer.ColorKind);
                    const colors = colorVertexBuffer!.getData();
                    const colorStrideSize = colorVertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            BABYLON.VertexBuffer.ColorKind,
                            submesh,
                            colors!,
                            colorStrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        let byteLength = submesh.verticesCount * 16;
                        let bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        let accessor = this.createAccessor(this.bufferViews.length - 1, "Color", "VEC4", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    const texCoord0VertexBuffer = bufferMesh!.getVertexBuffer(BABYLON.VertexBuffer.UVKind);
                    const texCoords0 = texCoord0VertexBuffer!.getData();
                    const texCoord0StrideSize = texCoord0VertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            BABYLON.VertexBuffer.UVKind,
                            submesh,
                            texCoords0!,
                            texCoord0StrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        let byteLength = submesh.verticesCount * 8;
                        let bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        let accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                    let texCoord1VertexBuffer = bufferMesh!.getVertexBuffer(BABYLON.VertexBuffer.UV2Kind);
                    let texCoords1 = texCoord1VertexBuffer!.getData();
                    let texCoord1StrideSize = texCoord1VertexBuffer!.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(
                            BABYLON.VertexBuffer.UV2Kind,
                            submesh,
                            texCoords1!,
                            texCoord1StrideSize!,
                            byteOffset,
                            dataBuffer,
                            useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        let byteLength = submesh.verticesCount * 8;
                        let bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        let accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
                    }
                }

                if (bufferMesh!.getTotalIndices() > 0) {
                    if (dataBuffer) {
                        let indices = bufferMesh!.getIndices();
                        let start = submesh.indexStart;
                        let end = submesh.indexCount + start;
                        let byteOff = byteOffset;

                        for (let k = start; k < end; k = k + 3) {
                            dataBuffer!.setUint32(byteOff, indices![k], true);
                            byteOff += 4;
                            dataBuffer!.setUint32(byteOff, indices![k + 1], true);
                            byteOff += 4;
                            dataBuffer!.setUint32(byteOff, indices![k + 2], true);
                            byteOff += 4;
                        }

                        let byteLength = submesh.indexCount * 4;
                        byteOffset += byteLength;
                    }
                    else {
                        // Create bufferview
                        let indicesCount = submesh.indexCount;
                        let byteLength = indicesCount * 4;
                        let bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);

                        // Create accessor
                        let accessor = this.createAccessor(this.bufferViews.length - 1, "Indices", "SCALAR", 5125, indicesCount);
                        this.accessors.push(accessor);

                        meshPrimitive.indices = this.accessors.length - 1;
                    }
                }
                if (bufferMesh!.material) {
                    //TODO: Implement Material
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
         * 
         * @returns {number} bytelength + byteoffset
         */
        private createScene(babylonScene: BABYLON.Scene, byteOffset: number, dataBuffer?: DataView): number {
            if (babylonScene.meshes.length > 0) {
                let babylonMeshes = babylonScene.meshes;
                let scene = { nodes: new Array<number>() };

                for (let i = 0; i < babylonMeshes.length; ++i) {
                    // create node to hold translation/rotation/scale and the mesh
                    let node: _IGLTFNode = { mesh: -1 };
                    let babylonMesh = babylonMeshes[i];
                    let useRightHandedSystem = babylonMesh.getScene().useRightHandedSystem;

                    // Set transformation
                    this.setNodeTransformation(node, babylonMesh, useRightHandedSystem);

                    // create mesh
                    let mesh: _IGLTFMesh = { primitives: new Array<_IGLTFMeshPrimitive>() };
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

                this.scenes.push(scene);
            }

            return byteOffset;
        }
    }
}