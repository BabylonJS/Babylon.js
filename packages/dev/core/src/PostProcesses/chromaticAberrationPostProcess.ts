import type { Vector2 } from "../Maths/math.vector";
import type { Nullable } from "../types";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Camera } from "../Cameras/camera";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";
import { ThinChromaticAberrationPostProcess } from "./thinChromaticAberrationPostProcess";

/**
 * The ChromaticAberrationPostProcess separates the rgb channels in an image to produce chromatic distortion around the edges of the screen
 */
export class ChromaticAberrationPostProcess extends PostProcess {
    /**
     * The amount of separation of rgb channels (default: 30)
     */
    @serialize()
    public get aberrationAmount() {
        return this._effectWrapper.aberrationAmount;
    }

    public set aberrationAmount(value: number) {
        this._effectWrapper.aberrationAmount = value;
    }

    /**
     * The amount the effect will increase for pixels closer to the edge of the screen. (default: 0)
     */
    @serialize()
    public get radialIntensity() {
        return this._effectWrapper.radialIntensity;
    }

    public set radialIntensity(value: number) {
        this._effectWrapper.radialIntensity = value;
    }

    /**
     * The normalized direction in which the rgb channels should be separated. If set to 0,0 radial direction will be used. (default: Vector2(0.707,0.707))
     */
    @serialize()
    public get direction() {
        return this._effectWrapper.direction;
    }

    public set direction(value: Vector2) {
        this._effectWrapper.direction = value;
    }

    /**
     * The center position where the radialIntensity should be around. [0.5,0.5 is center of screen, 1,1 is top right corner] (default: Vector2(0.5 ,0.5))
     */
    @serialize()
    public get centerPosition() {
        return this._effectWrapper.centerPosition;
    }

    public set centerPosition(value: Vector2) {
        this._effectWrapper.centerPosition = value;
    }

    /** The width of the screen to apply the effect on */
    @serialize()
    public get screenWidth() {
        return this._effectWrapper.screenWidth;
    }

    public set screenWidth(value: number) {
        this._effectWrapper.screenWidth = value;
    }

    /** The height of the screen to apply the effect on */
    @serialize()
    public get screenHeight() {
        return this._effectWrapper.screenHeight;
    }

    public set screenHeight(value: number) {
        this._effectWrapper.screenHeight = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "ChromaticAberrationPostProcess" string
     */
    public override getClassName(): string {
        return "ChromaticAberrationPostProcess";
    }

    protected override _effectWrapper: ThinChromaticAberrationPostProcess;

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
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        blockCompilation = false
    ) {
        const localOptions = {
            uniforms: ThinChromaticAberrationPostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinChromaticAberrationPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinChromaticAberrationPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });

        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
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
