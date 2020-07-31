import { Bone } from "babylonjs/Bones/bone";
import { Skeleton } from "babylonjs/Bones/skeleton";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { Node } from "babylonjs/node";
import { Scene } from "babylonjs/scene";

/**
* Enums
* @hidden
*/
export enum EComponentType {
    BYTE = 5120,
    UNSIGNED_BYTE = 5121,
    SHORT = 5122,
    UNSIGNED_SHORT = 5123,
    FLOAT = 5126
}

/** @hidden */
export enum EShaderType {
    FRAGMENT = 35632,
    VERTEX = 35633
}

/** @hidden */
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

/** @hidden */
export enum ETextureWrapMode {
    CLAMP_TO_EDGE = 33071,
    MIRRORED_REPEAT = 33648,
    REPEAT = 10497
}

/** @hidden */
export enum ETextureFilterType {
    NEAREST = 9728,
    LINEAR = 9728,
    NEAREST_MIPMAP_NEAREST = 9984,
    LINEAR_MIPMAP_NEAREST = 9985,
    NEAREST_MIPMAP_LINEAR = 9986,
    LINEAR_MIPMAP_LINEAR = 9987
}

/** @hidden */
export enum ETextureFormat {
    ALPHA = 6406,
    RGB = 6407,
    RGBA = 6408,
    LUMINANCE = 6409,
    LUMINANCE_ALPHA = 6410
}

/** @hidden */
export enum ECullingType {
    FRONT = 1028,
    BACK = 1029,
    FRONT_AND_BACK = 1032
}

/** @hidden */
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

/** @hidden */
export interface IGLTFProperty {
    extensions?: { [key: string]: any };
    extras?: Object;
}

/** @hidden */
export interface IGLTFChildRootProperty extends IGLTFProperty {
    name?: string;
}

/** @hidden */
export interface IGLTFAccessor extends IGLTFChildRootProperty {
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

/** @hidden */
export interface IGLTFBufferView extends IGLTFChildRootProperty {
    buffer: string;
    byteOffset: number;
    byteLength: number;
    byteStride: number;

    target?: number;
}

/** @hidden */
export interface IGLTFBuffer extends IGLTFChildRootProperty {
    uri: string;

    byteLength?: number;
    type?: string;
}

/** @hidden */
export interface IGLTFShader extends IGLTFChildRootProperty {
    uri: string;
    type: EShaderType;
}

/** @hidden */
export interface IGLTFProgram extends IGLTFChildRootProperty {
    attributes: string[];
    fragmentShader: string;
    vertexShader: string;
}

/** @hidden */
export interface IGLTFTechniqueParameter {
    type: number;

    count?: number;
    semantic?: string;
    node?: string;
    value?: number | boolean | string | Array<any>;
    source?: string;

    babylonValue?: any;
}

/** @hidden */
export interface IGLTFTechniqueCommonProfile {
    lightingModel: string;
    texcoordBindings: Object;

    parameters?: Array<any>;
}

/** @hidden */
export interface IGLTFTechniqueStatesFunctions {
    blendColor?: number[];
    blendEquationSeparate?: number[];
    blendFuncSeparate?: number[];
    colorMask: boolean[];
    cullFace: number[];
}

/** @hidden */
export interface IGLTFTechniqueStates {
    enable: number[];
    functions: IGLTFTechniqueStatesFunctions;
}

/** @hidden */
export interface IGLTFTechnique extends IGLTFChildRootProperty {
    parameters: { [key: string]: IGLTFTechniqueParameter };
    program: string;

    attributes: { [key: string]: string };
    uniforms: { [key: string]: string };
    states: IGLTFTechniqueStates;
}

/** @hidden */
export interface IGLTFMaterial extends IGLTFChildRootProperty {
    technique?: string;
    values: string[];
}

/** @hidden */
export interface IGLTFMeshPrimitive extends IGLTFProperty {
    attributes: { [key: string]: string };
    indices: string;
    material: string;

