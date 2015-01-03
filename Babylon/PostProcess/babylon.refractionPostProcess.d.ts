declare module BABYLON {
    class RefractionPostProcess extends PostProcess {
        public color: Color3;
        public depth: number;
        public colorLevel: number;
        private _refRexture;
        constructor(name: string, refractionTextureUrl: string, color: Color3, depth: number, colorLevel: number, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean);
        public dispose(camera: Camera): void;
    }
}
