import { type Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { WebRequest } from "../Misc/webRequest";
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

/**
 * Applies `WebRequest.CustomRequestModifiers` URL transformations to the given URL for use with a streaming
 * `<audio>` element. Unlike `_LoadArrayBufferFromUrlAsync`, this does NOT download the audio content —
 * the browser streams it natively. If custom request headers are present they cannot be forwarded to the
 * `<audio>` element (which has no API for custom headers), so a warning is logged and the headers are ignored.
 * @param url - The URL to process (should already be cleaned via `_CleanUrl` if needed).
 * @returns The (possibly rewritten) URL with URL modifiers applied.
 * @internal
 */
export function _GetUrlForStreaming(url: string): string {
    const { url: modifiedUrl, headers } = WebRequest._CollectCustomizations(url);
    if (Object.keys(headers).length > 0) {
        Logger.Warn(
            "WebAudioStreamingSound: Custom request headers cannot be applied to a streaming <audio> element and will be ignored. " +
                "To use custom headers with audio, switch to a static (non-streaming) sound which fetches the file up-front."
        );
    }
    return modifiedUrl;
}

/**
 * Loads an `ArrayBuffer` from the given URL using `WebRequest.FetchAsync`, so that
 * `WebRequest.CustomRequestHeaders` and `WebRequest.CustomRequestModifiers` are respected for audio network
 * requests just like for any other Babylon.js network call.
 * Uses the Fetch API when available, falling back to XMLHttpRequest otherwise.
 * @param url - The URL to load from (should already be cleaned via `_CleanUrl` if needed).
 * @returns A promise that resolves with the loaded `ArrayBuffer` and the HTTP `Content-Type` response header value.
 * @internal
 */
export async function _LoadArrayBufferFromUrlAsync(url: string): Promise<{ data: ArrayBuffer; contentType: string }> {
    const response = await WebRequest.FetchAsync(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading '${url}': ${response.statusText}`);
    }
    const data = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") ?? "";
    return { data, contentType };
}
