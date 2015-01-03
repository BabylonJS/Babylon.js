declare module BABYLON {
    class LensFlare {
        public size: number;
        public position: number;
        public color: Color3;
        public texture: Texture;
        private _system;
        constructor(size: number, position: number, color: any, imgUrl: string, system: LensFlareSystem);
        public dispose: () => void;
    }
}
