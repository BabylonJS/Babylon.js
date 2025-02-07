import { AudioNodeType, AbstractNamedAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2 } from "../audioEngineV2";

/** @internal */
export abstract class _AbstractAudioSubNode extends AbstractNamedAudioNode {
    /** @internal */
    protected constructor(name: string, engine: AudioEngineV2) {
        super(name, engine, AudioNodeType.HAS_INPUTS_AND_OUTPUTS);
    }

    /** @internal */
    public connect(node: _AbstractAudioSubNode): void {
        if (!this._connect(node)) {
            throw new Error("Connect failed");
        }
    }

    /** @internal */
    public disconnect(node: _AbstractAudioSubNode): void {
        if (!this._disconnect(node)) {
            throw new Error("Disconnect failed");
        }
    }

    /** @internal */
    public disconnectAll(): void {
        if (!this._downstreamNodes) {
            throw new Error("Disconnect failed");
        }

        const it = this._downstreamNodes.values();

        for (let next = it.next(); !next.done; next = it.next()) {
            if (!this._disconnect(next.value)) {
                throw new Error("Disconnect failed");
            }
        }
    }
}
