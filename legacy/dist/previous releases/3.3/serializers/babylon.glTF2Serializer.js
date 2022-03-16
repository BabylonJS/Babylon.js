BABYLON.Effect.ShadersStore['textureTransformPixelShader'] = "precision highp float;\nvarying vec2 vUV;\nuniform sampler2D textureSampler;\nuniform mat4 textureTransformMat;\nvoid main(void) {\nvec2 uvTransformed=(textureTransformMat*vec4(vUV.xy,1,1)).xy;\ngl_FragColor=texture2D(textureSampler,uvTransformed);\n}";

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    /**
     * Class for generating glTF data from a Babylon scene.
     */
    var GLTF2Export = /** @class */ (function () {
        function GLTF2Export() {
        }
        /**
         * Exports the geometry of the scene to .gltf file format asynchronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating the glTF file
         * @param options Exporter options
         * @returns Returns an object with a .gltf file and associates texture names
         * as keys and their data and paths as values
         */
        GLTF2Export.GLTFAsync = function (scene, filePrefix, options) {
            return scene.whenReadyAsync().then(function () {
                var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
                var gltfGenerator = new BABYLON.GLTF2.Exporter._Exporter(scene, options);
                return gltfGenerator._generateGLTFAsync(glTFPrefix);
            });
        };
        GLTF2Export._PreExportAsync = function (scene, options) {
            return Promise.resolve().then(function () {
                if (options && options.exportWithoutWaitingForScene) {
                    return Promise.resolve();
                }
                else {
                    return scene.whenReadyAsync();
                }
            });
        };
        GLTF2Export._PostExportAsync = function (scene, glTFData, options) {
            return Promise.resolve().then(function () {
                if (options && options.exportWithoutWaitingForScene) {
                    return glTFData;
                }
                else {
                    return glTFData;
                }
            });
        };
        /**
         * Exports the geometry of the scene to .glb file format asychronously
         * @param scene Babylon scene with scene hierarchy information
         * @param filePrefix File prefix to use when generating glb file
         * @param options Exporter options
         * @returns Returns an object with a .glb filename as key and data as value
         */
        GLTF2Export.GLBAsync = function (scene, filePrefix, options) {
            var _this = this;
            return this._PreExportAsync(scene, options).then(function () {
                var glTFPrefix = filePrefix.replace(/\.[^/.]+$/, "");
                var gltfGenerator = new BABYLON.GLTF2.Exporter._Exporter(scene, options);
                return gltfGenerator._generateGLBAsync(glTFPrefix).then(function (glTFData) {
                    return _this._PostExportAsync(scene, glTFData, options);
                });
            });
        };
        return GLTF2Export;
    }());
    BABYLON.GLTF2Export = GLTF2Export;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFSerializer.js.map

