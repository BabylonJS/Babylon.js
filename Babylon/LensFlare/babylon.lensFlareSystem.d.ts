declare module BABYLON {
    class LensFlareSystem {
        public name: string;
        public lensFlares: LensFlare[];
        public borderLimit: number;
        public meshesSelectionPredicate: (mesh: Mesh) => boolean;
        private _scene;
        private _emitter;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _vertexBuffer;
        private _indexBuffer;
        private _effect;
        private _positionX;
        private _positionY;
        private _isEnabled;
        constructor(name: string, emitter: any, scene: Scene);
        public isEnabled : boolean;
        public getScene(): Scene;
        public getEmitter(): any;
        public getEmitterPosition(): Vector3;
        public computeEffectivePosition(globalViewport: Viewport): boolean;
        public _isVisible(): boolean;
        public render(): boolean;
        public dispose(): void;
    }
}
