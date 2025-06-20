import type { Nullable } from "../../../types";
import type { _WebAudioEngine } from "../webAudioEngine";
import { AudioParameterRampShape } from "../../audioParameter";
import { _GetAudioParamCurveValues } from "core/AudioV2/audioUtils";

/**
 * Maximum time in seconds to wait for an active ramp to finish before starting a new ramp.
 *
 * New ramps will throw an error if the active ramp has more than this amount of time remaining.
 *
 * This is needed because short ramps are used to avoid pops and clicks when setting audio parameters, and we
 * don't want to throw an error if a short ramp is active.
 *
 * This constant is set to 10 milliseconds, which is short enough to avoid perceptual differences in most cases, but
 * long enough to allow for short ramps to be completed in a reasonable time frame.
 */
const MaxWaitTime = 0.01;

/**
 * Minimum duration in seconds for a ramp to be considered valid.
 *
 * If the duration is less than this value, the value will be set immediately instead of being ramped smoothly since
 * there is no perceptual difference for such short durations, so a ramp is not needed.
 */
const MinRampDuration = 0.000001;

/** @internal */
export class _WebAudioParameterComponent {
    private _rampEndTime: number = 0;
    private _engine: _WebAudioEngine;
    private _param: AudioParam;
    private _targetValue: number;
    private _timerId: any = null;

    /** @internal */
    constructor(engine: _WebAudioEngine, param: AudioParam) {
        this._engine = engine;
        this._param = param;
        this._targetValue = param.value;
    }

    /** @internal */
    public get targetValue(): number {
        return this._targetValue;
    }

    public set targetValue(value: number) {
        this.setTargetValue(value);
    }

    /** @internal */
    public get value(): number {
        return this._param.value;
    }

    /** @internal */
    public dispose(): void {
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = null;
        }
        this._param = null!;
        this._engine = null!;
    }

    /**
     * Sets the target value of the audio parameter with an optional ramping duration and curve.
     *
     * If a ramp is close to finishing, it will wait for the ramp to finish before setting the new value; otherwise it
     * will throw an error. We are required to throw an error because of a bug in Firefox that prevents active ramps
     * from being cancelled with `cancelScheduledValues`. See https://bugzilla.mozilla.org/show_bug.cgi?id=1752775.
     *
     * Firefox also has an issue when queuing a new ramp immediately after an active ramp ends. Deferring the call to
     * `setValueCurveAtTime` with a `setTimeout` works around this issue.
     *
     * There are other similar WebAudio APIs for ramping parameters, (e.g. `linearRampToValueAtTime` and
     * `exponentialRampToValueAtTime`) but they are currently not usable in Firefox and Meta Quest Chrome.
     *
     * It may be better in the long run to implement our own ramping logic with a WASM audio worklet instead of using
     * `setValueCurveAtTime`.
     *
     * @internal
     */
    public setTargetValue(value: number, duration: number = 0, curve: Nullable<AudioParameterRampShape> = null): void {
        const startTime = this._engine.currentTime;

        if (startTime < this._rampEndTime) {
            const timeRemaining = this._rampEndTime - startTime;

            if (MaxWaitTime < timeRemaining) {
                throw new Error("Audio parameter not set. Wait for current ramp to finish.");
            } else if (!this._engine._isUsingOfflineAudioContext) {
                // Firefox requires a `setTimeout` call to occur after setValueCurveAtTime finishes its ramp, otherwise
                // it does not apply the new ramp correctly.

                // Note that we're not doing this for the offline audio context used for tests, so it is assumed that
                // the tests will not use an offline audio context with Firefox (the tests currently use only Chrome).

                if (this._timerId) {
                    clearTimeout(this._timerId);
                }
                this._timerId = setTimeout(() => {
                    this.setTargetValue(value, duration - timeRemaining, curve);
                    this._timerId = null;
                }, timeRemaining * 1000);

                return;
            }
        }

        if ((duration = Math.max(this._engine.parameterRampDuration, duration)) < MinRampDuration) {
            this._param.setValueAtTime((this._targetValue = value), startTime);
            return;
        }

        if (typeof curve !== "number") {
            curve = AudioParameterRampShape.Linear;
        }

        this._param.cancelScheduledValues(startTime);
        this._param.setValueCurveAtTime(_GetAudioParamCurveValues(curve, this.value, (this._targetValue = value)), startTime, duration);

        this._rampEndTime = startTime + duration;
    }
}
