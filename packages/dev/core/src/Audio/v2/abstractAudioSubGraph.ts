import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractAudioSubNode } from "./abstractAudioSubNode";
import type { IAudioParentNode } from "./audioParentNode";

/** @internal */
export abstract class AbstractAudioSubGraph {
    private _createSubNodePromises = new Map<string, Promise<AbstractAudioSubNode>>();

    protected _owner: IAudioParentNode;

    /** @internal */
    constructor(owner: IAudioParentNode) {
        this._owner = owner;
    }

    private get _children(): Map<string, Set<AbstractAudioNode>> {
        return this._owner.children;
    }

    /** @internal */
    public getSubNode<T extends AbstractAudioNode>(name: string): Nullable<T> {
        const set = this._children.get(name);

        if (!set) {
            return null;
        }

        return set.values().next().value as T;
    }

    /**
     * Executes the given callback with the named sub node, creating the sub node if needed.
     *
     * Note that `callback` is executed synchronously if the sub node exists, otherwise it is executed asynchronously.
     *
     * @param name The name of the sub node
     * @param callback The function to call with the named sub node
     */
    public callOnSubNode<T extends AbstractAudioSubNode>(name: string, callback: (node: T) => void): void {
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

    protected abstract _createSubNode(name: string): Nullable<Promise<AbstractAudioSubNode>>;
    protected abstract _onSubNodesChanged(): void;

    protected async _createSubNodePromisesResolved(): Promise<void> {
        await Promise.all(this._createSubNodePromises.values());
    }

    protected _getSubNodeSet(name: string): Set<AbstractAudioNode> {
        let set = this._children.get(name);

        if (!set) {
            set = new Set<AbstractAudioNode>();
            this._children.set(name, set);
        }

        return set;
    }

    protected _hasSubNode(name: string): boolean {
        const set = this._children.get(name);

        if (!set) {
            return false;
        }

        return set.size > 0;
    }

    protected _addSubNode(child: AbstractAudioNode): void {
        this._getSubNodeSet(child.name).add(child);
        this._onSubNodesChanged();
    }

    protected _createAndAddSubNode(name: string): Nullable<Promise<AbstractAudioSubNode>> {
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
}
