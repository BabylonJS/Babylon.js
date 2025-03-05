import type { Nullable } from "../../../types";
import type { AbstractAudioNode, AbstractNamedAudioNode } from "../abstractAudioNode";
import type { _AbstractAudioSubNode } from "./abstractAudioSubNode";

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
    private _subNodes: { [key: string]: AbstractNamedAudioNode } = {};

    /**
     * Executes the given callback with the named sub node, creating the sub node if needed.
     *
     * Note that `callback` is executed synchronously if the sub node already exists, otherwise the sub node is created
     * asynchronously before `callback` is executed.
     *
     * @param name The name of the sub node
     * @param callback The function to call with the named sub node
     */
    public callOnSubNode<T extends _AbstractAudioSubNode>(name: string, callback: (node: T) => void): void {
        const node = this.getSubNode(name);
        if (node) {
            callback(node as T);
            return;
        }

        const promise = this._createSubNodePromises[name] ?? this._createAndAddSubNode(name);

        promise.then((node) => {
            callback(node as T);
        });
    }

    /**
     * Releases associated resources.
     */
    public dispose() {
        const subNodes = Object.values(this._subNodes);
        for (const subNode of subNodes) {
            subNode.dispose();
        }

        this._subNodes = {};
        this._createSubNodePromises = {};
    }

    /**
     * Gets a previously created sub node.
     * @param name - The name of the sub node
     * @returns The named sub node, or `null` if it has not been created, yet
     * @internal
     * */
    public getSubNode<T extends AbstractNamedAudioNode>(name: string): Nullable<T> {
        return (this._subNodes[name] as T) ?? null;
    }

    protected abstract _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>>;

    /**
     * Called when sub-nodes are added or removed.
     * - Override this to connect and reconnect sub-nodes as needed.
     */
    protected _onSubNodesChanged(): void {}

    protected _createSubNodePromisesResolved(): Promise<_AbstractAudioSubNode[]> {
        return Promise.all(Object.values(this._createSubNodePromises));
    }

    private _addSubNode(node: AbstractNamedAudioNode): void {
        this._subNodes[node.name] = node;

        node.onDisposeObservable.addOnce(this._onSubNodeDisposed);

        this._onSubNodesChanged();
    }

    protected _createAndAddSubNode(name: string): Promise<_AbstractAudioSubNode> {
        const promise = this._createSubNode(name);

        if (!promise) {
            return Promise.reject(`Failed to create subnode "${name}"`);
        }

        this._createSubNodePromises[name] = new Promise((resolve, reject) => {
            promise
                .then((node) => {
                    this._addSubNode(node);
                    resolve(node);
                })
                .catch((error) => {
                    reject(error);
                });
        });

        return promise;
    }

    private _onSubNodeDisposed = (node: AbstractAudioNode) => {
        const subNode = node as AbstractNamedAudioNode;

        delete this._subNodes[subNode.name];

        this._onSubNodesChanged();
    };
}
