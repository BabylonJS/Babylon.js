
declare module BABYLON {
    enum GLTFLoaderCoordinateSystemMode {
        AUTO = 0,
        PASS_THROUGH = 1,
        FORCE_RIGHT_HANDED = 2,
    }
    interface IGLTFLoaderData {
        json: Object;
        bin: ArrayBufferView;
    }
    interface IGLTFLoader extends IDisposable {
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void) => void;
    }
    class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync {
        static CreateGLTFLoaderV1: (parent: GLTFFileLoader) => IGLTFLoader;
        static CreateGLTFLoaderV2: (parent: GLTFFileLoader) => IGLTFLoader;
        onParsed: (data: IGLTFLoaderData) => void;
        static HomogeneousCoordinates: boolean;
        static IncrementalLoading: boolean;
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        onTextureLoaded: (texture: BaseTexture) => void;
        onMaterialLoaded: (material: Material) => void;
        /**
         * Let the user decides if he needs to process the material (like precompilation) before affecting it to meshes
         */
        onBeforeMaterialReadyAsync: (material: Material, targetMesh: AbstractMesh, isLOD: boolean, callback: () => void) => void;
        /**
         * Raised when the asset is completely loaded, just before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete just after onSuccess.
         */
        onComplete: () => void;
        private _loader;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        canDirectLoad(data: string): boolean;
        private static _parse(data, onError);
        private _getLoader(loaderData, onError);
        private static _parseBinary(data, onError);
        private static _parseV1(binaryReader, onError);
        private static _parseV2(binaryReader, onError);
        private static _parseVersion(version);
        private static _compareVersion(a, b);
        private static _decodeBufferToText(buffer);
    }
}


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
        extensions?: {
            [key: string]: any;
        };
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
        byteStride: number;
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
        parameters: {
            [key: string]: IGLTFTechniqueParameter;
        };
        program: string;
        attributes: {
            [key: string]: string;
        };
        uniforms: {
            [key: string]: string;
        };
        states: IGLTFTechniqueStates;
    }
    interface IGLTFMaterial extends IGLTFChildRootProperty {
        technique?: string;
        values: string[];
    }
    interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: {
            [key: string]: string;
        };
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
        parameters?: {
            [key: string]: string;
        };
        samplers?: {
            [key: string]: IGLTFAnimationSampler;
        };
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
        extensions: {
            [key: string]: any;
        };
        accessors: {
            [key: string]: IGLTFAccessor;
        };
        buffers: {
            [key: string]: IGLTFBuffer;
        };
        bufferViews: {
            [key: string]: IGLTFBufferView;
        };
        meshes: {
            [key: string]: IGLTFMesh;
        };
        lights: {
            [key: string]: IGLTFLight;
        };
        cameras: {
            [key: string]: IGLTFCamera;
        };
        nodes: {
            [key: string]: IGLTFNode;
        };
        images: {
            [key: string]: IGLTFImage;
        };
        textures: {
            [key: string]: IGLTFTexture;
        };
        shaders: {
            [key: string]: IGLTFShader;
        };
        programs: {
            [key: string]: IGLTFProgram;
        };
        samplers: {
            [key: string]: IGLTFSampler;
        };
        techniques: {
            [key: string]: IGLTFTechnique;
        };
        materials: {
            [key: string]: IGLTFMaterial;
        };
        animations: {
            [key: string]: IGLTFAnimation;
        };
        skins: {
            [key: string]: IGLTFSkins;
        };
        currentScene?: Object;
        scenes: {
            [key: string]: IGLTFScene;
        };
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


declare module BABYLON.GLTF1 {
    /**
    * Implementation of the base glTF spec
    */
    class GLTFLoaderBase {
        static CreateRuntime(parsedData: any, scene: Scene, rootUrl: string): IGLTFRuntime;
        static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): void;
        static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): void;
        static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void;
        static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: (message: string) => void): void;
        static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): void;
    }
    /**
    * glTF V1 Loader
    */
    class GLTFLoader implements IGLTFLoader {
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): boolean;
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        private _loadShadersAsync(gltfRuntime, onload);
        private _loadBuffersAsync(gltfRuntime, onLoad, onProgress?);
        private _createNodes(gltfRuntime);
    }
}


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


