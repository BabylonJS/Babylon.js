var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
var babylonDependency = (globalObject && globalObject.BABYLON) || BABYLON || (typeof require !== 'undefined' && require("babylonjs"));
var BABYLON = babylonDependency;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __extends = (this && this.__extends) || (function () {
            var extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return function (d, b) {
                extendStatics(d, b);
                function __() { this.constructor = d; }
                d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
            };
        })();
        
var BABYLON;
(function (BABYLON) {
    var OBJExport = /** @class */ (function () {
        function OBJExport() {
        }
        //Exports the geometrys of a Mesh array in .OBJ file format (text)
        OBJExport.OBJ = function (mesh, materials, matlibname, globalposition) {
            var output = [];
            var v = 1;
            if (materials) {
                if (!matlibname) {
                    matlibname = 'mat';
                }
                output.push("mtllib " + matlibname + ".mtl");
            }
            for (var j = 0; j < mesh.length; j++) {
                output.push("g object" + j);
                output.push("o object_" + j);
                //Uses the position of the item in the scene, to the file (this back to normal in the end)
                var lastMatrix = null;
                if (globalposition) {
                    var newMatrix = BABYLON.Matrix.Translation(mesh[j].position.x, mesh[j].position.y, mesh[j].position.z);
                    lastMatrix = BABYLON.Matrix.Translation(-(mesh[j].position.x), -(mesh[j].position.y), -(mesh[j].position.z));
                    mesh[j].bakeTransformIntoVertices(newMatrix);
                }
                //TODO: submeshes (groups)
                //TODO: smoothing groups (s 1, s off);
                if (materials) {
                    var mat = mesh[j].material;
                    if (mat) {
                        output.push("usemtl " + mat.id);
                    }
                }
                var g = mesh[j].geometry;
                if (!g) {
                    continue;
                }
                var trunkVerts = g.getVerticesData('position');
                var trunkNormals = g.getVerticesData('normal');
                var trunkUV = g.getVerticesData('uv');
                var trunkFaces = g.getIndices();
                var curV = 0;
                if (!trunkVerts || !trunkNormals || !trunkUV || !trunkFaces) {
                    continue;
                }
                for (var i = 0; i < trunkVerts.length; i += 3) {
                    output.push("v " + trunkVerts[i] + " " + trunkVerts[i + 1] + " " + trunkVerts[i + 2]);
                    curV++;
                }
                for (i = 0; i < trunkNormals.length; i += 3) {
                    output.push("vn " + trunkNormals[i] + " " + trunkNormals[i + 1] + " " + trunkNormals[i + 2]);
                }
                for (i = 0; i < trunkUV.length; i += 2) {
                    output.push("vt " + trunkUV[i] + " " + trunkUV[i + 1]);
                }
                for (i = 0; i < trunkFaces.length; i += 3) {
                    output.push("f " + (trunkFaces[i + 2] + v) + "/" + (trunkFaces[i + 2] + v) + "/" + (trunkFaces[i + 2] + v) +
                        " " + (trunkFaces[i + 1] + v) + "/" + (trunkFaces[i + 1] + v) + "/" + (trunkFaces[i + 1] + v) +
                        " " + (trunkFaces[i] + v) + "/" + (trunkFaces[i] + v) + "/" + (trunkFaces[i] + v));
                }
                //back de previous matrix, to not change the original mesh in the scene
                if (globalposition && lastMatrix) {
                    mesh[j].bakeTransformIntoVertices(lastMatrix);
                }
                v += curV;
            }
            var text = output.join("\n");
            return (text);
        };
        //Exports the material(s) of a mesh in .MTL file format (text)
        //TODO: Export the materials of mesh array
        OBJExport.MTL = function (mesh) {
            var output = [];
            var m = mesh.material;
            output.push("newmtl mat1");
            output.push("  Ns " + m.specularPower.toFixed(4));
            output.push("  Ni 1.5000");
            output.push("  d " + m.alpha.toFixed(4));
            output.push("  Tr 0.0000");
            output.push("  Tf 1.0000 1.0000 1.0000");
            output.push("  illum 2");
            output.push("  Ka " + m.ambientColor.r.toFixed(4) + " " + m.ambientColor.g.toFixed(4) + " " + m.ambientColor.b.toFixed(4));
            output.push("  Kd " + m.diffuseColor.r.toFixed(4) + " " + m.diffuseColor.g.toFixed(4) + " " + m.diffuseColor.b.toFixed(4));
            output.push("  Ks " + m.specularColor.r.toFixed(4) + " " + m.specularColor.g.toFixed(4) + " " + m.specularColor.b.toFixed(4));
            output.push("  Ke " + m.emissiveColor.r.toFixed(4) + " " + m.emissiveColor.g.toFixed(4) + " " + m.emissiveColor.b.toFixed(4));
            //TODO: uv scale, offset, wrap
            //TODO: UV mirrored in Blender? second UV channel? lightMap? reflection textures?
            var uvscale = "";
            if (m.ambientTexture) {
                output.push("  map_Ka " + uvscale + m.ambientTexture.name);
            }
            if (m.diffuseTexture) {
                output.push("  map_Kd " + uvscale + m.diffuseTexture.name);
                //TODO: alpha testing, opacity in diffuse texture alpha channel (diffuseTexture.hasAlpha -> map_d)
            }
            if (m.specularTexture) {
                output.push("  map_Ks " + uvscale + m.specularTexture.name);
                /* TODO: glossiness = specular highlight component is in alpha channel of specularTexture. (???)
                if (m.useGlossinessFromSpecularMapAlpha)  {
                    output.push("  map_Ns "+uvscale + m.specularTexture.name);
                }
                */
            }
            /* TODO: emissive texture not in .MAT format (???)
            if (m.emissiveTexture) {
                output.push("  map_d "+uvscale+m.emissiveTexture.name);
            }
            */
            if (m.bumpTexture) {
                output.push("  map_bump -imfchan z " + uvscale + m.bumpTexture.name);
            }
            if (m.opacityTexture) {
                output.push("  map_d " + uvscale + m.opacityTexture.name);
            }
            var text = output.join("\n");
            return (text);
        };
        return OBJExport;
    }());
    BABYLON.OBJExport = OBJExport;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.objSerializer.js.map


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
                if (options !== undefined) {
                    this.options = options;
                }
                var totalByteLength = 0;
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
            _Exporter.prototype.createBufferView = function (bufferIndex, byteOffset, byteLength, byteStride, name) {
                var bufferview = { buffer: bufferIndex, byteLength: byteLength };
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
             * Calculates the minimum and maximum values of an array of floats, based on stride
             * @param buff - Data to check for min and max values.
             * @param vertexStart - Start offset to calculate min and max values.
             * @param vertexCount - Number of vertices to check for min and max values.
             * @param stride - Offset between consecutive attributes.
             * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
             * @returns - min number array and max number array.
             */
            _Exporter.prototype.calculateMinMax = function (buff, vertexStart, vertexCount, stride, useRightHandedSystem) {
                var min = [Infinity, Infinity, Infinity];
                var max = [-Infinity, -Infinity, -Infinity];
                var end = vertexStart + vertexCount;
                if (vertexCount > 0) {
                    for (var i = vertexStart; i < end; ++i) {
                        var index = stride * i;
                        var scale = 1;
                        for (var j = 0; j < stride; ++j) {
                            if (j === (stride - 1) && !useRightHandedSystem) {
                                scale = -1;
                            }
                            var num = scale * buff[index];
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
                return { min: min, max: max };
            };
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
            _Exporter.prototype.writeAttributeData = function (vertexBufferKind, meshAttributeArray, strideSize, vertexBufferOffset, byteOffset, dataBuffer, useRightHandedSystem) {
                var byteOff = byteOffset;
                var start = 0;
                var end = meshAttributeArray.length / strideSize;
                var byteLength = 0;
                switch (vertexBufferKind) {
                    case BABYLON.VertexBuffer.PositionKind: {
                        for (var k = start; k < end; ++k) {
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
                        byteLength = meshAttributeArray.length * 4;
                        break;
                    }
                    case BABYLON.VertexBuffer.NormalKind: {
                        for (var k = start; k < end; ++k) {
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
                        byteLength = meshAttributeArray.length * 4;
                        break;
                    }
                    case BABYLON.VertexBuffer.TangentKind: {
                        for (var k = start; k < end; ++k) {
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
                        byteLength = meshAttributeArray.length * 4;
                        break;
                    }
                    case BABYLON.VertexBuffer.ColorKind: {
                        for (var k = start; k < end; ++k) {
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
                        byteLength = meshAttributeArray.length * 4;
                        break;
                    }
                    case BABYLON.VertexBuffer.UVKind: {
                        for (var k = start; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
                            byteOff += 4;
                        }
                        byteLength = meshAttributeArray.length * 4;
                        break;
                    }
                    case BABYLON.VertexBuffer.UV2Kind: {
                        for (var k = start; k < end; ++k) {
                            var index = k * strideSize;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index], true);
                            byteOff += 4;
                            dataBuffer.setFloat32(byteOff, meshAttributeArray[index + 1], true);
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
                        var imageLength = this.images.length;
                        var byteOffset = this.totalByteLength;
                        for (var i = 0; i < imageLength; ++i) {
                            var image = this.images[i];
                            if (image.uri !== undefined) {
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
             * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
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
             * Creates a bufferview based on the vertices type for the Babylon mesh
             * @param kind - Indicates the type of vertices data.
             * @param babylonMesh - The Babylon mesh to get the vertices data from.
             * @param byteOffset - The offset from the buffer to start indexing from.
             * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
             * @param dataBuffer - The buffer to write the bufferview data to.
             * @returns bytelength of the bufferview data.
             */
            _Exporter.prototype.createBufferViewKind = function (kind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer) {
                var bufferMesh = null;
                var byteLength = 0;
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                if (bufferMesh !== null) {
                    var vertexBuffer = null;
                    var vertexBufferOffset = null;
                    var vertexData = null;
                    var vertexStrideSize = null;
                    if (bufferMesh.getVerticesDataKinds().indexOf(kind) > -1) {
                        vertexBuffer = bufferMesh.getVertexBuffer(kind);
                        vertexBufferOffset = vertexBuffer.getOffset();
                        vertexData = vertexBuffer.getData();
                        vertexStrideSize = vertexBuffer.getStrideSize();
                        if (dataBuffer && vertexData) {
                            byteLength = this.writeAttributeData(kind, vertexData, vertexStrideSize, vertexBufferOffset, byteOffset, dataBuffer, useRightHandedSystem);
                            byteOffset += byteLength;
                        }
                        else {
                            var bufferViewName = null;
                            switch (kind) {
                                case BABYLON.VertexBuffer.PositionKind: {
                                    byteLength = vertexData.length * 4;
                                    bufferViewName = "Position - " + bufferMesh.name;
                                    break;
                                }
                                case BABYLON.VertexBuffer.NormalKind: {
                                    byteLength = vertexData.length * 4;
                                    bufferViewName = "Normal - " + bufferMesh.name;
                                    break;
                                }
                                case BABYLON.VertexBuffer.TangentKind: {
                                    byteLength = vertexData.length * 4;
                                    bufferViewName = "Tangent - " + bufferMesh.name;
                                    break;
                                }
                                case BABYLON.VertexBuffer.ColorKind: {
                                    byteLength = vertexData.length * 4;
                                    bufferViewName = "Color - " + bufferMesh.name;
                                    break;
                                }
                                case BABYLON.VertexBuffer.UVKind: {
                                    byteLength = vertexData.length * 4;
                                    bufferViewName = "TexCoord 0 - " + bufferMesh.name;
                                    break;
                                }
                                case BABYLON.VertexBuffer.UV2Kind: {
                                    byteLength = vertexData.length * 4;
                                    bufferViewName = "TexCoord 1 - " + bufferMesh.name;
                                    break;
                                }
                                default: {
                                    BABYLON.Tools.Warn("Unsupported VertexBuffer kind: " + kind);
                                }
                            }
                            if (bufferViewName !== null) {
                                var bufferView = this.createBufferView(0, byteOffset, byteLength, vertexStrideSize * 4, bufferViewName);
                                byteOffset += byteLength;
                                this.bufferViews.push(bufferView);
                            }
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
             * @param useRightHandedSystem - Indicates whether the data should be modified for a right or left handed coordinate system.
             * @param dataBuffer - Buffer to write the attribute data to.
             * @returns - bytelength of the primitive attributes plus the passed in byteOffset.
             */
            _Exporter.prototype.setPrimitiveAttributes = function (mesh, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer) {
                var bufferMesh = null;
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                var positionBufferViewIndex = null;
                var normalBufferViewIndex = null;
                var colorBufferViewIndex = null;
                var tangentBufferViewIndex = null;
                var texCoord0BufferViewIndex = null;
                var texCoord1BufferViewIndex = null;
                var indexBufferViewIndex = null;
                if (bufferMesh !== null) {
                    // For each BabylonMesh, create bufferviews for each 'kind'
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                        byteOffset += this.createBufferViewKind(BABYLON.VertexBuffer.PositionKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        positionBufferViewIndex = this.bufferViews.length - 1;
                    }
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                        byteOffset += this.createBufferViewKind(BABYLON.VertexBuffer.NormalKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        normalBufferViewIndex = this.bufferViews.length - 1;
                    }
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
                        byteOffset += this.createBufferViewKind(BABYLON.VertexBuffer.ColorKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        colorBufferViewIndex = this.bufferViews.length - 1;
                    }
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.TangentKind)) {
                        byteOffset += this.createBufferViewKind(BABYLON.VertexBuffer.TangentKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        colorBufferViewIndex = this.bufferViews.length - 1;
                    }
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                        byteOffset += this.createBufferViewKind(BABYLON.VertexBuffer.UVKind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        texCoord0BufferViewIndex = this.bufferViews.length - 1;
                    }
                    if (bufferMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                        byteOffset += this.createBufferViewKind(BABYLON.VertexBuffer.UV2Kind, babylonMesh, byteOffset, useRightHandedSystem, dataBuffer);
                        texCoord1BufferViewIndex = this.bufferViews.length - 1;
                    }
                    if (bufferMesh.getTotalIndices() > 0) {
                        var indices = bufferMesh.getIndices();
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
                // go through all mesh primitives (submeshes)
                for (var j = 0; j < babylonMesh.subMeshes.length; ++j) {
                    var submesh = babylonMesh.subMeshes[j];
                    var meshPrimitive = { attributes: {} };
                    if (bufferMesh !== null) {
                        // Create a bufferview storing all the positions
                        if (!dataBuffer) {
                            // Loop through each attribute of the submesh (mesh primitive)
                            if (positionBufferViewIndex !== null) {
                                var positionVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.PositionKind);
                                var positions = positionVertexBuffer.getData();
                                var positionStrideSize = positionVertexBuffer.getStrideSize();
                                // Create accessor
                                var result = this.calculateMinMax(positions, 0, positions.length / positionStrideSize, positionStrideSize, useRightHandedSystem);
                                var accessor = this.createAccessor(positionBufferViewIndex, "Position", "VEC3" /* VEC3 */, 5126 /* FLOAT */, positions.length / positionStrideSize, 0, result.min, result.max);
                                this.accessors.push(accessor);
                                meshPrimitive.attributes.POSITION = this.accessors.length - 1;
                            }
                            if (normalBufferViewIndex !== null) {
                                var normalVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);
                                var normals = normalVertexBuffer.getData();
                                var normalStrideSize = normalVertexBuffer.getStrideSize();
                                // Create accessor
                                var accessor = this.createAccessor(normalBufferViewIndex, "Normal", "VEC3" /* VEC3 */, 5126 /* FLOAT */, normals.length / normalStrideSize);
                                this.accessors.push(accessor);
                                meshPrimitive.attributes.NORMAL = this.accessors.length - 1;
                            }
                            if (tangentBufferViewIndex !== null) {
                                var tangentVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.TangentKind);
                                var tangents = tangentVertexBuffer.getData();
                                var tangentStrideSize = tangentVertexBuffer.getStrideSize();
                                // Create accessor
                                var accessor = this.createAccessor(tangentBufferViewIndex, "Tangent", "VEC4" /* VEC4 */, 5126 /* FLOAT */, tangents.length / tangentStrideSize);
                                this.accessors.push(accessor);
                                meshPrimitive.attributes.TANGENT = this.accessors.length - 1;
                            }
                            if (colorBufferViewIndex !== null) {
                                var colorVertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.ColorKind);
                                var colors = colorVertexBuffer.getData();
                                var colorStrideSize = colorVertexBuffer.getStrideSize();
                                // Create accessor
                                var accessor = this.createAccessor(colorBufferViewIndex, "Color", "VEC4" /* VEC4 */, 5126 /* FLOAT */, colors.length / colorStrideSize);
                                this.accessors.push(accessor);
                                meshPrimitive.attributes.COLOR_0 = this.accessors.length - 1;
                            }
                            if (texCoord0BufferViewIndex !== null) {
                                // Create accessor
                                var texCoord0VertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.UVKind);
                                var texCoord0s = texCoord0VertexBuffer.getData();
                                var texCoord0StrideSize = texCoord0VertexBuffer.getStrideSize();
                                var accessor = this.createAccessor(texCoord0BufferViewIndex, "Texture Coords 0", "VEC2" /* VEC2 */, 5126 /* FLOAT */, texCoord0s.length / texCoord0StrideSize);
                                this.accessors.push(accessor);
                                meshPrimitive.attributes.TEXCOORD_0 = this.accessors.length - 1;
                            }
                            if (texCoord1BufferViewIndex !== null) {
                                // Create accessor
                                var texCoord1VertexBuffer = bufferMesh.getVertexBuffer(BABYLON.VertexBuffer.UV2Kind);
                                var texCoord1s = texCoord1VertexBuffer.getData();
                                var texCoord1StrideSize = texCoord1VertexBuffer.getStrideSize();
                                var accessor = this.createAccessor(texCoord1BufferViewIndex, "Texture Coords 1", "VEC2" /* VEC2 */, 5126 /* FLOAT */, texCoord1s.length / texCoord1StrideSize);
                                this.accessors.push(accessor);
                                meshPrimitive.attributes.TEXCOORD_1 = this.accessors.length - 1;
                            }
                            if (indexBufferViewIndex) {
                                // Create accessor
                                var accessor = this.createAccessor(indexBufferViewIndex, "Indices", "SCALAR" /* SCALAR */, 5125 /* UNSIGNED_INT */, submesh.indexCount, submesh.indexStart * 4);
                                this.accessors.push(accessor);
                                meshPrimitive.indices = this.accessors.length - 1;
                            }
                        }
                        if (bufferMesh.material) {
                            if (bufferMesh.material instanceof BABYLON.StandardMaterial || bufferMesh.material instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                                var materialIndex = babylonMesh.getScene().materials.indexOf(bufferMesh.material);
                                meshPrimitive.material = materialIndex;
                            }
                            else if (bufferMesh.material instanceof BABYLON.MultiMaterial) {
                                var babylonMultiMaterial = bufferMesh.material;
                                var material = babylonMultiMaterial.subMaterials[submesh.materialIndex];
                                if (material !== null) {
                                    var materialIndex = babylonMesh.getScene().materials.indexOf(material);
                                    meshPrimitive.material = materialIndex;
                                }
                            }
                            else {
                                BABYLON.Tools.Warn("Material type " + bufferMesh.material.getClassName() + " for material " + bufferMesh.material.name + " is not yet implemented in glTF serializer.");
                            }
                        }
                        mesh.primitives.push(meshPrimitive);
                    }
                }
                return byteOffset;
            };
            /**
             * Creates a glTF scene based on the array of meshes.
             * Returns the the total byte offset.
             * @param babylonScene - Babylon scene to get the mesh data from.
             * @param byteOffset - Offset to start from in bytes.
             * @param dataBuffer - Buffer to write geometry data to.
             * @returns bytelength + byteoffset
             */
            _Exporter.prototype.createScene = function (babylonScene, byteOffset, dataBuffer) {
                if (babylonScene.meshes.length > 0) {
                    var babylonMeshes = babylonScene.meshes;
                    var scene = { nodes: new Array() };
                    if (dataBuffer == null) {
                        GLTF2._GLTFMaterial.ConvertMaterialsToGLTF(babylonScene.materials, "image/jpeg" /* JPEG */, this.images, this.textures, this.materials, this.imageData, true);
                    }
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
             * Gets the materials from a Babylon scene and converts them to glTF materials.
             * @param scene
             * @param mimeType
             * @param images
             * @param textures
             * @param materials
             * @param imageData
             * @param hasTextureCoords
             */
            _GLTFMaterial.ConvertMaterialsToGLTF = function (babylonMaterials, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                for (var i = 0; i < babylonMaterials.length; ++i) {
                    var babylonMaterial = babylonMaterials[i];
                    if (babylonMaterial instanceof BABYLON.StandardMaterial) {
                        _GLTFMaterial.ConvertStandardMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                    }
                    else if (babylonMaterial instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                        _GLTFMaterial.ConvertPBRMetallicRoughnessMaterial(babylonMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords);
                    }
                }
            };
            /**
             * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material.
             * @param babylonStandardMaterial
             * @returns - glTF Metallic Roughness Material representation
             */
            _GLTFMaterial.ConvertToGLTFPBRMetallicRoughness = function (babylonStandardMaterial) {
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
                function cubicBezierCurve(t, p0, p1, p2, p3) {
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
                function solveForRoughness(specularPower) {
                    var t = Math.pow(specularPower / P3.x, 0.333333);
                    return cubicBezierCurve(t, P0.y, P1.y, P2.y, P3.y);
                }
                var diffuse = babylonStandardMaterial.diffuseColor.toLinearSpace().scale(0.5);
                var opacity = babylonStandardMaterial.alpha;
                var specularPower = BABYLON.Scalar.Clamp(babylonStandardMaterial.specularPower, 0, this.maxSpecularPower);
                var roughness = solveForRoughness(specularPower);
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
            _GLTFMaterial.SolveMetallic = function (diffuse, specular, oneMinusSpecularStrength) {
                if (specular < _GLTFMaterial.dielectricSpecular.r) {
                    _GLTFMaterial.dielectricSpecular;
                    return 0;
                }
                var a = _GLTFMaterial.dielectricSpecular.r;
                var b = diffuse * oneMinusSpecularStrength / (1.0 - _GLTFMaterial.dielectricSpecular.r) + specular - 2.0 * _GLTFMaterial.dielectricSpecular.r;
                var c = _GLTFMaterial.dielectricSpecular.r - specular;
                var D = b * b - 4.0 * a * c;
                return BABYLON.Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
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
                            BABYLON.Tools.Warn(babylonMaterial.name + ": GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
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
             * Converts a Babylon Standard Material to a glTF Material.
             * @param babylonStandardMaterial - BJS Standard Material.
             * @param mimeType - mime type to use for the textures.
             * @param images - array of glTF image interfaces.
             * @param textures - array of glTF texture interfaces.
             * @param materials - array of glTF material interfaces.
             * @param imageData - map of image file name to data.
             * @param hasTextureCoords - specifies if texture coordinates are present on the submesh to determine if textures should be applied.
             */
            _GLTFMaterial.ConvertStandardMaterial = function (babylonStandardMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                BABYLON.Tools.Warn(babylonStandardMaterial.name + ": Standard Material is currently not fully supported/implemented in glTF serializer");
                var glTFPbrMetallicRoughness = _GLTFMaterial.ConvertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
                var glTFMaterial = { name: babylonStandardMaterial.name };
                if (babylonStandardMaterial.backFaceCulling) {
                    if (!babylonStandardMaterial.twoSidedLighting) {
                        BABYLON.Tools.Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                    }
                    glTFMaterial.doubleSided = true;
                }
                if (hasTextureCoords) {
                    if (babylonStandardMaterial.diffuseTexture) {
                        var glTFTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.diffuseTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    }
                    if (babylonStandardMaterial.bumpTexture) {
                        var glTFTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.bumpTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                        }
                    }
                    if (babylonStandardMaterial.emissiveTexture) {
                        var glTFEmissiveTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.emissiveTexture, mimeType, images, textures, imageData);
                        if (glTFEmissiveTexture) {
                            glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                        }
                        glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                    }
                    if (babylonStandardMaterial.ambientTexture) {
                        var glTFOcclusionTexture = _GLTFMaterial.ExportTexture(babylonStandardMaterial.ambientTexture, mimeType, images, textures, imageData);
                        if (glTFOcclusionTexture) {
                            glTFMaterial.occlusionTexture = glTFOcclusionTexture;
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
            _GLTFMaterial.ConvertPBRMetallicRoughnessMaterial = function (babylonPBRMetalRoughMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords) {
                var glTFPbrMetallicRoughness = {};
                if (babylonPBRMetalRoughMaterial.baseColor) {
                    glTFPbrMetallicRoughness.baseColorFactor = [
                        babylonPBRMetalRoughMaterial.baseColor.r,
                        babylonPBRMetalRoughMaterial.baseColor.g,
                        babylonPBRMetalRoughMaterial.baseColor.b,
                        babylonPBRMetalRoughMaterial.alpha
                    ];
                }
                if (babylonPBRMetalRoughMaterial.metallic != null) {
                    glTFPbrMetallicRoughness.metallicFactor = babylonPBRMetalRoughMaterial.metallic;
                }
                if (babylonPBRMetalRoughMaterial.roughness != null) {
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
                        var glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.baseTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMetalRoughMaterial.normalTexture) {
                        var glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.normalTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.normalTexture = glTFTexture;
                        }
                    }
                    if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                        var glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType, images, textures, imageData);
                        if (glTFTexture) {
                            glTFMaterial.occlusionTexture = glTFTexture;
                            if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                                glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                            }
                        }
                    }
                    if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                        var glTFTexture = _GLTFMaterial.ExportTexture(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType, images, textures, imageData);
                        if (glTFTexture != null) {
                            glTFMaterial.emissiveTexture = glTFTexture;
                        }
                    }
                }
                if (babylonPBRMetalRoughMaterial.emissiveColor.equalsFloats(0.0, 0.0, 0.0)) {
                    glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
                }
                if (babylonPBRMetalRoughMaterial.transparencyMode != null) {
                    var alphaMode = _GLTFMaterial.GetAlphaMode(babylonPBRMetalRoughMaterial);
                    if (alphaMode !== "OPAQUE" /* OPAQUE */) {
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
             * Extracts a texture from a Babylon texture into file data and glTF data.
             * @param babylonTexture - Babylon texture to extract.
             * @param mimeType - Mime Type of the babylonTexture.
             * @param images - Array of glTF images.
             * @param textures - Array of glTF textures.
             * @param imageData - map of image file name and data.
             * @return - glTF texture, or null if the texture format is not supported.
             */
            _GLTFMaterial.ExportTexture = function (babylonTexture, mimeType, images, textures, imageData) {
                var textureInfo = null;
                var glTFTexture = {
                    source: images.length
                };
                var textureName = "texture_" + (textures.length - 1).toString();
                var textureData = babylonTexture.getInternalTexture();
                if (textureData != null) {
                    textureName = textureData.url;
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
                    BABYLON.Tools.Error("Unsupported mime type " + mimeType);
                }
                textureName = baseFile + extension;
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
                imageData[textureName] = imageValues;
                if (mimeType === "image/jpeg" /* JPEG */) {
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
            _GLTFMaterial.dielectricSpecular = new BABYLON.Color3(0.04, 0.04, 0.04);
            /**
             * Allows the maximum specular power to be defined for material calculations.
             */
            _GLTFMaterial.maxSpecularPower = 1024;
            return _GLTFMaterial;
        }());
        GLTF2._GLTFMaterial = _GLTFMaterial;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterial.js.map


(function universalModuleDefinition(root, factory) {
                var f = factory();
                if (root && root["BABYLON"]) {
                    return;
                }
                
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = f;
    else if(typeof define === 'function' && define.amd)
        define(["BJSSerializers"], factory);
    else if(typeof exports === 'object')
        exports["BJSSerializers"] = f;
    else {
        root["BABYLON"] = f;
    }
})(this, function() {
    return BABYLON;
});
