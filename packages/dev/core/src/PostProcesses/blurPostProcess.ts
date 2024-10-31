import type { Vector2 } from "../Maths/math.vector";
import type { Nullable } from "../types";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import { Constants } from "../Engines/constants";
import { RegisterClass } from "../Misc/typeStore";
import { serialize, serializeAsVector2 } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";

/**
 * The Blur Post Process which blurs an image based on a kernel and direction.
 * Can be used twice in x and y directions to perform a gaussian blur in two passes.
 */
export class BlurPostProcess extends PostProcess {
    /** The direction in which to blur the image. */
    @serializeAsVector2()
    public get direction() {
        return this._effectWrapper.direction;
    }

    public set direction(value: Vector2) {
        this._effectWrapper.direction = value;
    }

    /**
     * Sets the length in pixels of the blur sample region
     */
    @serialize()
    public set kernel(v: number) {
        this._effectWrapper.kernel = v;
    }

    /**
     * Gets the length in pixels of the blur sample region
     */
    public get kernel(): number {
        return this._effectWrapper.kernel;
    }

    /**
     * Sets whether or not the blur needs to unpack/repack floats
     */
    @serialize()
    public set packedFloat(v: boolean) {
        this._effectWrapper.packedFloat = v;
    }

    /**
     * Gets whether or not the blur is unpacking/repacking floats
     */
    public get packedFloat(): boolean {
        return this._effectWrapper.packedFloat;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "BlurPostProcess" string
     */
    public override getClassName(): string {
        return "BlurPostProcess";
    }

    protected override _effectWrapper: ThinBlurPostProcess;

    /**
     * Creates a new instance BlurPostProcess
     * @param name The name of the effect.
     * @param direction The direction in which to blur the image.
     * @param kernel The size of the kernel to be used when computing the blur. eg. Size of 3 will blur the center pixel by 2 pixels surrounding it.
     * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param defines
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
     */
    constructor(
        name: string,
        direction: Vector2,
        kernel: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode: number = Texture.BILINEAR_SAMPLINGMODE,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT,
        defines = "",
        blockCompilation = false,
        textureFormat = Constants.TEXTUREFORMAT_RGBA
    ) {
        const blockCompilationFinal = typeof options === "number" ? blockCompilation : !!options.blockCompilation;
        const localOptions = {
            uniforms: ThinBlurPostProcess.Uniforms,
            samplers: ThinBlurPostProcess.Samplers,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            vertexUrl: ThinBlurPostProcess.VertexUrl,
            indexParameters: { varyingCount: 0, depCount: 0 },
            textureFormat,
            defines,
            ...(options as PostProcessOptions),
            blockCompilation: true,
        };

        super(name, ThinBlurPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinBlurPostProcess(name, engine, undefined, undefined, localOptions) : undefined,
            ...localOptions,
        });

        this._effectWrapper.options.blockCompilation = blockCompilationFinal;

        this.direction = direction;
        this.onApplyObservable.add(() => {
            this._effectWrapper.textureWidth = this._outputTexture ? this._outputTexture.width : this.width;
            this._effectWrapper.textureHeight = this._outputTexture ? this._outputTexture.height : this.height;
        });

        this.kernel = kernel;
    }

    public override updateEffect(
        _defines: Nullable<string> = null,
        _uniforms: Nullable<string[]> = null,
        _samplers: Nullable<string[]> = null,
        _indexParameters?: any,
        onCompiled?: (effect: Effect) => void,
        onError?: (effect: Effect, errors: string) => void
    ) {
        this._effectWrapper._updateParameters(onCompiled, onError);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<BlurPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new BlurPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.direction,
                    parsedPostProcess.kernel,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable,
                    parsedPostProcess.textureType,
                    undefined,
                    false
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.BlurPostProcess", BlurPostProcess);
