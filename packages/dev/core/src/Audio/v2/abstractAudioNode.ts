import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractAudioNodeParent } from "./abstractAudioNodeParent";

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
export abstract class AbstractAudioNode extends AbstractAudioNodeParent {
    // If parent is null, node is owned by audio engine.
    private _parent: Nullable<AbstractAudioNodeParent> = null;

    /**
     * The connected downstream audio nodes.
     *
     * Undefined for input nodes.
     */
    protected readonly _connectedDownstreamNodes?: Array<AbstractAudioNode> | undefined;

    /**
     * The connected upstream audio nodes.
     *
     * Undefined for output nodes.
     */
    protected readonly _connectedUpstreamNodes?: Array<AbstractAudioNode> | undefined;

    /**
     * The audio engine this node belongs to.
     */
    public readonly engine: AbstractAudioEngine;

    /**
     * Observable for when the audio node is disposed.
     */
    public readonly onDisposeObservable = new Observable<AbstractAudioNode>();

    /** @internal */
    constructor(engine: AbstractAudioEngine, nodeType: AudioNodeType, parent: Nullable<AbstractAudioNodeParent> = null) {
        super();

        this.engine = engine;
        this.parent = parent;

        if (nodeType | AudioNodeType.Input) {
            this._connectedDownstreamNodes = new Array<AbstractAudioNode>();
        }

        if (nodeType | AudioNodeType.Output) {
            this._connectedUpstreamNodes = new Array<AbstractAudioNode>();
        }
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        super.dispose();

        const index = this.parent.children.indexOf(this);
        if (index !== -1) {
            this.parent.children.splice(index, 1);
        }

        if (this._connectedDownstreamNodes) {
            for (const node of this._connectedDownstreamNodes) {
                this._disconnect(node);
            }
            this._connectedDownstreamNodes.length = 0;
        }

        if (this._connectedUpstreamNodes) {
            for (const node of this._connectedUpstreamNodes) {
                node._disconnect(this);
            }
            this._connectedUpstreamNodes.length = 0;
        }

        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }

    /**
     * The parent audio node.
     */
    public get parent(): AbstractAudioNodeParent {
        return this._parent ?? this.engine;
    }

    /**
     * Sets the parent audio node.
     */
    public set parent(parent: Nullable<AbstractAudioNodeParent>) {
        if (this._parent === parent) {
            return;
        }

        const index = this.parent.children.indexOf(this);
        if (index !== -1) {
            this.parent.children.splice(index, 1);
        }
        this._parent = parent;
        this.parent.children.push(this);
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

    /**
     * Connect to a downstream audio input node.
     * @param node - The downstream audio input node to connect
     */
    protected _connect(node: AbstractAudioNode): void {
        if (!this._connectedDownstreamNodes) {
            return;
        }

        if (this._connectedDownstreamNodes.indexOf(node) !== -1) {
            return;
        }

        if (!node._onConnect(this)) {
            return;
        }

        this._connectedDownstreamNodes.push(node);
    }

    /**
     * Disconnect from a downstream audio input node.
     * @param node - The downstream audio input node to disconnect
     */
    protected _disconnect(node: AbstractAudioNode): void {
        if (!this._connectedDownstreamNodes) {
            return;
        }

        //this._connectedDownstreamNodes.delete(node);
        const index = this._connectedDownstreamNodes.indexOf(node);
        if (index !== -1) {
            this._connectedDownstreamNodes.splice(index, 1);
        }

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

        this._connectedUpstreamNodes.push(node);

        return true;
    }

    /**
     * Called when an upstream audio output node disconnects.
     * @param node - The disconnecting upstream audio node
     */
    protected _onDisconnect(node: AbstractAudioNode): void {
        if (!this._connectedUpstreamNodes) {
            return;
        }

        const index = this._connectedUpstreamNodes.indexOf(node);
        if (index !== -1) {
            this._connectedUpstreamNodes.splice(index, 1);
        }
    }
}

/**
 * Abstract class for an audio node with a name.
 */
export abstract class AbstractNamedAudioNode extends AbstractAudioNode {
    /**
     * The name of the audio node.
     */
    public name: string;

    constructor(name: string, engine: AbstractAudioEngine, nodeType: AudioNodeType) {
        super(engine, nodeType);
        this.name = name;
    }
}
