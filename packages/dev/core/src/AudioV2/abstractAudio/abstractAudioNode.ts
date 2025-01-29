import { Observable } from "../../Misc/observable";
import type { AudioEngineV2 } from "./audioEngineV2";

export const enum AudioNodeType {
    In = 1,
    Out = 2,
    InOut = 3,
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
 * 1. Input: Receives audio data from an upstream node.
 * 2. Output: Sends audio data to a downstream node.
 * 3. Input/Output: Receives audio data from an upstream node and sends audio data to a downstream node.
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

        if (nodeType & AudioNodeType.In) {
            this._upstreamNodes = new Set<AbstractAudioNode>();
        }

        if (nodeType & AudioNodeType.Out) {
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
