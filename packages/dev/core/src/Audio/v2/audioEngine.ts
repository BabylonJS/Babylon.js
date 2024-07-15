/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { type AbstractAudioEngine } from "./abstractAudioEngine";
import { WebAudioEngine } from "./webAudioEngine";
import { type Nullable } from "../../types";

let currentAudioEngine: Nullable<AbstractAudioEngine> = null;

export function getCurrentAudioEngine(): AbstractAudioEngine {
    if (!currentAudioEngine) {
        currentAudioEngine = new WebAudioEngine();
    }
    return currentAudioEngine;
}

export function setCurrentAudioEngine(engine: Nullable<AbstractAudioEngine>): void {
    currentAudioEngine = engine;
}
