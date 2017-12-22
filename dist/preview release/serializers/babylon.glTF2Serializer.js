/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTFExport = /** @class */ (function () {
        function GLTFExport() {
        }
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes
         * @param materials
         * @param glb
         */
        GLTFExport.GLTF = function (meshes, filename, glb) {
            /**
             * Creates a buffer view based on teh supplied arguments
             * @param bufferIndex
             * @param byteOffset
             * @param byteLength
             */
            function createBufferView(bufferIndex, byteOffset, byteLength) {
                var bufferview = { buffer: bufferIndex, byteLength: byteLength };
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
            function createAccessor(bufferviewIndex, name, type, componentType, count, min, max) {
                var accessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };
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
            function calculateMinMax(buff, vertexStart, vertexCount, arrayOffset, stride) {
                var min = [Infinity, Infinity, Infinity];
                var max = [-Infinity, -Infinity, -Infinity];
                var end = vertexStart + vertexCount;
                if (vertexCount > 0) {
                    for (var i = vertexStart; i < end; ++i) {
                        var index = stride * i;
                        for (var j = 0; j < stride; ++j) {
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
                return { min: min, max: max };
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
            function writeAttributeData(vertexBufferType, submesh, meshAttributeArray, strideSize, byteOffset, dataBuffer, useRightHandedSystem) {
                var byteOff = byteOffset;
                var end = submesh.verticesStart + submesh.verticesCount;
                var byteLength = 0;
                switch (vertexBufferType) {
                    case BABYLON.VertexBuffer.PositionKind: {
                        for (var k = submesh.verticesStart; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
                            if (useRightHandedSystem) {
                                dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 2], true);
                            }
                            else {
                                dataBuffer.setFloat32(byteOff, -meshAttributeArray[index + 2], true);
                            }
                            byteOff += 4;
                        }
                        byteLength = submesh.verticesCount * 12;
                        break;
                    }
                    case BABYLON.VertexBuffer.NormalKind: {
                        for (var k = submesh.verticesStart; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
                            if (useRightHandedSystem) {
                                dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 2], true);
                            }
                            else {
                                dataBuffer.setFloat32(byteOff, -meshAttributeArray[index + 2], true);
                            }
                            byteOff += 4;
                        }
                        byteLength = submesh.verticesCount * 12;
                        break;
                    }
                    case BABYLON.VertexBuffer.TangentKind: {
                        for (var k = submesh.indexStart; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
                            if (useRightHandedSystem) {
                                dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 2], true);
                            }
                            else {
                                dataBuffer.setFloat32(byteOff, -meshAttributeArray[index + 2], true);
                            }
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 3], true);
                            byteOff += 4;
                        }
                        byteLength = submesh.verticesCount * 16;
                        break;
                    }
                    case BABYLON.VertexBuffer.ColorKind: {
                        for (var k = submesh.verticesStart; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 2], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 3], true);
                            byteOff += 4;
                        }
                        byteLength = submesh.verticesCount * 16;
                        break;
                    }
                    case BABYLON.VertexBuffer.UVKind: {
                        for (var k = submesh.verticesStart; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
                        }
                        byteLength = submesh.verticesCount * 8;
                        break;
                    }
                    case BABYLON.VertexBuffer.UV2Kind: {
                        for (var k = submesh.verticesStart; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
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
            function createGLB(jsonText, binaryBuffer, glTFPrefix) {
                var glbFileName = glTFPrefix + '.glb';
                var headerLength = 12;
                var chunkLengthPrefix = 8;
                var jsonLength = jsonText.length;
                var jsonRemainder = jsonLength % 4;
                var binRemainder = binaryBuffer.byteLength % 4;
                var jsonPadding = jsonRemainder === 0 ? jsonRemainder : 4 - jsonRemainder;
                var binPadding = binRemainder === 0 ? binRemainder : 4 - binRemainder;
                var totalByteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding;
                //header
                var headerBuffer = new ArrayBuffer(headerLength);
                var headerBufferView = new DataView(headerBuffer);
                headerBufferView.setUint32(0, 0x46546C67, true); //glTF
                headerBufferView.setUint32(4, 2, true); // version
                headerBufferView.setUint32(8, totalByteLength, true); // total bytes in file
                //json chunk
                var jsonChunkBuffer = new ArrayBuffer(chunkLengthPrefix + jsonLength + jsonPadding);
                var jsonChunkBufferView = new DataView(jsonChunkBuffer);
                jsonChunkBufferView.setUint32(0, jsonLength + jsonPadding, true);
                jsonChunkBufferView.setUint32(4, 0x4E4F534A, true);
                //json chunk bytes
                var jsonData = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix);
                for (var i = 0; i < jsonLength; ++i) {
                    jsonData[i] = jsonText.charCodeAt(i);
                }
                //json padding
                var jsonPaddingView = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix + jsonLength);
                for (var i = 0; i < jsonPadding; ++i) {
                    jsonPaddingView[i] = 0x20;
                }
                //binary chunk
                var binaryChunkBuffer = new ArrayBuffer(chunkLengthPrefix);
                var binaryChunkBufferView = new DataView(binaryChunkBuffer);
                binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength, true);
                binaryChunkBufferView.setUint32(4, 0x004E4942, true);
                // binary padding
                var binPaddingBuffer = new ArrayBuffer(binPadding);
                var binPaddingView = new Uint8Array(binPaddingBuffer);
                for (var i = 0; i < binPadding; ++i) {
                    binPaddingView[i] = 0;
                }
                // binary data
                var glbFile = new Blob([headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer, binPaddingBuffer], { type: 'application/octet-stream' });
                return _a = {},
                    _a[glbFileName] = glbFile,
                    _a;
                var _a;
            }
            /**
             * Creates a glTF scene based on the array of meshes.
             * Returns the the total byte offset.
             * @param gltf
             * @param totalByteOffset
             * @param buffer
             * @param dataBuffer
             */
            function createScene(gltf, totalByteOffset, dataBuffer) {
                var scene = { nodes: new Array() };
                for (var i = 0; i < meshes.length; ++i) {
                    // create node to hold translation/rotation/scale and the mesh
                    var node = { mesh: -1 };
                    var babylonMesh = meshes[i];
                    var useRightHandedSystem = babylonMesh.getScene().useRightHandedSystem;
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
                    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
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
                    var positionVertexBuffer = void 0;
                    var positions = void 0;
                    var positionVertexBufferOffset = void 0;
                    var positionStrideSize = void 0;
                    var normalVertexBuffer = void 0;
                    var normals = void 0;
                    var normalStrideSize = void 0;
                    var tangentVertexBuffer = void 0;
                    var tangents = void 0;
                    var tangentStrideSize = void 0;
                    var colorVertexBuffer = void 0;
                    var colors = void 0;
                    var colorStrideSize = void 0;
                    var texCoord0VertexBuffer = void 0;
                    var texCoords0 = void 0;
                    var texCoord0StrideSize = void 0;
                    var texCoord1VertexBuffer = void 0;
                    var texCoords1 = void 0;
                    var texCoord1StrideSize = void 0;
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                        positionVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.PositionKind);
                        positions = positionVertexBuffer.getData();
                        positionVertexBufferOffset = positionVertexBuffer.getOffset();
                        positionStrideSize = positionVertexBuffer.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                        normalVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);
                        normals = normalVertexBuffer.getData();
                        normalStrideSize = normalVertexBuffer.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                        tangentVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.TangentKind);
                        tangents = tangentVertexBuffer.getData();
                        tangentStrideSize = tangentVertexBuffer.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                        colorVertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.ColorKind);
                        colors = colorVertexBuffer.getData();
                        colorStrideSize = colorVertexBuffer.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        texCoord0VertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.UVKind);
                        texCoords0 = texCoord0VertexBuffer.getData();
                        texCoord0StrideSize = texCoord0VertexBuffer.getStrideSize();
                    }
                    if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        texCoord1VertexBuffer = babylonMesh.getVertexBuffer(BABYLON.VertexBuffer.UV2Kind);
                        texCoords1 = texCoord1VertexBuffer.getData();
                        texCoord1StrideSize = texCoord1VertexBuffer.getStrideSize();
                    }
                    // create mesh
                    var mesh = { primitives: new Array() };
                    mesh.primitives = [];
                    if (babylonMesh.name) {
                        mesh.name = babylonMesh.name;
                    }
                    // go through all mesh primitives (submeshes)
                    for (var j = 0; j < babylonMesh.subMeshes.length; ++j) {
                        var submesh = babylonMesh.subMeshes[j];
                        var meshPrimitive = { attributes: {} };
                        // Loop through each attribute of the submesh (mesh primitive)
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(BABYLON.VertexBuffer.PositionKind, submesh, positions, positionStrideSize, totalByteOffset, dataBuffer, useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                var byteLength = submesh.verticesCount * 12;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var result = calculateMinMax(positions, submesh.verticesStart, submesh.verticesCount, positionVertexBufferOffset, positionStrideSize);
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Position", "VEC3", 5126, submesh.verticesCount, result.min, result.max);
                                gltf.accessors.push(accessor);
                                meshPrimitive.attributes.POSITION = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(BABYLON.VertexBuffer.NormalKind, submesh, normals, normalStrideSize, totalByteOffset, dataBuffer, useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                var byteLength = submesh.verticesCount * 12;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Normal", "VEC3", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);
                                meshPrimitive.attributes.NORMAL = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(BABYLON.VertexBuffer.TangentKind, submesh, tangents, tangentStrideSize, totalByteOffset, dataBuffer, useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                var byteLength = submesh.verticesCount * 16;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Tangent", "VEC4", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);
                                meshPrimitive.attributes.TANGENT = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(BABYLON.VertexBuffer.ColorKind, submesh, colors, colorStrideSize, totalByteOffset, dataBuffer, useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                var byteLength = submesh.verticesCount * 16;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Color", "VEC4", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);
                                meshPrimitive.attributes.COLOR_0 = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(BABYLON.VertexBuffer.UVKind, submesh, texCoords0, texCoord0StrideSize, totalByteOffset, dataBuffer, useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                var byteLength = submesh.verticesCount * 8;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);
                                meshPrimitive.attributes.TEXCOORD_0 = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                            if (dataBuffer) {
                                totalByteOffset += writeAttributeData(BABYLON.VertexBuffer.UV2Kind, submesh, texCoords1, texCoord1StrideSize, totalByteOffset, dataBuffer, useRightHandedSystem);
                            }
                            else {
                                // Create bufferview
                                var byteLength = submesh.verticesCount * 8;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                                gltf.accessors.push(accessor);
                                meshPrimitive.attributes.TEXCOORD_1 = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.getTotalIndices() > 0) {
                            if (dataBuffer) {
                                var indices = babylonMesh.getIndices();
                                var start = submesh.indexStart;
                                var end = submesh.indexCount + start;
                                var byteOff = totalByteOffset;
                                for (var k = start; k < end; k = k + 3) {
                                    dataBuffer.setUint32(byteOff, indices[k], true);
                                    byteOff += 4;
                                    dataBuffer.setUint32(byteOff, indices[k + 1], true);
                                    byteOff += 4;
                                    dataBuffer.setUint32(byteOff, indices[k + 2], true);
                                    byteOff += 4;
                                }
                                var byteLength = submesh.indexCount * 4;
                                totalByteOffset += byteLength;
                            }
                            else {
                                // Create bufferview
                                var indicesCount = submesh.indexCount;
                                var byteLength = indicesCount * 4;
                                var bufferview = createBufferView(0, totalByteOffset, byteLength);
                                totalByteOffset += byteLength;
                                gltf.bufferViews.push(bufferview);
                                // Create accessor
                                var accessor = createAccessor(gltf.bufferViews.length - 1, "Indices", "SCALAR", 5125, indicesCount);
                                gltf.accessors.push(accessor);
                                meshPrimitive.indices = gltf.accessors.length - 1;
                            }
                        }
                        if (babylonMesh.material) {
                            if (!gltf.materials) {
                                gltf.materials = new Array();
                            }
                            meshPrimitive.material = gltf.materials.length - 1;
                        }
                        mesh.primitives.push(meshPrimitive);
                    }
                    gltf.meshes.push(mesh);
                    node.mesh = gltf.meshes.length - 1;
                    gltf.nodes.push(node);
                    scene.nodes.push(gltf.nodes.length - 1);
                }
                gltf.scenes.push(scene);
                return totalByteOffset;
            }
            var glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            var gltf = {
                buffers: new Array(),
                bufferViews: new Array(),
                asset: { generator: "BabylonJS", version: "2.0" },
                meshes: new Array(),
                scenes: new Array(),
                nodes: new Array(),
                accessors: new Array()
            };
            var totalByteOffset = 0;
            var binaryBuffer;
            var dataBuffer;
            // Create scene.  First pass calculates the totalByteOffset.
            totalByteOffset = createScene(gltf, totalByteOffset, null);
            var buff = { byteLength: totalByteOffset };
            if (!glb) {
                buff.uri = glTFPrefix + '.bin';
            }
            gltf.buffers.push(buff);
            var text = JSON.stringify(gltf, null, 2);
            binaryBuffer = new ArrayBuffer(totalByteOffset);
            dataBuffer = new DataView(binaryBuffer);
            totalByteOffset = 0;
            // Create scene.  Second pass generates the binary data
            createScene(gltf, totalByteOffset, dataBuffer);
            if (glb) {
                var glbFile = createGLB(text, binaryBuffer, glTFPrefix);
                return glbFile;
            }
            var glTFFileName = glTFPrefix + '.gltf';
            var glTFBinFile = glTFPrefix + '.bin';
            var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
            return _a = {},
                _a[glTFFileName] = text,
                _a[glTFBinFile] = bin,
                _a;
            var _a;
        };
        return GLTFExport;
    }());
    BABYLON.GLTFExport = GLTFExport;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFSerializer.js.map
