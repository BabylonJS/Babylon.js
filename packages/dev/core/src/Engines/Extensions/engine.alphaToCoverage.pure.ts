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

    ThinEngine.prototype.getAlphaToCoverage = function (): boolean {
        return alphaToCoverageState.get(this) ?? false;
    };

    ThinEngine.prototype.setAlphaToCoverage = function (enable: boolean): void {
        alphaToCoverageState.set(this, enable);

        if (!this._gl) {
            return;
        }

        if (enable) {
            this._gl.enable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);
        } else {
            this._gl.disable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
    };

    Object.defineProperty(ThinEngine.prototype, "currentSampleCount", {
        get: function (this: ThinEngine): number {
            if (this._currentRenderTarget) {
                return this._currentRenderTarget.samples;
            }

            if (!this._gl) {
                return 1;
            }

            return this._gl.getContextAttributes()?.antialias ? Math.max(1, this._gl.getParameter(this._gl.SAMPLES)) : 1;
        },
        enumerable: false,
        configurable: true,
    });
}
