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
    var GLTF2Export = /** @class */ (function () {
        function GLTF2Export() {
        }
        /**
         * Exports the geometry of a Mesh array in .gltf file format.
         * @param meshes
         * @param materials
         * @param options
         *
         * @returns - Returns an object with a .gltf, .glb and associates textures
         * as keys and their data and paths as values.
         */
        GLTF2Export.GLTF = function (scene, filename, options) {
            var glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON._GLTF2Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLTF(glTFPrefix);
            }
            else {
                throw new Error("glTF Serializer: Scene is not ready!");
            }
        };
        /**
         *
         * @param meshes
         * @param filename
         *
         * @returns - Returns an object with a .glb filename as key and data as value
         */
        GLTF2Export.GLB = function (scene, filename, options) {
            var glTFPrefix = filename.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON._GLTF2Exporter(scene, options);
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

var BABYLON;
(function (BABYLON) {
    /**
     * glTF Image mimetype enum
     */
    var _EGLTFImageMimeTypeEnum;
    (function (_EGLTFImageMimeTypeEnum) {
        _EGLTFImageMimeTypeEnum["PNG"] = "image/png";
        _EGLTFImageMimeTypeEnum["JPG"] = "image/jpeg";
    })(_EGLTFImageMimeTypeEnum || (_EGLTFImageMimeTypeEnum = {}));
    /**
     * glTF Alpha Mode Enum
     */
    var _EGLTFAlphaModeEnum;
    (function (_EGLTFAlphaModeEnum) {
        _EGLTFAlphaModeEnum["OPAQUE"] = "OPAQUE";
        _EGLTFAlphaModeEnum["MASK"] = "MASK";
        _EGLTFAlphaModeEnum["BLEND"] = "BLEND";
    })(_EGLTFAlphaModeEnum = BABYLON._EGLTFAlphaModeEnum || (BABYLON._EGLTFAlphaModeEnum = {}));
    /**
     * Converts Babylon Scene into glTF 2.0
     */
    var _GLTF2Exporter = /** @class */ (function () {
        function _GLTF2Exporter(babylonScene, options) {
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
        _GLTF2Exporter.prototype.createBufferView = function (bufferIndex, byteOffset, byteLength, name) {
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
         * @returns - min number array and max number array
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
         * @returns - byte length
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
         * @returns - json data as string
         */
        _GLTF2Exporter.prototype.generateJSON = function (glb, glTFPrefix, prettyPrint) {
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
        _GLTF2Exporter.prototype._generateGLTF = function (glTFPrefix) {
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
        _GLTF2Exporter.prototype.generateBinary = function () {
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
        _GLTF2Exporter.prototype._getPadding = function (num) {
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
        _GLTF2Exporter.prototype._generateGLB = function (glTFPrefix) {
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
         *
         * @param babylonTexture
         * @return - glTF texture, or null if the texture format is not supported
         */
        _GLTF2Exporter.prototype.exportTexture = function (babylonTexture, mimeType) {
            if (mimeType === void 0) { mimeType = _EGLTFImageMimeTypeEnum.JPG; }
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
            if (mimeType === _EGLTFImageMimeTypeEnum.JPG) {
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Positions");
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Normals");
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Tangents");
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Colors");
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Texture Coords0");
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Texture Coords 1");
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
                        var bufferview = this.createBufferView(0, byteOffset, byteLength, "Indices");
                        byteOffset += byteLength;
                        this.bufferViews.push(bufferview);
                        // Create accessor
                        var accessor = this.createAccessor(this.bufferViews.length - 1, "Indices", "SCALAR", 5125, indicesCount);
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
                        var babylonSpecularGlossiness = {
                            diffuse: babylonStandardMaterial.diffuseColor,
                            opacity: babylonStandardMaterial.alpha,
                            specular: babylonStandardMaterial.specularColor || BABYLON.Color3.Black(),
                            glossiness: babylonStandardMaterial.specularPower / 256
                        };
                        if (babylonStandardMaterial.specularTexture) {
                        }
                        var babylonMetallicRoughness = BABYLON._GLTFMaterial.ConvertToMetallicRoughness(babylonSpecularGlossiness);
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
                            var alphaMode = BABYLON._GLTFMaterial.GetAlphaMode(babylonPBRMaterial);
                            if (alphaMode !== _EGLTFAlphaModeEnum.OPAQUE) {
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
        _GLTF2Exporter.prototype.createScene = function (babylonScene, byteOffset, dataBuffer) {
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
        return _GLTF2Exporter;
    }());
    BABYLON._GLTF2Exporter = _GLTF2Exporter;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFExporter.js.map

var BABYLON;
(function (BABYLON) {
    /**
     * Class for holding and downloading glTF file data
     */
    var _GLTFData = /** @class */ (function () {
        function _GLTFData() {
            this.glTFFiles = {};
        }
        /**
         * Downloads glTF data.
         */
        _GLTFData.prototype.downloadFiles = function () {
            /**
            * Checks for a matching suffix at the end of a string (for ES5 and lower)
            * @param str
            * @param suffix
            * @returns - indicating whether the suffix matches or not
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
    /**
     * Utility methods for working with glTF material conversion properties
     */
    var _GLTFMaterial = /** @class */ (function () {
        function _GLTFMaterial() {
        }
        /**
         * Converts Specular Glossiness to Metallic Roughness
         * @param  babylonSpecularGlossiness - Babylon specular glossiness parameters
         * @returns - Babylon metallic roughness values
         */
        _GLTFMaterial.ConvertToMetallicRoughness = function (babylonSpecularGlossiness) {
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
                    return BABYLON._EGLTFAlphaModeEnum.BLEND;
                }
                else {
                    return BABYLON._EGLTFAlphaModeEnum.OPAQUE;
                }
            }
            else if (babylonMaterial instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                var babylonPBRMetallicRoughness = babylonMaterial;
                switch (babylonPBRMetallicRoughness.transparencyMode) {
                    case BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE: {
                        return BABYLON._EGLTFAlphaModeEnum.OPAQUE;
                    }
                    case BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND: {
                        return BABYLON._EGLTFAlphaModeEnum.BLEND;
                    }
                    case BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST: {
                        return BABYLON._EGLTFAlphaModeEnum.MASK;
                    }
                    case BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND: {
                        console.warn("GLTF Exporter | Alpha test and blend mode not supported in glTF.  Alpha blend used instead.");
                        return BABYLON._EGLTFAlphaModeEnum.BLEND;
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
        _GLTFMaterial.dielectricSpecular = new BABYLON.Color3(0.04, 0.04, 0.04);
        _GLTFMaterial.epsilon = 1e-6;
        return _GLTFMaterial;
    }());
    BABYLON._GLTFMaterial = _GLTFMaterial;
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
