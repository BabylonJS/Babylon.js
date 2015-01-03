declare module BABYLON {
    class BoundingBoxRenderer {
        public frontColor: Color3;
        public backColor: Color3;
        public showBackLines: boolean;
        public renderList: SmartArray<BoundingBox>;
        private _scene;
        private _colorShader;
        private _vb;
        private _ib;
        constructor(scene: Scene);
        public reset(): void;
        public render(): void;
        public dispose(): void;
    }
}
