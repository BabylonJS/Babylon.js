
declare module BABYLON {
    class StarfieldProceduralTexture extends ProceduralTexture {
        private _time;
        private _alpha;
        private _beta;
        private _zoom;
        private _formuparam;
        private _stepsize;
        private _tile;
        private _brightness;
        private _darkmatter;
        private _distfading;
        private _saturation;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        time: number;
        alpha: number;
        beta: number;
        formuparam: number;
        stepsize: number;
        zoom: number;
        tile: number;
        brightness: number;
        darkmatter: number;
        distfading: number;
        saturation: number;
    }
}
