module BABYLON {
    /**
    * Utils functions for GLTF
    */
    export class GLTFUtils {
        /**
         * Sets the given "parameter" matrix
         * @param scene: the {BABYLON.Scene} object
         * @param source: the source node where to pick the matrix
         * @param parameter: the GLTF technique parameter
         * @param uniformName: the name of the shader's uniform
         * @param shaderMaterial: the shader material
         */
        public static SetMatrix(scene: Scene, source: Node, parameter: IGLTFTechniqueParameter, uniformName: string, shaderMaterial: ShaderMaterial | Effect): void {
            var mat: Matrix = null;

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
                mat = Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
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
                mat = Matrix.Transpose(source.getWorldMatrix().invert());
            }
            else {
                debugger;
            }

            switch (parameter.type) {
                case EParameterType.FLOAT_MAT2: shaderMaterial.setMatrix2x2(uniformName, Matrix.GetAsMatrix2x2(mat)); break;
                case EParameterType.FLOAT_MAT3: shaderMaterial.setMatrix3x3(uniformName, Matrix.GetAsMatrix3x3(mat)); break;
                case EParameterType.FLOAT_MAT4: shaderMaterial.setMatrix(uniformName, mat); break;
                default: break;
            }
        }

        /**
         * Sets the given "parameter" matrix
         * @param shaderMaterial: the shader material
         * @param uniform: the name of the shader's uniform
         * @param value: the value of the uniform
         * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
         */
        public static SetUniform(shaderMaterial: ShaderMaterial | Effect, uniform: string, value: any, type: number): boolean {
            switch (type) {
                case EParameterType.FLOAT: shaderMaterial.setFloat(uniform, value); return true;
                case EParameterType.FLOAT_VEC2: shaderMaterial.setVector2(uniform, Vector2.FromArray(value)); return true;
                case EParameterType.FLOAT_VEC3: shaderMaterial.setVector3(uniform, Vector3.FromArray(value)); return true;
                case EParameterType.FLOAT_VEC4: shaderMaterial.setVector4(uniform, Vector4.FromArray(value)); return true;
                default: return false;
            }
        }

        /**
        * If the uri is a base64 string
        * @param uri: the uri to test
        */
        public static IsBase64(uri: string): boolean {
            return uri.length < 5 ? false : uri.substr(0, 5) === "data:";
        }

        /**
        * Returns the wrap mode of the texture
        * @param mode: the mode value
        */
        public static GetWrapMode(mode: number): number {
            switch (mode) {
                case ETextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
                case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
                case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
                default: return Texture.WRAP_ADDRESSMODE;
            }
        }

        /**
         * Loads a texture from its name
         * @param gltfRuntime: the gltf runtime
         * @param name: the name of the texture
         */
        public static LoadTexture(gltfRuntime: IGLTFRuntime, name: string): Texture {
            var texture: IGLTFTexture = gltfRuntime.textures[name];

            if (!texture || !texture.source) {
                return null;
            }

            if (texture.babylonTexture) {
                return texture.babylonTexture;
            }

            var sampler: IGLTFSampler = gltfRuntime.samplers[texture.sampler];
            var source: IGLTFImage = gltfRuntime.images[texture.source];
            var newTexture: Texture = null;

            var createMipMaps = (sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                (sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_LINEAR);

            var samplingMode = Texture.BILINEAR_SAMPLINGMODE;

            if (GLTFUtils.IsBase64(source.uri)) {
                newTexture = new Texture(source.uri, gltfRuntime.scene, !createMipMaps, true, samplingMode, null, null, source.uri, true);
            }
            else {
                newTexture = new Texture(gltfRuntime.rootUrl + source.uri, gltfRuntime.scene, !createMipMaps, true, samplingMode);
            }

            newTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
            newTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
            newTexture.name = name;

            texture.babylonTexture = newTexture;
            return newTexture;
        }

        /**
         * Returns the byte stride giving an accessor
         * @param accessor: the GLTF accessor objet
         */
        public static GetByteStrideFromType(accessor: IGLTFAccessor): number {
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
        }

        /**
         * Returns the texture filter mode giving a mode value
         * @param mode: the filter mode value
         */
        public static GetTextureFilterMode(mode: number): ETextureFilterType {
            switch (mode) {
                case ETextureFilterType.LINEAR:
                case ETextureFilterType.LINEAR_MIPMAP_NEAREST:
                case ETextureFilterType.LINEAR_MIPMAP_LINEAR: return Texture.TRILINEAR_SAMPLINGMODE;
                case ETextureFilterType.NEAREST:
                case ETextureFilterType.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_SAMPLINGMODE;
                default: return Texture.BILINEAR_SAMPLINGMODE;
            }
        }

        /**
         * Returns a buffer from its accessor
         * @param gltfRuntime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        public static GetBufferFromAccessor(gltfRuntime: IGLTFRuntime, accessor: IGLTFAccessor): any {
            var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[accessor.bufferView];
            var arrayBuffer: ArrayBuffer = gltfRuntime.arrayBuffers[bufferView.buffer];

            var byteOffset = accessor.byteOffset + bufferView.byteOffset;
            var count = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);

            switch (accessor.componentType) {
                case EComponentType.BYTE: return new Int8Array(arrayBuffer, byteOffset, count);
                case EComponentType.UNSIGNED_BYTE: return new Uint8Array(arrayBuffer, byteOffset, count);
                case EComponentType.SHORT: return new Int16Array(arrayBuffer, byteOffset, count);
                case EComponentType.UNSIGNED_SHORT: return new Uint16Array(arrayBuffer, byteOffset, count);
                default: return new Float32Array(arrayBuffer, byteOffset, count);
            }
        }
    }
}