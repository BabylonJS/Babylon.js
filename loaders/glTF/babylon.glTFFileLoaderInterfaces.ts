module BABYLON {
    /**
    * Enums
    */
    export enum EComponentType {
        BYTE = 5120,
        UNSIGNED_BYTE = 5121,
        SHORT = 5122,
        UNSIGNED_SHORT = 5123,
        FLOAT = 5126
    }

    export enum EShaderType {
        FRAGMENT = 35632,
        VERTEX = 35633
    }

    export enum EParameterType {
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
        SAMPLER_2D = 35678
    }

    export enum ETextureWrapMode {
        CLAMP_TO_EDGE = 33071,
        MIRRORED_REPEAT = 33648,
        REPEAT = 10497
    }

    export enum ETextureFilterType {
        NEAREST = 9728,
        LINEAR = 9728,
        NEAREST_MIPMAP_NEAREST = 9984,
        LINEAR_MIPMAP_NEAREST = 9985,
        NEAREST_MIPMAP_LINEAR = 9986,
        LINEAR_MIPMAP_LINEAR = 9987
    }

    export enum ETextureFormat {
        ALPHA = 6406,
        RGB = 6407,
        RGBA = 6408,
        LUMINANCE = 6409,
        LUMINANCE_ALPHA = 6410
    }

    export enum ECullingType {
        FRONT = 1028,
        BACK = 1029,
        FRONT_AND_BACK = 1032
    }

    export enum EBlendingFunction {
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
        SRC_ALPHA_SATURATE = 776
    }

    /**
    * Interfaces
    */
    export interface IGLTFProperty {
        extensions?: Object;
        extras?: Object;
    }

    export interface IGLTFChildRootProperty extends IGLTFProperty {
        name?: string;
    }

    export interface IGLTFAccessor extends IGLTFChildRootProperty {
        bufferView: string;
        byteOffset: number;
        byteStride: number;
        count: number;
        type: string;
        componentType: EComponentType;

        max?: number[],
        min?: number[],
        name?: string;
    }

    export interface IGLTFBufferView extends IGLTFChildRootProperty {
        buffer: string;
        byteOffset: number;
        byteLength: number;

        target?: number;
    }

    export interface IGLTFBuffer extends IGLTFChildRootProperty {
        uri: string;

        byteLength?: number;
        type?: string;
    }

    export interface IGLTFShader extends IGLTFChildRootProperty {
        uri: string;
        type: EShaderType;
    }

    export interface IGLTFProgram extends IGLTFChildRootProperty {
        attributes: string[];
        fragmentShader: string;
        vertexShader: string;
    }

    export interface IGLTFTechniqueParameter {
        type: number;

        count?: number;
        semantic?: string;
        node?: string;
        value?: number|boolean|string|Array<any>;
        source?: string;

        babylonValue?: any;
    }

    export interface IGLTFTechniqueCommonProfile {
        lightingModel: string;
        texcoordBindings: Object;

        parameters?: Array<any>;
    }

    export interface IGLTFTechniqueStatesFunctions {
        blendColor?: number[];
        blendEquationSeparate?: number[];
        blendFuncSeparate?: number[];
        colorMask: boolean[];
        cullFace: number[];
    }

    export interface IGLTFTechniqueStates {
        enable: number[];
        functions: IGLTFTechniqueStatesFunctions;
    }

    export interface IGLTFTechnique extends IGLTFChildRootProperty {
        parameters: Object;
        program: string;

        attributes: Object;
        uniforms: Object;
        states: IGLTFTechniqueStates;
    }

    export interface IGLTFMaterial extends IGLTFChildRootProperty {
        technique?: string;
        values: string[];
    }

    export interface IGLTFMeshPrimitive extends IGLTFProperty {
        attributes: Object;
        indices: string;
        material: string;

        mode?: number;
    }

    export interface IGLTFMesh extends IGLTFChildRootProperty {
        primitives: IGLTFMeshPrimitive[];
    }

    export interface IGLTFImage extends IGLTFChildRootProperty {
        uri: string;
    }

    export interface IGLTFSampler extends IGLTFChildRootProperty {
        magFilter?: number;
        minFilter?: number;
        wrapS?: number;
        wrapT?: number;
    }

    export interface IGLTFTexture extends IGLTFChildRootProperty {
        sampler: string;
        source: string;

        format?: ETextureFormat;
        internalFormat?: ETextureFormat;
        target?: number;
        type?: number;
        
        // Babylon.js values (optimize)
        babylonTexture?: Texture;
    }

    export interface IGLTFAmbienLight {
        color?: number[];
    }

    export interface IGLTFDirectionalLight {
        color?: number[];
    }

    export interface IGLTFPointLight {
        color?: number[];
        constantAttenuation?: number;
        linearAttenuation?: number;
        quadraticAttenuation?: number;
    }

    export interface IGLTFSpotLight {
        color?: number[];
        constantAttenuation?: number;
        fallOfAngle?: number;
        fallOffExponent?: number;
        linearAttenuation?: number;
        quadraticAttenuation?: number;
    }

    export interface IGLTFLight extends IGLTFChildRootProperty {
        type: string;
    }

    export interface IGLTFCameraOrthographic {
        xmag: number;
        ymag: number;
        zfar: number;
        znear: number;
    }

    export interface IGLTFCameraPerspective {
        aspectRatio: number;
        yfov: number;
        zfar: number;
        znear: number;
    }

    export interface IGLTFCamera extends IGLTFChildRootProperty {
        type: string;
    }

    export interface IGLTFAnimationChannelTarget {
        id: string;
        path: string;
    }

    export interface IGLTFAnimationChannel {
        sampler: string;
        target: IGLTFAnimationChannelTarget;
    }

    export interface IGLTFAnimationSampler {
        input: string;
        output: string;

        interpolation?: string;
    }

    export interface IGLTFAnimation extends IGLTFChildRootProperty {
        channels?: IGLTFAnimationChannel[];
        parameters?: Object;
        samplers?: Object;
    }

    export interface IGLTFNodeInstanceSkin {
        skeletons: string[];
        skin: string;
        meshes: string[];
    }

    export interface IGLTFSkins extends IGLTFChildRootProperty {
        bindShapeMatrix: number[];
        inverseBindMatrices: string;
        jointNames: string[];

        babylonSkeleton?: Skeleton;
    }

    export interface IGLTFNode extends IGLTFChildRootProperty {
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

        // Babylon.js values (optimize)
        babylonNode?: Node;
    }

    export interface IGLTFScene extends IGLTFChildRootProperty {
        nodes: string[];
    }

    /**
    * Runtime
    */
    export interface IGLTFRuntime {
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
        currentScene: Object;
        extensionsUsed: string[];

        buffersCount: number;
        shaderscount: number;

        scene: Scene;
        rootUrl: string;

        loadedBufferCount: number;
        loadedBufferViews: { [name: string]: ArrayBufferView };

        loadedShaderCount: number;

        importOnlyMeshes: boolean;
        importMeshesNames?: string[];

        dummyNodes: Node[];
    }

    /**
    * Bones
    */
    export interface INodeToRoot {
        bone: Bone;
        node: IGLTFNode;
        id: string;
    }

    export interface IJointNode {
        node: IGLTFNode;
        id: string;
    }

    /**
    * Extensions
    */
    export interface IGLTFExtension {
        /**
        * The name of the extension (example: "KHR_materials_pbr" cf. https://github.com/tsturm/glTF/tree/master/extensions/Vendor/FRAUNHOFER_materials_pbr)
        */
        extensionName: string;
    }

    export interface IGLTFLoaderExtension<ExtensionType extends Object, ExtensionObject extends Object> extends IGLTFExtension {
        /**
        * If the extensions needs the loader to skip its default behavior
        * Example, when loading materials, if the loader should use only the extension
        * or load the shader material and call the extension to customize the shader material
        */
        needToSkipDefaultLoaderBehavior(id: string, extension: ExtensionType): boolean;

        /**
        * Apply extension method
        */
        apply(gltfRuntime: IGLTFRuntime, id: string, name: string, extension: ExtensionType, object: ExtensionObject): ExtensionObject;
    }

    export enum EContentFormat {
        JSON = 0
    };

    export const BinaryExtensionName = "KHR_binary_glTF";
    export const BinaryExtensionBufferName = "binary_glTF";

    export interface IGLTFBinaryExtension {
        content: Object;
        body: Uint8Array;
    };

    export interface IGLTFBinaryExtensionShader {
        bufferView: string;
    };

    export interface IGLTFBinaryExtensionImage {
        bufferView: string;
        mimeType: string;
        height: number;
        width: number;
    };
}