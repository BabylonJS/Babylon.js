/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    ;
    /**
     * Class for generating glTF data from a Babylon scene.
     */
    var GLTF2Export = /** @class */ (function () {
        function GLTF2Export() {
        }
        /**
         * Exports the geometry of the scene to .gltf file format.
         * @param scene - Babylon scene with scene hierarchy information.
         * @param filePrefix - File prefix to use when generating the glTF file.
         * @param options - Exporter options.
         * @returns - Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values.
         */
        GLTF2Export.GLTF = function (scene, filePrefix, options) {
            var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON.GLTF2._Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLTF(glTFPrefix);
            }
            else {
                throw new Error("glTF Serializer: Scene is not ready!");
            }
        };
        /**
         * Exports the geometry of the scene to .glb file format.
         * @param scene - Babylon scene with scene hierarchy information.
         * @param filePrefix - File prefix to use when generating glb file.
         * @param options - Exporter options.
         * @returns - Returns an object with a .glb filename as key and data as value
         */
        GLTF2Export.GLB = function (scene, filePrefix, options) {
            var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON.GLTF2._Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLB(glTFPrefix);
            }
            else {
                throw new Error("glTF Serializer: Scene is not ready!");
            }
        };
        return GLTF2Export;
    }());
    BABYLON.GLTF2Export = GLTF2Export;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFSerializer.js.map

