import { Observable } from "../../Misc/observable";
import type { AudioEngineV2 } from "./audioEngineV2";

type AudioNodeType = number;

/** @internal */
export class _AudioNodeType {
    /**
     * Input nodes receive audio data from an upstream node.
     */
    public static readonly In = 1;

    /**
     * Output nodes send audio data to a downstream node.
     */
    public static readonly Out = 2;

    /**
     * Input/Output nodes receive audio data from an upstream node and send audio data to a downstream node.
     */
    public static readonly InOut = _AudioNodeType.In | _AudioNodeType.Out;
}

/**
 * Abstract class for an audio node.
 */
export abstract class AbstractAudioNode {
    /**
     * The connected downstream audio nodes.
     * - Undefined for input nodes.
     */
    protected readonly _downstreamNodes?: Set<AbstractAudioNode> | undefined;

    /**
     * The connected upstream audio nodes.
     * - Undefined for output nodes.
     */
    protected readonly _upstreamNodes?: Set<AbstractAudioNode> | undefined;

    /**
     * The audio engine this node belongs to.
     */
    public readonly engine: AudioEngineV2;

    /**
     * Observable for when the audio node is disposed.
     */
    public readonly onDisposeObservable = new Observable<AbstractAudioNode>();

    protected constructor(engine: AudioEngineV2, nodeType: AudioNodeType) {
        this.engine = engine;

        if (nodeType | _AudioNodeType.In) {
            this._downstreamNodes = new Set<AbstractAudioNode>();
        }

        if (nodeType | _AudioNodeType.Out) {
            this._upstreamNodes = new Set<AbstractAudioNode>();
        }
    }

    /**
     * Releases associated resources.
     * - Triggers `onDisposeObservable`.
     * @see {@link onDisposeObservable}
     */
    public dispose(): void {
        if (this._downstreamNodes) {
            for (const node of Array.from(this._downstreamNodes)) {
                this._disconnect(node);
            }
            this._downstreamNodes.clear();
        }

        if (this._upstreamNodes) {
            for (const node of Array.from(this._upstreamNodes)) {
                node._disconnect(this);
            }
            this._upstreamNodes.clear();
        }

        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }

    /**
     * Gets a string identifying the name of the class
     * @returns the class's name as a string
     */
    public abstract getClassName(): string;

    /**
     * Connect to a downstream audio input node.
     * @param node - The downstream audio input node to connect
     */
    protected _connect(node: AbstractAudioNode): void {
        if (!this._downstreamNodes) {
            return;
        }

        if (this._downstreamNodes.has(node)) {
            return;
        }

        if (!node._onConnect(this)) {
            return;
        }

        this._downstreamNodes.add(node);
    }

    /**
     * Disconnects a downstream audio input node.
     * @param node - The downstream audio input node to disconnect
     */
    protected _disconnect(node: AbstractAudioNode): void {
        if (!this._downstreamNodes) {
            return;
        }

        this._downstreamNodes.delete(node);

        node._onDisconnect(this);
    }

    /**
     * Called when an upstream audio output node is connecting.
     * @param node - The connecting upstream audio node
     * @returns `true` if the connection succeeds; otherwise `false`
     */
    private _onConnect(node: AbstractAudioNode): boolean {
        if (!this._upstreamNodes) {
            return false;
        }

        this._upstreamNodes.add(node);

        return true;
    }

    /**
     * Called when an upstream audio output node disconnects.
     * @param node - The disconnecting upstream audio node
     */
    private _onDisconnect(node: AbstractAudioNode): void {
        this._upstreamNodes?.delete(node);
    }
}

/**
 * Abstract class for a named audio node.
 */
export abstract class NamedAbstractAudioNode extends AbstractAudioNode {
    private _name: string;

    /**
     * Observable for when the audio node is renamed.
     */
    public readonly onNameChangedObservable = new Observable<{ oldName: string; node: NamedAbstractAudioNode }>();

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType) {
        super(engine, nodeType);

        this._name = name;
    }

    /**
     * The name of the audio node.
     * - Triggers `onNameChangedObservable` when changed.
     * @see {@link onNameChangedObservable}
     */
    public get name(): string {
        return this._name;
    }
    public set name(name: string) {
        if (this._name === name) {
            return;
        }

        const oldName = this._name;

        this._name = name;

        this.onNameChangedObservable.notifyObservers({ oldName, node: this });
    }

    public override dispose(): void {
        super.dispose();

        this.onNameChangedObservable.clear();
    }
}
