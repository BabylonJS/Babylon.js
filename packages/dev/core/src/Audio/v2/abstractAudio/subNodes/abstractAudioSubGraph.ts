import type { Nullable } from "../../../../types";
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
 * of sub nodes are used at all times to save memory and CPU resources. The tradeoff is there a small delay when first
 * setting a property backed by a sub node. This delay is avoided by using the appropriate options to initialize the
 * sub node on creation, e.g. `spatialEnabled` and `stereoEnabled`, or by setting any creation option backed by the
 * sub node, e.g. `spatialPosition` and `stereoPan`.
 *
 * @internal
 */
export abstract class _AbstractAudioSubGraph {
    private _createSubNodePromises = new Map<string, Promise<_AbstractAudioSubNode>>();
    private _subNodes = new Map<string, Set<AbstractNamedAudioNode>>();

    /**
     * Releases associated resources.
     */
    public dispose() {
        const subNodeIterator = this._subNodes.values();
        for (let nextSubNode = subNodeIterator.next(); !nextSubNode.done; nextSubNode = subNodeIterator.next()) {
            const subNodeSetIterator = nextSubNode.value.values();
            for (let nextSubNodeSet = subNodeSetIterator.next(); !nextSubNodeSet.done; nextSubNodeSet = subNodeSetIterator.next()) {
                nextSubNodeSet.value.dispose();
            }
        }

        this._subNodes.clear();
        this._createSubNodePromises.clear();
    }

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

        const promise = this._createSubNodePromises.get(name) ?? this._createAndAddSubNode(name);

        promise?.then((node) => {
            callback(node as T);
        });
    }

    /**
     * Gets a previously created sub node.
     * @param name - The name of the sub node
     * @returns The named sub node, or `null` if has not been created, yet
     * @internal
     * */
    public getSubNode<T extends AbstractNamedAudioNode>(name: string): Nullable<T> {
        const set = this._subNodes.get(name);

        if (!set) {
            return null;
        }

        return set.values().next().value as T;
    }

    protected abstract _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>>;

    /**
     * Called when sub-nodes are added or removed.
     * - Override this to connect and reconnect sub-nodes as needed.
     */
    protected _onSubNodesChanged(): void {}

    protected async _createSubNodePromisesResolved(): Promise<void> {
        await Promise.all(this._createSubNodePromises.values());
    }

    private _getSubNodeSet(name: string): Set<AbstractNamedAudioNode> {
        let set = this._subNodes.get(name);

        if (!set) {
            set = new Set<AbstractNamedAudioNode>();
            this._subNodes.set(name, set);
        }

        return set;
    }

    private _addSubNode(node: AbstractNamedAudioNode): void {
        this._getSubNodeSet(node.name).add(node);
        this._onSubNodesChanged();

        node.onDisposeObservable.addOnce(this._onSubNodeDisposed);
        node.onNameChangedObservable.add(this._onSubNodeNameChanged);
    }

    protected _createAndAddSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>> {
        const promise = this._createSubNode(name);

        if (!promise) {
            return null;
        }

        promise.then((node) => {
            this._addSubNode(node);
        });

        this._createSubNodePromises.set(name, promise);

        return promise;
    }

    private _onSubNodeDisposed = (node: AbstractAudioNode) => {
        const subNode = node as AbstractNamedAudioNode;

        this._getSubNodeSet(subNode.name).delete(subNode);
        this._onSubNodesChanged();
    };

    private _onSubNodeNameChanged = (event: { oldName: string; node: AbstractNamedAudioNode }) => {
        const set = this._subNodes.get(event.oldName);

        if (!set) {
            return;
        }

        set.delete(event.node);

        this._getSubNodeSet(event.node.name).add(event.node);
    };
}
