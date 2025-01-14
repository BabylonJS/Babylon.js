import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../abstract/audioEngineV2";
import { LastCreatedAudioEngine } from "../abstract/audioEngineV2";
import type { _WebAudioEngine } from "./webAudioEngine";

/**
 * @internal
 * Gets the WebAudio engine from the given abstract audio engine, or the last created audio engine if the given engine is `null`.
 * - Throws an error if the resulting engine is `null` or is not a WebAudio engine.
 * @param engine - The abstract audio engine to get the WebAudio engine from.
 * @returns the WebAudio engine.
 */
export function _GetWebAudioEngine(engine: Nullable<AudioEngineV2>): _WebAudioEngine {
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Not a WebAudio engine.");
    }

    return engine as _WebAudioEngine;
}
