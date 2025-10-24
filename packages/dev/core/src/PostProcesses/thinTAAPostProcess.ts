import type { Nullable, EffectWrapperCreationOptions, Scene } from "core/index";
import { Camera } from "../Cameras/camera";
import { Halton2DSequence } from "core/Maths/halton2DSequence";
import { Vector2 } from "core/Maths/math.vector";
import { EffectWrapper } from "core/Materials/effectRenderer";
import { TAAMaterialManager } from "./RenderPipeline/Pipelines/taaMaterialManager";

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
        if (this._taaMaterialManager) {
            this._taaMaterialManager.isEnabled = !value && this.reprojectHistory;
        }
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

    private _reprojectHistory = false;
    /**
     * Enables reprojecting the history texture with a per-pixel velocity.
     * If set the "velocitySampler" has to be provided.
     */
    public get reprojectHistory(): boolean {
        return this._reprojectHistory;
    }

    public set reprojectHistory(reproject: boolean) {
        if (this._reprojectHistory === reproject) {
            return;
        }
        this._reprojectHistory = reproject;

        if (reproject) {
            if (!this._taaMaterialManager) {
                this._taaMaterialManager = new TAAMaterialManager(this._scene);
            }
            // The velocity buffer may be old so reset for one frame
            this._reset();
        }

        if (this._taaMaterialManager) {
            this._taaMaterialManager.isEnabled = reproject && !this._disabled;
        }

        this._updateEffect();
    }

    private _clampHistory = false;
    /**
     * Clamps the history pixel to the min and max of the 3x3 pixels surrounding the target pixel.
     * This can help further reduce ghosting and artifacts.
     */
    public get clampHistory(): boolean {
        return this._clampHistory;
    }

    public set clampHistory(clamp: boolean) {
        if (this._clampHistory === clamp) {
            return;
        }
        this._clampHistory = clamp;
        this._updateEffect();
    }

    private _scene: Scene;
    private _hs: Halton2DSequence;
    private _firstUpdate = true;
    private _taaMaterialManager: Nullable<TAAMaterialManager>;

    /**
     * Constructs a new TAA post process
     * @param name Name of the effect
     * @param scene The scene the post process belongs to
     * @param options Options to configure the effect
     */
    constructor(name: string, scene: Scene, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: scene.getEngine(),
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinTAAPostProcess.FragmentUrl,
            uniforms: ThinTAAPostProcess.Uniforms,
            samplers: ThinTAAPostProcess.Samplers,
        });

        this._scene = scene;
        this._hs = new Halton2DSequence(this.samples);
    }

    /** @internal */
    public _reset(): void {
        this._hs.setDimensions(this._textureWidth / 2, this._textureHeight / 2);
        this._hs.next();
        this._firstUpdate = true;
    }

    /** @internal */
    public _updateJitter() {
        if (this.reprojectHistory && this._taaMaterialManager) {
            // Applying jitter to the projection matrix messes with the velocity buffer,
            // so we do it as a final vertex step in a material plugin instead
            this._nextJitterOffset(this._taaMaterialManager.jitter);
        } else {
            // Use the projection matrix by default since it supports most materials
            this._updateProjectionMatrix();
        }
    }

    protected _nextJitterOffset(output = new Vector2()): Vector2 {
        if (!this.camera || !this.camera.hasMoved || !this.disableOnCameraMove) {
            this._hs.next();
        }
        output.set(this._hs.x, this._hs.y);
        return output;
    }

    protected _updateProjectionMatrix(): void {
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

    public override dispose() {
        this._taaMaterialManager?.dispose();
        super.dispose();
    }

    private _updateEffect(): void {
        const defines: string[] = [];
        // There seems to be an issue where `updateEffect` sometimes doesn't include the initial samplers
        const samplers = ["textureSampler", "historySampler"];
        if (this._reprojectHistory) {
            defines.push("#define TAA_REPROJECT_HISTORY");
            samplers.push("velocitySampler");
        }
        if (this._clampHistory) {
            defines.push("#define TAA_CLAMP_HISTORY");
        }
        this.updateEffect(defines.join("\n"), null, samplers);
    }
}
