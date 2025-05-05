// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { Camera } from "../Cameras/camera";
import { Halton2DSequence } from "core/Maths/halton2DSequence";
import { Engine } from "core/Engines/engine";
import { EffectWrapper } from "core/Materials/effectRenderer";

/**
 * Simple implementation of Temporal Anti-Aliasing (TAA).
 * This can be used to improve image quality for still pictures (screenshots for e.g.).
 */
export class ThinTAAPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "taa";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["factor"];

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["historySampler"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/taa.fragment"));
        } else {
            list.push(import("../Shaders/taa.fragment"));
        }
    }

    private _samples = 8;
    /**
     * Number of accumulated samples (default: 8)
     */
    public set samples(samples: number) {
        if (this._samples === samples) {
            return;
        }

        this._samples = samples;
        this._hs.regenerate(samples);
    }

    public get samples(): number {
        return this._samples;
    }

    /**
     * The factor used to blend the history frame with current frame (default: 0.05)
     */
    public factor = 0.05;

    /**
     * The camera to use for the post process
     */
    public camera: Nullable<Camera>;

    private _disabled = false;
    /**
     * Whether the TAA is disabled
     */
    public get disabled() {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        if (this._disabled === value) {
            return;
        }
        this._disabled = value;
        this._reset();
    }

    private _textureWidth = 0;
    /**
     * The width of the texture in which to render
     */
    public get textureWidth() {
        return this._textureWidth;
    }

    public set textureWidth(width: number) {
        if (this._textureWidth === width) {
            return;
        }
        this._textureWidth = width;
        this._reset();
    }

    private _textureHeight = 0;
    /**
     * The height of the texture in which to render
     */
    public get textureHeight() {
        return this._textureHeight;
    }

    public set textureHeight(height: number) {
        if (this._textureHeight === height) {
            return;
        }
        this._textureHeight = height;
        this._reset();
    }

    /**
     * Disable TAA on camera move (default: true).
     * You generally want to keep this enabled, otherwise you will get a ghost effect when the camera moves (but if it's what you want, go for it!)
     */
    public disableOnCameraMove = true;

    private _hs: Halton2DSequence;
    private _firstUpdate = true;

    /**
     * Constructs a new TAA post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinTAAPostProcess.FragmentUrl,
            uniforms: ThinTAAPostProcess.Uniforms,
            samplers: ThinTAAPostProcess.Samplers,
        });

        this._hs = new Halton2DSequence(this.samples);
    }

    /** @internal */
    public _reset(): void {
        this._hs.setDimensions(this._textureWidth / 2, this._textureHeight / 2);
        this._hs.next();
        this._firstUpdate = true;
    }

    public updateProjectionMatrix(): void {
        if (this.disabled) {
            return;
        }

        if (this.camera && !this.camera.hasMoved) {
            if (this.camera.mode === Camera.PERSPECTIVE_CAMERA) {
                const projMat = this.camera.getProjectionMatrix();
                projMat.setRowFromFloats(2, this._hs.x, this._hs.y, projMat.m[10], projMat.m[11]);
            } else {
                // We must force the update of the projection matrix so that m[12] and m[13] are recomputed, as we modified them the previous frame
                const projMat = this.camera.getProjectionMatrix(true);
                projMat.setRowFromFloats(3, this._hs.x + projMat.m[12], this._hs.y + projMat.m[13], projMat.m[14], projMat.m[15]);
            }
        }

        this._hs.next();
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        if (this.disabled) {
            return;
        }

        const effect = this._drawWrapper.effect!;

        effect.setFloat("factor", (this.camera?.hasMoved && this.disableOnCameraMove) || this._firstUpdate ? 1 : this.factor);

        this._firstUpdate = false;
    }
}
