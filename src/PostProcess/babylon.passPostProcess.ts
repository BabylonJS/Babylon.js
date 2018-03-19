﻿module BABYLON {
    export class PassPostProcess extends PostProcess {    
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
            super(name, "pass", null, null, options, camera, samplingMode, engine, reusable, undefined, textureType, undefined, null, blockCompilation);
        }
    }
} 