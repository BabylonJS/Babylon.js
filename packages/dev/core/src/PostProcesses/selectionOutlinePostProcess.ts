import type { Effect } from "../Materials/effect";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { Color3 } from "../Maths/math.color";
import { serialize } from "../Misc/decorators";
import { Logger } from "../Misc/logger";
import { RegisterClass } from "../Misc/typeStore";
import type { Nullable } from "../types";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { ThinSelectionOutlinePostProcess } from "./thinSelectionOutlinePostProcess";

/**
 * Post process used to render an outline around selected objects
 */
export class SelectionOutlinePostProcess extends PostProcess {
    /**
     * Gets or sets the outline color
     */
    @serialize()
    public get outlineColor(): Color3 {
        return this._effectWrapper.outlineColor;
    }
    public set outlineColor(value: Color3) {
        this._effectWrapper.outlineColor = value;
    }

    /**
     * Gets or sets the outline thickness
     */
    @serialize()
    public get outlineThickness(): number {
        return this._effectWrapper.outlineThickness;
    }
    public set outlineThickness(value: number) {
        this._effectWrapper.outlineThickness = value;
    }

    /**
     * Gets or sets the occlusion strength
     */
    @serialize()
    public get occlusionStrength(): number {
        return this._effectWrapper.occlusionStrength;
    }
    public set occlusionStrength(value: number) {
        this._effectWrapper.occlusionStrength = value;
    }

    declare protected _effectWrapper: ThinSelectionOutlinePostProcess;
    private _maskTexture: Nullable<RenderTargetTexture> = null;
    private _depthTexture: Nullable<RenderTargetTexture> = null;

    /**
     * Constructs a new selection outline post process
     * @param name The name of the effect
     * @param maskTexture The mask texture
     * @param depthTexture The depth texture
     * @param options The options for the post process
     */
    public constructor(name: string, maskTexture: RenderTargetTexture, depthTexture: RenderTargetTexture, options: PostProcessOptions) {
        const localOptions: PostProcessOptions = {
            uniforms: ThinSelectionOutlinePostProcess.Uniforms,
            samplers: ThinSelectionOutlinePostProcess.Samplers,
            camera: maskTexture.activeCamera, // camera must be same as the one used to render the mask texture
            ...options,
        };

        super(name, ThinSelectionOutlinePostProcess.FragmentUrl, {
            effectWrapper: !options.effectWrapper ? new ThinSelectionOutlinePostProcess(name, options.engine, localOptions) : undefined,
            ...localOptions,
        });

        this._maskTexture = maskTexture;
        this._depthTexture = depthTexture;
        this.onApplyObservable.add((effect: Effect) => {
            if (!this._maskTexture) {
                Logger.Warn("No mask texture set on SelectionOutlinePostProcess");
                return;
            }

            this._effectWrapper.textureWidth = this.width;
            this._effectWrapper.textureHeight = this.height;

            effect.setTexture("maskSampler", this._maskTexture);
            effect.setTexture("depthSampler", this._depthTexture);
        });
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "SelectionOutlinePostProcess" string
     */
    public override getClassName(): string {
        return "SelectionOutlinePostProcess";
    }

    /**
     * Sets the mask texture
     * @param value The mask texture
     */
    public set maskTexture(value: RenderTargetTexture) {
        this._maskTexture = value;
    }

    /**
     * Sets the depth texture
     * @param value The depth texture
     */
    public set depthTexture(value: RenderTargetTexture) {
        this._depthTexture = value;
    }
}

RegisterClass("BABYLON.SelectionOutlinePostProcess", SelectionOutlinePostProcess);