declare module BABYLON.GLTF1 {
    abstract class GLTFLoaderExtension {
        private _name;
        constructor(name: string);
        readonly name: string;
        /**
        * Defines an override for loading the runtime
        * Return true to stop further extensions from loading the runtime
        */
        loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: (message: string) => void): boolean;
        /**
         * Defines an onverride for creating gltf runtime
         * Return true to stop further extensions from creating the runtime
         */
        loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: (message: string) => void): boolean;
        /**
        * Defines an override for loading buffers
        * Return true to stop further extensions from loading this buffer
        */
        loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): boolean;
        /**
        * Defines an override for loading texture buffers
        * Return true to stop further extensions from loading this texture data
        */
        loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean;
        /**
        * Defines an override for creating textures
        * Return true to stop further extensions from loading this texture
        */
        createTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: ArrayBufferView, onSuccess: (texture: Texture) => void, onError: (message: string) => void): boolean;
        /**
        * Defines an override for loading shader strings
        * Return true to stop further extensions from loading this shader data
        */
        loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: (message: string) => void): boolean;
        /**
        * Defines an override for loading materials
        * Return true to stop further extensions from loading this material
        */
        loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): boolean;
        static LoadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: (message: string) => void): void;
        static LoadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: (message: string) => void): void;
        static LoadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (bufferView: ArrayBufferView) => void, onError: (message: string) => void, onProgress?: () => void): void;
        static LoadTextureAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void;
        static LoadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderData: string) => void, onError: (message: string) => void): void;
        static LoadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): void;
        private static LoadTextureBufferAsync(gltfRuntime, id, onSuccess, onError);
        private static CreateTextureAsync(gltfRuntime, id, buffer, onSuccess, onError);
        private static ApplyExtensions(func, defaultFunc);
    }
}


declare module BABYLON.GLTF1 {
    class GLTFBinaryExtension extends GLTFLoaderExtension {
        private _bin;
        constructor();
        loadRuntimeAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (gltfRuntime: IGLTFRuntime) => void, onError: (message: string) => void): boolean;
        loadBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean;
        loadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: ArrayBufferView) => void, onError: (message: string) => void): boolean;
        loadShaderStringAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (shaderString: string) => void, onError: (message: string) => void): boolean;
    }
}


declare module BABYLON.GLTF1 {
    class GLTFMaterialsCommonExtension extends GLTFLoaderExtension {
        constructor();
        loadRuntimeExtensionsAsync(gltfRuntime: IGLTFRuntime, onSuccess: () => void, onError: (message: string) => void): boolean;
        loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: (message: string) => void): boolean;
        private _loadTexture(gltfRuntime, id, material, propertyPath, onError);
    }
}


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
        extensions?: {
            [key: string]: any;
        };
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
        index?: number;
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
        index?: number;
        targets?: any[];
    }
    interface IGLTFAsset extends IGLTFChildRootProperty {
        copyright?: string;
        generator?: string;
        version: string;
        minVersion?: string;
    }
    interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri?: string;
        byteLength: number;
        index?: number;
        loadedData?: ArrayBufferView;
        loadedObservable?: Observable<IGLTFBuffer>;
    }
    interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: number;
        byteOffset?: number;
        byteLength: number;
        byteStride?: number;
        index?: number;
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
        index?: number;
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
        index?: number;
        babylonMaterial?: Material;
    }
    interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: {
            [name: string]: number;
        };
        indices?: number;
        material?: number;
        mode?: EMeshPrimitiveMode;
        targets?: {
            [name: string]: number;
        }[];
        vertexData: VertexData;
        targetsVertexData: VertexData[];
    }
    interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
        weights?: number[];
        index?: number;
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
        index?: number;
        parent?: IGLTFNode;
        babylonMesh?: Mesh;
        babylonBones?: {
            [skin: number]: Bone;
        };
        babylonAnimationTargets?: Node[];
    }
    interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: ETextureMagFilter;
        minFilter?: ETextureMinFilter;
        wrapS?: ETextureWrapMode;
        wrapT?: ETextureWrapMode;
    }
    interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: number[];
        index?: number;
    }
    interface IGLTFSkin extends IGLTFChildRootProperty {
        inverseBindMatrices?: number;
        skeleton?: number;
        joints: number[];
        index?: number;
        babylonSkeleton?: Skeleton;
    }
    interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler?: number;
        source: number;
        index?: number;
        url?: string;
        dataReadyObservable?: Observable<IGLTFTexture>;
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
}


