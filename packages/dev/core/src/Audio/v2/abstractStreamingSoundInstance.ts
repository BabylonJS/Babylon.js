/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractSoundInstance } from "./abstractSoundInstance";
import type { AbstractSoundSource } from "./abstractSoundSource";

export abstract class AbstractStreamingSoundInstance extends AbstractSoundInstance {
    constructor(source: AbstractSoundSource) {
        super(source);
    }
}
