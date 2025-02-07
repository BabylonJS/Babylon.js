import { Observable } from "../../Misc/observable";
import type { AudioEngineV2 } from "./audioEngineV2";

export const enum AudioNodeType {
    HAS_INPUTS = 1,
    HAS_OUTPUTS = 2,
    HAS_INPUTS_AND_OUTPUTS = 3,
}

/**
 * Abstract class for an audio node.
 *
 * An audio node is a processing unit that can receive audio data from an upstream node and/or send audio data to a
 * downstream node.
 *
 * Nodes can be connected to other nodes to create an audio graph. The audio graph represents the flow of audio data.
 *
 * There are 3 types of audio nodes:
 * 1. Input: Receives audio data from upstream nodes.
 * 2. Output: Sends audio data to downstream nodes.
 * 3. Input/Output: Receives audio data from upstream nodes and sends audio data to downstream nodes.
 */
export abstract class AbstractAudioNode {
    /**
     * The connected downstream audio nodes.
     * - Undefined for input nodes.
     */
    protected readonly _downstreamNodes?: Set<AbstractAudioNode>;

    /**
     * The connected upstream audio nodes.
     * - Undefined for output nodes.
     */
    protected readonly _upstreamNodes?: Set<AbstractAudioNode>;

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

        if (nodeType & AudioNodeType.HAS_INPUTS) {
            this._upstreamNodes = new Set<AbstractAudioNode>();
        }

        if (nodeType & AudioNodeType.HAS_OUTPUTS) {
            this._downstreamNodes = new Set<AbstractAudioNode>();
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
                if (!this._disconnect(node)) {
                    throw new Error("Disconnect failed");
                }
            }
            this._downstreamNodes.clear();
        }

        if (this._upstreamNodes) {
            for (const node of Array.from(this._upstreamNodes)) {
                if (!node._disconnect(this)) {
                    throw new Error("Disconnect failed");
                }
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
     * @returns `true` if the node is successfully connected; otherwise `false`
     */
    protected _connect(node: AbstractAudioNode): boolean {
        if (!this._downstreamNodes) {
            return false;
        }

        if (this._downstreamNodes.has(node)) {
            return false;
        }

        if (!node._onConnect(this)) {
            return false;
        }

        this._downstreamNodes.add(node);

        return true;
    }

    /**
     * Disconnects a downstream audio input node.
     * @param node - The downstream audio input node to disconnect
     * @returns `true` if the node is successfully disconnected; otherwise `false`
     */
    protected _disconnect(node: AbstractAudioNode): boolean {
        if (!this._downstreamNodes) {
            return false;
        }

        if (!this._downstreamNodes.delete(node)) {
            return false;
        }

        return node._onDisconnect(this);
    }

    /**
     * Called when an upstream audio output node is connecting.
     * @param node - The connecting upstream audio node
     * @returns `true` if the node is successfully connected; otherwise `false`
     */
    private _onConnect(node: AbstractAudioNode): boolean {
        if (!this._upstreamNodes) {
            return false;
        }

        if (this._upstreamNodes.has(node)) {
            return false;
        }

        this._upstreamNodes.add(node);

        return true;
    }

    /**
     * Called when an upstream audio output node disconnects.
     * @param node - The disconnecting upstream audio node
     * @returns `true` if node is sucessfully disconnected; otherwise `false`
     */
    private _onDisconnect(node: AbstractAudioNode): boolean {
        return this._upstreamNodes?.delete(node) ?? false;
    }
}

/**
 * Abstract class for a named audio node.
 */
export abstract class AbstractNamedAudioNode extends AbstractAudioNode {
    private _name: string;

    /**
     * Observable for when the audio node is renamed.
     */
    public readonly onNameChangedObservable = new Observable<{ newName: string; oldName: string; node: AbstractNamedAudioNode }>();

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

    public set name(newName: string) {
        if (this._name === newName) {
            return;
        }

        const oldName = this._name;

        this._name = newName;

        this.onNameChangedObservable.notifyObservers({ newName, oldName, node: this });
    }

    public override dispose(): void {
        super.dispose();

        this.onNameChangedObservable.clear();
    }
}
