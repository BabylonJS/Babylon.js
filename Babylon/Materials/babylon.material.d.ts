declare module BABYLON {
    class Material {
        public name: string;
        private static _TriangleFillMode;
        private static _WireFrameFillMode;
        private static _PointFillMode;
        static TriangleFillMode : number;
        static WireFrameFillMode : number;
        static PointFillMode : number;
        public id: string;
        public checkReadyOnEveryCall: boolean;
        public checkReadyOnlyOnce: boolean;
        public state: string;
        public alpha: number;
        public backFaceCulling: boolean;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onDispose: () => void;
        public onBind: (material: Material) => void;
        public getRenderTargetTextures: () => SmartArray<RenderTargetTexture>;
        public _effect: Effect;
        public _wasPreviouslyReady: boolean;
        private _scene;
        private _fillMode;
        public pointSize: number;
        public wireframe : boolean;
        public pointsCloud : boolean;
        public fillMode : number;
        constructor(name: string, scene: Scene, doNotAdd?: boolean);
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        public getEffect(): Effect;
        public getScene(): Scene;
        public needAlphaBlending(): boolean;
        public needAlphaTesting(): boolean;
        public getAlphaTestTexture(): BaseTexture;
        public trackCreation(onCompiled: (effect: Effect) => void, onError: (effect: Effect, errors: string) => void): void;
        public _preBind(): void;
        public bind(world: Matrix, mesh: Mesh): void;
        public bindOnlyWorldMatrix(world: Matrix): void;
        public unbind(): void;
        public dispose(forceDisposeEffect?: boolean): void;
    }
}
