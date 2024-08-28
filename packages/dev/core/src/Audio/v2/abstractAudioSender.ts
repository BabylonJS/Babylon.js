/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAudioSend } from "./abstractAudioSend";

export abstract class AbstractAudioSender extends AbstractAudioNode {
    public constructor(parent: AbstractAudioNode) {
        super(parent.engine, AudioNodeType.InputOutput, parent);
    }

    private _sends = new Array<AbstractAudioSend>();

    public get sends(): ReadonlyArray<AbstractAudioSend> {
        return this._sends;
    }

    public addSend(send: AbstractAudioSend): void {
        if (this._sends.includes(send)) {
            return;
        }
        this._sends.push(send);
    }

    public removeSend(send: AbstractAudioSend): void {
        const index = this._sends.indexOf(send);
        if (index !== -1) {
            this._sends.splice(index, 1);
        }
    }
}
