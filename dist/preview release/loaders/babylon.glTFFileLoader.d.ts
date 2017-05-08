/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    interface IGLTFLoaderData {
        json: Object;
        bin: ArrayBufferView;
    }
    interface IGLTFLoader {
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onsuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onerror: () => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onsuccess: () => void, onerror: () => void) => void;
    }
    class GLTFFileLoader implements ISceneLoaderPluginAsync {
        static GLTFLoaderV1: IGLTFLoader;
        static GLTFLoaderV2: IGLTFLoader;
        static HomogeneousCoordinates: boolean;
        static IncrementalLoading: boolean;
        extensions: ISceneLoaderPluginExtensions;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError: () => void): void;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onError: () => void): void;
        private static _parse(data);
        private _getLoader(loaderData);
        private static _parseBinary(data);
        private static _parseV1(binaryReader);
        private static _parseV2(binaryReader);
        private static _parseVersion(version);
        private static _compareVersion(a, b);
        private static _decodeBufferToText(view);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF1 {
    /**
    * Enums
    */
    enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        FLOAT = 5126,
    }
    enum EShaderType {
        FRAGMENT = 35632,
        VERTEX = 35633,
    }
    enum EParameterType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        INT = 5124,
        UNSIGNED_INT = 5125,
        FLOAT = 5126,
        FLOAT_VEC2 = 35664,
        FLOAT_VEC3 = 35665,
        FLOAT_VEC4 = 35666,
        INT_VEC2 = 35667,
        INT_VEC3 = 35668,
        INT_VEC4 = 35669,
        BOOL = 35670,
        BOOL_VEC2 = 35671,
        BOOL_VEC3 = 35672,
        BOOL_VEC4 = 35673,
        FLOAT_MAT2 = 35674,
        FLOAT_MAT3 = 35675,
        FLOAT_MAT4 = 35676,
        SAMPLER_2D = 35678,
    }
    enum ETextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497,
    }
    enum ETextureFilterType {
        NEAREST = 9728,
        LINEAR = 9728,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987,
    }
    enum ETextureFormat {
        ALPHA = 6406,
        RGB = 6407,
        RGBA = 6408,
        LUMINANCE = 6409,
        LUMINANCE_ALPHA = 6410,
    }
    enum ECullingType {
        FRONT = 1028,
        BACK = 1029,
        FRONT_AND_BACK = 1032,
    }
    enum EBlendingFunction {
        ZERO = 0,
        ONE = 1,
        SRC_COLOR = 768,
        ONE_MINUS_SRC_COLOR = 769,
        DST_COLOR = 774,
        ONE_MINUS_DST_COLOR = 775,
        SRC_ALPHA = 770,
        ONE_MINUS_SRC_ALPHA = 771,
        DST_ALPHA = 772,
        ONE_MINUS_DST_ALPHA = 773,
        CONSTANT_COLOR = 32769,
        ONE_MINUS_CONSTANT_COLOR = 32770,
        CONSTANT_ALPHA = 32771,
        ONE_MINUS_CONSTANT_ALPHA = 32772,
        SRC_ALPHA_SATURATE = 776,
    }
    /**
    * Interfaces
    */
    interface IGLTFProperty {
        extensions?: Object;
        extras?: Object;
    }
    interface IGLTFChildRootProperty extends IGLTFProperty {
        name?: string;
    }
    interface IGLTFAccessor extends IGLTFChildRootProperty {
        bufferView: string;
        byteOffset: number;
        byteStride: number;
        count: number;
        type: string;
        componentType: EComponentType;
        max?: number[];
        min?: number[];
        name?: string;
    }
    interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: string;
        byteOffset: number;
        byteLength: number;
        target?: number;
    }
    interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri: string;
        byteLength?: number;
        type?: string;
    }
    interface IGLTFShader extends IGLTFChildRootProperty {
        uri: string;
        type: EShaderType;
    }
    interface IGLTFProgram extends IGLTFChildRootProperty {
        attributes: string[];
        fragmentShader: string;
        vertexShader: string;
    }
    interface IGLTFTechniqueParameter {
        type: number;
        count?: number;
        semantic?: string;
        node?: string;
        value?: number | boolean | string | Array<any>;
        source?: string;
        babylonValue?: any;
    }
    interface IGLTFTechniqueCommonProfile {
        lightingModel: string;
        texcoordBindings: Object;
        parameters?: Array<any>;
    }
    interface IGLTFTechniqueStatesFunctions {
        blendColor?: number[];
        blendEquationSeparate?: number[];
        blendFuncSeparate?: number[];
        colorMask: boolean[];
        cullFace: number[];
    }
    interface IGLTFTechniqueStates {
        enable: number[];
        functions: IGLTFTechniqueStatesFunctions;
    }
    interface IGLTFTechnique extends IGLTFChildRootProperty {
        parameters: Object;
        program: string;
        attributes: Object;
        uniforms: Object;
        states: IGLTFTechniqueStates;
    }
    interface IGLTFMaterial extends IGLTFChildRootProperty {
        technique?: string;
        values: string[];
    }
    interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: Object;
        indices: string;
        material: string;
        mode?: number;
    }
    interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
    }
    interface IGLTFImage extends IGLTFChildRootProperty {
        uri: string;
    }
    interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: number;
        minFilter?: number;
        wrapS?: number;
        wrapT?: number;
    }
    interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler: string;
        source: string;
        format?: ETextureFormat;
        internalFormat?: ETextureFormat;
        target?: number;
        type?: number;
        babylonTexture?: Texture;
    }
    interface IGLTFAmbienLight {
        color?: number[];
    }
    interface IGLTFDirectionalLight {
        color?: number[];
    }
    interface IGLTFPointLight {
        color?: number[];
        constantAttenuation?: number;
        linearAttenuation?: number;
        quadraticAttenuation?: number;
    }
    interface IGLTFSpotLight {
        color?: number[];
        constantAttenuation?: number;
        fallOfAngle?: number;
        fallOffExponent?: number;
        linearAttenuation?: number;
        quadraticAttenuation?: number;
    }
    interface IGLTFLight extends IGLTFChildRootProperty {
        type: string;
    }
    interface IGLTFCameraOrthographic {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }
    interface IGLTFCameraPerspective {
        aspectRatio: number;
        yfov: number;
        zfar: number;
        znear: number;
    }
    interface IGLTFCamera extends IGLTFChildRootProperty {
        type: string;
    }
    interface IGLTFAnimationChannelTarget {
        id: string;
        path: string;
    }
    interface IGLTFAnimationChannel {
        sampler: string;
        target: IGLTFAnimationChannelTarget;
    }
    interface IGLTFAnimationSampler {
        input: string;
        output: string;
        interpolation?: string;
    }
    interface IGLTFAnimation extends IGLTFChildRootProperty {
        channels?: IGLTFAnimationChannel[];
        parameters?: Object;
        samplers?: Object;
    }
    interface IGLTFNodeInstanceSkin {
        skeletons: string[];
        skin: string;
        meshes: string[];
    }
    interface IGLTFSkins extends IGLTFChildRootProperty {
        bindShapeMatrix: number[];
        inverseBindMatrices: string;
        jointNames: string[];
        babylonSkeleton?: Skeleton;
    }
    interface IGLTFNode extends IGLTFChildRootProperty {
        camera?: string;
        children: string[];
        skin?: string;
        jointName?: string;
        light?: string;
        matrix: number[];
        mesh?: string;
        meshes?: string[];
        rotation?: number[];
        scale?: number[];
        translation?: number[];
        babylonNode?: Node;
    }
    interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: string[];
    }
    /**
    * Runtime
    */
    interface IGLTFRuntime {
        extensions: Object;
        accessors: Object;
        buffers: Object;
        bufferViews: Object;
        meshes: Object;
        lights: Object;
        cameras: Object;
        nodes: Object;
        images: Object;
        textures: Object;
        shaders: Object;
        programs: Object;
        samplers: Object;
        techniques: Object;
        materials: Object;
        animations: Object;
        skins: Object;
        currentScene?: Object;
        scenes: Object;
        extensionsUsed: string[];
        extensionsRequired?: string[];
        buffersCount: number;
        shaderscount: number;
        scene: Scene;
        rootUrl: string;
        loadedBufferCount: number;
        loadedBufferViews: {
            [name: string]: ArrayBufferView;
        };
        loadedShaderCount: number;
        importOnlyMeshes: boolean;
        importMeshesNames?: string[];
        dummyNodes: Node[];
    }
    /**
    * Bones
    */
    interface INodeToRoot {
        bone: Bone;
        node: IGLTFNode;
        id: string;
    }
    interface IJointNode {
        node: IGLTFNode;
        id: string;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF1 {
    /**
    * Implementation of the base glTF spec
    */
    class GLTFLoaderBase {
        static CreateRuntime(parsedData: any, scene: Scene, rootUrl: string): IGLTFRuntime;
        static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void, onProgress?: () => void): void;
        static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): void;
        static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: () => void): void;
        static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: () => void): void;
        static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): void;
    }
    /**
    * glTF V1 Loader
    */
    class GLTFLoader implements IGLTFLoader {
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError?: () => void, onProgress?: () => void): boolean;
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onError: () => void): void;
        private _loadShadersAsync(gltfRuntime, onload);
        private _loadBuffersAsync(gltfRuntime, onload, onProgress?);
        private _createNodes(gltfRuntime);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF1 {
    /**
    * Utils functions for GLTF
    */
    class GLTFUtils {
        /**
         * Sets the given "parameter" matrix
         * @param scene: the {BABYLON.Scene} object
         * @param source: the source node where to pick the matrix
         * @param parameter: the GLTF technique parameter
         * @param uniformName: the name of the shader's uniform
         * @param shaderMaterial: the shader material
         */
        static SetMatrix(scene: Scene, source: Node, parameter: IGLTFTechniqueParameter, uniformName: string, shaderMaterial: ShaderMaterial | Effect): void;
        /**
         * Sets the given "parameter" matrix
         * @param shaderMaterial: the shader material
         * @param uniform: the name of the shader's uniform
         * @param value: the value of the uniform
         * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
         */
        static SetUniform(shaderMaterial: ShaderMaterial | Effect, uniform: string, value: any, type: number): boolean;
        /**
        * If the uri is a base64 string
        * @param uri: the uri to test
        */
        static IsBase64(uri: string): boolean;
        /**
        * Decode the base64 uri
        * @param uri: the uri to decode
        */
        static DecodeBase64(uri: string): ArrayBuffer;
        /**
        * Returns the wrap mode of the texture
        * @param mode: the mode value
        */
        static GetWrapMode(mode: number): number;
        /**
         * Returns the byte stride giving an accessor
         * @param accessor: the GLTF accessor objet
         */
        static GetByteStrideFromType(accessor: IGLTFAccessor): number;
        /**
         * Returns the texture filter mode giving a mode value
         * @param mode: the filter mode value
         */
        static GetTextureFilterMode(mode: number): ETextureFilterType;
        static GetBufferFromBufferView(gltfRuntime: IGLTFRuntime, bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType): ArrayBufferView;
        /**
         * Returns a buffer from its accessor
         * @param gltfRuntime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        static GetBufferFromAccessor(gltfRuntime: IGLTFRuntime, accessor: IGLTFAccessor): any;
        /**
         * Decodes a buffer view into a string
         * @param view: the buffer view
         */
        static DecodeBufferToText(view: ArrayBufferView): string;
        /**
         * Returns the default material of gltf. Related to
         * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
         * @param scene: the Babylon.js scene
         */
        static GetDefaultMaterial(scene: Scene): ShaderMaterial;
        private static _DefaultMaterial;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF1 {
    abstract class GLTFLoaderExtension {
        private _name;
        constructor(name: string);
        readonly name: string;
        /**
        * Defines an override for loading the runtime
        * Return true to stop further extensions from loading the runtime
        */
        loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): boolean;
        /**
         * Defines an onverride for creating gltf runtime
         * Return true to stop further extensions from creating the runtime
         */
        loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: () => void): boolean;
        /**
        * Defines an override for loading buffers
        * Return true to stop further extensions from loading this buffer
        */
        loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void, onProgress?: () => void): boolean;
        /**
        * Defines an override for loading texture buffers
        * Return true to stop further extensions from loading this texture data
        */
        loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean;
        /**
        * Defines an override for creating textures
        * Return true to stop further extensions from loading this texture
        */
        createTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: () => void): boolean;
        /**
        * Defines an override for loading shader strings
        * Return true to stop further extensions from loading this shader data
        */
        loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: () => void): boolean;
        /**
        * Defines an override for loading materials
        * Return true to stop further extensions from loading this material
        */
        loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): boolean;
        static LoadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): void;
        static LoadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: () => void): void;
        static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: () => void, onProgress?: () => void): void;
        static LoadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: () => void): void;
        static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: () => void): void;
        static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): void;
        private static LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
        private static CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
        private static ApplyExtensions(func, defaultFunc);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF1 {
    class GLTFBinaryExtension extends GLTFLoaderExtension {
        private _bin;
        constructor();
        loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: () => void): boolean;
        loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean;
        loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: () => void): boolean;
        loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: () => void): boolean;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF1 {
    class GLTFMaterialsCommonExtension extends GLTFLoaderExtension {
        constructor();
        loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: () => void): boolean;
        loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): boolean;
        private _loadTexture(gltfRuntime, id, material, propertyPath, onError);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    /**
    * Enums
    */
    enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        UNSIGNED_INT = 5125,
        FLOAT = 5126,
    }
    enum EMeshPrimitiveMode {
        POINTS = 0,
        LINES = 1,
        LINE_LOOP = 2,
        LINE_STRIP = 3,
        TRIANGLES = 4,
        TRIANGLE_STRIP = 5,
        TRIANGLE_FAN = 6,
    }
    enum ETextureMagFilter {
        NEAREST = 9728,
        LINEAR = 9729,
    }
    enum ETextureMinFilter {
        NEAREST = 9728,
        LINEAR = 9729,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987,
    }
    enum ETextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497,
    }
    /**
    * Interfaces
    */
    interface IGLTFProperty {
        extensions?: Object;
        extras?: any;
    }
    interface IGLTFChildRootProperty extends IGLTFProperty {
        name?: string;
    }
    interface IGLTFAccessorSparseIndices extends IGLTFProperty {
        bufferView: number;
        byteOffset?: number;
        componentType: EComponentType;
    }
    interface IGLTFAccessorSparseValues extends IGLTFProperty {
        bufferView: number;
        byteOffset?: number;
    }
    interface IGLTFAccessorSparse extends IGLTFProperty {
        count: number;
        indices: IGLTFAccessorSparseIndices;
        values: IGLTFAccessorSparseValues;
    }
    interface IGLTFAccessor extends IGLTFChildRootProperty {
        bufferView?: number;
        byteOffset?: number;
        componentType: EComponentType;
        normalized?: boolean;
        count: number;
        type: string;
        max: number[];
        min: number[];
        sparse?: IGLTFAccessorSparse;
    }
    interface IGLTFAnimationChannel extends IGLTFProperty {
        sampler: number;
        target: IGLTFAnimationChannelTarget;
    }
    interface IGLTFAnimationChannelTarget extends IGLTFProperty {
        node: number;
        path: string;
    }
    interface IGLTFAnimationSampler extends IGLTFProperty {
        input: number;
        interpolation?: string;
        output: number;
    }
    interface IGLTFAnimation extends IGLTFChildRootProperty {
        channels: IGLTFAnimationChannel[];
        samplers: IGLTFAnimationSampler[];
    }
    interface IGLTFAssetProfile extends IGLTFProperty {
        api?: string;
        version?: string;
    }
    interface IGLTFAsset extends IGLTFChildRootProperty {
        copyright?: string;
        generator?: string;
        profile?: IGLTFAssetProfile;
        version: string;
    }
    interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri?: string;
        byteLength: number;
        loadedBufferView: ArrayBufferView;
    }
    interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
        byteStride?: number;
    }
    interface IGLTFCameraOrthographic extends IGLTFProperty {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }
    interface IGLTFCameraPerspective extends IGLTFProperty {
        aspectRatio: number;
        yfov: number;
        zfar: number;
        znear: number;
    }
    interface IGLTFCamera extends IGLTFChildRootProperty {
        orthographic?: IGLTFCameraOrthographic;
        perspective?: IGLTFCameraPerspective;
        type: string;
    }
    interface IGLTFImage extends IGLTFChildRootProperty {
        uri?: string;
        mimeType?: string;
        bufferView?: number;
    }
    interface IGLTFMaterialNormalTextureInfo extends IGLTFTextureInfo {
        scale: number;
    }
    interface IGLTFMaterialOcclusionTextureInfo extends IGLTFTextureInfo {
        strength: number;
    }
    interface IGLTFMaterialPbrMetallicRoughness {
        baseColorFactor: number[];
        baseColorTexture: IGLTFTextureInfo;
        metallicFactor: number;
        roughnessFactor: number;
        metallicRoughnessTexture: IGLTFTextureInfo;
    }
    interface IGLTFMaterial extends IGLTFChildRootProperty {
        pbrMetallicRoughness?: IGLTFMaterialPbrMetallicRoughness;
        normalTexture?: IGLTFMaterialNormalTextureInfo;
        occlusionTexture?: IGLTFMaterialOcclusionTextureInfo;
        emissiveTexture?: IGLTFTextureInfo;
        emissiveFactor?: number[];
        alphaMode?: string;
        alphaCutoff: number;
        doubleSided?: boolean;
        babylonMaterial?: PBRMaterial;
    }
    interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: {
            [name: string]: number;
        };
        indices?: number;
        material?: number;
        mode?: EMeshPrimitiveMode;
        targets?: [{
            [name: string]: number;
        }];
    }
    interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
        weights?: number[];
    }
    interface IGLTFNode extends IGLTFChildRootProperty {
        camera?: number;
        children?: number[];
        skin?: number;
        matrix?: number[];
        mesh?: number;
        rotation?: number[];
        scale?: number[];
        translation?: number[];
        weights?: number[];
        babylonNode?: Node;
    }
    interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: ETextureMagFilter;
        minFilter?: ETextureMinFilter;
        wrapS?: ETextureWrapMode;
        wrapT?: ETextureWrapMode;
    }
    interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: number[];
    }
    interface IGLTFSkin extends IGLTFChildRootProperty {
        inverseBindMatrices?: number;
        skeleton?: number;
        joints: number[];
        babylonSkeleton?: Skeleton;
    }
    interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler?: number;
        source: number;
        babylonTextures: Texture[];
        blobURL: string;
    }
    interface IGLTFTextureInfo {
        index: number;
        texCoord?: number;
    }
    interface IGLTF extends IGLTFProperty {
        accessors?: IGLTFAccessor[];
        animations?: IGLTFAnimation[];
        asset: IGLTFAsset;
        buffers?: IGLTFBuffer[];
        bufferViews?: IGLTFBufferView[];
        cameras?: IGLTFCamera[];
        extensionsUsed?: string[];
        extensionsRequired?: string[];
        glExtensionsUsed?: string[];
        images?: IGLTFImage[];
        materials?: IGLTFMaterial[];
        meshes?: IGLTFMesh[];
        nodes?: IGLTFNode[];
        samplers?: IGLTFSampler[];
        scene?: number;
        scenes?: IGLTFScene[];
        skins?: IGLTFSkin[];
        textures?: IGLTFTexture[];
    }
    interface IGLTFRuntime {
        gltf: IGLTF;
        babylonScene: Scene;
        rootUrl: string;
        importOnlyMeshes: boolean;
        importMeshesNames?: string[];
        defaultMaterial?: PBRMaterial;
    }
    /**
    * Bones
    */
    interface INodeToRoot {
        bone: Bone;
        node: IGLTFNode;
        index: number;
    }
    interface IJointNode {
        node: IGLTFNode;
        index: number;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    /**
    * glTF File Loader Plugin
    */
    class GLTFLoader implements IGLTFLoader {
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        static LoadMaterial(runtime: IGLTFRuntime, index: number): IGLTFMaterial;
        static LoadMetallicRoughnessMaterialPropertiesAsync(runtime: IGLTFRuntime, material: IGLTFMaterial, onSuccess: () => void, onError: () => void): void;
        static LoadCommonMaterialPropertiesAsync(runtime: IGLTFRuntime, material: IGLTFMaterial, onSuccess: () => void, onError: () => void): void;
        static LoadAlphaProperties(runtime: IGLTFRuntime, material: IGLTFMaterial): void;
        static LoadTextureAsync(runtime: IGLTFRuntime, textureInfo: IGLTFTextureInfo, onSuccess: (babylonTexture: Texture) => void, onError: () => void): void;
        private static _createTextureAsync(runtime, texture, texCoord, url, onSuccess, onError);
        /**
        * Import meshes
        */
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess?: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onError?: () => void): void;
        /**
        * Load scene
        */
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onError: () => void): void;
        private static _loadBuffersAsync(runtime, onSuccess, onError);
        private static _loadBufferAsync(runtime, index, onSuccess, onError);
        private static _loadMaterialsAsync(runtime, onSuccess, onError);
        private static _createRuntime(scene, data, rootUrl, importOnlyMeshes);
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    /**
    * Utils functions for GLTF
    */
    class GLTFUtils {
        /**
        * If the uri is a base64 string
        * @param uri: the uri to test
        */
        static IsBase64(uri: string): boolean;
        /**
        * Decode the base64 uri
        * @param uri: the uri to decode
        */
        static DecodeBase64(uri: string): ArrayBuffer;
        /**
        * Returns the wrap mode of the texture
        * @param mode: the mode value
        */
        static GetWrapMode(mode: number): number;
        /**
         * Returns the byte stride giving an accessor
         * @param accessor: the GLTF accessor objet
         */
        static GetByteStrideFromType(accessor: IGLTFAccessor): number;
        /**
         * Returns the texture filter mode giving a mode value
         * @param mode: the filter mode value
         */
        static GetTextureFilterMode(mode: number): ETextureMinFilter;
        static GetBufferFromBufferView(runtime: IGLTFRuntime, bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType): ArrayBufferView;
        /**
         * Returns a buffer from its accessor
         * @param runtime: the GLTF runtime
         * @param accessor: the GLTF accessor
         */
        static GetBufferFromAccessor(runtime: IGLTFRuntime, accessor: IGLTFAccessor): any;
        /**
         * Decodes a buffer view into a string
         * @param view: the buffer view
         */
        static DecodeBufferToText(view: ArrayBufferView): string;
        /**
         * Returns the default material of gltf.
         * @param scene: the Babylon.js scene
         */
        static GetDefaultMaterial(runtime: IGLTFRuntime): PBRMaterial;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    abstract class GLTFLoaderExtension {
        private _name;
        constructor(name: string);
        readonly name: string;
        protected postCreateRuntime(runtime: IGLTFRuntime): void;
        protected loadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): boolean;
        static PostCreateRuntime(runtime: IGLTFRuntime): void;
        static LoadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): void;
    }
}

/// <reference path="../../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.GLTF2 {
    class GLTFMaterialsPbrSpecularGlossinessExtension extends GLTFLoaderExtension {
        constructor();
        protected loadMaterialAsync(runtime: IGLTFRuntime, index: number, onSuccess: () => void, onError: () => void): boolean;
    }
}
