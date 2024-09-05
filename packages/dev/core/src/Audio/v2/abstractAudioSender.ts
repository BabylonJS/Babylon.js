/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAudioSend } from "./abstractAudioSend";

export abstract class AbstractAudioSender extends AbstractAudioNode {
    private _sends = new Set<AbstractAudioSend>();

    public constructor(parent: AbstractAudioNode) {
        super(parent.engine, AudioNodeType.InputOutput, parent);
    }

    public get sends(): IterableIterator<AbstractAudioSend> {
        return this._sends.values();
    }

    public addSend(send: AbstractAudioSend): void {
        this._sends.add(send);
    }

    public removeSend(send: AbstractAudioSend): void {
        this._sends.delete(send);
    }
}
