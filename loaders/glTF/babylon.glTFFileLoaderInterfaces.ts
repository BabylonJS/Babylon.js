﻿module BABYLON {
    /**
    * Interfaces
    */
    export interface IGLTFChildRootProperty {
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

    export interface IGLTFTechniquePassCommonProfile {
        lightingModel: string;
        texcoordBindings: Object;

        parameters?: Array<any>;
    }

    export interface IGLTFTechniquePassInstanceProgram {
        program: string;

        attributes?: Object;
        uniforms: Object;
    }

    export interface IGLTFTechniquePassStatesFunctions {
        blendColor?: number[];
        blendEquationSeparate?: number[];
        blendFuncSeparate?: number[];
    }

    export interface IGLTFTechniquePassStates {
        enable: number[];
        functions: IGLTFTechniquePassStatesFunctions;
    }

    export interface IGLTFTechniquePassDetails {
        commonProfile: IGLTFTechniquePassCommonProfile;
        type: string;
    }

    export interface IGLTFTechniquePass {
        details: IGLTFTechniquePassDetails;
        instanceProgram: IGLTFTechniquePassInstanceProgram;
        states: IGLTFTechniquePassStates;
    }

    export interface IGLTFTechnique extends IGLTFChildRootProperty {
        parameters: Object;
        pass: string;
        passes: Object;
    }

    export interface IGLTFMaterialInstanceTechnique {
        technique: string;

        values?: Object;
    }

    export interface IGLTFMaterial extends IGLTFChildRootProperty {
        instanceTechnique: IGLTFMaterialInstanceTechnique;
    }

    export interface IGLTFMeshPrimitive {
        attributes: Object;
        indices: string;
        material: string;

        primitive?: number;
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
    }

    export interface IGLTFNode extends IGLTFChildRootProperty {
        camera?: string;
        children: string[];
        instanceSkin?: IGLTFNodeInstanceSkin;
        jointName?: string;
        light?: string;
        matrix: number[];
        mesh?: string;
        meshes?: string[];
        rotation?: number[];
        scale?: number[];
        translation?: number[];
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

        buffersCount: number;
        shaderscount: number;

        scene: Scene;
        rootUrl: string;
        loadedBuffers: number;
        loadedShaders: number;
        arrayBuffers: Object;

        dummyNodes: Node[];
    }
}