    mode?: number;
}

/** @hidden */
export interface IGLTFMesh extends IGLTFChildRootProperty {
    primitives: IGLTFMeshPrimitive[];
}

/** @hidden */
export interface IGLTFImage extends IGLTFChildRootProperty {
    uri: string;
}

/** @hidden */
export interface IGLTFSampler extends IGLTFChildRootProperty {
    magFilter?: number;
    minFilter?: number;
    wrapS?: number;
    wrapT?: number;
}

/** @hidden */
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

/** @hidden */
export interface IGLTFAmbienLight {
    color?: number[];
}

/** @hidden */
export interface IGLTFDirectionalLight {
    color?: number[];
}

/** @hidden */
export interface IGLTFPointLight {
    color?: number[];
    constantAttenuation?: number;
    linearAttenuation?: number;
    quadraticAttenuation?: number;
}

/** @hidden */
export interface IGLTFSpotLight {
    color?: number[];
    constantAttenuation?: number;
    fallOfAngle?: number;
    fallOffExponent?: number;
    linearAttenuation?: number;
    quadraticAttenuation?: number;
}

/** @hidden */
export interface IGLTFLight extends IGLTFChildRootProperty {
    type: string;
}

/** @hidden */
export interface IGLTFCameraOrthographic {
    xmag: number;
    ymag: number;
    zfar: number;
    znear: number;
}

/** @hidden */
export interface IGLTFCameraPerspective {
    aspectRatio: number;
    yfov: number;
    zfar: number;
    znear: number;
}

/** @hidden */
export interface IGLTFCamera extends IGLTFChildRootProperty {
    type: string;
}

/** @hidden */
export interface IGLTFAnimationChannelTarget {
    id: string;
    path: string;
}

/** @hidden */
export interface IGLTFAnimationChannel {
    sampler: string;
    target: IGLTFAnimationChannelTarget;
}

/** @hidden */
export interface IGLTFAnimationSampler {
    input: string;
    output: string;

    interpolation?: string;
}

/** @hidden */
export interface IGLTFAnimation extends IGLTFChildRootProperty {
    channels?: IGLTFAnimationChannel[];
    parameters?: { [key: string]: string };
    samplers?: { [key: string]: IGLTFAnimationSampler };
}

/** @hidden */
export interface IGLTFNodeInstanceSkin {
    skeletons: string[];
    skin: string;
    meshes: string[];
}

/** @hidden */
export interface IGLTFSkins extends IGLTFChildRootProperty {
    bindShapeMatrix: number[];
    inverseBindMatrices: string;
    jointNames: string[];

    babylonSkeleton?: Skeleton;
}

/** @hidden */
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

/** @hidden */
export interface IGLTFScene extends IGLTFChildRootProperty {
    nodes: string[];
}

/** @hidden */
export interface IGLTFRuntime {
    extensions: { [key: string]: any };
    accessors: { [key: string]: IGLTFAccessor };
    buffers: { [key: string]: IGLTFBuffer };
    bufferViews: { [key: string]: IGLTFBufferView };
    meshes: { [key: string]: IGLTFMesh };
    lights: { [key: string]: IGLTFLight };
    cameras: { [key: string]: IGLTFCamera };
    nodes: { [key: string]: IGLTFNode };
    images: { [key: string]: IGLTFImage };
    textures: { [key: string]: IGLTFTexture };
    shaders: { [key: string]: IGLTFShader };
    programs: { [key: string]: IGLTFProgram };
    samplers: { [key: string]: IGLTFSampler };
    techniques: { [key: string]: IGLTFTechnique };
    materials: { [key: string]: IGLTFMaterial };
    animations: { [key: string]: IGLTFAnimation };
    skins: { [key: string]: IGLTFSkins };

    currentScene?: Object;
    scenes: { [key: string]: IGLTFScene }; // v1.1

    extensionsUsed: string[];
    extensionsRequired?: string[]; // v1.1

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

    forAssetContainer: boolean;
}

/** @hidden */
export interface INodeToRoot {
    bone: Bone;
    node: IGLTFNode;
    id: string;
}

/** @hidden */
export interface IJointNode {
    node: IGLTFNode;
    id: string;
}
