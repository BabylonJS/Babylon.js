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
