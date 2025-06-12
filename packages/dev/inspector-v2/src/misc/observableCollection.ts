// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IReadonlyObservable } from "core/index";

import { Observable } from "core/Misc/observable";

/**
 * A collection of items that can be observed for changes.
 */
export class ObservableCollection<T> {
    private readonly _items: T[] = [];
    private readonly _keys: symbol[] = [];
    private readonly _observable = new Observable<void>();

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
        const key = Symbol();
        this._items.push(item);
        this._keys.push(key);
        this._observable.notifyObservers();

        return {
            dispose: () => {
                const index = this._keys.indexOf(key);
                this._items.splice(index, 1);
                this._keys.splice(index, 1);
                this._observable.notifyObservers();
            },
        };
    }
}
