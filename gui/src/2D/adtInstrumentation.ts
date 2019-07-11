
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { PerfCounter } from "babylonjs/Misc/perfCounter";
import { IDisposable } from "babylonjs/scene";

import { AdvancedDynamicTexture } from "./advancedDynamicTexture";

/**
 * This class can be used to get instrumentation data from a AdvancedDynamicTexture object
 */
export class AdvancedDynamicTextureInstrumentation implements IDisposable {
    private _captureRenderTime = false;
    private _renderTime = new PerfCounter();

    private _captureLayoutTime = false;
    private _layoutTime = new PerfCounter();

    // Observers
    private _onBeginRenderObserver: Nullable<Observer<AdvancedDynamicTexture>> = null;
    private _onEndRenderObserver: Nullable<Observer<AdvancedDynamicTexture>> = null;
    private _onBeginLayoutObserver: Nullable<Observer<AdvancedDynamicTexture>> = null;
    private _onEndLayoutObserver: Nullable<Observer<AdvancedDynamicTexture>> = null;

    // Properties

    /**
     * Gets the perf counter used to capture render time
     */
    public get renderTimeCounter(): PerfCounter {
        return this._renderTime;
    }

    /**
     * Gets the perf counter used to capture layout time
     */
    public get layoutTimeCounter(): PerfCounter {
        return this._layoutTime;
    }

    /**
     * Enable or disable the render time capture
     */
    public get captureRenderTime(): boolean {
        return this._captureRenderTime;
    }

    public set captureRenderTime(value: boolean) {
        if (value === this._captureRenderTime) {
            return;
        }

        this._captureRenderTime = value;

        if (value) {
            this._onBeginRenderObserver = this.texture.onBeginRenderObservable.add(() => {
                this._renderTime.beginMonitoring();
            });

            this._onEndRenderObserver = this.texture.onEndRenderObservable.add(() => {
                this._renderTime.endMonitoring(true);
            });
        } else {
            this.texture.onBeginRenderObservable.remove(this._onBeginRenderObserver);
            this._onBeginRenderObserver = null;
            this.texture.onEndRenderObservable.remove(this._onEndRenderObserver);
            this._onEndRenderObserver = null;
        }
    }

    /**
     * Enable or disable the layout time capture
     */
    public get captureLayoutTime(): boolean {
        return this._captureLayoutTime;
    }

    public set captureLayoutTime(value: boolean) {
        if (value === this._captureLayoutTime) {
            return;
        }

        this._captureLayoutTime = value;

        if (value) {
            this._onBeginLayoutObserver = this.texture.onBeginLayoutObservable.add(() => {
                this._layoutTime.beginMonitoring();
            });

            this._onEndLayoutObserver = this.texture.onEndLayoutObservable.add(() => {
                this._layoutTime.endMonitoring(true);
            });
        } else {
            this.texture.onBeginLayoutObservable.remove(this._onBeginLayoutObserver);
            this._onBeginLayoutObserver = null;
            this.texture.onEndLayoutObservable.remove(this._onEndLayoutObserver);
            this._onEndLayoutObserver = null;
        }
    }
    /**
     * Instantiates a new advanced dynamic texture instrumentation.
     * This class can be used to get instrumentation data from an AdvancedDynamicTexture object
     * @param texture Defines the AdvancedDynamicTexture to instrument
     */
    public constructor(
        /**
         * Define the instrumented AdvancedDynamicTexture.
         */
        public texture: AdvancedDynamicTexture) {
    }

    /**
     * Dispose and release associated resources.
     */
    public dispose() {
        this.texture.onBeginRenderObservable.remove(this._onBeginRenderObserver);
        this._onBeginRenderObserver = null;
        this.texture.onEndRenderObservable.remove(this._onEndRenderObserver);
        this._onEndRenderObserver = null;
        this.texture.onBeginLayoutObservable.remove(this._onBeginLayoutObserver);
        this._onBeginLayoutObserver = null;
        this.texture.onEndLayoutObservable.remove(this._onEndLayoutObserver);
        this._onEndLayoutObserver = null;

        (<any>this.texture) = null;
    }
}