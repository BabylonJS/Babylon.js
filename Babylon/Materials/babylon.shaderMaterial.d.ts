declare module BABYLON {
    class ShaderMaterial extends Material {
        private _shaderPath;
        private _options;
        private _textures;
        private _floats;
        private _floatsArrays;
        private _colors3;
        private _colors4;
        private _vectors2;
        private _vectors3;
        private _matrices;
        private _cachedWorldViewMatrix;
        private _renderId;
        constructor(name: string, scene: Scene, shaderPath: any, options: any);
        public needAlphaBlending(): boolean;
        public needAlphaTesting(): boolean;
        private _checkUniform(uniformName);
        public setTexture(name: string, texture: Texture): ShaderMaterial;
        public setFloat(name: string, value: number): ShaderMaterial;
        public setFloats(name: string, value: number[]): ShaderMaterial;
        public setColor3(name: string, value: Color3): ShaderMaterial;
        public setColor4(name: string, value: Color4): ShaderMaterial;
        public setVector2(name: string, value: Vector2): ShaderMaterial;
        public setVector3(name: string, value: Vector3): ShaderMaterial;
        public setMatrix(name: string, value: Matrix): ShaderMaterial;
        public isReady(): boolean;
        public bindOnlyWorldMatrix(world: Matrix): void;
        public bind(world: Matrix): void;
        public dispose(forceDisposeEffect?: boolean): void;
    }
}
