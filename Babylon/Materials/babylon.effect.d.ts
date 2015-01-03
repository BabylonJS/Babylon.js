declare module BABYLON {
    class EffectFallbacks {
        private _defines;
        private _currentRank;
        private _maxRank;
        public addFallback(rank: number, define: string): void;
        public isMoreFallbacks : boolean;
        public reduce(currentDefines: string): string;
    }
    class Effect {
        public name: any;
        public defines: string;
        public onCompiled: (effect: Effect) => void;
        public onError: (effect: Effect, errors: string) => void;
        public onBind: (effect: Effect) => void;
        private _engine;
        private _uniformsNames;
        private _samplers;
        private _isReady;
        private _compilationError;
        private _attributesNames;
        private _attributes;
        private _uniforms;
        public _key: string;
        private _program;
        private _valueCache;
        constructor(baseName: any, attributesNames: string[], uniformsNames: string[], samplers: string[], engine: any, defines?: string, fallbacks?: EffectFallbacks, onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void);
        public isReady(): boolean;
        public getProgram(): WebGLProgram;
        public getAttributesNames(): string[];
        public getAttributeLocation(index: number): number;
        public getAttributeLocationByName(name: string): number;
        public getAttributesCount(): number;
        public getUniformIndex(uniformName: string): number;
        public getUniform(uniformName: string): WebGLUniformLocation;
        public getSamplers(): string[];
        public getCompilationError(): string;
        public _loadVertexShader(vertex: any, callback: (data: any) => void): void;
        public _loadFragmentShader(fragment: any, callback: (data: any) => void): void;
        private _prepareEffect(vertexSourceCode, fragmentSourceCode, attributesNames, defines, fallbacks?);
        public _bindTexture(channel: string, texture: WebGLTexture): void;
        public setTexture(channel: string, texture: BaseTexture): void;
        public setTextureFromPostProcess(channel: string, postProcess: PostProcess): void;
        public _cacheFloat2(uniformName: string, x: number, y: number): void;
        public _cacheFloat3(uniformName: string, x: number, y: number, z: number): void;
        public _cacheFloat4(uniformName: string, x: number, y: number, z: number, w: number): void;
        public setArray(uniformName: string, array: number[]): Effect;
        public setMatrices(uniformName: string, matrices: Float32Array): Effect;
        public setMatrix(uniformName: string, matrix: Matrix): Effect;
        public setFloat(uniformName: string, value: number): Effect;
        public setBool(uniformName: string, bool: boolean): Effect;
        public setVector2(uniformName: string, vector2: Vector2): Effect;
        public setFloat2(uniformName: string, x: number, y: number): Effect;
        public setVector3(uniformName: string, vector3: Vector3): Effect;
        public setFloat3(uniformName: string, x: number, y: number, z: number): Effect;
        public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): Effect;
        public setColor3(uniformName: string, color3: Color3): Effect;
        public setColor4(uniformName: string, color3: Color3, alpha: number): Effect;
        static ShadersStore: {};
    }
}
