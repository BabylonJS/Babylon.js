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

        forceWireframe: boolean;
        cullBackFaces: boolean;
        scenes: Scene[];
        isPointerLock: boolean;

        getAspectRatio(): number; 
        getRenderWidth(): number;
        getRenderHeight(): number;
        getRenderingCanvas(): HTMLCanvasElement;
        setHardwareScalingLevel(level: number): void;
        getLoadedTexturesCache(): Texture[]; 
        getCaps(): Capabilities;

        stopRenderLoop(): void;
        runRenderLoop(renderFunction: Function): void;

        switchFullscreen(element: HTMLElement);
        clear(color: IColor3, backBuffer: boolean, depthStencil: boolean);

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
        bindMultiBuffers(vertexBuffers: VertexBuffer[], indexBuffer: IndexBuffer, effect: Effect): void;
        _releaseBuffer(vb: VertexBuffer);
        draw(useTriangles: boolean, indexStart: number, indexCount: number);
        createEffect(baseName: string, attributesNames: string, uniformsNames: string[],
            samplers: WebGLUniformLocation[],
            defines: string): Effect; 
        createShaderProgram(vertexCode: string, fragmentCode: string, defines: string): WebGLProgram;
        getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[];
        getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[]; 
        enableEffect(effect: Effect): void;
        setMatrices(uniform: string, matrices: Matrix[]): void;
        setMatrix(uniform: string, matrix: Matrix): void; 
        setVector2(uniform: string, x: number, y: number): void;  
        setVector3(uniform: string, v: Vector3): void; 
        setFloat2(uniform: string, x: number, y: number): void;
        setFloat3(uniform: string, x: number, y: number, z: number): void;
        setBool(uniform: string, val: boolean): void;
        setFloat4(uniform: string, x: number, y: number, z: number, w: number): void;
        setColor3(uniform: string, color: Color3): void; 
        setColor4(uniform: string, color: Color3, alpha: number): void; 
        setState(cullingMode: number): void;
        setDepthBuffer(enable: boolean): void;
        setDepthWrite(enable: boolean): void;
        setColorWrite(enable: boolean): void;
        setAlphaMode(mode: number): void;
        setAlphaTesting(enable: boolean): void;
        getAlphaTesting(): boolean;
        wipeCaches(): void;
        getExponantOfTwo(value: number, max: number): number;
        createTexture(url: string, noMipmap: boolean, invertY: boolean, scene: Scene): Texture;
        createDynamicTexture(size: number, noMipmap: boolean): Texture;
        updateDynamicTexture(texture: Texture, canvas: HTMLCanvasElement, invertY: boolean): void;
        updateVideoTexture(texture: Texture, video: HTMLVideoElement): void;
        createRenderTargetTexture(size: number, generateMipMaps: boolean): Texture;
        createCubeTexture(rootUrl: string, scene: Scene): Texture;
        _releaseTexture(tex: Texture): void;
        bindSamplers(effect: Effect): void;
        setTexture(channel: number, texture: Texture): void; 
        dispose(): void;

        static ShadersRepository: string;

        static ALPHA_DISABLE: number;
        static ALPHA_ADD: number;
        static ALPHA_COMBINE: number;

        static DELAYLOADSTATE_NONE: number;
        static DELAYLOADSTATE_LOADED: number;
        static DELAYLOADSTATE_LOADING: number;
        static DELAYLOADSTATE_NOTLOADED: number;

        static epsilon: number;
        static collisionEpsilon: number;

        static isSupported(): boolean;
    }
}