declare module BABYLON {
    class FresnelParameters {
        public isEnabled: boolean;
        public leftColor: Color3;
        public rightColor: Color3;
        public bias: number;
        public power: number;
    }
    class StandardMaterial extends Material {
        public diffuseTexture: BaseTexture;
        public ambientTexture: BaseTexture;
        public opacityTexture: BaseTexture;
        public reflectionTexture: BaseTexture;
        public emissiveTexture: BaseTexture;
        public specularTexture: BaseTexture;
        public bumpTexture: BaseTexture;
        public ambientColor: Color3;
        public diffuseColor: Color3;
        public specularColor: Color3;
        public specularPower: number;
        public emissiveColor: Color3;
        public useAlphaFromDiffuseTexture: boolean;
        public useSpecularOverAlpha: boolean;
        public fogEnabled: boolean;
        public diffuseFresnelParameters: FresnelParameters;
        public opacityFresnelParameters: FresnelParameters;
        public reflectionFresnelParameters: FresnelParameters;
        public emissiveFresnelParameters: FresnelParameters;
        private _cachedDefines;
        private _renderTargets;
        private _worldViewProjectionMatrix;
        private _globalAmbientColor;
        private _scaledDiffuse;
        private _scaledSpecular;
        private _renderId;
        constructor(name: string, scene: Scene);
        public needAlphaBlending(): boolean;
        public needAlphaTesting(): boolean;
        private _shouldUseAlphaFromDiffuseTexture();
        public getAlphaTestTexture(): BaseTexture;
        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        public unbind(): void;
        public bindOnlyWorldMatrix(world: Matrix): void;
        public bind(world: Matrix, mesh: Mesh): void;
        public getAnimatables(): IAnimatable[];
        public dispose(forceDisposeEffect?: boolean): void;
        public clone(name: string): StandardMaterial;
        static DiffuseTextureEnabled: boolean;
        static AmbientTextureEnabled: boolean;
        static OpacityTextureEnabled: boolean;
        static ReflectionTextureEnabled: boolean;
        static EmissiveTextureEnabled: boolean;
        static SpecularTextureEnabled: boolean;
        static BumpTextureEnabled: boolean;
        static FresnelEnabled: boolean;
    }
}
