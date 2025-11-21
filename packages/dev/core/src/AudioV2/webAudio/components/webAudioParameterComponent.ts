import type { Nullable } from "../../../types";
import type { IAudioParameterRampOptions } from "../../audioParameter";
import { AudioParameterRampShape } from "../../audioParameter";
import { _GetAudioParamCurveValues } from "../../audioUtils";
import type { _WebAudioEngine } from "../webAudioEngine";

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

    /** @internal */
    constructor(engine: _WebAudioEngine, param: AudioParam) {
        this._engine = engine;
        this._param = param;
        this._targetValue = param.value;
    }

    /** @internal */
    public get isRamping(): boolean {
        return this._engine.currentTime < this._rampEndTime;
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
        this._param = null!;
        this._engine = null!;
    }

    /**
     * Sets the target value of the audio parameter with an optional ramping duration and shape.
     *
     * @internal
     */
    public setTargetValue(value: number, options: Nullable<Partial<IAudioParameterRampOptions>> = null): void {
        const shape = typeof options?.shape === "string" ? options.shape : AudioParameterRampShape.Linear;

        const startTime = this._engine.currentTime;

        if (shape === AudioParameterRampShape.None) {
            this._param.cancelScheduledValues(startTime);
            this._param.value = this._targetValue = value;
            this._rampEndTime = startTime;
            return;
        }

        let duration = typeof options?.duration === "number" ? Math.max(options.duration, this._engine.parameterRampDuration) : this._engine.parameterRampDuration;

        if ((duration = Math.max(this._engine.parameterRampDuration, duration)) < MinRampDuration) {
            this._param.setValueAtTime((this._targetValue = value), startTime);
            return;
        }

        this._param.cancelScheduledValues(startTime);
        this._param.setValueCurveAtTime(_GetAudioParamCurveValues(shape, this._param.value, (this._targetValue = value)), startTime, duration);

        this._rampEndTime = startTime + duration;
    }
}
