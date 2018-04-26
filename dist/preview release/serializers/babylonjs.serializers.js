

(function universalModuleDefinition(root, factory) {
    var amdDependencies = [];
    var BABYLON = root.BABYLON || this.BABYLON;
    if(typeof exports === 'object' && typeof module === 'object') {
         BABYLON = BABYLON || require("babylonjs"); 

        module.exports = factory(BABYLON);
    } else if(typeof define === 'function' && define.amd) {
         amdDependencies.push("babylonjs");

        define("babylonjs-serializers", amdDependencies, factory);
    } else if(typeof exports === 'object') {
         BABYLON = BABYLON || require("babylonjs"); 

        exports["babylonjs-serializers"] = factory(BABYLON);
    } else {
        root["BABYLON"] = factory(BABYLON);
    }
})(this, function(BABYLON) {
  BABYLON = BABYLON || this.BABYLON;

var __decorate=this&&this.__decorate||function(e,t,r,c){var o,f=arguments.length,n=f<3?t:null===c?c=Object.getOwnPropertyDescriptor(t,r):c;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,c);else for(var l=e.length-1;l>=0;l--)(o=e[l])&&(n=(f<3?o(n):f>3?o(t,r,n):o(t,r))||n);return f>3&&n&&Object.defineProperty(t,r,n),n};
var __extends=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var n in o)o.hasOwnProperty(n)&&(t[n]=o[n])};return function(o,n){function r(){this.constructor=o}t(o,n),o.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();

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
         * Exports the geometry of the scene to .gltf file format
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        GLTF2Export.GLTF = function (scene, filePrefix, options) {
            var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON.GLTF2._Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLTF(glTFPrefix);
            }
            else {
                BABYLON.Tools.Error("glTF Serializer: Scene is not ready!");
                return null;
            }
        };
        /**
         * Exports the geometry of the scene to .glb file format
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating glb file
         * @param options Exporter options
         * @returns Returns an object with a .glb filename as key and data as value
         */
        GLTF2Export.GLB = function (scene, filePrefix, options) {
            var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
            var gltfGenerator = new BABYLON.GLTF2._Exporter(scene, options);
            if (scene.isReady) {
                return gltfGenerator._generateGLB(glTFPrefix);
            }
            else {
                BABYLON.Tools.Error("glTF Serializer: Scene is not ready!");
                return null;
            }
        };
        return GLTF2Export;
    }());
    BABYLON.GLTF2Export = GLTF2Export;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFSerializer.js.map


