import { NamedAbstractAudioNode } from "./abstractAudioNode";
import type { _AbstractAudioSubGraph } from "./subNodes/abstractAudioSubGraph";

/**
 * Abstract class for audio nodes containing sub-graphs.
 */
export abstract class AbstractAudioSuperNode extends NamedAbstractAudioNode {
    protected abstract _subGraph: _AbstractAudioSubGraph;

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        this._subGraph.dispose();
    }
}
