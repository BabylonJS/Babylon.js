/// <reference path="../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTFLoaderCoordinateSystemMode;
    (function (GLTFLoaderCoordinateSystemMode) {
        // Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene (scene.useRightHandedSystem).
        // NOTE: When scene.useRightHandedSystem is false, an additional transform will be added to the root to transform the data from right-handed to left-handed.
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["AUTO"] = 0] = "AUTO";
        // The glTF right-handed data is not transformed in any form and is loaded directly.
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["PASS_THROUGH"] = 1] = "PASS_THROUGH";
        // Sets the useRightHandedSystem flag on the scene.
        GLTFLoaderCoordinateSystemMode[GLTFLoaderCoordinateSystemMode["FORCE_RIGHT_HANDED"] = 2] = "FORCE_RIGHT_HANDED";
    })(GLTFLoaderCoordinateSystemMode = BABYLON.GLTFLoaderCoordinateSystemMode || (BABYLON.GLTFLoaderCoordinateSystemMode = {}));
    var GLTFFileLoader = /** @class */ (function () {
        function GLTFFileLoader() {
            // V2 options
            this.coordinateSystemMode = GLTFLoaderCoordinateSystemMode.AUTO;
            this.compileMaterials = false;
            this.compileShadowGenerators = false;
            this.useClipPlane = false;
            this.name = "gltf";
            this.extensions = {
                ".gltf": { isBinary: false },
                ".glb": { isBinary: true }
            };
        }
        GLTFFileLoader.prototype.dispose = function () {
            if (this._loader) {
                this._loader.dispose();
            }
        };
        GLTFFileLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
            try {
                var loaderData = GLTFFileLoader._parse(data);
                if (this.onParsed) {
                    this.onParsed(loaderData);
                }
                this._loader = this._getLoader(loaderData);
                this._loader.importMeshAsync(meshesNames, scene, loaderData, rootUrl, onSuccess, onProgress, onError);
            }
            catch (e) {
                onError(e.message);
            }
        };
        GLTFFileLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
            try {
                var loaderData = GLTFFileLoader._parse(data);
                if (this.onParsed) {
                    this.onParsed(loaderData);
                }
                this._loader = this._getLoader(loaderData);
                this._loader.loadAsync(scene, loaderData, rootUrl, onSuccess, onProgress, onError);
            }
            catch (e) {
                onError(e.message);
            }
        };
        GLTFFileLoader.prototype.canDirectLoad = function (data) {
            return ((data.indexOf("scene") !== -1) && (data.indexOf("node") !== -1));
        };
        GLTFFileLoader.prototype.createPlugin = function () {
            return new GLTFFileLoader();
        };
        GLTFFileLoader._parse = function (data) {
            if (data instanceof ArrayBuffer) {
                return GLTFFileLoader._parseBinary(data);
            }
            return {
                json: JSON.parse(data),
                bin: null
            };
        };
        GLTFFileLoader.prototype._getLoader = function (loaderData) {
            var loaderVersion = { major: 2, minor: 0 };
            var asset = loaderData.json.asset || {};
            var version = GLTFFileLoader._parseVersion(asset.version);
            if (!version) {
                throw new Error("Invalid version: " + asset.version);
            }
            if (asset.minVersion !== undefined) {
                var minVersion = GLTFFileLoader._parseVersion(asset.minVersion);
                if (!minVersion) {
                    throw new Error("Invalid minimum version: " + asset.minVersion);
                }
                if (GLTFFileLoader._compareVersion(minVersion, loaderVersion) > 0) {
                    throw new Error("Incompatible minimum version: " + asset.minVersion);
                }
            }
            var createLoaders = {
                1: GLTFFileLoader.CreateGLTFLoaderV1,
                2: GLTFFileLoader.CreateGLTFLoaderV2
            };
            var createLoader = createLoaders[version.major];
            if (!createLoader) {
                throw new Error("Unsupported version: " + asset.version);
            }
            return createLoader(this);
        };
        GLTFFileLoader._parseBinary = function (data) {
            var Binary = {
                Magic: 0x46546C67
            };
            var binaryReader = new BinaryReader(data);
            var magic = binaryReader.readUint32();
            if (magic !== Binary.Magic) {
                throw new Error("Unexpected magic: " + magic);
            }
            var version = binaryReader.readUint32();
            switch (version) {
                case 1: return GLTFFileLoader._parseV1(binaryReader);
                case 2: return GLTFFileLoader._parseV2(binaryReader);
            }
            throw new Error("Unsupported version: " + version);
        };
        GLTFFileLoader._parseV1 = function (binaryReader) {
            var ContentFormat = {
                JSON: 0
            };
            var length = binaryReader.readUint32();
            if (length != binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            var contentLength = binaryReader.readUint32();
            var contentFormat = binaryReader.readUint32();
            var content;
            switch (contentFormat) {
                case ContentFormat.JSON: {
                    content = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(contentLength)));
                    break;
                }
                default: {
                    throw new Error("Unexpected content format: " + contentFormat);
                }
            }
            var bytesRemaining = binaryReader.getLength() - binaryReader.getPosition();
            var body = binaryReader.readUint8Array(bytesRemaining);
            return {
                json: content,
                bin: body
            };
        };
        GLTFFileLoader._parseV2 = function (binaryReader) {
            var ChunkFormat = {
                JSON: 0x4E4F534A,
                BIN: 0x004E4942
            };
            var length = binaryReader.readUint32();
            if (length !== binaryReader.getLength()) {
                throw new Error("Length in header does not match actual data length: " + length + " != " + binaryReader.getLength());
            }
            // JSON chunk
            var chunkLength = binaryReader.readUint32();
            var chunkFormat = binaryReader.readUint32();
            if (chunkFormat !== ChunkFormat.JSON) {
                throw new Error("First chunk format is not JSON");
            }
            var json = JSON.parse(GLTFFileLoader._decodeBufferToText(binaryReader.readUint8Array(chunkLength)));
            // Look for BIN chunk
            var bin = null;
            while (binaryReader.getPosition() < binaryReader.getLength()) {
                var chunkLength_1 = binaryReader.readUint32();
                var chunkFormat_1 = binaryReader.readUint32();
                switch (chunkFormat_1) {
                    case ChunkFormat.JSON: {
                        throw new Error("Unexpected JSON chunk");
                    }
                    case ChunkFormat.BIN: {
                        bin = binaryReader.readUint8Array(chunkLength_1);
                        break;
                    }
                    default: {
                        // ignore unrecognized chunkFormat
                        binaryReader.skipBytes(chunkLength_1);
                        break;
                    }
                }
            }
            return {
                json: json,
                bin: bin
            };
        };
        GLTFFileLoader._parseVersion = function (version) {
            var match = (version + "").match(/^(\d+)\.(\d+)$/);
            if (!match) {
                return null;
            }
            return {
                major: parseInt(match[1]),
                minor: parseInt(match[2])
            };
        };
        GLTFFileLoader._compareVersion = function (a, b) {
            if (a.major > b.major)
                return 1;
            if (a.major < b.major)
                return -1;
            if (a.minor > b.minor)
                return 1;
            if (a.minor < b.minor)
                return -1;
            return 0;
        };
        GLTFFileLoader._decodeBufferToText = function (buffer) {
            var result = "";
            var length = buffer.byteLength;
            for (var i = 0; i < length; i++) {
                result += String.fromCharCode(buffer[i]);
            }
            return result;
        };
        // V1 options
        GLTFFileLoader.HomogeneousCoordinates = false;
        GLTFFileLoader.IncrementalLoading = true;
        return GLTFFileLoader;
    }());
    BABYLON.GLTFFileLoader = GLTFFileLoader;
    var BinaryReader = /** @class */ (function () {
        function BinaryReader(arrayBuffer) {
            this._arrayBuffer = arrayBuffer;
            this._dataView = new DataView(arrayBuffer);
            this._byteOffset = 0;
        }
        BinaryReader.prototype.getPosition = function () {
            return this._byteOffset;
        };
        BinaryReader.prototype.getLength = function () {
            return this._arrayBuffer.byteLength;
        };
        BinaryReader.prototype.readUint32 = function () {
            var value = this._dataView.getUint32(this._byteOffset, true);
            this._byteOffset += 4;
            return value;
        };
        BinaryReader.prototype.readUint8Array = function (length) {
            var value = new Uint8Array(this._arrayBuffer, this._byteOffset, length);
            this._byteOffset += length;
            return value;
        };
        BinaryReader.prototype.skipBytes = function (length) {
            this._byteOffset += length;
        };
        return BinaryReader;
    }());
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new GLTFFileLoader());
    }
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFFileLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF1.EComponentType || (GLTF1.EComponentType = {}));
        var EShaderType;
        (function (EShaderType) {
            EShaderType[EShaderType["FRAGMENT"] = 35632] = "FRAGMENT";
            EShaderType[EShaderType["VERTEX"] = 35633] = "VERTEX";
        })(EShaderType = GLTF1.EShaderType || (GLTF1.EShaderType = {}));
        var EParameterType;
        (function (EParameterType) {
            EParameterType[EParameterType["BYTE"] = 5120] = "BYTE";
            EParameterType[EParameterType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EParameterType[EParameterType["SHORT"] = 5122] = "SHORT";
            EParameterType[EParameterType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EParameterType[EParameterType["INT"] = 5124] = "INT";
            EParameterType[EParameterType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EParameterType[EParameterType["FLOAT"] = 5126] = "FLOAT";
            EParameterType[EParameterType["FLOAT_VEC2"] = 35664] = "FLOAT_VEC2";
            EParameterType[EParameterType["FLOAT_VEC3"] = 35665] = "FLOAT_VEC3";
            EParameterType[EParameterType["FLOAT_VEC4"] = 35666] = "FLOAT_VEC4";
            EParameterType[EParameterType["INT_VEC2"] = 35667] = "INT_VEC2";
            EParameterType[EParameterType["INT_VEC3"] = 35668] = "INT_VEC3";
            EParameterType[EParameterType["INT_VEC4"] = 35669] = "INT_VEC4";
            EParameterType[EParameterType["BOOL"] = 35670] = "BOOL";
            EParameterType[EParameterType["BOOL_VEC2"] = 35671] = "BOOL_VEC2";
            EParameterType[EParameterType["BOOL_VEC3"] = 35672] = "BOOL_VEC3";
            EParameterType[EParameterType["BOOL_VEC4"] = 35673] = "BOOL_VEC4";
            EParameterType[EParameterType["FLOAT_MAT2"] = 35674] = "FLOAT_MAT2";
            EParameterType[EParameterType["FLOAT_MAT3"] = 35675] = "FLOAT_MAT3";
            EParameterType[EParameterType["FLOAT_MAT4"] = 35676] = "FLOAT_MAT4";
            EParameterType[EParameterType["SAMPLER_2D"] = 35678] = "SAMPLER_2D";
        })(EParameterType = GLTF1.EParameterType || (GLTF1.EParameterType = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF1.ETextureWrapMode || (GLTF1.ETextureWrapMode = {}));
        var ETextureFilterType;
        (function (ETextureFilterType) {
            ETextureFilterType[ETextureFilterType["NEAREST"] = 9728] = "NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR"] = 9728] = "LINEAR";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureFilterType[ETextureFilterType["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureFilterType[ETextureFilterType["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureFilterType = GLTF1.ETextureFilterType || (GLTF1.ETextureFilterType = {}));
        var ETextureFormat;
        (function (ETextureFormat) {
            ETextureFormat[ETextureFormat["ALPHA"] = 6406] = "ALPHA";
            ETextureFormat[ETextureFormat["RGB"] = 6407] = "RGB";
            ETextureFormat[ETextureFormat["RGBA"] = 6408] = "RGBA";
            ETextureFormat[ETextureFormat["LUMINANCE"] = 6409] = "LUMINANCE";
            ETextureFormat[ETextureFormat["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
        })(ETextureFormat = GLTF1.ETextureFormat || (GLTF1.ETextureFormat = {}));
        var ECullingType;
        (function (ECullingType) {
            ECullingType[ECullingType["FRONT"] = 1028] = "FRONT";
            ECullingType[ECullingType["BACK"] = 1029] = "BACK";
            ECullingType[ECullingType["FRONT_AND_BACK"] = 1032] = "FRONT_AND_BACK";
        })(ECullingType = GLTF1.ECullingType || (GLTF1.ECullingType = {}));
        var EBlendingFunction;
        (function (EBlendingFunction) {
            EBlendingFunction[EBlendingFunction["ZERO"] = 0] = "ZERO";
            EBlendingFunction[EBlendingFunction["ONE"] = 1] = "ONE";
            EBlendingFunction[EBlendingFunction["SRC_COLOR"] = 768] = "SRC_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_COLOR"] = 769] = "ONE_MINUS_SRC_COLOR";
            EBlendingFunction[EBlendingFunction["DST_COLOR"] = 774] = "DST_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_COLOR"] = 775] = "ONE_MINUS_DST_COLOR";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA"] = 770] = "SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_SRC_ALPHA"] = 771] = "ONE_MINUS_SRC_ALPHA";
            EBlendingFunction[EBlendingFunction["DST_ALPHA"] = 772] = "DST_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_DST_ALPHA"] = 773] = "ONE_MINUS_DST_ALPHA";
            EBlendingFunction[EBlendingFunction["CONSTANT_COLOR"] = 32769] = "CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_COLOR"] = 32770] = "ONE_MINUS_CONSTANT_COLOR";
            EBlendingFunction[EBlendingFunction["CONSTANT_ALPHA"] = 32771] = "CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["ONE_MINUS_CONSTANT_ALPHA"] = 32772] = "ONE_MINUS_CONSTANT_ALPHA";
            EBlendingFunction[EBlendingFunction["SRC_ALPHA_SATURATE"] = 776] = "SRC_ALPHA_SATURATE";
        })(EBlendingFunction = GLTF1.EBlendingFunction || (GLTF1.EBlendingFunction = {}));
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Tokenizer. Used for shaders compatibility
        * Automatically map world, view, projection, worldViewProjection, attributes and so on
        */
        var ETokenType;
        (function (ETokenType) {
            ETokenType[ETokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
            ETokenType[ETokenType["UNKNOWN"] = 2] = "UNKNOWN";
            ETokenType[ETokenType["END_OF_INPUT"] = 3] = "END_OF_INPUT";
        })(ETokenType || (ETokenType = {}));
        var Tokenizer = /** @class */ (function () {
            function Tokenizer(toParse) {
                this._pos = 0;
                this.isLetterOrDigitPattern = /^[a-zA-Z0-9]+$/;
                this._toParse = toParse;
                this._maxPos = toParse.length;
            }
            Tokenizer.prototype.getNextToken = function () {
                if (this.isEnd())
                    return ETokenType.END_OF_INPUT;
                this.currentString = this.read();
                this.currentToken = ETokenType.UNKNOWN;
                if (this.currentString === "_" || this.isLetterOrDigitPattern.test(this.currentString)) {
                    this.currentToken = ETokenType.IDENTIFIER;
                    this.currentIdentifier = this.currentString;
                    while (!this.isEnd() && (this.isLetterOrDigitPattern.test(this.currentString = this.peek()) || this.currentString === "_")) {
                        this.currentIdentifier += this.currentString;
                        this.forward();
                    }
                }
                return this.currentToken;
            };
            Tokenizer.prototype.peek = function () {
                return this._toParse[this._pos];
            };
            Tokenizer.prototype.read = function () {
                return this._toParse[this._pos++];
            };
            Tokenizer.prototype.forward = function () {
                this._pos++;
            };
            Tokenizer.prototype.isEnd = function () {
                return this._pos >= this._maxPos;
            };
            return Tokenizer;
        }());
        /**
        * Values
        */
        var glTFTransforms = ["MODEL", "VIEW", "PROJECTION", "MODELVIEW", "MODELVIEWPROJECTION", "JOINTMATRIX"];
        var babylonTransforms = ["world", "view", "projection", "worldView", "worldViewProjection", "mBones"];
        var glTFAnimationPaths = ["translation", "rotation", "scale"];
        var babylonAnimationPaths = ["position", "rotationQuaternion", "scaling"];
        /**
        * Parse
        */
        var parseBuffers = function (parsedBuffers, gltfRuntime) {
            for (var buf in parsedBuffers) {
                var parsedBuffer = parsedBuffers[buf];
                gltfRuntime.buffers[buf] = parsedBuffer;
                gltfRuntime.buffersCount++;
            }
        };
        var parseShaders = function (parsedShaders, gltfRuntime) {
            for (var sha in parsedShaders) {
                var parsedShader = parsedShaders[sha];
                gltfRuntime.shaders[sha] = parsedShader;
                gltfRuntime.shaderscount++;
            }
        };
        var parseObject = function (parsedObjects, runtimeProperty, gltfRuntime) {
            for (var object in parsedObjects) {
                var parsedObject = parsedObjects[object];
                gltfRuntime[runtimeProperty][object] = parsedObject;
            }
        };
        /**
        * Utils
        */
        var normalizeUVs = function (buffer) {
            if (!buffer) {
                return;
            }
            for (var i = 0; i < buffer.length / 2; i++) {
                buffer[i * 2 + 1] = 1.0 - buffer[i * 2 + 1];
            }
        };
        var getAttribute = function (attributeParameter) {
            if (attributeParameter.semantic === "NORMAL") {
                return "normal";
            }
            else if (attributeParameter.semantic === "POSITION") {
                return "position";
            }
            else if (attributeParameter.semantic === "JOINT") {
                return "matricesIndices";
            }
            else if (attributeParameter.semantic === "WEIGHT") {
                return "matricesWeights";
            }
            else if (attributeParameter.semantic === "COLOR") {
                return "color";
            }
            else if (attributeParameter.semantic && attributeParameter.semantic.indexOf("TEXCOORD_") !== -1) {
                var channel = Number(attributeParameter.semantic.split("_")[1]);
                return "uv" + (channel === 0 ? "" : channel + 1);
            }
            return null;
        };
        /**
        * Loads and creates animations
        */
        var loadAnimations = function (gltfRuntime) {
            for (var anim in gltfRuntime.animations) {
                var animation = gltfRuntime.animations[anim];
                if (!animation.channels || !animation.samplers) {
                    continue;
                }
                var lastAnimation = null;
                for (var i = 0; i < animation.channels.length; i++) {
                    // Get parameters and load buffers
                    var channel = animation.channels[i];
                    var sampler = animation.samplers[channel.sampler];
                    if (!sampler) {
                        continue;
                    }
                    var inputData = null;
                    var outputData = null;
                    if (animation.parameters) {
                        inputData = animation.parameters[sampler.input];
                        outputData = animation.parameters[sampler.output];
                    }
                    else {
                        inputData = sampler.input;
                        outputData = sampler.output;
                    }
                    var bufferInput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[inputData]);
                    var bufferOutput = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, gltfRuntime.accessors[outputData]);
                    var targetID = channel.target.id;
                    var targetNode = gltfRuntime.scene.getNodeByID(targetID);
                    if (targetNode === null) {
                        targetNode = gltfRuntime.scene.getNodeByName(targetID);
                    }
                    if (targetNode === null) {
                        BABYLON.Tools.Warn("Creating animation named " + anim + ". But cannot find node named " + targetID + " to attach to");
                        continue;
                    }
                    var isBone = targetNode instanceof BABYLON.Bone;
                    // Get target path (position, rotation or scaling)
                    var targetPath = channel.target.path;
                    var targetPathIndex = glTFAnimationPaths.indexOf(targetPath);
                    if (targetPathIndex !== -1) {
                        targetPath = babylonAnimationPaths[targetPathIndex];
                    }
                    // Determine animation type
                    var animationType = BABYLON.Animation.ANIMATIONTYPE_MATRIX;
                    if (!isBone) {
                        if (targetPath === "rotationQuaternion") {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                            targetNode.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        else {
                            animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        }
                    }
                    // Create animation and key frames
                    var babylonAnimation = null;
                    var keys = [];
                    var arrayOffset = 0;
                    var modifyKey = false;
                    if (isBone && lastAnimation && lastAnimation.getKeys().length === bufferInput.length) {
                        babylonAnimation = lastAnimation;
                        modifyKey = true;
                    }
                    if (!modifyKey) {
                        babylonAnimation = new BABYLON.Animation(anim, isBone ? "_matrix" : targetPath, 1, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
                    }
                    // For each frame
                    for (var j = 0; j < bufferInput.length; j++) {
                        var value = null;
                        if (targetPath === "rotationQuaternion") {
                            value = BABYLON.Quaternion.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2], bufferOutput[arrayOffset + 3]]);
                            arrayOffset += 4;
                        }
                        else {
                            value = BABYLON.Vector3.FromArray([bufferOutput[arrayOffset], bufferOutput[arrayOffset + 1], bufferOutput[arrayOffset + 2]]);
                            arrayOffset += 3;
                        }
                        if (isBone) {
                            var bone = targetNode;
                            var translation = BABYLON.Vector3.Zero();
                            var rotationQuaternion = new BABYLON.Quaternion();
                            var scaling = BABYLON.Vector3.Zero();
                            // Warning on decompose
                            var mat = bone.getBaseMatrix();
                            if (modifyKey && lastAnimation) {
                                mat = lastAnimation.getKeys()[j].value;
                            }
                            mat.decompose(scaling, rotationQuaternion, translation);
                            if (targetPath === "position") {
                                translation = value;
                            }
                            else if (targetPath === "rotationQuaternion") {
                                rotationQuaternion = value;
                            }
                            else {
                                scaling = value;
                            }
                            value = BABYLON.Matrix.Compose(scaling, rotationQuaternion, translation);
                        }
                        if (!modifyKey) {
                            keys.push({
                                frame: bufferInput[j],
                                value: value
                            });
                        }
                        else if (lastAnimation) {
                            lastAnimation.getKeys()[j].value = value;
                        }
                    }
                    // Finish
                    if (!modifyKey && babylonAnimation) {
                        babylonAnimation.setKeys(keys);
                        targetNode.animations.push(babylonAnimation);
                    }
                    lastAnimation = babylonAnimation;
                    gltfRuntime.scene.stopAnimation(targetNode);
                    gltfRuntime.scene.beginAnimation(targetNode, 0, bufferInput[bufferInput.length - 1], true, 1.0);
                }
            }
        };
        /**
        * Returns the bones transformation matrix
        */
        var configureBoneTransformation = function (node) {
            var mat = null;
            if (node.translation || node.rotation || node.scale) {
                var scale = BABYLON.Vector3.FromArray(node.scale || [1, 1, 1]);
                var rotation = BABYLON.Quaternion.FromArray(node.rotation || [0, 0, 0, 1]);
                var position = BABYLON.Vector3.FromArray(node.translation || [0, 0, 0]);
                mat = BABYLON.Matrix.Compose(scale, rotation, position);
            }
            else {
                mat = BABYLON.Matrix.FromArray(node.matrix);
            }
            return mat;
        };
        /**
        * Returns the parent bone
        */
        var getParentBone = function (gltfRuntime, skins, jointName, newSkeleton) {
            // Try to find
            for (var i = 0; i < newSkeleton.bones.length; i++) {
                if (newSkeleton.bones[i].name === jointName) {
                    return newSkeleton.bones[i];
                }
            }
            // Not found, search in gltf nodes
            var nodes = gltfRuntime.nodes;
            for (var nde in nodes) {
                var node = nodes[nde];
                if (!node.jointName) {
                    continue;
                }
                var children = node.children;
                for (var i = 0; i < children.length; i++) {
                    var child = gltfRuntime.nodes[children[i]];
                    if (!child.jointName) {
                        continue;
                    }
                    if (child.jointName === jointName) {
                        var mat = configureBoneTransformation(node);
                        var bone = new BABYLON.Bone(node.name || "", newSkeleton, getParentBone(gltfRuntime, skins, node.jointName, newSkeleton), mat);
                        bone.id = nde;
                        return bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the appropriate root node
        */
        var getNodeToRoot = function (nodesToRoot, id) {
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                for (var j = 0; j < nodeToRoot.node.children.length; j++) {
                    var child = nodeToRoot.node.children[j];
                    if (child === id) {
                        return nodeToRoot.bone;
                    }
                }
            }
            return null;
        };
        /**
        * Returns the node with the joint name
        */
        var getJointNode = function (gltfRuntime, jointName) {
            var nodes = gltfRuntime.nodes;
            var node = nodes[jointName];
            if (node) {
                return {
                    node: node,
                    id: jointName
                };
            }
            for (var nde in nodes) {
                node = nodes[nde];
                if (node.jointName === jointName) {
                    return {
                        node: node,
                        id: nde
                    };
                }
            }
            return null;
        };
        /**
        * Checks if a nodes is in joints
        */
        var nodeIsInJoints = function (skins, id) {
            for (var i = 0; i < skins.jointNames.length; i++) {
                if (skins.jointNames[i] === id) {
                    return true;
                }
            }
            return false;
        };
        /**
        * Fills the nodes to root for bones and builds hierarchy
        */
        var getNodesToRoot = function (gltfRuntime, newSkeleton, skins, nodesToRoot) {
            // Creates nodes for root
            for (var nde in gltfRuntime.nodes) {
                var node = gltfRuntime.nodes[nde];
                var id = nde;
                if (!node.jointName || nodeIsInJoints(skins, node.jointName)) {
                    continue;
                }
                // Create node to root bone
                var mat = configureBoneTransformation(node);
                var bone = new BABYLON.Bone(node.name || "", newSkeleton, null, mat);
                bone.id = id;
                nodesToRoot.push({ bone: bone, node: node, id: id });
            }
            // Parenting
            for (var i = 0; i < nodesToRoot.length; i++) {
                var nodeToRoot = nodesToRoot[i];
                var children = nodeToRoot.node.children;
                for (var j = 0; j < children.length; j++) {
                    var child = null;
                    for (var k = 0; k < nodesToRoot.length; k++) {
                        if (nodesToRoot[k].id === children[j]) {
                            child = nodesToRoot[k];
                            break;
                        }
                    }
                    if (child) {
                        child.bone._parent = nodeToRoot.bone;
                        nodeToRoot.bone.children.push(child.bone);
                    }
                }
            }
        };
        /**
        * Imports a skeleton
        */
        var importSkeleton = function (gltfRuntime, skins, mesh, newSkeleton, id) {
            if (!newSkeleton) {
                newSkeleton = new BABYLON.Skeleton(skins.name || "", "", gltfRuntime.scene);
            }
            if (!skins.babylonSkeleton) {
                return newSkeleton;
            }
            // Find the root bones
            var nodesToRoot = [];
            var nodesToRootToAdd = [];
            getNodesToRoot(gltfRuntime, newSkeleton, skins, nodesToRoot);
            newSkeleton.bones = [];
            // Joints
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                var node = jointNode.node;
                if (!node) {
                    BABYLON.Tools.Warn("Joint named " + skins.jointNames[i] + " does not exist");
                    continue;
                }
                var id = jointNode.id;
                // Optimize, if the bone already exists...
                var existingBone = gltfRuntime.scene.getBoneByID(id);
                if (existingBone) {
                    newSkeleton.bones.push(existingBone);
                    continue;
                }
                // Search for parent bone
                var foundBone = false;
                var parentBone = null;
                for (var j = 0; j < i; j++) {
                    var jointNode_1 = getJointNode(gltfRuntime, skins.jointNames[j]);
                    if (!jointNode_1) {
                        continue;
                    }
                    var joint = jointNode_1.node;
                    if (!joint) {
                        BABYLON.Tools.Warn("Joint named " + skins.jointNames[j] + " does not exist when looking for parent");
                        continue;
                    }
                    var children = joint.children;
                    if (!children) {
                        continue;
                    }
                    foundBone = false;
                    for (var k = 0; k < children.length; k++) {
                        if (children[k] === id) {
                            parentBone = getParentBone(gltfRuntime, skins, skins.jointNames[j], newSkeleton);
                            foundBone = true;
                            break;
                        }
                    }
                    if (foundBone) {
                        break;
                    }
                }
                // Create bone
                var mat = configureBoneTransformation(node);
                if (!parentBone && nodesToRoot.length > 0) {
                    parentBone = getNodeToRoot(nodesToRoot, id);
                    if (parentBone) {
                        if (nodesToRootToAdd.indexOf(parentBone) === -1) {
                            nodesToRootToAdd.push(parentBone);
                        }
                    }
                }
                var bone = new BABYLON.Bone(node.jointName || "", newSkeleton, parentBone, mat);
                bone.id = id;
            }
            // Polish
            var bones = newSkeleton.bones;
            newSkeleton.bones = [];
            for (var i = 0; i < skins.jointNames.length; i++) {
                var jointNode = getJointNode(gltfRuntime, skins.jointNames[i]);
                if (!jointNode) {
                    continue;
                }
                for (var j = 0; j < bones.length; j++) {
                    if (bones[j].id === jointNode.id) {
                        newSkeleton.bones.push(bones[j]);
                        break;
                    }
                }
            }
            newSkeleton.prepare();
            // Finish
            for (var i = 0; i < nodesToRootToAdd.length; i++) {
                newSkeleton.bones.push(nodesToRootToAdd[i]);
            }
            return newSkeleton;
        };
        /**
        * Imports a mesh and its geometries
        */
        var importMesh = function (gltfRuntime, node, meshes, id, newMesh) {
            if (!newMesh) {
                newMesh = new BABYLON.Mesh(node.name || "", gltfRuntime.scene);
                newMesh.id = id;
            }
            if (!node.babylonNode) {
                return newMesh;
            }
            var multiMat = new BABYLON.MultiMaterial("multimat" + id, gltfRuntime.scene);
            if (!newMesh.material) {
                newMesh.material = multiMat;
            }
            var vertexData = new BABYLON.VertexData();
            var geometry = new BABYLON.Geometry(id, gltfRuntime.scene, vertexData, false, newMesh);
            var verticesStarts = new Array();
            var verticesCounts = new Array();
            var indexStarts = new Array();
            var indexCounts = new Array();
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                // Positions, normals and UVs
                for (var i = 0; i < mesh.primitives.length; i++) {
                    // Temporary vertex data
                    var tempVertexData = new BABYLON.VertexData();
                    var primitive = mesh.primitives[i];
                    if (primitive.mode !== 4) {
                        // continue;
                    }
                    var attributes = primitive.attributes;
                    var accessor = null;
                    var buffer = null;
                    // Set positions, normal and uvs
                    for (var semantic in attributes) {
                        // Link accessor and buffer view
                        accessor = gltfRuntime.accessors[attributes[semantic]];
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        if (semantic === "NORMAL") {
                            tempVertexData.normals = new Float32Array(buffer.length);
                            tempVertexData.normals.set(buffer);
                        }
                        else if (semantic === "POSITION") {
                            if (BABYLON.GLTFFileLoader.HomogeneousCoordinates) {
                                tempVertexData.positions = new Float32Array(buffer.length - buffer.length / 4);
                                for (var j = 0; j < buffer.length; j += 4) {
                                    tempVertexData.positions[j] = buffer[j];
                                    tempVertexData.positions[j + 1] = buffer[j + 1];
                                    tempVertexData.positions[j + 2] = buffer[j + 2];
                                }
                            }
                            else {
                                tempVertexData.positions = new Float32Array(buffer.length);
                                tempVertexData.positions.set(buffer);
                            }
                            verticesCounts.push(tempVertexData.positions.length);
                        }
                        else if (semantic.indexOf("TEXCOORD_") !== -1) {
                            var channel = Number(semantic.split("_")[1]);
                            var uvKind = BABYLON.VertexBuffer.UVKind + (channel === 0 ? "" : (channel + 1));
                            var uvs = new Float32Array(buffer.length);
                            uvs.set(buffer);
                            normalizeUVs(uvs);
                            tempVertexData.set(uvs, uvKind);
                        }
                        else if (semantic === "JOINT") {
                            tempVertexData.matricesIndices = new Float32Array(buffer.length);
                            tempVertexData.matricesIndices.set(buffer);
                        }
                        else if (semantic === "WEIGHT") {
                            tempVertexData.matricesWeights = new Float32Array(buffer.length);
                            tempVertexData.matricesWeights.set(buffer);
                        }
                        else if (semantic === "COLOR") {
                            tempVertexData.colors = new Float32Array(buffer.length);
                            tempVertexData.colors.set(buffer);
                        }
                    }
                    // Indices
                    accessor = gltfRuntime.accessors[primitive.indices];
                    if (accessor) {
                        buffer = GLTF1.GLTFUtils.GetBufferFromAccessor(gltfRuntime, accessor);
                        tempVertexData.indices = new Int32Array(buffer.length);
                        tempVertexData.indices.set(buffer);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    else {
                        // Set indices on the fly
                        var indices = [];
                        for (var j = 0; j < tempVertexData.positions.length / 3; j++) {
                            indices.push(j);
                        }
                        tempVertexData.indices = new Int32Array(indices);
                        indexCounts.push(tempVertexData.indices.length);
                    }
                    vertexData.merge(tempVertexData);
                    // Sub material
                    var material = gltfRuntime.scene.getMaterialByID(primitive.material);
                    multiMat.subMaterials.push(material === null ? GLTF1.GLTFUtils.GetDefaultMaterial(gltfRuntime.scene) : material);
                    // Update vertices start and index start
                    verticesStarts.push(verticesStarts.length === 0 ? 0 : verticesStarts[verticesStarts.length - 1] + verticesCounts[verticesCounts.length - 2]);
                    indexStarts.push(indexStarts.length === 0 ? 0 : indexStarts[indexStarts.length - 1] + indexCounts[indexCounts.length - 2]);
                }
            }
            // Apply geometry
            geometry.setAllVerticesData(vertexData, false);
            newMesh.computeWorldMatrix(true);
            // Apply submeshes
            newMesh.subMeshes = [];
            var index = 0;
            for (var meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
                var meshID = meshes[meshIndex];
                var mesh = gltfRuntime.meshes[meshID];
                if (!mesh) {
                    continue;
                }
                for (var i = 0; i < mesh.primitives.length; i++) {
                    if (mesh.primitives[i].mode !== 4) {
                        //continue;
                    }
                    BABYLON.SubMesh.AddToMesh(index, verticesStarts[index], verticesCounts[index], indexStarts[index], indexCounts[index], newMesh, newMesh, true);
                    index++;
                }
            }
            // Finish
            return newMesh;
        };
        /**
        * Configure node transformation from position, rotation and scaling
        */
        var configureNode = function (newNode, position, rotation, scaling) {
            if (newNode.position) {
                newNode.position = position;
            }
            if (newNode.rotationQuaternion || newNode.rotation) {
                newNode.rotationQuaternion = rotation;
            }
            if (newNode.scaling) {
                newNode.scaling = scaling;
            }
        };
        /**
        * Configures node from transformation matrix
        */
        var configureNodeFromMatrix = function (newNode, node, parent) {
            if (node.matrix) {
                var position = new BABYLON.Vector3(0, 0, 0);
                var rotation = new BABYLON.Quaternion();
                var scaling = new BABYLON.Vector3(0, 0, 0);
                var mat = BABYLON.Matrix.FromArray(node.matrix);
                mat.decompose(scaling, rotation, position);
                configureNode(newNode, position, rotation, scaling);
            }
            else if (node.translation && node.rotation && node.scale) {
                configureNode(newNode, BABYLON.Vector3.FromArray(node.translation), BABYLON.Quaternion.FromArray(node.rotation), BABYLON.Vector3.FromArray(node.scale));
            }
            newNode.computeWorldMatrix(true);
        };
        /**
        * Imports a node
        */
        var importNode = function (gltfRuntime, node, id, parent) {
            var lastNode = null;
            if (gltfRuntime.importOnlyMeshes && (node.skin || node.meshes)) {
                if (gltfRuntime.importMeshesNames && gltfRuntime.importMeshesNames.length > 0 && gltfRuntime.importMeshesNames.indexOf(node.name || "") === -1) {
                    return null;
                }
            }
            // Meshes
            if (node.skin) {
                if (node.meshes) {
                    var skin = gltfRuntime.skins[node.skin];
                    var newMesh = importMesh(gltfRuntime, node, node.meshes, id, node.babylonNode);
                    newMesh.skeleton = gltfRuntime.scene.getLastSkeletonByID(node.skin);
                    if (newMesh.skeleton === null && skin.babylonSkeleton) {
                        newMesh.skeleton = importSkeleton(gltfRuntime, skin, newMesh, skin.babylonSkeleton, node.skin);
                        if (!skin.babylonSkeleton) {
                            skin.babylonSkeleton = newMesh.skeleton;
                        }
                    }
                    lastNode = newMesh;
                }
            }
            else if (node.meshes) {
                /**
                * Improve meshes property
                */
                var newMesh = importMesh(gltfRuntime, node, node.mesh ? [node.mesh] : node.meshes, id, node.babylonNode);
                lastNode = newMesh;
            }
            else if (node.light && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var light = gltfRuntime.lights[node.light];
                if (light) {
                    if (light.type === "ambient") {
                        var ambienLight = light[light.type];
                        var hemiLight = new BABYLON.HemisphericLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        hemiLight.name = node.name || "";
                        if (ambienLight.color) {
                            hemiLight.diffuse = BABYLON.Color3.FromArray(ambienLight.color);
                        }
                        lastNode = hemiLight;
                    }
                    else if (light.type === "directional") {
                        var directionalLight = light[light.type];
                        var dirLight = new BABYLON.DirectionalLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        dirLight.name = node.name || "";
                        if (directionalLight.color) {
                            dirLight.diffuse = BABYLON.Color3.FromArray(directionalLight.color);
                        }
                        lastNode = dirLight;
                    }
                    else if (light.type === "point") {
                        var pointLight = light[light.type];
                        var ptLight = new BABYLON.PointLight(node.light, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        ptLight.name = node.name || "";
                        if (pointLight.color) {
                            ptLight.diffuse = BABYLON.Color3.FromArray(pointLight.color);
                        }
                        lastNode = ptLight;
                    }
                    else if (light.type === "spot") {
                        var spotLight = light[light.type];
                        var spLight = new BABYLON.SpotLight(node.light, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), 0, 0, gltfRuntime.scene);
                        spLight.name = node.name || "";
                        if (spotLight.color) {
                            spLight.diffuse = BABYLON.Color3.FromArray(spotLight.color);
                        }
                        if (spotLight.fallOfAngle) {
                            spLight.angle = spotLight.fallOfAngle;
                        }
                        if (spotLight.fallOffExponent) {
                            spLight.exponent = spotLight.fallOffExponent;
                        }
                        lastNode = spLight;
                    }
                }
            }
            else if (node.camera && !node.babylonNode && !gltfRuntime.importOnlyMeshes) {
                var camera = gltfRuntime.cameras[node.camera];
                if (camera) {
                    if (camera.type === "orthographic") {
                        var orthoCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        orthoCamera.name = node.name || "";
                        orthoCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                        orthoCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        lastNode = orthoCamera;
                    }
                    else if (camera.type === "perspective") {
                        var perspectiveCamera = camera[camera.type];
                        var persCamera = new BABYLON.FreeCamera(node.camera, BABYLON.Vector3.Zero(), gltfRuntime.scene);
                        persCamera.name = node.name || "";
                        persCamera.attachControl(gltfRuntime.scene.getEngine().getRenderingCanvas());
                        if (!perspectiveCamera.aspectRatio) {
                            perspectiveCamera.aspectRatio = gltfRuntime.scene.getEngine().getRenderWidth() / gltfRuntime.scene.getEngine().getRenderHeight();
                        }
                        if (perspectiveCamera.znear && perspectiveCamera.zfar) {
                            persCamera.maxZ = perspectiveCamera.zfar;
                            persCamera.minZ = perspectiveCamera.znear;
                        }
                        lastNode = persCamera;
                    }
                }
            }
            // Empty node
            if (!node.jointName) {
                if (node.babylonNode) {
                    return node.babylonNode;
                }
                else if (lastNode === null) {
                    var dummy = new BABYLON.Mesh(node.name || "", gltfRuntime.scene);
                    node.babylonNode = dummy;
                    lastNode = dummy;
                }
            }
            if (lastNode !== null) {
                if (node.matrix && lastNode instanceof BABYLON.Mesh) {
                    configureNodeFromMatrix(lastNode, node, parent);
                }
                else {
                    var translation = node.translation || [0, 0, 0];
                    var rotation = node.rotation || [0, 0, 0, 1];
                    var scale = node.scale || [1, 1, 1];
                    configureNode(lastNode, BABYLON.Vector3.FromArray(translation), BABYLON.Quaternion.FromArray(rotation), BABYLON.Vector3.FromArray(scale));
                }
                lastNode.updateCache(true);
                node.babylonNode = lastNode;
            }
            return lastNode;
        };
        /**
        * Traverses nodes and creates them
        */
        var traverseNodes = function (gltfRuntime, id, parent, meshIncluded) {
            if (meshIncluded === void 0) { meshIncluded = false; }
            var node = gltfRuntime.nodes[id];
            var newNode = null;
            if (gltfRuntime.importOnlyMeshes && !meshIncluded && gltfRuntime.importMeshesNames) {
                if (gltfRuntime.importMeshesNames.indexOf(node.name || "") !== -1 || gltfRuntime.importMeshesNames.length === 0) {
                    meshIncluded = true;
                }
                else {
                    meshIncluded = false;
                }
            }
            else {
                meshIncluded = true;
            }
            if (!node.jointName && meshIncluded) {
                newNode = importNode(gltfRuntime, node, id, parent);
                if (newNode !== null) {
                    newNode.id = id;
                    newNode.parent = parent;
                }
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    traverseNodes(gltfRuntime, node.children[i], newNode, meshIncluded);
                }
            }
        };
        /**
        * do stuff after buffers, shaders are loaded (e.g. hook up materials, load animations, etc.)
        */
        var postLoad = function (gltfRuntime) {
            // Nodes
            var currentScene = gltfRuntime.currentScene;
            if (currentScene) {
                for (var i = 0; i < currentScene.nodes.length; i++) {
                    traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                }
            }
            else {
                for (var thing in gltfRuntime.scenes) {
                    currentScene = gltfRuntime.scenes[thing];
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
            }
            // Set animations
            loadAnimations(gltfRuntime);
            for (var i = 0; i < gltfRuntime.scene.skeletons.length; i++) {
                var skeleton = gltfRuntime.scene.skeletons[i];
                gltfRuntime.scene.beginAnimation(skeleton, 0, Number.MAX_VALUE, true, 1.0);
            }
        };
        /**
        * onBind shaderrs callback to set uniforms and matrices
        */
        var onBindShaderMaterial = function (mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess) {
            var materialValues = material.values || technique.parameters;
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                if (type === GLTF1.EParameterType.FLOAT_MAT2 || type === GLTF1.EParameterType.FLOAT_MAT3 || type === GLTF1.EParameterType.FLOAT_MAT4) {
                    if (uniform.semantic && !uniform.source && !uniform.node) {
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, mesh, uniform, unif, shaderMaterial.getEffect());
                    }
                    else if (uniform.semantic && (uniform.source || uniform.node)) {
                        var source = gltfRuntime.scene.getNodeByName(uniform.source || uniform.node || "");
                        if (source === null) {
                            source = gltfRuntime.scene.getNodeByID(uniform.source || uniform.node || "");
                        }
                        if (source === null) {
                            continue;
                        }
                        GLTF1.GLTFUtils.SetMatrix(gltfRuntime.scene, source, uniform, unif, shaderMaterial.getEffect());
                    }
                }
                else {
                    var value = materialValues[technique.uniforms[unif]];
                    if (!value) {
                        continue;
                    }
                    if (type === GLTF1.EParameterType.SAMPLER_2D) {
                        var texture = gltfRuntime.textures[material.values ? value : uniform.value].babylonTexture;
                        if (texture === null || texture === undefined) {
                            continue;
                        }
                        shaderMaterial.getEffect().setTexture(unif, texture);
                    }
                    else {
                        GLTF1.GLTFUtils.SetUniform((shaderMaterial.getEffect()), unif, value, type);
                    }
                }
            }
            onSuccess(shaderMaterial);
        };
        /**
        * Prepare uniforms to send the only one time
        * Loads the appropriate textures
        */
        var prepareShaderMaterialUniforms = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms) {
            var materialValues = material.values || technique.parameters;
            var techniqueUniforms = technique.uniforms;
            /**
            * Prepare values here (not matrices)
            */
            for (var unif in unTreatedUniforms) {
                var uniform = unTreatedUniforms[unif];
                var type = uniform.type;
                var value = materialValues[techniqueUniforms[unif]];
                if (value === undefined) {
                    // In case the value is the same for all materials
                    value = uniform.value;
                }
                if (!value) {
                    continue;
                }
                var onLoadTexture = function (uniformName) {
                    return function (texture) {
                        if (uniform.value && uniformName) {
                            // Static uniform
                            shaderMaterial.setTexture(uniformName, texture);
                            delete unTreatedUniforms[uniformName];
                        }
                    };
                };
                // Texture (sampler2D)
                if (type === GLTF1.EParameterType.SAMPLER_2D) {
                    GLTF1.GLTFLoaderExtension.LoadTextureAsync(gltfRuntime, material.values ? value : uniform.value, onLoadTexture(unif), function () { return onLoadTexture(null); });
                }
                else {
                    if (uniform.value && GLTF1.GLTFUtils.SetUniform(shaderMaterial, unif, material.values ? value : uniform.value, type)) {
                        // Static uniform
                        delete unTreatedUniforms[unif];
                    }
                }
            }
        };
        /**
        * Shader compilation failed
        */
        var onShaderCompileError = function (program, shaderMaterial, onError) {
            return function (effect, error) {
                shaderMaterial.dispose(true);
                onError("Cannot compile program named " + program.name + ". Error: " + error + ". Default material will be applied");
            };
        };
        /**
        * Shader compilation success
        */
        var onShaderCompileSuccess = function (gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess) {
            return function (_) {
                prepareShaderMaterialUniforms(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms);
                shaderMaterial.onBind = function (mesh) {
                    onBindShaderMaterial(mesh, gltfRuntime, unTreatedUniforms, shaderMaterial, technique, material, onSuccess);
                };
            };
        };
        /**
        * Returns the appropriate uniform if already handled by babylon
        */
        var parseShaderUniforms = function (tokenizer, technique, unTreatedUniforms) {
            for (var unif in technique.uniforms) {
                var uniform = technique.uniforms[unif];
                var uniformParameter = technique.parameters[uniform];
                if (tokenizer.currentIdentifier === unif) {
                    if (uniformParameter.semantic && !uniformParameter.source && !uniformParameter.node) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            delete unTreatedUniforms[unif];
                            return babylonTransforms[transformIndex];
                        }
                    }
                }
            }
            return tokenizer.currentIdentifier;
        };
        /**
        * All shaders loaded. Create materials one by one
        */
        var importMaterials = function (gltfRuntime) {
            // Create materials
            for (var mat in gltfRuntime.materials) {
                GLTF1.GLTFLoaderExtension.LoadMaterialAsync(gltfRuntime, mat, function (material) { }, function () { });
            }
        };
        /**
        * Implementation of the base glTF spec
        */
        var GLTFLoaderBase = /** @class */ (function () {
            function GLTFLoaderBase() {
            }
            GLTFLoaderBase.CreateRuntime = function (parsedData, scene, rootUrl) {
                var gltfRuntime = {
                    extensions: {},
                    accessors: {},
                    buffers: {},
                    bufferViews: {},
                    meshes: {},
                    lights: {},
                    cameras: {},
                    nodes: {},
                    images: {},
                    textures: {},
                    shaders: {},
                    programs: {},
                    samplers: {},
                    techniques: {},
                    materials: {},
                    animations: {},
                    skins: {},
                    extensionsUsed: [],
                    scenes: {},
                    buffersCount: 0,
                    shaderscount: 0,
                    scene: scene,
                    rootUrl: rootUrl,
                    loadedBufferCount: 0,
                    loadedBufferViews: {},
                    loadedShaderCount: 0,
                    importOnlyMeshes: false,
                    dummyNodes: []
                };
                // Parse
                if (parsedData.extensions) {
                    parseObject(parsedData.extensions, "extensions", gltfRuntime);
                }
                if (parsedData.extensionsUsed) {
                    parseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
                }
                if (parsedData.buffers) {
                    parseBuffers(parsedData.buffers, gltfRuntime);
                }
                if (parsedData.bufferViews) {
                    parseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
                }
                if (parsedData.accessors) {
                    parseObject(parsedData.accessors, "accessors", gltfRuntime);
                }
                if (parsedData.meshes) {
                    parseObject(parsedData.meshes, "meshes", gltfRuntime);
                }
                if (parsedData.lights) {
                    parseObject(parsedData.lights, "lights", gltfRuntime);
                }
                if (parsedData.cameras) {
                    parseObject(parsedData.cameras, "cameras", gltfRuntime);
                }
                if (parsedData.nodes) {
                    parseObject(parsedData.nodes, "nodes", gltfRuntime);
                }
                if (parsedData.images) {
                    parseObject(parsedData.images, "images", gltfRuntime);
                }
                if (parsedData.textures) {
                    parseObject(parsedData.textures, "textures", gltfRuntime);
                }
                if (parsedData.shaders) {
                    parseShaders(parsedData.shaders, gltfRuntime);
                }
                if (parsedData.programs) {
                    parseObject(parsedData.programs, "programs", gltfRuntime);
                }
                if (parsedData.samplers) {
                    parseObject(parsedData.samplers, "samplers", gltfRuntime);
                }
                if (parsedData.techniques) {
                    parseObject(parsedData.techniques, "techniques", gltfRuntime);
                }
                if (parsedData.materials) {
                    parseObject(parsedData.materials, "materials", gltfRuntime);
                }
                if (parsedData.animations) {
                    parseObject(parsedData.animations, "animations", gltfRuntime);
                }
                if (parsedData.skins) {
                    parseObject(parsedData.skins, "skins", gltfRuntime);
                }
                if (parsedData.scenes) {
                    gltfRuntime.scenes = parsedData.scenes;
                }
                if (parsedData.scene && parsedData.scenes) {
                    gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
                }
                return gltfRuntime;
            };
            GLTFLoaderBase.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                var buffer = gltfRuntime.buffers[id];
                if (GLTF1.GLTFUtils.IsBase64(buffer.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(GLTF1.GLTFUtils.DecodeBase64(buffer.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, function (data) { return onSuccess(new Uint8Array(data)); }, onProgress, undefined, true, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (!texture || !texture.source) {
                    onError("");
                    return;
                }
                if (texture.babylonTexture) {
                    onSuccess(null);
                    return;
                }
                var source = gltfRuntime.images[texture.source];
                if (GLTF1.GLTFUtils.IsBase64(source.uri)) {
                    setTimeout(function () { return onSuccess(new Uint8Array(GLTF1.GLTFUtils.DecodeBase64(source.uri))); });
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + source.uri, function (data) { return onSuccess(new Uint8Array(data)); }, undefined, undefined, true, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                if (texture.babylonTexture) {
                    onSuccess(texture.babylonTexture);
                    return;
                }
                var sampler = gltfRuntime.samplers[texture.sampler];
                var createMipMaps = (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                    (sampler.minFilter === GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR);
                var samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                var blob = new Blob([buffer]);
                var blobURL = URL.createObjectURL(blob);
                var revokeBlobURL = function () { return URL.revokeObjectURL(blobURL); };
                var newTexture = new BABYLON.Texture(blobURL, gltfRuntime.scene, !createMipMaps, true, samplingMode, revokeBlobURL, revokeBlobURL);
                if (sampler.wrapS !== undefined) {
                    newTexture.wrapU = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapS);
                }
                if (sampler.wrapT !== undefined) {
                    newTexture.wrapV = GLTF1.GLTFUtils.GetWrapMode(sampler.wrapT);
                }
                newTexture.name = id;
                texture.babylonTexture = newTexture;
                onSuccess(newTexture);
            };
            GLTFLoaderBase.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (GLTF1.GLTFUtils.IsBase64(shader.uri)) {
                    var shaderString = atob(shader.uri.split(",")[1]);
                    onSuccess(shaderString);
                }
                else {
                    BABYLON.Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, undefined, undefined, false, function (request) {
                        if (request) {
                            onError(request.status + " " + request.statusText);
                        }
                    });
                }
            };
            GLTFLoaderBase.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material.technique) {
                    if (onError) {
                        onError("No technique found.");
                    }
                    return;
                }
                var technique = gltfRuntime.techniques[material.technique];
                if (!technique) {
                    var defaultMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                    defaultMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                    defaultMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                    onSuccess(defaultMaterial);
                    return;
                }
                var program = gltfRuntime.programs[technique.program];
                var states = technique.states;
                var vertexShader = BABYLON.Effect.ShadersStore[program.vertexShader + "VertexShader"];
                var pixelShader = BABYLON.Effect.ShadersStore[program.fragmentShader + "PixelShader"];
                var newVertexShader = "";
                var newPixelShader = "";
                var vertexTokenizer = new Tokenizer(vertexShader);
                var pixelTokenizer = new Tokenizer(pixelShader);
                var unTreatedUniforms = {};
                var uniforms = [];
                var attributes = [];
                var samplers = [];
                // Fill uniform, sampler2D and attributes
                for (var unif in technique.uniforms) {
                    var uniform = technique.uniforms[unif];
                    var uniformParameter = technique.parameters[uniform];
                    unTreatedUniforms[unif] = uniformParameter;
                    if (uniformParameter.semantic && !uniformParameter.node && !uniformParameter.source) {
                        var transformIndex = glTFTransforms.indexOf(uniformParameter.semantic);
                        if (transformIndex !== -1) {
                            uniforms.push(babylonTransforms[transformIndex]);
                            delete unTreatedUniforms[unif];
                        }
                        else {
                            uniforms.push(unif);
                        }
                    }
                    else if (uniformParameter.type === GLTF1.EParameterType.SAMPLER_2D) {
                        samplers.push(unif);
                    }
                    else {
                        uniforms.push(unif);
                    }
                }
                for (var attr in technique.attributes) {
                    var attribute = technique.attributes[attr];
                    var attributeParameter = technique.parameters[attribute];
                    if (attributeParameter.semantic) {
                        attributes.push(getAttribute(attributeParameter));
                    }
                }
                // Configure vertex shader
                while (!vertexTokenizer.isEnd() && vertexTokenizer.getNextToken()) {
                    var tokenType = vertexTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newVertexShader += vertexTokenizer.currentString;
                        continue;
                    }
                    var foundAttribute = false;
                    for (var attr in technique.attributes) {
                        var attribute = technique.attributes[attr];
                        var attributeParameter = technique.parameters[attribute];
                        if (vertexTokenizer.currentIdentifier === attr && attributeParameter.semantic) {
                            newVertexShader += getAttribute(attributeParameter);
                            foundAttribute = true;
                            break;
                        }
                    }
                    if (foundAttribute) {
                        continue;
                    }
                    newVertexShader += parseShaderUniforms(vertexTokenizer, technique, unTreatedUniforms);
                }
                // Configure pixel shader
                while (!pixelTokenizer.isEnd() && pixelTokenizer.getNextToken()) {
                    var tokenType = pixelTokenizer.currentToken;
                    if (tokenType !== ETokenType.IDENTIFIER) {
                        newPixelShader += pixelTokenizer.currentString;
                        continue;
                    }
                    newPixelShader += parseShaderUniforms(pixelTokenizer, technique, unTreatedUniforms);
                }
                // Create shader material
                var shaderPath = {
                    vertex: program.vertexShader + id,
                    fragment: program.fragmentShader + id
                };
                var options = {
                    attributes: attributes,
                    uniforms: uniforms,
                    samplers: samplers,
                    needAlphaBlending: states && states.enable && states.enable.indexOf(3042) !== -1
                };
                BABYLON.Effect.ShadersStore[program.vertexShader + id + "VertexShader"] = newVertexShader;
                BABYLON.Effect.ShadersStore[program.fragmentShader + id + "PixelShader"] = newPixelShader;
                var shaderMaterial = new BABYLON.ShaderMaterial(id, gltfRuntime.scene, shaderPath, options);
                shaderMaterial.onError = onShaderCompileError(program, shaderMaterial, onError);
                shaderMaterial.onCompiled = onShaderCompileSuccess(gltfRuntime, shaderMaterial, technique, material, unTreatedUniforms, onSuccess);
                shaderMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (states && states.functions) {
                    var functions = states.functions;
                    if (functions.cullFace && functions.cullFace[0] !== GLTF1.ECullingType.BACK) {
                        shaderMaterial.backFaceCulling = false;
                    }
                    var blendFunc = functions.blendFuncSeparate;
                    if (blendFunc) {
                        if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_ALPHA && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ONE && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE && blendFunc[2] === GLTF1.EBlendingFunction.ZERO && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_ADD;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.ZERO && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_SUBTRACT;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.DST_COLOR && blendFunc[1] === GLTF1.EBlendingFunction.ZERO && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MULTIPLY;
                        }
                        else if (blendFunc[0] === GLTF1.EBlendingFunction.SRC_ALPHA && blendFunc[1] === GLTF1.EBlendingFunction.ONE_MINUS_SRC_COLOR && blendFunc[2] === GLTF1.EBlendingFunction.ONE && blendFunc[3] === GLTF1.EBlendingFunction.ONE) {
                            shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_MAXIMIZED;
                        }
                    }
                }
            };
            return GLTFLoaderBase;
        }());
        GLTF1.GLTFLoaderBase = GLTFLoaderBase;
        /**
        * glTF V1 Loader
        */
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader() {
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Tool with the same name \"" + extension.name + "\" already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
            };
            GLTFLoader.prototype.dispose = function () {
                // do nothing
            };
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    gltfRuntime.importOnlyMeshes = true;
                    if (meshesNames === "") {
                        gltfRuntime.importMeshesNames = [];
                    }
                    else if (typeof meshesNames === "string") {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else if (meshesNames && !(meshesNames instanceof Array)) {
                        gltfRuntime.importMeshesNames = [meshesNames];
                    }
                    else {
                        gltfRuntime.importMeshesNames = [];
                        BABYLON.Tools.Warn("Argument meshesNames must be of type string or string[]");
                    }
                    // Create nodes
                    _this._createNodes(gltfRuntime);
                    var meshes = new Array();
                    var skeletons = new Array();
                    // Fill arrays of meshes and skeletons
                    for (var nde in gltfRuntime.nodes) {
                        var node = gltfRuntime.nodes[nde];
                        if (node.babylonNode instanceof BABYLON.AbstractMesh) {
                            meshes.push(node.babylonNode);
                        }
                    }
                    for (var skl in gltfRuntime.skins) {
                        var skin = gltfRuntime.skins[skl];
                        if (skin.babylonSkeleton instanceof BABYLON.Skeleton) {
                            skeletons.push(skin.babylonSkeleton);
                        }
                    }
                    // Load buffers, shaders, materials, etc.
                    _this._loadBuffersAsync(gltfRuntime, function () {
                        _this._loadShadersAsync(gltfRuntime, function () {
                            importMaterials(gltfRuntime);
                            postLoad(gltfRuntime);
                            if (!BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                                onSuccess(meshes, [], skeletons);
                            }
                        });
                    }, onProgress);
                    if (BABYLON.GLTFFileLoader.IncrementalLoading && onSuccess) {
                        onSuccess(meshes, [], skeletons);
                    }
                }, onError);
                return true;
            };
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                scene.useRightHandedSystem = true;
                GLTF1.GLTFLoaderExtension.LoadRuntimeAsync(scene, data, rootUrl, function (gltfRuntime) {
                    // Load runtime extensios
                    GLTF1.GLTFLoaderExtension.LoadRuntimeExtensionsAsync(gltfRuntime, function () {
                        // Create nodes
                        _this._createNodes(gltfRuntime);
                        // Load buffers, shaders, materials, etc.
                        _this._loadBuffersAsync(gltfRuntime, function () {
                            _this._loadShadersAsync(gltfRuntime, function () {
                                importMaterials(gltfRuntime);
                                postLoad(gltfRuntime);
                                if (!BABYLON.GLTFFileLoader.IncrementalLoading) {
                                    onSuccess();
                                }
                            });
                        });
                        if (BABYLON.GLTFFileLoader.IncrementalLoading) {
                            onSuccess();
                        }
                    }, onError);
                }, onError);
            };
            GLTFLoader.prototype._loadShadersAsync = function (gltfRuntime, onload) {
                var hasShaders = false;
                var processShader = function (sha, shader) {
                    GLTF1.GLTFLoaderExtension.LoadShaderStringAsync(gltfRuntime, sha, function (shaderString) {
                        gltfRuntime.loadedShaderCount++;
                        if (shaderString) {
                            BABYLON.Effect.ShadersStore[sha + (shader.type === GLTF1.EShaderType.VERTEX ? "VertexShader" : "PixelShader")] = shaderString;
                        }
                        if (gltfRuntime.loadedShaderCount === gltfRuntime.shaderscount) {
                            onload();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading shader program named " + sha + " located at " + shader.uri);
                    });
                };
                for (var sha in gltfRuntime.shaders) {
                    hasShaders = true;
                    var shader = gltfRuntime.shaders[sha];
                    if (shader) {
                        processShader.bind(this, sha, shader)();
                    }
                    else {
                        BABYLON.Tools.Error("No shader named: " + sha);
                    }
                }
                if (!hasShaders) {
                    onload();
                }
            };
            ;
            GLTFLoader.prototype._loadBuffersAsync = function (gltfRuntime, onLoad, onProgress) {
                var hasBuffers = false;
                var processBuffer = function (buf, buffer) {
                    GLTF1.GLTFLoaderExtension.LoadBufferAsync(gltfRuntime, buf, function (bufferView) {
                        gltfRuntime.loadedBufferCount++;
                        if (bufferView) {
                            if (bufferView.byteLength != gltfRuntime.buffers[buf].byteLength) {
                                BABYLON.Tools.Error("Buffer named " + buf + " is length " + bufferView.byteLength + ". Expected: " + buffer.byteLength); // Improve error message
                            }
                            gltfRuntime.loadedBufferViews[buf] = bufferView;
                        }
                        if (gltfRuntime.loadedBufferCount === gltfRuntime.buffersCount) {
                            onLoad();
                        }
                    }, function () {
                        BABYLON.Tools.Error("Error when loading buffer named " + buf + " located at " + buffer.uri);
                    });
                };
                for (var buf in gltfRuntime.buffers) {
                    hasBuffers = true;
                    var buffer = gltfRuntime.buffers[buf];
                    if (buffer) {
                        processBuffer.bind(this, buf, buffer)();
                    }
                    else {
                        BABYLON.Tools.Error("No buffer named: " + buf);
                    }
                }
                if (!hasBuffers) {
                    onLoad();
                }
            };
            GLTFLoader.prototype._createNodes = function (gltfRuntime) {
                var currentScene = gltfRuntime.currentScene;
                if (currentScene) {
                    // Only one scene even if multiple scenes are defined
                    for (var i = 0; i < currentScene.nodes.length; i++) {
                        traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                    }
                }
                else {
                    // Load all scenes
                    for (var thing in gltfRuntime.scenes) {
                        currentScene = gltfRuntime.scenes[thing];
                        for (var i = 0; i < currentScene.nodes.length; i++) {
                            traverseNodes(gltfRuntime, currentScene.nodes[i], null);
                        }
                    }
                }
            };
            GLTFLoader.Extensions = {};
            return GLTFLoader;
        }());
        GLTF1.GLTFLoader = GLTFLoader;
        ;
        BABYLON.GLTFFileLoader.CreateGLTFLoaderV1 = function () { return new GLTFLoader(); };
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = /** @class */ (function () {
            function GLTFUtils() {
            }
            /**
             * Sets the given "parameter" matrix
             * @param scene: the {BABYLON.Scene} object
             * @param source: the source node where to pick the matrix
             * @param parameter: the GLTF technique parameter
             * @param uniformName: the name of the shader's uniform
             * @param shaderMaterial: the shader material
             */
            GLTFUtils.SetMatrix = function (scene, source, parameter, uniformName, shaderMaterial) {
                var mat = null;
                if (parameter.semantic === "MODEL") {
                    mat = source.getWorldMatrix();
                }
                else if (parameter.semantic === "PROJECTION") {
                    mat = scene.getProjectionMatrix();
                }
                else if (parameter.semantic === "VIEW") {
                    mat = scene.getViewMatrix();
                }
                else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
                }
                else if (parameter.semantic === "MODELVIEW") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
                }
                else if (parameter.semantic === "MODELVIEWPROJECTION") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
                }
                else if (parameter.semantic === "MODELINVERSE") {
                    mat = source.getWorldMatrix().invert();
                }
                else if (parameter.semantic === "VIEWINVERSE") {
                    mat = scene.getViewMatrix().invert();
                }
                else if (parameter.semantic === "PROJECTIONINVERSE") {
                    mat = scene.getProjectionMatrix().invert();
                }
                else if (parameter.semantic === "MODELVIEWINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
                }
                else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
                    mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
                }
                else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
                    mat = BABYLON.Matrix.Transpose(source.getWorldMatrix().invert());
                }
                else {
                    debugger;
                }
                if (mat) {
                    switch (parameter.type) {
                        case GLTF1.EParameterType.FLOAT_MAT2:
                            shaderMaterial.setMatrix2x2(uniformName, BABYLON.Matrix.GetAsMatrix2x2(mat));
                            break;
                        case GLTF1.EParameterType.FLOAT_MAT3:
                            shaderMaterial.setMatrix3x3(uniformName, BABYLON.Matrix.GetAsMatrix3x3(mat));
                            break;
                        case GLTF1.EParameterType.FLOAT_MAT4:
                            shaderMaterial.setMatrix(uniformName, mat);
                            break;
                        default: break;
                    }
                }
            };
            /**
             * Sets the given "parameter" matrix
             * @param shaderMaterial: the shader material
             * @param uniform: the name of the shader's uniform
             * @param value: the value of the uniform
             * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
             */
            GLTFUtils.SetUniform = function (shaderMaterial, uniform, value, type) {
                switch (type) {
                    case GLTF1.EParameterType.FLOAT:
                        shaderMaterial.setFloat(uniform, value);
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC2:
                        shaderMaterial.setVector2(uniform, BABYLON.Vector2.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC3:
                        shaderMaterial.setVector3(uniform, BABYLON.Vector3.FromArray(value));
                        return true;
                    case GLTF1.EParameterType.FLOAT_VEC4:
                        shaderMaterial.setVector4(uniform, BABYLON.Vector4.FromArray(value));
                        return true;
                    default: return false;
                }
            };
            /**
            * If the uri is a base64 string
            * @param uri: the uri to test
            */
            GLTFUtils.IsBase64 = function (uri) {
                return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
            };
            /**
            * Decode the base64 uri
            * @param uri: the uri to decode
            */
            GLTFUtils.DecodeBase64 = function (uri) {
                var decodedString = atob(uri.split(",")[1]);
                var bufferLength = decodedString.length;
                var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));
                for (var i = 0; i < bufferLength; i++) {
                    bufferView[i] = decodedString.charCodeAt(i);
                }
                return bufferView.buffer;
            };
            /**
            * Returns the wrap mode of the texture
            * @param mode: the mode value
            */
            GLTFUtils.GetWrapMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF1.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default: return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            /**
             * Returns the byte stride giving an accessor
             * @param accessor: the GLTF accessor objet
             */
            GLTFUtils.GetByteStrideFromType = function (accessor) {
                // Needs this function since "byteStride" isn't requiered in glTF format
                var type = accessor.type;
                switch (type) {
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                    default: return 1;
                }
            };
            /**
             * Returns the texture filter mode giving a mode value
             * @param mode: the filter mode value
             */
            GLTFUtils.GetTextureFilterMode = function (mode) {
                switch (mode) {
                    case GLTF1.ETextureFilterType.LINEAR:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_NEAREST:
                    case GLTF1.ETextureFilterType.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
                    case GLTF1.ETextureFilterType.NEAREST:
                    case GLTF1.ETextureFilterType.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_SAMPLINGMODE;
                    default: return BABYLON.Texture.BILINEAR_SAMPLINGMODE;
                }
            };
            GLTFUtils.GetBufferFromBufferView = function (gltfRuntime, bufferView, byteOffset, byteLength, componentType) {
                var byteOffset = bufferView.byteOffset + byteOffset;
                var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
                if (byteOffset + byteLength > loadedBufferView.byteLength) {
                    throw new Error("Buffer access is out of range");
                }
                var buffer = loadedBufferView.buffer;
                byteOffset += loadedBufferView.byteOffset;
                switch (componentType) {
                    case GLTF1.EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                    case GLTF1.EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                    default: return new Float32Array(buffer, byteOffset, byteLength);
                }
            };
            /**
             * Returns a buffer from its accessor
             * @param gltfRuntime: the GLTF runtime
             * @param accessor: the GLTF accessor
             */
            GLTFUtils.GetBufferFromAccessor = function (gltfRuntime, accessor) {
                var bufferView = gltfRuntime.bufferViews[accessor.bufferView];
                var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
                return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
            };
            /**
             * Decodes a buffer view into a string
             * @param view: the buffer view
             */
            GLTFUtils.DecodeBufferToText = function (view) {
                var result = "";
                var length = view.byteLength;
                for (var i = 0; i < length; ++i) {
                    result += String.fromCharCode(view[i]);
                }
                return result;
            };
            /**
             * Returns the default material of gltf. Related to
             * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
             * @param scene: the Babylon.js scene
             */
            GLTFUtils.GetDefaultMaterial = function (scene) {
                if (!GLTFUtils._DefaultMaterial) {
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialVertexShader"] = [
                        "precision highp float;",
                        "",
                        "uniform mat4 worldView;",
                        "uniform mat4 projection;",
                        "",
                        "attribute vec3 position;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_Position = projection * worldView * vec4(position, 1.0);",
                        "}"
                    ].join("\n");
                    BABYLON.Effect.ShadersStore["GLTFDefaultMaterialPixelShader"] = [
                        "precision highp float;",
                        "",
                        "uniform vec4 u_emission;",
                        "",
                        "void main(void)",
                        "{",
                        "    gl_FragColor = u_emission;",
                        "}"
                    ].join("\n");
                    var shaderPath = {
                        vertex: "GLTFDefaultMaterial",
                        fragment: "GLTFDefaultMaterial"
                    };
                    var options = {
                        attributes: ["position"],
                        uniforms: ["worldView", "projection", "u_emission"],
                        samplers: new Array(),
                        needAlphaBlending: false
                    };
                    GLTFUtils._DefaultMaterial = new BABYLON.ShaderMaterial("GLTFDefaultMaterial", scene, shaderPath, options);
                    GLTFUtils._DefaultMaterial.setColor4("u_emission", new BABYLON.Color4(0.5, 0.5, 0.5, 1.0));
                }
                return GLTFUtils._DefaultMaterial;
            };
            // The GLTF default material
            GLTFUtils._DefaultMaterial = null;
            return GLTFUtils;
        }());
        GLTF1.GLTFUtils = GLTFUtils;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF1;
    (function (GLTF1) {
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension(name) {
                this._name = name;
            }
            Object.defineProperty(GLTFLoaderExtension.prototype, "name", {
                get: function () {
                    return this._name;
                },
                enumerable: true,
                configurable: true
            });
            /**
            * Defines an override for loading the runtime
            * Return true to stop further extensions from loading the runtime
            */
            GLTFLoaderExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                return false;
            };
            /**
             * Defines an onverride for creating gltf runtime
             * Return true to stop further extensions from creating the runtime
             */
            GLTFLoaderExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading buffers
            * Return true to stop further extensions from loading this buffer
            */
            GLTFLoaderExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                return false;
            };
            /**
            * Defines an override for loading texture buffers
            * Return true to stop further extensions from loading this texture data
            */
            GLTFLoaderExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for creating textures
            * Return true to stop further extensions from loading this texture
            */
            GLTFLoaderExtension.prototype.createTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading shader strings
            * Return true to stop further extensions from loading this shader data
            */
            GLTFLoaderExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            /**
            * Defines an override for loading materials
            * Return true to stop further extensions from loading this material
            */
            GLTFLoaderExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                return false;
            };
            // ---------
            // Utilities
            // ---------
            GLTFLoaderExtension.LoadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeAsync(scene, data, rootUrl, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                    });
                });
            };
            GLTFLoaderExtension.LoadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadRuntimeExtensionsAsync(gltfRuntime, onSuccess, onError);
                }, function () {
                    setTimeout(function () {
                        onSuccess();
                    });
                });
            };
            GLTFLoaderExtension.LoadBufferAsync = function (gltfRuntime, id, onSuccess, onError, onProgress) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadBufferAsync(gltfRuntime, id, onSuccess, onError, onProgress);
                });
            };
            GLTFLoaderExtension.LoadTextureAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) { return GLTFLoaderExtension.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError); }, onError);
            };
            GLTFLoaderExtension.LoadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadShaderStringAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadMaterialAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.LoadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.loadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.CreateTextureAsync = function (gltfRuntime, id, buffer, onSuccess, onError) {
                GLTFLoaderExtension.ApplyExtensions(function (loaderExtension) {
                    return loaderExtension.createTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                }, function () {
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
                });
            };
            GLTFLoaderExtension.ApplyExtensions = function (func, defaultFunc) {
                for (var extensionName in GLTF1.GLTFLoader.Extensions) {
                    var loaderExtension = GLTF1.GLTFLoader.Extensions[extensionName];
                    if (func(loaderExtension)) {
                        return;
                    }
                }
                defaultFunc();
            };
            return GLTFLoaderExtension;
        }());
        GLTF1.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
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
    var GLTF1;
    (function (GLTF1) {
        var BinaryExtensionBufferName = "binary_glTF";
        ;
        ;
        var GLTFBinaryExtension = /** @class */ (function (_super) {
            __extends(GLTFBinaryExtension, _super);
            function GLTFBinaryExtension() {
                return _super.call(this, "KHR_binary_glTF") || this;
            }
            GLTFBinaryExtension.prototype.loadRuntimeAsync = function (scene, data, rootUrl, onSuccess, onError) {
                var extensionsUsed = data.json.extensionsUsed;
                if (!extensionsUsed || extensionsUsed.indexOf(this.name) === -1 || !data.bin) {
                    return false;
                }
                this._bin = data.bin;
                onSuccess(GLTF1.GLTFLoaderBase.CreateRuntime(data.json, scene, rootUrl));
                return true;
            };
            GLTFBinaryExtension.prototype.loadBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                if (gltfRuntime.extensionsUsed.indexOf(this.name) === -1) {
                    return false;
                }
                if (id !== BinaryExtensionBufferName) {
                    return false;
                }
                onSuccess(this._bin);
                return true;
            };
            GLTFBinaryExtension.prototype.loadTextureBufferAsync = function (gltfRuntime, id, onSuccess, onError) {
                var texture = gltfRuntime.textures[id];
                var source = gltfRuntime.images[texture.source];
                if (!source.extensions || !(this.name in source.extensions)) {
                    return false;
                }
                var sourceExt = source.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[sourceExt.bufferView];
                var buffer = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                onSuccess(buffer);
                return true;
            };
            GLTFBinaryExtension.prototype.loadShaderStringAsync = function (gltfRuntime, id, onSuccess, onError) {
                var shader = gltfRuntime.shaders[id];
                if (!shader.extensions || !(this.name in shader.extensions)) {
                    return false;
                }
                var binaryExtensionShader = shader.extensions[this.name];
                var bufferView = gltfRuntime.bufferViews[binaryExtensionShader.bufferView];
                var shaderBytes = GLTF1.GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, 0, bufferView.byteLength, GLTF1.EComponentType.UNSIGNED_BYTE);
                setTimeout(function () {
                    var shaderString = GLTF1.GLTFUtils.DecodeBufferToText(shaderBytes);
                    onSuccess(shaderString);
                });
                return true;
            };
            return GLTFBinaryExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFBinaryExtension = GLTFBinaryExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFBinaryExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFBinaryExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
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
    var GLTF1;
    (function (GLTF1) {
        ;
        ;
        ;
        var GLTFMaterialsCommonExtension = /** @class */ (function (_super) {
            __extends(GLTFMaterialsCommonExtension, _super);
            function GLTFMaterialsCommonExtension() {
                return _super.call(this, "KHR_materials_common") || this;
            }
            GLTFMaterialsCommonExtension.prototype.loadRuntimeExtensionsAsync = function (gltfRuntime, onSuccess, onError) {
                if (!gltfRuntime.extensions)
                    return false;
                var extension = gltfRuntime.extensions[this.name];
                if (!extension)
                    return false;
                // Create lights
                var lights = extension.lights;
                if (lights) {
                    for (var thing in lights) {
                        var light = lights[thing];
                        switch (light.type) {
                            case "ambient":
                                var ambientLight = new BABYLON.HemisphericLight(light.name, new BABYLON.Vector3(0, 1, 0), gltfRuntime.scene);
                                var ambient = light.ambient;
                                if (ambient) {
                                    ambientLight.diffuse = BABYLON.Color3.FromArray(ambient.color || [1, 1, 1]);
                                }
                                break;
                            case "point":
                                var pointLight = new BABYLON.PointLight(light.name, new BABYLON.Vector3(10, 10, 10), gltfRuntime.scene);
                                var point = light.point;
                                if (point) {
                                    pointLight.diffuse = BABYLON.Color3.FromArray(point.color || [1, 1, 1]);
                                }
                                break;
                            case "directional":
                                var dirLight = new BABYLON.DirectionalLight(light.name, new BABYLON.Vector3(0, -1, 0), gltfRuntime.scene);
                                var directional = light.directional;
                                if (directional) {
                                    dirLight.diffuse = BABYLON.Color3.FromArray(directional.color || [1, 1, 1]);
                                }
                                break;
                            case "spot":
                                var spot = light.spot;
                                if (spot) {
                                    var spotLight = new BABYLON.SpotLight(light.name, new BABYLON.Vector3(0, 10, 0), new BABYLON.Vector3(0, -1, 0), spot.fallOffAngle || Math.PI, spot.fallOffExponent || 0.0, gltfRuntime.scene);
                                    spotLight.diffuse = BABYLON.Color3.FromArray(spot.color || [1, 1, 1]);
                                }
                                break;
                            default:
                                BABYLON.Tools.Warn("GLTF Material Common extension: light type \"" + light.type + "\” not supported");
                                break;
                        }
                    }
                }
                return false;
            };
            GLTFMaterialsCommonExtension.prototype.loadMaterialAsync = function (gltfRuntime, id, onSuccess, onError) {
                var material = gltfRuntime.materials[id];
                if (!material || !material.extensions)
                    return false;
                var extension = material.extensions[this.name];
                if (!extension)
                    return false;
                var standardMaterial = new BABYLON.StandardMaterial(id, gltfRuntime.scene);
                standardMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                if (extension.technique === "CONSTANT") {
                    standardMaterial.disableLighting = true;
                }
                standardMaterial.backFaceCulling = extension.doubleSided === undefined ? false : !extension.doubleSided;
                standardMaterial.alpha = extension.values.transparency === undefined ? 1.0 : extension.values.transparency;
                standardMaterial.specularPower = extension.values.shininess === undefined ? 0.0 : extension.values.shininess;
                // Ambient
                if (typeof extension.values.ambient === "string") {
                    this._loadTexture(gltfRuntime, extension.values.ambient, standardMaterial, "ambientTexture", onError);
                }
                else {
                    standardMaterial.ambientColor = BABYLON.Color3.FromArray(extension.values.ambient || [0, 0, 0]);
                }
                // Diffuse
                if (typeof extension.values.diffuse === "string") {
                    this._loadTexture(gltfRuntime, extension.values.diffuse, standardMaterial, "diffuseTexture", onError);
                }
                else {
                    standardMaterial.diffuseColor = BABYLON.Color3.FromArray(extension.values.diffuse || [0, 0, 0]);
                }
                // Emission
                if (typeof extension.values.emission === "string") {
                    this._loadTexture(gltfRuntime, extension.values.emission, standardMaterial, "emissiveTexture", onError);
                }
                else {
                    standardMaterial.emissiveColor = BABYLON.Color3.FromArray(extension.values.emission || [0, 0, 0]);
                }
                // Specular
                if (typeof extension.values.specular === "string") {
                    this._loadTexture(gltfRuntime, extension.values.specular, standardMaterial, "specularTexture", onError);
                }
                else {
                    standardMaterial.specularColor = BABYLON.Color3.FromArray(extension.values.specular || [0, 0, 0]);
                }
                return true;
            };
            GLTFMaterialsCommonExtension.prototype._loadTexture = function (gltfRuntime, id, material, propertyPath, onError) {
                // Create buffer from texture url
                GLTF1.GLTFLoaderBase.LoadTextureBufferAsync(gltfRuntime, id, function (buffer) {
                    // Create texture from buffer
                    GLTF1.GLTFLoaderBase.CreateTextureAsync(gltfRuntime, id, buffer, function (texture) { return material[propertyPath] = texture; }, onError);
                }, onError);
            };
            return GLTFMaterialsCommonExtension;
        }(GLTF1.GLTFLoaderExtension));
        GLTF1.GLTFMaterialsCommonExtension = GLTFMaterialsCommonExtension;
        GLTF1.GLTFLoader.RegisterExtension(new GLTFMaterialsCommonExtension());
    })(GLTF1 = BABYLON.GLTF1 || (BABYLON.GLTF1 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFMaterialsCommonExtension.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF2.EComponentType || (GLTF2.EComponentType = {}));
        var EMeshPrimitiveMode;
        (function (EMeshPrimitiveMode) {
            EMeshPrimitiveMode[EMeshPrimitiveMode["POINTS"] = 0] = "POINTS";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINES"] = 1] = "LINES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
        })(EMeshPrimitiveMode = GLTF2.EMeshPrimitiveMode || (GLTF2.EMeshPrimitiveMode = {}));
        var ETextureMagFilter;
        (function (ETextureMagFilter) {
            ETextureMagFilter[ETextureMagFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMagFilter[ETextureMagFilter["LINEAR"] = 9729] = "LINEAR";
        })(ETextureMagFilter = GLTF2.ETextureMagFilter || (GLTF2.ETextureMagFilter = {}));
        var ETextureMinFilter;
        (function (ETextureMinFilter) {
            ETextureMinFilter[ETextureMinFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR"] = 9729] = "LINEAR";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureMinFilter = GLTF2.ETextureMinFilter || (GLTF2.ETextureMinFilter = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF2.ETextureWrapMode || (GLTF2.ETextureWrapMode = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoaderTracker = /** @class */ (function () {
            function GLTFLoaderTracker(onComplete) {
                this._pendingCount = 0;
                this._callback = onComplete;
            }
            GLTFLoaderTracker.prototype._addPendingData = function (data) {
                this._pendingCount++;
            };
            GLTFLoaderTracker.prototype._removePendingData = function (data) {
                if (--this._pendingCount === 0) {
                    this._callback();
                }
            };
            return GLTFLoaderTracker;
        }());
        var GLTFLoader = /** @class */ (function () {
            function GLTFLoader(parent) {
                this._disposed = false;
                this._renderReady = false;
                this._requests = new Array();
                this._renderReadyObservable = new BABYLON.Observable();
                // Count of pending work that needs to complete before the asset is rendered.
                this._renderPendingCount = 0;
                // Count of pending work that needs to complete before the loader is disposed.
                this._loaderPendingCount = 0;
                this._loaderTrackers = new Array();
                this._parent = parent;
                if (!GLTFLoader._progressEventFactory) {
                    if (typeof window["ProgressEvent"] === "function") {
                        GLTFLoader._progressEventFactory = GLTFLoader._createProgressEventByConstructor;
                    }
                    else {
                        GLTFLoader._progressEventFactory = GLTFLoader._createProgressEventByDocument;
                    }
                }
            }
            GLTFLoader.RegisterExtension = function (extension) {
                if (GLTFLoader.Extensions[extension.name]) {
                    BABYLON.Tools.Error("Extension with the same name '" + extension.name + "' already exists");
                    return;
                }
                GLTFLoader.Extensions[extension.name] = extension;
                // Keep the order of registration so that extensions registered first are called first.
                GLTF2.GLTFLoaderExtension._Extensions.push(extension);
            };
            GLTFLoader._createProgressEventByConstructor = function (name, data) {
                return new ProgressEvent(name, data);
            };
            GLTFLoader._createProgressEventByDocument = function (name, data) {
                var event = document.createEvent("ProgressEvent");
                event.initProgressEvent(name, false, false, data.lengthComputable, data.loaded, data.total);
                return event;
            };
            GLTFLoader.prototype.dispose = function () {
                if (this._disposed) {
                    return;
                }
                this._disposed = true;
                // Abort requests that are not complete
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    if (request.readyState !== (XMLHttpRequest.DONE || 4)) {
                        request.abort();
                    }
                }
                // Revoke object urls created during load
                if (this._gltf.textures) {
                    for (var _b = 0, _c = this._gltf.textures; _b < _c.length; _b++) {
                        var texture = _c[_b];
                        if (texture.url) {
                            URL.revokeObjectURL(texture.url);
                        }
                    }
                }
            };
            GLTFLoader.prototype.importMeshAsync = function (meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                this._loadAsync(meshesNames, scene, data, rootUrl, function () {
                    onSuccess(_this._getMeshes(), [], _this._getSkeletons());
                }, onProgress, onError);
            };
            GLTFLoader.prototype.loadAsync = function (scene, data, rootUrl, onSuccess, onProgress, onError) {
                this._loadAsync(null, scene, data, rootUrl, onSuccess, onProgress, onError);
            };
            GLTFLoader.prototype._loadAsync = function (nodeNames, scene, data, rootUrl, onSuccess, onProgress, onError) {
                var _this = this;
                this._tryCatchOnError(function () {
                    _this._loadData(data);
                    _this._babylonScene = scene;
                    _this._rootUrl = rootUrl;
                    _this._successCallback = onSuccess;
                    _this._progressCallback = onProgress;
                    _this._errorCallback = onError;
                    _this._addPendingData(_this);
                    _this._loadDefaultScene(nodeNames);
                    _this._loadAnimations();
                    _this._removePendingData(_this);
                });
            };
            GLTFLoader.prototype._onProgress = function () {
                if (!this._progressCallback) {
                    return;
                }
                var loaded = 0;
                var total = 0;
                for (var _i = 0, _a = this._requests; _i < _a.length; _i++) {
                    var request = _a[_i];
                    if (!request._loaded || !request._total) {
                        return;
                    }
                    loaded += request._loaded;
                    total += request._total;
                }
                this._progressCallback(GLTFLoader._progressEventFactory("GLTFLoaderProgress", {
                    lengthComputable: true,
                    loaded: loaded,
                    total: total
                }));
            };
            GLTFLoader.prototype._executeWhenRenderReady = function (func) {
                if (this._renderReady) {
                    func();
                }
                else {
                    this._renderReadyObservable.add(func);
                }
            };
            GLTFLoader.prototype._onRenderReady = function () {
                this._rootNode.babylonMesh.setEnabled(true);
                this._startAnimations();
                this._successCallback();
                this._renderReadyObservable.notifyObservers(this);
            };
            GLTFLoader.prototype._onComplete = function () {
                if (this._parent.onComplete) {
                    this._parent.onComplete();
                }
                this.dispose();
            };
            GLTFLoader.prototype._loadData = function (data) {
                this._gltf = data.json;
                // Assign the index of each object for convinience.
                GLTFLoader._AssignIndices(this._gltf.accessors);
                GLTFLoader._AssignIndices(this._gltf.animations);
                GLTFLoader._AssignIndices(this._gltf.buffers);
                GLTFLoader._AssignIndices(this._gltf.bufferViews);
                GLTFLoader._AssignIndices(this._gltf.images);
                GLTFLoader._AssignIndices(this._gltf.materials);
                GLTFLoader._AssignIndices(this._gltf.meshes);
                GLTFLoader._AssignIndices(this._gltf.nodes);
                GLTFLoader._AssignIndices(this._gltf.scenes);
                GLTFLoader._AssignIndices(this._gltf.skins);
                GLTFLoader._AssignIndices(this._gltf.textures);
                if (data.bin) {
                    var buffers = this._gltf.buffers;
                    if (buffers && buffers[0] && !buffers[0].uri) {
                        var binaryBuffer = buffers[0];
                        if (binaryBuffer.byteLength != data.bin.byteLength) {
                            BABYLON.Tools.Warn("Binary buffer length (" + binaryBuffer.byteLength + ") from JSON does not match chunk length (" + data.bin.byteLength + ")");
                        }
                        binaryBuffer.loadedData = data.bin;
                    }
                    else {
                        BABYLON.Tools.Warn("Unexpected BIN chunk");
                    }
                }
            };
            GLTFLoader.prototype._getMeshes = function () {
                var meshes = new Array();
                // Root mesh is always first.
                meshes.push(this._rootNode.babylonMesh);
                var nodes = this._gltf.nodes;
                if (nodes) {
                    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                        var node = nodes_1[_i];
                        if (node.babylonMesh) {
                            meshes.push(node.babylonMesh);
                        }
                    }
                }
                return meshes;
            };
            GLTFLoader.prototype._getSkeletons = function () {
                var skeletons = new Array();
                var skins = this._gltf.skins;
                if (skins) {
                    for (var _i = 0, skins_1 = skins; _i < skins_1.length; _i++) {
                        var skin = skins_1[_i];
                        if (skin.babylonSkeleton) {
                            skeletons.push(skin.babylonSkeleton);
                        }
                    }
                }
                return skeletons;
            };
            GLTFLoader.prototype._getAnimationTargets = function () {
                var targets = new Array();
                var animations = this._gltf.animations;
                if (animations) {
                    for (var _i = 0, animations_1 = animations; _i < animations_1.length; _i++) {
                        var animation = animations_1[_i];
                        targets.push.apply(targets, animation.targets);
                    }
                }
                return targets;
            };
            GLTFLoader.prototype._startAnimations = function () {
                for (var _i = 0, _a = this._getAnimationTargets(); _i < _a.length; _i++) {
                    var target = _a[_i];
                    this._babylonScene.beginAnimation(target, 0, Number.MAX_VALUE, true);
                }
            };
            GLTFLoader.prototype._loadDefaultScene = function (nodeNames) {
                var scene = GLTFLoader._GetProperty(this._gltf.scenes, this._gltf.scene || 0);
                if (!scene) {
                    throw new Error("Failed to find scene " + (this._gltf.scene || 0));
                }
                this._loadScene("#/scenes/" + scene.index, scene, nodeNames);
            };
            GLTFLoader.prototype._loadScene = function (context, scene, nodeNames) {
                this._rootNode = { babylonMesh: new BABYLON.Mesh("__root__", this._babylonScene) };
                switch (this._parent.coordinateSystemMode) {
                    case BABYLON.GLTFLoaderCoordinateSystemMode.AUTO: {
                        if (!this._babylonScene.useRightHandedSystem) {
                            this._rootNode.babylonMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                            this._rootNode.babylonMesh.scaling = new BABYLON.Vector3(1, 1, -1);
                        }
                        break;
                    }
                    case BABYLON.GLTFLoaderCoordinateSystemMode.PASS_THROUGH: {
                        // do nothing
                        break;
                    }
                    case BABYLON.GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED: {
                        this._babylonScene.useRightHandedSystem = true;
                        break;
                    }
                    default: {
                        BABYLON.Tools.Error("Invalid coordinate system mode " + this._parent.coordinateSystemMode);
                        return;
                    }
                }
                if (this._parent.onMeshLoaded) {
                    this._parent.onMeshLoaded(this._rootNode.babylonMesh);
                }
                var nodeIndices = scene.nodes;
                this._traverseNodes(context, nodeIndices, function (node, parentNode) {
                    node.parent = parentNode;
                    return true;
                }, this._rootNode);
                if (nodeNames) {
                    if (!(nodeNames instanceof Array)) {
                        nodeNames = [nodeNames];
                    }
                    var filteredNodeIndices_1 = new Array();
                    this._traverseNodes(context, nodeIndices, function (node) {
                        if (nodeNames.indexOf(node.name) !== -1) {
                            filteredNodeIndices_1.push(node.index);
                            return false;
                        }
                        return true;
                    }, this._rootNode);
                    nodeIndices = filteredNodeIndices_1;
                }
                for (var _i = 0, nodeIndices_1 = nodeIndices; _i < nodeIndices_1.length; _i++) {
                    var index = nodeIndices_1[_i];
                    var node = GLTFLoader._GetProperty(this._gltf.nodes, index);
                    if (!node) {
                        throw new Error(context + ": Failed to find node " + index);
                    }
                    this._loadNode("#/nodes/" + index, node);
                }
                // Disable the root mesh until the asset is ready to render.
                this._rootNode.babylonMesh.setEnabled(false);
            };
            GLTFLoader.prototype._loadNode = function (context, node) {
                if (GLTF2.GLTFLoaderExtension.LoadNode(this, context, node)) {
                    return;
                }
                node.babylonMesh = new BABYLON.Mesh(node.name || "mesh" + node.index, this._babylonScene);
                node.babylonMesh.hasVertexAlpha = true;
                this._loadTransform(node);
                if (node.mesh != null) {
                    var mesh = GLTFLoader._GetProperty(this._gltf.meshes, node.mesh);
                    if (!mesh) {
                        throw new Error(context + ": Failed to find mesh " + node.mesh);
                    }
                    this._loadMesh("#/meshes/" + node.mesh, node, mesh);
                }
                node.babylonMesh.parent = node.parent ? node.parent.babylonMesh : null;
                node.babylonAnimationTargets = node.babylonAnimationTargets || [];
                node.babylonAnimationTargets.push(node.babylonMesh);
                if (node.skin != null) {
                    var skin = GLTFLoader._GetProperty(this._gltf.skins, node.skin);
                    if (!skin) {
                        throw new Error(context + ": Failed to find skin " + node.skin);
                    }
                    node.babylonMesh.skeleton = this._loadSkin("#/skins/" + node.skin, skin);
                }
                if (node.camera != null) {
                    // TODO: handle cameras
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var index = _a[_i];
                        var childNode = GLTFLoader._GetProperty(this._gltf.nodes, index);
                        if (!childNode) {
                            throw new Error(context + ": Failed to find child node " + index);
                        }
                        this._loadNode("#/nodes/" + index, childNode);
                    }
                }
                if (this._parent.onMeshLoaded) {
                    this._parent.onMeshLoaded(node.babylonMesh);
                }
            };
            GLTFLoader.prototype._loadMesh = function (context, node, mesh) {
                var _this = this;
                var primitives = mesh.primitives;
                if (!primitives || primitives.length === 0) {
                    throw new Error(context + ": Primitives are missing");
                }
                this._createMorphTargets(context, node, mesh);
                this._loadAllVertexDataAsync(context, mesh, function () {
                    _this._loadMorphTargets(context, node, mesh);
                    var vertexData = new BABYLON.VertexData();
                    for (var _i = 0, primitives_1 = primitives; _i < primitives_1.length; _i++) {
                        var primitive = primitives_1[_i];
                        vertexData.merge(primitive.vertexData);
                    }
                    new BABYLON.Geometry(node.babylonMesh.name, _this._babylonScene, vertexData, false, node.babylonMesh);
                    // TODO: optimize this so that sub meshes can be created without being overwritten after setting vertex data.
                    // Sub meshes must be cleared and created after setting vertex data because of mesh._createGlobalSubMesh.
                    node.babylonMesh.subMeshes = [];
                    var verticesStart = 0;
                    var indicesStart = 0;
                    for (var index = 0; index < primitives.length; index++) {
                        var vertexData_1 = primitives[index].vertexData;
                        var verticesCount = vertexData_1.positions.length;
                        var indicesCount = vertexData_1.indices.length;
                        BABYLON.SubMesh.AddToMesh(index, verticesStart, verticesCount, indicesStart, indicesCount, node.babylonMesh);
                        verticesStart += verticesCount;
                        indicesStart += indicesCount;
                    }
                    ;
                });
                var multiMaterial = new BABYLON.MultiMaterial(node.babylonMesh.name, this._babylonScene);
                node.babylonMesh.material = multiMaterial;
                var subMaterials = multiMaterial.subMaterials;
                var _loop_1 = function (index) {
                    var primitive = primitives[index];
                    if (primitive.material == null) {
                        subMaterials[index] = this_1._getDefaultMaterial();
                    }
                    else {
                        var material = GLTFLoader._GetProperty(this_1._gltf.materials, primitive.material);
                        if (!material) {
                            throw new Error(context + ": Failed to find material " + primitive.material);
                        }
                        this_1._loadMaterial("#/materials/" + material.index, material, function (babylonMaterial, isNew) {
                            if (isNew && _this._parent.onMaterialLoaded) {
                                _this._parent.onMaterialLoaded(babylonMaterial);
                            }
                            subMaterials[index] = babylonMaterial;
                        });
                    }
                };
                var this_1 = this;
                for (var index = 0; index < primitives.length; index++) {
                    _loop_1(index);
                }
                ;
            };
            GLTFLoader.prototype._loadAllVertexDataAsync = function (context, mesh, onSuccess) {
                var primitives = mesh.primitives;
                var numRemainingPrimitives = primitives.length;
                var _loop_2 = function (index) {
                    var primitive = primitives[index];
                    this_2._loadVertexDataAsync(context + "/primitive/" + index, mesh, primitive, function (vertexData) {
                        primitive.vertexData = vertexData;
                        if (--numRemainingPrimitives === 0) {
                            onSuccess();
                        }
                    });
                };
                var this_2 = this;
                for (var index = 0; index < primitives.length; index++) {
                    _loop_2(index);
                }
            };
            /**
             * Converts a data bufferview into a Float4 Texture Coordinate Array, based on the accessor component type
             * @param {ArrayBufferView} data
             * @param {IGLTFAccessor} accessor
             */
            GLTFLoader.prototype._convertToFloat4TextureCoordArray = function (context, data, accessor) {
                if (accessor.componentType == GLTF2.EComponentType.FLOAT) {
                    return data;
                }
                var buffer = data;
                var factor = 1;
                switch (accessor.componentType) {
                    case GLTF2.EComponentType.UNSIGNED_BYTE: {
                        factor = 1 / 255;
                        break;
                    }
                    case GLTF2.EComponentType.UNSIGNED_SHORT: {
                        factor = 1 / 65535;
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid component type (" + accessor.componentType + ")");
                    }
                }
                var result = new Float32Array(accessor.count * 2);
                for (var i = 0; i < result.length; ++i) {
                    result[i] = buffer[i] * factor;
                }
                return result;
            };
            /**
             * Converts a data bufferview into a Float4 Color Array, based on the accessor component type
             * @param {ArrayBufferView} data
             * @param {IGLTFAccessor} accessor
             */
            GLTFLoader.prototype._convertToFloat4ColorArray = function (context, data, accessor) {
                var colorComponentCount = GLTFLoader._GetNumComponents(accessor.type);
                if (colorComponentCount === 4 && accessor.componentType === GLTF2.EComponentType.FLOAT) {
                    return data;
                }
                var buffer = data;
                var factor = 1;
                switch (accessor.componentType) {
                    case GLTF2.EComponentType.FLOAT: {
                        factor = 1;
                        break;
                    }
                    case GLTF2.EComponentType.UNSIGNED_BYTE: {
                        factor = 1 / 255;
                        break;
                    }
                    case GLTF2.EComponentType.UNSIGNED_SHORT: {
                        factor = 1 / 65535;
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid component type (" + accessor.componentType + ")");
                    }
                }
                var result = new Float32Array(accessor.count * 4);
                if (colorComponentCount === 4) {
                    for (var i = 0; i < result.length; ++i) {
                        result[i] = buffer[i] * factor;
                    }
                }
                else {
                    var offset = 0;
                    for (var i = 0; i < result.length; ++i) {
                        if ((i + 1) % 4 === 0) {
                            result[i] = 1;
                        }
                        else {
                            result[i] = buffer[offset++] * factor;
                        }
                    }
                }
                return result;
            };
            GLTFLoader.prototype._loadVertexDataAsync = function (context, mesh, primitive, onSuccess) {
                var _this = this;
                var attributes = primitive.attributes;
                if (!attributes) {
                    throw new Error(context + ": Attributes are missing");
                }
                if (primitive.mode && primitive.mode !== GLTF2.EMeshPrimitiveMode.TRIANGLES) {
                    // TODO: handle other primitive modes
                    throw new Error(context + ": Mode " + primitive.mode + " is not currently supported");
                }
                var vertexData = new BABYLON.VertexData();
                var numRemainingAttributes = Object.keys(attributes).length;
                var _loop_3 = function (attribute) {
                    var accessor = GLTFLoader._GetProperty(this_3._gltf.accessors, attributes[attribute]);
                    if (!accessor) {
                        throw new Error(context + ": Failed to find attribute '" + attribute + "' accessor " + attributes[attribute]);
                    }
                    this_3._loadAccessorAsync("#/accessors/" + accessor.index, accessor, function (data) {
                        switch (attribute) {
                            case "POSITION": {
                                vertexData.positions = data;
                                break;
                            }
                            case "NORMAL": {
                                vertexData.normals = data;
                                break;
                            }
                            case "TANGENT": {
                                vertexData.tangents = data;
                                break;
                            }
                            case "TEXCOORD_0": {
                                vertexData.uvs = _this._convertToFloat4TextureCoordArray(context, data, accessor);
                                break;
                            }
                            case "TEXCOORD_1": {
                                vertexData.uvs2 = _this._convertToFloat4TextureCoordArray(context, data, accessor);
                                break;
                            }
                            case "JOINTS_0": {
                                vertexData.matricesIndices = new Float32Array(Array.prototype.slice.apply(data));
                                break;
                            }
                            case "WEIGHTS_0": {
                                //TODO: need to add support for normalized weights.
                                vertexData.matricesWeights = data;
                                break;
                            }
                            case "COLOR_0": {
                                vertexData.colors = _this._convertToFloat4ColorArray(context, data, accessor);
                                break;
                            }
                            default: {
                                BABYLON.Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                                break;
                            }
                        }
                        if (--numRemainingAttributes === 0) {
                            if (primitive.indices == null) {
                                vertexData.indices = new Uint32Array(vertexData.positions.length / 3);
                                for (var i = 0; i < vertexData.indices.length; i++) {
                                    vertexData.indices[i] = i;
                                }
                                onSuccess(vertexData);
                            }
                            else {
                                var indicesAccessor = GLTFLoader._GetProperty(_this._gltf.accessors, primitive.indices);
                                if (!indicesAccessor) {
                                    throw new Error(context + ": Failed to find indices accessor " + primitive.indices);
                                }
                                _this._loadAccessorAsync("#/accessors/" + indicesAccessor.index, indicesAccessor, function (data) {
                                    vertexData.indices = data;
                                    onSuccess(vertexData);
                                });
                            }
                        }
                    });
                };
                var this_3 = this;
                for (var attribute in attributes) {
                    _loop_3(attribute);
                }
            };
            GLTFLoader.prototype._createMorphTargets = function (context, node, mesh) {
                var primitives = mesh.primitives;
                var targets = primitives[0].targets;
                if (!targets) {
                    return;
                }
                for (var _i = 0, primitives_2 = primitives; _i < primitives_2.length; _i++) {
                    var primitive = primitives_2[_i];
                    if (!primitive.targets || primitive.targets.length != targets.length) {
                        throw new Error(context + ": All primitives are required to list the same number of targets");
                    }
                }
                var morphTargetManager = new BABYLON.MorphTargetManager();
                node.babylonMesh.morphTargetManager = morphTargetManager;
                for (var index = 0; index < targets.length; index++) {
                    var weight = node.weights ? node.weights[index] : mesh.weights ? mesh.weights[index] : 0;
                    morphTargetManager.addTarget(new BABYLON.MorphTarget("morphTarget" + index, weight));
                }
            };
            GLTFLoader.prototype._loadMorphTargets = function (context, node, mesh) {
                var morphTargetManager = node.babylonMesh.morphTargetManager;
                if (!morphTargetManager) {
                    return;
                }
                this._loadAllMorphTargetVertexDataAsync(context, node, mesh, function () {
                    var numTargets = morphTargetManager.numTargets;
                    for (var index = 0; index < numTargets; index++) {
                        var vertexData = new BABYLON.VertexData();
                        for (var _i = 0, _a = mesh.primitives; _i < _a.length; _i++) {
                            var primitive = _a[_i];
                            vertexData.merge(primitive.targetsVertexData[index], { tangentLength: 3 });
                        }
                        if (!vertexData.positions) {
                            throw new Error(context + ": Positions are missing");
                        }
                        var target = morphTargetManager.getTarget(index);
                        target.setPositions(vertexData.positions);
                        target.setNormals(vertexData.normals);
                        target.setTangents(vertexData.tangents);
                    }
                });
            };
            GLTFLoader.prototype._loadAllMorphTargetVertexDataAsync = function (context, node, mesh, onSuccess) {
                var numRemainingTargets = mesh.primitives.length * node.babylonMesh.morphTargetManager.numTargets;
                var _loop_4 = function (primitive) {
                    var targets = primitive.targets;
                    primitive.targetsVertexData = new Array(targets.length);
                    var _loop_5 = function (index) {
                        this_4._loadMorphTargetVertexDataAsync(context + "/targets/" + index, primitive.vertexData, targets[index], function (vertexData) {
                            primitive.targetsVertexData[index] = vertexData;
                            if (--numRemainingTargets === 0) {
                                onSuccess();
                            }
                        });
                    };
                    for (var index = 0; index < targets.length; index++) {
                        _loop_5(index);
                    }
                };
                var this_4 = this;
                for (var _i = 0, _a = mesh.primitives; _i < _a.length; _i++) {
                    var primitive = _a[_i];
                    _loop_4(primitive);
                }
            };
            GLTFLoader.prototype._loadMorphTargetVertexDataAsync = function (context, vertexData, attributes, onSuccess) {
                var targetVertexData = new BABYLON.VertexData();
                var numRemainingAttributes = Object.keys(attributes).length;
                var _loop_6 = function (attribute) {
                    var accessor = GLTFLoader._GetProperty(this_5._gltf.accessors, attributes[attribute]);
                    if (!accessor) {
                        throw new Error(context + ": Failed to find attribute '" + attribute + "' accessor " + attributes[attribute]);
                    }
                    this_5._loadAccessorAsync("#/accessors/" + accessor.index, accessor, function (data) {
                        // glTF stores morph target information as deltas while babylon.js expects the final data.
                        // As a result we have to add the original data to the delta to calculate the final data.
                        var values = data;
                        switch (attribute) {
                            case "POSITION": {
                                for (var i = 0; i < values.length; i++) {
                                    values[i] += vertexData.positions[i];
                                }
                                targetVertexData.positions = values;
                                break;
                            }
                            case "NORMAL": {
                                for (var i = 0; i < values.length; i++) {
                                    values[i] += vertexData.normals[i];
                                }
                                targetVertexData.normals = values;
                                break;
                            }
                            case "TANGENT": {
                                // Tangent data for morph targets is stored as xyz delta.
                                // The vertexData.tangent is stored as xyzw.
                                // So we need to skip every fourth vertexData.tangent.
                                for (var i = 0, j = 0; i < values.length; i++, j++) {
                                    values[i] += vertexData.tangents[j];
                                    if ((i + 1) % 3 == 0) {
                                        j++;
                                    }
                                }
                                targetVertexData.tangents = values;
                                break;
                            }
                            default: {
                                BABYLON.Tools.Warn("Ignoring unrecognized attribute '" + attribute + "'");
                                break;
                            }
                        }
                        if (--numRemainingAttributes === 0) {
                            onSuccess(targetVertexData);
                        }
                    });
                };
                var this_5 = this;
                for (var attribute in attributes) {
                    _loop_6(attribute);
                }
            };
            GLTFLoader.prototype._loadTransform = function (node) {
                var position = BABYLON.Vector3.Zero();
                var rotation = BABYLON.Quaternion.Identity();
                var scaling = BABYLON.Vector3.One();
                if (node.matrix) {
                    var matrix = BABYLON.Matrix.FromArray(node.matrix);
                    matrix.decompose(scaling, rotation, position);
                }
                else {
                    if (node.translation)
                        position = BABYLON.Vector3.FromArray(node.translation);
                    if (node.rotation)
                        rotation = BABYLON.Quaternion.FromArray(node.rotation);
                    if (node.scale)
                        scaling = BABYLON.Vector3.FromArray(node.scale);
                }
                node.babylonMesh.position = position;
                node.babylonMesh.rotationQuaternion = rotation;
                node.babylonMesh.scaling = scaling;
            };
            GLTFLoader.prototype._loadSkin = function (context, skin) {
                var _this = this;
                var skeletonId = "skeleton" + skin.index;
                skin.babylonSkeleton = new BABYLON.Skeleton(skin.name || skeletonId, skeletonId, this._babylonScene);
                if (skin.inverseBindMatrices == null) {
                    this._loadBones(context, skin, null);
                }
                else {
                    var accessor = GLTFLoader._GetProperty(this._gltf.accessors, skin.inverseBindMatrices);
                    if (!accessor) {
                        throw new Error(context + ": Failed to find inverse bind matrices attribute " + skin.inverseBindMatrices);
                    }
                    this._loadAccessorAsync("#/accessors/" + accessor.index, accessor, function (data) {
                        _this._loadBones(context, skin, data);
                    });
                }
                return skin.babylonSkeleton;
            };
            GLTFLoader.prototype._createBone = function (node, skin, parent, localMatrix, baseMatrix, index) {
                var babylonBone = new BABYLON.Bone(node.name || "bone" + node.index, skin.babylonSkeleton, parent, localMatrix, null, baseMatrix, index);
                node.babylonBones = node.babylonBones || {};
                node.babylonBones[skin.index] = babylonBone;
                node.babylonAnimationTargets = node.babylonAnimationTargets || [];
                node.babylonAnimationTargets.push(babylonBone);
                return babylonBone;
            };
            GLTFLoader.prototype._loadBones = function (context, skin, inverseBindMatrixData) {
                var babylonBones = {};
                for (var _i = 0, _a = skin.joints; _i < _a.length; _i++) {
                    var index = _a[_i];
                    var node = GLTFLoader._GetProperty(this._gltf.nodes, index);
                    if (!node) {
                        throw new Error(context + ": Failed to find joint " + index);
                    }
                    this._loadBone(node, skin, inverseBindMatrixData, babylonBones);
                }
            };
            GLTFLoader.prototype._loadBone = function (node, skin, inverseBindMatrixData, babylonBones) {
                var babylonBone = babylonBones[node.index];
                if (babylonBone) {
                    return babylonBone;
                }
                var boneIndex = skin.joints.indexOf(node.index);
                var baseMatrix = BABYLON.Matrix.Identity();
                if (inverseBindMatrixData && boneIndex !== -1) {
                    baseMatrix = BABYLON.Matrix.FromArray(inverseBindMatrixData, boneIndex * 16);
                    baseMatrix.invertToRef(baseMatrix);
                }
                var babylonParentBone = null;
                if (node.index !== skin.skeleton && node.parent && node.parent !== this._rootNode) {
                    babylonParentBone = this._loadBone(node.parent, skin, inverseBindMatrixData, babylonBones);
                    baseMatrix.multiplyToRef(babylonParentBone.getInvertedAbsoluteTransform(), baseMatrix);
                }
                babylonBone = this._createBone(node, skin, babylonParentBone, this._getNodeMatrix(node), baseMatrix, boneIndex);
                babylonBones[node.index] = babylonBone;
                return babylonBone;
            };
            GLTFLoader.prototype._getNodeMatrix = function (node) {
                return node.matrix ?
                    BABYLON.Matrix.FromArray(node.matrix) :
                    BABYLON.Matrix.Compose(node.scale ? BABYLON.Vector3.FromArray(node.scale) : BABYLON.Vector3.One(), node.rotation ? BABYLON.Quaternion.FromArray(node.rotation) : BABYLON.Quaternion.Identity(), node.translation ? BABYLON.Vector3.FromArray(node.translation) : BABYLON.Vector3.Zero());
            };
            GLTFLoader.prototype._traverseNodes = function (context, indices, action, parentNode) {
                if (parentNode === void 0) { parentNode = null; }
                for (var _i = 0, indices_1 = indices; _i < indices_1.length; _i++) {
                    var index = indices_1[_i];
                    var node = GLTFLoader._GetProperty(this._gltf.nodes, index);
                    if (!node) {
                        throw new Error(context + ": Failed to find node " + index);
                    }
                    this._traverseNode(context, node, action, parentNode);
                }
            };
            GLTFLoader.prototype._traverseNode = function (context, node, action, parentNode) {
                if (parentNode === void 0) { parentNode = null; }
                if (GLTF2.GLTFLoaderExtension.TraverseNode(this, context, node, action, parentNode)) {
                    return;
                }
                if (!action(node, parentNode)) {
                    return;
                }
                if (node.children) {
                    this._traverseNodes(context, node.children, action, node);
                }
            };
            GLTFLoader.prototype._loadAnimations = function () {
                var animations = this._gltf.animations;
                if (!animations) {
                    return;
                }
                for (var index = 0; index < animations.length; index++) {
                    var animation = animations[index];
                    this._loadAnimation("#/animations/" + index, animation);
                }
            };
            GLTFLoader.prototype._loadAnimation = function (context, animation) {
                animation.targets = [];
                for (var index = 0; index < animation.channels.length; index++) {
                    var channel = GLTFLoader._GetProperty(animation.channels, index);
                    if (!channel) {
                        throw new Error(context + ": Failed to find channel " + index);
                    }
                    var sampler = GLTFLoader._GetProperty(animation.samplers, channel.sampler);
                    if (!sampler) {
                        throw new Error(context + ": Failed to find sampler " + channel.sampler);
                    }
                    this._loadAnimationChannel(animation, context + "/channels/" + index, channel, context + "/samplers/" + channel.sampler, sampler);
                }
            };
            GLTFLoader.prototype._loadAnimationChannel = function (animation, channelContext, channel, samplerContext, sampler) {
                var targetNode = GLTFLoader._GetProperty(this._gltf.nodes, channel.target.node);
                if (!targetNode) {
                    throw new Error(channelContext + ": Failed to find target node " + channel.target.node);
                }
                var targetPath;
                var animationType;
                switch (channel.target.path) {
                    case "translation": {
                        targetPath = "position";
                        animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        break;
                    }
                    case "rotation": {
                        targetPath = "rotationQuaternion";
                        animationType = BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
                        break;
                    }
                    case "scale": {
                        targetPath = "scaling";
                        animationType = BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
                        break;
                    }
                    case "weights": {
                        targetPath = "influence";
                        animationType = BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                        break;
                    }
                    default: {
                        throw new Error(channelContext + ": Invalid target path " + channel.target.path);
                    }
                }
                var inputData;
                var outputData;
                var checkSuccess = function () {
                    if (!inputData || !outputData) {
                        return;
                    }
                    var outputBufferOffset = 0;
                    var getNextOutputValue;
                    switch (targetPath) {
                        case "position": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(outputData, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "rotationQuaternion": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Quaternion.FromArray(outputData, outputBufferOffset);
                                outputBufferOffset += 4;
                                return value;
                            };
                            break;
                        }
                        case "scaling": {
                            getNextOutputValue = function () {
                                var value = BABYLON.Vector3.FromArray(outputData, outputBufferOffset);
                                outputBufferOffset += 3;
                                return value;
                            };
                            break;
                        }
                        case "influence": {
                            getNextOutputValue = function () {
                                var numTargets = targetNode.babylonMesh.morphTargetManager.numTargets;
                                var value = new Array(numTargets);
                                for (var i = 0; i < numTargets; i++) {
                                    value[i] = outputData[outputBufferOffset++];
                                }
                                return value;
                            };
                            break;
                        }
                    }
                    var getNextKey;
                    switch (sampler.interpolation) {
                        case "LINEAR": {
                            getNextKey = function (frameIndex) { return ({
                                frame: inputData[frameIndex],
                                value: getNextOutputValue()
                            }); };
                            break;
                        }
                        case "CUBICSPLINE": {
                            getNextKey = function (frameIndex) { return ({
                                frame: inputData[frameIndex],
                                inTangent: getNextOutputValue(),
                                value: getNextOutputValue(),
                                outTangent: getNextOutputValue()
                            }); };
                            break;
                        }
                        default: {
                            throw new Error(samplerContext + ": Invalid interpolation " + sampler.interpolation);
                        }
                    }
                    ;
                    var keys = new Array(inputData.length);
                    for (var frameIndex = 0; frameIndex < inputData.length; frameIndex++) {
                        keys[frameIndex] = getNextKey(frameIndex);
                    }
                    if (targetPath === "influence") {
                        var morphTargetManager = targetNode.babylonMesh.morphTargetManager;
                        var _loop_7 = function (targetIndex) {
                            var morphTarget = morphTargetManager.getTarget(targetIndex);
                            var animationName = (animation.name || "anim" + animation.index) + "_" + targetIndex;
                            var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                            babylonAnimation.setKeys(keys.map(function (key) { return ({
                                frame: key.frame,
                                inTangent: key.inTangent ? key.inTangent[targetIndex] : undefined,
                                value: key.value[targetIndex],
                                outTangent: key.outTangent ? key.outTangent[targetIndex] : undefined
                            }); }));
                            morphTarget.animations.push(babylonAnimation);
                            animation.targets.push(morphTarget);
                        };
                        for (var targetIndex = 0; targetIndex < morphTargetManager.numTargets; targetIndex++) {
                            _loop_7(targetIndex);
                        }
                    }
                    else {
                        var animationName = animation.name || "anim" + animation.index;
                        var babylonAnimation = new BABYLON.Animation(animationName, targetPath, 1, animationType);
                        babylonAnimation.setKeys(keys);
                        if (targetNode.babylonAnimationTargets) {
                            for (var _i = 0, _a = targetNode.babylonAnimationTargets; _i < _a.length; _i++) {
                                var target = _a[_i];
                                target.animations.push(babylonAnimation.clone());
                                animation.targets.push(target);
                            }
                        }
                    }
                };
                var inputAccessor = GLTFLoader._GetProperty(this._gltf.accessors, sampler.input);
                if (!inputAccessor) {
                    throw new Error(samplerContext + ": Failed to find input accessor " + sampler.input);
                }
                this._loadAccessorAsync("#/accessors/" + inputAccessor.index, inputAccessor, function (data) {
                    inputData = data;
                    checkSuccess();
                });
                var outputAccessor = GLTFLoader._GetProperty(this._gltf.accessors, sampler.output);
                if (!outputAccessor) {
                    throw new Error(samplerContext + ": Failed to find output accessor " + sampler.output);
                }
                this._loadAccessorAsync("#/accessors/" + outputAccessor.index, outputAccessor, function (data) {
                    outputData = data;
                    checkSuccess();
                });
            };
            GLTFLoader.prototype._loadBufferAsync = function (context, buffer, onSuccess) {
                var _this = this;
                this._addPendingData(buffer);
                if (buffer.loadedData) {
                    onSuccess(buffer.loadedData);
                    this._removePendingData(buffer);
                }
                else if (buffer.loadedObservable) {
                    buffer.loadedObservable.add(function (buffer) {
                        onSuccess(buffer.loadedData);
                        _this._removePendingData(buffer);
                    });
                }
                else {
                    if (!buffer.uri) {
                        throw new Error(context + ": Uri is missing");
                    }
                    buffer.loadedObservable = new BABYLON.Observable();
                    buffer.loadedObservable.add(function (buffer) {
                        onSuccess(buffer.loadedData);
                        _this._removePendingData(buffer);
                    });
                    this._loadUriAsync(context, buffer.uri, function (data) {
                        buffer.loadedData = data;
                        buffer.loadedObservable.notifyObservers(buffer);
                        buffer.loadedObservable = undefined;
                    });
                }
            };
            GLTFLoader.prototype._loadBufferViewAsync = function (context, bufferView, onSuccess) {
                var buffer = GLTFLoader._GetProperty(this._gltf.buffers, bufferView.buffer);
                if (!buffer) {
                    throw new Error(context + ": Failed to find buffer " + bufferView.buffer);
                }
                this._loadBufferAsync("#/buffers/" + buffer.index, buffer, function (bufferData) {
                    var data;
                    try {
                        data = new Uint8Array(bufferData.buffer, bufferData.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
                    }
                    catch (e) {
                        throw new Error(context + ": " + e.message);
                    }
                    onSuccess(data);
                });
            };
            GLTFLoader.prototype._loadAccessorAsync = function (context, accessor, onSuccess) {
                var _this = this;
                if (accessor.sparse) {
                    throw new Error(context + ": Sparse accessors are not currently supported");
                }
                var bufferView = GLTFLoader._GetProperty(this._gltf.bufferViews, accessor.bufferView);
                if (!bufferView) {
                    throw new Error(context + ": Failed to find buffer view " + accessor.bufferView);
                }
                this._loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView, function (bufferViewData) {
                    var numComponents = GLTFLoader._GetNumComponents(accessor.type);
                    if (numComponents === 0) {
                        throw new Error(context + ": Invalid type " + accessor.type);
                    }
                    var data;
                    var byteOffset = accessor.byteOffset || 0;
                    var byteStride = bufferView.byteStride;
                    try {
                        switch (accessor.componentType) {
                            case GLTF2.EComponentType.BYTE: {
                                data = _this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                                break;
                            }
                            case GLTF2.EComponentType.UNSIGNED_BYTE: {
                                data = _this._buildArrayBuffer(Uint8Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                                break;
                            }
                            case GLTF2.EComponentType.SHORT: {
                                data = _this._buildArrayBuffer(Int16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                                break;
                            }
                            case GLTF2.EComponentType.UNSIGNED_SHORT: {
                                data = _this._buildArrayBuffer(Uint16Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                                break;
                            }
                            case GLTF2.EComponentType.UNSIGNED_INT: {
                                data = _this._buildArrayBuffer(Uint32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                                break;
                            }
                            case GLTF2.EComponentType.FLOAT: {
                                data = _this._buildArrayBuffer(Float32Array, bufferViewData, byteOffset, accessor.count, numComponents, byteStride);
                                break;
                            }
                            default: {
                                throw new Error(context + ": Invalid component type " + accessor.componentType);
                            }
                        }
                    }
                    catch (e) {
                        throw new Error(context + ": " + e);
                    }
                    onSuccess(data);
                });
            };
            GLTFLoader.prototype._buildArrayBuffer = function (typedArray, data, byteOffset, count, numComponents, byteStride) {
                byteOffset += data.byteOffset;
                var targetLength = count * numComponents;
                if (byteStride == null || byteStride === numComponents * typedArray.BYTES_PER_ELEMENT) {
                    return new typedArray(data.buffer, byteOffset, targetLength);
                }
                var elementStride = byteStride / typedArray.BYTES_PER_ELEMENT;
                var sourceBuffer = new typedArray(data.buffer, byteOffset, elementStride * count);
                var targetBuffer = new typedArray(targetLength);
                var sourceIndex = 0;
                var targetIndex = 0;
                while (targetIndex < targetLength) {
                    for (var componentIndex = 0; componentIndex < numComponents; componentIndex++) {
                        targetBuffer[targetIndex] = sourceBuffer[sourceIndex + componentIndex];
                        targetIndex++;
                    }
                    sourceIndex += elementStride;
                }
                return targetBuffer;
            };
            GLTFLoader.prototype._addPendingData = function (data) {
                if (!this._renderReady) {
                    this._renderPendingCount++;
                }
                this._addLoaderPendingData(data);
            };
            GLTFLoader.prototype._removePendingData = function (data) {
                var _this = this;
                if (!this._renderReady) {
                    if (--this._renderPendingCount === 0) {
                        this._addLoaderPendingData(this);
                        this._compileMaterialsAsync(function () {
                            _this._compileShadowGeneratorsAsync(function () {
                                _this._removeLoaderPendingData(_this);
                                _this._renderReady = true;
                                _this._onRenderReady();
                            });
                        });
                    }
                }
                this._removeLoaderPendingData(data);
            };
            GLTFLoader.prototype._addLoaderPendingData = function (data) {
                this._loaderPendingCount++;
                for (var _i = 0, _a = this._loaderTrackers; _i < _a.length; _i++) {
                    var tracker = _a[_i];
                    tracker._addPendingData(data);
                }
            };
            GLTFLoader.prototype._removeLoaderPendingData = function (data) {
                for (var _i = 0, _a = this._loaderTrackers; _i < _a.length; _i++) {
                    var tracker = _a[_i];
                    tracker._removePendingData(data);
                }
                if (--this._loaderPendingCount === 0) {
                    this._onComplete();
                }
            };
            GLTFLoader.prototype._whenAction = function (action, onComplete) {
                var _this = this;
                var tracker = new GLTFLoaderTracker(function () {
                    _this._loaderTrackers.splice(_this._loaderTrackers.indexOf(tracker), 1);
                    onComplete();
                });
                this._loaderTrackers.push(tracker);
                this._addLoaderPendingData(tracker);
                action();
                this._removeLoaderPendingData(tracker);
            };
            GLTFLoader.prototype._getDefaultMaterial = function () {
                if (!this._defaultMaterial) {
                    var id = "__gltf_default";
                    var material = this._babylonScene.getMaterialByName(id);
                    if (!material) {
                        material = new BABYLON.PBRMaterial(id, this._babylonScene);
                        material.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                        material.metallic = 1;
                        material.roughness = 1;
                    }
                    this._defaultMaterial = material;
                }
                return this._defaultMaterial;
            };
            GLTFLoader.prototype._loadMaterialMetallicRoughnessProperties = function (context, material) {
                var babylonMaterial = material.babylonMaterial;
                // Ensure metallic workflow
                babylonMaterial.metallic = 1;
                babylonMaterial.roughness = 1;
                var properties = material.pbrMetallicRoughness;
                if (!properties) {
                    return;
                }
                babylonMaterial.albedoColor = properties.baseColorFactor ? BABYLON.Color3.FromArray(properties.baseColorFactor) : new BABYLON.Color3(1, 1, 1);
                babylonMaterial.metallic = properties.metallicFactor == null ? 1 : properties.metallicFactor;
                babylonMaterial.roughness = properties.roughnessFactor == null ? 1 : properties.roughnessFactor;
                if (properties.baseColorTexture) {
                    var texture = GLTFLoader._GetProperty(this._gltf.textures, properties.baseColorTexture.index);
                    if (!texture) {
                        throw new Error(context + ": Failed to find base color texture " + properties.baseColorTexture.index);
                    }
                    babylonMaterial.albedoTexture = this._loadTexture("#/textures/" + texture.index, texture, properties.baseColorTexture.texCoord);
                }
                if (properties.metallicRoughnessTexture) {
                    var texture = GLTFLoader._GetProperty(this._gltf.textures, properties.metallicRoughnessTexture.index);
                    if (!texture) {
                        throw new Error(context + ": Failed to find metallic roughness texture " + properties.metallicRoughnessTexture.index);
                    }
                    babylonMaterial.metallicTexture = this._loadTexture("#/textures/" + texture.index, texture, properties.metallicRoughnessTexture.texCoord);
                    babylonMaterial.useMetallnessFromMetallicTextureBlue = true;
                    babylonMaterial.useRoughnessFromMetallicTextureGreen = true;
                    babylonMaterial.useRoughnessFromMetallicTextureAlpha = false;
                }
                this._loadMaterialAlphaProperties(context, material, properties.baseColorFactor);
            };
            GLTFLoader.prototype._loadMaterial = function (context, material, assign) {
                if (material.babylonMaterial) {
                    assign(material.babylonMaterial, false);
                    return;
                }
                if (GLTF2.GLTFLoaderExtension.LoadMaterial(this, context, material, assign)) {
                    return;
                }
                this._createPbrMaterial(material);
                this._loadMaterialBaseProperties(context, material);
                this._loadMaterialMetallicRoughnessProperties(context, material);
                assign(material.babylonMaterial, true);
            };
            GLTFLoader.prototype._createPbrMaterial = function (material) {
                var babylonMaterial = new BABYLON.PBRMaterial(material.name || "mat" + material.index, this._babylonScene);
                babylonMaterial.sideOrientation = BABYLON.Material.CounterClockWiseSideOrientation;
                material.babylonMaterial = babylonMaterial;
            };
            GLTFLoader.prototype._loadMaterialBaseProperties = function (context, material) {
                var babylonMaterial = material.babylonMaterial;
                babylonMaterial.emissiveColor = material.emissiveFactor ? BABYLON.Color3.FromArray(material.emissiveFactor) : new BABYLON.Color3(0, 0, 0);
                if (material.doubleSided) {
                    babylonMaterial.backFaceCulling = false;
                    babylonMaterial.twoSidedLighting = true;
                }
                if (material.normalTexture) {
                    var texture = GLTFLoader._GetProperty(this._gltf.textures, material.normalTexture.index);
                    if (!texture) {
                        throw new Error(context + ": Failed to find normal texture " + material.normalTexture.index);
                    }
                    babylonMaterial.bumpTexture = this._loadTexture("#/textures/" + texture.index, texture, material.normalTexture.texCoord);
                    babylonMaterial.invertNormalMapX = !this._babylonScene.useRightHandedSystem;
                    babylonMaterial.invertNormalMapY = this._babylonScene.useRightHandedSystem;
                    if (material.normalTexture.scale != null) {
                        babylonMaterial.bumpTexture.level = material.normalTexture.scale;
                    }
                }
                if (material.occlusionTexture) {
                    var texture = GLTFLoader._GetProperty(this._gltf.textures, material.occlusionTexture.index);
                    if (!texture) {
                        throw new Error(context + ": Failed to find occlusion texture " + material.occlusionTexture.index);
                    }
                    babylonMaterial.ambientTexture = this._loadTexture("#/textures/" + texture.index, texture, material.occlusionTexture.texCoord);
                    babylonMaterial.useAmbientInGrayScale = true;
                    if (material.occlusionTexture.strength != null) {
                        babylonMaterial.ambientTextureStrength = material.occlusionTexture.strength;
                    }
                }
                if (material.emissiveTexture) {
                    var texture = GLTFLoader._GetProperty(this._gltf.textures, material.emissiveTexture.index);
                    if (!texture) {
                        throw new Error(context + ": Failed to find emissive texture " + material.emissiveTexture.index);
                    }
                    babylonMaterial.emissiveTexture = this._loadTexture("#/textures/" + texture.index, texture, material.emissiveTexture.texCoord);
                }
            };
            GLTFLoader.prototype._loadMaterialAlphaProperties = function (context, material, colorFactor) {
                var babylonMaterial = material.babylonMaterial;
                var alphaMode = material.alphaMode || "OPAQUE";
                switch (alphaMode) {
                    case "OPAQUE": {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_OPAQUE;
                        break;
                    }
                    case "MASK": {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
                        babylonMaterial.alphaCutOff = (material.alphaCutoff == null ? 0.5 : material.alphaCutoff);
                        if (colorFactor) {
                            if (colorFactor[3] == 0) {
                                babylonMaterial.alphaCutOff = 1;
                            }
                            else {
                                babylonMaterial.alphaCutOff /= colorFactor[3];
                            }
                        }
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                        }
                        break;
                    }
                    case "BLEND": {
                        babylonMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
                        if (colorFactor) {
                            babylonMaterial.alpha = colorFactor[3];
                        }
                        if (babylonMaterial.albedoTexture) {
                            babylonMaterial.albedoTexture.hasAlpha = true;
                            babylonMaterial.useAlphaFromAlbedoTexture = true;
                        }
                        break;
                    }
                    default: {
                        throw new Error(context + ": Invalid alpha mode " + material.alphaMode);
                    }
                }
            };
            GLTFLoader.prototype._loadTexture = function (context, texture, coordinatesIndex) {
                var _this = this;
                var sampler = (texture.sampler == null ? {} : GLTFLoader._GetProperty(this._gltf.samplers, texture.sampler));
                if (!sampler) {
                    throw new Error(context + ": Failed to find sampler " + texture.sampler);
                }
                var noMipMaps = (sampler.minFilter === GLTF2.ETextureMinFilter.NEAREST || sampler.minFilter === GLTF2.ETextureMinFilter.LINEAR);
                var samplingMode = GLTFLoader._GetTextureSamplingMode(sampler.magFilter, sampler.minFilter);
                this._addPendingData(texture);
                var babylonTexture = new BABYLON.Texture(null, this._babylonScene, noMipMaps, false, samplingMode, function () {
                    _this._tryCatchOnError(function () {
                        _this._removePendingData(texture);
                    });
                }, function (message) {
                    _this._tryCatchOnError(function () {
                        throw new Error(context + ": " + message);
                    });
                });
                if (texture.url) {
                    babylonTexture.updateURL(texture.url);
                }
                else if (texture.dataReadyObservable) {
                    texture.dataReadyObservable.add(function (texture) {
                        babylonTexture.updateURL(texture.url);
                    });
                }
                else {
                    texture.dataReadyObservable = new BABYLON.Observable();
                    texture.dataReadyObservable.add(function (texture) {
                        babylonTexture.updateURL(texture.url);
                    });
                    var image_1 = GLTFLoader._GetProperty(this._gltf.images, texture.source);
                    if (!image_1) {
                        throw new Error(context + ": Failed to find source " + texture.source);
                    }
                    this._loadImageAsync("#/images/" + image_1.index, image_1, function (data) {
                        texture.url = URL.createObjectURL(new Blob([data], { type: image_1.mimeType }));
                        texture.dataReadyObservable.notifyObservers(texture);
                        texture.dataReadyObservable = undefined;
                    });
                }
                babylonTexture.coordinatesIndex = coordinatesIndex || 0;
                babylonTexture.wrapU = GLTFLoader._GetTextureWrapMode(sampler.wrapS);
                babylonTexture.wrapV = GLTFLoader._GetTextureWrapMode(sampler.wrapT);
                babylonTexture.name = texture.name || "texture" + texture.index;
                if (this._parent.onTextureLoaded) {
                    this._parent.onTextureLoaded(babylonTexture);
                }
                return babylonTexture;
            };
            GLTFLoader.prototype._loadImageAsync = function (context, image, onSuccess) {
                if (image.uri) {
                    this._loadUriAsync(context, image.uri, onSuccess);
                }
                else {
                    var bufferView = GLTFLoader._GetProperty(this._gltf.bufferViews, image.bufferView);
                    if (!bufferView) {
                        throw new Error(context + ": Failed to find buffer view " + image.bufferView);
                    }
                    this._loadBufferViewAsync("#/bufferViews/" + bufferView.index, bufferView, onSuccess);
                }
            };
            GLTFLoader.prototype._loadUriAsync = function (context, uri, onSuccess) {
                var _this = this;
                if (GLTF2.GLTFUtils.IsBase64(uri)) {
                    onSuccess(new Uint8Array(GLTF2.GLTFUtils.DecodeBase64(uri)));
                    return;
                }
                if (!GLTF2.GLTFUtils.ValidateUri(uri)) {
                    throw new Error(context + ": Uri '" + uri + "' is invalid");
                }
                var request = BABYLON.Tools.LoadFile(this._rootUrl + uri, function (data) {
                    _this._tryCatchOnError(function () {
                        onSuccess(new Uint8Array(data));
                    });
                }, function (event) {
                    _this._tryCatchOnError(function () {
                        if (request && !_this._renderReady) {
                            request._loaded = event.loaded;
                            request._total = event.total;
                            _this._onProgress();
                        }
                    });
                }, this._babylonScene.database, true, function (request) {
                    _this._tryCatchOnError(function () {
                        throw new Error(context + ": Failed to load '" + uri + "'" + (request ? ": " + request.status + " " + request.statusText : ""));
                    });
                });
                if (request) {
                    request._loaded = null;
                    request._total = null;
                    this._requests.push(request);
                }
            };
            GLTFLoader.prototype._tryCatchOnError = function (handler) {
                if (this._disposed) {
                    return;
                }
                try {
                    handler();
                }
                catch (e) {
                    BABYLON.Tools.Error("glTF Loader: " + e.message);
                    if (this._errorCallback) {
                        this._errorCallback(e.message);
                    }
                    this.dispose();
                }
            };
            GLTFLoader._AssignIndices = function (array) {
                if (array) {
                    for (var index = 0; index < array.length; index++) {
                        array[index].index = index;
                    }
                }
            };
            GLTFLoader._GetProperty = function (array, index) {
                if (!array || index == undefined || !array[index]) {
                    return null;
                }
                return array[index];
            };
            GLTFLoader._GetTextureWrapMode = function (mode) {
                // Set defaults if undefined
                mode = mode == undefined ? GLTF2.ETextureWrapMode.REPEAT : mode;
                switch (mode) {
                    case GLTF2.ETextureWrapMode.CLAMP_TO_EDGE: return BABYLON.Texture.CLAMP_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.MIRRORED_REPEAT: return BABYLON.Texture.MIRROR_ADDRESSMODE;
                    case GLTF2.ETextureWrapMode.REPEAT: return BABYLON.Texture.WRAP_ADDRESSMODE;
                    default:
                        BABYLON.Tools.Warn("Invalid texture wrap mode (" + mode + ")");
                        return BABYLON.Texture.WRAP_ADDRESSMODE;
                }
            };
            GLTFLoader._GetTextureSamplingMode = function (magFilter, minFilter) {
                // Set defaults if undefined
                magFilter = magFilter == undefined ? GLTF2.ETextureMagFilter.LINEAR : magFilter;
                minFilter = minFilter == undefined ? GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR : minFilter;
                if (magFilter === GLTF2.ETextureMagFilter.LINEAR) {
                    switch (minFilter) {
                        case GLTF2.ETextureMinFilter.NEAREST: return BABYLON.Texture.LINEAR_NEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR: return BABYLON.Texture.LINEAR_LINEAR;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.LINEAR_NEAREST_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return BABYLON.Texture.LINEAR_LINEAR_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return BABYLON.Texture.LINEAR_NEAREST_MIPLINEAR;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.LINEAR_LINEAR_MIPLINEAR;
                    }
                }
                else {
                    if (magFilter !== GLTF2.ETextureMagFilter.NEAREST) {
                        BABYLON.Tools.Warn("Invalid texture magnification filter (" + magFilter + ")");
                    }
                    switch (minFilter) {
                        case GLTF2.ETextureMinFilter.NEAREST: return BABYLON.Texture.NEAREST_NEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR: return BABYLON.Texture.NEAREST_LINEAR;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_NEAREST: return BABYLON.Texture.NEAREST_LINEAR_MIPNEAREST;
                        case GLTF2.ETextureMinFilter.NEAREST_MIPMAP_LINEAR: return BABYLON.Texture.NEAREST_NEAREST_MIPLINEAR;
                        case GLTF2.ETextureMinFilter.LINEAR_MIPMAP_LINEAR: return BABYLON.Texture.NEAREST_LINEAR_MIPLINEAR;
                        default:
                            BABYLON.Tools.Warn("Invalid texture minification filter (" + minFilter + ")");
                            return BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST;
                    }
                }
            };
            GLTFLoader._GetNumComponents = function (type) {
                switch (type) {
                    case "SCALAR": return 1;
                    case "VEC2": return 2;
                    case "VEC3": return 3;
                    case "VEC4": return 4;
                    case "MAT2": return 4;
                    case "MAT3": return 9;
                    case "MAT4": return 16;
                }
                return 0;
            };
            GLTFLoader.prototype._compileMaterialAsync = function (babylonMaterial, babylonMesh, onSuccess) {
                var _this = this;
                if (!this._parent.compileMaterials) {
                    onSuccess();
                    return;
                }
                if (this._parent.useClipPlane) {
                    babylonMaterial.forceCompilation(babylonMesh, function () {
                        babylonMaterial.forceCompilation(babylonMesh, function () {
                            _this._tryCatchOnError(onSuccess);
                        }, { clipPlane: true });
                    });
                }
                else {
                    babylonMaterial.forceCompilation(babylonMesh, function () {
                        _this._tryCatchOnError(onSuccess);
                    });
                }
            };
            GLTFLoader.prototype._compileMaterialsAsync = function (onSuccess) {
                if (!this._parent.compileMaterials || !this._gltf.materials) {
                    onSuccess();
                    return;
                }
                var meshes = this._getMeshes();
                var remaining = 0;
                for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                    var mesh = meshes_1[_i];
                    if (mesh.material instanceof BABYLON.MultiMaterial) {
                        for (var _a = 0, _b = mesh.material.subMaterials; _a < _b.length; _a++) {
                            var subMaterial = _b[_a];
                            if (subMaterial) {
                                remaining++;
                            }
                        }
                    }
                }
                if (remaining === 0) {
                    onSuccess();
                    return;
                }
                for (var _c = 0, meshes_2 = meshes; _c < meshes_2.length; _c++) {
                    var mesh = meshes_2[_c];
                    if (mesh.material instanceof BABYLON.MultiMaterial) {
                        for (var _d = 0, _e = mesh.material.subMaterials; _d < _e.length; _d++) {
                            var subMaterial = _e[_d];
                            if (subMaterial) {
                                this._compileMaterialAsync(subMaterial, mesh, function () {
                                    if (--remaining === 0) {
                                        onSuccess();
                                    }
                                });
                            }
                        }
                    }
                }
            };
            GLTFLoader.prototype._compileShadowGeneratorsAsync = function (onSuccess) {
                var _this = this;
                if (!this._parent.compileShadowGenerators) {
                    onSuccess();
                    return;
                }
                var lights = this._babylonScene.lights;
                var remaining = 0;
                for (var _i = 0, lights_1 = lights; _i < lights_1.length; _i++) {
                    var light = lights_1[_i];
                    var generator = light.getShadowGenerator();
                    if (generator) {
                        remaining++;
                    }
                }
                if (remaining === 0) {
                    onSuccess();
                    return;
                }
                for (var _a = 0, lights_2 = lights; _a < lights_2.length; _a++) {
                    var light = lights_2[_a];
                    var generator = light.getShadowGenerator();
                    if (generator) {
                        generator.forceCompilation(function () {
                            if (--remaining === 0) {
                                _this._tryCatchOnError(onSuccess);
                            }
                        });
                    }
                }
            };
            GLTFLoader.Extensions = {};
            return GLTFLoader;
        }());
        GLTF2.GLTFLoader = GLTFLoader;
        BABYLON.GLTFFileLoader.CreateGLTFLoaderV2 = function (parent) { return new GLTFLoader(parent); };
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoader.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Utils functions for GLTF
        */
        var GLTFUtils = /** @class */ (function () {
            function GLTFUtils() {
            }
            /**
            * If the uri is a base64 string
            * @param uri: the uri to test
            */
            GLTFUtils.IsBase64 = function (uri) {
                return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
            };
            /**
            * Decode the base64 uri
            * @param uri: the uri to decode
            */
            GLTFUtils.DecodeBase64 = function (uri) {
                var decodedString = atob(uri.split(",")[1]);
                var bufferLength = decodedString.length;
                var bufferView = new Uint8Array(new ArrayBuffer(bufferLength));
                for (var i = 0; i < bufferLength; i++) {
                    bufferView[i] = decodedString.charCodeAt(i);
                }
                return bufferView.buffer;
            };
            GLTFUtils.ValidateUri = function (uri) {
                return (uri.indexOf("..") === -1);
            };
            return GLTFUtils;
        }());
        GLTF2.GLTFUtils = GLTFUtils;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderUtils.js.map

/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        var GLTFLoaderExtension = /** @class */ (function () {
            function GLTFLoaderExtension() {
                this.enabled = true;
            }
            GLTFLoaderExtension.prototype._traverseNode = function (loader, context, node, action, parentNode) { return false; };
            GLTFLoaderExtension.prototype._loadNode = function (loader, context, node) { return false; };
            GLTFLoaderExtension.prototype._loadMaterial = function (loader, context, material, assign) { return false; };
            GLTFLoaderExtension.prototype._loadExtension = function (context, property, action) {
                var _this = this;
                if (!property.extensions) {
                    return false;
                }
                var extension = property.extensions[this.name];
                if (!extension) {
                    return false;
                }
                // Clear out the extension before executing the action to avoid recursing into the same property.
                property.extensions[this.name] = undefined;
                action(context + "extensions/" + this.name, extension, function () {
                    // Restore the extension after completing the action.
                    property.extensions[_this.name] = extension;
                });
                return true;
            };
            GLTFLoaderExtension.TraverseNode = function (loader, context, node, action, parentNode) {
                return this._ApplyExtensions(function (extension) { return extension._traverseNode(loader, context, node, action, parentNode); });
            };
            GLTFLoaderExtension.LoadNode = function (loader, context, node) {
                return this._ApplyExtensions(function (extension) { return extension._loadNode(loader, context, node); });
            };
            GLTFLoaderExtension.LoadMaterial = function (loader, context, material, assign) {
                return this._ApplyExtensions(function (extension) { return extension._loadMaterial(loader, context, material, assign); });
            };
            GLTFLoaderExtension._ApplyExtensions = function (action) {
                var extensions = GLTFLoaderExtension._Extensions;
                if (!extensions) {
                    return false;
                }
                for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
                    var extension = extensions_1[_i];
                    if (extension.enabled && action(extension)) {
                        return true;
                    }
                }
                return false;
            };
            //
            // Utilities
            //
            GLTFLoaderExtension._Extensions = [];
            return GLTFLoaderExtension;
        }());
        GLTF2.GLTFLoaderExtension = GLTFLoaderExtension;
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderExtension.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
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
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            // See https://github.com/sbtron/glTF/tree/MSFT_lod/extensions/Vendor/MSFT_lod for more information about this extension.
            var MSFTLOD = /** @class */ (function (_super) {
                __extends(MSFTLOD, _super);
                function MSFTLOD() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    /**
                     * Specify the minimal delay between LODs in ms (default = 250)
                     */
                    _this.Delay = 250;
                    return _this;
                }
                Object.defineProperty(MSFTLOD.prototype, "name", {
                    get: function () {
                        return "MSFT_lod";
                    },
                    enumerable: true,
                    configurable: true
                });
                MSFTLOD.prototype._traverseNode = function (loader, context, node, action, parentNode) {
                    return this._loadExtension(context, node, function (context, extension, onComplete) {
                        for (var i = extension.ids.length - 1; i >= 0; i--) {
                            var lodNode = GLTF2.GLTFLoader._GetProperty(loader._gltf.nodes, extension.ids[i]);
                            if (!lodNode) {
                                throw new Error(context + ": Failed to find node " + extension.ids[i]);
                            }
                            loader._traverseNode(context, lodNode, action, parentNode);
                        }
                        loader._traverseNode(context, node, action, parentNode);
                        onComplete();
                    });
                };
                MSFTLOD.prototype._loadNode = function (loader, context, node) {
                    var _this = this;
                    return this._loadExtension(context, node, function (context, extension, onComplete) {
                        var nodes = [node];
                        for (var _i = 0, _a = extension.ids; _i < _a.length; _i++) {
                            var index = _a[_i];
                            var lodNode = GLTF2.GLTFLoader._GetProperty(loader._gltf.nodes, index);
                            if (!lodNode) {
                                throw new Error(context + ": Failed to find node " + index);
                            }
                            nodes.push(lodNode);
                        }
                        loader._addLoaderPendingData(node);
                        _this._loadNodeLOD(loader, context, nodes, nodes.length - 1, function () {
                            loader._removeLoaderPendingData(node);
                            onComplete();
                        });
                    });
                };
                MSFTLOD.prototype._loadNodeLOD = function (loader, context, nodes, index, onComplete) {
                    var _this = this;
                    loader._whenAction(function () {
                        loader._loadNode(context, nodes[index]);
                    }, function () {
                        if (index !== nodes.length - 1) {
                            var previousNode = nodes[index + 1];
                            previousNode.babylonMesh.setEnabled(false);
                        }
                        if (index === 0) {
                            onComplete();
                            return;
                        }
                        setTimeout(function () {
                            loader._tryCatchOnError(function () {
                                _this._loadNodeLOD(loader, context, nodes, index - 1, onComplete);
                            });
                        }, _this.Delay);
                    });
                };
                MSFTLOD.prototype._loadMaterial = function (loader, context, material, assign) {
                    var _this = this;
                    return this._loadExtension(context, material, function (context, extension, onComplete) {
                        var materials = [material];
                        for (var _i = 0, _a = extension.ids; _i < _a.length; _i++) {
                            var index = _a[_i];
                            var lodMaterial = GLTF2.GLTFLoader._GetProperty(loader._gltf.materials, index);
                            if (!lodMaterial) {
                                throw new Error(context + ": Failed to find material " + index);
                            }
                            materials.push(lodMaterial);
                        }
                        loader._addLoaderPendingData(material);
                        _this._loadMaterialLOD(loader, context, materials, materials.length - 1, assign, function () {
                            loader._removeLoaderPendingData(material);
                            onComplete();
                        });
                    });
                };
                MSFTLOD.prototype._loadMaterialLOD = function (loader, context, materials, index, assign, onComplete) {
                    var _this = this;
                    loader._loadMaterial(context, materials[index], function (babylonMaterial, isNew) {
                        if (index === materials.length - 1) {
                            assign(babylonMaterial, isNew);
                            // Load the next LOD when the loader is ready to render.
                            loader._executeWhenRenderReady(function () {
                                _this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                            });
                        }
                        else {
                            BABYLON.BaseTexture.WhenAllReady(babylonMaterial.getActiveTextures(), function () {
                                assign(babylonMaterial, isNew);
                                if (index === 0) {
                                    onComplete();
                                }
                                else {
                                    setTimeout(function () {
                                        loader._tryCatchOnError(function () {
                                            _this._loadMaterialLOD(loader, context, materials, index - 1, assign, onComplete);
                                        });
                                    }, _this.Delay);
                                }
                            });
                        }
                    });
                };
                return MSFTLOD;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.MSFTLOD = MSFTLOD;
            GLTF2.GLTFLoader.RegisterExtension(new MSFTLOD());
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=MSFT_lod.js.map

/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>
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
    var GLTF2;
    (function (GLTF2) {
        var Extensions;
        (function (Extensions) {
            var KHRMaterialsPbrSpecularGlossiness = /** @class */ (function (_super) {
                __extends(KHRMaterialsPbrSpecularGlossiness, _super);
                function KHRMaterialsPbrSpecularGlossiness() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                Object.defineProperty(KHRMaterialsPbrSpecularGlossiness.prototype, "name", {
                    get: function () {
                        return "KHR_materials_pbrSpecularGlossiness";
                    },
                    enumerable: true,
                    configurable: true
                });
                KHRMaterialsPbrSpecularGlossiness.prototype._loadMaterial = function (loader, context, material, assign) {
                    var _this = this;
                    return this._loadExtension(context, material, function (context, extension, onComplete) {
                        loader._createPbrMaterial(material);
                        loader._loadMaterialBaseProperties(context, material);
                        _this._loadSpecularGlossinessProperties(loader, context, material, extension);
                        assign(material.babylonMaterial, true);
                        onComplete();
                    });
                };
                KHRMaterialsPbrSpecularGlossiness.prototype._loadSpecularGlossinessProperties = function (loader, context, material, properties) {
                    var babylonMaterial = material.babylonMaterial;
                    babylonMaterial.albedoColor = properties.diffuseFactor ? BABYLON.Color3.FromArray(properties.diffuseFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.reflectivityColor = properties.specularFactor ? BABYLON.Color3.FromArray(properties.specularFactor) : new BABYLON.Color3(1, 1, 1);
                    babylonMaterial.microSurface = properties.glossinessFactor == null ? 1 : properties.glossinessFactor;
                    if (properties.diffuseTexture) {
                        var texture = GLTF2.GLTFLoader._GetProperty(loader._gltf.textures, properties.diffuseTexture.index);
                        if (!texture) {
                            throw new Error(context + ": Failed to find diffuse texture " + properties.diffuseTexture.index);
                        }
                        babylonMaterial.albedoTexture = loader._loadTexture("textures[" + texture.index + "]", texture, properties.diffuseTexture.texCoord);
                    }
                    if (properties.specularGlossinessTexture) {
                        var texture = GLTF2.GLTFLoader._GetProperty(loader._gltf.textures, properties.specularGlossinessTexture.index);
                        if (!texture) {
                            throw new Error(context + ": Failed to find diffuse texture " + properties.specularGlossinessTexture.index);
                        }
                        babylonMaterial.reflectivityTexture = loader._loadTexture("textures[" + texture.index + "]", texture, properties.specularGlossinessTexture.texCoord);
                        babylonMaterial.reflectivityTexture.hasAlpha = true;
                        babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
                    }
                    loader._loadMaterialAlphaProperties(context, material, properties.diffuseFactor);
                };
                return KHRMaterialsPbrSpecularGlossiness;
            }(GLTF2.GLTFLoaderExtension));
            Extensions.KHRMaterialsPbrSpecularGlossiness = KHRMaterialsPbrSpecularGlossiness;
            GLTF2.GLTFLoader.RegisterExtension(new KHRMaterialsPbrSpecularGlossiness());
        })(Extensions = GLTF2.Extensions || (GLTF2.Extensions = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=KHR_materials_pbrSpecularGlossiness.js.map
