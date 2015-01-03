declare module BABYLON {
    class DynamicTexture extends Texture {
        private _generateMipMaps;
        private _canvas;
        private _context;
        constructor(name: string, options: any, scene: Scene, generateMipMaps: boolean, samplingMode?: number);
        public canRescale : boolean;
        public scale(ratio: number): void;
        public getContext(): CanvasRenderingContext2D;
        public update(invertY?: boolean): void;
        public drawText(text: string, x: number, y: number, font: string, color: string, clearColor: string, invertY?: boolean): void;
        public clone(): DynamicTexture;
    }
}
