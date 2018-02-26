module BABYLON {
    export class HighlightsPostProcess extends PostProcess {
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "highlights", null, null, options, camera, samplingMode, engine, reusable, null, textureType);
        }
    }
} 