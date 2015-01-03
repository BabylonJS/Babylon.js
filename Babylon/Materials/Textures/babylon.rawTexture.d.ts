declare module BABYLON {
    class RawTexture extends Texture {
        constructor(data: ArrayBufferView, width: number, height: number, format: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number);
        static CreateLuminanceTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateLuminanceAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
        static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps?: boolean, invertY?: boolean, samplingMode?: number): RawTexture;
    }
}
