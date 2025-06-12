import { Observable } from "@babylonjs/core/Misc/observable.js";

/**
 * An Observable that doesn't allow you to notify observers.
 */
export type ReadOnlyObservable<T> = Omit<Observable<T>, "notifyObserver" | "notifyObservers">;

/**
 * Represents a property that can be observed for changes. The setter of the value property
 * will notify observers of the onChangedObservable about the change.
 */
export class ObservableProperty<T> {
    private _value: T;
    private _onChangedObservable: Observable<T> = new Observable<T>();

    public get value(): T {
        return this._value;
    }

    public set value(newValue: T) {
        if (this._value !== newValue) {
            this._value = newValue;
            this._onChangedObservable.notifyObservers(this._value);
        }
    }
    public readonly onChangedObservable: ReadOnlyObservable<T>;

    public constructor(value: T) {
        this._value = value;
        this.onChangedObservable = this._onChangedObservable;
    }
}
