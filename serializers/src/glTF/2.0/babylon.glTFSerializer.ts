/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    interface OGLTFAsset {
        generator: string;
        version: string;
    }
    interface OGLTFScene {
        nodes: number[];
    }
    interface OGLTFNode {
        mesh: number;
        name?: string;
        translation?: number[];
        scale?: number[];
        rotation?: number[];
    }
    interface OGLTFMeshPrimitive {
        attributes: { [index: string]: number };
        indices?: number;
        material?: number;
    }
    interface OGLTFMesh {
        name?: string;
        primitives: OGLTFMeshPrimitive[];
    }
    interface OGLTFMaterial {
    }
    interface OGLTFBuffer {
        byteLength: number;
        uri?: string;
    }
    interface OGLTFBufferView {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
    }
    interface OGLTFAccessor {
        name: string;
        bufferView: number;
        componentType: number;
        count: number;
        type: string;
        min?: number[];
        max?: number[];
    }
    interface OGLTF {
        buffers: OGLTFBuffer[];
        asset: OGLTFAsset;
        meshes: OGLTFMesh[];
        materials?: OGLTFMaterial[];
        scenes: OGLTFScene[];
        nodes: OGLTFNode[];
        bufferViews: OGLTFBufferView[];
        accessors: OGLTFAccessor[];
    }

    export class GLTFExport {
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes 
         * @param materials 
         * @param glb 
         */
        public static GLTF(meshes: Mesh[], filename: string, glb?: boolean): {[fileName: string]: string | Blob} {
            /**
             * Creates a buffer view based on teh supplied arguments
             * @param bufferIndex 
             * @param byteOffset 
             * @param byteLength 
             */
            function createBufferView(bufferIndex: number, byteOffset: number, byteLength: number): OGLTFBufferView {
                let bufferview: OGLTFBufferView = {buffer: bufferIndex, byteLength: byteLength};
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
             */
            function createAccessor(bufferviewIndex: number, name: string, type: string, componentType: number, count: number, min?: number[], max?: number[]): OGLTFAccessor {
                let accessor: OGLTFAccessor = {name: name, bufferView: bufferviewIndex, componentType: componentType, count:count, type:type};

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
             */
            function calculateMinMax(buff: FloatArray, vertexStart: number, vertexCount: number, arrayOffset: number, stride: number): {min: number[], max: number[]} {
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
             */
            function writeAttributeData(vertexBufferType: string, submesh: BABYLON.SubMesh, meshAttributeArray: FloatArray, strideSize: number, byteOffset: number, dataBuffer: DataView, useRightHandedSystem: boolean): number {
                let byteOff = byteOffset;
                let end = submesh.verticesStart + submesh.verticesCount;
                let byteLength = 0;

                switch(vertexBufferType) {
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
             * Generates a glb file from the json and binary data.  
             * Returns an object with the glb file name as the key and data as the value.
             * @param jsonText 
             * @param binaryBuffer 
             * @param glTFPrefix 
             */
            function createGLB(jsonText: string, binaryBuffer: ArrayBuffer, glTFPrefix: string): {[glbFileName: string]: Blob} {
                let glbFileName = glTFPrefix + '.glb';
                let headerLength = 12;
                let chunkLengthPrefix = 8;
                let jsonLength = jsonText.length;
                let jsonRemainder = jsonLength % 4;
                let binRemainder = binaryBuffer.byteLength % 4;
                let jsonPadding = jsonRemainder === 0 ? jsonRemainder :  4 - jsonRemainder;
                let binPadding = binRemainder === 0 ? binRemainder : 4 - binRemainder;
                let totalByteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding  + binaryBuffer.byteLength + binPadding;

                //header
                let headerBuffer = new ArrayBuffer(headerLength);
                let headerBufferView = new DataView(headerBuffer);
                headerBufferView.setUint32(0, 0x46546C67, true); //glTF
                headerBufferView.setUint32(4, 2, true); // version
                headerBufferView.setUint32(8, totalByteLength, true); // total bytes in file

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
                let glbFile = new Blob([headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer, binPaddingBuffer], {type: 'application/octet-stream'});


                return { 
                    [glbFileName]: glbFile 
                };
            }
            /**
             * Creates a glTF scene based on the array of meshes.
             * Returns the the total byte offset.
             * @param gltf 
             * @param totalByteOffset 
             * @param buffer 
             * @param dataBuffer 
             */
            function createScene(gltf: OGLTF, totalByteOffset: number, dataBuffer?: DataView | null): number {
                let scene = {nodes: new Array<number>()};

                for (let i = 0; i < meshes.length; ++i) {
                    // create node to hold translation/rotation/scale and the mesh
                    let node: OGLTFNode = {mesh:-1};
                    let babylonMesh = meshes[i];
                    let useRightHandedSystem = babylonMesh.getScene().useRightHandedSystem;

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

                    let positionVertexBuffer: Nullable<BABYLON.VertexBuffer>;
                    let positions: Nullable<FloatArray>;
                    let positionVertexBufferOffset: Nullable<number>;
                    let positionStrideSize: Nullable<number>;

                    let normalVertexBuffer: Nullable<VertexBuffer>;
                    let normals: Nullable<FloatArray>;
                    let normalStrideSize: Nullable<number>;

                    let tangentVertexBuffer: Nullable<VertexBuffer>;
                    let tangents: Nullable<FloatArray>;
                    let tangentStrideSize: Nullable<number>;

                    let colorVertexBuffer: Nullable<VertexBuffer>;
                    let colors: Nullable<FloatArray>;
                    let colorStrideSize: Nullable<number>;

                    let texCoord0VertexBuffer: Nullable<VertexBuffer>;
                    let texCoords0: Nullable<FloatArray>;
                    let texCoord0StrideSize: Nullable<number>;

                    let texCoord1VertexBuffer: Nullable<VertexBuffer>;
                    let texCoords1: Nullable<FloatArray>;
                    let texCoord1StrideSize: Nullable<number>;

                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                        positionVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.PositionKind);
                        positions = positionVertexBuffer!.getData();
                        positionVertexBufferOffset = positionVertexBuffer!.getOffset();
                        positionStrideSize = positionVertexBuffer!.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                        normalVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);
                        normals = normalVertexBuffer!.getData();
                        normalStrideSize = normalVertexBuffer!.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                        tangentVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.TangentKind);
                        tangents = tangentVertexBuffer!.getData();
                        tangentStrideSize = tangentVertexBuffer!.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                        colorVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.ColorKind);
                        colors = colorVertexBuffer!.getData();
                        colorStrideSize = colorVertexBuffer!.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        texCoord0VertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.UVKind);
                        texCoords0 = texCoord0VertexBuffer!.getData();
                        texCoord0StrideSize = texCoord0VertexBuffer!.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        texCoord1VertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.UV2Kind);
                        texCoords1 = texCoord1VertexBuffer!.getData();
                        texCoord1StrideSize = texCoord1VertexBuffer!.getStrideSize();
                    }

                    // create mesh
                    let mesh: OGLTFMesh = {primitives: new Array<OGLTFMeshPrimitive>()};
                    mesh.primitives = [];
                    if (babylonMesh.name) {
                        mesh.name = babylonMesh.name;
                    }
                    // go through all mesh primitives (submeshes)
                    for (let j = 0; j < babylonMesh.subMeshes.length; ++j) {
                        let submesh = babylonMesh.subMeshes[j];
                        let meshPrimitive:OGLTFMeshPrimitive = {attributes: {}};

                        // Loop through each attribute of the submesh (mesh primitive)
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(
                                    BABYLON.VertexBuffer.PositionKind,
                                    submesh,
                                    positions!,
                                    positionStrideSize!,
                                    totalByteOffset,
                                    dataBuffer,
                                    useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                let byteLength = submesh.verticesCount * 12;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let result = calculateMinMax(positions!, submesh.verticesStart, submesh.verticesCount, positionVertexBufferOffset!, positionStrideSize!);
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Position", "VEC3", 5126, submesh.verticesCount, result.min, result.max);
                                gltf.accessors.push(accessor);

                                meshPrimitive.attributes.POSITION = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(
                                    BABYLON.VertexBuffer.NormalKind,
                                    submesh,
                                    normals!,
                                    normalStrideSize!,
                                    totalByteOffset,
                                    dataBuffer,
                                    useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                let byteLength = submesh.verticesCount * 12;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Normal", "VEC3", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);

                                meshPrimitive.attributes.NORMAL = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(
                                    BABYLON.VertexBuffer.TangentKind,
                                    submesh,
                                    tangents!,
                                    tangentStrideSize!,
                                    totalByteOffset,
                                    dataBuffer,
                                    useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                let byteLength = submesh.verticesCount * 16;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Tangent", "VEC4", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);

                                meshPrimitive.attributes.TANGENT = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(
                                    BABYLON.VertexBuffer.ColorKind,
                                    submesh,
                                    colors!,
                                    colorStrideSize!,
                                    totalByteOffset,
                                    dataBuffer,
                                    useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                let byteLength = submesh.verticesCount * 16;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Color", "VEC4", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);

                                meshPrimitive.attributes.COLOR_0 = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(
                                    BABYLON.VertexBuffer.UVKind,
                                    submesh,
                                    texCoords0!,
                                    texCoord0StrideSize!,
                                    totalByteOffset,
                                    dataBuffer,
                                    useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                let byteLength = submesh.verticesCount * 8;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);

                                meshPrimitive.attributes.TEXCOORD_0 = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(
                                    BABYLON.VertexBuffer.UV2Kind,
                                    submesh,
                                    texCoords1!,
                                    texCoord1StrideSize!,
                                    totalByteOffset,
                                    dataBuffer,
                                    useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                let byteLength = submesh.verticesCount * 8;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);

                                meshPrimitive.attributes.TEXCOORD_1 = gltf.accessors.length - 1;
                            }
                        }

                        if (babylonMesh.getTotalIndices() > 0) {
                            if (dataBuffer) {
                                let indices = babylonMesh.getIndices();
                                let start = submesh.indexStart;
                                let end = submesh.indexCount + start;
                                let byteOff = totalByteOffset;

                                for (let k = start; k < end; k = k + 3) {
                                    dataBuffer!.setUint32(byteOff, indices![k], true);
                                    byteOff += 4;
                                    dataBuffer!.setUint32(byteOff, indices![k + 1], true);
                                    byteOff += 4;
                                    dataBuffer!.setUint32(byteOff, indices![k + 2], true);
                                    byteOff += 4;
                                }
                                
                                let byteLength = submesh.indexCount * 4;
                                totalByteOffset += byteLength;
                            }
                            else {
                                // Create bufferview
                                let indicesCount = submesh.indexCount;
                                let byteLength = indicesCount * 4;
                                let bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);

                                // Create accessor
                                let accessor = createAccessor(gltf.bufferViews.length - 1, "Indices", "SCALAR", 5125, indicesCount);
                                gltf.accessors.push(accessor);

                                meshPrimitive.indices = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.material) {
                            if (!gltf.materials) {
                                gltf.materials = new Array<OGLTFMaterial>();
                            }
                            meshPrimitive.material = gltf.materials.length - 1;
                        }
                        mesh.primitives.push(meshPrimitive);
                    }
                    gltf.meshes.push(mesh);
                    node.mesh = gltf.meshes.length - 1;
                    if (babylonMesh.name) {
                      node.name = babylonMesh.name;
                    }
                    gltf.nodes.push(node);

                    scene.nodes.push(gltf.nodes.length - 1);
                }
                gltf.scenes.push(scene);
                return totalByteOffset;
            }

            let glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            let gltf: OGLTF = {
                buffers: new Array<OGLTFBuffer>(), 
                bufferViews: new Array<OGLTFBufferView>(), 
                asset: {generator: "BabylonJS", version: "2.0"}, 
                meshes: new Array<OGLTFMesh>(), 
                scenes: new Array<OGLTFScene>(),
                nodes: new Array<OGLTFNode>(),
                accessors: new Array<OGLTFAccessor>() 
            };

            let totalByteOffset = 0;
            let binaryBuffer: ArrayBuffer;
            let dataBuffer: DataView;

            // Create scene.  First pass calculates the totalByteOffset.
            totalByteOffset = createScene(gltf, totalByteOffset, null);
            let buff: OGLTFBuffer = {byteLength: totalByteOffset};
            if (!glb) {
                buff.uri = glTFPrefix + '.bin';
            }
            
            gltf.buffers.push(buff);

            let text = JSON.stringify(gltf, null, 2);
            binaryBuffer = new ArrayBuffer(totalByteOffset);
            dataBuffer = new DataView(binaryBuffer);
            totalByteOffset = 0;

            // Create scene.  Second pass generates the binary data
            createScene(gltf, totalByteOffset, dataBuffer);

            if (glb) { // Creates a glb
                let glbFile = createGLB(text, binaryBuffer, glTFPrefix);

                return glbFile;
            }

            let glTFFileName = glTFPrefix + '.gltf';
            let glTFBinFile = glTFPrefix + '.bin';

            let bin = new Blob([binaryBuffer], {type: 'application/octet-stream'});

            return { 
                [glTFFileName]: text, 
                [glTFBinFile]: bin 
            };
        }
    }
}
