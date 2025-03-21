import type { Nullable } from "../../../types";
import type { AbstractAudioNode, AbstractNamedAudioNode } from "../abstractAudioNode";
import type { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import type { AudioSubNode } from "./audioSubNode";

/**
 * Adds common sub graph functionality to an audio node.
 *
 * Audio nodes such as static sounds, streaming sounds, and buses can use audio sub graphs to process audio internally
 * before sending it to connected downstream audio nodes. This is useful for applying effects, spatial audio, and other
 * audio processing tasks common to multiple audio node classes.
 *
 * A key feature of audio sub graphs is their audio sub nodes are created asynchronously on demand so the minimum set
 * of sub nodes are used at all times to save memory and CPU resources. The tradeoff is a small delay when first
 * setting a property backed by a sub node. This delay is avoided by using the appropriate options to initialize the
 * sub node on creation, e.g. `spatialEnabled` and `stereoEnabled`, or by setting any creation option backed by the
 * sub node, e.g. `spatialPosition` and `stereoPan`.
 *
 * @internal
 */
export abstract class _AbstractAudioSubGraph {
    private _createSubNodePromises: { [key: string]: Promise<_AbstractAudioSubNode> } = {};
    private _isDisposed = false;
    private _subNodes: { [key: string]: _AbstractAudioSubNode } = {};

    /**
     * Executes the given callback with the named sub node, creating the sub node if needed.
     *
     * @param name The name of the sub node
     * @param callback The function to call with the named sub node
     *
     * @internal
     */
    public callOnSubNode<T extends _AbstractAudioSubNode>(name: AudioSubNode, callback: (node: T) => void): void {
        const node = this.getSubNode(name);
        if (node) {
            callback(node as T);
            return;
        }

        this._createSubNodePromisesResolved().then(() => {
            const node = this.getSubNode(name);
            if (node) {
                callback(node as T);
                return;
            }

            this.createAndAddSubNode(name).then((node) => {
                callback(node as T);
            });
        });
    }

    /**
     * Creates the named subnode and adds it to the sub graph.
     *
     * @param name The name of the sub node.
     * @returns A promise that resolves to the created sub node.
     *
     * @internal
     */
    public createAndAddSubNode(name: AudioSubNode): Promise<_AbstractAudioSubNode> {
        this._createSubNodePromises[name] ||= this._createSubNode(name).then((node) => {
            this._addSubNode(node);
            return node;
        });

        return this._createSubNodePromises[name];
    }

    /**
     * Releases associated resources.
     *
     * @internal
     */
    public dispose() {
        this._isDisposed = true;

        const subNodes = Object.values(this._subNodes);
        for (const subNode of subNodes) {
            subNode.dispose();
        }

        this._subNodes = {};
        this._createSubNodePromises = {};
    }

    /**
     * Gets a previously created sub node.
     *
     * @param name - The name of the sub node
     * @returns The named sub node, or `null` if it has not been created, yet
     *
     * @internal
     * */
    public getSubNode<T extends _AbstractAudioSubNode>(name: string): Nullable<T> {
        return (this._subNodes[name] as T) ?? null;
    }

    /**
     * Removes a sub node from the sub graph.
     *
     * @param subNode - The sub node to remove
     * @returns A promise that resolves when the sub node is removed
     *
     * @internal
     */
    public async removeSubNode(subNode: _AbstractAudioSubNode): Promise<void> {
        await this._createSubNodePromisesResolved();

        const name = subNode.name;
        if (this._subNodes[name]) {
            delete this._subNodes[name];
        }

        delete this._createSubNodePromises[name];

        this._onSubNodesChanged();
    }

    protected abstract _createSubNode(name: string): Promise<_AbstractAudioSubNode>;

    /**
     * Called when sub-nodes are added or removed.
     * - Override this to connect and reconnect sub-nodes as needed.
     */
    protected abstract _onSubNodesChanged(): void;

    protected _createSubNodePromisesResolved(): Promise<_AbstractAudioSubNode[]> {
        return Promise.all(Object.values(this._createSubNodePromises));
    }

    private _addSubNode(node: _AbstractAudioSubNode): void {
        if (this._isDisposed) {
            node.dispose();
            return;
        }

        this._subNodes[node.name] = node;

        node.onDisposeObservable.addOnce(this._onSubNodeDisposed);

        this._onSubNodesChanged();
    }

    private _onSubNodeDisposed = (node: AbstractAudioNode) => {
        const subNode = node as AbstractNamedAudioNode;

        delete this._subNodes[subNode.name];

        this._onSubNodesChanged();
    };
}
