﻿module BABYLON {
    export class RawTexture extends Texture {
        constructor(data: ArrayBufferView, width: number, height: number, format: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, !generateMipMaps, invertY);

            this._texture = scene.getEngine().createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode);

            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;
        }

        // Statics
        public static CreateLuminanceTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): RawTexture {
            return new RawTexture(data, width, height, Engine.TEXTUREFORMAT_LUMINANCE, scene, generateMipMaps, invertY, samplingMode);
        }

        public static CreateLuminanceAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): RawTexture {
            return new RawTexture(data, width, height, Engine.TEXTUREFORMAT_LUMINANCE_ALPHA, scene, generateMipMaps, invertY, samplingMode);
        }

        public static CreateAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): RawTexture {
            return new RawTexture(data, width, height, Engine.TEXTUREFORMAT_ALPHA, scene, generateMipMaps, invertY, samplingMode);
        }

        public static CreateRGBTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): RawTexture {
            return new RawTexture(data, width, height, Engine.TEXTUREFORMAT_RGB, scene, generateMipMaps, invertY, samplingMode);
        }

        public static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): RawTexture {
            return new RawTexture(data, width, height, Engine.TEXTUREFORMAT_RGBA, scene, generateMipMaps, invertY, samplingMode);
        }
    }
}