import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AudioSend } from "./audioSend";

/**
 * Abstract base class for audio senders.
 */
export abstract class AudioSender extends AbstractAudioNode {
    private _sends = new Set<AudioSend>();

    /** @internal */
    constructor(parent: AbstractAudioNode) {
        super(parent.engine, AudioNodeType.InputOutput, parent);
    }

    /**
     * The audio sends.
     */
    public get sends(): IterableIterator<AudioSend> {
        return this._sends.values();
    }

    /**
     * Adds a send to the audio sender.
     * @param send - The send to add.
     */
    public addSend(send: AudioSend): void {
        this._sends.add(send);
    }

    /**
     * Removes a send from the audio sender.
     * @param send - The send to remove.
     */
    public removeSend(send: AudioSend): void {
        this._sends.delete(send);
    }
}