/**
 * Module for the Babylon glTF 2.0 exporter.  Should ONLY be used internally
 * @hidden
 */
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Utility interface for storing vertex attribute data
         * @hidden
         */
        /**
         * Converts Babylon Scene into glTF 2.0.
         * @hidden
         */
        var _Exporter = /** @class */ (function () {
            /**
             * Creates a glTF Exporter instance, which can accept optional exporter options
             * @param babylonScene Babylon scene object
             * @param options Options to modify the behavior of the exporter
             */
            function _Exporter(babylonScene, options) {
                this.asset = { generator: "BabylonJS", version: "2.0" };
                this.babylonScene = babylonScene;
                this.bufferViews = [];
                this.accessors = [];
                this.meshes = [];
                this.scenes = [];
                this.nodes = [];
                this.images = [];
                this.materials = [];
                this.textures = [];
                this.animations = [];
                this.imageData = {};
                this.convertToRightHandedSystem = this.babylonScene.useRightHandedSystem ? false : true;
                var _options = options || {};
                this.shouldExportMesh = _options.shouldExportMesh ? _options.shouldExportMesh : (function (mesh) { return true; });
                this.animationSampleRate = _options.animationSampleRate ? _options.animationSampleRate : 1 / 60;
            }
            /**
             * Writes mesh attribute data to a data buffer
             * Returns the bytelength of the data
             * @param vertexBufferKind Indicates what kind of vertex data is being passed in
             * @param meshAttributeArray Array containing the attribute data
             * @param binaryWriter The buffer to write the binary data to
             * @returns Byte length of the attribute data
             */
            _Exporter.prototype.writeAttributeData = function (vertexBufferKind, meshAttributeArray, binaryWriter) {
                var stride = BABYLON.VertexBuffer.DeduceStride(vertexBufferKind);
                var byteLength = 0;
                var vector;
                var index;
                for (var k = 0, length_1 = meshAttributeArray.length / stride; k < length_1; ++k) {
                    index = k * stride;
                    if (vertexBufferKind === BABYLON.VertexBuffer.PositionKind || vertexBufferKind === BABYLON.VertexBuffer.NormalKind) {
                        var vertexData = BABYLON.Vector3.FromArray(meshAttributeArray, index);
                        if (this.convertToRightHandedSystem) {
                            GLTF2._GLTFUtilities.GetRightHandedVector3FromRef(vertexData);
                        }
                        vector = vertexData.asArray();
                    }
                    else if (vertexBufferKind === BABYLON.VertexBuffer.TangentKind || vertexBufferKind === BABYLON.VertexBuffer.ColorKind) {
                        var vertexData = BABYLON.Vector4.FromArray(meshAttributeArray, index);
                        if (this.convertToRightHandedSystem && !(vertexBufferKind === BABYLON.VertexBuffer.ColorKind)) {
                            GLTF2._GLTFUtilities.GetRightHandedVector4FromRef(vertexData);
                        }
                        vector = vertexData.asArray();
                    }
                    else if (vertexBufferKind === BABYLON.VertexBuffer.UVKind || vertexBufferKind === BABYLON.VertexBuffer.UV2Kind) {
                        vector = this.convertToRightHandedSystem ? [meshAttributeArray[index], meshAttributeArray[index + 1]] : [meshAttributeArray[index], meshAttributeArray[index + 1]];
                    }
                    else {
                        BABYLON.Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                        vector = [];
                    }
                    vector.forEach(function (entry) {
                        binaryWriter.setFloat32(entry);
                    });
                }
                byteLength = meshAttributeArray.length * 4;
                return byteLength;
            };
            /**
             * Generates glTF json data
             * @param shouldUseGlb Indicates whether the json should be written for a glb file
             * @param glTFPrefix Text to use when prefixing a glTF file
             * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
             * @returns json data as string
             */
            _Exporter.prototype.generateJSON = function (shouldUseGlb, glTFPrefix, prettyPrint) {
                var buffer = { byteLength: this.totalByteLength };
                var imageName;
                var imageData;
                var bufferView;
                var byteOffset = this.totalByteLength;
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
                if (this.animations && this.animations.length) {
                    glTF.animations = this.animations;
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
                        var self_1 = this;
                        this.images.forEach(function (image) {
                            if (image.uri) {
                                imageData = self_1.imageData[image.uri];
                                imageName = image.uri.split('.')[0] + " image";
                                bufferView = GLTF2._GLTFUtilities.CreateBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                                byteOffset += imageData.data.buffer.byteLength;
                                self_1.bufferViews.push(bufferView);
                                image.bufferView = self_1.bufferViews.length - 1;
                                image.name = imageName;
                                image.mimeType = imageData.mimeType;
                                image.uri = undefined;
                                if (!glTF.images) {
                                    glTF.images = [];
                                }
                                glTF.images.push(image);
                            }
                        });
                        // Replace uri with bufferview and mime type for glb
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
             * @param glTFPrefix Text to use when prefixing a glTF file
             * @returns GLTFData with glTF file data
             */
            _Exporter.prototype._generateGLTF = function (glTFPrefix) {
                var binaryBuffer = this.generateBinary();
                var jsonText = this.generateJSON(false, glTFPrefix, true);
                var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
                var glTFFileName = glTFPrefix + '.gltf';
                var glTFBinFile = glTFPrefix + '.bin';
                var container = new BABYLON.GLTFData();
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
             * @returns array buffer for binary data
             */
            _Exporter.prototype.generateBinary = function () {
                var binaryWriter = new _BinaryWriter(4);
                this.createScene(this.babylonScene, binaryWriter);
                return binaryWriter.getArrayBuffer();
            };
            /**
             * Pads the number to a multiple of 4
             * @param num number to pad
             * @returns padded number
             */
            _Exporter.prototype._getPadding = function (num) {
                var remainder = num % 4;
                var padding = remainder === 0 ? remainder : 4 - remainder;
                return padding;
            };
            /**
             * Generates a glb file from the json and binary data
             * Returns an object with the glb file name as the key and data as the value
             * @param glTFPrefix
             * @returns object with glb filename as key and data as value
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
                var container = new BABYLON.GLTFData();
                container.glTFFiles[glbFileName] = glbFile;
                return container;
            };
            /**
             * Sets the TRS for each node
             * @param node glTF Node for storing the transformation data
             * @param babylonMesh Babylon mesh used as the source for the transformation data
             */
            _Exporter.prototype.setNodeTransformation = function (node, babylonMesh) {
                if (!babylonMesh.position.equalsToFloats(0, 0, 0)) {
                    node.translation = this.convertToRightHandedSystem ? GLTF2._GLTFUtilities.GetRightHandedVector3(babylonMesh.position).asArray() : babylonMesh.position.asArray();
                }
                if (!babylonMesh.scaling.equalsToFloats(1, 1, 1)) {
                    node.scale = babylonMesh.scaling.asArray();
                }
                var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(babylonMesh.rotation.y, babylonMesh.rotation.x, babylonMesh.rotation.z);
                if (babylonMesh.rotationQuaternion) {
                    rotationQuaternion = rotationQuaternion.multiply(babylonMesh.rotationQuaternion);
                }
                if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                    if (this.convertToRightHandedSystem) {
                        GLTF2._GLTFUtilities.GetRightHandedQuaternionFromRef(rotationQuaternion);
                    }
                    node.rotation = rotationQuaternion.normalize().asArray();
                }
            };
            /**
             * Creates a bufferview based on the vertices type for the Babylon mesh
             * @param kind Indicates the type of vertices data
             * @param babylonMesh The Babylon mesh to get the vertices data from
             * @param binaryWriter The buffer to write the bufferview data to
             */
            _Exporter.prototype.createBufferViewKind = function (kind, babylonMesh, binaryWriter, byteStride) {
                var bufferMesh = null;
                var byteLength;
                var vertexData;
                var bufferView;
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                if (bufferMesh) {
                    vertexData = bufferMesh.getVerticesData(kind);
                    if (vertexData) {
                        byteLength = vertexData.length * 4;
                        bufferView = GLTF2._GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                        this.bufferViews.push(bufferView);
                        this.writeAttributeData(kind, vertexData, binaryWriter);
                    }
                }
            };
            /**
             * Sets data for the primitive attributes of each submesh
             * @param mesh glTF Mesh object to store the primitive attribute information
             * @param babylonMesh Babylon mesh to get the primitive attribute data from
             * @param binaryWriter Buffer to write the attribute data to
             */
            _Exporter.prototype.setPrimitiveAttributes = function (mesh, babylonMesh, binaryWriter) {
                var bufferMesh = null;
                var attributeKind;
                var indices;
                var byteLength;
                var bufferView;
                var uvCoordsPresent;
                var meshPrimitive;
                var vertexData;
                var stride;
                var minMax;
                var newMat;
                var babylonMultiMaterial;
                var material;
                var materialIndex = null;
                var indexBufferViewIndex = null;
                var accessor;
                var bufferViewIndex;
                if (babylonMesh instanceof BABYLON.Mesh) {
                    bufferMesh = babylonMesh;
                }
                else if (babylonMesh instanceof BABYLON.InstancedMesh) {
                    bufferMesh = babylonMesh.sourceMesh;
                }
                var attributeData = [
                    { kind: BABYLON.VertexBuffer.PositionKind, accessorType: "VEC3" /* VEC3 */, byteStride: 12 },
                    { kind: BABYLON.VertexBuffer.NormalKind, accessorType: "VEC3" /* VEC3 */, byteStride: 12 },
                    { kind: BABYLON.VertexBuffer.ColorKind, accessorType: "VEC4" /* VEC4 */, byteStride: 16 },
                    { kind: BABYLON.VertexBuffer.TangentKind, accessorType: "VEC4" /* VEC4 */, byteStride: 16 },
                    { kind: BABYLON.VertexBuffer.UVKind, accessorType: "VEC2" /* VEC2 */, byteStride: 8 },
                    { kind: BABYLON.VertexBuffer.UV2Kind, accessorType: "VEC2" /* VEC2 */, byteStride: 8 },
                ];
                if (bufferMesh) {
                    // For each BabylonMesh, create bufferviews for each 'kind'
                    for (var _i = 0, attributeData_1 = attributeData; _i < attributeData_1.length; _i++) {
                        var attribute = attributeData_1[_i];
                        attributeKind = attribute.kind;
                        if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                            this.createBufferViewKind(attributeKind, babylonMesh, binaryWriter, attribute.byteStride);
                            attribute.bufferViewIndex = this.bufferViews.length - 1;
                        }
                    }
                    if (bufferMesh.getTotalIndices()) {
                        indices = bufferMesh.getIndices();
                        if (indices) {
                            byteLength = indices.length * 4;
                            bufferView = GLTF2._GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                            this.bufferViews.push(bufferView);
                            indexBufferViewIndex = this.bufferViews.length - 1;
                            for (var k = 0, length_2 = indices.length; k < length_2; ++k) {
                                binaryWriter.setUInt32(indices[k]);
                            }
                        }
                    }
                    if (babylonMesh.subMeshes) {
                        uvCoordsPresent = false;
                        // go through all mesh primitives (submeshes)
                        for (var _a = 0, _b = babylonMesh.subMeshes; _a < _b.length; _a++) {
                            var submesh = _b[_a];
                            meshPrimitive = { attributes: {} };
                            for (var _c = 0, attributeData_2 = attributeData; _c < attributeData_2.length; _c++) {
                                var attribute = attributeData_2[_c];
                                attributeKind = attribute.kind;
                                vertexData = bufferMesh.getVerticesData(attributeKind);
                                if (vertexData) {
                                    stride = BABYLON.VertexBuffer.DeduceStride(attributeKind);
                                    bufferViewIndex = attribute.bufferViewIndex;
                                    if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                        minMax = { min: null, max: null };
                                        if (attributeKind == BABYLON.VertexBuffer.PositionKind) {
                                            minMax = GLTF2._GLTFUtilities.CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride, this.convertToRightHandedSystem);
                                        }
                                        accessor = GLTF2._GLTFUtilities.CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonMesh.name, attribute.accessorType, 5126 /* FLOAT */, vertexData.length / stride, 0, minMax.min, minMax.max);
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
                                accessor = GLTF2._GLTFUtilities.CreateAccessor(indexBufferViewIndex, "indices - " + babylonMesh.name, "SCALAR" /* SCALAR */, 5125 /* UNSIGNED_INT */, submesh.indexCount, submesh.indexStart * 4, null, null);
                                this.accessors.push(accessor);
                                meshPrimitive.indices = this.accessors.length - 1;
                            }
                            if (bufferMesh.material) {
                                materialIndex = null;
                                if (bufferMesh.material instanceof BABYLON.StandardMaterial || bufferMesh.material instanceof BABYLON.PBRMetallicRoughnessMaterial || bufferMesh.material instanceof BABYLON.PBRMaterial) {
                                    materialIndex = babylonMesh.getScene().materials.indexOf(bufferMesh.material);
                                }
                                else if (bufferMesh.material instanceof BABYLON.MultiMaterial) {
                                    babylonMultiMaterial = bufferMesh.material;
                                    material = babylonMultiMaterial.subMaterials[submesh.materialIndex];
                                    if (material) {
                                        materialIndex = babylonMesh.getScene().materials.indexOf(material);
                                    }
                                }
                                else {
                                    BABYLON.Tools.Warn("Material type " + bufferMesh.material.getClassName() + " for material " + bufferMesh.material.name + " is not yet implemented in glTF serializer.");
                                }
                                if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                                    if (uvCoordsPresent) {
                                        if (!GLTF2._GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                            delete meshPrimitive.attributes.TEXCOORD_0;
                                            delete meshPrimitive.attributes.TEXCOORD_1;
                                        }
                                        meshPrimitive.material = materialIndex;
                                    }
                                    else {
                                        if (GLTF2._GLTFMaterial._HasTexturesPresent(this.materials[materialIndex])) {
                                            newMat = GLTF2._GLTFMaterial._StripTexturesFromMaterial(this.materials[materialIndex]);
                                            this.materials.push(newMat);
                                            meshPrimitive.material = this.materials.length - 1;
                                        }
                                    }
                                }
                            }
                            mesh.primitives.push(meshPrimitive);
                        }
                    }
                }
            };
            /**
             * Creates a glTF scene based on the array of meshes
             * Returns the the total byte offset
             * @param babylonScene Babylon scene to get the mesh data from
             * @param binaryWriter Buffer to write binary data to
             * @returns bytelength + byteoffset
             */
            _Exporter.prototype.createScene = function (babylonScene, binaryWriter) {
                if (babylonScene.meshes.length) {
                    var babylonMeshes = babylonScene.meshes;
                    var scene_1 = { nodes: [] };
                    var glTFNodeIndex_1;
                    var glTFNode_1;
                    var directDescendents_1;
                    GLTF2._GLTFMaterial._ConvertMaterialsToGLTF(babylonScene.materials, "image/png" /* PNG */, this.images, this.textures, this.materials, this.imageData, true);
                    this.nodeMap = this.createNodeMapAndAnimations(babylonScene, binaryWriter);
                    this.totalByteLength = binaryWriter.getByteOffset();
                    var self_2 = this;
                    // Build Hierarchy with the node map.
                    babylonMeshes.forEach(function (babylonMesh) {
                        glTFNodeIndex_1 = self_2.nodeMap[babylonMesh.uniqueId];
                        glTFNode_1 = self_2.nodes[glTFNodeIndex_1];
                        if (!babylonMesh.parent) {
                            if (!self_2.shouldExportMesh(babylonMesh)) {
                                BABYLON.Tools.Log("Omitting " + babylonMesh.name + " from scene.");
                            }
                            else {
                                scene_1.nodes.push(glTFNodeIndex_1);
                            }
                        }
                        directDescendents_1 = babylonMesh.getDescendants(true);
                        if (!glTFNode_1.children && directDescendents_1 && directDescendents_1.length) {
                            glTFNode_1.children = [];
                            for (var _i = 0, directDescendents_2 = directDescendents_1; _i < directDescendents_2.length; _i++) {
                                var descendent = directDescendents_2[_i];
                                glTFNode_1.children.push(self_2.nodeMap[descendent.uniqueId]);
                            }
                        }
                    });
                    this.scenes.push(scene_1);
                }
            };
            /**
             * Creates a mapping of Node unique id to node index and handles animations
             * @param scene Babylon Scene
             * @param binaryWriter Buffer to write binary data to
             * @returns Node mapping of unique id to index
             */
            _Exporter.prototype.createNodeMapAndAnimations = function (scene, binaryWriter) {
                var nodeMap = {};
                var nodeIndex;
                var runtimeGLTFAnimation = {
                    name: 'runtime animations',
                    channels: [],
                    samplers: []
                };
                var idleGLTFAnimations = [];
                var node;
                var self = this;
                scene.meshes.forEach(function (babylonMesh) {
                    node = self.createNode(babylonMesh, binaryWriter);
                    self.nodes.push(node);
                    nodeIndex = self.nodes.length - 1;
                    nodeMap[babylonMesh.uniqueId] = nodeIndex;
                    if (!scene.animationGroups.length && babylonMesh.animations.length) {
                        GLTF2._GLTFAnimation._CreateNodeAnimationFromMeshAnimations(babylonMesh, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, self.nodes, binaryWriter, self.bufferViews, self.accessors, self.convertToRightHandedSystem, self.animationSampleRate);
                    }
                });
                if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                    this.animations.push(runtimeGLTFAnimation);
                }
                idleGLTFAnimations.forEach(function (idleGLTFAnimation) {
                    if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                        self.animations.push(idleGLTFAnimation);
                    }
                });
                if (scene.animationGroups.length) {
                    GLTF2._GLTFAnimation._CreateNodeAnimationFromAnimationGroups(scene, self.animations, nodeMap, this.nodes, binaryWriter, this.bufferViews, this.accessors, this.convertToRightHandedSystem, self.animationSampleRate);
                }
                return nodeMap;
            };
            /**
             * Creates a glTF node from a Babylon mesh
             * @param babylonMesh Source Babylon mesh
             * @param binaryWriter Buffer for storing geometry data
             * @returns glTF node
             */
            _Exporter.prototype.createNode = function (babylonMesh, binaryWriter) {
                // create node to hold translation/rotation/scale and the mesh
                var node = {};
                // create mesh
                var mesh = { primitives: [] };
                if (babylonMesh.name) {
                    node.name = babylonMesh.name;
                }
                // Set transformation
                this.setNodeTransformation(node, babylonMesh);
                this.setPrimitiveAttributes(mesh, babylonMesh, binaryWriter);
                if (mesh.primitives.length) {
                    this.meshes.push(mesh);
                    node.mesh = this.meshes.length - 1;
                }
                return node;
            };
            return _Exporter;
        }());
        GLTF2._Exporter = _Exporter;
        /**
         * @hidden
         *
         * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
         */
        var _BinaryWriter = /** @class */ (function () {
            /**
             * Initialize binary writer with an initial byte length
             * @param byteLength Initial byte length of the array buffer
             */
            function _BinaryWriter(byteLength) {
                this._arrayBuffer = new ArrayBuffer(byteLength);
                this._dataView = new DataView(this._arrayBuffer);
                this._byteOffset = 0;
            }
            /**
             * Resize the array buffer to the specified byte length
             * @param byteLength
             */
            _BinaryWriter.prototype.resizeBuffer = function (byteLength) {
                var newBuffer = new ArrayBuffer(byteLength);
                var oldUint8Array = new Uint8Array(this._arrayBuffer);
                var newUint8Array = new Uint8Array(newBuffer);
                for (var i = 0, length_3 = newUint8Array.byteLength; i < length_3; ++i) {
                    newUint8Array[i] = oldUint8Array[i];
                }
                this._arrayBuffer = newBuffer;
                this._dataView = new DataView(this._arrayBuffer);
            };
            /**
             * Get an array buffer with the length of the byte offset
             * @returns ArrayBuffer resized to the byte offset
             */
            _BinaryWriter.prototype.getArrayBuffer = function () {
                this.resizeBuffer(this.getByteOffset());
                return this._arrayBuffer;
            };
            /**
             * Get the byte offset of the array buffer
             * @returns byte offset
             */
            _BinaryWriter.prototype.getByteOffset = function () {
                return this._byteOffset;
            };
            /**
             * Stores an UInt8 in the array buffer
             * @param entry
             */
            _BinaryWriter.prototype.setUInt8 = function (entry) {
                if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                    this.resizeBuffer(this._arrayBuffer.byteLength * 2);
                }
                this._dataView.setUint8(this._byteOffset++, entry);
            };
            /**
             * Stores a Float32 in the array buffer
             * @param entry
             */
            _BinaryWriter.prototype.setFloat32 = function (entry) {
                if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                    this.resizeBuffer(this._arrayBuffer.byteLength * 2);
                }
                this._dataView.setFloat32(this._byteOffset, entry, true);
                this._byteOffset += 4;
            };
            /**
             * Stores an UInt32 in the array buffer
             * @param entry
             */
            _BinaryWriter.prototype.setUInt32 = function (entry) {
                if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                    this.resizeBuffer(this._arrayBuffer.byteLength * 2);
                }
                this._dataView.setUint32(this._byteOffset, entry, true);
                this._byteOffset += 4;
            };
            return _BinaryWriter;
        }());
        GLTF2._BinaryWriter = _BinaryWriter;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFExporter.js.map


