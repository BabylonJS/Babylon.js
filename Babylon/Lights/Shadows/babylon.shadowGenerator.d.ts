declare module BABYLON {
    class ShadowGenerator {
        private static _FILTER_NONE;
        private static _FILTER_VARIANCESHADOWMAP;
        private static _FILTER_POISSONSAMPLING;
        static FILTER_NONE : number;
        static FILTER_VARIANCESHADOWMAP : number;
        static FILTER_POISSONSAMPLING : number;
        public filter: number;
        public useVarianceShadowMap : boolean;
        public usePoissonSampling : boolean;
        private _light;
        private _scene;
        private _shadowMap;
        private _darkness;
        private _transparencyShadow;
        private _effect;
        private _viewMatrix;
        private _projectionMatrix;
        private _transformMatrix;
        private _worldViewProjection;
        private _cachedPosition;
        private _cachedDirection;
        private _cachedDefines;
        constructor(mapSize: number, light: DirectionalLight);
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean;
        public getShadowMap(): RenderTargetTexture;
        public getLight(): DirectionalLight;
        public getTransformMatrix(): Matrix;
        public getDarkness(): number;
        public setDarkness(darkness: number): void;
        public setTransparencyShadow(hasShadow: boolean): void;
        public dispose(): void;
    }
}
