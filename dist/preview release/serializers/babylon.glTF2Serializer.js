/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2Export = /** @class */ (function () {
        function GLTF2Export() {
        }
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * If glb is set to true, exports as .glb.
         * @param meshes
         * @param materials
         *
         * @returns {[fileName: string]: string | Blob} Returns an object with a .gltf, .glb and associates textures
         * as keys and their data and paths as values.
         */
        GLTF2Export.GLTF = function (scene, filename) {
            var glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON._GLTF2Exporter(scene);
            return gltfGenerator._generateGLTF(glTFPrefix);
        };
        /**
         *
         * @param meshes
         * @param filename
         *
         * @returns {[fileName: string]: string | Blob} Returns an object with a .glb filename as key and data as value
         */
        GLTF2Export.GLB = function (scene, filename) {
            var glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON._GLTF2Exporter(scene);
            return gltfGenerator._generateGLB(glTFPrefix);
        };
        /**
         * Downloads data from glTF object.
         *
         * @param gltfData glTF object with keys being file names and values being data
         */
        GLTF2Export.downloadFiles = function (gltfData) {
            /**
             * Checks for a matching suffix at the end of a string (for ES5 and lower)
             * @param str
             * @param suffix
             *
             * @returns {boolean} indicating whether the suffix matches or not
             */
            function endsWith(str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            }
            for (var key in gltfData) {
                var link = document.createElement('a');
                document.body.appendChild(link);
                link.setAttribute("type", "hidden");
                link.download = key;
                var blob = gltfData[key];
                var mimeType = void 0;
                if (endsWith(key, ".glb")) {
                    mimeType = { type: "model/gltf-binary" };
                }
                else if (endsWith(key, ".bin")) {
                    mimeType = { type: "application/octet-stream" };
                }
                else if (endsWith(key, ".gltf")) {
                    mimeType = { type: "model/gltf+json" };
                }
                link.href = window.URL.createObjectURL(new Blob([blob], mimeType));
                link.click();
            }
        };
        return GLTF2Export;
    }());
    BABYLON.GLTF2Export = GLTF2Export;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFSerializer.js.map

