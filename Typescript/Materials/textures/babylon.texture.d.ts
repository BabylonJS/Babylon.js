/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class Texture extends BaseTexture {
        name: string;
        url: string
        animations: Animation[];

        constructor(url: string, scene: Scene, noMipmap?: boolean, invertY?: boolean);

        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;
        static SKYBOX_MODE: number;

        static CLAMP_ADDRESSMODE: number;
        static WRAP_ADDRESSMODE: number;
        static MIRROR_ADDRESSMODE: number;

        uOffset: number;
        vOffset: number;
        uScale: number;
        vScale: number;
        uAng: number;
        vAng: number;
        wAng: number;
        wrapU: number;
        wrapV: number;
        coordinatesIndex: number;
        coordinatesMode: number;

        _prepareRowForTextureGeneration(t: Vector3): Vector3;
        _computeTextureMatrix(): Matrix;
        _computeReflectionTextureMatrix: Matrix;
        clone(): Texture;
    }
}