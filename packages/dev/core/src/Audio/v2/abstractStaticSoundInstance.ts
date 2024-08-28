/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioNode } from "./abstractAudioNode";
import { AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractSoundSource } from "./abstractSoundSource";

export abstract class AbstractStaticSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSoundSource, inputNode: AbstractAudioNode) {
        super(source, inputNode);
    }
}
