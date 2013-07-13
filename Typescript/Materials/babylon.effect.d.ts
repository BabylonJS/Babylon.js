/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Effect {
        name: string;
        defines: string;

        constructor(baseName: string, attributesNames: string[], uniformsNames: string[], samplers: WebGLUniformLocation[], engine: Engine, defines: string);

        isReady(): bool;
        getProgram(): WebGLProgram;
        getAttribute(index: number): string;
        getAttributesCount(): number;
        getUniformIndex(uniformName: string): number;
        getUniform(uniformName: string): string;
        getSamplers(): WebGLUniformLocation[];

        _prepareEffect(vertexSourceCode: string, fragmentSourceCode: string, attributeNames: string[], defines: string): void;
        setTexture(channel: string, texture: Texture): void;
        setMatrix(uniformName: string, matrix: Matrix): void;
        setBool(uniformName: string, val: bool): void;
        setVector2(uniformName: string, x: number, y: number): void;
        setVector3(uniformName: string, val: Vector3): void;
        setVector4(uniformName: string, x: number, y: number, z: number, w: number): void;
        setColor3(uniformName: string, color: Color3): void;
        setColor4(uniformName: string, color: Color4): void;

        static ShadersStore: Object;
    }
}