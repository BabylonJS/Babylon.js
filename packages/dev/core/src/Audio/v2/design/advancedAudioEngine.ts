/* eslint-disable */

import * as Physical from "./abstractAudioEngine";

/*
The classes in this file are the advanced logical layer of the design. They should completely hide the physical layer
so physical implementations other than the WebAudio API can be added easily.
*/

export class AudioEngine {
    physicalAudioEngine: Physical.AudioEngine;
}
