import type { Nullable } from "../types";
import { AudioParameterRampShape } from "./audioParameter";

export const _FileExtensionRegex = new RegExp("\\.(\\w{3,4})($|\\?)");

const CurveLength = 100;

const TmpLineValues = new Float32Array([0, 0]);
let TmpCurveValues: Nullable<Float32Array> = null;

let ExpCurve: Nullable<Float32Array> = null;
let LogCurve: Nullable<Float32Array> = null;

/**
 * @returns A Float32Array representing an exponential ramp from (0, 0) to (1, 1).
 */
function GetExpCurve(): Float32Array {
    if (!ExpCurve) {
        ExpCurve = new Float32Array(CurveLength);

        const increment = 1 / (CurveLength - 1);
        let x = increment;
        for (let i = 1; i < CurveLength; i++) {
            ExpCurve[i] = Math.exp(-11.512925464970227 * (1 - x));
            x += increment;
        }
    }

    return ExpCurve;
}

/**
 * @returns A Float32Array representing a logarithmic ramp from (0, 0) to (1, 1).
 */
function GetLogCurve(): Float32Array {
    if (!LogCurve) {
        LogCurve = new Float32Array(CurveLength);

        const increment = 1 / CurveLength;
        let x = increment;
        for (let i = 0; i < CurveLength; i++) {
            LogCurve[i] = 1 + Math.log10(x) / Math.log10(CurveLength);
            x += increment;
        }
    }

    return LogCurve;
}

/** @internal */
export function _GetAudioParamCurveValues(shape: AudioParameterRampShape, from: number, to: number): Float32Array {
    if (!TmpCurveValues) {
        TmpCurveValues = new Float32Array(CurveLength);
    }

    let normalizedCurve: Float32Array;

    if (shape === AudioParameterRampShape.Linear) {
        TmpLineValues[0] = from;
        TmpLineValues[1] = to;
        return TmpLineValues;
    } else if (shape === AudioParameterRampShape.Exponential) {
        normalizedCurve = GetExpCurve();
    } else if (shape === AudioParameterRampShape.Logarithmic) {
        normalizedCurve = GetLogCurve();
    } else {
        throw new Error(`Unknown ramp shape: ${shape}`);
    }

    const direction = Math.sign(to - from);
    const range = Math.abs(to - from);

    if (direction === 1) {
        for (let i = 0; i < normalizedCurve.length; i++) {
            TmpCurveValues[i] = from + range * normalizedCurve[i];
        }
    } else {
        let j = CurveLength - 1;
        for (let i = 0; i < normalizedCurve.length; i++, j--) {
            TmpCurveValues[i] = from - range * (1 - normalizedCurve[j]);
        }
    }

    return TmpCurveValues;
}

/** @internal */
export function _CleanUrl(url: string) {
    return url.replace(/#/gm, "%23");
}
