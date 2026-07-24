/** This file must only contain pure code and pure imports */

import { ThinEngine } from "../thinEngine.pure";

let _Registered = false;
/**
 * Registers alpha-to-coverage support for WebGL engines.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesExtensionsEngineAlphaToCoverage(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    const alphaToCoverageState = new WeakMap<ThinEngine, boolean>();
    const alphaToCoverageContext = new WeakMap<ThinEngine, WebGLRenderingContext>();
    const mainPassSampleCount = new WeakMap<ThinEngine, number>();
    const mainPassSampleCountContext = new WeakMap<ThinEngine, WebGLRenderingContext>();

    ThinEngine.prototype.getAlphaToCoverage = function (): boolean {
        return alphaToCoverageState.get(this) ?? false;
    };

    ThinEngine.prototype.setAlphaToCoverage = function (enable: boolean): void {
        if (alphaToCoverageState.get(this) === enable && (!this._gl || alphaToCoverageContext.get(this) === this._gl)) {
            return;
        }

        alphaToCoverageState.set(this, enable);

        if (!this._gl) {
            return;
        }

        if (enable) {
            this._gl.enable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);
        } else {
            this._gl.disable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
        alphaToCoverageContext.set(this, this._gl);
    };

    Object.defineProperty(ThinEngine.prototype, "currentSampleCount", {
        get: function (this: ThinEngine): number {
            if (this._currentRenderTarget) {
                return this._currentRenderTarget.samples;
            }

            if (!this._gl) {
                return 1;
            }

            if (mainPassSampleCountContext.get(this) !== this._gl) {
                mainPassSampleCount.set(this, this._gl.getContextAttributes()?.antialias ? Math.max(1, this._gl.getParameter(this._gl.SAMPLES)) : 1);
                mainPassSampleCountContext.set(this, this._gl);
            }

            return mainPassSampleCount.get(this)!;
        },
        enumerable: false,
        configurable: true,
    });
}
