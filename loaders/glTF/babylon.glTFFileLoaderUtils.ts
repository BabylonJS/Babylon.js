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

        public static GetBufferFromBufferView(gltfRuntime: IGLTFRuntime, bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType): any {
            var byteOffset = bufferView.byteOffset + byteOffset;

            var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
            if (byteOffset + byteLength > loadedBufferView.byteLength) {
                throw new Error("Buffer access is out of range");
            }

            var buffer = loadedBufferView.buffer;
            byteOffset += loadedBufferView.byteOffset;

            switch (componentType) {
                case EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
                case EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
                case EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
                case EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
                default: return new Float32Array(buffer, byteOffset, byteLength);
            }
        }

        /**
         * Returns a buffer from its accessor
         * @param gltfRuntime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        public static GetBufferFromAccessor(gltfRuntime: IGLTFRuntime, accessor: IGLTFAccessor): any {
            var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[accessor.bufferView];
            var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
            return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
        }

        /**
         * Decodes a buffer view into a string
         * @param view: the buffer view
         */
        public static DecodeBufferToText(view: ArrayBufferView): string {
            var result = "";
            var length = view.byteLength;

            for (var i = 0; i < length; ++i) {
                result += String.fromCharCode(view[i]);
            }

            return result;
        }

        /**
         * Loads a texture from its name
         * @param gltfRuntime: the gltf runtime
         * @param name: the name of the texture
         */
        public static LoadTextureAsync(gltfRuntime: IGLTFRuntime, texture: IGLTFTexture, onSuccess: (texture: Texture) => void, onError: () => void): void {
            if (!texture || !texture.source) {
                onError();
                return;
            }

            if (texture.babylonTexture) {
                onSuccess(texture.babylonTexture);
                return;
            }

            var sampler: IGLTFSampler = gltfRuntime.samplers[texture.sampler];
            var source: IGLTFImage = gltfRuntime.images[texture.source];
            var newTexture: Texture;

            var createMipMaps =
                (sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureFilterType.NEAREST_MIPMAP_LINEAR) ||
                (sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_NEAREST) ||
                (sampler.minFilter === ETextureFilterType.LINEAR_MIPMAP_LINEAR);

            var samplingMode = Texture.BILINEAR_SAMPLINGMODE;

            if (GLTFUtils.IsBase64(source.uri)) {
                newTexture = new Texture(source.uri, gltfRuntime.scene, !createMipMaps, true, samplingMode, () => onSuccess(newTexture), onError, source.uri, true);
            }
            else {
                newTexture = new Texture(gltfRuntime.rootUrl + source.uri, gltfRuntime.scene, !createMipMaps, true, samplingMode, () => onSuccess(newTexture), onError);
            }

            newTexture.wrapU = GLTFUtils.GetWrapMode(sampler.wrapS);
            newTexture.wrapV = GLTFUtils.GetWrapMode(sampler.wrapT);
            newTexture.name = name;

            texture.babylonTexture = newTexture;
        }

        public static LoadShaderAsync(gltfRuntime: IGLTFRuntime, shader: IGLTFShader, onSuccess: (shaderString: string) => void, onError: () => void): void {
            if (GLTFUtils.IsBase64(shader.uri)) {
                var shaderString = atob(shader.uri.split(",")[1]);
                onSuccess(shaderString);
            }
            else {
                Tools.LoadFile(gltfRuntime.rootUrl + shader.uri, onSuccess, null, null, false, onError);
            }
        }

        /**
        * Decode array buffer from base64
        */
        public static DecodeArrayBuffer(base64: string): ArrayBuffer {
            var decodedString = atob(base64);
            var bufferLength = decodedString.length;
            var arraybuffer = new Uint8Array(new ArrayBuffer(bufferLength));

            for (var i = 0; i < bufferLength; i++) {
                arraybuffer[i] = decodedString.charCodeAt(i);
            }

            return arraybuffer.buffer;
        };

        public static LoadBufferAsync(gltfRuntime: IGLTFRuntime, buffer: IGLTFBuffer, onSuccess: (bufferView: ArrayBufferView) => void, onError: () => void): void {
            if (GLTFUtils.IsBase64(buffer.uri)) {
                var decodedBuffer = GLTFUtils.DecodeArrayBuffer(buffer.uri.split(",")[1]);
                onSuccess(new Uint8Array(decodedBuffer));
            }
            else {
                Tools.LoadFile(gltfRuntime.rootUrl + buffer.uri, data => onSuccess(new Uint8Array(data)), null, null, true, onError);
            }
        }

        public static ParseObject(parsedObjects: any, runtimeProperty: string, gltfRuntime: IGLTFRuntime): void {
            for (var object in parsedObjects) {
                var parsedObject = parsedObjects[object];
                gltfRuntime[runtimeProperty][object] = parsedObject;
            }
        }

        public static ParseBuffers(parsedBuffers: any, gltfRuntime: IGLTFRuntime): void {
            for (var buf in parsedBuffers) {
                var parsedBuffer = parsedBuffers[buf];
                gltfRuntime.buffers[buf] = parsedBuffer;
                gltfRuntime.buffersCount++;
            }
        }

        public static ParseShaders(parsedShaders: any, gltfRuntime: IGLTFRuntime): void {
            for (var sha in parsedShaders) {
                var parsedShader = parsedShaders[sha];
                gltfRuntime.shaders[sha] = parsedShader;
                gltfRuntime.shaderscount++;
            }
        }

        public static CreateGlTFRuntime(parsedData: any, scene: Scene, rootUrl: string): IGLTFRuntime {
            var gltfRuntime: IGLTFRuntime = {
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
                currentScene: {},
                extensionsUsed: [],

                buffersCount: 0,
                shaderscount: 0,

                scene: scene,
                rootUrl: rootUrl,

                loadedBufferCount: 0,
                loadedBufferViews: {},

                loadedShaderCount: 0,

                importOnlyMeshes: false,

                dummyNodes: []
            }

            // Parse
            if (parsedData.extensionsUsed) {
                GLTFUtils.ParseObject(parsedData.extensionsUsed, "extensionsUsed", gltfRuntime);
            }

            if (parsedData.buffers) {
                GLTFUtils.ParseBuffers(parsedData.buffers, gltfRuntime);
            }

            if (parsedData.bufferViews) {
                GLTFUtils.ParseObject(parsedData.bufferViews, "bufferViews", gltfRuntime);
            }

            if (parsedData.accessors) {
                GLTFUtils.ParseObject(parsedData.accessors, "accessors", gltfRuntime);
            }

            if (parsedData.meshes) {
                GLTFUtils.ParseObject(parsedData.meshes, "meshes", gltfRuntime);
            }

            if (parsedData.lights) {
                GLTFUtils.ParseObject(parsedData.lights, "lights", gltfRuntime);
            }

            if (parsedData.cameras) {
                GLTFUtils.ParseObject(parsedData.cameras, "cameras", gltfRuntime);
            }

            if (parsedData.nodes) {
                GLTFUtils.ParseObject(parsedData.nodes, "nodes", gltfRuntime);
            }

            if (parsedData.images) {
                GLTFUtils.ParseObject(parsedData.images, "images", gltfRuntime);
            }

            if (parsedData.textures) {
                GLTFUtils.ParseObject(parsedData.textures, "textures", gltfRuntime);
            }

            if (parsedData.shaders) {
                GLTFUtils.ParseShaders(parsedData.shaders, gltfRuntime);
            }

            if (parsedData.programs) {
                GLTFUtils.ParseObject(parsedData.programs, "programs", gltfRuntime);
            }

            if (parsedData.samplers) {
                GLTFUtils.ParseObject(parsedData.samplers, "samplers", gltfRuntime);
            }

            if (parsedData.techniques) {
                GLTFUtils.ParseObject(parsedData.techniques, "techniques", gltfRuntime);
            }

            if (parsedData.materials) {
                GLTFUtils.ParseObject(parsedData.materials, "materials", gltfRuntime);
            }

            if (parsedData.animations) {
                GLTFUtils.ParseObject(parsedData.animations, "animations", gltfRuntime);
            }

            if (parsedData.skins) {
                GLTFUtils.ParseObject(parsedData.skins, "skins", gltfRuntime);
            }

            if (parsedData.scene && parsedData.scenes) {
                gltfRuntime.currentScene = parsedData.scenes[parsedData.scene];
            }

            return gltfRuntime;
        }
    }
}