declare module BABYLON {
    class ProceduralTexture extends Texture {
        private _size;
        public _generateMipMaps: boolean;
        private _doNotChangeAspectRatio;
        private _currentRefreshId;
        private _refreshRate;
        private _vertexBuffer;
        private _indexBuffer;
        private _effect;
        private _vertexDeclaration;
        private _vertexStrideSize;
        private _uniforms;
        private _samplers;
        private _fragment;
        public _textures: Texture[];
        private _floats;
        private _floatsArrays;
        private _colors3;
        private _colors4;
        private _vectors2;
        private _vectors3;
        private _matrices;
        private _fallbackTexture;
        private _fallbackTextureUsed;
        constructor(name: string, size: any, fragment: any, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public reset(): void;
        public isReady(): boolean;
        public resetRefreshCounter(): void;
        public setFragment(fragment: any): void;
        public refreshRate : number;
        public _shouldRender(): boolean;
        public getRenderSize(): number;
        public resize(size: any, generateMipMaps: any): void;
        private _checkUniform(uniformName);
        public setTexture(name: string, texture: Texture): ProceduralTexture;
        public setFloat(name: string, value: number): ProceduralTexture;
        public setFloats(name: string, value: number[]): ProceduralTexture;
        public setColor3(name: string, value: Color3): ProceduralTexture;
        public setColor4(name: string, value: Color4): ProceduralTexture;
        public setVector2(name: string, value: Vector2): ProceduralTexture;
        public setVector3(name: string, value: Vector3): ProceduralTexture;
        public setMatrix(name: string, value: Matrix): ProceduralTexture;
        public render(useCameraPostProcess?: boolean): void;
        public clone(): ProceduralTexture;
        public dispose(): void;
    }
}
