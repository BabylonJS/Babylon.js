import { type IDisposable, type IReadonlyObservable } from "core/index";

import { Observable } from "core/Misc/observable";

/**
 * A read-only view of a collection whose changes can be observed.
 */
export interface IReadonlyObservableCollection<T> {
    /**
     * An observable that notifies observers when the collection changes.
     */
    readonly observable: IReadonlyObservable<void>;

    /**
     * The items in the collection.
     */
    readonly items: readonly T[];
}

/**
 * A collection of items that can be observed for changes.
 */
export class ObservableCollection<T> implements IReadonlyObservableCollection<T>, IDisposable {
    private readonly _items: T[] = [];
    private readonly _keys: symbol[] = [];
    private readonly _observable = new Observable<void>();
    private _isDisposed = false;

    /**
     * An observable that notifies observers when the collection changes.
     */
    public get observable(): IReadonlyObservable<void> {
        return this._observable;
    }

    /**
     * The items in the collection.
     */
    public get items(): readonly T[] {
        return this._items;
    }

    /**
     * Adds an item to the collection.
     * @param item The item to add.
     * @returns A disposable that removes the item from the collection when disposed.
     */
    public add(item: T): IDisposable {
        if (this._isDisposed) {
            throw new Error("Observable collection is disposed.");
        }

        const key = Symbol();
        this._items.push(item);
        this._keys.push(key);
        this._observable.notifyObservers();

        return {
            dispose: () => {
                const index = this._keys.indexOf(key);
                if (index === -1) {
                    return;
                }

                this._items.splice(index, 1);
                this._keys.splice(index, 1);
                this._observable.notifyObservers();
            },
        };
    }

    /**
     * Removes all items and observers and rejects subsequent additions.
     */
    public dispose(): void {
        if (this._isDisposed) {
            return;
        }

        this._isDisposed = true;
        this._items.length = 0;
        this._keys.length = 0;
        this._observable.notifyObservers();
        this._observable.clear();
    }
}