/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Exporter;
        (function (Exporter) {
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
                    this._extensions = {};
                    this._asset = { generator: "BabylonJS", version: "2.0" };
                    this._extensionsUsed = [];
                    this._extensionsRequired = [];
                    this._babylonScene = babylonScene;
                    this._bufferViews = [];
                    this._accessors = [];
                    this._meshes = [];
                    this._scenes = [];
                    this._nodes = [];
                    this._images = [];
                    this._materials = [];
                    this._materialMap = [];
                    this._textures = [];
                    this._samplers = [];
                    this._animations = [];
                    this._imageData = {};
                    this._convertToRightHandedSystem = this._babylonScene.useRightHandedSystem ? false : true;
                    var _options = options || {};
                    this._shouldExportTransformNode = _options.shouldExportTransformNode ? _options.shouldExportTransformNode : function (babylonTransformNode) { return true; };
                    this._animationSampleRate = _options.animationSampleRate ? _options.animationSampleRate : 1 / 60;
                    this._glTFMaterialExporter = new Exporter._GLTFMaterialExporter(this);
                    this._loadExtensions();
                }
                _Exporter.prototype._applyExtensions = function (property, actionAsync) {
                    for (var _i = 0, _a = _Exporter._ExtensionNames; _i < _a.length; _i++) {
                        var name_1 = _a[_i];
                        var extension = this._extensions[name_1];
                        if (extension.enabled) {
                            var exporterProperty = property;
                            exporterProperty._activeLoaderExtensions = exporterProperty._activeLoaderExtensions || {};
                            var activeLoaderExtensions = exporterProperty._activeLoaderExtensions;
                            if (!activeLoaderExtensions[name_1]) {
                                activeLoaderExtensions[name_1] = true;
                                try {
                                    var result = actionAsync(extension);
                                    if (result) {
                                        return result;
                                    }
                                }
                                finally {
                                    delete activeLoaderExtensions[name_1];
                                    delete exporterProperty._activeLoaderExtensions;
                                }
                            }
                        }
                    }
                    return null;
                };
                _Exporter.prototype._extensionsPreExportTextureAsync = function (context, babylonTexture, mimeType) {
                    return this._applyExtensions(babylonTexture, function (extension) { return extension.preExportTextureAsync && extension.preExportTextureAsync(context, babylonTexture, mimeType); });
                };
                _Exporter.prototype._extensionsPostExportMeshPrimitiveAsync = function (context, meshPrimitive, babylonSubMesh, binaryWriter) {
                    return this._applyExtensions(meshPrimitive, function (extension) { return extension.postExportMeshPrimitiveAsync && extension.postExportMeshPrimitiveAsync(context, meshPrimitive, babylonSubMesh, binaryWriter); });
                };
                /**
                 * Load glTF serializer extensions
                 */
                _Exporter.prototype._loadExtensions = function () {
                    for (var _i = 0, _a = _Exporter._ExtensionNames; _i < _a.length; _i++) {
                        var name_2 = _a[_i];
                        var extension = _Exporter._ExtensionFactories[name_2](this);
                        this._extensions[name_2] = extension;
                    }
                };
                /**
                 * Registers a glTF exporter extension
                 * @param name Name of the extension to export
                 * @param factory The factory function that creates the exporter extension
                 */
                _Exporter.RegisterExtension = function (name, factory) {
                    if (_Exporter.UnregisterExtension(name)) {
                        BABYLON.Tools.Warn("Extension with the name " + name + " already exists");
                    }
                    _Exporter._ExtensionFactories[name] = factory;
                    _Exporter._ExtensionNames.push(name);
                };
                /**
                 * Un-registers an exporter extension
                 * @param name The name fo the exporter extension
                 * @returns A boolean indicating whether the extension has been un-registered
                 */
                _Exporter.UnregisterExtension = function (name) {
                    if (!_Exporter._ExtensionFactories[name]) {
                        return false;
                    }
                    delete _Exporter._ExtensionFactories[name];
                    var index = _Exporter._ExtensionNames.indexOf(name);
                    if (index !== -1) {
                        _Exporter._ExtensionNames.splice(index, 1);
                    }
                    return true;
                };
                /**
                 * Lazy load a local engine with premultiplied alpha set to false
                 */
                _Exporter.prototype._getLocalEngine = function () {
                    if (!this._localEngine) {
                        var localCanvas = document.createElement('canvas');
                        localCanvas.id = "WriteCanvas";
                        localCanvas.width = 2048;
                        localCanvas.height = 2048;
                        this._localEngine = new BABYLON.Engine(localCanvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true });
                        this._localEngine.setViewport(new BABYLON.Viewport(0, 0, 1, 1));
                    }
                    return this._localEngine;
                };
                _Exporter.prototype.reorderIndicesBasedOnPrimitiveMode = function (submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter) {
                    switch (primitiveMode) {
                        case BABYLON.Material.TriangleFillMode: {
                            if (!byteOffset) {
                                byteOffset = 0;
                            }
                            for (var i = submesh.indexStart, length_1 = submesh.indexStart + submesh.indexCount; i < length_1; i = i + 3) {
                                var index = byteOffset + i * 4;
                                // swap the second and third indices
                                var secondIndex = binaryWriter.getUInt32(index + 4);
                                var thirdIndex = binaryWriter.getUInt32(index + 8);
                                binaryWriter.setUInt32(thirdIndex, index + 4);
                                binaryWriter.setUInt32(secondIndex, index + 8);
                            }
                            break;
                        }
                        case BABYLON.Material.TriangleFanDrawMode: {
                            for (var i = submesh.indexStart + submesh.indexCount - 1, start = submesh.indexStart; i >= start; --i) {
                                binaryWriter.setUInt32(babylonIndices[i], byteOffset);
                                byteOffset += 4;
                            }
                            break;
                        }
                        case BABYLON.Material.TriangleStripDrawMode: {
                            if (submesh.indexCount >= 3) {
                                binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 2], byteOffset + 4);
                                binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 1], byteOffset + 8);
                            }
                            break;
                        }
                    }
                };
                /**
                 * Reorders the vertex attribute data based on the primitive mode.  This is necessary when indices are not available and the winding order is
                 * clock-wise during export to glTF
                 * @param submesh BabylonJS submesh
                 * @param primitiveMode Primitive mode of the mesh
                 * @param sideOrientation the winding order of the submesh
                 * @param vertexBufferKind The type of vertex attribute
                 * @param meshAttributeArray The vertex attribute data
                 * @param byteOffset The offset to the binary data
                 * @param binaryWriter The binary data for the glTF file
                 */
                _Exporter.prototype.reorderVertexAttributeDataBasedOnPrimitiveMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
                    if (this._convertToRightHandedSystem && sideOrientation === BABYLON.Material.ClockWiseSideOrientation) {
                        switch (primitiveMode) {
                            case BABYLON.Material.TriangleFillMode: {
                                this.reorderTriangleFillMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                                break;
                            }
                            case BABYLON.Material.TriangleStripDrawMode: {
                                this.reorderTriangleStripDrawMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                                break;
                            }
                            case BABYLON.Material.TriangleFanDrawMode: {
                                this.reorderTriangleFanMode(submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                                break;
                            }
                        }
                    }
                };
                /**
                 * Reorders the vertex attributes in the correct triangle mode order .  This is necessary when indices are not available and the winding order is
                 * clock-wise during export to glTF
                 * @param submesh BabylonJS submesh
                 * @param primitiveMode Primitive mode of the mesh
                 * @param sideOrientation the winding order of the submesh
                 * @param vertexBufferKind The type of vertex attribute
                 * @param meshAttributeArray The vertex attribute data
                 * @param byteOffset The offset to the binary data
                 * @param binaryWriter The binary data for the glTF file
                 */
                _Exporter.prototype.reorderTriangleFillMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
                    var vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
                    if (vertexBuffer) {
                        var stride = vertexBuffer.byteStride / BABYLON.VertexBuffer.GetTypeByteLength(vertexBuffer.type);
                        if (submesh.verticesCount % 3 !== 0) {
                            BABYLON.Tools.Error('The submesh vertices for the triangle fill mode is not divisible by 3!');
                        }
                        else {
                            var vertexData = [];
                            var index = 0;
                            switch (vertexBufferKind) {
                                case BABYLON.VertexBuffer.PositionKind:
                                case BABYLON.VertexBuffer.NormalKind: {
                                    for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                                        index = x * stride;
                                        vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index));
                                        vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                                        vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index + stride));
                                    }
                                    break;
                                }
                                case BABYLON.VertexBuffer.TangentKind: {
                                    for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                                        index = x * stride;
                                        vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index));
                                        vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index + 2 * stride));
                                        vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index + stride));
                                    }
                                    break;
                                }
                                case BABYLON.VertexBuffer.ColorKind: {
                                    var size = vertexBuffer.getSize();
                                    for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + size) {
                                        index = x * stride;
                                        if (size === 4) {
                                            vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index));
                                            vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index + 2 * stride));
                                            vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index + stride));
                                        }
                                        else {
                                            vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index));
                                            vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                                            vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index + stride));
                                        }
                                    }
                                    break;
                                }
                                case BABYLON.VertexBuffer.UVKind:
                                case BABYLON.VertexBuffer.UV2Kind: {
                                    for (var x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                                        index = x * stride;
                                        vertexData.push(BABYLON.Vector2.FromArray(meshAttributeArray, index));
                                        vertexData.push(BABYLON.Vector2.FromArray(meshAttributeArray, index + 2 * stride));
                                        vertexData.push(BABYLON.Vector2.FromArray(meshAttributeArray, index + stride));
                                    }
                                    break;
                                }
                                default: {
                                    BABYLON.Tools.Error("Unsupported Vertex Buffer type: " + vertexBufferKind);
                                }
                            }
                            this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter);
                        }
                    }
                    else {
                        BABYLON.Tools.Warn("reorderTriangleFillMode: Vertex Buffer Kind " + vertexBufferKind + " not present!");
                    }
                };
                /**
                 * Reorders the vertex attributes in the correct triangle strip order.  This is necessary when indices are not available and the winding order is
                 * clock-wise during export to glTF
                 * @param submesh BabylonJS submesh
                 * @param primitiveMode Primitive mode of the mesh
                 * @param sideOrientation the winding order of the submesh
                 * @param vertexBufferKind The type of vertex attribute
                 * @param meshAttributeArray The vertex attribute data
                 * @param byteOffset The offset to the binary data
                 * @param binaryWriter The binary data for the glTF file
                 */
                _Exporter.prototype.reorderTriangleStripDrawMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
                    var vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
                    if (vertexBuffer) {
                        var stride = vertexBuffer.byteStride / BABYLON.VertexBuffer.GetTypeByteLength(vertexBuffer.type);
                        var vertexData = [];
                        var index = 0;
                        switch (vertexBufferKind) {
                            case BABYLON.VertexBuffer.PositionKind:
                            case BABYLON.VertexBuffer.NormalKind: {
                                index = submesh.verticesStart;
                                vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                                vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index + stride));
                                break;
                            }
                            case BABYLON.VertexBuffer.TangentKind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            case BABYLON.VertexBuffer.ColorKind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexBuffer.getSize() === 4 ? vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index)) : vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            case BABYLON.VertexBuffer.UVKind:
                            case BABYLON.VertexBuffer.UV2Kind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexData.push(BABYLON.Vector2.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            default: {
                                BABYLON.Tools.Error("Unsupported Vertex Buffer type: " + vertexBufferKind);
                            }
                        }
                        this.writeVertexAttributeData(vertexData, byteOffset + 12, vertexBufferKind, meshAttributeArray, binaryWriter);
                    }
                    else {
                        BABYLON.Tools.Warn("reorderTriangleStripDrawMode: Vertex buffer kind " + vertexBufferKind + " not present!");
                    }
                };
                /**
                 * Reorders the vertex attributes in the correct triangle fan order.  This is necessary when indices are not available and the winding order is
                 * clock-wise during export to glTF
                 * @param submesh BabylonJS submesh
                 * @param primitiveMode Primitive mode of the mesh
                 * @param sideOrientation the winding order of the submesh
                 * @param vertexBufferKind The type of vertex attribute
                 * @param meshAttributeArray The vertex attribute data
                 * @param byteOffset The offset to the binary data
                 * @param binaryWriter The binary data for the glTF file
                 */
                _Exporter.prototype.reorderTriangleFanMode = function (submesh, primitiveMode, sideOrientation, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
                    var vertexBuffer = this.getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
                    if (vertexBuffer) {
                        var stride = vertexBuffer.byteStride / BABYLON.VertexBuffer.GetTypeByteLength(vertexBuffer.type);
                        var vertexData = [];
                        var index = 0;
                        switch (vertexBufferKind) {
                            case BABYLON.VertexBuffer.PositionKind:
                            case BABYLON.VertexBuffer.NormalKind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            case BABYLON.VertexBuffer.TangentKind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            case BABYLON.VertexBuffer.ColorKind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index));
                                    vertexBuffer.getSize() === 4 ? vertexData.push(BABYLON.Vector4.FromArray(meshAttributeArray, index)) : vertexData.push(BABYLON.Vector3.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            case BABYLON.VertexBuffer.UVKind:
                            case BABYLON.VertexBuffer.UV2Kind: {
                                for (var x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                                    index = x * stride;
                                    vertexData.push(BABYLON.Vector2.FromArray(meshAttributeArray, index));
                                }
                                break;
                            }
                            default: {
                                BABYLON.Tools.Error("Unsupported Vertex Buffer type: " + vertexBufferKind);
                            }
                        }
                        this.writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, meshAttributeArray, binaryWriter);
                    }
                    else {
                        BABYLON.Tools.Warn("reorderTriangleFanMode: Vertex buffer kind " + vertexBufferKind + " not present!");
                    }
                };
                /**
                 * Writes the vertex attribute data to binary
                 * @param vertices The vertices to write to the binary writer
                 * @param byteOffset The offset into the binary writer to overwrite binary data
                 * @param vertexAttributeKind The vertex attribute type
                 * @param meshAttributeArray The vertex attribute data
                 * @param binaryWriter The writer containing the binary data
                 */
                _Exporter.prototype.writeVertexAttributeData = function (vertices, byteOffset, vertexAttributeKind, meshAttributeArray, binaryWriter) {
                    for (var _i = 0, vertices_1 = vertices; _i < vertices_1.length; _i++) {
                        var vertex = vertices_1[_i];
                        if (this._convertToRightHandedSystem && !(vertexAttributeKind === BABYLON.VertexBuffer.ColorKind) && !(vertex instanceof BABYLON.Vector2)) {
                            if (vertex instanceof BABYLON.Vector3) {
                                if (vertexAttributeKind === BABYLON.VertexBuffer.NormalKind) {
                                    Exporter._GLTFUtilities._GetRightHandedNormalVector3FromRef(vertex);
                                }
                                else if (vertexAttributeKind === BABYLON.VertexBuffer.PositionKind) {
                                    Exporter._GLTFUtilities._GetRightHandedPositionVector3FromRef(vertex);
                                }
                                else {
                                    BABYLON.Tools.Error('Unsupported vertex attribute kind!');
                                }
                            }
                            else {
                                Exporter._GLTFUtilities._GetRightHandedVector4FromRef(vertex);
                            }
                        }
                        if (vertexAttributeKind === BABYLON.VertexBuffer.NormalKind) {
                            vertex.normalize();
                        }
                        else if (vertexAttributeKind === BABYLON.VertexBuffer.TangentKind && vertex instanceof BABYLON.Vector4) {
                            Exporter._GLTFUtilities._NormalizeTangentFromRef(vertex);
                        }
                        for (var _a = 0, _b = vertex.asArray(); _a < _b.length; _a++) {
                            var component = _b[_a];
                            binaryWriter.setFloat32(component, byteOffset);
                            byteOffset += 4;
                        }
                    }
                };
                /**
                 * Writes mesh attribute data to a data buffer
                 * Returns the bytelength of the data
                 * @param vertexBufferKind Indicates what kind of vertex data is being passed in
                 * @param meshAttributeArray Array containing the attribute data
                 * @param binaryWriter The buffer to write the binary data to
                 * @param indices Used to specify the order of the vertex data
                 */
                _Exporter.prototype.writeAttributeData = function (vertexBufferKind, meshAttributeArray, byteStride, binaryWriter) {
                    var stride = byteStride / 4;
                    var vertexAttributes = [];
                    var index;
                    switch (vertexBufferKind) {
                        case BABYLON.VertexBuffer.PositionKind: {
                            for (var k = 0, length_2 = meshAttributeArray.length / stride; k < length_2; ++k) {
                                index = k * stride;
                                var vertexData = BABYLON.Vector3.FromArray(meshAttributeArray, index);
                                if (this._convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedPositionVector3FromRef(vertexData);
                                }
                                vertexAttributes.push(vertexData.asArray());
                            }
                            break;
                        }
                        case BABYLON.VertexBuffer.NormalKind: {
                            for (var k = 0, length_3 = meshAttributeArray.length / stride; k < length_3; ++k) {
                                index = k * stride;
                                var vertexData = BABYLON.Vector3.FromArray(meshAttributeArray, index);
                                if (this._convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedNormalVector3FromRef(vertexData);
                                }
                                vertexData.normalize();
                                vertexAttributes.push(vertexData.asArray());
                            }
                            break;
                        }
                        case BABYLON.VertexBuffer.TangentKind: {
                            for (var k = 0, length_4 = meshAttributeArray.length / stride; k < length_4; ++k) {
                                index = k * stride;
                                var vertexData = BABYLON.Vector4.FromArray(meshAttributeArray, index);
                                if (this._convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedVector4FromRef(vertexData);
                                }
                                Exporter._GLTFUtilities._NormalizeTangentFromRef(vertexData);
                                vertexAttributes.push(vertexData.asArray());
                            }
                            break;
                        }
                        case BABYLON.VertexBuffer.ColorKind: {
                            for (var k = 0, length_5 = meshAttributeArray.length / stride; k < length_5; ++k) {
                                index = k * stride;
                                var vertexData = stride === 3 ? BABYLON.Vector3.FromArray(meshAttributeArray, index) : BABYLON.Vector4.FromArray(meshAttributeArray, index);
                                vertexAttributes.push(vertexData.asArray());
                            }
                            break;
                        }
                        case BABYLON.VertexBuffer.UVKind:
                        case BABYLON.VertexBuffer.UV2Kind: {
                            for (var k = 0, length_6 = meshAttributeArray.length / stride; k < length_6; ++k) {
                                index = k * stride;
                                vertexAttributes.push(this._convertToRightHandedSystem ? [meshAttributeArray[index], meshAttributeArray[index + 1]] : [meshAttributeArray[index], meshAttributeArray[index + 1]]);
                            }
                            break;
                        }
                        default: {
                            BABYLON.Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                            vertexAttributes = [];
                        }
                    }
                    for (var _i = 0, vertexAttributes_1 = vertexAttributes; _i < vertexAttributes_1.length; _i++) {
                        var vertexAttribute = vertexAttributes_1[_i];
                        for (var _a = 0, vertexAttribute_1 = vertexAttribute; _a < vertexAttribute_1.length; _a++) {
                            var component = vertexAttribute_1[_a];
                            binaryWriter.setFloat32(component);
                        }
                    }
                };
                /**
                 * Generates glTF json data
                 * @param shouldUseGlb Indicates whether the json should be written for a glb file
                 * @param glTFPrefix Text to use when prefixing a glTF file
                 * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
                 * @returns json data as string
                 */
                _Exporter.prototype.generateJSON = function (shouldUseGlb, glTFPrefix, prettyPrint) {
                    var _this = this;
                    var buffer = { byteLength: this._totalByteLength };
                    var imageName;
                    var imageData;
                    var bufferView;
                    var byteOffset = this._totalByteLength;
                    var glTF = {
                        asset: this._asset
                    };
                    if (this._extensionsUsed && this._extensionsUsed.length) {
                        glTF.extensionsUsed = this._extensionsUsed;
                    }
                    if (this._extensionsRequired && this._extensionsRequired.length) {
                        glTF.extensionsRequired = this._extensionsRequired;
                    }
                    if (buffer.byteLength) {
                        glTF.buffers = [buffer];
                    }
                    if (this._nodes && this._nodes.length) {
                        glTF.nodes = this._nodes;
                    }
                    if (this._meshes && this._meshes.length) {
                        glTF.meshes = this._meshes;
                    }
                    if (this._scenes && this._scenes.length) {
                        glTF.scenes = this._scenes;
                        glTF.scene = 0;
                    }
                    if (this._bufferViews && this._bufferViews.length) {
                        glTF.bufferViews = this._bufferViews;
                    }
                    if (this._accessors && this._accessors.length) {
                        glTF.accessors = this._accessors;
                    }
                    if (this._animations && this._animations.length) {
                        glTF.animations = this._animations;
                    }
                    if (this._materials && this._materials.length) {
                        glTF.materials = this._materials;
                    }
                    if (this._textures && this._textures.length) {
                        glTF.textures = this._textures;
                    }
                    if (this._samplers && this._samplers.length) {
                        glTF.samplers = this._samplers;
                    }
                    if (this._images && this._images.length) {
                        if (!shouldUseGlb) {
                            glTF.images = this._images;
                        }
                        else {
                            glTF.images = [];
                            this._images.forEach(function (image) {
                                if (image.uri) {
                                    imageData = _this._imageData[image.uri];
                                    imageName = image.uri.split('.')[0] + " image";
                                    bufferView = Exporter._GLTFUtilities._CreateBufferView(0, byteOffset, imageData.data.length, undefined, imageName);
                                    byteOffset += imageData.data.buffer.byteLength;
                                    _this._bufferViews.push(bufferView);
                                    image.bufferView = _this._bufferViews.length - 1;
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
                _Exporter.prototype._generateGLTFAsync = function (glTFPrefix) {
                    var _this = this;
                    return this._generateBinaryAsync().then(function (binaryBuffer) {
                        var jsonText = _this.generateJSON(false, glTFPrefix, true);
                        var bin = new Blob([binaryBuffer], { type: 'application/octet-stream' });
                        var glTFFileName = glTFPrefix + '.gltf';
                        var glTFBinFile = glTFPrefix + '.bin';
                        var container = new BABYLON.GLTFData();
                        container.glTFFiles[glTFFileName] = jsonText;
                        container.glTFFiles[glTFBinFile] = bin;
                        if (_this._imageData) {
                            for (var image in _this._imageData) {
                                container.glTFFiles[image] = new Blob([_this._imageData[image].data], { type: _this._imageData[image].mimeType });
                            }
                        }
                        return container;
                    });
                };
                /**
                 * Creates a binary buffer for glTF
                 * @returns array buffer for binary data
                 */
                _Exporter.prototype._generateBinaryAsync = function () {
                    var _this = this;
                    var binaryWriter = new _BinaryWriter(4);
                    return this.createSceneAsync(this._babylonScene, binaryWriter).then(function () {
                        if (_this._localEngine) {
                            _this._localEngine.dispose();
                        }
                        return binaryWriter.getArrayBuffer();
                    });
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
                _Exporter.prototype._generateGLBAsync = function (glTFPrefix) {
                    var _this = this;
                    return this._generateBinaryAsync().then(function (binaryBuffer) {
                        var jsonText = _this.generateJSON(true);
                        var glbFileName = glTFPrefix + '.glb';
                        var headerLength = 12;
                        var chunkLengthPrefix = 8;
                        var jsonLength = jsonText.length;
                        var imageByteLength = 0;
                        for (var key in _this._imageData) {
                            imageByteLength += _this._imageData[key].data.byteLength;
                        }
                        var jsonPadding = _this._getPadding(jsonLength);
                        var binPadding = _this._getPadding(binaryBuffer.byteLength);
                        var imagePadding = _this._getPadding(imageByteLength);
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
                        for (var key in _this._imageData) {
                            glbData.push(_this._imageData[key].data.buffer);
                        }
                        glbData.push(binPaddingBuffer);
                        glbData.push(imagePaddingBuffer);
                        var glbFile = new Blob(glbData, { type: 'application/octet-stream' });
                        var container = new BABYLON.GLTFData();
                        container.glTFFiles[glbFileName] = glbFile;
                        if (_this._localEngine != null) {
                            _this._localEngine.dispose();
                        }
                        return container;
                    });
                };
                /**
                 * Sets the TRS for each node
                 * @param node glTF Node for storing the transformation data
                 * @param babylonTransformNode Babylon mesh used as the source for the transformation data
                 */
                _Exporter.prototype.setNodeTransformation = function (node, babylonTransformNode) {
                    if (!babylonTransformNode.getPivotPoint().equalsToFloats(0, 0, 0)) {
                        BABYLON.Tools.Warn("Pivot points are not supported in the glTF serializer");
                    }
                    if (!babylonTransformNode.position.equalsToFloats(0, 0, 0)) {
                        node.translation = this._convertToRightHandedSystem ? Exporter._GLTFUtilities._GetRightHandedPositionVector3(babylonTransformNode.position).asArray() : babylonTransformNode.position.asArray();
                    }
                    if (!babylonTransformNode.scaling.equalsToFloats(1, 1, 1)) {
                        node.scale = babylonTransformNode.scaling.asArray();
                    }
                    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(babylonTransformNode.rotation.y, babylonTransformNode.rotation.x, babylonTransformNode.rotation.z);
                    if (babylonTransformNode.rotationQuaternion) {
                        rotationQuaternion.multiplyInPlace(babylonTransformNode.rotationQuaternion);
                    }
                    if (!(rotationQuaternion.x === 0 && rotationQuaternion.y === 0 && rotationQuaternion.z === 0 && rotationQuaternion.w === 1)) {
                        if (this._convertToRightHandedSystem) {
                            Exporter._GLTFUtilities._GetRightHandedQuaternionFromRef(rotationQuaternion);
                        }
                        node.rotation = rotationQuaternion.normalize().asArray();
                    }
                };
                _Exporter.prototype.getVertexBufferFromMesh = function (attributeKind, bufferMesh) {
                    if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                        var vertexBuffer = bufferMesh.getVertexBuffer(attributeKind);
                        if (vertexBuffer) {
                            return vertexBuffer;
                        }
                    }
                    return null;
                };
                /**
                 * Creates a bufferview based on the vertices type for the Babylon mesh
                 * @param kind Indicates the type of vertices data
                 * @param babylonTransformNode The Babylon mesh to get the vertices data from
                 * @param binaryWriter The buffer to write the bufferview data to
                 */
                _Exporter.prototype.createBufferViewKind = function (kind, babylonTransformNode, binaryWriter, byteStride) {
                    var bufferMesh = babylonTransformNode instanceof BABYLON.Mesh ?
                        babylonTransformNode : babylonTransformNode instanceof BABYLON.InstancedMesh ?
                        babylonTransformNode.sourceMesh : null;
                    if (bufferMesh) {
                        var vertexData = bufferMesh.getVerticesData(kind);
                        if (vertexData) {
                            var byteLength = vertexData.length * 4;
                            var bufferView = Exporter._GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                            this._bufferViews.push(bufferView);
                            this.writeAttributeData(kind, vertexData, byteStride, binaryWriter);
                        }
                    }
                };
                /**
                 * The primitive mode of the Babylon mesh
                 * @param babylonMesh The BabylonJS mesh
                 */
                _Exporter.prototype.getMeshPrimitiveMode = function (babylonMesh) {
                    if (babylonMesh instanceof BABYLON.LinesMesh) {
                        return BABYLON.Material.LineListDrawMode;
                    }
                    return babylonMesh.material ? babylonMesh.material.fillMode : BABYLON.Material.TriangleFillMode;
                };
                /**
                 * Sets the primitive mode of the glTF mesh primitive
                 * @param meshPrimitive glTF mesh primitive
                 * @param primitiveMode The primitive mode
                 */
                _Exporter.prototype.setPrimitiveMode = function (meshPrimitive, primitiveMode) {
                    switch (primitiveMode) {
                        case BABYLON.Material.TriangleFillMode: {
                            // glTF defaults to using Triangle Mode
                            break;
                        }
                        case BABYLON.Material.TriangleStripDrawMode: {
                            meshPrimitive.mode = 5 /* TRIANGLE_STRIP */;
                            break;
                        }
                        case BABYLON.Material.TriangleFanDrawMode: {
                            meshPrimitive.mode = 6 /* TRIANGLE_FAN */;
                            break;
                        }
                        case BABYLON.Material.PointListDrawMode: {
                            meshPrimitive.mode = 0 /* POINTS */;
                        }
                        case BABYLON.Material.PointFillMode: {
                            meshPrimitive.mode = 0 /* POINTS */;
                            break;
                        }
                        case BABYLON.Material.LineLoopDrawMode: {
                            meshPrimitive.mode = 2 /* LINE_LOOP */;
                            break;
                        }
                        case BABYLON.Material.LineListDrawMode: {
                            meshPrimitive.mode = 1 /* LINES */;
                            break;
                        }
                        case BABYLON.Material.LineStripDrawMode: {
                            meshPrimitive.mode = 3 /* LINE_STRIP */;
                            break;
                        }
                    }
                };
                /**
                 * Sets the vertex attribute accessor based of the glTF mesh primitive
                 * @param meshPrimitive glTF mesh primitive
                 * @param attributeKind vertex attribute
                 * @returns boolean specifying if uv coordinates are present
                 */
                _Exporter.prototype.setAttributeKind = function (meshPrimitive, attributeKind) {
                    switch (attributeKind) {
                        case BABYLON.VertexBuffer.PositionKind: {
                            meshPrimitive.attributes.POSITION = this._accessors.length - 1;
                            break;
                        }
                        case BABYLON.VertexBuffer.NormalKind: {
                            meshPrimitive.attributes.NORMAL = this._accessors.length - 1;
                            break;
                        }
                        case BABYLON.VertexBuffer.ColorKind: {
                            meshPrimitive.attributes.COLOR_0 = this._accessors.length - 1;
                            break;
                        }
                        case BABYLON.VertexBuffer.TangentKind: {
                            meshPrimitive.attributes.TANGENT = this._accessors.length - 1;
                            break;
                        }
                        case BABYLON.VertexBuffer.UVKind: {
                            meshPrimitive.attributes.TEXCOORD_0 = this._accessors.length - 1;
                            break;
                        }
                        case BABYLON.VertexBuffer.UV2Kind: {
                            meshPrimitive.attributes.TEXCOORD_1 = this._accessors.length - 1;
                            break;
                        }
                        default: {
                            BABYLON.Tools.Warn("Unsupported Vertex Buffer Type: " + attributeKind);
                        }
                    }
                };
                /**
                 * Sets data for the primitive attributes of each submesh
                 * @param mesh glTF Mesh object to store the primitive attribute information
                 * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
                 * @param binaryWriter Buffer to write the attribute data to
                 */
                _Exporter.prototype.setPrimitiveAttributesAsync = function (mesh, babylonTransformNode, binaryWriter) {
                    var promises = [];
                    var bufferMesh = null;
                    var bufferView;
                    var uvCoordsPresent;
                    var minMax;
                    if (babylonTransformNode instanceof BABYLON.Mesh) {
                        bufferMesh = babylonTransformNode;
                    }
                    else if (babylonTransformNode instanceof BABYLON.InstancedMesh) {
                        bufferMesh = babylonTransformNode.sourceMesh;
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
                        var indexBufferViewIndex = null;
                        var primitiveMode = this.getMeshPrimitiveMode(bufferMesh);
                        var vertexAttributeBufferViews = {};
                        // For each BabylonMesh, create bufferviews for each 'kind'
                        for (var _i = 0, attributeData_1 = attributeData; _i < attributeData_1.length; _i++) {
                            var attribute = attributeData_1[_i];
                            var attributeKind = attribute.kind;
                            if (bufferMesh.isVerticesDataPresent(attributeKind)) {
                                var vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                                attribute.byteStride = vertexBuffer ? vertexBuffer.getSize() * 4 : BABYLON.VertexBuffer.DeduceStride(attributeKind) * 4;
                                if (attribute.byteStride === 12) {
                                    attribute.accessorType = "VEC3" /* VEC3 */;
                                }
                                this.createBufferViewKind(attributeKind, babylonTransformNode, binaryWriter, attribute.byteStride);
                                attribute.bufferViewIndex = this._bufferViews.length - 1;
                                vertexAttributeBufferViews[attributeKind] = attribute.bufferViewIndex;
                            }
                        }
                        if (bufferMesh.getTotalIndices()) {
                            var indices = bufferMesh.getIndices();
                            if (indices) {
                                var byteLength = indices.length * 4;
                                bufferView = Exporter._GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                                this._bufferViews.push(bufferView);
                                indexBufferViewIndex = this._bufferViews.length - 1;
                                for (var k = 0, length_7 = indices.length; k < length_7; ++k) {
                                    binaryWriter.setUInt32(indices[k]);
                                }
                            }
                        }
                        if (bufferMesh.subMeshes) {
                            // go through all mesh primitives (submeshes)
                            for (var _a = 0, _b = bufferMesh.subMeshes; _a < _b.length; _a++) {
                                var submesh = _b[_a];
                                uvCoordsPresent = false;
                                var babylonMaterial = submesh.getMaterial() || bufferMesh.getScene().defaultMaterial;
                                var materialIndex = null;
                                if (babylonMaterial) {
                                    if (bufferMesh instanceof BABYLON.LinesMesh) {
                                        // get the color from the lines mesh and set it in the material
                                        var material = {
                                            name: bufferMesh.name + ' material'
                                        };
                                        if (!bufferMesh.color.equals(BABYLON.Color3.White()) || bufferMesh.alpha < 1) {
                                            material.pbrMetallicRoughness = {
                                                baseColorFactor: bufferMesh.color.asArray().concat([bufferMesh.alpha])
                                            };
                                        }
                                        this._materials.push(material);
                                        materialIndex = this._materials.length - 1;
                                    }
                                    else if (babylonMaterial instanceof BABYLON.MultiMaterial) {
                                        var subMaterial = babylonMaterial.subMaterials[submesh.materialIndex];
                                        if (subMaterial) {
                                            babylonMaterial = subMaterial;
                                            materialIndex = this._materialMap[babylonMaterial.uniqueId];
                                        }
                                    }
                                    else {
                                        materialIndex = this._materialMap[babylonMaterial.uniqueId];
                                    }
                                }
                                var glTFMaterial = materialIndex != null ? this._materials[materialIndex] : null;
                                var meshPrimitive = { attributes: {} };
                                this.setPrimitiveMode(meshPrimitive, primitiveMode);
                                for (var _c = 0, attributeData_2 = attributeData; _c < attributeData_2.length; _c++) {
                                    var attribute = attributeData_2[_c];
                                    var attributeKind = attribute.kind;
                                    if (attributeKind === BABYLON.VertexBuffer.UVKind || attributeKind === BABYLON.VertexBuffer.UV2Kind) {
                                        if (glTFMaterial && !this._glTFMaterialExporter._hasTexturesPresent(glTFMaterial)) {
                                            continue;
                                        }
                                    }
                                    var vertexData = bufferMesh.getVerticesData(attributeKind);
                                    if (vertexData) {
                                        var vertexBuffer = this.getVertexBufferFromMesh(attributeKind, bufferMesh);
                                        if (vertexBuffer) {
                                            var stride = vertexBuffer.getSize();
                                            var bufferViewIndex = attribute.bufferViewIndex;
                                            if (bufferViewIndex != undefined) { // check to see if bufferviewindex has a numeric value assigned.
                                                minMax = { min: null, max: null };
                                                if (attributeKind == BABYLON.VertexBuffer.PositionKind) {
                                                    minMax = Exporter._GLTFUtilities._CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride, this._convertToRightHandedSystem);
                                                }
                                                var accessor = Exporter._GLTFUtilities._CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonTransformNode.name, attribute.accessorType, 5126 /* FLOAT */, vertexData.length / stride, 0, minMax.min, minMax.max);
                                                this._accessors.push(accessor);
                                                this.setAttributeKind(meshPrimitive, attributeKind);
                                                if (meshPrimitive.attributes.TEXCOORD_0 != null || meshPrimitive.attributes.TEXCOORD_1 != null) {
                                                    uvCoordsPresent = true;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (indexBufferViewIndex) {
                                    // Create accessor
                                    var accessor = Exporter._GLTFUtilities._CreateAccessor(indexBufferViewIndex, "indices - " + babylonTransformNode.name, "SCALAR" /* SCALAR */, 5125 /* UNSIGNED_INT */, submesh.indexCount, submesh.indexStart * 4, null, null);
                                    this._accessors.push(accessor);
                                    meshPrimitive.indices = this._accessors.length - 1;
                                }
                                if (materialIndex != null && Object.keys(meshPrimitive.attributes).length > 0) {
                                    var sideOrientation = babylonMaterial.sideOrientation;
                                    if (this._convertToRightHandedSystem && sideOrientation === BABYLON.Material.ClockWiseSideOrientation) {
                                        //Overwrite the indices to be counter-clockwise
                                        var byteOffset = indexBufferViewIndex != null ? this._bufferViews[indexBufferViewIndex].byteOffset : null;
                                        if (byteOffset == null) {
                                            byteOffset = 0;
                                        }
                                        var babylonIndices = null;
                                        if (indexBufferViewIndex != null) {
                                            babylonIndices = bufferMesh.getIndices();
                                        }
                                        if (babylonIndices) {
                                            this.reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter);
                                        }
                                        else {
                                            for (var _d = 0, attributeData_3 = attributeData; _d < attributeData_3.length; _d++) {
                                                var attribute = attributeData_3[_d];
                                                var vertexData = bufferMesh.getVerticesData(attribute.kind);
                                                if (vertexData) {
                                                    var byteOffset_1 = this._bufferViews[vertexAttributeBufferViews[attribute.kind]].byteOffset;
                                                    if (!byteOffset_1) {
                                                        byteOffset_1 = 0;
                                                    }
                                                    this.reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, sideOrientation, attribute.kind, vertexData, byteOffset_1, binaryWriter);
                                                }
                                            }
                                        }
                                    }
                                    if (!uvCoordsPresent && this._glTFMaterialExporter._hasTexturesPresent(this._materials[materialIndex])) {
                                        var newMat = this._glTFMaterialExporter._stripTexturesFromMaterial(this._materials[materialIndex]);
                                        this._materials.push(newMat);
                                        materialIndex = this._materials.length - 1;
                                    }
                                    meshPrimitive.material = materialIndex;
                                }
                                mesh.primitives.push(meshPrimitive);
                                var promise = this._extensionsPostExportMeshPrimitiveAsync("postExport", meshPrimitive, submesh, binaryWriter);
                                if (promise) {
                                    promises.push();
                                }
                            }
                        }
                    }
                    return Promise.all(promises).then(function () {
                        /* do nothing */
                    });
                };
                /**
                 * Creates a glTF scene based on the array of meshes
                 * Returns the the total byte offset
                 * @param babylonScene Babylon scene to get the mesh data from
                 * @param binaryWriter Buffer to write binary data to
                 */
                _Exporter.prototype.createSceneAsync = function (babylonScene, binaryWriter) {
                    var _this = this;
                    var scene = { nodes: [] };
                    var glTFNodeIndex;
                    var glTFNode;
                    var directDescendents;
                    var nodes = babylonScene.transformNodes.concat(babylonScene.meshes);
                    return this._glTFMaterialExporter._convertMaterialsToGLTFAsync(babylonScene.materials, "image/png" /* PNG */, true).then(function () {
                        return _this.createNodeMapAndAnimationsAsync(babylonScene, nodes, _this._shouldExportTransformNode, binaryWriter).then(function (nodeMap) {
                            _this._nodeMap = nodeMap;
                            _this._totalByteLength = binaryWriter.getByteOffset();
                            if (_this._totalByteLength == undefined) {
                                throw new Error("undefined byte length!");
                            }
                            // Build Hierarchy with the node map.
                            for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                                var babylonTransformNode = nodes_1[_i];
                                glTFNodeIndex = _this._nodeMap[babylonTransformNode.uniqueId];
                                if (glTFNodeIndex != null) {
                                    glTFNode = _this._nodes[glTFNodeIndex];
                                    if (!babylonTransformNode.parent) {
                                        if (!_this._shouldExportTransformNode(babylonTransformNode)) {
                                            BABYLON.Tools.Log("Omitting " + babylonTransformNode.name + " from scene.");
                                        }
                                        else {
                                            if (_this._convertToRightHandedSystem) {
                                                if (glTFNode.translation) {
                                                    glTFNode.translation[2] *= -1;
                                                    glTFNode.translation[0] *= -1;
                                                }
                                                glTFNode.rotation = glTFNode.rotation ? BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(BABYLON.Quaternion.FromArray(glTFNode.rotation)).asArray() : (BABYLON.Quaternion.FromArray([0, 1, 0, 0])).asArray();
                                            }
                                            scene.nodes.push(glTFNodeIndex);
                                        }
                                    }
                                    directDescendents = babylonTransformNode.getDescendants(true);
                                    if (!glTFNode.children && directDescendents && directDescendents.length) {
                                        var children = [];
                                        for (var _a = 0, directDescendents_1 = directDescendents; _a < directDescendents_1.length; _a++) {
                                            var descendent = directDescendents_1[_a];
                                            if (_this._nodeMap[descendent.uniqueId] != null) {
                                                children.push(_this._nodeMap[descendent.uniqueId]);
                                            }
                                        }
                                        if (children.length) {
                                            glTFNode.children = children;
                                        }
                                    }
                                }
                            }
                            if (scene.nodes.length) {
                                _this._scenes.push(scene);
                            }
                        });
                    });
                };
                /**
                 * Creates a mapping of Node unique id to node index and handles animations
                 * @param babylonScene Babylon Scene
                 * @param nodes Babylon transform nodes
                 * @param shouldExportTransformNode Callback specifying if a transform node should be exported
                 * @param binaryWriter Buffer to write binary data to
                 * @returns Node mapping of unique id to index
                 */
                _Exporter.prototype.createNodeMapAndAnimationsAsync = function (babylonScene, nodes, shouldExportTransformNode, binaryWriter) {
                    var _this = this;
                    var promiseChain = Promise.resolve();
                    var nodeMap = {};
                    var nodeIndex;
                    var runtimeGLTFAnimation = {
                        name: 'runtime animations',
                        channels: [],
                        samplers: []
                    };
                    var idleGLTFAnimations = [];
                    var _loop_1 = function (babylonTransformNode) {
                        if (shouldExportTransformNode(babylonTransformNode)) {
                            promiseChain = promiseChain.then(function () {
                                return _this.createNodeAsync(babylonTransformNode, binaryWriter).then(function (node) {
                                    var directDescendents = babylonTransformNode.getDescendants(true, function (node) { return (node instanceof BABYLON.TransformNode); });
                                    if (directDescendents.length || node.mesh != null) {
                                        _this._nodes.push(node);
                                        nodeIndex = _this._nodes.length - 1;
                                        nodeMap[babylonTransformNode.uniqueId] = nodeIndex;
                                    }
                                    if (!babylonScene.animationGroups.length && babylonTransformNode.animations.length) {
                                        Exporter._GLTFAnimation._CreateNodeAnimationFromTransformNodeAnimations(babylonTransformNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, _this._nodes, binaryWriter, _this._bufferViews, _this._accessors, _this._convertToRightHandedSystem, _this._animationSampleRate);
                                    }
                                });
                            });
                        }
                        else {
                            "Excluding mesh " + babylonTransformNode.name;
                        }
                    };
                    for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                        var babylonTransformNode = nodes_2[_i];
                        _loop_1(babylonTransformNode);
                    }
                    return promiseChain.then(function () {
                        if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                            _this._animations.push(runtimeGLTFAnimation);
                        }
                        idleGLTFAnimations.forEach(function (idleGLTFAnimation) {
                            if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                                _this._animations.push(idleGLTFAnimation);
                            }
                        });
                        if (babylonScene.animationGroups.length) {
                            Exporter._GLTFAnimation._CreateNodeAnimationFromAnimationGroups(babylonScene, _this._animations, nodeMap, _this._nodes, binaryWriter, _this._bufferViews, _this._accessors, _this._convertToRightHandedSystem, _this._animationSampleRate);
                        }
                        return nodeMap;
                    });
                };
                /**
                 * Creates a glTF node from a Babylon mesh
                 * @param babylonMesh Source Babylon mesh
                 * @param binaryWriter Buffer for storing geometry data
                 * @returns glTF node
                 */
                _Exporter.prototype.createNodeAsync = function (babylonTransformNode, binaryWriter) {
                    var _this = this;
                    return Promise.resolve().then(function () {
                        // create node to hold translation/rotation/scale and the mesh
                        var node = {};
                        // create mesh
                        var mesh = { primitives: [] };
                        if (babylonTransformNode.name) {
                            node.name = babylonTransformNode.name;
                        }
                        // Set transformation
                        _this.setNodeTransformation(node, babylonTransformNode);
                        return _this.setPrimitiveAttributesAsync(mesh, babylonTransformNode, binaryWriter).then(function () {
                            if (mesh.primitives.length) {
                                _this._meshes.push(mesh);
                                node.mesh = _this._meshes.length - 1;
                            }
                            return node;
                        });
                    });
                };
                _Exporter._ExtensionNames = new Array();
                _Exporter._ExtensionFactories = {};
                return _Exporter;
            }());
            Exporter._Exporter = _Exporter;
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
                    for (var i = 0, length_8 = newUint8Array.byteLength; i < length_8; ++i) {
                        newUint8Array[i] = oldUint8Array[i];
                    }
                    this._arrayBuffer = newBuffer;
                    this._dataView = new DataView(this._arrayBuffer);
                    return newBuffer;
                };
                /**
                 * Get an array buffer with the length of the byte offset
                 * @returns ArrayBuffer resized to the byte offset
                 */
                _BinaryWriter.prototype.getArrayBuffer = function () {
                    return this.resizeBuffer(this.getByteOffset());
                };
                /**
                 * Get the byte offset of the array buffer
                 * @returns byte offset
                 */
                _BinaryWriter.prototype.getByteOffset = function () {
                    if (this._byteOffset == undefined) {
                        throw new Error("Byte offset is undefined!");
                    }
                    return this._byteOffset;
                };
                /**
                 * Stores an UInt8 in the array buffer
                 * @param entry
                 * @param byteOffset If defined, specifies where to set the value as an offset.
                 */
                _BinaryWriter.prototype.setUInt8 = function (entry, byteOffset) {
                    if (byteOffset != null) {
                        if (byteOffset < this._byteOffset) {
                            this._dataView.setUint8(byteOffset, entry);
                        }
                        else {
                            BABYLON.Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
                        }
                    }
                    else {
                        if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                            this.resizeBuffer(this._arrayBuffer.byteLength * 2);
                        }
                        this._dataView.setUint8(this._byteOffset++, entry);
                    }
                };
                /**
                 * Gets an UInt32 in the array buffer
                 * @param entry
                 * @param byteOffset If defined, specifies where to set the value as an offset.
                 */
                _BinaryWriter.prototype.getUInt32 = function (byteOffset) {
                    if (byteOffset < this._byteOffset) {
                        return this._dataView.getUint32(byteOffset, true);
                    }
                    else {
                        BABYLON.Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
                        throw new Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
                    }
                };
                _BinaryWriter.prototype.getVector3Float32FromRef = function (vector3, byteOffset) {
                    if (byteOffset + 8 > this._byteOffset) {
                        BABYLON.Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
                    }
                    else {
                        vector3.x = this._dataView.getFloat32(byteOffset, true);
                        vector3.y = this._dataView.getFloat32(byteOffset + 4, true);
                        vector3.z = this._dataView.getFloat32(byteOffset + 8, true);
                    }
                };
                _BinaryWriter.prototype.setVector3Float32FromRef = function (vector3, byteOffset) {
                    if (byteOffset + 8 > this._byteOffset) {
                        BABYLON.Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
                    }
                    else {
                        this._dataView.setFloat32(byteOffset, vector3.x, true);
                        this._dataView.setFloat32(byteOffset + 4, vector3.y, true);
                        this._dataView.setFloat32(byteOffset + 8, vector3.z, true);
                    }
                };
                _BinaryWriter.prototype.getVector4Float32FromRef = function (vector4, byteOffset) {
                    if (byteOffset + 12 > this._byteOffset) {
                        BABYLON.Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
                    }
                    else {
                        vector4.x = this._dataView.getFloat32(byteOffset, true);
                        vector4.y = this._dataView.getFloat32(byteOffset + 4, true);
                        vector4.z = this._dataView.getFloat32(byteOffset + 8, true);
                        vector4.w = this._dataView.getFloat32(byteOffset + 12, true);
                    }
                };
                _BinaryWriter.prototype.setVector4Float32FromRef = function (vector4, byteOffset) {
                    if (byteOffset + 12 > this._byteOffset) {
                        BABYLON.Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
                    }
                    else {
                        this._dataView.setFloat32(byteOffset, vector4.x, true);
                        this._dataView.setFloat32(byteOffset + 4, vector4.y, true);
                        this._dataView.setFloat32(byteOffset + 8, vector4.z, true);
                        this._dataView.setFloat32(byteOffset + 12, vector4.w, true);
                    }
                };
                /**
                 * Stores a Float32 in the array buffer
                 * @param entry
                 */
                _BinaryWriter.prototype.setFloat32 = function (entry, byteOffset) {
                    if (isNaN(entry)) {
                        BABYLON.Tools.Error('Invalid data being written!');
                    }
                    if (byteOffset != null) {
                        if (byteOffset < this._byteOffset) {
                            this._dataView.setFloat32(byteOffset, entry, true);
                        }
                        else {
                            BABYLON.Tools.Error('BinaryWriter: byteoffset is greater than the current binary length!');
                        }
                    }
                    if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                        this.resizeBuffer(this._arrayBuffer.byteLength * 2);
                    }
                    this._dataView.setFloat32(this._byteOffset, entry, true);
                    this._byteOffset += 4;
                };
                /**
                 * Stores an UInt32 in the array buffer
                 * @param entry
                 * @param byteOffset If defined, specifies where to set the value as an offset.
                 */
                _BinaryWriter.prototype.setUInt32 = function (entry, byteOffset) {
                    if (byteOffset != null) {
                        if (byteOffset < this._byteOffset) {
                            this._dataView.setUint32(byteOffset, entry, true);
                        }
                        else {
                            BABYLON.Tools.Error('BinaryWriter: byteoffset is greater than the current binary buffer length!');
                        }
                    }
                    else {
                        if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                            this.resizeBuffer(this._arrayBuffer.byteLength * 2);
                        }
                        this._dataView.setUint32(this._byteOffset, entry, true);
                        this._byteOffset += 4;
                    }
                };
                return _BinaryWriter;
            }());
            Exporter._BinaryWriter = _BinaryWriter;
        })(Exporter = GLTF2.Exporter || (GLTF2.Exporter = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFExporter.js.map

/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
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

/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Exporter;
        (function (Exporter) {
            /**
             * Utility methods for working with glTF material conversion properties.  This class should only be used internally
             * @hidden
             */
            var _GLTFMaterialExporter = /** @class */ (function () {
                function _GLTFMaterialExporter(exporter) {
                    /**
                     * Mapping to store textures
                     */
                    this._textureMap = {};
                    this._textureMap = {};
                    this._exporter = exporter;
                }
                /**
                 * Specifies if two colors are approximately equal in value
                 * @param color1 first color to compare to
                 * @param color2 second color to compare to
                 * @param epsilon threshold value
                 */
                _GLTFMaterialExporter.FuzzyEquals = function (color1, color2, epsilon) {
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
                _GLTFMaterialExporter.prototype._convertMaterialsToGLTFAsync = function (babylonMaterials, mimeType, hasTextureCoords) {
                    var promises = [];
                    for (var _i = 0, babylonMaterials_1 = babylonMaterials; _i < babylonMaterials_1.length; _i++) {
                        var babylonMaterial = babylonMaterials_1[_i];
                        if (babylonMaterial instanceof BABYLON.StandardMaterial) {
                            promises.push(this._convertStandardMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
                        }
                        else if (babylonMaterial instanceof BABYLON.PBRMetallicRoughnessMaterial) {
                            promises.push(this._convertPBRMetallicRoughnessMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
                        }
                        else if (babylonMaterial instanceof BABYLON.PBRMaterial) {
                            promises.push(this._convertPBRMaterialAsync(babylonMaterial, mimeType, hasTextureCoords));
                        }
                        else {
                            BABYLON.Tools.Warn("Unsupported material type: " + babylonMaterial.name);
                        }
                    }
                    return Promise.all(promises).then(function () { });
                };
                /**
                 * Makes a copy of the glTF material without the texture parameters
                 * @param originalMaterial original glTF material
                 * @returns glTF material without texture parameters
                 */
                _GLTFMaterialExporter.prototype._stripTexturesFromMaterial = function (originalMaterial) {
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
                _GLTFMaterialExporter.prototype._hasTexturesPresent = function (material) {
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
                _GLTFMaterialExporter.prototype._convertToGLTFPBRMetallicRoughness = function (babylonStandardMaterial) {
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
                    var specularPower = BABYLON.Scalar.Clamp(babylonStandardMaterial.specularPower, 0, _GLTFMaterialExporter._MaxSpecularPower);
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
                _GLTFMaterialExporter._SolveMetallic = function (diffuse, specular, oneMinusSpecularStrength) {
                    if (specular < this._DielectricSpecular.r) {
                        this._DielectricSpecular;
                        return 0;
                    }
                    var a = this._DielectricSpecular.r;
                    var b = diffuse * oneMinusSpecularStrength / (1.0 - this._DielectricSpecular.r) + specular - 2.0 * this._DielectricSpecular.r;
                    var c = this._DielectricSpecular.r - specular;
                    var D = b * b - 4.0 * a * c;
                    return BABYLON.Scalar.Clamp((-b + Math.sqrt(D)) / (2.0 * a), 0, 1);
                };
                /**
                 * Gets the glTF alpha mode from the Babylon Material
                 * @param babylonMaterial Babylon Material
                 * @returns The Babylon alpha mode value
                 */
                _GLTFMaterialExporter.prototype._getAlphaMode = function (babylonMaterial) {
                    if (babylonMaterial.needAlphaBlending()) {
                        return "BLEND" /* BLEND */;
                    }
                    else if (babylonMaterial.needAlphaTesting()) {
                        return "MASK" /* MASK */;
                    }
                    else {
                        return "OPAQUE" /* OPAQUE */;
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
                _GLTFMaterialExporter.prototype._convertStandardMaterialAsync = function (babylonStandardMaterial, mimeType, hasTextureCoords) {
                    var materialMap = this._exporter._materialMap;
                    var materials = this._exporter._materials;
                    var alphaMode = this._getAlphaMode(babylonStandardMaterial);
                    var promises = [];
                    var glTFPbrMetallicRoughness = this._convertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
                    var glTFMaterial = { name: babylonStandardMaterial.name };
                    if (babylonStandardMaterial.backFaceCulling != null && !babylonStandardMaterial.backFaceCulling) {
                        if (!babylonStandardMaterial.twoSidedLighting) {
                            BABYLON.Tools.Warn(babylonStandardMaterial.name + ": Back-face culling enabled and two-sided lighting disabled is not supported in glTF.");
                        }
                        glTFMaterial.doubleSided = true;
                    }
                    if (hasTextureCoords) {
                        if (babylonStandardMaterial.diffuseTexture) {
                            promises.push(this._exportTextureAsync(babylonStandardMaterial.diffuseTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                                }
                            }));
                        }
                        if (babylonStandardMaterial.bumpTexture) {
                            promises.push(this._exportTextureAsync(babylonStandardMaterial.bumpTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFMaterial.normalTexture = glTFTexture;
                                    if (babylonStandardMaterial.bumpTexture != null && babylonStandardMaterial.bumpTexture.level !== 1) {
                                        glTFMaterial.normalTexture.scale = babylonStandardMaterial.bumpTexture.level;
                                    }
                                }
                            }));
                        }
                        if (babylonStandardMaterial.emissiveTexture) {
                            glTFMaterial.emissiveFactor = [1.0, 1.0, 1.0];
                            promises.push(this._exportTextureAsync(babylonStandardMaterial.emissiveTexture, mimeType).then(function (glTFEmissiveTexture) {
                                if (glTFEmissiveTexture) {
                                    glTFMaterial.emissiveTexture = glTFEmissiveTexture;
                                }
                            }));
                        }
                        if (babylonStandardMaterial.ambientTexture) {
                            promises.push(this._exportTextureAsync(babylonStandardMaterial.ambientTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    var occlusionTexture = {
                                        index: glTFTexture.index
                                    };
                                    glTFMaterial.occlusionTexture = occlusionTexture;
                                    occlusionTexture.strength = 1.0;
                                }
                            }));
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
                    if (babylonStandardMaterial.emissiveColor && !_GLTFMaterialExporter.FuzzyEquals(babylonStandardMaterial.emissiveColor, BABYLON.Color3.Black(), _GLTFMaterialExporter._Epsilon)) {
                        glTFMaterial.emissiveFactor = babylonStandardMaterial.emissiveColor.asArray();
                    }
                    glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                    if (alphaMode !== "OPAQUE" /* OPAQUE */) {
                        switch (alphaMode) {
                            case "BLEND" /* BLEND */: {
                                glTFMaterial.alphaMode = "BLEND" /* BLEND */;
                                break;
                            }
                            case "MASK" /* MASK */: {
                                glTFMaterial.alphaMode = "MASK" /* MASK */;
                                glTFMaterial.alphaCutoff = babylonStandardMaterial.alphaCutOff;
                                break;
                            }
                            default: {
                                BABYLON.Tools.Warn("Unsupported alpha mode " + alphaMode);
                            }
                        }
                    }
                    materials.push(glTFMaterial);
                    materialMap[babylonStandardMaterial.uniqueId] = materials.length - 1;
                    return Promise.all(promises).then(function () { });
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
                _GLTFMaterialExporter.prototype._convertPBRMetallicRoughnessMaterialAsync = function (babylonPBRMetalRoughMaterial, mimeType, hasTextureCoords) {
                    var materialMap = this._exporter._materialMap;
                    var materials = this._exporter._materials;
                    var promises = [];
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
                    var alphaMode = null;
                    if (babylonPBRMetalRoughMaterial.transparencyMode != null) {
                        alphaMode = this._getAlphaMode(babylonPBRMetalRoughMaterial);
                        if (alphaMode) {
                            if (alphaMode !== "OPAQUE" /* OPAQUE */) { //glTF defaults to opaque
                                glTFMaterial.alphaMode = alphaMode;
                                if (alphaMode === "MASK" /* MASK */) {
                                    glTFMaterial.alphaCutoff = babylonPBRMetalRoughMaterial.alphaCutOff;
                                }
                            }
                        }
                    }
                    if (hasTextureCoords) {
                        if (babylonPBRMetalRoughMaterial.baseTexture != null) {
                            promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.baseTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                                }
                            }));
                        }
                        if (babylonPBRMetalRoughMaterial.normalTexture) {
                            promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.normalTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFMaterial.normalTexture = glTFTexture;
                                    if (babylonPBRMetalRoughMaterial.normalTexture.level !== 1) {
                                        glTFMaterial.normalTexture.scale = babylonPBRMetalRoughMaterial.normalTexture.level;
                                    }
                                }
                            }));
                        }
                        if (babylonPBRMetalRoughMaterial.occlusionTexture) {
                            promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.occlusionTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFMaterial.occlusionTexture = glTFTexture;
                                    if (babylonPBRMetalRoughMaterial.occlusionStrength != null) {
                                        glTFMaterial.occlusionTexture.strength = babylonPBRMetalRoughMaterial.occlusionStrength;
                                    }
                                }
                            }));
                        }
                        if (babylonPBRMetalRoughMaterial.emissiveTexture) {
                            promises.push(this._exportTextureAsync(babylonPBRMetalRoughMaterial.emissiveTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFMaterial.emissiveTexture = glTFTexture;
                                }
                            }));
                        }
                    }
                    if (_GLTFMaterialExporter.FuzzyEquals(babylonPBRMetalRoughMaterial.emissiveColor, BABYLON.Color3.Black(), _GLTFMaterialExporter._Epsilon)) {
                        glTFMaterial.emissiveFactor = babylonPBRMetalRoughMaterial.emissiveColor.asArray();
                    }
                    glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                    materials.push(glTFMaterial);
                    materialMap[babylonPBRMetalRoughMaterial.uniqueId] = materials.length - 1;
                    return Promise.all(promises).then(function () { });
                };
                /**
                 * Converts an image typed array buffer to a base64 image
                 * @param buffer typed array buffer
                 * @param width width of the image
                 * @param height height of the image
                 * @param mimeType mimetype of the image
                 * @returns base64 image string
                 */
                _GLTFMaterialExporter.prototype._createBase64FromCanvasAsync = function (buffer, width, height, mimeType) {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        var hostingScene;
                        var textureType = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT;
                        var engine = _this._exporter._getLocalEngine();
                        hostingScene = new BABYLON.Scene(engine);
                        // Create a temporary texture with the texture buffer data
                        var tempTexture = engine.createRawTexture(buffer, width, height, BABYLON.Engine.TEXTUREFORMAT_RGBA, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE, null, textureType);
                        var postProcess = new BABYLON.PostProcess("pass", "pass", null, null, 1, null, BABYLON.Texture.NEAREST_SAMPLINGMODE, engine, false, undefined, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, undefined, null, false);
                        postProcess.getEffect().executeWhenCompiled(function () {
                            postProcess.onApply = function (effect) {
                                effect._bindTexture("textureSampler", tempTexture);
                            };
                            // Set the size of the texture
                            engine.setSize(width, height);
                            hostingScene.postProcessManager.directRender([postProcess], null);
                            postProcess.dispose();
                            tempTexture.dispose();
                            // Read data from WebGL
                            var canvas = engine.getRenderingCanvas();
                            if (canvas) {
                                if (!canvas.toBlob) { // fallback for browsers without "canvas.toBlob"
                                    var dataURL = canvas.toDataURL();
                                    resolve(dataURL);
                                }
                                else {
                                    BABYLON.Tools.ToBlob(canvas, function (blob) {
                                        if (blob) {
                                            var fileReader = new FileReader();
                                            fileReader.onload = function (event) {
                                                var base64String = event.target.result;
                                                hostingScene.dispose();
                                                resolve(base64String);
                                            };
                                            fileReader.readAsDataURL(blob);
                                        }
                                        else {
                                            reject("gltfMaterialExporter: Failed to get blob from image canvas!");
                                        }
                                    });
                                }
                            }
                            else {
                                reject("Engine is missing a canvas!");
                            }
                        });
                    });
                };
                /**
                 * Generates a white texture based on the specified width and height
                 * @param width width of the texture in pixels
                 * @param height height of the texture in pixels
                 * @param scene babylonjs scene
                 * @returns white texture
                 */
                _GLTFMaterialExporter.prototype._createWhiteTexture = function (width, height, scene) {
                    var data = new Uint8Array(width * height * 4);
                    for (var i = 0; i < data.length; i = i + 4) {
                        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0xFF;
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
                _GLTFMaterialExporter.prototype._resizeTexturesToSameDimensions = function (texture1, texture2, scene) {
                    var texture1Size = texture1 ? texture1.getSize() : { width: 0, height: 0 };
                    var texture2Size = texture2 ? texture2.getSize() : { width: 0, height: 0 };
                    var resizedTexture1;
                    var resizedTexture2;
                    if (texture1Size.width < texture2Size.width) {
                        if (texture1 && texture1 instanceof BABYLON.Texture) {
                            resizedTexture1 = BABYLON.TextureTools.CreateResizedCopy(texture1, texture2Size.width, texture2Size.height, true);
                        }
                        else {
                            resizedTexture1 = this._createWhiteTexture(texture2Size.width, texture2Size.height, scene);
                        }
                        resizedTexture2 = texture2;
                    }
                    else if (texture1Size.width > texture2Size.width) {
                        if (texture2 && texture2 instanceof BABYLON.Texture) {
                            resizedTexture2 = BABYLON.TextureTools.CreateResizedCopy(texture2, texture1Size.width, texture1Size.height, true);
                        }
                        else {
                            resizedTexture2 = this._createWhiteTexture(texture1Size.width, texture1Size.height, scene);
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
                 * Converts an array of pixels to a Float32Array
                 * Throws an error if the pixel format is not supported
                 * @param pixels - array buffer containing pixel values
                 * @returns Float32 of pixels
                 */
                _GLTFMaterialExporter.prototype._convertPixelArrayToFloat32 = function (pixels) {
                    if (pixels instanceof Uint8Array) {
                        var length_1 = pixels.length;
                        var buffer = new Float32Array(pixels.length);
                        for (var i = 0; i < length_1; ++i) {
                            buffer[i] = pixels[i] / 255;
                        }
                        return buffer;
                    }
                    else if (pixels instanceof Float32Array) {
                        return pixels;
                    }
                    else {
                        throw new Error('Unsupported pixel format!');
                    }
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
                _GLTFMaterialExporter.prototype._convertSpecularGlossinessTexturesToMetallicRoughnessAsync = function (diffuseTexture, specularGlossinessTexture, factors, mimeType) {
                    var promises = [];
                    if (!(diffuseTexture || specularGlossinessTexture)) {
                        return Promise.reject('_ConvertSpecularGlosinessTexturesToMetallicRoughness: diffuse and specular glossiness textures are not defined!');
                    }
                    var scene = diffuseTexture ? diffuseTexture.getScene() : specularGlossinessTexture ? specularGlossinessTexture.getScene() : null;
                    if (scene) {
                        var resizedTextures = this._resizeTexturesToSameDimensions(diffuseTexture, specularGlossinessTexture, scene);
                        var diffuseSize = resizedTextures.texture1.getSize();
                        var diffuseBuffer = void 0;
                        var specularGlossinessBuffer = void 0;
                        var width = diffuseSize.width;
                        var height = diffuseSize.height;
                        var diffusePixels = resizedTextures.texture1.readPixels();
                        var specularPixels = resizedTextures.texture2.readPixels();
                        if (diffusePixels) {
                            diffuseBuffer = this._convertPixelArrayToFloat32(diffusePixels);
                        }
                        else {
                            return Promise.reject("Failed to retrieve pixels from diffuse texture!");
                        }
                        if (specularPixels) {
                            specularGlossinessBuffer = this._convertPixelArrayToFloat32(specularPixels);
                        }
                        else {
                            return Promise.reject("Failed to retrieve pixels from specular glossiness texture!");
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
                                var diffuseColor = new BABYLON.Color3(diffuseBuffer[offset], diffuseBuffer[offset + 1], diffuseBuffer[offset + 2]).toLinearSpace().multiply(factors.diffuseColor);
                                var specularColor = new BABYLON.Color3(specularGlossinessBuffer[offset], specularGlossinessBuffer[offset + 1], specularGlossinessBuffer[offset + 2]).toLinearSpace().multiply(factors.specularColor);
                                var glossiness = (specularGlossinessBuffer[offset + 3]) * factors.glossiness;
                                var specularGlossiness = {
                                    diffuseColor: diffuseColor,
                                    specularColor: specularColor,
                                    glossiness: glossiness
                                };
                                var metallicRoughness = this._convertSpecularGlossinessToMetallicRoughness(specularGlossiness);
                                maxBaseColor.r = Math.max(maxBaseColor.r, metallicRoughness.baseColor.r);
                                maxBaseColor.g = Math.max(maxBaseColor.g, metallicRoughness.baseColor.g);
                                maxBaseColor.b = Math.max(maxBaseColor.b, metallicRoughness.baseColor.b);
                                maxMetallic = Math.max(maxMetallic, metallicRoughness.metallic);
                                maxRoughness = Math.max(maxRoughness, metallicRoughness.roughness);
                                baseColorBuffer[offset] = metallicRoughness.baseColor.r * 255;
                                baseColorBuffer[offset + 1] = metallicRoughness.baseColor.g * 255;
                                baseColorBuffer[offset + 2] = metallicRoughness.baseColor.b * 255;
                                baseColorBuffer[offset + 3] = resizedTextures.texture1.hasAlpha ? diffuseBuffer[offset + 3] * 255 : 255;
                                metallicRoughnessBuffer[offset] = 0;
                                metallicRoughnessBuffer[offset + 1] = metallicRoughness.roughness * 255;
                                metallicRoughnessBuffer[offset + 2] = metallicRoughness.metallic * 255;
                                metallicRoughnessBuffer[offset + 3] = 255;
                            }
                        }
                        // Retrieves the metallic roughness factors from the maximum texture values.
                        var metallicRoughnessFactors_1 = {
                            baseColor: maxBaseColor,
                            metallic: maxMetallic,
                            roughness: maxRoughness
                        };
                        var writeOutMetallicRoughnessTexture = false;
                        var writeOutBaseColorTexture = false;
                        for (var h = 0; h < height; ++h) {
                            for (var w = 0; w < width; ++w) {
                                var destinationOffset = (width * h + w) * strideSize;
                                baseColorBuffer[destinationOffset] /= metallicRoughnessFactors_1.baseColor.r > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.baseColor.r : 1;
                                baseColorBuffer[destinationOffset + 1] /= metallicRoughnessFactors_1.baseColor.g > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.baseColor.g : 1;
                                baseColorBuffer[destinationOffset + 2] /= metallicRoughnessFactors_1.baseColor.b > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.baseColor.b : 1;
                                var linearBaseColorPixel = BABYLON.Color3.FromInts(baseColorBuffer[destinationOffset], baseColorBuffer[destinationOffset + 1], baseColorBuffer[destinationOffset + 2]);
                                var sRGBBaseColorPixel = linearBaseColorPixel.toGammaSpace();
                                baseColorBuffer[destinationOffset] = sRGBBaseColorPixel.r * 255;
                                baseColorBuffer[destinationOffset + 1] = sRGBBaseColorPixel.g * 255;
                                baseColorBuffer[destinationOffset + 2] = sRGBBaseColorPixel.b * 255;
                                if (!_GLTFMaterialExporter.FuzzyEquals(sRGBBaseColorPixel, BABYLON.Color3.White(), _GLTFMaterialExporter._Epsilon)) {
                                    writeOutBaseColorTexture = true;
                                }
                                metallicRoughnessBuffer[destinationOffset + 1] /= metallicRoughnessFactors_1.roughness > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.roughness : 1;
                                metallicRoughnessBuffer[destinationOffset + 2] /= metallicRoughnessFactors_1.metallic > _GLTFMaterialExporter._Epsilon ? metallicRoughnessFactors_1.metallic : 1;
                                var metallicRoughnessPixel = BABYLON.Color3.FromInts(255, metallicRoughnessBuffer[destinationOffset + 1], metallicRoughnessBuffer[destinationOffset + 2]);
                                if (!_GLTFMaterialExporter.FuzzyEquals(metallicRoughnessPixel, BABYLON.Color3.White(), _GLTFMaterialExporter._Epsilon)) {
                                    writeOutMetallicRoughnessTexture = true;
                                }
                            }
                        }
                        if (writeOutMetallicRoughnessTexture) {
                            var promise = this._createBase64FromCanvasAsync(metallicRoughnessBuffer, width, height, mimeType).then(function (metallicRoughnessBase64) {
                                metallicRoughnessFactors_1.metallicRoughnessTextureBase64 = metallicRoughnessBase64;
                            });
                            promises.push(promise);
                        }
                        if (writeOutBaseColorTexture) {
                            var promise = this._createBase64FromCanvasAsync(baseColorBuffer, width, height, mimeType).then(function (baseColorBase64) {
                                metallicRoughnessFactors_1.baseColorTextureBase64 = baseColorBase64;
                            });
                            promises.push(promise);
                        }
                        return Promise.all(promises).then(function () {
                            return metallicRoughnessFactors_1;
                        });
                    }
                    else {
                        return Promise.reject("_ConvertSpecularGlossinessTexturesToMetallicRoughness: Scene from textures is missing!");
                    }
                };
                /**
                 * Converts specular glossiness material properties to metallic roughness
                 * @param specularGlossiness interface with specular glossiness material properties
                 * @returns interface with metallic roughness material properties
                 */
                _GLTFMaterialExporter.prototype._convertSpecularGlossinessToMetallicRoughness = function (specularGlossiness) {
                    var diffusePerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.diffuseColor);
                    var specularPerceivedBrightness = this._getPerceivedBrightness(specularGlossiness.specularColor);
                    var oneMinusSpecularStrength = 1 - this._getMaxComponent(specularGlossiness.specularColor);
                    var metallic = _GLTFMaterialExporter._SolveMetallic(diffusePerceivedBrightness, specularPerceivedBrightness, oneMinusSpecularStrength);
                    var baseColorFromDiffuse = specularGlossiness.diffuseColor.scale(oneMinusSpecularStrength / (1.0 - _GLTFMaterialExporter._DielectricSpecular.r) / Math.max(1 - metallic, _GLTFMaterialExporter._Epsilon));
                    var baseColorFromSpecular = specularGlossiness.specularColor.subtract(_GLTFMaterialExporter._DielectricSpecular.scale(1 - metallic)).scale(1 / Math.max(metallic, _GLTFMaterialExporter._Epsilon));
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
                _GLTFMaterialExporter.prototype._getPerceivedBrightness = function (color) {
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
                _GLTFMaterialExporter.prototype._getMaxComponent = function (color) {
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
                _GLTFMaterialExporter.prototype._convertMetalRoughFactorsToMetallicRoughnessAsync = function (babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords) {
                    var promises = [];
                    var metallicRoughness = {
                        baseColor: babylonPBRMaterial.albedoColor,
                        metallic: babylonPBRMaterial.metallic,
                        roughness: babylonPBRMaterial.roughness
                    };
                    if (hasTextureCoords) {
                        if (babylonPBRMaterial.albedoTexture) {
                            promises.push(this._exportTextureAsync(babylonPBRMaterial.albedoTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFPbrMetallicRoughness.baseColorTexture = glTFTexture;
                                }
                            }));
                        }
                        if (babylonPBRMaterial.metallicTexture) {
                            promises.push(this._exportTextureAsync(babylonPBRMaterial.metallicTexture, mimeType).then(function (glTFTexture) {
                                if (glTFTexture) {
                                    glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFTexture;
                                }
                            }));
                        }
                    }
                    return Promise.all(promises).then(function () {
                        return metallicRoughness;
                    });
                };
                _GLTFMaterialExporter.prototype._getGLTFTextureSampler = function (texture) {
                    var sampler = this._getGLTFTextureWrapModesSampler(texture);
                    var samplingMode = texture instanceof BABYLON.Texture ? texture.samplingMode : null;
                    if (samplingMode != null) {
                        switch (samplingMode) {
                            case BABYLON.Texture.LINEAR_LINEAR: {
                                sampler.magFilter = 9729 /* LINEAR */;
                                sampler.minFilter = 9729 /* LINEAR */;
                                break;
                            }
                            case BABYLON.Texture.LINEAR_NEAREST: {
                                sampler.magFilter = 9729 /* LINEAR */;
                                sampler.minFilter = 9728 /* NEAREST */;
                                break;
                            }
                            case BABYLON.Texture.NEAREST_LINEAR: {
                                sampler.magFilter = 9728 /* NEAREST */;
                                sampler.minFilter = 9729 /* LINEAR */;
                                break;
                            }
                            case BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR: {
                                sampler.magFilter = 9728 /* NEAREST */;
                                sampler.minFilter = 9987 /* LINEAR_MIPMAP_LINEAR */;
                                break;
                            }
                            case BABYLON.Texture.NEAREST_NEAREST: {
                                sampler.magFilter = 9728 /* NEAREST */;
                                sampler.minFilter = 9728 /* NEAREST */;
                                break;
                            }
                            case BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST: {
                                sampler.magFilter = 9728 /* NEAREST */;
                                sampler.minFilter = 9985 /* LINEAR_MIPMAP_NEAREST */;
                                break;
                            }
                            case BABYLON.Texture.LINEAR_NEAREST_MIPNEAREST: {
                                sampler.magFilter = 9729 /* LINEAR */;
                                sampler.minFilter = 9984 /* NEAREST_MIPMAP_NEAREST */;
                                break;
                            }
                            case BABYLON.Texture.LINEAR_NEAREST_MIPLINEAR: {
                                sampler.magFilter = 9729 /* LINEAR */;
                                sampler.minFilter = 9986 /* NEAREST_MIPMAP_LINEAR */;
                                break;
                            }
                            case BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR: {
                                sampler.magFilter = 9728 /* NEAREST */;
                                sampler.minFilter = 9986 /* NEAREST_MIPMAP_LINEAR */;
                                break;
                            }
                            case BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR: {
                                sampler.magFilter = 9729 /* LINEAR */;
                                sampler.minFilter = 9987 /* LINEAR_MIPMAP_LINEAR */;
                                break;
                            }
                            case BABYLON.Texture.LINEAR_LINEAR_MIPNEAREST: {
                                sampler.magFilter = 9729 /* LINEAR */;
                                sampler.minFilter = 9985 /* LINEAR_MIPMAP_NEAREST */;
                                break;
                            }
                            case BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST: {
                                sampler.magFilter = 9728 /* NEAREST */;
                                sampler.minFilter = 9984 /* NEAREST_MIPMAP_NEAREST */;
                                break;
                            }
                        }
                    }
                    return sampler;
                };
                _GLTFMaterialExporter.prototype._getGLTFTextureWrapMode = function (wrapMode) {
                    switch (wrapMode) {
                        case BABYLON.Texture.WRAP_ADDRESSMODE: {
                            return 10497 /* REPEAT */;
                        }
                        case BABYLON.Texture.CLAMP_ADDRESSMODE: {
                            return 33071 /* CLAMP_TO_EDGE */;
                        }
                        case BABYLON.Texture.MIRROR_ADDRESSMODE: {
                            return 33648 /* MIRRORED_REPEAT */;
                        }
                        default: {
                            BABYLON.Tools.Error("Unsupported Texture Wrap Mode " + wrapMode + "!");
                            return 10497 /* REPEAT */;
                        }
                    }
                };
                _GLTFMaterialExporter.prototype._getGLTFTextureWrapModesSampler = function (texture) {
                    var wrapS = this._getGLTFTextureWrapMode(texture instanceof BABYLON.Texture ? texture.wrapU : BABYLON.Texture.WRAP_ADDRESSMODE);
                    var wrapT = this._getGLTFTextureWrapMode(texture instanceof BABYLON.Texture ? texture.wrapV : BABYLON.Texture.WRAP_ADDRESSMODE);
                    if (wrapS === 10497 /* REPEAT */ && wrapT === 10497 /* REPEAT */) { // default wrapping mode in glTF, so omitting
                        return {};
                    }
                    return { wrapS: wrapS, wrapT: wrapT };
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
                _GLTFMaterialExporter.prototype._convertSpecGlossFactorsToMetallicRoughnessAsync = function (babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords) {
                    var _this = this;
                    return Promise.resolve().then(function () {
                        var samplers = _this._exporter._samplers;
                        var textures = _this._exporter._textures;
                        var specGloss = {
                            diffuseColor: babylonPBRMaterial.albedoColor || BABYLON.Color3.White(),
                            specularColor: babylonPBRMaterial.reflectivityColor || BABYLON.Color3.White(),
                            glossiness: babylonPBRMaterial.microSurface || 1,
                        };
                        var samplerIndex = null;
                        var sampler = _this._getGLTFTextureSampler(babylonPBRMaterial.albedoTexture);
                        if (sampler.magFilter != null && sampler.minFilter != null && sampler.wrapS != null && sampler.wrapT != null) {
                            samplers.push(sampler);
                            samplerIndex = samplers.length - 1;
                        }
                        if (babylonPBRMaterial.reflectivityTexture && !babylonPBRMaterial.useMicroSurfaceFromReflectivityMapAlpha) {
                            return Promise.reject("_ConvertPBRMaterial: Glossiness values not included in the reflectivity texture are currently not supported");
                        }
                        if ((babylonPBRMaterial.albedoTexture || babylonPBRMaterial.reflectivityTexture) && hasTextureCoords) {
                            return _this._convertSpecularGlossinessTexturesToMetallicRoughnessAsync(babylonPBRMaterial.albedoTexture, babylonPBRMaterial.reflectivityTexture, specGloss, mimeType).then(function (metallicRoughnessFactors) {
                                if (metallicRoughnessFactors.baseColorTextureBase64) {
                                    var glTFBaseColorTexture = _this._getTextureInfoFromBase64(metallicRoughnessFactors.baseColorTextureBase64, "bjsBaseColorTexture_" + (textures.length) + ".png", mimeType, babylonPBRMaterial.albedoTexture ? babylonPBRMaterial.albedoTexture.coordinatesIndex : null, samplerIndex);
                                    if (glTFBaseColorTexture) {
                                        glTFPbrMetallicRoughness.baseColorTexture = glTFBaseColorTexture;
                                    }
                                }
                                if (metallicRoughnessFactors.metallicRoughnessTextureBase64) {
                                    var glTFMRColorTexture = _this._getTextureInfoFromBase64(metallicRoughnessFactors.metallicRoughnessTextureBase64, "bjsMetallicRoughnessTexture_" + (textures.length) + ".png", mimeType, babylonPBRMaterial.reflectivityTexture ? babylonPBRMaterial.reflectivityTexture.coordinatesIndex : null, samplerIndex);
                                    if (glTFMRColorTexture) {
                                        glTFPbrMetallicRoughness.metallicRoughnessTexture = glTFMRColorTexture;
                                    }
                                }
                                return metallicRoughnessFactors;
                            });
                        }
                        else {
                            return _this._convertSpecularGlossinessToMetallicRoughness(specGloss);
                        }
                    });
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
                _GLTFMaterialExporter.prototype._convertPBRMaterialAsync = function (babylonPBRMaterial, mimeType, hasTextureCoords) {
                    var _this = this;
                    var glTFPbrMetallicRoughness = {};
                    var glTFMaterial = {
                        name: babylonPBRMaterial.name
                    };
                    var useMetallicRoughness = babylonPBRMaterial.isMetallicWorkflow();
                    if (useMetallicRoughness) {
                        if (babylonPBRMaterial.albedoColor) {
                            glTFPbrMetallicRoughness.baseColorFactor = [
                                babylonPBRMaterial.albedoColor.r,
                                babylonPBRMaterial.albedoColor.g,
                                babylonPBRMaterial.albedoColor.b,
                                babylonPBRMaterial.alpha
                            ];
                        }
                        return this._convertMetalRoughFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords).then(function (metallicRoughness) {
                            return _this.setMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords);
                        });
                    }
                    else {
                        return this._convertSpecGlossFactorsToMetallicRoughnessAsync(babylonPBRMaterial, mimeType, glTFPbrMetallicRoughness, hasTextureCoords).then(function (metallicRoughness) {
                            return _this.setMetallicRoughnessPbrMaterial(metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords);
                        });
                    }
                };
                _GLTFMaterialExporter.prototype.setMetallicRoughnessPbrMaterial = function (metallicRoughness, babylonPBRMaterial, glTFMaterial, glTFPbrMetallicRoughness, mimeType, hasTextureCoords) {
                    var materialMap = this._exporter._materialMap;
                    var materials = this._exporter._materials;
                    var promises = [];
                    if (metallicRoughness) {
                        var alphaMode = null;
                        if (babylonPBRMaterial.transparencyMode != null) {
                            alphaMode = this._getAlphaMode(babylonPBRMaterial);
                            if (alphaMode) {
                                if (alphaMode !== "OPAQUE" /* OPAQUE */) { //glTF defaults to opaque
                                    glTFMaterial.alphaMode = alphaMode;
                                    if (alphaMode === "MASK" /* MASK */) {
                                        glTFMaterial.alphaCutoff = babylonPBRMaterial.alphaCutOff;
                                    }
                                }
                            }
                        }
                        if (!(_GLTFMaterialExporter.FuzzyEquals(metallicRoughness.baseColor, BABYLON.Color3.White(), _GLTFMaterialExporter._Epsilon) && babylonPBRMaterial.alpha >= _GLTFMaterialExporter._Epsilon)) {
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
                                var promise = this._exportTextureAsync(babylonPBRMaterial.bumpTexture, mimeType).then(function (glTFTexture) {
                                    if (glTFTexture) {
                                        glTFMaterial.normalTexture = glTFTexture;
                                        if (babylonPBRMaterial.bumpTexture.level !== 1) {
                                            glTFMaterial.normalTexture.scale = babylonPBRMaterial.bumpTexture.level;
                                        }
                                    }
                                });
                                promises.push(promise);
                            }
                            if (babylonPBRMaterial.ambientTexture) {
                                var promise = this._exportTextureAsync(babylonPBRMaterial.ambientTexture, mimeType).then(function (glTFTexture) {
                                    if (glTFTexture) {
                                        var occlusionTexture = {
                                            index: glTFTexture.index
                                        };
                                        glTFMaterial.occlusionTexture = occlusionTexture;
                                        if (babylonPBRMaterial.ambientTextureStrength) {
                                            occlusionTexture.strength = babylonPBRMaterial.ambientTextureStrength;
                                        }
                                    }
                                });
                                promises.push(promise);
                            }
                            if (babylonPBRMaterial.emissiveTexture) {
                                var promise = this._exportTextureAsync(babylonPBRMaterial.emissiveTexture, mimeType).then(function (glTFTexture) {
                                    if (glTFTexture) {
                                        glTFMaterial.emissiveTexture = glTFTexture;
                                    }
                                });
                                promises.push(promise);
                            }
                        }
                        if (!_GLTFMaterialExporter.FuzzyEquals(babylonPBRMaterial.emissiveColor, BABYLON.Color3.Black(), _GLTFMaterialExporter._Epsilon)) {
                            glTFMaterial.emissiveFactor = babylonPBRMaterial.emissiveColor.asArray();
                        }
                        glTFMaterial.pbrMetallicRoughness = glTFPbrMetallicRoughness;
                        materials.push(glTFMaterial);
                        materialMap[babylonPBRMaterial.uniqueId] = materials.length - 1;
                    }
                    return Promise.all(promises).then(function (result) { });
                };
                _GLTFMaterialExporter.prototype.getPixelsFromTexture = function (babylonTexture) {
                    var pixels = babylonTexture.textureType === BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT ? babylonTexture.readPixels() : babylonTexture.readPixels();
                    return pixels;
                };
                /**
                 * Extracts a texture from a Babylon texture into file data and glTF data
                 * @param babylonTexture Babylon texture to extract
                 * @param mimeType Mime Type of the babylonTexture
                 * @return glTF texture info, or null if the texture format is not supported
                 */
                _GLTFMaterialExporter.prototype._exportTextureAsync = function (babylonTexture, mimeType) {
                    var _this = this;
                    var extensionPromise = this._exporter._extensionsPreExportTextureAsync("exporter", babylonTexture, mimeType);
                    if (!extensionPromise) {
                        return this._exportTextureInfoAsync(babylonTexture, mimeType);
                    }
                    return extensionPromise.then(function (texture) {
                        if (!texture) {
                            return _this._exportTextureInfoAsync(babylonTexture, mimeType);
                        }
                        return _this._exportTextureInfoAsync(texture, mimeType);
                    });
                };
                _GLTFMaterialExporter.prototype._exportTextureInfoAsync = function (babylonTexture, mimeType) {
                    var _this = this;
                    return Promise.resolve().then(function () {
                        var textureUid = babylonTexture.uid;
                        if (textureUid in _this._textureMap) {
                            return _this._textureMap[textureUid];
                        }
                        else {
                            var samplers = _this._exporter._samplers;
                            var sampler = _this._getGLTFTextureSampler(babylonTexture);
                            var samplerIndex_1 = null;
                            //  if a pre-existing sampler with identical parameters exists, then reuse the previous sampler
                            var foundSamplerIndex = null;
                            for (var i = 0; i < samplers.length; ++i) {
                                var s = samplers[i];
                                if (s.minFilter === sampler.minFilter && s.magFilter === sampler.magFilter &&
                                    s.wrapS === sampler.wrapS && s.wrapT === sampler.wrapT) {
                                    foundSamplerIndex = i;
                                    break;
                                }
                            }
                            if (foundSamplerIndex == null) {
                                samplers.push(sampler);
                                samplerIndex_1 = samplers.length - 1;
                            }
                            else {
                                samplerIndex_1 = foundSamplerIndex;
                            }
                            var pixels = _this.getPixelsFromTexture(babylonTexture);
                            var size = babylonTexture.getSize();
                            return _this._createBase64FromCanvasAsync(pixels, size.width, size.height, mimeType).then(function (base64Data) {
                                var textureInfo = _this._getTextureInfoFromBase64(base64Data, babylonTexture.name.replace(/\.\/|\/|\.\\|\\/g, "_"), mimeType, babylonTexture.coordinatesIndex, samplerIndex_1);
                                if (textureInfo) {
                                    _this._textureMap[textureUid] = textureInfo;
                                }
                                return textureInfo;
                            });
                        }
                    });
                };
                /**
                 * Builds a texture from base64 string
                 * @param base64Texture base64 texture string
                 * @param baseTextureName Name to use for the texture
                 * @param mimeType image mime type for the texture
                 * @param images array of images
                 * @param textures array of textures
                 * @param imageData map of image data
                 * @returns glTF texture info, or null if the texture format is not supported
                 */
                _GLTFMaterialExporter.prototype._getTextureInfoFromBase64 = function (base64Texture, baseTextureName, mimeType, texCoordIndex, samplerIndex) {
                    var textures = this._exporter._textures;
                    var images = this._exporter._images;
                    var imageData = this._exporter._imageData;
                    var textureInfo = null;
                    var glTFTexture = {
                        source: images.length,
                        name: baseTextureName
                    };
                    if (samplerIndex != null) {
                        glTFTexture.sampler = samplerIndex;
                    }
                    var binStr = atob(base64Texture.split(',')[1]);
                    var arrBuff = new ArrayBuffer(binStr.length);
                    var arr = new Uint8Array(arrBuff);
                    for (var i = 0, length_2 = binStr.length; i < length_2; ++i) {
                        arr[i] = binStr.charCodeAt(i);
                    }
                    var imageValues = { data: arr, mimeType: mimeType };
                    var extension = mimeType === "image/jpeg" /* JPEG */ ? '.jpeg' : '.png';
                    var textureName = baseTextureName + extension;
                    if (textureName in imageData) {
                        textureName = baseTextureName + "_" + BABYLON.Tools.RandomId() + extension;
                    }
                    imageData[textureName] = imageValues;
                    if (mimeType === "image/jpeg" /* JPEG */ || mimeType === "image/png" /* PNG */) {
                        var glTFImage = {
                            name: baseTextureName,
                            uri: textureName
                        };
                        var foundIndex = null;
                        for (var i = 0; i < images.length; ++i) {
                            if (images[i].uri === textureName) {
                                foundIndex = i;
                                break;
                            }
                        }
                        if (foundIndex == null) {
                            images.push(glTFImage);
                            glTFTexture.source = images.length - 1;
                        }
                        else {
                            glTFTexture.source = foundIndex;
                        }
                        textures.push(glTFTexture);
                        textureInfo = {
                            index: textures.length - 1
                        };
                        if (texCoordIndex != null) {
                            textureInfo.texCoord = texCoordIndex;
                        }
                    }
                    else {
                        BABYLON.Tools.Error("Unsupported texture mime type " + mimeType);
                    }
                    return textureInfo;
                };
                /**
                 * Represents the dielectric specular values for R, G and B
                 */
                _GLTFMaterialExporter._DielectricSpecular = new BABYLON.Color3(0.04, 0.04, 0.04);
                /**
                 * Allows the maximum specular power to be defined for material calculations
                 */
                _GLTFMaterialExporter._MaxSpecularPower = 1024;
                /**
                 * Numeric tolerance value
                 */
                _GLTFMaterialExporter._Epsilon = 1e-6;
                return _GLTFMaterialExporter;
            }());
            Exporter._GLTFMaterialExporter = _GLTFMaterialExporter;
        })(Exporter = GLTF2.Exporter || (GLTF2.Exporter = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterialExporter.js.map

/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Exporter;
        (function (Exporter) {
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
                 * @ignore
                 *
                 * Creates glTF channel animation from BabylonJS animation.
                 * @param babylonTransformNode - BabylonJS mesh.
                 * @param animation - animation.
                 * @param animationChannelTargetPath - The target animation channel.
                 * @param convertToRightHandedSystem - Specifies if the values should be converted to right-handed.
                 * @param useQuaternion - Specifies if quaternions are used.
                 * @returns nullable IAnimationData
                 */
                _GLTFAnimation._CreateNodeAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate) {
                    var inputs = [];
                    var outputs = [];
                    var keyFrames = animation.getKeys();
                    var minMaxKeyFrames = _GLTFAnimation.calculateMinMaxKeyFrames(keyFrames);
                    var interpolationOrBake = _GLTFAnimation._DeduceInterpolation(keyFrames, animationChannelTargetPath, useQuaternion);
                    var frameDelta = minMaxKeyFrames.max - minMaxKeyFrames.min;
                    var interpolation = interpolationOrBake.interpolationType;
                    var shouldBakeAnimation = interpolationOrBake.shouldBakeAnimation;
                    if (shouldBakeAnimation) {
                        _GLTFAnimation._CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
                    }
                    else {
                        if (interpolation === "LINEAR" /* LINEAR */ || interpolation === "STEP" /* STEP */) {
                            _GLTFAnimation._CreateLinearOrStepAnimation(babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                        }
                        else if (interpolation === "CUBICSPLINE" /* CUBICSPLINE */) {
                            _GLTFAnimation._CreateCubicSplineAnimation(babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                        }
                        else {
                            _GLTFAnimation._CreateBakedAnimation(babylonTransformNode, animation, animationChannelTargetPath, minMaxKeyFrames.min, minMaxKeyFrames.max, animation.framePerSecond, animationSampleRate, inputs, outputs, minMaxKeyFrames, convertToRightHandedSystem, useQuaternion);
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
                 * @ignore
                 * Create node animations from the transform node animations
                 * @param babylonTransformNode
                 * @param runtimeGLTFAnimation
                 * @param idleGLTFAnimations
                 * @param nodeMap
                 * @param nodes
                 * @param binaryWriter
                 * @param bufferViews
                 * @param accessors
                 * @param convertToRightHandedSystem
                 */
                _GLTFAnimation._CreateNodeAnimationFromTransformNodeAnimations = function (babylonTransformNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, nodes, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationSampleRate) {
                    var glTFAnimation;
                    if (babylonTransformNode.animations) {
                        for (var _i = 0, _a = babylonTransformNode.animations; _i < _a.length; _i++) {
                            var animation = _a[_i];
                            var animationInfo = _GLTFAnimation._DeduceAnimationInfo(animation);
                            if (animationInfo) {
                                glTFAnimation = {
                                    name: animation.name,
                                    samplers: [],
                                    channels: []
                                };
                                _GLTFAnimation.AddAnimation("" + animation.name, animation.hasRunningRuntimeAnimations ? runtimeGLTFAnimation : glTFAnimation, babylonTransformNode, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationInfo.useQuaternion, animationSampleRate);
                                if (glTFAnimation.samplers.length && glTFAnimation.channels.length) {
                                    idleGLTFAnimations.push(glTFAnimation);
                                }
                            }
                        }
                    }
                };
                /**
                 * @ignore
                 * Create node animations from the animation groups
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
                        for (var _i = 0, animationGroups_1 = animationGroups; _i < animationGroups_1.length; _i++) {
                            var animationGroup = animationGroups_1[_i];
                            glTFAnimation = {
                                name: animationGroup.name,
                                channels: [],
                                samplers: []
                            };
                            for (var _a = 0, _b = animationGroup.targetedAnimations; _a < _b.length; _a++) {
                                var targetAnimation = _b[_a];
                                var target = targetAnimation.target;
                                var animation = targetAnimation.animation;
                                if (target instanceof BABYLON.Mesh || target.length === 1 && target[0] instanceof BABYLON.Mesh) { // TODO: Update to support bones
                                    var animationInfo = _GLTFAnimation._DeduceAnimationInfo(targetAnimation.animation);
                                    if (animationInfo) {
                                        var babylonMesh = target instanceof BABYLON.Mesh ? target : target[0];
                                        _GLTFAnimation.AddAnimation("" + animation.name, glTFAnimation, babylonMesh, animation, animationInfo.dataAccessorType, animationInfo.animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, animationInfo.useQuaternion, animationSampleRate);
                                    }
                                }
                            }
                            if (glTFAnimation.channels.length && glTFAnimation.samplers.length) {
                                glTFAnimations.push(glTFAnimation);
                            }
                        }
                    }
                };
                _GLTFAnimation.AddAnimation = function (name, glTFAnimation, babylonTransformNode, animation, dataAccessorType, animationChannelTargetPath, nodeMap, binaryWriter, bufferViews, accessors, convertToRightHandedSystem, useQuaternion, animationSampleRate) {
                    var animationData = _GLTFAnimation._CreateNodeAnimation(babylonTransformNode, animation, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion, animationSampleRate);
                    var bufferView;
                    var accessor;
                    var keyframeAccessorIndex;
                    var dataAccessorIndex;
                    var outputLength;
                    var animationSampler;
                    var animationChannel;
                    if (animationData) {
                        var nodeIndex = nodeMap[babylonTransformNode.uniqueId];
                        // Creates buffer view and accessor for key frames.
                        var byteLength = animationData.inputs.length * 4;
                        bufferView = Exporter._GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, name + "  keyframe data view");
                        bufferViews.push(bufferView);
                        animationData.inputs.forEach(function (input) {
                            binaryWriter.setFloat32(input);
                        });
                        accessor = Exporter._GLTFUtilities._CreateAccessor(bufferViews.length - 1, name + "  keyframes", "SCALAR" /* SCALAR */, 5126 /* FLOAT */, animationData.inputs.length, null, [animationData.inputsMin], [animationData.inputsMax]);
                        accessors.push(accessor);
                        keyframeAccessorIndex = accessors.length - 1;
                        // create bufferview and accessor for keyed values.
                        outputLength = animationData.outputs.length;
                        byteLength = dataAccessorType === "VEC3" /* VEC3 */ ? animationData.outputs.length * 12 : animationData.outputs.length * 16;
                        // check for in and out tangents
                        bufferView = Exporter._GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, name + "  data view");
                        bufferViews.push(bufferView);
                        animationData.outputs.forEach(function (output) {
                            output.forEach(function (entry) {
                                binaryWriter.setFloat32(entry);
                            });
                        });
                        accessor = Exporter._GLTFUtilities._CreateAccessor(bufferViews.length - 1, name + "  data", dataAccessorType, 5126 /* FLOAT */, outputLength, null, null, null);
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
                 * @param babylonTransformNode BabylonJS mesh
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
                _GLTFAnimation._CreateBakedAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, minFrame, maxFrame, fps, sampleRate, inputs, outputs, minMaxFrames, convertToRightHandedSystem, useQuaternion) {
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
                                _GLTFAnimation._SetInterpolatedValue(babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion);
                            }
                        }
                    }
                    if (maxUsedFrame) {
                        minMaxFrames.max = maxUsedFrame;
                    }
                };
                _GLTFAnimation._ConvertFactorToVector3OrQuaternion = function (factor, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion) {
                    var property;
                    var componentName;
                    var value = null;
                    var basePositionRotationOrScale = _GLTFAnimation._GetBasePositionRotationOrScale(babylonTransformNode, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
                    if (animationType === BABYLON.Animation.ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
                        property = animation.targetProperty.split('.');
                        componentName = property ? property[1] : ''; // x, y, or z component
                        value = useQuaternion ? BABYLON.Quaternion.FromArray(basePositionRotationOrScale).normalize() : BABYLON.Vector3.FromArray(basePositionRotationOrScale);
                        switch (componentName) {
                            case 'x': {
                                value[componentName] = (convertToRightHandedSystem && useQuaternion && (animationChannelTargetPath !== "scale" /* SCALE */)) ? -factor : factor;
                                break;
                            }
                            case 'y': {
                                value[componentName] = (convertToRightHandedSystem && useQuaternion && (animationChannelTargetPath !== "scale" /* SCALE */)) ? -factor : factor;
                                break;
                            }
                            case 'z': {
                                value[componentName] = (convertToRightHandedSystem && !useQuaternion && (animationChannelTargetPath !== "scale" /* SCALE */)) ? -factor : factor;
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
                _GLTFAnimation._SetInterpolatedValue = function (babylonTransformNode, value, time, animation, animationChannelTargetPath, quaternionCache, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
                    var animationType = animation.dataType;
                    var cacheValue;
                    inputs.push(time);
                    if (typeof value === "number") {
                        value = this._ConvertFactorToVector3OrQuaternion(value, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
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
                                Exporter._GLTFUtilities._GetRightHandedQuaternionFromRef(quaternionCache);
                                if (!babylonTransformNode.parent) {
                                    quaternionCache = BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(quaternionCache);
                                }
                            }
                            outputs.push(quaternionCache.asArray());
                        }
                        else {
                            cacheValue = value;
                            if (convertToRightHandedSystem && (animationChannelTargetPath !== "scale" /* SCALE */)) {
                                Exporter._GLTFUtilities._GetRightHandedPositionVector3FromRef(cacheValue);
                                if (!babylonTransformNode.parent) {
                                    cacheValue.x *= -1;
                                    cacheValue.z *= -1;
                                }
                            }
                            outputs.push(cacheValue.asArray());
                        }
                    }
                };
                /**
                 * Creates linear animation from the animation key frames
                 * @param babylonTransformNode BabylonJS mesh
                 * @param animation BabylonJS animation
                 * @param animationChannelTargetPath The target animation channel
                 * @param frameDelta The difference between the last and first frame of the animation
                 * @param inputs Array to store the key frame times
                 * @param outputs Array to store the key frame data
                 * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
                 * @param useQuaternion Specifies if quaternions are used in the animation
                 */
                _GLTFAnimation._CreateLinearOrStepAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
                    for (var _i = 0, _a = animation.getKeys(); _i < _a.length; _i++) {
                        var keyFrame = _a[_i];
                        inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
                        _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion);
                    }
                };
                /**
                 * Creates cubic spline animation from the animation key frames
                 * @param babylonTransformNode BabylonJS mesh
                 * @param animation BabylonJS animation
                 * @param animationChannelTargetPath The target animation channel
                 * @param frameDelta The difference between the last and first frame of the animation
                 * @param inputs Array to store the key frame times
                 * @param outputs Array to store the key frame data
                 * @param convertToRightHandedSystem Specifies if the position data should be converted to right handed
                 * @param useQuaternion Specifies if quaternions are used in the animation
                 */
                _GLTFAnimation._CreateCubicSplineAnimation = function (babylonTransformNode, animation, animationChannelTargetPath, frameDelta, inputs, outputs, convertToRightHandedSystem, useQuaternion) {
                    animation.getKeys().forEach(function (keyFrame) {
                        inputs.push(keyFrame.frame / animation.framePerSecond); // keyframes in seconds.
                        _GLTFAnimation.AddSplineTangent(babylonTransformNode, _TangentType.INTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* CUBICSPLINE */, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
                        _GLTFAnimation._AddKeyframeValue(keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion);
                        _GLTFAnimation.AddSplineTangent(babylonTransformNode, _TangentType.OUTTANGENT, outputs, animationChannelTargetPath, "CUBICSPLINE" /* CUBICSPLINE */, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem);
                    });
                };
                _GLTFAnimation._GetBasePositionRotationOrScale = function (babylonTransformNode, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion) {
                    var basePositionRotationOrScale;
                    if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                        if (useQuaternion) {
                            if (babylonTransformNode.rotationQuaternion) {
                                basePositionRotationOrScale = babylonTransformNode.rotationQuaternion.asArray();
                                if (convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedQuaternionArrayFromRef(basePositionRotationOrScale);
                                    if (!babylonTransformNode.parent) {
                                        basePositionRotationOrScale = BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(BABYLON.Quaternion.FromArray(basePositionRotationOrScale)).asArray();
                                    }
                                }
                            }
                            else {
                                basePositionRotationOrScale = BABYLON.Quaternion.Identity().asArray();
                            }
                        }
                        else {
                            basePositionRotationOrScale = babylonTransformNode.rotation.asArray();
                            Exporter._GLTFUtilities._GetRightHandedNormalArray3FromRef(basePositionRotationOrScale);
                        }
                    }
                    else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                        basePositionRotationOrScale = babylonTransformNode.position.asArray();
                        if (convertToRightHandedSystem) {
                            Exporter._GLTFUtilities._GetRightHandedPositionArray3FromRef(basePositionRotationOrScale);
                        }
                    }
                    else { // scale
                        basePositionRotationOrScale = babylonTransformNode.scaling.asArray();
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
                _GLTFAnimation._AddKeyframeValue = function (keyFrame, animation, outputs, animationChannelTargetPath, babylonTransformNode, convertToRightHandedSystem, useQuaternion) {
                    var value;
                    var newPositionRotationOrScale;
                    var animationType = animation.dataType;
                    if (animationType === BABYLON.Animation.ANIMATIONTYPE_VECTOR3) {
                        value = keyFrame.value.asArray();
                        if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                            var array = BABYLON.Vector3.FromArray(value);
                            var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(array.y, array.x, array.z);
                            if (convertToRightHandedSystem) {
                                Exporter._GLTFUtilities._GetRightHandedQuaternionFromRef(rotationQuaternion);
                                if (!babylonTransformNode.parent) {
                                    rotationQuaternion = BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(rotationQuaternion);
                                }
                            }
                            value = rotationQuaternion.asArray();
                        }
                        else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                            if (convertToRightHandedSystem) {
                                Exporter._GLTFUtilities._GetRightHandedNormalArray3FromRef(value);
                                if (!babylonTransformNode.parent) {
                                    value[0] *= -1;
                                    value[2] *= -1;
                                }
                            }
                        }
                        outputs.push(value); // scale  vector.
                    }
                    else if (animationType === BABYLON.Animation.ANIMATIONTYPE_FLOAT) { // handles single component x, y, z or w component animation by using a base property and animating over a component.
                        newPositionRotationOrScale = this._ConvertFactorToVector3OrQuaternion(keyFrame.value, babylonTransformNode, animation, animationType, animationChannelTargetPath, convertToRightHandedSystem, useQuaternion);
                        if (newPositionRotationOrScale) {
                            if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                                var posRotScale = useQuaternion ? newPositionRotationOrScale : BABYLON.Quaternion.RotationYawPitchRoll(newPositionRotationOrScale.y, newPositionRotationOrScale.x, newPositionRotationOrScale.z).normalize();
                                if (convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedQuaternionFromRef(posRotScale);
                                    if (!babylonTransformNode.parent) {
                                        posRotScale = BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(posRotScale);
                                    }
                                }
                                outputs.push(posRotScale.asArray());
                            }
                            else if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                                if (convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedNormalVector3FromRef(newPositionRotationOrScale);
                                    if (!babylonTransformNode.parent) {
                                        newPositionRotationOrScale.x *= -1;
                                        newPositionRotationOrScale.z *= -1;
                                    }
                                }
                            }
                            outputs.push(newPositionRotationOrScale.asArray());
                        }
                    }
                    else if (animationType === BABYLON.Animation.ANIMATIONTYPE_QUATERNION) {
                        value = keyFrame.value.normalize().asArray();
                        if (convertToRightHandedSystem) {
                            Exporter._GLTFUtilities._GetRightHandedQuaternionArrayFromRef(value);
                            if (!babylonTransformNode.parent) {
                                value = BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(BABYLON.Quaternion.FromArray(value)).asArray();
                            }
                        }
                        outputs.push(value);
                    }
                    else {
                        BABYLON.Tools.Error('glTFAnimation: Unsupported key frame values for animation!');
                    }
                };
                /**
                 * Determine the interpolation based on the key frames
                 * @param keyFrames
                 * @param animationChannelTargetPath
                 * @param useQuaternion
                 */
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
                _GLTFAnimation.AddSplineTangent = function (babylonTransformNode, tangentType, outputs, animationChannelTargetPath, interpolation, keyFrame, frameDelta, useQuaternion, convertToRightHandedSystem) {
                    var tangent;
                    var tangentValue = tangentType === _TangentType.INTANGENT ? keyFrame.inTangent : keyFrame.outTangent;
                    if (interpolation === "CUBICSPLINE" /* CUBICSPLINE */) {
                        if (animationChannelTargetPath === "rotation" /* ROTATION */) {
                            if (tangentValue) {
                                if (useQuaternion) {
                                    tangent = tangentValue.scale(frameDelta).asArray();
                                }
                                else {
                                    var array = tangentValue.scale(frameDelta);
                                    tangent = BABYLON.Quaternion.RotationYawPitchRoll(array.y, array.x, array.z).asArray();
                                }
                                if (convertToRightHandedSystem) {
                                    Exporter._GLTFUtilities._GetRightHandedQuaternionArrayFromRef(tangent);
                                    if (!babylonTransformNode.parent) {
                                        tangent = BABYLON.Quaternion.FromArray([0, 1, 0, 0]).multiply(BABYLON.Quaternion.FromArray(tangent)).asArray();
                                    }
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
                                    if (animationChannelTargetPath === "translation" /* TRANSLATION */) {
                                        Exporter._GLTFUtilities._GetRightHandedPositionArray3FromRef(tangent);
                                        if (!babylonTransformNode.parent) {
                                            tangent[0] *= -1; // x
                                            tangent[2] *= -1; // z
                                        }
                                    }
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
            Exporter._GLTFAnimation = _GLTFAnimation;
        })(Exporter = GLTF2.Exporter || (GLTF2.Exporter = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFAnimation.js.map

/// <reference path="../../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Exporter;
        (function (Exporter) {
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
                _GLTFUtilities._CreateBufferView = function (bufferIndex, byteOffset, byteLength, byteStride, name) {
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
                _GLTFUtilities._CreateAccessor = function (bufferviewIndex, name, type, componentType, count, byteOffset, min, max) {
                    var accessor = { name: name, bufferView: bufferviewIndex, componentType: componentType, count: count, type: type };
                    if (min != null) {
                        accessor.min = min;
                    }
                    if (max != null) {
                        accessor.max = max;
                    }
                    if (byteOffset != null) {
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
                _GLTFUtilities._CalculateMinMaxPositions = function (positions, vertexStart, vertexCount, convertToRightHandedSystem) {
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
                                _GLTFUtilities._GetRightHandedPositionVector3FromRef(position);
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
                _GLTFUtilities._GetRightHandedPositionVector3 = function (vector) {
                    return new BABYLON.Vector3(vector.x, vector.y, -vector.z);
                };
                /**
                 * Converts a Vector3 to right-handed
                 * @param vector Vector3 to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedPositionVector3FromRef = function (vector) {
                    vector.z *= -1;
                };
                /**
                 * Converts a three element number array to right-handed
                 * @param vector number array to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedPositionArray3FromRef = function (vector) {
                    vector[2] *= -1;
                };
                /**
                 * Converts a new right-handed Vector3
                 * @param vector vector3 array
                 * @returns right-handed Vector3
                 */
                _GLTFUtilities._GetRightHandedNormalVector3 = function (vector) {
                    return new BABYLON.Vector3(vector.x, vector.y, -vector.z);
                };
                /**
                 * Converts a Vector3 to right-handed
                 * @param vector Vector3 to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedNormalVector3FromRef = function (vector) {
                    vector.z *= -1;
                };
                /**
                 * Converts a three element number array to right-handed
                 * @param vector number array to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedNormalArray3FromRef = function (vector) {
                    vector[2] *= -1;
                };
                /**
                 * Converts a Vector4 to right-handed
                 * @param vector Vector4 to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedVector4FromRef = function (vector) {
                    vector.z *= -1;
                    vector.w *= -1;
                };
                /**
                 * Converts a Vector4 to right-handed
                 * @param vector Vector4 to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedArray4FromRef = function (vector) {
                    vector[2] *= -1;
                    vector[3] *= -1;
                };
                /**
                 * Converts a Quaternion to right-handed
                 * @param quaternion Source quaternion to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedQuaternionFromRef = function (quaternion) {
                    quaternion.x *= -1;
                    quaternion.y *= -1;
                };
                /**
                 * Converts a Quaternion to right-handed
                 * @param quaternion Source quaternion to convert to right-handed
                 */
                _GLTFUtilities._GetRightHandedQuaternionArrayFromRef = function (quaternion) {
                    quaternion[0] *= -1;
                    quaternion[1] *= -1;
                };
                _GLTFUtilities._NormalizeTangentFromRef = function (tangent) {
                    var length = Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y + tangent.z * tangent.z);
                    if (length > 0) {
                        tangent.x /= length;
                        tangent.y /= length;
                        tangent.z /= length;
                    }
                };
                return _GLTFUtilities;
            }());
            Exporter._GLTFUtilities = _GLTFUtilities;
        })(Exporter = GLTF2.Exporter || (GLTF2.Exporter = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFUtilities.js.map

/// <reference path="../../../../dist/preview release/gltf2Interface/babylon.glTF2Interface.d.ts"/>

//# sourceMappingURL=babylon.glTFExporterExtension.js.map

/// <reference path="../../../dist/preview release/glTF2Interface/babylon.glTF2Interface.d.ts"/>

//# sourceMappingURL=babylon.glTFFileExporter.js.map

/// <reference path="../../../../../dist/preview release/gltf2Interface/babylon.glTF2Interface.d.ts"/>
/**
 * @hidden
 */
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var Exporter;
        (function (Exporter) {
            var Extensions;
            (function (Extensions) {
                var NAME = "KHR_texture_transform";
                /**
                 * @hidden
                 */
                var KHR_texture_transform = /** @class */ (function () {
                    function KHR_texture_transform(exporter) {
                        /** Name of this extension */
                        this.name = NAME;
                        /** Defines whether this extension is enabled */
                        this.enabled = true;
                        /** Defines whether this extension is required */
                        this.required = false;
                        this._exporter = exporter;
                    }
                    KHR_texture_transform.prototype.dispose = function () {
                        delete this._exporter;
                    };
                    KHR_texture_transform.prototype.preExportTextureAsync = function (context, babylonTexture, mimeType) {
                        var _this = this;
                        return new Promise(function (resolve, reject) {
                            var texture_transform_extension = {};
                            if (babylonTexture.uOffset !== 0 || babylonTexture.vOffset !== 0) {
                                texture_transform_extension.offset = [babylonTexture.uOffset, babylonTexture.vOffset];
                            }
                            if (babylonTexture.uScale !== 1 || babylonTexture.vScale !== 1) {
                                texture_transform_extension.scale = [babylonTexture.uScale, babylonTexture.vScale];
                            }
                            if (babylonTexture.wAng !== 0) {
                                texture_transform_extension.rotation = babylonTexture.wAng;
                            }
                            if (!Object.keys(texture_transform_extension).length) {
                                resolve(babylonTexture);
                            }
                            var scale = texture_transform_extension.scale ? new BABYLON.Vector2(texture_transform_extension.scale[0], texture_transform_extension.scale[1]) : BABYLON.Vector2.One();
                            var rotation = texture_transform_extension.rotation != null ? texture_transform_extension.rotation : 0;
                            var offset = texture_transform_extension.offset ? new BABYLON.Vector2(texture_transform_extension.offset[0], texture_transform_extension.offset[1]) : BABYLON.Vector2.Zero();
                            var scene = babylonTexture.getScene();
                            if (!scene) {
                                reject(context + ": \"scene\" is not defined for Babylon texture " + babylonTexture.name + "!");
                            }
                            else {
                                _this.textureTransformTextureAsync(babylonTexture, offset, rotation, scale, scene).then(function (texture) {
                                    resolve(texture);
                                });
                            }
                        });
                    };
                    /**
                     * Transform the babylon texture by the offset, rotation and scale parameters using a procedural texture
                     * @param babylonTexture
                     * @param offset
                     * @param rotation
                     * @param scale
                     * @param scene
                     */
                    KHR_texture_transform.prototype.textureTransformTextureAsync = function (babylonTexture, offset, rotation, scale, scene) {
                        return new Promise(function (resolve, reject) {
                            var proceduralTexture = new BABYLON.ProceduralTexture("" + babylonTexture.name, babylonTexture.getSize(), "textureTransform", scene);
                            if (!proceduralTexture) {
                                BABYLON.Tools.Log("Cannot create procedural texture for " + babylonTexture.name + "!");
                                resolve(babylonTexture);
                            }
                            proceduralTexture.setTexture("textureSampler", babylonTexture);
                            proceduralTexture.setMatrix("textureTransformMat", babylonTexture.getTextureMatrix());
                            // isReady trigger creation of effect if it doesnt exist yet
                            if (proceduralTexture.isReady()) {
                                proceduralTexture.render();
                                resolve(proceduralTexture);
                            }
                            else {
                                proceduralTexture._effect.onCompileObservable.add(function () {
                                    proceduralTexture.render();
                                    resolve(proceduralTexture);
                                });
                            }
                        });
                    };
                    return KHR_texture_transform;
                }());
                Extensions.KHR_texture_transform = KHR_texture_transform;
                Exporter._Exporter.RegisterExtension(NAME, function (exporter) { return new KHR_texture_transform(exporter); });
            })(Extensions = Exporter.Extensions || (Exporter.Extensions = {}));
        })(Exporter = GLTF2.Exporter || (GLTF2.Exporter = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_texture_transform.js.map
