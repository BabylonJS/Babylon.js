import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractAudioSubNode } from "./abstractAudioSubNode";
import type { IAudioParentNode } from "./audioParentNode";

/** @internal */
export abstract class AbstractAudioSubGraph {
    private _subNodePromises = new Map<string, Promise<AbstractAudioSubNode>>();

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

    /** @internal */
    public addSubNode(child: AbstractAudioNode): void {
        const set = this._getSubNodeSet(child.name);
        set.add(child);
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

        let promise = this._subNodePromises.get(name) ?? null;

        if (!promise) {
            promise = this._createSubNode(name);

            if (promise) {
                this._subNodePromises.set(name, promise);
            }
        }

        promise?.then((node) => {
            callback(node as T);
        });
    }

    protected abstract _createSubNode(name: string): Nullable<Promise<AbstractAudioSubNode>>;

    protected _hasSubNode(name: string): boolean {
        const set = this._children.get(name);

        if (!set) {
            return false;
        }

        return set.size > 0;
    }

    protected _removeSubNode(child: AbstractAudioNode): void {
        const set = this._children.get(child.name);

        if (set) {
            set.delete(child);
        }
    }

    protected _getSubNodeSet(name: string): Set<AbstractAudioNode> {
        let set = this._children.get(name);

        if (!set) {
            set = new Set<AbstractAudioNode>();
            this._children.set(name, set);
        }

        return set;
    }
}
