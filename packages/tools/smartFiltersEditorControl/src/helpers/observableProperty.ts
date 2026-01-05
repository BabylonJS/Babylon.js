import { Observable } from "core/Misc/observable.js";

/**
 * An Observable that doesn't allow you to notify observers.
 */
export type ReadOnlyObservable<T> = Omit<Observable<T>, "notifyObserver" | "notifyObservers">;

/**
 * Represents a property that can be observed for changes. The value property is read-only.
 */
export class ReadOnlyObservableProperty<T> {
    protected _value: T;
    protected _onChangedObservable: Observable<T> = new Observable<T>();

    public get value(): T {
        return this._value;
    }

    public readonly onChangedObservable: ReadOnlyObservable<T>;

    public constructor(value: T) {
        this._value = value;
        this.onChangedObservable = this._onChangedObservable;
    }
}

/**
 * Represents a property that can be observed for changes. The setter of the value property
 * will notify observers of the onChangedObservable about the change.
 */
export class ObservableProperty<T> extends ReadOnlyObservableProperty<T> {
    public override get value(): T {
        return this._value;
    }

    public override set value(newValue: T) {
        if (this._value !== newValue) {
            this._value = newValue;
            this._onChangedObservable.notifyObservers(this._value);
        }
    }
}
