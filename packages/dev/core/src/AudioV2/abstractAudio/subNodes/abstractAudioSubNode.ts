import { _AudioNodeType, AbstractNamedAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2 } from "../audioEngineV2";

/** @internal */
export abstract class _AbstractAudioSubNode extends AbstractNamedAudioNode {
    /** @internal */
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, _AudioNodeType.HAS_INPUTS_AND_OUTPUTS);
    }

    /** @internal */
    public connect(node: _AbstractAudioSubNode): void {
        this._connect(node);
    }

    /** @internal */
    public disconnect(node: _AbstractAudioSubNode): void {
        this._disconnect(node);
    }

    /** @internal */
    public disconnectAll(): void {
        if (!this._downstreamNodes) {
            return;
        }

        const it = this._downstreamNodes.values();

        for (let next = it.next(); !next.done; next = it.next()) {
            this._disconnect(next.value);
        }
    }
}
