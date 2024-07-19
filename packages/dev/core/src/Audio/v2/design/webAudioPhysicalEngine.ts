/* eslint-disable */

import { AbstractEngine as AbstractPhysicalEngine } from "./physical";
import { AdvancedEngine as WebAudioAdvancedEngine } from "./webAudio";

export class PhysicalEngine extends AbstractPhysicalEngine {
    constructor(options?: any) {
        super(new WebAudioAdvancedEngine(options), options);
    }
}
