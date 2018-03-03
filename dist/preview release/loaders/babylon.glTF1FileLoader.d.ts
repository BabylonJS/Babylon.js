
declare module BABYLON {
    enum GLTFLoaderCoordinateSystemMode {
        /**
         * Automatically convert the glTF right-handed data to the appropriate system based on the current coordinate system mode of the scene.
         */
        AUTO = 0,
        /**
         * Sets the useRightHandedSystem flag on the scene.
         */
        FORCE_RIGHT_HANDED = 1,
    }
    enum GLTFLoaderAnimationStartMode {
        /**
         * No animation will start.
         */
        NONE = 0,
        /**
         * The first animation will start.
         */
        FIRST = 1,
        /**
         * All animations will start.
         */
        ALL = 2,
    }
    interface IGLTFLoaderData {
        json: Object;
        bin: Nullable<ArrayBufferView>;
    }
    interface IGLTFLoaderExtension {
        /**
         * The name of this extension.
         */
        readonly name: string;
        /**
         * Whether this extension is enabled.
         */
        enabled: boolean;
    }
    enum GLTFLoaderState {
        Loading = 0,
        Ready = 1,
        Complete = 2,
    }
    interface IGLTFLoader extends IDisposable {
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        animationStartMode: GLTFLoaderAnimationStartMode;
        compileMaterials: boolean;
        useClipPlane: boolean;
        compileShadowGenerators: boolean;
        onMeshLoadedObservable: Observable<AbstractMesh>;
        onTextureLoadedObservable: Observable<BaseTexture>;
        onMaterialLoadedObservable: Observable<Material>;
        onAnimationGroupLoadedObservable: Observable<AnimationGroup>;
        onCompleteObservable: Observable<IGLTFLoader>;
        onDisposeObservable: Observable<IGLTFLoader>;
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        state: Nullable<GLTFLoaderState>;
        importMeshAsync: (meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
        }>;
        loadAsync: (scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void) => Promise<void>;
    }
    class GLTFFileLoader implements IDisposable, ISceneLoaderPluginAsync, ISceneLoaderPluginFactory {
        static CreateGLTFLoaderV1: () => IGLTFLoader;
        static CreateGLTFLoaderV2: () => IGLTFLoader;
        /**
         * Raised when the asset has been parsed.
         * The data.json property stores the glTF JSON.
         * The data.bin property stores the BIN chunk from a glTF binary or null if the input is not a glTF binary.
         */
        onParsedObservable: Observable<IGLTFLoaderData>;
        private _onParsedObserver;
        onParsed: (loaderData: IGLTFLoaderData) => void;
        static IncrementalLoading: boolean;
        static HomogeneousCoordinates: boolean;
        /**
         * The coordinate system mode (AUTO, FORCE_RIGHT_HANDED).
         */
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        /**
         * The animation start mode (NONE, FIRST, ALL).
         */
        animationStartMode: GLTFLoaderAnimationStartMode;
        /**
         * Set to true to compile materials before raising the success callback.
         */
        compileMaterials: boolean;
        /**
         * Set to true to also compile materials with clip planes.
         */
        useClipPlane: boolean;
        /**
         * Set to true to compile shadow generators before raising the success callback.
         */
        compileShadowGenerators: boolean;
        /**
         * Raised when the loader creates a mesh after parsing the glTF properties of the mesh.
         */
        readonly onMeshLoadedObservable: Observable<AbstractMesh>;
        private _onMeshLoadedObserver;
        onMeshLoaded: (mesh: AbstractMesh) => void;
        /**
         * Raised when the loader creates a texture after parsing the glTF properties of the texture.
         */
        readonly onTextureLoadedObservable: Observable<BaseTexture>;
        private _onTextureLoadedObserver;
        onTextureLoaded: (texture: BaseTexture) => void;
        /**
         * Raised when the loader creates a material after parsing the glTF properties of the material.
         */
        readonly onMaterialLoadedObservable: Observable<Material>;
        private _onMaterialLoadedObserver;
        onMaterialLoaded: (material: Material) => void;
        /**
         * Raised when the loader creates an animation group after parsing the glTF properties of the material.
         */
        readonly onAnimationGroupLoadedObservable: Observable<AnimationGroup>;
        private _onAnimationGroupLoadedObserver;
        onAnimationGroupLoaded: (animationGroup: AnimationGroup) => void;
        /**
         * Raised when the asset is completely loaded, immediately before the loader is disposed.
         * For assets with LODs, raised when all of the LODs are complete.
         * For assets without LODs, raised when the model is complete, immediately after onSuccess.
         */
        readonly onCompleteObservable: Observable<GLTFFileLoader>;
        private _onCompleteObserver;
        onComplete: () => void;
        /**
        * Raised when the loader is disposed.
        */
        readonly onDisposeObservable: Observable<GLTFFileLoader>;
        private _onDisposeObserver;
        onDispose: () => void;
        /**
         * Raised after a loader extension is created.
         * Set additional options for a loader extension in this event.
         */
        readonly onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        private _onExtensionLoadedObserver;
        onExtensionLoaded: (extension: IGLTFLoaderExtension) => void;
        /**
         * Gets a promise that resolves when the asset to be completely loaded.
         * @returns A promise that resolves when the asset is completely loaded.
         */
        whenCompleteAsync(): Promise<void>;
        /**
         * The loader state or null if not active.
         */
        readonly loaderState: Nullable<GLTFLoaderState>;
        private _loader;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        /**
         * Disposes the loader, releases resources during load, and cancels any outstanding requests.
         */
        dispose(): void;
        importMeshAsync(meshesNames: any, scene: Scene, data: any, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
        }>;
        loadAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<void>;
        loadAssetContainerAsync(scene: Scene, data: string | ArrayBuffer, rootUrl: string, onProgress?: (event: SceneLoaderProgressEvent) => void): Promise<AssetContainer>;
        canDirectLoad(data: string): boolean;
        rewriteRootURL: (rootUrl: string, responseURL?: string) => string;
        createPlugin(): ISceneLoaderPlugin | ISceneLoaderPluginAsync;
        private _parse(data);
        private _getLoader(loaderData);
        private static _parseBinary(data);
        private static _parseV1(binaryReader);
        private static _parseV2(binaryReader);
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
        static LoadTextureBufferAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (buffer: Nullable<ArrayBufferView>) => void, onError: (message: string) => void): void;
        static CreateTextureAsync(gltfRuntime: IGLTFRuntime, id: string, buffer: Nullable<ArrayBufferView>, onSuccess: (texture: Texture) => void, onError: (message: string) => void): void;
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
        coordinateSystemMode: GLTFLoaderCoordinateSystemMode;
        animationStartMode: GLTFLoaderAnimationStartMode;
        compileMaterials: boolean;
        useClipPlane: boolean;
        compileShadowGenerators: boolean;
        onDisposeObservable: Observable<IGLTFLoader>;
        onMeshLoadedObservable: Observable<AbstractMesh>;
        onTextureLoadedObservable: Observable<BaseTexture>;
        onMaterialLoadedObservable: Observable<Material>;
        onAnimationGroupLoadedObservable: Observable<AnimationGroup>;
        onCompleteObservable: Observable<IGLTFLoader>;
        onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
        state: Nullable<GLTFLoaderState>;
        dispose(): void;
        private _importMeshAsync(meshesNames, scene, data, rootUrl, onSuccess, onProgress, onError);
        importMeshAsync(meshesNames: any, scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress: (event: SceneLoaderProgressEvent) => void): Promise<{
            meshes: AbstractMesh[];
            particleSystems: ParticleSystem[];
            skeletons: Skeleton[];
        }>;
        private _loadAsync(scene, data, rootUrl, onSuccess, onProgress, onError);
        loadAsync(scene: Scene, data: IGLTFLoaderData, rootUrl: string, onProgress: (event: SceneLoaderProgressEvent) => void): Promise<void>;
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
