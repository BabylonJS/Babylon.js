/// <reference path="babylon.d.ts" />

interface WebGLProgram {

}

interface WebGLShader {

}

interface WebGLUniformLocation {

}

interface WebGLRenderingContext {

}

interface VertexBuffer {
    [index: number]: number;
}

interface IndexBuffer {
    [index: number]: number;
}

declare module BABYLON {
    interface Capabilities {
        maxTexturesImageUnits: number;
        maxTextureSize: number;
        maxCubemapTextureSize: number;
        maxRenderTextureSize: number;
    }

    class Engine {
        constructor(canvas: HTMLCanvasElement, antialias: boolean);

        getAspectRatio(): number; 
        getRenderWidth(): number;
        getRenderHeight(): number;
        getRenderingCanvas(): HTMLCanvasElement;
        setHardwareScalingLevel(level: number): void;
        getLoadedTexturesCache(): Texture[]; 
        getCaps(): Capabilities;

        switchFullscreen(element: HTMLElement);
        clear(color: IColor3, backBuffer: bool, depthStencil: bool);

        beginFrame(): void;
        endFrame(): void;
        resize(): void;
        bindFramebuffer(texture: Texture);
        unBindFramebuffer(texture: Texture);
        flushFramebuffer(): void;
        restoreDefaultFramebuffer(): void;

        createVertexBuffer(vertices: number[]): VertexBuffer;
        createVertexBuffer(vertices: ArrayBuffer): VertexBuffer;
        createVertexBuffer(vertices: ArrayBufferView): VertexBuffer;
        createDynamicVertexBuffer(capacity: number): VertexBuffer;
        updateDynamicVertexBuffer(vertexBuffer: VertexBuffer, vertices: number[]): void; 
        updateDynamicVertexBuffer(vertexBuffer: VertexBuffer, vertices: ArrayBuffer): void; 
        updateDynamicVertexBuffer(vertexBuffer: VertexBuffer, vertices: ArrayBufferView): void; 
        createIndexBuffer(indices, is32Bits): IndexBuffer;
        bindBuffers(vb: VertexBuffer, ib: IndexBuffer, vdecl: number[], strideSize: number, effect: Effect);
        _releaseBuffer(vb: VertexBuffer);
        draw(useTriangles: bool, indexStart: number, indexCount: number);
        createEffect(baseName: string, attributesNames: string, uniformsNames: string[],
            samplers: WebGLUniformLocation[],
            defines: string): Effect; 
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: string): WebGLProgram;
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[]; 
        enableEffect(effect: Effect): void;
        setMatrix(uniform: string, matrix: Matrix): void; 
        setVector2(uniform: string, x: number, y: number): void;  
        setVector3(uniform: string, v: Vector3): void; 
        setBool(uniform: string, val: bool): void;
        setVector4(uniform: string, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: string, color: Color3): void; 
        setColor4(uniform: string, color: Color3, alpha: number): void; 
        setState(cullingMode: number): void;
        setDepthBuffer(enable: bool): void;
        setDepthWrite(enable: bool): void;
        setColorWrite(enable: bool): void;
        setAlphaMode(mode: number): void;
        setAlphaTesting(enable: bool): void;
        getAlphaTesting(): bool;
        wipeCaches(): void;
        createTexture(url: string, noMipmap: bool, invertY: bool): Texture;
        createDynamicTexture(size: number, noMipmap: bool): Texture;
        updateDynamicTexture(texture: Texture, canvas: HTMLCanvasElement): void;
        createRenderTargetTexture(size: number, generateMipMaps: bool): Texture;
        createCubeTexture(rootUrl: string): Texture;
        _releaseTexture(tex: Texture): void;
        bindSamplers(effect: Effect): void;
        setTexture(channel: number, texture: Texture): void; 
        dispose(): void;

        static ShadersRepository: string;
        static ALPHA_DISABLE: number;
        static ALPHA_ADD: number;
        static ALPHA_COMBINE: number;
        static epsilon: number;
        static collisionEpsilon: number;
        static isSupported(): bool;
    }
}