var BABYLON;
(function (BABYLON) {
    var _GLTF2Exporter = /** @class */ (function () {
        function _GLTF2Exporter(babylonScene) {
            this.asset = { generator: "BabylonJS", version: "2.0" };
            this.babylonScene = babylonScene;
            this.bufferViews = new Array();
            this.accessors = new Array();
            this.meshes = new Array();
            this.scenes = new Array();
            this.nodes = new Array();
            var totalByteLength = 0;
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
        _GLTF2Exporter.prototype.createBufferView = function (bufferIndex, byteOffset, byteLength) {
            var bufferview = { buffer: bufferIndex, byteLength: byteLength };
            if (byteOffset > 0) {
                bufferview.byteOffset = byteOffset;
            }
            return bufferview;
        };
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
        _GLTF2Exporter.prototype.createAccessor = function (bufferviewIndex, name, type, componentType, count, min, max) {
            var accessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };
            if (min) {
                accessor.min = min;
            }
            if (max) {
                accessor.max = max;
            }
            return accessor;
        };
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
        _GLTF2Exporter.prototype.calculateMinMax = function (buff, vertexStart, vertexCount, arrayOffset, stride) {
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
        };
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
        _GLTF2Exporter.prototype.writeAttributeData = function (vertexBufferType, submesh, meshAttributeArray, strideSize, byteOffset, dataBuffer, useRightHandedSystem) {
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
        };
        /**
         * Generates glTF json data
         * @param glb
         * @param glTFPrefix
         * @param prettyPrint
         *
         * @returns {string} json data as string
         */
        _GLTF2Exporter.prototype.generateJSON = function (glb, glTFPrefix, prettyPrint) {
            var buffer = { byteLength: this.totalByteLength };
            var glTf = {
                buffers: [buffer],
                asset: this.asset,
                meshes: this.meshes,
                scenes: this.scenes,
                nodes: this.nodes,
                bufferViews: this.bufferViews,
                accessors: this.accessors
            };
            if (this.scenes.length > 0) {
                glTf.scene = 0;
            }
            if (!glb) {
                buffer.uri = glTFPrefix + ".bin";
            }
            var jsonText = prettyPrint ? JSON.stringify(glTf, null, 2) : JSON.stringify(glTf);
            return jsonText;
        };
        /**
         * Generates data for .gltf and .bin files based on the glTF prefix string
         * @param glTFPrefix
         *
         * @returns {[x: string]: string | Blob} object with glTF json tex filename
         * and binary file name as keys and their data as values
         */
        _GLTF2Exporter.prototype._generateGLTF = function (glTFPrefix) {
            var jsonText = this.generateJSON(false, glTFPrefix, true);
            var binaryBuffer = this.generateBinary();
            var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
            var glTFFileName = glTFPrefix + '.gltf';
            var glTFBinFile = glTFPrefix + '.bin';
            return _a = {},
                _a[glTFFileName] = jsonText,
                _a[glTFBinFile] = bin,
                _a;
            var _a;
        };
        /**
         * Creates a binary buffer for glTF
         *
         * @returns {ArrayBuffer}
         */
        _GLTF2Exporter.prototype.generateBinary = function () {
            var byteOffset = 0;
            var binaryBuffer = new ArrayBuffer(this.totalByteLength);
            var dataBuffer = new DataView(binaryBuffer);
            byteOffset = this.createScene(this.babylonScene, byteOffset, dataBuffer);
            return binaryBuffer;
        };
        /**
         * Generates a glb file from the json and binary data.
         * Returns an object with the glb file name as the key and data as the value.
         * @param jsonText
         * @param binaryBuffer
         * @param glTFPrefix
         *
         * @returns {[glbFileName: string]: Blob} object with glb filename as key and data as value
         */
        _GLTF2Exporter.prototype._generateGLB = function (glTFPrefix) {
            var jsonText = this.generateJSON(true);
            var binaryBuffer = this.generateBinary();
            var glbFileName = glTFPrefix + '.glb';
            var headerLength = 12;
            var chunkLengthPrefix = 8;
            var jsonLength = jsonText.length;
            var jsonRemainder = jsonLength % 4;
            var binRemainder = binaryBuffer.byteLength % 4;
            var jsonPadding = jsonRemainder === 0 ? jsonRemainder : 4 - jsonRemainder;
            var binPadding = binRemainder === 0 ? binRemainder : 4 - binRemainder;
            var byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding;
            //header
            var headerBuffer = new ArrayBuffer(headerLength);
            var headerBufferView = new DataView(headerBuffer);
            headerBufferView.setUint32(0, 0x46546C67, true); //glTF
            headerBufferView.setUint32(4, 2, true); // version
            headerBufferView.setUint32(8, byteLength, true); // total bytes in file
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
        };
        /**
         * Sets the TRS for each node
         * @param node
         * @param babylonMesh
         * @param useRightHandedSystem
         */
        _GLTF2Exporter.prototype.setNodeTransformation = function (node, babylonMesh, useRightHandedSystem) {
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
        };
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
        _GLTF2Exporter.prototype.setPrimitiveAttributes = function (mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer) {
            // go through all mesh primitives (submeshes)
            for (var j = 0; j < babylonMesh.subMeshes.length; ++j) {
                var bufferMesh = null;
                var submesh = babylonMesh.subMeshes[j];
                var meshPrimitive = { attributes: {} };
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                // Loop through each attribute of the submesh (mesh primitive)
                if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                    var positionVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.PositionKind);
                    var positionVertexBufferOffset = positionVertexBuffer.getOffset();
                    var positions = positionVertexBuffer.getData();
                    var positionStrideSize = positionVertexBuffer.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(BABYLON.VertexBuffer.PositionKind, submesh, positions, positionStrideSize, byteOffset, dataBuffer, useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        var byteLength = submesh.verticesCount * 12;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var result = this.calculateMinMax(positions, submesh.verticesStart, submesh.verticesCount, positionVertexBufferOffset, positionStrideSize);
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Position", "VEC3", 5126, submesh.verticesCount, result.min, result.max);
                        this.accessors.push(accessor);
                        meshPrimitive.attributes.POSITION = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                    var normalVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);
                    var normals = normalVertexBuffer.getData();
                    var normalStrideSize = normalVertexBuffer.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(BABYLON.VertexBuffer.NormalKind, submesh, normals, normalStrideSize, byteOffset, dataBuffer, useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        var byteLength = submesh.verticesCount * 12;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Normal", "VEC3", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);
                        meshPrimitive.attributes.NORMAL = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                    var tangentVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.TangentKind);
                    var tangents = tangentVertexBuffer.getData();
                    var tangentStrideSize = tangentVertexBuffer.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(BABYLON.VertexBuffer.TangentKind, submesh, tangents, tangentStrideSize, byteOffset, dataBuffer, useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        var byteLength = submesh.verticesCount * 16;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Tangent", "VEC4", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);
                        meshPrimitive.attributes.TANGENT = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                    var colorVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.ColorKind);
                    var colors = colorVertexBuffer.getData();
                    var colorStrideSize = colorVertexBuffer.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(BABYLON.VertexBuffer.ColorKind, submesh, colors, colorStrideSize, byteOffset, dataBuffer, useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        var byteLength = submesh.verticesCount * 16;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Color", "VEC4", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);
                        meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    var texCoord0VertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.UVKind);
                    var texCoords0 = texCoord0VertexBuffer.getData();
                    var texCoord0StrideSize = texCoord0VertexBuffer.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(BABYLON.VertexBuffer.UVKind, submesh, texCoords0, texCoord0StrideSize, byteOffset, dataBuffer, useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        var byteLength = submesh.verticesCount * 8;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);
                        meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                    var texCoord1VertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.UV2Kind);
                    var texCoords1 = texCoord1VertexBuffer.getData();
                    var texCoord1StrideSize = texCoord1VertexBuffer.getStrideSize();
                    if (dataBuffer) {
                        byteOffset += this.writeAttributeData(BABYLON.VertexBuffer.UV2Kind, submesh, texCoords1, texCoord1StrideSize, byteOffset, dataBuffer, useRightHandedSystem);
                    }
                    else {
                        // Create bufferview
                        var byteLength = submesh.verticesCount * 8;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2", 5126, submesh.verticesCount);
                        this.accessors.push(accessor);
                        meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.getTotalIndices() > 0) {
                    if (dataBuffer) {
                        var indices = bufferMesh.getIndices();
                        var start = submesh.indexStart;
                        var end = submesh.indexCount + start;
                        var byteOff = byteOffset;
                        for (var k = start; k < end; k = k + 3) {
                            dataBuffer.setUint32(byteOff, indices[k], true);
                            byteOff += 4;
                            dataBuffer.setUint32(byteOff, indices[k + 1], true);
                            byteOff += 4;
                            dataBuffer.setUint32(byteOff, indices[k + 2], true);
                            byteOff += 4;
                        }
                        var byteLength = submesh.indexCount * 4;
                        byteOffset += byteLength;
                    }
                    else {
                        // Create bufferview
                        var indicesCount = submesh.indexCount;
                        var byteLength = indicesCount * 4;
                        var bufferview = this.createBufferView(0, byteOffset, byteLength);
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Indices", "SCALAR", 5125, indicesCount);
                        this.accessors.push(accessor);
                        meshPrimitive.indices = this.accessors.length - 1;
                    }
                }
                if (bufferMesh.material) {
                    //TODO: Implement Material
                }
                mesh.primitives.push(meshPrimitive);
            }
            return byteOffset;
        };
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
        _GLTF2Exporter.prototype.createScene = function (babylonScene, byteOffset, dataBuffer) {
            if (babylonScene.meshes.length > 0) {
                var babylonMeshes = babylonScene.meshes;
                var scene = { nodes: new Array() };
                for (var i = 0; i < babylonMeshes.length; ++i) {
                    // create node to hold translation/rotation/scale and the mesh
                    var node = { mesh: -1 };
                    var babylonMesh = babylonMeshes[i];
                    var useRightHandedSystem = babylonMesh.getScene().useRightHandedSystem;
                    // Set transformation
                    this.setNodeTransformation(node, babylonMesh, useRightHandedSystem);
                    // create mesh
                    var mesh = { primitives: new Array() };
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
        };
        return _GLTF2Exporter;
    }());
    BABYLON._GLTF2Exporter = _GLTF2Exporter;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFExporter.js.map
