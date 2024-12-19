import { NamedAbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/** @internal */
export abstract class AbstractAudioSubNode extends NamedAbstractAudioNode {
    /** @internal */
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, AudioNodeType.InputOutput);
    }

    /** @internal */
    public connect(node: AbstractAudioSubNode): void {
        this._connect(node);
    }

    /** @internal */
    public disconnect(node: AbstractAudioSubNode): void {
        this._disconnect(node);
    }
}
