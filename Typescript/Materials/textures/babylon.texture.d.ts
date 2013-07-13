/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class BaseTexture {
        _scene: Scene;

        constructor(url: string, scene: Scene);

        hasAlpha: bool;
        level: number;
        onDispose: () => void;
        getInternalTexture(): BaseTexture;
        isReady(): bool;
        getSize(): Size2D;
        getBaseSize(): Size2D;
        _getFromCache(url: string, noMipmap: bool): BaseTexture;
        dispose(): void;
    }

    class Texture extends BaseTexture {
        name: string;

        constructor(url: string, scene: Scene, noMipmap: bool, invertY: bool);

        static EXPLICIT_MODE: number;
        static SPHERICAL_MODE: number;
        static PLANAR_MODE: number;
        static CUBIC_MODE: number;
        static PROJECTION_MODE: number;

        uOffset: number;
        vOffset: number;
        uScale: number;
        vScale: number;
        uAng: number;
        vAng: number;
        wAng: number;
        wrapU: bool;
        wrapV: bool;
        coordinatesIndex: number;
        coordinatesMode: number;

        _prepareRowForTextureGeneration(t: Vector3): Vector3;
        _computeTextureMatrix(): Matrix;
    }

    class CubeTexture extends BaseTexture {
        constructor(rootUrl: string, scene: Scene);
    }

    class DynamicTexture extends Texture {
        wrapU: bool;
        wrapV: bool;
        _canvas: HTMLCanvasElement;
        _context: CanvasRenderingContext2D;

        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: bool);

        getContext(): CanvasRenderingContext2D;
        update(): void;
    }

    class RenderTargetTexture extends Texture {
        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: bool);

        renderList: any[];
        isRenderTarget: bool;
        coordinatesMode: number;

        _onBeforeRender: () => void;
        _onAfterRender: () => void;

        render(): void;
    }

    class MirrorTexture extends RenderTargetTexture {
        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: bool);

        mirrorPlane: Plane;

        _onBeforeRender: () => void;
        _onAfterRender: () => void;
    }
}