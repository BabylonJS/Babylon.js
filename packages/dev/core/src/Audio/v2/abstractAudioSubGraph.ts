import type { Nullable } from "../../types";
import type { AbstractAudioNode, NamedAbstractAudioNode } from "./abstractAudioNode";
import type { _AbstractAudioSubNode } from "./abstractAudioSubNode";

/** @internal */
export abstract class _AbstractAudioSubGraph {
    private _createSubNodePromises = new Map<string, Promise<_AbstractAudioSubNode>>();
    private _subNodes = new Map<string, Set<NamedAbstractAudioNode>>();

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
     * Note that `callback` is executed synchronously if the sub node exists, otherwise it is executed asynchronously.
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

    /** @internal */
    public getSubNode<T extends NamedAbstractAudioNode>(name: string): Nullable<T> {
        const set = this._subNodes.get(name);

        if (!set) {
            return null;
        }

        return set.values().next().value as T;
    }

    protected abstract _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>>;
    protected abstract _onSubNodesChanged(): void;

    protected async _createSubNodePromisesResolved(): Promise<void> {
        await Promise.all(this._createSubNodePromises.values());
    }

    private _getSubNodeSet(name: string): Set<NamedAbstractAudioNode> {
        let set = this._subNodes.get(name);

        if (!set) {
            set = new Set<NamedAbstractAudioNode>();
            this._subNodes.set(name, set);
        }

        return set;
    }

    private _addSubNode(node: NamedAbstractAudioNode): void {
        this._getSubNodeSet(node.name).add(node);
        this._onSubNodesChanged();

        node.onDisposeObservable.add(this._onSubNodeDisposed);
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
        const subNode = node as NamedAbstractAudioNode;

        this._getSubNodeSet(subNode.name).delete(subNode);
        this._onSubNodesChanged();
    };

    private _onSubNodeNameChanged = (event: { oldName: string; node: NamedAbstractAudioNode }) => {
        const set = this._subNodes.get(event.oldName);

        if (!set) {
            return;
        }

        set.delete(event.node);

        this._getSubNodeSet(event.node.name).add(event.node);
    };
}
