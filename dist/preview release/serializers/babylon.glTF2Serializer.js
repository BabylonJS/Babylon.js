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

/// <reference path="../../../../dist/babylon.glTFInterface.d.ts"/>
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
                this.imageData = {};
                if (options !== undefined) {
                    this.options = options;
                }
                var totalByteLength = 0;
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
            _Exporter.prototype.createBufferView = function (bufferIndex, byteOffset, byteLength, name) {
                var bufferview = { buffer: bufferIndex, byteLength: byteLength };
                if (byteOffset > 0) {
                    bufferview.byteOffset = byteOffset;
                }
                if (name) {
                    bufferview.name = name;
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
             * @returns - accessor for glTF
             */
            _Exporter.prototype.createAccessor = function (bufferviewIndex, name, type, componentType, count, min, max) {
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
             * @returns - min number array and max number array
             */
            _Exporter.prototype.calculateMinMax = function (buff, vertexStart, vertexCount, arrayOffset, stride) {
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
             * @returns - byte length
             */
            _Exporter.prototype.writeAttributeData = function (vertexBufferType, submesh, meshAttributeArray, strideSize, byteOffset, dataBuffer, useRightHandedSystem) {
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
             * @returns - json data as string
             */
            _Exporter.prototype.generateJSON = function (glb, glTFPrefix, prettyPrint) {
                var buffer = { byteLength: this.totalByteLength };
                var glTF = {
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
                        var imageLength = this.images.length;
                        var byteOffset = this.totalByteLength;
                        for (var i = 0; i < imageLength; ++i) {
                            var image = this.images[i];
                            if (image.uri !== undefined) {
                                var imageData = this.imageData[image.uri];
                                var imageName = image.uri.split('.')[0] + " image";
                                var bufferView = this.createBufferView(0, byteOffset, imageData.data.length, imageName);
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
                var jsonText = prettyPrint ? JSON.stringify(glTF, null, 2) : JSON.stringify(glTF);
                return jsonText;
            };
            /**
             * Generates data for .gltf and .bin files based on the glTF prefix string
             * @param glTFPrefix
             * @returns - object with glTF json tex filename
             * and binary file name as keys and their data as values
             */
            _Exporter.prototype._generateGLTF = function (glTFPrefix) {
                var jsonText = this.generateJSON(false, glTFPrefix, true);
                var binaryBuffer = this.generateBinary();
                var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
                var glTFFileName = glTFPrefix + '.gltf';
                var glTFBinFile = glTFPrefix + '.bin';
                var container = new BABYLON._GLTFData();
                container.glTFFiles[glTFFileName] = jsonText;
                container.glTFFiles[glTFBinFile] = bin;
                if (this.imageData !== null) {
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
                var binaryBuffer = new ArrayBuffer(this.totalByteLength);
                var dataBuffer = new DataView(binaryBuffer);
                byteOffset = this.createScene(this.babylonScene, byteOffset, dataBuffer);
                return binaryBuffer;
            };
            /**
             * Pads the number to a power of 4
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
             * @param jsonText
             * @param binaryBuffer
             * @param glTFPrefix
             * @returns - object with glb filename as key and data as value
             */
            _Exporter.prototype._generateGLB = function (glTFPrefix) {
                var jsonText = this.generateJSON(true);
                var binaryBuffer = this.generateBinary();
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
                var byteLength = headerLength + (2 * chunkLengthPrefix) + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength;
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
                binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + imageByteLength, true);
                binaryChunkBufferView.setUint32(4, 0x004E4942, true);
                // binary padding
                var binPaddingBuffer = new ArrayBuffer(binPadding);
                var binPaddingView = new Uint8Array(binPaddingBuffer);
                for (var i = 0; i < binPadding; ++i) {
                    binPaddingView[i] = 0;
                }
                var glbData = [headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer];
                // binary data
                for (var key in this.imageData) {
                    glbData.push(this.imageData[key].data.buffer);
                }
                glbData.push(binPaddingBuffer);
                var glbFile = new Blob(glbData, { type: 'application/octet-stream' });
                var container = new BABYLON._GLTFData();
                container.glTFFiles[glbFileName] = glbFile;
                return container;
            };
            /**
             * Sets the TRS for each node
             * @param node
             * @param babylonMesh
             * @param useRightHandedSystem
             */
            _Exporter.prototype.setNodeTransformation = function (node, babylonMesh, useRightHandedSystem) {
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
             *
             * @param babylonTexture
             * @return - glTF texture, or null if the texture format is not supported
             */
            _Exporter.prototype.exportTexture = function (babylonTexture, mimeType) {
                if (mimeType === void 0) { mimeType = "image/jpeg" /* JPEG */; }
                var textureInfo = null;
                var glTFTexture;
                glTFTexture = {
                    source: this.images.length
                };
                var textureName = babylonTexture.getInternalTexture().url;
                if (textureName.search('/') !== -1) {
                    var splitFilename = textureName.split('/');
                    textureName = splitFilename[splitFilename.length - 1];
                    var basefile = textureName.split('.')[0];
                    var extension = textureName.split('.')[1];
                    if (mimeType === "image/jpeg" /* JPEG */) {
                        extension = ".jpg";
                    }
                    else if (mimeType === "image/png" /* PNG */) {
                        extension = ".png";
                    }
                    else {
                        throw new Error("Unsupported mime type " + mimeType);
                    }
                    textureName = basefile + extension;
                }
                var pixels = babylonTexture.readPixels();
                var imageCanvas = document.createElement('canvas');
                imageCanvas.id = "ImageCanvas";
                var ctx = imageCanvas.getContext('2d');
                var size = babylonTexture.getSize();
                imageCanvas.width = size.width;
                imageCanvas.height = size.height;
                var imgData = ctx.createImageData(size.width, size.height);
                imgData.data.set(pixels);
                ctx.putImageData(imgData, 0, 0);
                var base64Data = imageCanvas.toDataURL(mimeType);
                var binStr = atob(base64Data.split(',')[1]);
                var arr = new Uint8Array(binStr.length);
                for (var i = 0; i < binStr.length; ++i) {
                    arr[i] = binStr.charCodeAt(i);
                }
                var imageValues = { data: arr, mimeType: mimeType };
                this.imageData[textureName] = imageValues;
                if (mimeType === "image/jpeg" /* JPEG */) {
                    var glTFImage = {
                        uri: textureName
                    };
                    var foundIndex = -1;
                    for (var i = 0; i < this.images.length; ++i) {
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
             * Sets data for the primitive attributes of each submesh
             * @param mesh
             * @param babylonMesh
             * @param byteOffset
             * @param useRightHandedSystem
             * @param dataBuffer
             * @returns - bytelength of the primitive attributes plus the passed in byteOffset
             */
            _Exporter.prototype.setPrimitiveAttributes = function (mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer) {
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Positions");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var result = this.calculateMinMax(positions, submesh.verticesStart, submesh.verticesCount, positionVertexBufferOffset, positionStrideSize);
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Position", "VEC3" /* VEC3 */, 5126 /* FLOAT */, submesh.verticesCount, result.min, result.max);
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Normals");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Normal", "VEC3" /* VEC3 */, 5126 /* FLOAT */, submesh.verticesCount);
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Tangents");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Tangent", "VEC4" /* VEC4 */, 5126 /* FLOAT */, submesh.verticesCount);
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Colors");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Color", "VEC4" /* VEC4 */, 5126 /* FLOAT */, submesh.verticesCount);
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Texture Coords0");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2" /* VEC2 */, 5126 /* FLOAT */, submesh.verticesCount);
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Texture Coords 1");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Texture Coords", "VEC2" /* VEC2 */, 5126 /* FLOAT */, submesh.verticesCount);
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
                            var bufferview = this.createBufferView(0, byteOffset, byteLength, "Indices");
                            byteOffset += byteLength;
                            this.bufferViews.push(bufferview);
                            // Create accessor
                            var accessor = this.createAccessor(this.bufferViews.length - 1, "Indices", "SCALAR" /* SCALAR */, 5125 /* UNSIGNED_INT */, indicesCount);
                            this.accessors.push(accessor);
                            meshPrimitive.indices = this.accessors.length - 1;
                        }
                    }
                    if (bufferMesh.material) {
                        if (bufferMesh.material instanceof BABYLON.StandardMaterial) {
                            var babylonStandardMaterial = bufferMesh.material;
                            var glTFMaterial = { name: babylonStandardMaterial.name };
                            if (!babylonStandardMaterial.backFaceCulling) {
                                glTFMaterial.doubleSided = true;
                            }
                            if (babylonStandardMaterial.bumpTexture) {
                                var glTFTexture = this.exportTexture(babylonStandardMaterial.bumpTexture);
                                if (glTFTexture) {
                                    glTFMaterial.normalTexture = glTFTexture;
                                }
                            }
                            if (babylonStandardMaterial.emissiveTexture) {
                                var glTFEmissiveTexture = this.exportTexture(babylonStandardMaterial.emissiveTexture);
                                if (glTFEmissiveTexture) {
                                    glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                                }
                                glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                            }
                            if (babylonStandardMaterial.ambientTexture) {
                                var glTFOcclusionTexture = this.exportTexture(babylonStandardMaterial.ambientTexture);
                                if (glTFOcclusionTexture) {
                                    glTFMaterial.occlusionTexture = glTFOcclusionTexture;
                                }
                            }
                            // Spec Gloss
                            var glTFPbrMetallicRoughness = GLTF2._GLTFMaterial.ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
                            glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                            // TODO: Handle Textures
                            this.materials.push(glTFMaterial);
                            meshPrimitive.material = this.materials.length - 1;
                        }
                        else if (bufferMesh.material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                            if (!this.textures) {
                                this.textures = new Array();
                            }
                            var babylonPBRMaterial = bufferMesh.material;
                            var glTFPbrMetallicRoughness = {};
                            if (babylonPBRMaterial.baseColor) {
                                glTFPbrMetallicRoughness.baseColorFactor = [
                                    babylonPBRMaterial.baseColor.r,
                                    babylonPBRMaterial.baseColor.g,
                                    babylonPBRMaterial.baseColor.b,
                                    babylonPBRMaterial.alpha
                                ];
                            }
                            if (babylonPBRMaterial.baseTexture !== undefined) {
                                var glTFTexture = this.exportTexture(babylonPBRMaterial.baseTexture);
                                if (glTFTexture !== null) {
                                    glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                                }
                                glTFPbrMetallicRoughness.baseColorTexture;
                            }
                            if (babylonPBRMaterial.metallic !== undefined) {
                                glTFPbrMetallicRoughness.metallicFactor = babylonPBRMaterial.metallic;
                            }
                            if (babylonPBRMaterial.roughness !== undefined) {
                                glTFPbrMetallicRoughness.roughnessFactor = babylonPBRMaterial.roughness;
                            }
                            var glTFMaterial = {
                                name: babylonPBRMaterial.name
                            };
                            if (babylonPBRMaterial.doubleSided) {
                                glTFMaterial.doubleSided = babylonPBRMaterial.doubleSided;
                            }
                            if (babylonPBRMaterial.normalTexture) {
                                var glTFTexture = this.exportTexture(babylonPBRMaterial.normalTexture);
                                if (glTFTexture) {
                                    glTFMaterial.normalTexture = glTFTexture;
                                }
                            }
                            if (babylonPBRMaterial.occlusionTexture) {
                                var glTFTexture = this.exportTexture(babylonPBRMaterial.occlusionTexture);
                                if (glTFTexture) {
                                    glTFMaterial.occlusionTexture = glTFTexture;
                                    if (babylonPBRMaterial.occlusionStrength !== undefined) {
                                        glTFMaterial.occlusionTexture.strength = babylonPBRMaterial.occlusionStrength;
                                    }
                                }
                            }
                            if (babylonPBRMaterial.emissiveTexture) {
                                var glTFTexture = this.exportTexture(babylonPBRMaterial.emissiveTexture);
                                if (glTFTexture !== null) {
                                    glTFMaterial.emissiveTexture = glTFTexture;
                                }
                            }
                            if (!babylonPBRMaterial.emissiveColor.equals(new BABYLON.Color3(0.0, 0.0, 0.0))) {
                                glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
                            }
                            if (babylonPBRMaterial.transparencyMode) {
                                var alphaMode = GLTF2._GLTFMaterial.GetAlphaMode(babylonPBRMaterial);
                                if (alphaMode !== "OPAQUE" /* OPAQUE */) {
                                    glTFMaterial.alphaMode = alphaMode;
                                    if (alphaMode === "BLEND" /* BLEND */) {
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
            };
            /**
             * Creates a glTF scene based on the array of meshes.
             * Returns the the total byte offset.
             * @param gltf
             * @param byteOffset
             * @param buffer
             * @param dataBuffer
             * @returns bytelength + byteoffset
             */
            _Exporter.prototype.createScene = function (babylonScene, byteOffset, dataBuffer) {
                if (babylonScene.meshes.length > 0) {
                    var babylonMeshes = babylonScene.meshes;
                    var scene = { nodes: new Array() };
                    for (var i = 0; i < babylonMeshes.length; ++i) {
                        if (this.options &&
                            this.options.shouldExportMesh !== undefined &&
                            !this.options.shouldExportMesh(babylonMeshes[i])) {
                            continue;
                        }
                        else {
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
                    }
                    this.scenes.push(scene);
                }
                return byteOffset;
            };
            return _Exporter;
        }());
        GLTF2._Exporter = _Exporter;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFExporter.js.map

/// <reference path="../../../../dist/babylon.glTFInterface.d.ts"/>
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

/// <reference path="../../../../dist/babylon.glTFInterface.d.ts"/>
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
             * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
             * @param babylonStandardMaterial
             * @returns - glTF Metallic Roughness Material representation
             */
            _GLTFMaterial.ConvertToGLTFPBRMetallicRoughness = function (babylonStandardMaterial) {
                var babylonSpecularGlossiness = {
                    diffuse: babylonStandardMaterial.diffuseColor,
                    opacity: babylonStandardMaterial.alpha,
                    specular: babylonStandardMaterial.specularColor || BABYLON.Color3.Black(),
                    glossiness: babylonStandardMaterial.specularPower / 256
                };
                if (babylonStandardMaterial.specularTexture) {
                }
                var babylonMetallicRoughness = _GLTFMaterial._ConvertToMetallicRoughness(babylonSpecularGlossiness);
                var glTFPbrMetallicRoughness = {
                    baseColorFactor: [
                        babylonMetallicRoughness.baseColor.r,
                        babylonMetallicRoughness.baseColor.g,
                        babylonMetallicRoughness.baseColor.b,
                        babylonMetallicRoughness.opacity
                    ],
                    metallicFactor: babylonMetallicRoughness.metallic,
                    roughnessFactor: babylonMetallicRoughness.roughness
                };
                return glTFPbrMetallicRoughness;
            };
            /**
             * Converts Specular Glossiness to Metallic Roughness.  This is based on the algorithm used in the Babylon glTF 3ds Max Exporter.
             * {@link https://github.com/BabylonJS/Exporters/blob/master/3ds%20Max/Max2Babylon/Exporter/BabylonExporter.GLTFExporter.Material.cs}
             * @param  babylonSpecularGlossiness - Babylon specular glossiness parameters
             * @returns - Babylon metallic roughness values
             */
            _GLTFMaterial._ConvertToMetallicRoughness = function (babylonSpecularGlossiness) {
                var diffuse = babylonSpecularGlossiness.diffuse;
                var opacity = babylonSpecularGlossiness.opacity;
                var specular = babylonSpecularGlossiness.specular;
                var glossiness = babylonSpecularGlossiness.glossiness;
                var oneMinusSpecularStrength = 1 - Math.max(specular.r, Math.max(specular.g, specular.b));
                var diffusePerceivedBrightness = _GLTFMaterial.PerceivedBrightness(diffuse);
                var specularPerceivedBrightness = _GLTFMaterial.PerceivedBrightness(specular);
                var metallic = _GLTFMaterial.SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
                var diffuseScaleFactor = oneMinusSpecularStrength / (1 - this.dielectricSpecular.r) / Math.max(1 - metallic, this.epsilon);
                var baseColorFromDiffuse = diffuse.scale(diffuseScaleFactor);
                var baseColorFromSpecular = specular.subtract(this.dielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, this.epsilon));
                var lerpColor = BABYLON.Color3.Lerp(baseColorFromDiffuse, baseColorFromSpecular, metallic * metallic);
                var baseColor = new BABYLON.Color3();
                lerpColor.clampToRef(0, 1, baseColor);
                var babylonMetallicRoughness = {
                    baseColor: baseColor,
                    opacity: opacity,
                    metallic: metallic,
                    roughness: 1.0 - glossiness
                };
                return babylonMetallicRoughness;
            };
            /**
             * Returns the perceived brightness value based on the provided color
             * @param color - color used in calculating the perceived brightness
             * @returns - perceived brightness value
             */
            _GLTFMaterial.PerceivedBrightness = function (color) {
                return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
            };
            /**
             * Computes the metallic factor
             * @param diffuse - diffused value
             * @param specular - specular value
             * @param oneMinusSpecularStrength - one minus the specular strength
             * @returns - metallic value
             */
            _GLTFMaterial.SolveMetallic = function (diffuse, specular, oneMinusSpecularStrength) {
                if (specular < this.dielectricSpecular.r) {
                    return 0;
                }
                var a = this.dielectricSpecular.r;
                var b = diffuse * oneMinusSpecularStrength / (1.0 - this.dielectricSpecular.r) + specular - 2.0 * this.dielectricSpecular.r;
                var c = this.dielectricSpecular.r - specular;
                var D = b * b - 4.0 * a * c;
                return BABYLON.Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a));
            };
            /**
             * Gets the glTF alpha mode from the Babylon Material
             * @param babylonMaterial - Babylon Material
             * @returns - The Babylon alpha mode value
             */
            _GLTFMaterial.GetAlphaMode = function (babylonMaterial) {
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
                            console.warn("GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                            return "BLEND" /* BLEND */;
                        }
                        default: {
                            throw new Error("Unsupported alpha mode " + babylonPBRMetallicRoughness.transparencyMode);
                        }
                    }
                }
                else {
                    throw new Error("Unsupported Babylon material type");
                }
            };
            /**
             * Represents the dielectric specular values for R, G and B.
             */
            _GLTFMaterial.dielectricSpecular = new BABYLON.Color3(0.04, 0.04, 0.04);
            /**
             * Epsilon value, used as a small tolerance value for a numeric value.
             */
            _GLTFMaterial.epsilon = 1e-6;
            return _GLTFMaterial;
        }());
        GLTF2._GLTFMaterial = _GLTFMaterial;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterial.js.map
