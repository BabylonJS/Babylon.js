import { Observer } from "../Misc/observable";
import { PerfCounter } from "../Misc/perfCounter";
import { Nullable } from "../types";
import { IDisposable } from "../scene";
import { Engine } from "../Engines/engine";
/**
 * This class can be used to get instrumentation data from a Babylon engine
 * @see https://doc.babylonjs.com/how_to/optimizing_your_scene#engineinstrumentation
 */
export class EngineInstrumentation implements IDisposable {
    private _captureGPUFrameTime = false;

    private _captureShaderCompilationTime = false;
    private _shaderCompilationTime = new PerfCounter();

    // Observers
    private _onBeginFrameObserver: Nullable<Observer<Engine>> = null;
    private _onEndFrameObserver: Nullable<Observer<Engine>> = null;
    private _onBeforeShaderCompilationObserver: Nullable<Observer<Engine>> = null;
    private _onAfterShaderCompilationObserver: Nullable<Observer<Engine>> = null;

    // Properties
    /**
     * Gets the perf counter used for GPU frame time
     */
    public get gpuFrameTimeCounter(): PerfCounter {
        return this.engine.getGPUFrameTimeCounter();
    }

    /**
     * Gets the GPU frame time capture status
     */
    public get captureGPUFrameTime(): boolean {
        return this._captureGPUFrameTime;
    }

    /**
     * Enable or disable the GPU frame time capture
     */
    public set captureGPUFrameTime(value: boolean) {
        if (value === this._captureGPUFrameTime) {
            return;
        }

        this._captureGPUFrameTime = value;
        this.engine.captureGPUFrameTime(value);
    }

    /**
     * Gets the perf counter used for shader compilation time
     */
    public get shaderCompilationTimeCounter(): PerfCounter {
        return this._shaderCompilationTime;
    }

    /**
     * Gets the shader compilation time capture status
     */
    public get captureShaderCompilationTime(): boolean {
        return this._captureShaderCompilationTime;
    }

    /**
     * Enable or disable the shader compilation time capture
     */
    public set captureShaderCompilationTime(value: boolean) {
        if (value === this._captureShaderCompilationTime) {
            return;
        }

        this._captureShaderCompilationTime = value;

        if (value) {
            this._onBeforeShaderCompilationObserver = this.engine.onBeforeShaderCompilationObservable.add(() => {
                this._shaderCompilationTime.fetchNewFrame();
                this._shaderCompilationTime.beginMonitoring();
            });

            this._onAfterShaderCompilationObserver = this.engine.onAfterShaderCompilationObservable.add(() => {
                this._shaderCompilationTime.endMonitoring();
            });
        } else {
            this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
            this._onBeforeShaderCompilationObserver = null;
            this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
            this._onAfterShaderCompilationObserver = null;
        }
    }

    /**
     * Instantiates a new engine instrumentation.
     * This class can be used to get instrumentation data from a Babylon engine
     * @see https://doc.babylonjs.com/how_to/optimizing_your_scene#engineinstrumentation
     * @param engine Defines the engine to instrument
     */
    public constructor(
        /**
         * Define the instrumented engine.
         */
        public engine: Engine) {
    }

    /**
     * Dispose and release associated resources.
     */
    public dispose() {
        this.engine.onBeginFrameObservable.remove(this._onBeginFrameObserver);
        this._onBeginFrameObserver = null;

        this.engine.onEndFrameObservable.remove(this._onEndFrameObserver);
        this._onEndFrameObserver = null;

        this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
        this._onBeforeShaderCompilationObserver = null;

        this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
        this._onAfterShaderCompilationObserver = null;

        (<any>this.engine) = null;
    }
}
