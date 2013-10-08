/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class DynamicTexture extends Texture {
        _canvas: HTMLCanvasElement;
        _context: CanvasRenderingContext2D;

        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: boolean);

        getContext(): CanvasRenderingContext2D;
        drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY: boolean): void;
        update(): void;
    }
}