import { Vector2 } from "../Maths/math.vector";
import type { Nullable } from "../types";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Effect } from "../Materials/effect";
import type { Camera } from "../Cameras/camera";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";

/**
 * The ChromaticAberrationPostProcess separates the rgb channels in an image to produce chromatic distortion around the edges of the screen
 */
export class ChromaticAberrationPostProcess extends PostProcess {
    /**
     * The amount of separation of rgb channels (default: 30)
     */
    @serialize()
    aberrationAmount = 30;

    /**
     * The amount the effect will increase for pixels closer to the edge of the screen. (default: 0)
     */
    @serialize()
    radialIntensity = 0;

    /**
     * The normalized direction in which the rgb channels should be separated. If set to 0,0 radial direction will be used. (default: Vector2(0.707,0.707))
     */
    @serialize()
    direction = new Vector2(0.707, 0.707);

    /**
     * The center position where the radialIntensity should be around. [0.5,0.5 is center of screen, 1,1 is top right corner] (default: Vector2(0.5 ,0.5))
     */
    @serialize()
    centerPosition = new Vector2(0.5, 0.5);

    /** The width of the screen to apply the effect on */
    @serialize()
    screenWidth: number;

    /** The height of the screen to apply the effect on */
    @serialize()
    screenHeight: number;

    /**
     * Gets a string identifying the name of the class
     * @returns "ChromaticAberrationPostProcess" string
     */
    public override getClassName(): string {
        return "ChromaticAberrationPostProcess";
    }

    /**
     * Creates a new instance ChromaticAberrationPostProcess
     * @param name The name of the effect.
     * @param screenWidth The width of the screen to apply the effect on.
     * @param screenHeight The height of the screen to apply the effect on.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        screenWidth: number,
        screenHeight: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(
            name,
            "chromaticAberration",
            ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"],
            [],
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            null,
            textureType,
            undefined,
            null,
            blockCompilation
        );

        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat("chromatic_aberration", this.aberrationAmount);
            effect.setFloat("screen_width", screenWidth);
            effect.setFloat("screen_height", screenHeight);
            effect.setFloat("radialIntensity", this.radialIntensity);
            effect.setFloat2("direction", this.direction.x, this.direction.y);
            effect.setFloat2("centerPosition", this.centerPosition.x, this.centerPosition.y);
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/chromaticAberration.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/chromaticAberration.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<ChromaticAberrationPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new ChromaticAberrationPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.screenWidth,
                    parsedPostProcess.screenHeight,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable,
                    parsedPostProcess.textureType,
                    false
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.ChromaticAberrationPostProcess", ChromaticAberrationPostProcess);
