import { Nullable } from "../types";
import { Constants } from "../Engines/constants";
import { Camera } from "../Cameras/camera";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";

import "../Shaders/pass.fragment";
import "../Shaders/passCube.fragment";

/**
 * PassPostProcess which produces an output the same as it's input
 */
export class PassPostProcess extends PostProcess {
    /**
     * Creates the PassPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        super(name, "pass", null, null, options, camera, samplingMode, engine, reusable, undefined, textureType, undefined, null, blockCompilation);
    }
}

/**
 * PassCubePostProcess which produces an output the same as it's input (which must be a cube texture)
 */
export class PassCubePostProcess extends PostProcess {
    private _face = 0;

    /**
     * Gets or sets the cube face to display.
     *  * 0 is +X
     *  * 1 is -X
     *  * 2 is +Y
     *  * 3 is -Y
     *  * 4 is +Z
     *  * 5 is -Z
     */
    public get face(): number {
        return this._face;
    }

    public set face(value: number) {
        if (value < 0 || value > 5) {
            return;
        }

        this._face = value;
        switch (this._face) {
            case 0:
                this.updateEffect("#define POSITIVEX");
                break;
            case 1:
                this.updateEffect("#define NEGATIVEX");
                break;
            case 2:
                this.updateEffect("#define POSITIVEY");
                break;
            case 3:
                this.updateEffect("#define NEGATIVEY");
                break;
            case 4:
                this.updateEffect("#define POSITIVEZ");
                break;
            case 5:
                this.updateEffect("#define NEGATIVEZ");
                break;
        }
    }

    /**
     * Creates the PassCubePostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera> = null, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        super(name, "passCube", null, null, options, camera, samplingMode, engine, reusable, "#define POSITIVEX", textureType, undefined, null, blockCompilation);
    }
}

Engine._RescalePostProcessFactory = (engine: Engine) => {
    return new PassPostProcess("rescale", 1, null, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_INT);
};