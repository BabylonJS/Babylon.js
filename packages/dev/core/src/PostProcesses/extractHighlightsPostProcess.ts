import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { serialize } from "../Misc/decorators";
import { RegisterClass } from "../Misc/typeStore";
import { ThinExtractHighlightsPostProcess } from "./thinExtractHighlightsPostProcess";

/**
 * The extract highlights post process sets all pixels to black except pixels above the specified luminance threshold. Used as the first step for a bloom effect.
 */
export class ExtractHighlightsPostProcess extends PostProcess {
    /**
     * The luminance threshold, pixels below this value will be set to black.
     */
    @serialize()
    public get threshold() {
        return this._effectWrapper.threshold;
    }

    public set threshold(value: number) {
        this._effectWrapper.threshold = value;
    }

    /** @internal */
    public get _exposure() {
        return this._effectWrapper._exposure;
    }

    /** @internal */
    public set _exposure(value: number) {
        this._effectWrapper._exposure = value;
    }

    /**
     * Post process which has the input texture to be used when performing highlight extraction
     * @internal
     */
    public _inputPostProcess: Nullable<PostProcess> = null;

    /**
     * Gets a string identifying the name of the class
     * @returns "ExtractHighlightsPostProcess" string
     */
    public override getClassName(): string {
        return "ExtractHighlightsPostProcess";
    }

    protected override _effectWrapper: ThinExtractHighlightsPostProcess;

    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        const localOptions = {
            uniforms: ThinExtractHighlightsPostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinExtractHighlightsPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinExtractHighlightsPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });

        this.onApplyObservable.add((effect: Effect) => {
            this.externalTextureSamplerBinding = !!this._inputPostProcess;
            if (this._inputPostProcess) {
                effect.setTextureFromPostProcess("textureSampler", this._inputPostProcess);
            }
        });
    }
}

RegisterClass("BABYLON.ExtractHighlightsPostProcess", ExtractHighlightsPostProcess);