declare module BABYLON.GLTF2 {
    class GLTFLoader implements IGLTFLoader {
        _gltf: IGLTF;
        _babylonScene: Scene;
        private _disposed;
        private _parent;
        private _rootUrl;
        private _defaultMaterial;
        private _rootNode;
        private _successCallback;
        private _progressCallback;
        private _errorCallback;
        private _renderReady;
        private _requests;
        private _renderReadyObservable;
        private _renderPendingCount;
        private _loaderPendingCount;
        private _loaderTrackers;
        static Extensions: {
            [name: string]: GLTFLoaderExtension;
        };
        static RegisterExtension(extension: GLTFLoaderExtension): void;
        constructor(parent: GLTFFileLoader);
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: (meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]) => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onSuccess: () => void, onProgress: (event: ProgressEvent) => void, onError: (message: string) => void): void;
        private _loadAsync(nodeNames, scene, data, rootUrl, onSuccess, onProgress, onError);
        private _onError(message);
        private _onProgress(event);
        _executeWhenRenderReady(func: () => void): void;
        private _onRenderReady();
        private _onComplete();
        private _loadData(data);
        private _getMeshes();
        private _getSkeletons();
        private _getAnimationTargets();
        private _startAnimations();
        private _loadDefaultScene(nodeNames);
        private _loadScene(context, scene, nodeNames);
        _loadNode(context: string, node: IGLTFNode): void;
        private _loadMesh(context, node, mesh);
        private _loadAllVertexDataAsync(context, mesh, onSuccess);
        private _loadVertexDataAsync(context, mesh, primitive, onSuccess);
        private _createMorphTargets(context, node, mesh);
        private _loadMorphTargets(context, node, mesh);
        private _loadAllMorphTargetVertexDataAsync(context, node, mesh, onSuccess);
        private _loadMorphTargetVertexDataAsync(context, vertexData, attributes, onSuccess);
        private _loadTransform(node);
        private _loadSkin(context, skin);
        private _createBone(node, skin, parent, localMatrix, baseMatrix, index);
        private _loadBones(context, skin, inverseBindMatrixData);
        private _loadBone(node, skin, inverseBindMatrixData, babylonBones);
        private _getNodeMatrix(node);
        private _traverseNodes(context, indices, action, parentNode?);
        _traverseNode(context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode?: IGLTFNode): void;
        private _loadAnimations();
        private _loadAnimationChannel(animation, channelContext, channel, samplerContext, sampler);
        private _loadBufferAsync(context, buffer, onSuccess);
        private _loadBufferViewAsync(context, bufferView, onSuccess);
        private _loadAccessorAsync(context, accessor, onSuccess);
        private _getNumComponentsOfType(type);
        private _buildArrayBuffer<T>(typedArray, data, byteOffset, count, numComponents, byteStride);
        _addPendingData(data: any): void;
        _removePendingData(data: any): void;
        _addLoaderPendingData(data: any): void;
        _removeLoaderPendingData(data: any): void;
        _whenAction(action: () => void, onComplete: () => void): void;
        private _getDefaultMaterial();
        private _loadMaterialMetallicRoughnessProperties(context, material);
        _loadMaterial(context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): void;
        _createPbrMaterial(material: IGLTFMaterial): void;
        _loadMaterialBaseProperties(context: string, material: IGLTFMaterial): void;
        _loadMaterialAlphaProperties(context: string, material: IGLTFMaterial, colorFactor: number[]): void;
        _loadTexture(context: string, texture: IGLTFTexture, coordinatesIndex: number): Texture;
        private _loadImage(context, image, onSuccess);
        _loadUri(context: string, uri: string, onSuccess: (data: ArrayBufferView) => void): void;
        _tryCatchOnError(handler: () => void): void;
    }
}


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
        static ValidateUri(uri: string): boolean;
        static AssignIndices(array: Array<{
            index?: number;
        }>): void;
        static GetArrayItem<T>(array: ArrayLike<T>, index: number): T;
        static GetTextureWrapMode(mode: ETextureWrapMode): number;
        static GetTextureSamplingMode(magFilter: ETextureMagFilter, minFilter: ETextureMinFilter): number;
    }
}


declare module BABYLON.GLTF2 {
    abstract class GLTFLoaderExtension {
        enabled: boolean;
        readonly abstract name: string;
        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean;
        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean;
        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        protected _loadExtension<T>(property: IGLTFProperty, action: (extension: T, onComplete: () => void) => void): boolean;
        static _Extensions: GLTFLoaderExtension[];
        static TraverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean;
        static LoadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean;
        static LoadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private static _ApplyExtensions(action);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class MSFTLOD extends GLTFLoaderExtension {
        /**
         * Specify the minimal delay between LODs in ms (default = 250)
         */
        static MinimalLODDelay: number;
        readonly name: string;
        protected _traverseNode(loader: GLTFLoader, context: string, node: IGLTFNode, action: (node: IGLTFNode, parentNode: IGLTFNode) => boolean, parentNode: IGLTFNode): boolean;
        protected _loadNode(loader: GLTFLoader, context: string, node: IGLTFNode): boolean;
        private _loadNodeLOD(loader, context, nodes, index, onComplete);
        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private _loadMaterialLOD(loader, context, materials, index, assign, onComplete);
    }
}


declare module BABYLON.GLTF2.Extensions {
    class KHRMaterialsPbrSpecularGlossiness extends GLTFLoaderExtension {
        readonly name: string;
        protected _loadMaterial(loader: GLTFLoader, context: string, material: IGLTFMaterial, assign: (babylonMaterial: Material, isNew: boolean) => void): boolean;
        private _loadSpecularGlossinessProperties(loader, context, material, properties);
    }
}
