import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAudioSend } from "./abstractAudioSend";

/**
 * Abstract base class for audio senders.
 */
export abstract class AbstractAudioSender extends AbstractAudioNode {
    private _sends = new Set<AbstractAudioSend>();

    /** @internal */
    constructor(parent: AbstractAudioNode) {
        super(parent.engine, AudioNodeType.InputOutput, parent);
    }

    /**
     * The audio sends.
     */
    public get sends(): IterableIterator<AbstractAudioSend> {
        return this._sends.values();
    }

    /**
     * Adds a send to the audio sender.
     * @param send - The send to add.
     */
    public addSend(send: AbstractAudioSend): void {
        this._sends.add(send);
    }

    /**
     * Removes a send from the audio sender.
     * @param send - The send to remove.
     */
    public removeSend(send: AbstractAudioSend): void {
        this._sends.delete(send);
    }
}
