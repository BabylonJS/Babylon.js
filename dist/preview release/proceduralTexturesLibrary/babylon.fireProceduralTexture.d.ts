
declare module BABYLON {
    class FireProceduralTexture extends ProceduralTexture {
        private _time;
        private _speed;
        private _autoGenerateTime;
        private _fireColors;
        private _alphaThreshold;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        static readonly PurpleFireColors: Color3[];
        static readonly GreenFireColors: Color3[];
        static readonly RedFireColors: Color3[];
        static readonly BlueFireColors: Color3[];
        fireColors: Color3[];
        time: number;
        speed: Vector2;
        alphaThreshold: number;
    }
}
