/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class PBRMaterial extends BABYLON.Material {
        directIntensity: number;
        emissiveIntensity: number;
        environmentIntensity: number;
        specularIntensity: number;
        private _lightingInfos;
        overloadedShadowIntensity: number;
        overloadedShadeIntensity: number;
        private _overloadedShadowInfos;
        cameraExposure: number;
        cameraContrast: number;
        private _cameraInfos;
        overloadedAmbientIntensity: number;
        overloadedAlbedoIntensity: number;
        overloadedReflectivityIntensity: number;
        overloadedEmissiveIntensity: number;
        private _overloadedIntensity;
        overloadedAmbient: Color3;
        overloadedAlbedo: Color3;
        overloadedReflectivity: Color3;
        overloadedEmissive: Color3;
        overloadedReflection: Color3;
        overloadedMicroSurface: number;
        overloadedMicroSurfaceIntensity: number;
        overloadedReflectionIntensity: number;
        private _overloadedMicroSurface;
        disableBumpMap: boolean;
        albedoTexture: BaseTexture;
        ambientTexture: BaseTexture;
        opacityTexture: BaseTexture;
        reflectionTexture: BaseTexture;
        emissiveTexture: BaseTexture;
        reflectivityTexture: BaseTexture;
        bumpTexture: BaseTexture;
        lightmapTexture: BaseTexture;
        refractionTexture: BaseTexture;
        ambientColor: Color3;
        albedoColor: Color3;
        reflectivityColor: Color3;
        reflectionColor: Color3;
        microSurface: number;
        emissiveColor: Color3;
        useAlphaFromAlbedoTexture: boolean;
        useEmissiveAsIllumination: boolean;
        linkEmissiveWithAlbedo: boolean;
        useSpecularOverAlpha: boolean;
        disableLighting: boolean;
        indexOfRefraction: number;
        invertRefractionY: boolean;
        linkRefractionWithTransparency: boolean;
        useLightmapAsShadowmap: boolean;
        opacityFresnelParameters: FresnelParameters;
        emissiveFresnelParameters: FresnelParameters;
        useMicroSurfaceFromReflectivityMapAlpha: boolean;
        private _renderTargets;
        private _worldViewProjectionMatrix;
        private _globalAmbientColor;
        private _tempColor;
        private _renderId;
        private _defines;
        private _cachedDefines;
        private _useLogarithmicDepth;
        constructor(name: string, scene: Scene);
        useLogarithmicDepth: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        private _shouldUseAlphaFromAlbedoTexture();
        getAlphaTestTexture(): BaseTexture;
        private _checkCache(scene, mesh?, useInstances?);
        static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: MaterialDefines): boolean;
        private static _scaledAlbedo;
        private static _scaledReflectivity;
        private static _scaledEmissive;
        private static _scaledReflection;
        static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: MaterialDefines): void;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        unbind(): void;
        bindOnlyWorldMatrix(world: Matrix): void;
        private _myScene;
        private _myShadowGenerator;
        bind(world: Matrix, mesh?: Mesh): void;
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): PBRMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): PBRMaterial;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class SphericalHarmonics {
        L00: Vector3;
        L1_1: Vector3;
        L10: Vector3;
        L11: Vector3;
        L2_2: Vector3;
        L2_1: Vector3;
        L20: Vector3;
        L21: Vector3;
        L22: Vector3;
        addLight(direction: Vector3, color: Color3, deltaSolidAngle: number): void;
        scale(scale: number): void;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class SphericalPolynomial {
        x: Vector3;
        y: Vector3;
        z: Vector3;
        xx: Vector3;
        yy: Vector3;
        zz: Vector3;
        xy: Vector3;
        yz: Vector3;
        zx: Vector3;
        addAmbient(color: Color3): void;
        static getSphericalPolynomialFromHarmonics(harmonics: SphericalHarmonics): SphericalPolynomial;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.Internals {
    interface CubeMapInfo {
        front: Float32Array;
        back: Float32Array;
        left: Float32Array;
        right: Float32Array;
        up: Float32Array;
        down: Float32Array;
        size: number;
    }
    class PanoramaToCubeMapTools {
        private static FACE_FRONT;
        private static FACE_BACK;
        private static FACE_LEFT;
        private static FACE_RIGHT;
        private static FACE_UP;
        private static FACE_DOWN;
        static ConvertPanoramaToCubemap(float32Array: Float32Array, inputWidth: number, inputHeight: number, size: number): CubeMapInfo;
        private static CreateCubemapTexture(texSize, faceData, float32Array, inputWidth, inputHeight);
        private static CalcProjectionSpherical(vDir, float32Array, inputWidth, inputHeight);
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.Internals {
    class CubeMapToSphericalPolynomialTools {
        private static FileFaces;
        static ConvertCubeMapToSphericalPolynomial(cubeInfo: CubeMapInfo): SphericalPolynomial;
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON.Internals {
    interface HDRInfo {
        height: number;
        width: number;
        dataPosition: number;
    }
    class HDRTools {
        private static Ldexp(mantissa, exponent);
        private static Rgbe2float(float32array, red, green, blue, exponent, index);
        private static readStringLine(uint8array, startIndex);
        static RGBE_ReadHeader(uint8array: Uint8Array): HDRInfo;
        static GetCubeMapTextureData(buffer: ArrayBuffer, size: number): CubeMapInfo;
        static RGBE_ReadPixels(uint8array: Uint8Array, hdrInfo: HDRInfo): Float32Array;
        private static RGBE_ReadPixels_RLE(uint8array, hdrInfo);
    }
}

/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class HDRCubeTexture extends BaseTexture {
        url: string;
        coordinatesMode: number;
        private _noMipmap;
        private _extensions;
        private _textureMatrix;
        private _size;
        sphericalPolynomial: SphericalPolynomial;
        constructor(url: string, scene: Scene, size: number, noMipmap?: boolean);
        private loadTexture();
        clone(): HDRCubeTexture;
        delayLoad(): void;
        getReflectionTextureMatrix(): Matrix;
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): HDRCubeTexture;
        serialize(): any;
    }
}
