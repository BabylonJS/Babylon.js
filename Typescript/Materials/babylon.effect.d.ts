/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Effect {
        name: string;
        defines: string;

        constructor(baseName: string, attributesNames: string[], uniformsNames: string[], samplers: WebGLUniformLocation[], engine: Engine, defines: string);

        isReady(): boolean;
        getProgram(): WebGLProgram;
        getAttribute(index: number): string;
        getAttributesNames(): string;
        getAttributesCount(): number;
        getUniformIndex(uniformName: string): number;
        getUniform(uniformName: string): string;
        getSamplers(): WebGLUniformLocation[];
        getCompilationError(): string;

        _prepareEffect(vertexSourceCode: string, fragmentSourceCode: string, attributeNames: string[], defines: string): void;
        setTexture(channel: string, texture: Texture): void;
        setMatrices(uniformName: string, matrices: Matrix[]): void;
        setMatrix(uniformName: string, matrix: Matrix): void;
        setBool(uniformName: string, val: boolean): void;
        setVector3(uniformName: string, val: Vector3): void;
        setFloat2(uniformName: string, x: number, y: number);
        setFloat3(uniformName: string, x: number, y: number, z: number);
        setFloat4(uniformName: string, x: number, y: number, z: number, w: number);
        setColor3(uniformName: string, color: Color3): void;
        setColor4(uniformName: string, color: Color4): void;

        static ShadersStore: Object;
    }
}