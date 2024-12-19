import { Observable } from "../../Misc/observable";
import type { AudioEngineV2 } from "./audioEngineV2";

type AudioNodeType = number;

/** @internal */
export class _AudioNodeType {
    /**
     * Input nodes receive audio data from an upstream node.
     */
    public static readonly Input = 1;

    /**
     * Output nodes send audio data to a downstream node.
     */
    public static readonly Output = 2;

    /**
     * Input/Output nodes receive audio data from an upstream node and send audio data to a downstream node.
     */
    public static readonly InputOutput = _AudioNodeType.Input | _AudioNodeType.Output;
}

/**
 * Abstract class for an audio node.
 */
export abstract class AbstractAudioNode {
    /**
     * The connected downstream audio nodes.
     *
     * Undefined for input nodes.
     */
    protected readonly _connectedDownstreamNodes?: Set<AbstractAudioNode> | undefined;

    /**
     * The connected upstream audio nodes.
     *
     * Undefined for output nodes.
     */
    protected readonly _connectedUpstreamNodes?: Set<AbstractAudioNode> | undefined;

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

        if (nodeType | _AudioNodeType.Input) {
            this._connectedDownstreamNodes = new Set<AbstractAudioNode>();
        }

        if (nodeType | _AudioNodeType.Output) {
            this._connectedUpstreamNodes = new Set<AbstractAudioNode>();
        }
    }

    /**
     * Releases associated resources.
     */
    public dispose(): void {
        if (this._connectedDownstreamNodes) {
            for (const node of Array.from(this._connectedDownstreamNodes)) {
                this._disconnect(node);
            }
            this._connectedDownstreamNodes.clear();
        }

        if (this._connectedUpstreamNodes) {
            for (const node of Array.from(this._connectedUpstreamNodes)) {
                node._disconnect(this);
            }
            this._connectedUpstreamNodes.clear();
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
        if (!this._connectedDownstreamNodes) {
            return;
        }

        if (this._connectedDownstreamNodes.has(node)) {
            return;
        }

        if (!node._onConnect(this)) {
            return;
        }

        this._connectedDownstreamNodes.add(node);
    }

    /**
     * Disconnect from a downstream audio input node.
     * @param node - The downstream audio input node to disconnect
     */
    protected _disconnect(node: AbstractAudioNode): void {
        if (!this._connectedDownstreamNodes) {
            return;
        }

        this._connectedDownstreamNodes.delete(node);

        node._onDisconnect(this);
    }

    /**
     * Called when an upstream audio output node is connecting.
     * @param node - The connecting upstream audio node
     * @returns `true` if the connection succeeds; otherwise `false`
     */
    protected _onConnect(node: AbstractAudioNode): boolean {
        if (!this._connectedUpstreamNodes) {
            return false;
        }

        this._connectedUpstreamNodes.add(node);

        return true;
    }

    /**
     * Called when an upstream audio output node disconnects.
     * @param node - The disconnecting upstream audio node
     */
    protected _onDisconnect(node: AbstractAudioNode): void {
        this._connectedUpstreamNodes?.delete(node);
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

    public override dispose(): void {
        super.dispose();

        this.onNameChangedObservable.clear();
    }

    /**
     * The name of the audio node.
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Sets the name of the audio node.
     */
    public set name(name: string) {
        if (this._name === name) {
            return;
        }

        const oldName = this._name;

        this._name = name;

        this.onNameChangedObservable.notifyObservers({ oldName, node: this });
    }
}
