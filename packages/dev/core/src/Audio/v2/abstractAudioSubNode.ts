import { _AudioNodeType, NamedAbstractAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/** @internal */
export abstract class _AbstractAudioSubNode extends NamedAbstractAudioNode {
    /** @internal */
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, _AudioNodeType.InputOutput);
    }

    /** @internal */
    public connect(node: _AbstractAudioSubNode): void {
        this._connect(node);
    }

    /** @internal */
    public disconnect(node: _AbstractAudioSubNode): void {
        this._disconnect(node);
    }
}
