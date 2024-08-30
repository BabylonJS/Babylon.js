/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractAudioNodeParent } from "./abstractAudioNodeParent";
import type { Nullable } from "../../types";

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

export abstract class AbstractAudioNode extends AbstractAudioNodeParent {
    /**
     * Creates a new audio node.
     * @param engine - The audio engine this node will be added to
     * @param nodeType - The type of audio node
     * @param parent - The parent audio node. Defaults to `null` to make the the audio engine the parent
     */
    public constructor(engine: AbstractAudioEngine, nodeType: AudioNodeType, parent: Nullable<AbstractAudioNodeParent> = null) {
        super();

        this.engine = engine;

        this._parent = parent;

        if (nodeType | AudioNodeType.Input) {
            this._connectedDownstreamNodes = new Set<AbstractAudioNode>();
        }

        if (nodeType | AudioNodeType.Output) {
            this._connectedUpstreamNodes = new Set<AbstractAudioNode>();
        }
    }

    /**
     * Releases associated resources.
     */
    public override dispose(): void {
        if (this._connectedDownstreamNodes) {
            for (const node of this._connectedDownstreamNodes) {
                this._disconnect(node);
            }
            this._connectedDownstreamNodes.clear();
        }

        if (this._connectedUpstreamNodes) {
            for (const node of this._connectedUpstreamNodes) {
                node._disconnect(this);
            }
            this._connectedUpstreamNodes.clear();
        }

        this.parent.children.delete(this);

        super.dispose();
    }

    public readonly engine: AbstractAudioEngine;

    // If parent is null, node is owned by audio engine.
    private _parent: Nullable<AbstractAudioNodeParent> = null;

    public get parent(): AbstractAudioNodeParent {
        return this._parent ?? this.engine;
    }

    public set parent(parent: Nullable<AbstractAudioNodeParent>) {
        if (this._parent === parent) {
            return;
        }

        this.parent.children.delete(this);
        this._parent = parent;
        this.parent.children.add(this);
    }

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

export abstract class AbstractNamedAudioNode extends AbstractAudioNode {
    public constructor(name: string, engine: AbstractAudioEngine, nodeType: AudioNodeType) {
        super(engine, nodeType);
        this.name = name;
    }

    public name: string;
}
