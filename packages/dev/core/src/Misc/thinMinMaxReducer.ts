/* eslint-disable import/no-internal-modules */
import type { Nullable, EffectWrapperCreationOptions, AbstractEngine, InternalTexture, Scene } from "core/index";
import { Observable } from "./observable";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "core/Engines/engine";

/**
 * @internal
 */
export class ThinMinMaxReducerPostProcess extends EffectWrapper {
    public static readonly FragmentUrl = "minmaxRedux";

    public static readonly Uniforms = ["texSize"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/minmaxRedux.fragment"));
        } else {
            list.push(import("../Shaders/minmaxRedux.fragment"));
        }
    }

    public textureWidth = 0;

    public textureHeight = 0;

    constructor(name: string, engine: Nullable<AbstractEngine> = null, defines = "", options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinMinMaxReducerPostProcess.FragmentUrl,
            uniforms: ThinMinMaxReducerPostProcess.Uniforms,
            defines,
        });
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this.drawWrapper.effect!;

        if (this.textureWidth === 1 || this.textureHeight === 1) {
            effect.setInt2("texSize", this.textureWidth, this.textureHeight);
        } else {
            effect.setFloat2("texSize", this.textureWidth, this.textureHeight);
        }
    }
}

const Buffer = new Float32Array(4 * 1 * 1);
const MinMax = { min: 0, max: 0 };

/**
 * @internal
 */
export class ThinMinMaxReducer {
    public readonly onAfterReductionPerformed = new Observable<{ min: number; max: number }>();

    public readonly reductionSteps: Array<ThinMinMaxReducerPostProcess>;

    private _depthRedux: boolean;

    public get depthRedux() {
        return this._depthRedux;
    }

    public set depthRedux(value: boolean) {
        if (this._depthRedux === value) {
            return;
        }

        this._depthRedux = value;

        this._recreatePostProcesses();
    }

    protected _scene: Scene;

    private _textureWidth = 0;
    private _textureHeight = 0;

    public get textureWidth() {
        return this._textureWidth;
    }

    public get textureHeight() {
        return this._textureHeight;
    }

    constructor(scene: Scene, depthRedux = true) {
        this._scene = scene;
        this._depthRedux = depthRedux;
        this.reductionSteps = [];
    }

    public setTextureDimensions(width: number, height: number) {
        if (width === this._textureWidth && height === this._textureHeight) {
            return false;
        }

        this._textureWidth = width;
        this._textureHeight = height;

        this._recreatePostProcesses();

        return true;
    }

    public readMinMax(texture: InternalTexture) {
        // Note that we should normally await the call to _readTexturePixels!
        // But because WebGL does the read synchronously, we know the values will be updated without waiting for the promise to be resolved, which will let us get the updated values
        // in the current frame, whereas in WebGPU, the read is asynchronous and we should normally wait for the promise to be resolved to get the updated values.
        // However, it's safe to avoid waiting for the promise to be resolved in WebGPU as well, because we will simply use the current values until "buffer" is updated later on.
        // Note that it means we can suffer some rendering artifacts in WebGPU because we may use previous min/max values for the current frame.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._scene.getEngine()._readTexturePixels(texture, 1, 1, -1, 0, Buffer, false);

        MinMax.min = Buffer[0];
        MinMax.max = Buffer[1];

        if (MinMax.min >= MinMax.max) {
            MinMax.min = 0;
            MinMax.max = 1;
        }

        this.onAfterReductionPerformed.notifyObservers(MinMax);
    }

    public dispose(disposeAll = true): void {
        if (disposeAll) {
            this.onAfterReductionPerformed.clear();
            this._textureWidth = 0;
            this._textureHeight = 0;
        }

        for (let i = 0; i < this.reductionSteps.length; ++i) {
            this.reductionSteps[i].dispose();
        }
        this.reductionSteps.length = 0;
    }

    private _recreatePostProcesses() {
        this.dispose(false);

        const scene = this._scene;

        let w = this.textureWidth,
            h = this.textureHeight;

        const reductionInitial = new ThinMinMaxReducerPostProcess(
            "Initial reduction phase",
            scene.getEngine(),
            "#define INITIAL" + (this._depthRedux ? "\n#define DEPTH_REDUX" : "")
        );

        reductionInitial.textureWidth = w;
        reductionInitial.textureHeight = h;

        this.reductionSteps.push(reductionInitial);

        let index = 1;

        // create the additional steps
        while (w > 1 || h > 1) {
            w = Math.max(Math.round(w / 2), 1);
            h = Math.max(Math.round(h / 2), 1);

            const reduction = new ThinMinMaxReducerPostProcess(
                "Reduction phase " + index,
                scene.getEngine(),
                "#define " + (w == 1 && h == 1 ? "LAST" : w == 1 || h == 1 ? "ONEBEFORELAST" : "MAIN")
            );

            reduction.textureWidth = w;
            reduction.textureHeight = h;

            this.reductionSteps.push(reduction);

            index++;
        }
    }
}