var BABYLON;
(function (BABYLON) {
    /**
     * Class for holding and downloading glTF file data
     */
    var GLTFData = /** @class */ (function () {
        /**
         * Initializes the glTF file object
         */
        function GLTFData() {
            this.glTFFiles = {};
        }
        /**
         * Downloads the glTF data as files based on their names and data
         */
        GLTFData.prototype.downloadFiles = function () {
            /**
            * Checks for a matching suffix at the end of a string (for ES5 and lower)
            * @param str Source string
            * @param suffix Suffix to search for in the source string
            * @returns Boolean indicating whether the suffix was found (true) or not (false)
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
        return GLTFData;
    }());
    BABYLON.GLTFData = GLTFData;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFData.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * Interface for storing specular glossiness factors
         * @hidden
         */
        /**
         * Utility methods for working with glTF material conversion properties.  This class should only be used internally
         * @hidden
    
         */
        var _GLTFMaterial = /** @class */ (function () {
            function _GLTFMaterial() {
            }
            /**
             * Specifies if two colors are approximately equal in value
             * @param color1 first color to compare to
             * @param color2 second color to compare to
             * @param epsilon threshold value
             */
            _GLTFMaterial.FuzzyEquals = function (color1, color2, epsilon) {
                return BABYLON.Scalar.WithinEpsilon(color1.r, color2.r, epsilon) &&
                    BABYLON.Scalar.WithinEpsilon(color1.g, color2.g, epsilon) &&
                    BABYLON.Scalar.WithinEpsilon(color1.b, color2.b, epsilon);
            };
            /**
             * Gets the materials from a Babylon scene and converts them to glTF materials
             * @param scene babylonjs scene
             * @param mimeType texture mime type
             * @param images array of images
             * @param textures array of textures
             * @param materials array of materials
             * @param imageData mapping of texture names to base64 textures
             * @param hasTextureCoords specifies if texture coordinates are present on the material
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
                        BABYLON.Tools.Error("Unsupported material type: " + babylonMaterial.name);
                    }
                }
            };
            /**
             * Makes a copy of the glTF material without the texture parameters
             * @param originalMaterial original glTF material
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
             * Specifies if the material has any texture parameters present
             * @param material glTF Material
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
             * Converts a Babylon StandardMaterial to a glTF Metallic Roughness Material
             * @param babylonStandardMaterial
             * @returns glTF Metallic Roughness Material representation
             */
            _GLTFMaterial._ConvertToGLTFPBRMetallicRoughness = function (babylonStandardMaterial) {
                var P0 = new BABYLON.Vector2(0, 1);
                var P1 = new BABYLON.Vector2(0, 0.1);
                var P2 = new BABYLON.Vector2(0, 0.1);
                var P3 = new BABYLON.Vector2(1300, 0.1);
                /**
                 * Given the control points, solve for x based on a given t for a cubic bezier curve
                 * @param t a value between 0 and 1
                 * @param p0 first control point
                 * @param p1 second control point
                 * @param p2 third control point
                 * @param p3 fourth control point
                 * @returns number result of cubic bezier curve at the specified t
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
                 * and roughness on the ordinant axis (y-axis)
                 * @param specularPower specular power of standard material
                 * @returns Number representing the roughness value
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
             * @param diffuse diffused value
             * @param specular specular value
             * @param oneMinusSpecularStrength one minus the specular strength
             * @returns metallic value
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
             * @param babylonMaterial Babylon Material
             * @returns The Babylon alpha mode value
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
                            BABYLON.Tools.Error("Unsupported alpha mode " + babylonPBRMetallicRoughness.transparencyMode);
                            return null;
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
                            BABYLON.Tools.Error("Unsupported alpha mode " + babylonPBRMaterial.transparencyMode);
                            return null;
                        }
                    }
                }
                else {
                    BABYLON.Tools.Error("Unsupported Babylon material type");
                    return null;
                }
            };
            /**
             * Converts a Babylon Standard Material to a glTF Material
             * @param babylonStandardMaterial BJS Standard Material
             * @param mimeType mime type to use for the textures
             * @param images array of glTF image interfaces
             * @param textures array of glTF texture interfaces
             * @param materials array of glTF material interfaces
             * @param imageData map of image file name to data
             * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
             */
            _GLTFMaterial._ConvertStandardMaterial = function (babylonStandardMaterial, mimeType, images, textures, materials, imageData, hasTextureCoords) {
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
             * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
             * @param babylonPBRMetalRoughMaterial BJS PBR Metallic Roughness Material
             * @param mimeType mime type to use for the textures
             * @param images array of glTF image interfaces
             * @param textures array of glTF texture interfaces
             * @param materials array of glTF material interfaces
             * @param imageData map of image file name to data
             * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
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
                    if (alphaMode) {
                        if (alphaMode !== "OPAQUE" /* OPAQUE */) { //glTF defaults to opaque
                            glTFMaterial.alphaMode = alphaMode;
                            if (alphaMode === "BLEND" /* BLEND */) {
                                glTFMaterial.alphaCutoff = babylonPBRMetalRoughMaterial.alphaCutOff;
                            }
                        }
                    }
                }
                glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                materials.push(glTFMaterial);
            };
            /**
             * Converts an image typed array buffer to a base64 image
             * @param buffer typed array buffer
             * @param width width of the image
             * @param height height of the image
             * @param mimeType mimetype of the image
             * @returns base64 image string
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
             * Generates a white texture based on the specified width and height
             * @param width width of the texture in pixels
             * @param height height of the texture in pixels
             * @param scene babylonjs scene
             * @returns white texture
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
             * Resizes the two source textures to the same dimensions.  If a texture is null, a default white texture is generated.  If both textures are null, returns null
             * @param texture1 first texture to resize
             * @param texture2 second texture to resize
             * @param scene babylonjs scene
             * @returns resized textures or null
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
             * Convert Specular Glossiness Textures to Metallic Roughness
             * See link below for info on the material conversions from PBR Metallic/Roughness and Specular/Glossiness
             * @link https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness/examples/convert-between-workflows-bjs/js/babylon.pbrUtilities.js
             * @param diffuseTexture texture used to store diffuse information
             * @param specularGlossinessTexture texture used to store specular and glossiness information
             * @param factors specular glossiness material factors
             * @param mimeType the mime type to use for the texture
             * @returns pbr metallic roughness interface or null
             */
            _GLTFMaterial._ConvertSpecularGlossinessTexturesToMetallicRoughness = function (diffuseTexture, specularGlossinessTexture, factors, mimeType) {
                if (!(diffuseTexture || specularGlossinessTexture)) {
                    return null;
                }
                var scene = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture.getScene();
                if (!scene) {
                    BABYLON.Tools.Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
                    return null;
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
                    BABYLON.Tools.Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture1.name);
                    return null;
                }
                pixels = resizedTextures.texture2.readPixels();
                if (pixels instanceof Uint8Array) {
                    specularGlossinessBuffer = (resizedTextures.texture2.readPixels());
                }
                else {
                    BABYLON.Tools.Error("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Pixel array buffer type not supported for texture: " + resizedTextures.texture2.name);
                    return null;
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
             * Converts specular glossiness material properties to metallic roughness
             * @param specularGlossiness interface with specular glossiness material properties
             * @returns interface with metallic roughness material properties
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
             * Calculates the surface reflectance, independent of lighting conditions
             * @param color Color source to calculate brightness from
             * @returns number representing the perceived brightness, or zero if color is undefined
             */
            _GLTFMaterial._GetPerceivedBrightness = function (color) {
                if (color) {
                    return Math.sqrt(0.299 * color.r * color.r + 0.587 * color.g * color.g + 0.114 * color.b * color.b);
                }
                return 0;
            };
            /**
             * Returns the maximum color component value
             * @param color
             * @returns maximum color component value, or zero if color is null or undefined
             */
            _GLTFMaterial._GetMaxComponent = function (color) {
                if (color) {
                    return Math.max(color.r, Math.max(color.g, color.b));
                }
                return 0;
            };
            /**
             * Convert a PBRMaterial (Metallic/Roughness) to Metallic Roughness factors
             * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
             * @param mimeType mime type to use for the textures
             * @param images array of glTF image interfaces
             * @param textures array of glTF texture interfaces
             * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
             * @param imageData map of image file name to data
             * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
             * @returns glTF PBR Metallic Roughness factors
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
             * Convert a PBRMaterial (Specular/Glossiness) to Metallic Roughness factors
             * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
             * @param mimeType mime type to use for the textures
             * @param images array of glTF image interfaces
             * @param textures array of glTF texture interfaces
             * @param glTFPbrMetallicRoughness glTF PBR Metallic Roughness interface
             * @param imageData map of image file name to data
             * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
             * @returns glTF PBR Metallic Roughness factors
             */
            _GLTFMaterial._ConvertSpecGlossFactorsToMetallicRoughness = function (babylonPBRMaterial, mimeType, images, textures, glTFPbrMetallicRoughness, imageData, hasTextureCoords) {
                var specGloss = {
                    diffuseColor: babylonPBRMaterial.albedoColor || BABYLON.Color3.White(),
                    specularColor: babylonPBRMaterial.reflectivityColor || BABYLON.Color3.White(),
                    glossiness: babylonPBRMaterial.microSurface || 1,
                };
                if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                    BABYLON.Tools.Error("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture currently not supported");
                    return null;
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
             * Converts a Babylon PBR Metallic Roughness Material to a glTF Material
             * @param babylonPBRMaterial BJS PBR Metallic Roughness Material
             * @param mimeType mime type to use for the textures
             * @param images array of glTF image interfaces
             * @param textures array of glTF texture interfaces
             * @param materials array of glTF material interfaces
             * @param imageData map of image file name to data
             * @param hasTextureCoords specifies if texture coordinates are present on the submesh to determine if textures should be applied
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
                if (metallicRoughness) {
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
                        if (alphaMode) {
                            if (alphaMode !== "OPAQUE" /* OPAQUE */) { //glTF defaults to opaque
                                glTFMaterial.alphaMode = alphaMode;
                                if (alphaMode === "BLEND" /* BLEND */) {
                                    glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                                }
                            }
                        }
                    }
                    glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                    materials.push(glTFMaterial);
                }
            };
            _GLTFMaterial.GetPixelsFromTexture = function (babylonTexture) {
                var pixels = babylonTexture.textureType === BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT ? babylonTexture.readPixels() : babylonTexture.readPixels();
                return pixels;
            };
            /**
             * Extracts a texture from a Babylon texture into file data and glTF data
             * @param babylonTexture Babylon texture to extract
             * @param mimeType Mime Type of the babylonTexture
             * @param images Array of glTF images
             * @param textures Array of glTF textures
             * @param imageData map of image file name and data
             * @return glTF texture info, or null if the texture format is not supported
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
                    BABYLON.Tools.Error("Unsupported mime type " + mimeType);
                    return null;
                }
                textureName = baseFile + extension;
                var pixels = _GLTFMaterial.GetPixelsFromTexture(babylonTexture);
                var size = babylonTexture.getSize();
                var base64Data = this._CreateBase64FromCanvas(pixels, size.width, size.height, mimeType);
                return this._GetTextureInfoFromBase64(base64Data, textureName, mimeType, images, textures, imageData);
            };
            /**
             * Builds a texture from base64 string
             * @param base64Texture base64 texture string
             * @param textureName Name to use for the texture
             * @param mimeType image mime type for the texture
             * @param images array of images
             * @param textures array of textures
             * @param imageData map of image data
             * @returns glTF texture info, or null if the texture format is not supported
             */
            _GLTFMaterial._GetTextureInfoFromBase64 = function (base64Texture, textureName, mimeType, images, textures, imageData) {
                var textureInfo = null;
                var glTFTexture = {
                    source: images.length
                };
                var binStr = atob(base64Texture.split(',')[1]);
                var arrBuff = new ArrayBuffer(binStr.length);
                var arr = new Uint8Array(arrBuff);
                for (var i = 0, length_1 = binStr.length; i < length_1; ++i) {
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
             * Represents the dielectric specular values for R, G and B
             */
            _GLTFMaterial._dielectricSpecular = new BABYLON.Color3(0.04, 0.04, 0.04);
            /**
             * Allows the maximum specular power to be defined for material calculations
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


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * @hidden
         * Enum for handling in tangent and out tangent.
         */
        var _TangentType;
        (function (_TangentType) {
            /**
             * Specifies that input tangents are used.
             */
            _TangentType[_TangentType["INTANGENT"] = 0] = "INTANGENT";
            /**
             * Specifies that output tangents are used.
             */
            _TangentType[_TangentType["OUTTANGENT"] = 1] = "OUTTANGENT";
        })(_TangentType || (_TangentType = {}));
        /**
         * @hidden
         * Utility class for generating glTF animation data from BabylonJS.
         */
        var _GLTFAnimation = /** @class */ (function () {
            function _GLTFAnimation() {
            }
            /**
             *
             * Creates glTF channel animation from BabylonJS animation.
             * @param babylonMesh - BabylonJS mesh.
             * @param animation - animation.
             * @param animationChannelTargetPath - The target animation channel.
             * @param convertToRightHandedSystem - Specifies if the values should be converted to right-handed.
             * @param useQuaternion - Specifies if quaternions are used.
             * @returns nullable IAnimationData
             */
            _GLTFAnimation._CreateNodeAnimation = function (babylonMesh, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate) {
                var inputs = [];
                var outputs = [];
                var keyFrames = animation.getKeys();
                var minMaxKeyFrames = _GLTFAnimation.calculateMinMaxKeyFrames(keyFrames);
                var interpolationOrBake = _GLTFAnimation._DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);
                var frameDelta = minMaxKeyFrames.max - minMaxKeyFrames.min;
                var interpolation = interpolationOrBake.interpolationType;
                var shouldBakeAnimation = interpolationOrBake.shouldBakeAnimation;
                if (shouldBakeAnimation) {
                    _GLTFAnimation._CreateBakedAnimation(babylonMesh, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
                }
                else {
                    if (interpolation === "LINEAR" /* LINEAR */ || interpolation === "STEP" /* STEP */) {
                        _GLTFAnimation._CreateLinearOrStepAnimation(babylonMesh, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                    }
                    else if (interpolation === "CUBICSPLINE" /* CUBICSPLINE */) {
                        _GLTFAnimation._CreateCubicSplineAnimation(babylonMesh, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                    }
                    else {
                        _GLTFAnimation._CreateBakedAnimation(babylonMesh, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
                    }
                }
                if (inputs.length && outputs.length) {
                    var result = {
                        inputs: inputs,
                        outputs: outputs,
                        samplerInterpolation: interpolation,
                        inputsMin: shouldBakeAnimation ? minMaxKeyFrames.min : BABYLON.Tools.FloatRound(minMaxKeyFrames.min / animation.framePerSecond),
                        inputsMax: shouldBakeAnimation ? minMaxKeyFrames.max : BABYLON.Tools.FloatRound(minMaxKeyFrames.max / animation.framePerSecond)
                    };
                    return result;
                }
                return null;
            };
            _GLTFAnimation._DeduceAnimationInfo = function (animation) {
                var animationChannelTargetPath = null;
                var dataAccessorType = "VEC3" /* VEC3 */;
                var useQuaternion = false;
                var property = animation.targetProperty.split('.');
                switch (property[0]) {
                    case 'scaling': {
                        animationChannelTargetPath = "scale" /* SCALE */;
                        break;
                    }
                    case 'position': {
                        animationChannelTargetPath = "translation" /* TRANSLATION */;
                        break;
                    }
                    case 'rotation': {
                        dataAccessorType = "VEC4" /* VEC4 */;
                        animationChannelTargetPath = "rotation" /* ROTATION */;
                        break;
                    }
                    case 'rotationQuaternion': {
                        dataAccessorType = "VEC4" /* VEC4 */;
                        useQuaternion = true;
                        animationChannelTargetPath = "rotation" /* ROTATION */;
                        break;
                    }
                    default: {
                        BABYLON.Tools.Error("Unsupported animatable property " + property[0]);
                    }
                }
                if (animationChannelTargetPath) {
                    return { animationChannelTargetPath: animationChannelTargetPath, dataAccessorType: dataAccessorType, useQuaternion: useQuaternion };
                }
                else {
                    BABYLON.Tools.Error('animation channel target path and data accessor type could be deduced');
                }
                return null;
            };
            /**
             *
             * @param babylonMesh
             * @param runtimeGLTFAnimation
             * @param idleGLTFAnimations
             * @param nodeMap
             * @param nodes
             * @param binaryWriter
             * @param bufferViews
             * @param accessors
             * @param convertToRightHandedSystem
             */
            _GLTFAnimation._CreateNodeAnimationFromMeshAnimations = function (babylonMesh, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, nodes, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationSampleRate) {
                var glTFAnimation;
                if (babylonMesh.animations) {
                    babylonMesh.animations.forEach(function (animation) {
                        var animationInfo = _GLTFAnimation._DeduceAnimationInfo(animation);
                        if (animationInfo) {
                            glTFAnimation = {
                                name: animation.name,
                                samplers: [],
                                channels: []
                            };
                            _GLTFAnimation.AddAnimation("" + animation.name, animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation, babylonMesh, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationInfo.useQuaternion, animationSampleRate);
                            if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
                                idleGLTFAnimations.push(glTFAnimation);
                            }
                        }
                    });
                }
            };
            /**
             *
             * @param babylonScene
             * @param glTFAnimations
             * @param nodeMap
             * @param nodes
             * @param binaryWriter
             * @param bufferViews
             * @param accessors
             * @param convertToRightHandedSystem
             */
            _GLTFAnimation._CreateNodeAnimationFromAnimationGroups = function (babylonScene, glTFAnimations, nodeMap, nodes, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationSampleRate) {
                var glTFAnimation;
                if (babylonScene.animationGroups) {
                    var animationGroups = babylonScene.animationGroups;
                    animationGroups.forEach(function (animationGroup) {
                        glTFAnimation = {
                            name: animationGroup.name,
                            channels: [],
                            samplers: []
                        };
                        animationGroup.targetedAnimations.forEach(function (targetAnimation) {
                            var target = targetAnimation.target;
                            var animation = targetAnimation.animation;
                            if (target instanceof BABYLON.Mesh) {
                                var animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
                                if (animationInfo) {
                                    var babylonMesh = target;
                                    _GLTFAnimation.AddAnimation("" + animation.name, glTFAnimation, babylonMesh, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationInfo.useQuaternion, animationSampleRate);
                                }
                            }
                        });
                        if (glTFAnimation.channels.length && glTFAnimation.samplers.length) {
                            glTFAnimations.push(glTFAnimation);
                        }
                    });
                }
            };
            _GLTFAnimation.AddAnimation = function (name, glTFAnimation, babylonMesh, animation, dataAccessorType, animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, useQuaternion, animationSampleRate) {
                var animationData = _GLTFAnimation._CreateNodeAnimation(babylonMesh, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate);
                var bufferView;
                var accessor;
                var keyframeAccessorIndex;
                var dataAccessorIndex;
                var outputLength;
                var animationSampler;
                var animationChannel;
                if (animationData) {
                    var nodeIndex = nodeMap[babylonMesh.uniqueId];
                    // Creates buffer view and accessor for key frames.
                    var byteLength = animationData.inputs.length * 4;
                    bufferView = GLTF2._GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, name + "  keyframe data view");
                    bufferViews.push(bufferView);
                    animationData.inputs.forEach(function (input) {
                        binaryWriter.setFloat32(input);
                    });
                    accessor = GLTF2._GLTFUtilities.CreateAccessor(bufferViews.length - 1, name + "  keyframes", "SCALAR" /* SCALAR */, 5126 /* FLOAT */, animationData.inputs.length, null, [animationData.inputsMin], [animationData.inputsMax]);
                    accessors.push(accessor);
                    keyframeAccessorIndex = accessors.length - 1;
                    // create bufferview and accessor for keyed values.
                    outputLength = animationData.outputs.length;
                    byteLength = dataAccessorType === "VEC3" /* VEC3 */ ? animationData.outputs.length * 12 : animationData.outputs.length * 16;
                    // check for in and out tangents
                    bufferView = GLTF2._GLTFUtilities.CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, name + "  data view");
                    bufferViews.push(bufferView);
                    animationData.outputs.forEach(function (output) {
                        output.forEach(function (entry) {
                            binaryWriter.setFloat32(entry);
                        });
                    });
                    accessor = GLTF2._GLTFUtilities.CreateAccessor(bufferViews.length - 1, name + "  data", dataAccessorType, 5126 /* FLOAT */, outputLength, null, null, null);
                    accessors.push(accessor);
                    dataAccessorIndex = accessors.length - 1;
                    // create sampler
                    animationSampler = {
                        interpolation: animationData.samplerInterpolation,
                        input: keyframeAccessorIndex,
                        output: dataAccessorIndex
                    };
                    glTFAnimation.samplers.push(animationSampler);
                    // create channel
                    animationChannel = {
                        sampler: glTFAnimation.samplers.length - 1,
                        target: {
                            node: nodeIndex,
                            path: animationChannelTargetPath
                        }
                    };
                    glTFAnimation.channels.push(animationChannel);
                }
            };
            /**
             * Create a baked animation
             * @param babylonMesh BabylonJS mesh
             * @param animation BabylonJS animation corresponding to the BabylonJS mesh
             * @param animationChannelTargetPath animation target channel
             * @param minFrame minimum animation frame
             * @param maxFrame maximum animation frame
             * @param fps frames per second of the animation
             * @param inputs input key frames of the animation
             * @param outputs output key frame data of the animation
             * @param convertToRightHandedSystem converts the values to right-handed
             * @param useQuaternion specifies if quaternions should be used
             */
            _GLTFAnimation._CreateBakedAnimation = function (babylonMesh, animation, animationChannelTargetPath, minFrame, maxFrame, fps, sampleRate, inputs, outputs, minMaxFrames, convertToRightHandedSystem, useQuaternion) {
                var value;
                var quaternionCache = BABYLON.Quaternion.Identity();
                var previousTime = null;
                var time;
                var maxUsedFrame = null;
                var currKeyFrame = null;
                var nextKeyFrame = null;
                var prevKeyFrame = null;
                var endFrame = null;
                minMaxFrames.min = BABYLON.Tools.FloatRound(minFrame / fps);
                var keyFrames = animation.getKeys();
                for (var i = 0, length_1 = keyFrames.length; i < length_1; ++i) {
                    endFrame = null;
                    currKeyFrame = keyFrames[i];
                    if (i + 1 < length_1) {
                        nextKeyFrame = keyFrames[i + 1];
                        if (currKeyFrame.value.equals(nextKeyFrame.value)) {
                            if (i === 0) { // set the first frame to itself
                                endFrame = currKeyFrame.frame;
                            }
                            else {
                                continue;
                            }
                        }
                        else {
                            endFrame = nextKeyFrame.frame;
                        }
                    }
                    else {
                        // at the last key frame
                        prevKeyFrame = keyFrames[i - 1];
                        if (currKeyFrame.value.equals(prevKeyFrame.value)) {
                            continue;
                        }
                        else {
                            endFrame = maxFrame;
                        }
                    }
                    if (endFrame) {
                        for (var f = currKeyFrame.frame; f <= endFrame; f += sampleRate) {
                            time = BABYLON.Tools.FloatRound(f / fps);
                            if (time === previousTime) {
                                continue;
                            }
                            previousTime = time;
                            maxUsedFrame = time;
                            value = animation._interpolate(f, 0, undefined, animation.loopMode);
                            _GLTFAnimation._SetInterpolatedValue(babylonMesh, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                        }
                    }
                }
                if (maxUsedFrame) {
                    minMaxFrames.max = maxUsedFrame;
                }
            };
            _GLTFAnimation._ConvertFactorToVector3OrQuaternion = function (factor, babylonMesh, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion) {
                var property;
                var componentName;
                var value = null;
                var basePositionRotationOrScale = _GLTFAnimation._GetBasePositionRotationOrScale(babylonMesh, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
                if (animationType === BABYLON.Animation.ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
                    property = animation.targetProperty.split('.');
                    componentName = property ? property[1] : ''; // x, y, or z component
                    value = useQuaternion ? BABYLON.Quaternion.FromArray(basePositionRotationOrScale).normalize() : BABYLON.Vector3.FromArray(basePositionRotationOrScale);
                    switch (componentName) {
                        case 'x':
                        case 'y': {
                            value[componentName] = (convertToRightHandedSystem && useQuaternion) ? -factor : factor;
                            break;
                        }
                        case 'z': {
                            value[componentName] = (convertToRightHandedSystem && !useQuaternion && !(animationChannelTargetPath === "scale" /* SCALE */)) ? -factor : factor;
                            break;
                        }
                        case 'w': {
                            value.w = factor;
                            break;
                        }
                        default: {
                            BABYLON.Tools.Error("glTFAnimation: Unsupported component type \"" + componentName + "\" for scale animation!");
                        }
                    }
                }
                return value;
            };
            _GLTFAnimation._SetInterpolatedValue = function (babylonMesh, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
                var animationType = animation.dataType;
                var cacheValue;
                inputs.push(time);
                if (typeof value === "number") {
                    value = this._ConvertFactorToVector3OrQuaternion(value, babylonMesh, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
                }
                if (value) {
                    if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                        if (useQuaternion) {
                            quaternionCache = value;
                        }
                        else {
                            cacheValue = value;
                            BABYLON.Quaternion.RotationYawPitchRollToRef(cacheValue.y, cacheValue.x, cacheValue.z, quaternionCache);
                        }
                        if (convertToRightHandedSystem) {
                            quaternionCache.x *= -1;
                            quaternionCache.y *= -1;
                            outputs.push(quaternionCache.asArray());
                        }
                    }
                    else {
                        cacheValue = value;
                        if (convertToRightHandedSystem && (animationChannelTargetPath !== "scale" /* SCALE */)) {
                            cacheValue.z *= -1;
                        }
                        outputs.push(cacheValue.asArray());
                    }
                }
            };
            /**
             * Creates linear animation from the animation key frames
             * @param babylonMesh BabylonJS mesh
             * @param animation BabylonJS animation
             * @param animationChannelTargetPath The target animation channel
             * @param frameDelta The difference between the last and first frame of the animation
             * @param inputs Array to store the key frame times
             * @param outputs Array to store the key frame data
             * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
             * @param useQuaternion Specifies if quaternions are used in the animation
             */
            _GLTFAnimation._CreateLinearOrStepAnimation = function (babylonMesh, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
                animation.getKeys().forEach(function (keyFrame) {
                    inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
                    _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonMesh, convertToRightHandedSystem, useQuaternion);
                });
            };
            /**
             * Creates cubic spline animation from the animation key frames
             * @param babylonMesh BabylonJS mesh
             * @param animation BabylonJS animation
             * @param animationChannelTargetPath The target animation channel
             * @param frameDelta The difference between the last and first frame of the animation
             * @param inputs Array to store the key frame times
             * @param outputs Array to store the key frame data
             * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
             * @param useQuaternion Specifies if quaternions are used in the animation
             */
            _GLTFAnimation._CreateCubicSplineAnimation = function (babylonMesh, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
                animation.getKeys().forEach(function (keyFrame) {
                    inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
                    _GLTFAnimation.AddSplineTangent(_TangentType.INTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* CUBICSPLINE */, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
                    _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonMesh, convertToRightHandedSystem, useQuaternion);
                    _GLTFAnimation.AddSplineTangent(_TangentType.OUTTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* CUBICSPLINE */, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
                });
            };
            _GLTFAnimation._GetBasePositionRotationOrScale = function (babylonMesh, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion) {
                var basePositionRotationOrScale;
                if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                    if (useQuaternion) {
                        if (babylonMesh.rotationQuaternion) {
                            basePositionRotationOrScale = babylonMesh.rotationQuaternion.asArray();
                            if (convertToRightHandedSystem) {
                                basePositionRotationOrScale[0] *= -1;
                                basePositionRotationOrScale[1] *= -1;
                            }
                        }
                        else {
                            basePositionRotationOrScale = BABYLON.Quaternion.Identity().asArray();
                        }
                    }
                    else {
                        basePositionRotationOrScale = babylonMesh.rotation.asArray();
                        basePositionRotationOrScale[2] *= -1;
                    }
                }
                else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                    basePositionRotationOrScale = babylonMesh.position.asArray();
                    if (convertToRightHandedSystem) {
                        basePositionRotationOrScale[2] *= -1;
                    }
                }
                else { // scale
                    basePositionRotationOrScale = babylonMesh.scaling.asArray();
                }
                return basePositionRotationOrScale;
            };
            /**
             * Adds a key frame value
             * @param keyFrame
             * @param animation
             * @param outputs
             * @param animationChannelTargetPath
             * @param basePositionRotationOrScale
             * @param convertToRightHandedSystem
             * @param useQuaternion
             */
            _GLTFAnimation._AddKeyframeValue = function (keyFrame, animation, outputs, animationChannelTargetPath, babylonMesh, convertToRightHandedSystem, useQuaternion) {
                var value;
                var newPositionRotationOrScale;
                var animationType = animation.dataType;
                if (animationType === BABYLON.Animation.ANIMATIONTYPE_VECTOR3) {
                    value = keyFrame.value.asArray();
                    if (convertToRightHandedSystem && !(animationChannelTargetPath === "scale" /* SCALE */)) {
                        value[2] *= -1;
                    }
                    if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                        outputs.push(BABYLON.Vector3.FromArray(value).toQuaternion().asArray());
                    }
                    else {
                        outputs.push(value); // scale or position vector.
                    }
                }
                else if (animationType === BABYLON.Animation.ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
                    newPositionRotationOrScale = this._ConvertFactorToVector3OrQuaternion(keyFrame.value, babylonMesh, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
                    if (newPositionRotationOrScale) {
                        if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                            useQuaternion ? outputs.push(newPositionRotationOrScale.normalize().asArray()) : outputs.push(newPositionRotationOrScale.toQuaternion().normalize().asArray());
                        }
                        else {
                            outputs.push(newPositionRotationOrScale.asArray());
                        }
                    }
                }
                else if (animationType === BABYLON.Animation.ANIMATIONTYPE_QUATERNION) {
                    value = keyFrame.value.normalize().asArray();
                    if (convertToRightHandedSystem) {
                        value[0] *= -1;
                        value[1] *= -1;
                    }
                    outputs.push(value);
                }
                else {
                    BABYLON.Tools.Error('glTFAnimation: Unsupported key frame values for animation!');
                }
            };
            _GLTFAnimation._DeduceInterpolation = function (keyFrames, animationChannelTargetPath, useQuaternion) {
                var interpolationType;
                var shouldBakeAnimation = false;
                var key;
                if (animationChannelTargetPath === "rotation" /* ROTATION */ && !useQuaternion) {
                    return { interpolationType: "LINEAR" /* LINEAR */, shouldBakeAnimation: true };
                }
                for (var i = 0, length_2 = keyFrames.length; i < length_2; ++i) {
                    key = keyFrames[i];
                    if (key.inTangent || key.outTangent) {
                        if (interpolationType) {
                            if (interpolationType !== "CUBICSPLINE" /* CUBICSPLINE */) {
                                interpolationType = "LINEAR" /* LINEAR */;
                                shouldBakeAnimation = true;
                                break;
                            }
                        }
                        else {
                            interpolationType = "CUBICSPLINE" /* CUBICSPLINE */;
                        }
                    }
                    else {
                        if (interpolationType) {
                            if (interpolationType === "CUBICSPLINE" /* CUBICSPLINE */ ||
                                (key.interpolation && (key.interpolation === BABYLON.AnimationKeyInterpolation.STEP) && interpolationType !== "STEP" /* STEP */)) {
                                interpolationType = "LINEAR" /* LINEAR */;
                                shouldBakeAnimation = true;
                                break;
                            }
                        }
                        else {
                            if (key.interpolation && (key.interpolation === BABYLON.AnimationKeyInterpolation.STEP)) {
                                interpolationType = "STEP" /* STEP */;
                            }
                            else {
                                interpolationType = "LINEAR" /* LINEAR */;
                            }
                        }
                    }
                }
                if (!interpolationType) {
                    interpolationType = "LINEAR" /* LINEAR */;
                }
                return { interpolationType: interpolationType, shouldBakeAnimation: shouldBakeAnimation };
            };
            /**
             * Adds an input tangent or output tangent to the output data
             * If an input tangent or output tangent is missing, it uses the zero vector or zero quaternion
             * @param tangentType Specifies which type of tangent to handle (inTangent or outTangent)
             * @param outputs The animation data by keyframe
             * @param animationChannelTargetPath The target animation channel
             * @param interpolation The interpolation type
             * @param keyFrame The key frame with the animation data
             * @param frameDelta Time difference between two frames used to scale the tangent by the frame delta
             * @param useQuaternion Specifies if quaternions are used
             * @param convertToRightHandedSystem Specifies if the values should be converted to right-handed
             */
            _GLTFAnimation.AddSplineTangent = function (tangentType, outputs, animationChannelTargetPath, interpolation, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem) {
                var tangent;
                var tangentValue = tangentType === _TangentType.INTANGENT ? keyFrame.inTangent : keyFrame.outTangent;
                if (interpolation === "CUBICSPLINE" /* CUBICSPLINE */) {
                    if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                        if (tangentValue) {
                            tangent = useQuaternion ? tangentValue.scale(frameDelta).asArray() : tangentValue.scale(frameDelta).toQuaternion().asArray();
                            if (convertToRightHandedSystem) {
                                tangent[0] *= -1;
                                tangent[1] *= -1;
                            }
                        }
                        else {
                            tangent = [0, 0, 0, 0];
                        }
                    }
                    else {
                        if (tangentValue) {
                            tangent = tangentValue.scale(frameDelta).asArray();
                            if (convertToRightHandedSystem) {
                                tangent[2] *= -1;
                            }
                        }
                        else {
                            tangent = [0, 0, 0];
                        }
                    }
                    outputs.push(tangent);
                }
            };
            /**
             * Get the minimum and maximum key frames' frame values
             * @param keyFrames animation key frames
             * @returns the minimum and maximum key frame value
             */
            _GLTFAnimation.calculateMinMaxKeyFrames = function (keyFrames) {
                var min = Infinity;
                var max = -Infinity;
                keyFrames.forEach(function (keyFrame) {
                    min = Math.min(min, keyFrame.frame);
                    max = Math.max(max, keyFrame.frame);
                });
                return { min: min, max: max };
            };
            return _GLTFAnimation;
        }());
        GLTF2._GLTFAnimation = _GLTFAnimation;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFAnimation.js.map


var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
         * @hidden
         */
        var _GLTFUtilities = /** @class */ (function () {
            function _GLTFUtilities() {
            }
            /**
             * Creates a buffer view based on the supplied arguments
             * @param bufferIndex index value of the specified buffer
             * @param byteOffset byte offset value
             * @param byteLength byte length of the bufferView
             * @param byteStride byte distance between conequential elements
             * @param name name of the buffer view
             * @returns bufferView for glTF
             */
            _GLTFUtilities.CreateBufferView = function (bufferIndex, byteOffset, byteLength, byteStride, name) {
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
             * @param bufferviewIndex The index of the bufferview referenced by this accessor
             * @param name The name of the accessor
             * @param type The type of the accessor
             * @param componentType The datatype of components in the attribute
             * @param count The number of attributes referenced by this accessor
             * @param byteOffset The offset relative to the start of the bufferView in bytes
             * @param min Minimum value of each component in this attribute
             * @param max Maximum value of each component in this attribute
             * @returns accessor for glTF
             */
            _GLTFUtilities.CreateAccessor = function (bufferviewIndex, name, type, componentType, count, byteOffset, min, max) {
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
             * Calculates the minimum and maximum values of an array of position floats
             * @param positions Positions array of a mesh
             * @param vertexStart Starting vertex offset to calculate min and max values
             * @param vertexCount Number of vertices to check for min and max values
             * @returns min number array and max number array
             */
            _GLTFUtilities.CalculateMinMaxPositions = function (positions, vertexStart, vertexCount, convertToRightHandedSystem) {
                var min = [Infinity, Infinity, Infinity];
                var max = [-Infinity, -Infinity, -Infinity];
                var positionStrideSize = 3;
                var indexOffset;
                var position;
                var vector;
                if (vertexCount) {
                    for (var i = vertexStart, length_1 = vertexStart + vertexCount; i < length_1; ++i) {
                        indexOffset = positionStrideSize * i;
                        position = BABYLON.Vector3.FromArray(positions, indexOffset);
                        if (convertToRightHandedSystem) {
                            _GLTFUtilities.GetRightHandedVector3FromRef(position);
                        }
                        vector = position.asArray();
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
             * Converts a new right-handed Vector3
             * @param vector vector3 array
             * @returns right-handed Vector3
             */
            _GLTFUtilities.GetRightHandedVector3 = function (vector) {
                return new BABYLON.Vector3(vector.x, vector.y, -vector.z);
            };
            /**
             * Converts a Vector3 to right-handed
             * @param vector Vector3 to convert to right-handed
             */
            _GLTFUtilities.GetRightHandedVector3FromRef = function (vector) {
                vector.z *= -1;
            };
            /**
             * Converts a Vector4 to right-handed
             * @param vector Vector4 to convert to right-handed
             */
            _GLTFUtilities.GetRightHandedVector4FromRef = function (vector) {
                vector.z *= -1;
                vector.w *= -1;
            };
            /**
             * Converts a Quaternion to right-handed
             * @param quaternion Source quaternion to convert to right-handed
             */
            _GLTFUtilities.GetRightHandedQuaternionFromRef = function (quaternion) {
                quaternion.x *= -1;
                quaternion.y *= -1;
            };
            return _GLTFUtilities;
        }());
        GLTF2._GLTFUtilities = _GLTFUtilities;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFUtilities.js.map

    

    return BABYLON;
});