/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>
/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally.
 * @ignore - capitalization of GLTF2 module.
 */
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Converts Babylon Scene into glTF 2.0.
         */
        var _Exporter = /** @class */ (function () {
            /**
             * Creates a glTF Exporter instance, which can accept optional exporter options.
             * @param babylonScene - Babylon scene object
             * @param options - Options to modify the behavior of the exporter.
             */
            function _Exporter(babylonScene, options) {
                this.asset = { generator: "BabylonJS", version: "2.0" };
                this.babylonScene = babylonScene;
                this.bufferViews = new Array();
                this.accessors = new Array();
                this.meshes = new Array();
                this.scenes = new Array();
                this.nodes = new Array();
                this.images = new Array();
                this.materials = new Array();
                this.textures = new Array();
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
            _Exporter.prototype.createBufferView = function (bufferIndex, byteOffset, byteLength, byteStride, name) {
                var bufferview = { buffer: bufferIndex, byteLength: byteLength };
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
            };
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
            _Exporter.prototype.createAccessor = function (bufferviewIndex, name, type, componentType, count, byteOffset, min, max) {
                var accessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };
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
            };
            /**
             * Calculates the minimum and maximum values of an array of position floats.
             * @param positions - Positions array of a mesh.
             * @param vertexStart - Starting vertex offset to calculate min and max values.
             * @param vertexCount - Number of vertices to check for min and max values.
             * @returns - min number array and max number array.
             */
            _Exporter.prototype.calculateMinMaxPositions = function (positions, vertexStart, vertexCount) {
                var min = [Infinity, Infinity, Infinity];
                var max = [-Infinity, -Infinity, -Infinity];
                var positionStrideSize = 3;
                var end = vertexStart + vertexCount;
                if (vertexCount) {
                    for (var i = vertexStart; i < end; ++i) {
                        var indexOffset = positionStrideSize * i;
                        var position = BABYLON.Vector3.FromArray(positions, indexOffset);
                        var vector = this.convertToRightHandedSystem ? _Exporter.GetRightHandedVector3(position).asArray() : position.asArray();
                        for (var j = 0; j < positionStrideSize; ++j) {
                            var num = vector[j];
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
                return { min: min, max: max };
            };
            /**
             * Converts a vector3 array to right-handed.
             * @param vector - vector3 Array to convert to right-handed.
             * @returns - right-handed Vector3 array.
             */
            _Exporter.GetRightHandedVector3 = function (vector) {
                return new BABYLON.Vector3(vector.x, vector.y, -vector.z);
            };
            /**
             * Converts a vector4 array to right-handed.
             * @param vector - vector4 Array to convert to right-handed.
             * @returns - right-handed vector4 array.
             */
            _Exporter.GetRightHandedVector4 = function (vector) {
                return new BABYLON.Vector4(vector.x, vector.y, -vector.z, -vector.w);
            };
            /**
             * Converts a quaternion to right-handed.
             * @param quaternion - Source quaternion to convert to right-handed.
             */
            _Exporter.GetRightHandedQuaternion = function (quaternion) {
                return new BABYLON.Quaternion(-quaternion.x, -quaternion.y, quaternion.z, quaternion.w);
            };
            /**
             * Writes mesh attribute data to a data buffer.
             * Returns the bytelength of the data.
             * @param vertexBufferKind - Indicates what kind of vertex data is being passed in.
             * @param meshAttributeArray - Array containing the attribute data.
             * @param byteOffset - The offset to start counting bytes from.
             * @param dataBuffer - The buffer to write the binary data to.
             * @returns - Byte length of the attribute data.
             */
            _Exporter.prototype.writeAttributeData = function (vertexBufferKind, meshAttributeArray, byteOffset, dataBuffer) {
                var byteOff = byteOffset;
                var stride = BABYLON.VertexBuffer.DeduceStride(vertexBufferKind);
                var end = meshAttributeArray.length / stride;
                var byteLength = 0;
                for (var k = 0; k < end; ++k) {
                    var index = k * stride;
                    var vector = [];
                    if (vertexBufferKind === BABYLON.VertexBuffer.PositionKind || vertexBufferKind === BABYLON.VertexBuffer.NormalKind) {
                        var vertexData = BABYLON.Vector3.FromArray(meshAttributeArray, index);
                        vector = this.convertToRightHandedSystem ? _Exporter.GetRightHandedVector3(vertexData).asArray() : vertexData.asArray();
                    }
                    else if (vertexBufferKind === BABYLON.VertexBuffer.TangentKind || vertexBufferKind === BABYLON.VertexBuffer.ColorKind) {
                        var vertexData = BABYLON.Vector4.FromArray(meshAttributeArray, index);
                        vector = (this.convertToRightHandedSystem && !(vertexBufferKind === BABYLON.VertexBuffer.ColorKind)) ? _Exporter.GetRightHandedVector4(vertexData).asArray() : vertexData.asArray();
                    }
                    else if (vertexBufferKind === BABYLON.VertexBuffer.UVKind || vertexBufferKind === BABYLON.VertexBuffer.UV2Kind) {
                        vector = [meshAttributeArray[index], meshAttributeArray[index + 1]];
                    }
                    else {
                        BABYLON.Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                    }
                    for (var i = 0; i < vector.length; ++i) {
                        dataBuffer.setFloat32(byteOff, vector[i], true);
                        byteOff += 4;
                    }
                }
                byteLength = meshAttributeArray.length * 4;
                return byteLength;
            };
            /**
             * Generates glTF json data
             * @param shouldUseGlb - Indicates whether the json should be written for a glb file.
             * @param glTFPrefix - Text to use when prefixing a glTF file.
             * @param prettyPrint - Indicates whether the json file should be pretty printed (true) or not (false).
             * @returns - json data as string
             */
            _Exporter.prototype.generateJSON = function (shouldUseGlb, glTFPrefix, prettyPrint) {
                var buffer = { byteLength: this.totalByteLength };
                var glTF = {
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
                        var imageLength = this.images.length;
                        var byteOffset = this.totalByteLength;
                        for (var i = 0; i < imageLength; ++i) {
                            var image = this.images[i];
                            if (image.uri) {
                                var imageData = this.imageData[image.uri];
                                var imageName = image.uri.split('.')[0] + " image";
                                var bufferView = this.createBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
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
                var jsonText = prettyPrint ? JSON.stringify(glTF, null, 2) : JSON.stringify(glTF);
                return jsonText;
            };
            /**
             * Generates data for .gltf and .bin files based on the glTF prefix string
             * @param glTFPrefix - Text to use when prefixing a glTF file.
             * @returns - GLTFData with glTF file data.
             */
            _Exporter.prototype._generateGLTF = function (glTFPrefix) {
                var binaryBuffer = this.generateBinary();
                var jsonText = this.generateJSON(false, glTFPrefix, true);
                var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
                var glTFFileName = glTFPrefix + '.gltf';
                var glTFBinFile = glTFPrefix + '.bin';
                var container = new BABYLON._GLTFData();
                container.glTFFiles[glTFFileName] = jsonText;
                container.glTFFiles[glTFBinFile] = bin;
                if (this.imageData) {
                    for (var image in this.imageData) {
                        container.glTFFiles[image] = new Blob([this.imageData[image].data], { type: this.imageData[image].mimeType });
                    }
                }
                return container;
            };
            /**
             * Creates a binary buffer for glTF
             * @returns - array buffer for binary data
             */
            _Exporter.prototype.generateBinary = function () {
                var byteOffset = 0;
                byteOffset = this.createScene(this.babylonScene, byteOffset);
                return this.binaryBuffer;
            };
            /**
             * Pads the number to a multiple of 4
             * @param num - number to pad
             * @returns - padded number
             */
            _Exporter.prototype._getPadding = function (num) {
                var remainder = num % 4;
                var padding = remainder === 0 ? remainder : 4 - remainder;
                return padding;
            };
            /**
             * Generates a glb file from the json and binary data.
             * Returns an object with the glb file name as the key and data as the value.
             * @param glTFPrefix
             * @returns - object with glb filename as key and data as value
             */
            _Exporter.prototype._generateGLB = function (glTFPrefix) {
                var binaryBuffer = this.generateBinary();
                var jsonText = this.generateJSON(true);
                var glbFileName = glTFPrefix + '.glb';
                var headerLength = 12;
                var chunkLengthPrefix = 8;
                var jsonLength = jsonText.length;
                var imageByteLength = 0;
                for (var key in this.imageData) {
                    imageByteLength += this.imageData[key].data.byteLength;
                }
                var jsonPadding = this._getPadding(jsonLength);
                var binPadding = this._getPadding(binaryBuffer.byteLength);
                var imagePadding = this._getPadding(imageByteLength);
                var byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength + imagePadding;
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
                binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + imageByteLength + imagePadding, true);
                binaryChunkBufferView.setUint32(4, 0x004E4942, true);
                // binary padding
                var binPaddingBuffer = new ArrayBuffer(binPadding);
                var binPaddingView = new Uint8Array(binPaddingBuffer);
                for (var i = 0; i < binPadding; ++i) {
                    binPaddingView[i] = 0;
                }
                var imagePaddingBuffer = new ArrayBuffer(imagePadding);
                var imagePaddingView = new Uint8Array(imagePaddingBuffer);
                for (var i = 0; i < imagePadding; ++i) {
                    imagePaddingView[i] = 0;
                }
                var glbData = [headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer];
                // binary data
                for (var key in this.imageData) {
                    glbData.push(this.imageData[key].data.buffer);
                }
                glbData.push(binPaddingBuffer);
                glbData.push(imagePaddingBuffer);
                var glbFile = new Blob(glbData, { type: 'application/octet-stream' });
                var container = new BABYLON._GLTFData();
                container.glTFFiles[glbFileName] = glbFile;
                return container;
            };
            /**
             * Sets the TRS for each node
             * @param node - glTF Node for storing the transformation data.
             * @param babylonMesh - Babylon mesh used as the source for the transformation data.
             */
            _Exporter.prototype.setNodeTransformation = function (node, babylonMesh) {
                if (!babylonMesh.position.equalsToFloats(0, 0, 0)) {
                    node.translation = this.convertToRightHandedSystem ? _Exporter.GetRightHandedVector3(babylonMesh.position).asArray() : babylonMesh.position.asArray();
                }
                if (!babylonMesh.scaling.equalsToFloats(1, 1, 1)) {
                    node.scale = babylonMesh.scaling.asArray();
                }
                var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
                if (babylonMesh.rotationQuaternion) {
                    rotationQuaternion = rotationQuaternion.multiply(babylonMesh.rotationQuaternion);
                }
                if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                    node.rotation = this.convertToRightHandedSystem ? _Exporter.GetRightHandedQuaternion(rotationQuaternion).asArray() : rotationQuaternion.asArray();
                }
            };
            /**
             * Creates a bufferview based on the vertices type for the Babylon mesh
             * @param kind - Indicates the type of vertices data.
             * @param babylonMesh - The Babylon mesh to get the vertices data from.
             * @param byteOffset - The offset from the buffer to start indexing from.
             * @param dataBuffer - The buffer to write the bufferview data to.
             * @returns bytelength of the bufferview data.
             */
            _Exporter.prototype.createBufferViewKind = function (kind, babylonMesh, byteOffset, dataBuffer) {
                var bufferMesh = null;
                var byteLength = 0;
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                if (bufferMesh) {
                    var vertexData = bufferMesh.getVerticesData(kind);
                    if (vertexData) {
                        if (dataBuffer && vertexData) { // write data to buffer
                            byteLength = this.writeAttributeData(kind, vertexData, byteOffset, dataBuffer);
                            byteOffset += byteLength;
                        }
                        else {
                            byteLength = vertexData.length * 4;
                            var bufferView = this.createBufferView(0, byteOffset, byteLength, undefined, kind + " - " + bufferMesh.name);
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferView);
                        }
                    }
                }
                return byteLength;
            };
            /**
             * Sets data for the primitive attributes of each submesh
             * @param mesh - glTF Mesh object to store the primitive attribute information.
             * @param babylonMesh - Babylon mesh to get the primitive attribute data from.
             * @param byteOffset - The offset in bytes of the buffer data.
             * @param dataBuffer - Buffer to write the attribute data to.
             * @returns - bytelength of the primitive attributes plus the passed in byteOffset.
             */
            _Exporter.prototype.setPrimitiveAttributes = function (mesh, babylonMesh, byteOffset, dataBuffer) {
                var bufferMesh = null;
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                var attributeData = [
                    { kind: BABYLON.VertexBuffer.PositionKind, accessorType: "VEC3" /* VEC3 */ },
                    { kind: BABYLON.VertexBuffer.NormalKind, accessorType: "VEC3" /* VEC3 */ },
                    { kind: BABYLON.VertexBuffer.ColorKind, accessorType: "VEC4" /* VEC4 */ },
                    { kind: BABYLON.VertexBuffer.TangentKind, accessorType: "VEC4" /* VEC4 */ },
                    { kind: BABYLON.VertexBuffer.UVKind, accessorType: "VEC2" /* VEC2 */ },
                    { kind: BABYLON.VertexBuffer.UV2Kind, accessorType: "VEC2" /* VEC2 */ },
                ];
                var indexBufferViewIndex = null;
                if (bufferMesh) {
                    // For each BabylonMesh, create bufferviews for each 'kind'
                    for (var _i = 0, attributeData_1 = attributeData; _i < attributeData_1.length; _i++) {
                        var attribute = attributeData_1[_i];
                        var attributeKind = attribute.kind;
                        if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                            byteOffset += this.createBufferViewKind(attributeKind, babylonMesh, byteOffset, dataBuffer);
                            attribute.bufferViewIndex = this.bufferViews.length - 1;
                        }
                    }
                    if (bufferMesh.getTotalIndices()) {
                        var indices = bufferMesh.getIndices();
                        if (indices) {
                            if (dataBuffer) {
                                var end = indices.length;
                                var byteOff = byteOffset;
                                for (var k = 0; k < end; ++k) {
                                    dataBuffer.setUint32(byteOff, indices[k], true);
                                    byteOff += 4;
                                }
                                byteOffset = byteOff;
                            }
                            else {
                                var byteLength = indices.length * 4;
                                var bufferView = this.createBufferView(0, byteOffset, byteLength, undefined, "Indices - " + bufferMesh.name);
                                byteOffset += byteLength;
                                this.bufferViews.push(bufferView);
                                indexBufferViewIndex = this.bufferViews.length - 1;
                            }
                        }
                    }
                    if (babylonMesh.subMeshes) {
                        var uvCoordsPresent = false;
                        // go through all mesh primitives (submeshes)
                        for (var _a = 0, _b = babylonMesh.subMeshes; _a < _b.length; _a++) {
                            var submesh = _b[_a];
                            var meshPrimitive = { attributes: {} };
                            // Create a bufferview storing all the positions
                            if (!dataBuffer) {
                                for (var _c = 0, attributeData_2 = attributeData; _c < attributeData_2.length; _c++) {
                                    var attribute = attributeData_2[_c];
                                    var attributeKind = attribute.kind;
                                    var vertexData = bufferMesh.getVerticesData(attributeKind);
                                    if (vertexData) {
                                        var stride = BABYLON.VertexBuffer.DeduceStride(attributeKind);
                                        var minMax = void 0;
                                        var min = null;
                                        var max = null;
                                        var bufferViewIndex = attribute.bufferViewIndex;
                                        if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                            if (attributeKind == BABYLON.VertexBuffer.PositionKind) {
                                                minMax = this.calculateMinMaxPositions(vertexData, 0, vertexData.length / stride);
                                                min = minMax.min;
                                                max = minMax.max;
                                            }
                                            var accessor = this.createAccessor(bufferViewIndex, attributeKind + " - " + babylonMesh.name, attribute.accessorType, 5126 /* FLOAT */, vertexData.length / stride, 0, min, max);
                                            this.accessors.push(accessor);
                                            switch (attributeKind) {
                                                case BABYLON.VertexBuffer.PositionKind: {
                                                    meshPrimitive.attributes.POSITION = this.accessors.length - 1;
                                                    break;
                                                }
                                                case BABYLON.VertexBuffer.NormalKind: {
                                                    meshPrimitive.attributes.NORMAL = this.accessors.length - 1;
                                                    break;
                                                }
                                                case BABYLON.VertexBuffer.ColorKind: {
                                                    meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;
                                                    break;
                                                }
                                                case BABYLON.VertexBuffer.TangentKind: {
                                                    meshPrimitive.attributes.TANGENT = this.accessors.length - 1;
                                                    break;
                                                }
                                                case BABYLON.VertexBuffer.UVKind: {
                                                    meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;
                                                    uvCoordsPresent = true;
                                                    break;
                                                }
                                                case BABYLON.VertexBuffer.UV2Kind: {
                                                    meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
                                                    uvCoordsPresent = true;
                                                    break;
                                                }
                                                default: {
                                                    BABYLON.Tools.Warn("Unsupported Vertex Buffer Type: " + attributeKind);
                                                }
                                            }
                                        }
                                    }
                                }
                                if (indexBufferViewIndex) {
                                    // Create accessor
                                    var accessor = this.createAccessor(indexBufferViewIndex, "indices - " + babylonMesh.name, "SCALAR" /* SCALAR */, 5125 /* UNSIGNED_INT */, submesh.indexCount, submesh.indexStart * 4, null, null);
                                    this.accessors.push(accessor);
                                    meshPrimitive.indices = this.accessors.length - 1;
                                }
                            }
                            if (bufferMesh.material) {
                                var materialIndex = null;
                                if (bufferMesh.material instanceof BABYLON.StandardMaterial || bufferMesh.material instanceof BABYLON.PBRMetallicRoughnessMaterial || bufferMesh.material instanceof BABYLON.PBRMaterial) {
                                    materialIndex = babylonMesh.getScene().materials.indexOf(bufferMesh.material);
                                }
                                else if (bufferMesh.material instanceof BABYLON.MultiMaterial) {
                                    var babylonMultiMaterial = bufferMesh.material;
                                    var material = babylonMultiMaterial.subMaterials[submesh.materialIndex];
                                    if (material) {
                                        materialIndex = babylonMesh.getScene().materials.indexOf(material);
                                    }
                                }
                                else {
                                    BABYLON.Tools.Warn("Material type " + bufferMesh.material.getClassName() + " for material " + bufferMesh.material.name + " is not yet implemented in glTF serializer.");
                                }
                                if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                                    if (uvCoordsPresent || !GLTF2._GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                        meshPrimitive.material = materialIndex;
                                    }
                                    else {
                                        // If no texture coordinate information is present, make a copy of the material without the textures to be glTF compliant.
                                        var newMat = GLTF2._GLTFMaterial._StripTexturesFromMaterial(this.materials[materialIndex]);
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
            };
            /**
             * Creates a glTF scene based on the array of meshes.
             * Returns the the total byte offset.
             * @param babylonScene - Babylon scene to get the mesh data from.
             * @param byteOffset - Offset to start from in bytes.
             * @returns bytelength + byteoffset
             */
            _Exporter.prototype.createScene = function (babylonScene, byteOffset) {
                if (babylonScene.meshes.length) {
                    var babylonMeshes = babylonScene.meshes;
                    var scene = { nodes: new Array() };
                    GLTF2._GLTFMaterial._ConvertMaterialsToGLTF(babylonScene.materials, "image/png" /* PNG */, this.images, this.textures, this.materials, this.imageData, true);
                    var result = this.createNodeMap(babylonScene, byteOffset);
                    this.nodeMap = result.nodeMap;
                    this.totalByteLength = result.byteOffset;
                    this.binaryBuffer = new ArrayBuffer(this.totalByteLength);
                    var dataBuffer = new DataView(this.binaryBuffer);
                    for (var i = 0; i < babylonMeshes.length; ++i) {
                        var babylonMesh = babylonMeshes[i];
                        // Build Hierarchy with the node map.
                        var glTFNodeIndex = this.nodeMap[babylonMesh.uniqueId];
                        var glTFNode = this.nodes[glTFNodeIndex];
                        if (!babylonMesh.parent) {
                            if (this.options &&
                                this.options.shouldExportMesh != undefined &&
                                !this.options.shouldExportMesh(babylonMesh)) {
                                BABYLON.Tools.Log("Omitting " + babylonMesh.name + " from scene.");
                            }
                            else {
                                scene.nodes.push(glTFNodeIndex);
                            }
                        }
                        var directDescendents = babylonMesh.getDescendants(true);
                        if (!glTFNode.children && directDescendents && directDescendents.length) {
                            glTFNode.children = [];
                            for (var _i = 0, directDescendents_1 = directDescendents; _i < directDescendents_1.length; _i++) {
                                var descendent = directDescendents_1[_i];
                                glTFNode.children.push(this.nodeMap[descendent.uniqueId]);
                            }
                        }
                        var mesh = { primitives: new Array() };
                        byteOffset = this.setPrimitiveAttributes(mesh, babylonMesh, byteOffset, dataBuffer);
                    }
                    this.scenes.push(scene);
                }
                return byteOffset;
            };
            /**
             * Creates a mapping of Node unique id to node index
             * @param scene - Babylon Scene.
             * @param byteOffset - The initial byte offset.
             * @returns - Node mapping of unique id to index.
             */
            _Exporter.prototype.createNodeMap = function (scene, byteOffset) {
                var nodeMap = {};
                for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                    var babylonMesh = _a[_i];
                    var result = this.createNode(babylonMesh, byteOffset, null);
                    this.nodes.push(result.node);
                    nodeMap[babylonMesh.uniqueId] = this.nodes.length - 1;
                    byteOffset = result.byteOffset;
                }
                return { nodeMap: nodeMap, byteOffset: byteOffset };
            };
            /**
             * Creates a glTF node from a Babylon mesh.
             * @param babylonMesh - Source Babylon mesh.
             * @param byteOffset - The initial byte offset.
             * @param dataBuffer - Buffer for storing geometry data.
             * @returns - Object containing an INode and byteoffset.
             */
            _Exporter.prototype.createNode = function (babylonMesh, byteOffset, dataBuffer) {
                // create node to hold translation/rotation/scale and the mesh
                var node = {};
                if (babylonMesh.name) {
                    node.name = babylonMesh.name;
                }
                // Set transformation
                this.setNodeTransformation(node, babylonMesh);
                // create mesh
                var mesh = { primitives: new Array() };
                mesh.primitives = [];
                byteOffset = this.setPrimitiveAttributes(mesh, babylonMesh, byteOffset, dataBuffer);
                if (mesh.primitives.length) {
                    this.meshes.push(mesh);
                    node.mesh = this.meshes.length - 1;
                }
                return { node: node, byteOffset: byteOffset };
            };
            return _Exporter;
        }());
        GLTF2._Exporter = _Exporter;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFExporter.js.map

/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>
var BABYLON;
(function (BABYLON) {
    /**
     * Class for holding and downloading glTF file data
     */
    var _GLTFData = /** @class */ (function () {
        /**
         * Initializes the glTF file object.
         */
        function _GLTFData() {
            this.glTFFiles = {};
        }
        /**
         * Downloads the glTF data as files based on their names and data.
         */
        _GLTFData.prototype.downloadFiles = function () {
            /**
            * Checks for a matching suffix at the end of a string (for ES5 and lower).
            * @param str - Source string.
            * @param suffix - Suffix to search for in the source string.
            * @returns - Boolean indicating whether the suffix was found (true) or not (false).
            */
            function endsWith(str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            }
            for (var key in this.glTFFiles) {
                var link = document.createElement('a');
                document.body.appendChild(link);
                link.setAttribute("type", "hidden");
                link.download = key;
                var blob = this.glTFFiles[key];
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
                else if (endsWith(key, ".jpeg" || ".jpg")) {
                    mimeType = { type: "image/jpeg" /* JPEG */ };
                }
                else if (endsWith(key, ".png")) {
                    mimeType = { type: "image/png" /* PNG */ };
                }
                link.href = window.URL.createObjectURL(new Blob([blob], mimeType));
                link.click();
            }
        };
        return _GLTFData;
    }());
    BABYLON._GLTFData = _GLTFData;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFData.js.map

/// <reference path="../../../../dist/babylon.glTF2Interface.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Utility methods for working with glTF material conversion properties.  This class should only be used internally.
         */
        var _GLTFMaterial = /** @class */ (function () {
            function _GLTFMaterial() {
            }
            /**
             * Specifies if two colors are approximately equal in value.
             * @param color1 - first color to compare to.
             * @param color2 - second color to compare to.
             * @param epsilon - threshold value
             */
            _GLTFMaterial.FuzzyEquals = function (color1, color2, epsilon) {
                return BABYLON.Scalar.WithinEpsilon(color1.r, color2.r, epsilon) &&
                    BABYLON.Scalar.WithinEpsilon(color1.g, color2.g, epsilon) &&
                    BABYLON.Scalar.WithinEpsilon(color1.b, color2.b, epsilon);
            };
            /**
             * Gets the materials from a Babylon scene and converts them to glTF materials.
             * @param scene - babylonjs scene.
             * @param mimeType - texture mime type.
             * @param images - array of images.
             * @param textures - array of textures.
             * @param materials - array of materials.
             * @param imageData - mapping of texture names to base64 textures
             * @param hasTextureCoords - specifies if texture coordinates are present on the material.
             */
            _GLTFMaterial._ConvertMaterialsToGLTF = function (babylonMaterials, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                for (var i = 0; i < babylonMaterials.length; ++i) {
                    var babylonMaterial = babylonMaterials[i];
                    if (babylonMaterial instanceof BABYLON.StandardMaterial) {
                        _GLTFMaterial._ConvertStandardMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                    }
                    else if (babylonMaterial instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                        _GLTFMaterial._ConvertPBRMetallicRoughnessMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                    }
                    else if (babylonMaterial instanceof BABYLON.PBRMaterial) {
                        _GLTFMaterial._ConvertPBRMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                    }
                    else {
                        throw new Error("Unsupported material type: " + babylonMaterial.name);
                    }
                }
            };
            /**
             * Makes a copy of the glTF material without the texture parameters.
             * @param originalMaterial - original glTF material.
             * @returns glTF material without texture parameters
             */
            _GLTFMaterial._StripTexturesFromMaterial = function (originalMaterial) {
                var newMaterial = {};
                if (originalMaterial) {
                    newMaterial.name = originalMaterial.name;
                    newMaterial.doubleSided = originalMaterial.doubleSided;
                    newMaterial.alphaMode = originalMaterial.alphaMode;
                    newMaterial.alphaCutoff = originalMaterial.alphaCutoff;
                    newMaterial.emissiveFactor = originalMaterial.emissiveFactor;
                    var originalPBRMetallicRoughness = originalMaterial.pbrMetallicRoughness;
                    if (originalPBRMetallicRoughness) {
                        newMaterial.pbrMetallicRoughness = {};
                        newMaterial.pbrMetallicRoughness.baseColorFactor = originalPBRMetallicRoughness.baseColorFactor;
                        newMaterial.pbrMetallicRoughness.metallicFactor = originalPBRMetallicRoughness.metallicFactor;
                        newMaterial.pbrMetallicRoughness.roughnessFactor = originalPBRMetallicRoughness.roughnessFactor;
                    }
                }
                return newMaterial;
            };
            /**
             * Specifies if the material has any texture parameters present.
             * @param material - glTF Material.
             * @returns boolean specifying if texture parameters are present
             */
            _GLTFMaterial._HasTexturesPresent = function (material) {
                if (material.emissiveTexture || material.normalTexture || material.occlusionTexture) {
                    return true;
                }
                var pbrMat = material.pbrMetallicRoughness;
                if (pbrMat) {
                    if (pbrMat.baseColorTexture || pbrMat.metallicRoughnessTexture) {
                        return true;
                    }
                }
                return false;
            };
            /**
             * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
             * @param babylonStandardMaterial
             * @returns - glTF Metallic Roughness Material representation
             */
            _GLTFMaterial._ConvertToGLTFPBRMetallicRoughness = function (babylonStandardMaterial) {
                var P0 = new BABYLON.Vector2(0, 1);
                var P1 = new BABYLON.Vector2(0, 0.1);
                var P2 = new BABYLON.Vector2(0, 0.1);
                var P3 = new BABYLON.Vector2(1300, 0.1);
                /**
                 * Given the control points, solve for x based on a given t for a cubic bezier curve.
                 * @param t - a value between 0 and 1.
                 * @param p0 - first control point.
                 * @param p1 - second control point.
                 * @param p2 - third control point.
                 * @param p3 - fourth control point.
                 * @returns - number result of cubic bezier curve at the specified t.
                 */
                function _cubicBezierCurve(t, p0, p1, p2, p3) {
                    return ((1 - t) * (1 - t) * (1 - t) * p0 +
                        3 * (1 - t) * (1 - t) * t * p1 +
                        3 * (1 - t) * t * t * p2 +
                        t * t * t * p3);
                }
                /**
                 * Evaluates a specified specular power value to determine the appropriate roughness value,
                 * based on a pre-defined cubic bezier curve with specular on the abscissa axis (x-axis)
                 * and roughness on the ordinant axis (y-axis).
                 * @param specularPower - specular power of standard material.
                 * @returns - Number representing the roughness value.
                 */
                function _solveForRoughness(specularPower) {
                    var t = Math.pow(specularPower / P3.x, 0.333333);
                    return _cubicBezierCurve(t, P0.y, P1.y, P2.y, P3.y);
                }
                var diffuse = babylonStandardMaterial.diffuseColor.toLinearSpace().scale(0.5);
                var opacity = babylonStandardMaterial.alpha;
                var specularPower = BABYLON.Scalar.Clamp(babylonStandardMaterial.specularPower, 0, this._maxSpecularPower);
                var roughness = _solveForRoughness(specularPower);
                var glTFPbrMetallicRoughness = {
                    baseColorFactor: [
                        diffuse.r,
                        diffuse.g,
                        diffuse.b,
                        opacity
                    ],
                    metallicFactor: 0,
                    roughnessFactor: roughness,
                };
                return glTFPbrMetallicRoughness;
            };
            /**
             * Computes the metallic factor
             * @param diffuse - diffused value
             * @param specular - specular value
             * @param oneMinusSpecularStrength - one minus the specular strength
             * @returns - metallic value
             */
            _GLTFMaterial._SolveMetallic = function (diffuse, specular, oneMinusSpecularStrength) {
                if (specular < _GLTFMaterial._dielectricSpecular.r) {
                    _GLTFMaterial._dielectricSpecular;
                    return 0;
                }
                var a = _GLTFMaterial._dielectricSpecular.r;
                var b = diffuse * oneMinusSpecularStrength / (1.0 - _GLTFMaterial._dielectricSpecular.r) + specular - 2.0 * _GLTFMaterial._dielectricSpecular.r;
                var c = _GLTFMaterial._dielectricSpecular.r - specular;
                var D = b * b - 4.0 * a * c;
                return BABYLON.Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
            };
            /**
             * Gets the glTF alpha mode from the Babylon Material
             * @param babylonMaterial - Babylon Material
             * @returns - The Babylon alpha mode value
             */
            _GLTFMaterial._GetAlphaMode = function (babylonMaterial) {
                if (babylonMaterial instanceof BABYLON.StandardMaterial) {
                    var babylonStandardMaterial = babylonMaterial;
                    if ((babylonStandardMaterial.alpha != 1.0) ||
                        (babylonStandardMaterial.diffuseTexture != null && babylonStandardMaterial.diffuseTexture.hasAlpha) ||
                        (babylonStandardMaterial.opacityTexture != null)) {
                        return "BLEND" /* BLEND */;
                    }
                    else {
                        return "OPAQUE" /* OPAQUE */;
                    }
                }
                else if (babylonMaterial instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                    var babylonPBRMetallicRoughness = babylonMaterial;
                    switch (babylonPBRMetallicRoughness.transparencyMode) {
                        case BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE: {
                            return "OPAQUE" /* OPAQUE */;
                        }
                        case BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND: {
                            return "BLEND" /* BLEND */;
                        }
                        case BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST: {
                            return "MASK" /* MASK */;
                        }
                        case BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND: {
                            BABYLON.Tools.Warn(babylonMaterial.name + ": GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                            return "BLEND" /* BLEND */;
                        }
                        default: {
                            throw new Error("Unsupported alpha mode " + babylonPBRMetallicRoughness.transparencyMode);
                        }
                    }
                }
                else if (babylonMaterial instanceof BABYLON.PBRMaterial) {
                    var babylonPBRMaterial = babylonMaterial;
                    switch (babylonPBRMaterial.transparencyMode) {
                        case BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE: {
                            return "OPAQUE" /* OPAQUE */;
                        }
                        case BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND: {
                            return "BLEND" /* BLEND */;
                        }
                        case BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST: {
                            return "MASK" /* MASK */;
                        }
                        case BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND: {
                            BABYLON.Tools.Warn(babylonMaterial.name + ": GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                            return "BLEND" /* BLEND */;
                        }
                        default: {
                            throw new Error("Unsupported alpha mode " + babylonPBRMaterial.transparencyMode);
                        }
                    }
                }
                else {
                    throw new Error("Unsupported Babylon material type");
                }
            };
            /**
             * Converts a Babylon Standard Material to a glTF Material.
             * @param babylonStandardMaterial - BJS Standard Material.
             * @param mimeType - mime type to use for the textures.
             * @param images - array of glTF image interfaces.
             * @param textures - array of glTF texture interfaces.
             * @param materials - array of glTF material interfaces.
             * @param imageData - map of image file name to data.
             * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
             */
            _GLTFMaterial._ConvertStandardMaterial = function (babylonStandardMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                BABYLON.Tools.Warn(babylonStandardMaterial.name + ": Standard Material is currently not fully supported/implemented in glTF serializer");
                var glTFPbrMetallicRoughness = _GLTFMaterial._ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
                var glTFMaterial = { name: babylonStandardMaterial.name };
                if (babylonStandardMaterial.backFaceCulling != null && !babylonStandardMaterial.backFaceCulling) {
                    if (!babylonStandardMaterial.twoSidedLighting) {
                        BABYLON.Tools.Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                    }
                    glTFMaterial.doubleSided = true;
                }
                if (hasTextureCoords) {
                    if (babylonStandardMaterial.diffuseTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.diffuseTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    }
                    if (babylonStandardMaterial.bumpTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.bumpTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                        }
                    }
                    if (babylonStandardMaterial.emissiveTexture) {
                        var glTFEmissiveTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.emissiveTexture, mimeType, images, textures, imageData);
                        if (glTFEmissiveTexture) {
                            glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                        }
                        glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                    }
                    if (babylonStandardMaterial.ambientTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonStandardMaterial.ambientTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            var occlusionTexture = {
                                index: glTFTexture.index
                            };
                            glTFMaterial.occlusionTexture = occlusionTexture;
                            occlusionTexture.strength = 1.0;
                        }
                    }
                }
                if (babylonStandardMaterial.alpha < 1.0 || babylonStandardMaterial.opacityTexture) {
                    if (babylonStandardMaterial.alphaMode === BABYLON.Engine.ALPHA_COMBINE) {
                        glTFMaterial.alphaMode = "BLEND" /* BLEND */;
                    }
                    else {
                        BABYLON.Tools.Warn(babylonStandardMaterial.name + ": glTF 2.0 does not support alpha mode: " + babylonStandardMaterial.alphaMode.toString());
                    }
                }
                if (babylonStandardMaterial.emissiveColor && !this.FuzzyEquals(babylonStandardMaterial.emissiveColor, BABYLON.Color3.Black(), this._epsilon)) {
                    glTFMaterial.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
                }
                glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                materials.push(glTFMaterial);
            };
            /**
             * Converts a Babylon PBR Metallic Roughness Material to a glTF Material.
             * @param babylonPBRMetalRoughMaterial - BJS PBR Metallic Roughness Material.
             * @param mimeType - mime type to use for the textures.
             * @param images - array of glTF image interfaces.
             * @param textures - array of glTF texture interfaces.
             * @param materials - array of glTF material interfaces.
             * @param imageData - map of image file name to data.
             * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
             */
            _GLTFMaterial._ConvertPBRMetallicRoughnessMaterial = function (babylonPBRMetalRoughMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                var glTFPbrMetallicRoughness = {};
                if (babylonPBRMetalRoughMaterial.baseColor) {
                    glTFPbrMetallicRoughness.baseColorFactor = [
                        babylonPBRMetalRoughMaterial.baseColor.r,
                        babylonPBRMetalRoughMaterial.baseColor.g,
                        babylonPBRMetalRoughMaterial.baseColor.b,
                        babylonPBRMetalRoughMaterial.alpha
                    ];
                }
                if (babylonPBRMetalRoughMaterial.metallic != null && babylonPBRMetalRoughMaterial.metallic !== 1) {
                    glTFPbrMetallicRoughness.metallicFactor = babylonPBRMetalRoughMaterial.metallic;
                }
                if (babylonPBRMetalRoughMaterial.roughness != null && babylonPBRMetalRoughMaterial.roughness !== 1) {
                    glTFPbrMetallicRoughness.roughnessFactor = babylonPBRMetalRoughMaterial.roughness;
                }
                var glTFMaterial = {
                    name: babylonPBRMetalRoughMaterial.name
                };
                if (babylonPBRMetalRoughMaterial.doubleSided) {
                    glTFMaterial.doubleSided = babylonPBRMetalRoughMaterial.doubleSided;
                }
                if (hasTextureCoords) {
                    if (babylonPBRMetalRoughMaterial.baseTexture != null) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.baseTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMetalRoughMaterial.normalTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.normalTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.occlusionTexture = glTFTexture;
                            if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                                glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                            }
                        }
                    }
                    if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    }
                }
                if (this.FuzzyEquals(babylonPBRMetalRoughMaterial.emissiveColor, BABYLON.Color3.Black(), this._epsilon)) {
                    glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
                }
                if (babylonPBRMetalRoughMaterial.transparencyMode != null) {
                    var alphaMode = _GLTFMaterial._GetAlphaMode(babylonPBRMetalRoughMaterial);
                    if (alphaMode !== "OPAQUE" /* OPAQUE */) { //glTF defaults to opaque
                        glTFMaterial.alphaMode = alphaMode;
                        if (alphaMode === "BLEND" /* BLEND */) {
                            glTFMaterial.alphaCutoff = babylonPBRMetalRoughMaterial.alphaCutOff;
                        }
                    }
                }
                glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                materials.push(glTFMaterial);
            };
            /**
             * Converts an image typed array buffer to a base64 image.
             * @param buffer - typed array buffer.
             * @param width - width of the image.
             * @param height - height of the image.
             * @param mimeType - mimetype of the image.
             * @returns - base64 image string.
             */
            _GLTFMaterial._CreateBase64FromCanvas = function (buffer, width, height, mimeType) {
                var imageCanvas = document.createElement('canvas');
                imageCanvas.id = "WriteCanvas";
                var ctx = imageCanvas.getContext('2d');
                imageCanvas.width = width;
                imageCanvas.height = height;
                var imgData = ctx.createImageData(width, height);
                imgData.data.set(buffer);
                ctx.putImageData(imgData, 0, 0);
                return imageCanvas.toDataURL(mimeType);
            };
            /**
             * Generates a white texture based on the specified width and height.
             * @param width - width of the texture in pixels.
             * @param height - height of the texture in pixels.
             * @param scene - babylonjs scene.
             * @returns - white texture.
             */
            _GLTFMaterial._CreateWhiteTexture = function (width, height, scene) {
                var data = new Uint8Array(width * height * 4);
                for (var i = 0; i < data.length; ++i) {
                    data[i] = 255;
                }
                var rawTexture = BABYLON.RawTexture.CreateRGBATexture(data, width, height, scene);
                return rawTexture;
            };
            /**
             * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null.
             * @param texture1 - first texture to resize.
             * @param texture2 - second texture to resize.
             * @param scene - babylonjs scene.
             * @returns resized textures or null.
             */
            _GLTFMaterial._ResizeTexturesToSameDimensions = function (texture1, texture2, scene) {
                var texture1Size = texture1 ? texture1.getSize() : { width: 0, height: 0 };
                var texture2Size = texture2 ? texture2.getSize() : { width: 0, height: 0 };
                var resizedTexture1;
                var resizedTexture2;
                if (texture1Size.width < texture2Size.width) {
                    if (texture1) {
                        resizedTexture1 = BABYLON.TextureTools.CreateResizedCopy(texture1, texture2Size.width, texture2Size.height, true);
                    }
                    else {
                        resizedTexture1 = this._CreateWhiteTexture(texture2Size.width, texture2Size.height, scene);
                    }
                    resizedTexture2 = texture2;
                }
                else if (texture1Size.width > texture2Size.width) {
                    if (texture2) {
                        resizedTexture2 = BABYLON.TextureTools.CreateResizedCopy(texture2, texture1Size.width, texture1Size.height, true);
                    }
                    else {
                        resizedTexture2 = this._CreateWhiteTexture(texture1Size.width, texture1Size.height, scene);
                    }
                    resizedTexture1 = texture1;
                }
                else {
                    resizedTexture1 = texture1;
                    resizedTexture2 = texture2;
                }
                return {
                    "texture1": resizedTexture1,
                    "texture2": resizedTexture2
                };
            };
            /**
             * Convert Specular Glossiness Textures to Metallic Roughness.
             * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
             * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
             * @param diffuseTexture - texture used to store diffuse information.
             * @param specularGlossinessTexture - texture used to store specular and glossiness information.
             * @param factors - specular glossiness material factors.
             * @param mimeType - the mime type to use for the texture.
             * @returns pbr metallic roughness interface or null.
             */
            _GLTFMaterial._ConvertSpecularGlossinessTexturesToMetallicRoughness = function (diffuseTexture, specularGlossinessTexture, factors, mimeType) {
                if (!(diffuseTexture || specularGlossinessTexture)) {
                    return null;
                }
                var scene = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture.getScene();
                if (!scene) {
                    throw new Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
                }
                var resizedTextures = this._ResizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);
                var diffuseSize = resizedTextures.texture1.getSize();
                var diffuseBuffer;
                var specularGlossinessBuffer;
                var width = diffuseSize.width;
                var height = diffuseSize.height;
                var pixels = (resizedTextures.texture1.readPixels());
                if (pixels instanceof Uint8Array) {
                    diffuseBuffer = (resizedTextures.texture1.readPixels());
                }
                else {
                    throw new Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture1.name);
                }
                pixels = resizedTextures.texture2.readPixels();
                if (pixels instanceof Uint8Array) {
                    specularGlossinessBuffer = (resizedTextures.texture2.readPixels());
                }
                else {
                    throw new Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture2.name);
                }
                var byteLength = specularGlossinessBuffer.byteLength;
                var metallicRoughnessBuffer = new Uint8Array(byteLength);
                var baseColorBuffer = new Uint8Array(byteLength);
                var strideSize = 4;
                var maxBaseColor = BABYLON.Color3.Black();
                var maxMetallic = 0;
                var maxRoughness = 0;
                for (var h = 0; h < height; ++h) {
                    for (var w = 0; w < width; ++w) {
                        var offset = (width * h + w) * strideSize;
                        var diffuseColor = BABYLON.Color3.FromInts(diffuseBuffer[offset], diffuseBuffer[offset + 1], diffuseBuffer[offset + 2]).toLinearSpace().multiply(factors.diffuseColor);
                        var specularColor = BABYLON.Color3.FromInts(specularGlossinessBuffer[offset], specularGlossinessBuffer[offset + 1], specularGlossinessBuffer[offset + 2]).toLinearSpace().multiply(factors.specularColor);
                        var glossiness = (specularGlossinessBuffer[offset + 3] / 255) * factors.glossiness;
                        var specularGlossiness = {
                            diffuseColor: diffuseColor,
                            specularColor: specularColor,
                            glossiness: glossiness
                        };
                        var metallicRoughness = this._ConvertSpecularGlossinessToMetallicRoughness(specularGlossiness);
                        maxBaseColor.r = Math.max(maxBaseColor.r, metallicRoughness.baseColor.r);
                        maxBaseColor.g = Math.max(maxBaseColor.g, metallicRoughness.baseColor.g);
                        maxBaseColor.b = Math.max(maxBaseColor.b, metallicRoughness.baseColor.b);
                        maxMetallic = Math.max(maxMetallic, metallicRoughness.metallic);
                        maxRoughness = Math.max(maxRoughness, metallicRoughness.roughness);
                        baseColorBuffer[offset] = metallicRoughness.baseColor.r * 255;
                        baseColorBuffer[offset + 1] = metallicRoughness.baseColor.g * 255;
                        baseColorBuffer[offset + 2] = metallicRoughness.baseColor.b * 255;
                        baseColorBuffer[offset + 3] = resizedTextures.texture1.hasAlpha ? diffuseBuffer[offset + 3] : 255;
                        metallicRoughnessBuffer[offset] = 0;
                        metallicRoughnessBuffer[offset + 1] = metallicRoughness.roughness * 255;
                        metallicRoughnessBuffer[offset + 2] = metallicRoughness.metallic * 255;
                        metallicRoughnessBuffer[offset + 3] = 255;
                    }
                }
                // Retrieves the metallic roughness factors from the maximum texture values.
                var metallicRoughnessFactors = {
                    baseColor: maxBaseColor,
                    metallic: maxMetallic,
                    roughness: maxRoughness
                };
                var writeOutMetallicRoughnessTexture = false;
                var writeOutBaseColorTexture = false;
                for (var h = 0; h < height; ++h) {
                    for (var w = 0; w < width; ++w) {
                        var destinationOffset = (width * h + w) * strideSize;
                        baseColorBuffer[destinationOffset] /= metallicRoughnessFactors.baseColor.r > this._epsilon ? metallicRoughnessFactors.baseColor.r : 1;
                        baseColorBuffer[destinationOffset + 1] /= metallicRoughnessFactors.baseColor.g > this._epsilon ? metallicRoughnessFactors.baseColor.g : 1;
                        baseColorBuffer[destinationOffset + 2] /= metallicRoughnessFactors.baseColor.b > this._epsilon ? metallicRoughnessFactors.baseColor.b : 1;
                        var linearBaseColorPixel = BABYLON.Color3.FromInts(baseColorBuffer[destinationOffset], baseColorBuffer[destinationOffset + 1], baseColorBuffer[destinationOffset + 2]);
                        var sRGBBaseColorPixel = linearBaseColorPixel.toGammaSpace();
                        baseColorBuffer[destinationOffset] = sRGBBaseColorPixel.r * 255;
                        baseColorBuffer[destinationOffset + 1] = sRGBBaseColorPixel.g * 255;
                        baseColorBuffer[destinationOffset + 2] = sRGBBaseColorPixel.b * 255;
                        if (!this.FuzzyEquals(sRGBBaseColorPixel, BABYLON.Color3.White(), this._epsilon)) {
                            writeOutBaseColorTexture = true;
                        }
                        metallicRoughnessBuffer[destinationOffset + 1] /= metallicRoughnessFactors.roughness > this._epsilon ? metallicRoughnessFactors.roughness : 1;
                        metallicRoughnessBuffer[destinationOffset + 2] /= metallicRoughnessFactors.metallic > this._epsilon ? metallicRoughnessFactors.metallic : 1;
                        var metallicRoughnessPixel = BABYLON.Color3.FromInts(255, metallicRoughnessBuffer[destinationOffset + 1], metallicRoughnessBuffer[destinationOffset + 2]);
                        if (!this.FuzzyEquals(metallicRoughnessPixel, BABYLON.Color3.White(), this._epsilon)) {
                            writeOutMetallicRoughnessTexture = true;
                        }
                    }
                }
                if (writeOutMetallicRoughnessTexture) {
                    var metallicRoughnessBase64 = this._CreateBase64FromCanvas(metallicRoughnessBuffer, width, height, mimeType);
                    metallicRoughnessFactors.metallicRoughnessTextureBase64 = metallicRoughnessBase64;
                }
                if (writeOutBaseColorTexture) {
                    var baseColorBase64 = this._CreateBase64FromCanvas(baseColorBuffer, width, height, mimeType);
                    metallicRoughnessFactors.baseColorTextureBase64 = baseColorBase64;
                }
                return metallicRoughnessFactors;
            };
            /**
             * Converts specular glossiness material properties to metallic roughness.
             * @param specularGlossiness - interface with specular glossiness material properties.
             * @returns - interface with metallic roughness material properties.
             */
            _GLTFMaterial._ConvertSpecularGlossinessToMetallicRoughness = function (specularGlossiness) {
                var diffusePerceivedBrightness = _GLTFMaterial._GetPerceivedBrightness(specularGlossiness.diffuseColor);
                var specularPerceivedBrightness = _GLTFMaterial._GetPerceivedBrightness(specularGlossiness.specularColor);
                var oneMinusSpecularStrength = 1 - _GLTFMaterial._GetMaxComponent(specularGlossiness.specularColor);
                var metallic = _GLTFMaterial._SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
                var baseColorFromDiffuse = specularGlossiness.diffuseColor.scale(oneMinusSpecularStrength / (1.0 - this._dielectricSpecular.r) / Math.max(1 - metallic, this._epsilon));
                var baseColorFromSpecular = specularGlossiness.specularColor.subtract(this._dielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, this._epsilon));
                var baseColor = BABYLON.Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
                baseColor = baseColor.clampToRef(0, 1, baseColor);
                var metallicRoughness = {
                    baseColor: baseColor,
                    metallic: metallic,
                    roughness: 1 - specularGlossiness.glossiness
                };
                return metallicRoughness;
            };
            /**
             * Calculates the surface reflectance, independent of lighting conditions.
             * @param color - Color source to calculate brightness from.
             * @returns number representing the perceived brightness, or zero if color is undefined.
             */
            _GLTFMaterial._GetPerceivedBrightness = function (color) {
                if (color) {
                    return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
                }
                return 0;
            };
            /**
             * Returns the maximum color component value.
             * @param color
             * @returns maximum color component value, or zero if color is null or undefined.
             */
            _GLTFMaterial._GetMaxComponent = function (color) {
                if (color) {
                    return Math.max(color.r, Math.max(color.g, color.b));
                }
                return 0;
            };
            /**
             * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors.
             * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
             * @param mimeType - mime type to use for the textures.
             * @param images - array of glTF image interfaces.
             * @param textures - array of glTF texture interfaces.
             * @param glTFPbrMetallicRoughness - glTF PBR Metallic Roughness interface.
             * @param imageData - map of image file name to data.
             * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
             * @returns - glTF PBR Metallic Roughness factors.
             */
            _GLTFMaterial._ConvertMetalRoughFactorsToMetallicRoughness = function (babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords) {
                var metallicRoughness = {
                    baseColor: babylonPBRMaterial.albedoColor,
                    metallic: babylonPBRMaterial.metallic,
                    roughness: babylonPBRMaterial.roughness
                };
                if (hasTextureCoords) {
                    if (babylonPBRMaterial.albedoTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.albedoTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMaterial.metallicTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.metallicTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                        }
                    }
                }
                return metallicRoughness;
            };
            /**
             * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors.
             * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
             * @param mimeType - mime type to use for the textures.
             * @param images - array of glTF image interfaces.
             * @param textures - array of glTF texture interfaces.
             * @param glTFPbrMetallicRoughness - glTF PBR Metallic Roughness interface.
             * @param imageData - map of image file name to data.
             * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
             * @returns - glTF PBR Metallic Roughness factors.
             */
            _GLTFMaterial._ConvertSpecGlossFactorsToMetallicRoughness = function (babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords) {
                var specGloss = {
                    diffuseColor: babylonPBRMaterial.albedoColor || BABYLON.Color3.White(),
                    specularColor: babylonPBRMaterial.reflectivityColor || BABYLON.Color3.White(),
                    glossiness: babylonPBRMaterial.microSurface || 1,
                };
                if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                    throw new Error("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture currently not supported");
                }
                var metallicRoughnessFactors = this._ConvertSpecularGlossinessTexturesToMetallicRoughness(babylonPBRMaterial.albedoTexture, babylonPBRMaterial.reflectivityTexture, specGloss, mimeType);
                if (!metallicRoughnessFactors) {
                    metallicRoughnessFactors = this._ConvertSpecularGlossinessToMetallicRoughness(specGloss);
                }
                else {
                    if (hasTextureCoords) {
                        if (metallicRoughnessFactors.baseColorTextureBase64) {
                            var glTFBaseColorTexture = _GLTFMaterial._GetTextureInfoFromBase64(metallicRoughnessFactors.baseColorTextureBase64, "bjsBaseColorTexture_" + (textures.length) + ".png", mimeType, images, textures, imageData);
                            if (glTFBaseColorTexture != null) {
                                glTFPbrMetallicRoughness.baseColorTexture = glTFBaseColorTexture;
                            }
                        }
                        if (metallicRoughnessFactors.metallicRoughnessTextureBase64) {
                            var glTFMRColorTexture = _GLTFMaterial._GetTextureInfoFromBase64(metallicRoughnessFactors.metallicRoughnessTextureBase64, "bjsMetallicRoughnessTexture_" + (textures.length) + ".png", mimeType, images, textures, imageData);
                            if (glTFMRColorTexture != null) {
                                glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFMRColorTexture;
                            }
                        }
                    }
                }
                return metallicRoughnessFactors;
            };
            /**
             * Converts a Babylon PBR Metallic Roughness Material to a glTF Material.
             * @param babylonPBRMaterial - BJS PBR Metallic Roughness Material.
             * @param mimeType - mime type to use for the textures.
             * @param images - array of glTF image interfaces.
             * @param textures - array of glTF texture interfaces.
             * @param materials - array of glTF material interfaces.
             * @param imageData - map of image file name to data.
             * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
             */
            _GLTFMaterial._ConvertPBRMaterial = function (babylonPBRMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                var glTFPbrMetallicRoughness = {};
                var metallicRoughness;
                var glTFMaterial = {
                    name: babylonPBRMaterial.name
                };
                var useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();
                if (useMetallicRoughness) {
                    metallicRoughness = this._ConvertMetalRoughFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
                }
                else {
                    metallicRoughness = this._ConvertSpecGlossFactorsToMetallicRoughness(babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords);
                }
                if (!(this.FuzzyEquals(metallicRoughness.baseColor, BABYLON.Color3.White(), this._epsilon) && babylonPBRMaterial.alpha >= this._epsilon)) {
                    glTFPbrMetallicRoughness.baseColorFactor = [
                        metallicRoughness.baseColor.r,
                        metallicRoughness.baseColor.g,
                        metallicRoughness.baseColor.b,
                        babylonPBRMaterial.alpha
                    ];
                }
                if (metallicRoughness.metallic != null && metallicRoughness.metallic !== 1) {
                    glTFPbrMetallicRoughness.metallicFactor = metallicRoughness.metallic;
                }
                if (metallicRoughness.roughness != null && metallicRoughness.roughness !== 1) {
                    glTFPbrMetallicRoughness.roughnessFactor = metallicRoughness.roughness;
                }
                if (babylonPBRMaterial.backFaceCulling != null && !babylonPBRMaterial.backFaceCulling) {
                    if (!babylonPBRMaterial.twoSidedLighting) {
                        BABYLON.Tools.Warn(babylonPBRMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                    }
                    glTFMaterial.doubleSided = true;
                }
                if (hasTextureCoords) {
                    if (babylonPBRMaterial.bumpTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.bumpTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMaterial.ambientTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.ambientTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            var occlusionTexture = {
                                index: glTFTexture.index
                            };
                            glTFMaterial.occlusionTexture = occlusionTexture;
                            if (babylonPBRMaterial.ambientTextureStrength) {
                                occlusionTexture.strength = babylonPBRMaterial.ambientTextureStrength;
                            }
                        }
                    }
                    if (babylonPBRMaterial.emissiveTexture) {
                        var glTFTexture = _GLTFMaterial._ExportTexture(babylonPBRMaterial.emissiveTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    }
                }
                if (!this.FuzzyEquals(babylonPBRMaterial.emissiveColor, BABYLON.Color3.Black(), this._epsilon)) {
                    glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
                }
                if (babylonPBRMaterial.transparencyMode != null) {
                    var alphaMode = _GLTFMaterial._GetAlphaMode(babylonPBRMaterial);
                    if (alphaMode !== "OPAQUE" /* OPAQUE */) { //glTF defaults to opaque
                        glTFMaterial.alphaMode = alphaMode;
                        if (alphaMode === "BLEND" /* BLEND */) {
                            glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                        }
                    }
                }
                glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                materials.push(glTFMaterial);
            };
            /**
             * Extracts a texture from a Babylon texture into file data and glTF data.
             * @param babylonTexture - Babylon texture to extract.
             * @param mimeType - Mime Type of the babylonTexture.
             * @param images - Array of glTF images.
             * @param textures - Array of glTF textures.
             * @param imageData - map of image file name and data.
             * @return - glTF texture info, or null if the texture format is not supported.
             */
            _GLTFMaterial._ExportTexture = function (babylonTexture, mimeType, images, textures, imageData) {
                var textureName = "texture_" + (textures.length - 1).toString();
                var textureData = babylonTexture.getInternalTexture();
                if (textureData != null) {
                    textureName = textureData.url || textureName;
                }
                textureName = BABYLON.Tools.GetFilename(textureName);
                var baseFile = textureName.split('.')[0];
                var extension = "";
                if (mimeType === "image/jpeg" /* JPEG */) {
                    extension = ".jpg";
                }
                else if (mimeType === "image/png" /* PNG */) {
                    extension = ".png";
                }
                else {
                    throw new Error("Unsupported mime type " + mimeType);
                }
                textureName = baseFile + extension;
                var pixels = babylonTexture.readPixels();
                var size = babylonTexture.getSize();
                var base64Data = this._CreateBase64FromCanvas(pixels, size.width, size.height, mimeType);
                return this._GetTextureInfoFromBase64(base64Data, textureName, mimeType, images, textures, imageData);
            };
            /**
             * Builds a texture from base64 string.
             * @param base64Texture - base64 texture string.
             * @param textureName - Name to use for the texture.
             * @param mimeType - image mime type for the texture.
             * @param images - array of images.
             * @param textures - array of textures.
             * @param imageData - map of image data.
             * @returns - glTF texture info, or null if the texture format is not supported.
             */
            _GLTFMaterial._GetTextureInfoFromBase64 = function (base64Texture, textureName, mimeType, images, textures, imageData) {
                var textureInfo = null;
                var glTFTexture = {
                    source: images.length
                };
                var binStr = atob(base64Texture.split(',')[1]);
                var arr = new Uint8Array(binStr.length);
                for (var i = 0; i < binStr.length; ++i) {
                    arr[i] = binStr.charCodeAt(i);
                }
                var imageValues = { data: arr, mimeType: mimeType };
                imageData[textureName] = imageValues;
                if (mimeType === "image/jpeg" /* JPEG */ || mimeType === "image/png" /* PNG */) {
                    var glTFImage = {
                        uri: textureName
                    };
                    var foundIndex = -1;
                    for (var i = 0; i < images.length; ++i) {
                        if (images[i].uri === textureName) {
                            foundIndex = i;
                            break;
                        }
                    }
                    if (foundIndex === -1) {
                        images.push(glTFImage);
                        glTFTexture.source = images.length - 1;
                        textures.push({
                            source: images.length - 1
                        });
                        textureInfo = {
                            index: images.length - 1
                        };
                    }
                    else {
                        glTFTexture.source = foundIndex;
                        textureInfo = {
                            index: foundIndex
                        };
                    }
                }
                return textureInfo;
            };
            /**
             * Represents the dielectric specular values for R, G and B.
             */
            _GLTFMaterial._dielectricSpecular = new BABYLON.Color3(0.04, 0.04, 0.04);
            /**
             * Allows the maximum specular power to be defined for material calculations.
             */
            _GLTFMaterial._maxSpecularPower = 1024;
            /**
             * Numeric tolerance value
             */
            _GLTFMaterial._epsilon = 1e-6;
            return _GLTFMaterial;
        }());
        GLTF2._GLTFMaterial = _GLTFMaterial;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterial.js.map
