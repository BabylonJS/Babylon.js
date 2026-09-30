import { type Nullable, type EffectWrapperCreationOptions, type AbstractEngine, type InternalTexture, type Scene } from "core/index";
import { Observable } from "./observable";
import { EffectWrapper } from "../Materials/effectRenderer.pure";
import { EngineStore } from "core/Engines/engineStore";
import { Constants } from "../Engines/constants";
import { Logger } from "./logger";

/**
 * @internal
 */
export const enum DepthTextureType {
    NormalizedViewDepth = 0,
    ViewDepth = 1,
    ScreenDepth = 2,
}

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

    public useIntegerTextureSize = false;

    constructor(name: string, engine: Nullable<AbstractEngine> = null, defines = "", options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || EngineStore.LastCreatedEngine!,
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

        if (this.useIntegerTextureSize) {
            effect.setInt2("texSize", this.textureWidth, this.textureHeight);
        } else {
            effect.setFloat2("texSize", this.textureWidth, this.textureHeight);
        }
    }
}

const BufferFloat = new Float32Array(4 * 1 * 1);
const BufferUint8 = new Uint8Array(4 * 1 * 1);
const MinMax = { min: 0, max: 0 };

/**
 * @internal
 */
export class ThinMinMaxReducer {
    public readonly onAfterReductionPerformed = new Observable<{ min: number; max: number }>();

    public readonly reductionSteps: Array<ThinMinMaxReducerPostProcess>;

    /**
     * Wait for WebGPU readback before notifying observers (default: false).
     * Notifications are asynchronous in this mode; WebGL readback remains synchronous.
     */
    public waitForReadback = false;

    private _depthRedux: boolean;
    private _depthTextureType: DepthTextureType;
    private _waitBufferFloat?: Float32Array;
    private _waitBufferUint8?: Uint8Array;
    private _waitMinMax?: { min: number; max: number };
    private _readbackPending = false;
    private _readbackGeneration = 0;

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

    protected readonly _scene: Scene;

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

    public setTextureDimensions(width: number, height: number, depthTextureType: DepthTextureType = DepthTextureType.NormalizedViewDepth) {
        if (width === this._textureWidth && height === this._textureHeight && depthTextureType === this._depthTextureType) {
            return false;
        }

        this._textureWidth = width;
        this._textureHeight = height;
        this._depthTextureType = depthTextureType;

        this._recreatePostProcesses();

        return true;
    }

    public readMinMax(texture: InternalTexture, fallbackToFullRange = true) {
        const isFloat = texture.type === Constants.TEXTURETYPE_FLOAT || texture.type === Constants.TEXTURETYPE_HALF_FLOAT;
        const engine = this._scene.getEngine();

        if (this.waitForReadback && engine.isWebGPU) {
            if (this._readbackPending) {
                return;
            }

            const buffer = isFloat ? (this._waitBufferFloat ??= new Float32Array(4)) : (this._waitBufferUint8 ??= new Uint8Array(4));
            const result = (this._waitMinMax ??= { min: 0, max: 0 });
            const generation = this._readbackGeneration;
            const readback = engine._readTexturePixels(texture, 1, 1, -1, 0, buffer, false);
            this._readbackPending = true;

            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._completeReadbackAsync(readback, buffer, isFloat, fallbackToFullRange, generation, result);
            return;
        }

        // WebGL readback updates the buffer synchronously. WebGPU's default path deliberately
        // notifies with the previous values rather than waiting for its asynchronous readback.
        const buffer = isFloat ? BufferFloat : BufferUint8;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        engine._readTexturePixels(texture, 1, 1, -1, 0, buffer, false);

        this._notifyMinMax(buffer, isFloat, fallbackToFullRange, MinMax);
    }

    private async _completeReadbackAsync(
        readback: Promise<ArrayBufferView>,
        buffer: Float32Array | Uint8Array,
        isFloat: boolean,
        fallbackToFullRange: boolean,
        generation: number,
        result: { min: number; max: number }
    ): Promise<void> {
        try {
            await readback;
            if (generation === this._readbackGeneration && this.waitForReadback) {
                this._notifyMinMax(buffer, isFloat, fallbackToFullRange, result);
            }
        } catch (error) {
            Logger.Error(`ThinMinMaxReducer: Failed to complete min/max readback: ${error}`);
        } finally {
            this._readbackPending = false;
        }
    }

    private _notifyMinMax(buffer: Float32Array | Uint8Array, isFloat: boolean, fallbackToFullRange: boolean, result: { min: number; max: number }) {
        result.min = buffer[0];
        result.max = buffer[1];

        if (!isFloat) {
            result.min /= 255.0;
            result.max /= 255.0;
        }

        if (fallbackToFullRange && result.min >= result.max) {
            result.min = 0;
            result.max = 1;
        }

        this.onAfterReductionPerformed.notifyObservers(result);
    }

    public dispose(disposeAll = true): void {
        this._readbackGeneration++;
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
            "#define INITIAL" +
                (w === 1 || h === 1 ? "\n#define CLAMP_REDUCTION_COORDS" : "") +
                (this._depthRedux ? "\n#define DEPTH_REDUX" : "") +
                (this._depthTextureType === DepthTextureType.ViewDepth ? "\n#define VIEW_DEPTH" : "")
        );

        reductionInitial.textureWidth = w;
        reductionInitial.textureHeight = h;

        this.reductionSteps.push(reductionInitial);

        let index = 1;

        // create the additional steps
        while (w > 1 || h > 1 || (w === 1 && h === 1 && index === 1)) {
            w = Math.max(Math.round(w / 2), 1);
            h = Math.max(Math.round(h / 2), 1);

            const reduction = new ThinMinMaxReducerPostProcess(
                "Reduction phase " + index,
                scene.getEngine(),
                "#define " + (w == 1 && h == 1 ? "LAST" : w == 1 || h == 1 ? "ONEBEFORELAST" : "MAIN")
            );

            reduction.textureWidth = w;
            reduction.textureHeight = h;
            reduction.useIntegerTextureSize = w === 1 || h === 1;

            this.reductionSteps.push(reduction);

            index++;
        }
    }
}
