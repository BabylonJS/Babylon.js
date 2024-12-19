import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { AudioEngineV2 } from "./audioEngineV2";

export enum AudioNodeType {
    /**
     * Input nodes receive audio data from an upstream node.
     */
    Input = 1,

    /**
     * Output nodes send audio data to a downstream node.
     */
    Output = 2,

    /**
     * Input/Output nodes receive audio data from an upstream node and send audio data to a downstream node.
     */
    InputOutput = 3,
}

/**
 * Abstract class for an audio node.
 */
export abstract class AbstractAudioNode {
    private _name: string;

    // If parent is null, node is owned by audio engine.
    private _parent: Nullable<AbstractAudioNode> = null;

    protected readonly _children = new Map<string, Set<AbstractAudioNode>>();

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

    protected constructor(engine: AudioEngineV2, nodeType: AudioNodeType, parent: Nullable<AbstractAudioNode> = null, name: Nullable<string> = null) {
        this._name = name ?? "";

        this.engine = engine;

        if (nodeType | AudioNodeType.Input) {
            this._connectedDownstreamNodes = new Set<AbstractAudioNode>();
        }

        if (nodeType | AudioNodeType.Output) {
            this._connectedUpstreamNodes = new Set<AbstractAudioNode>();
        }

        this._setParent(parent);
    }

    /**
     * Releases associated resources.
     */
    public dispose(): void {
        const itName = this._children.values();
        for (let nextName = itName.next(); !nextName.done; nextName = itName.next()) {
            const itNode = nextName.value.values();
            for (let nextNode = itNode.next(); !nextNode.done; nextNode = itNode.next()) {
                nextNode.value.dispose();
            }
        }

        this._getParent()?._removeChild(this);

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

        this._getParent()?._children.get(this._name)?.delete(this);

        this._name = name;

        this._getParent()?._getChildSet(name).add(this);
    }

    protected _getParent(): Nullable<AbstractAudioNode> {
        return this._parent ?? this.engine.mainOutput;
    }

    protected _setParent(parent: Nullable<AbstractAudioNode>) {
        if (this._parent === parent) {
            return;
        }

        this._getParent()?._removeChild(this);
        this._parent = parent;
        this._getParent()?._addChild(this);
    }

    /**
     * The audio node's type.
     */
    public get type(): AudioNodeType {
        let type = 0;

        if (this._connectedDownstreamNodes) {
            type |= AudioNodeType.Output;
        }

        if (this._connectedUpstreamNodes) {
            type |= AudioNodeType.Input;
        }

        return type;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns the class's name as a string
     */
    public abstract getClassName(): string;

    protected _addChild(child: AbstractAudioNode): void {
        const set = this._getChildSet(child.name);
        set.add(child);
    }

    protected _removeChild(child: AbstractAudioNode): void {
        const set = this._children.get(child.name);

        if (set) {
            set.delete(child);
        }
    }

    protected _getChildSet(name: string): Set<AbstractAudioNode> {
        let set = this._children.get(name);

        if (!set) {
            set = new Set<AbstractAudioNode>();
            this._children.set(name, set);
        }

        return set;
    }

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

    protected _reconnectDownstreamNodes(): void {
        if (this._connectedDownstreamNodes) {
            for (const node of Array.from(this._connectedDownstreamNodes)) {
                this._disconnect(node);
                this._connect(node);
            }
        }
    }

    protected _reconnectUpstreamNodes(): void {
        if (this._connectedUpstreamNodes) {
            for (const node of Array.from(this._connectedUpstreamNodes)) {
                node._disconnect(this);
                node._connect(this);
            }
        }
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
