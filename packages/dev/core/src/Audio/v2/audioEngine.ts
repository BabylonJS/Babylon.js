/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioEngine } from "./abstractAudioEngine";
import { WebAudioEngine } from "./webAudioEngine";
import type { Nullable } from "../../types";

export { WebAudioEngine as AudioEngine };

let currentAudioEngine: Nullable<IAudioEngine> = null;

export function getCurrentAudioEngine(): IAudioEngine {
    if (!currentAudioEngine) {
        currentAudioEngine = new WebAudioEngine();
    }
    return currentAudioEngine;
}

export function setCurrentAudioEngine(engine: Nullable<IAudioEngine>): void {
    currentAudioEngine = engine;
}
