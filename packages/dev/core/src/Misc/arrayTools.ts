/* eslint-disable @typescript-eslint/naming-convention */

import type { Observable } from "./observable";
import type { Nullable } from "../types";

/** @hidden */
interface TupleTypes<T> {
    2: [T, T];
    3: [T, T, T];
    4: [T, T, T, T];
    5: [T, T, T, T, T];
    6: [T, T, T, T, T, T];
    7: [T, T, T, T, T, T, T];
    8: [T, T, T, T, T, T, T, T];
    9: [T, T, T, T, T, T, T, T, T];
    10: [T, T, T, T, T, T, T, T, T, T];
    11: [T, T, T, T, T, T, T, T, T, T, T];
    12: [T, T, T, T, T, T, T, T, T, T, T, T];
    13: [T, T, T, T, T, T, T, T, T, T, T, T, T];
    14: [T, T, T, T, T, T, T, T, T, T, T, T, T, T];
    15: [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];
}

export interface INotifyArrayChangeType<T> {
    target: Nullable<Array<T>>;
    values: Nullable<Array<T>>;
    operation: string;
}

/**
 * Class containing a set of static utilities functions for arrays.
 */
export class ArrayTools {
    /**
     * Returns an array of the given size filled with elements built from the given constructor and the parameters.
     * @param size the number of element to construct and put in the array.
     * @param itemBuilder a callback responsible for creating new instance of item. Called once per array entry.
     * @returns a new array filled with new objects.
     */
    public static BuildArray<T>(size: number, itemBuilder: () => T): Array<T> {
        const a: T[] = [];
        for (let i = 0; i < size; ++i) {
            a.push(itemBuilder());
        }
        return a;
    }

    /**
     * Returns a tuple of the given size filled with elements built from the given constructor and the parameters.
     * @param size he number of element to construct and put in the tuple.
     * @param itemBuilder a callback responsible for creating new instance of item. Called once per tuple entry.
     * @returns a new tuple filled with new objects.
     */
    public static BuildTuple<T, N extends keyof TupleTypes<unknown>>(size: N, itemBuilder: () => T): TupleTypes<T>[N] {
        return ArrayTools.BuildArray(size, itemBuilder) as any;
    }

    private static _ProxySet<T>(observable: Observable<INotifyArrayChangeType<T>>, target: Array<T>, property: string | symbol, value: T): boolean {
        observable.notifyObservers({ target, values: [value], operation: "set" });
        return Reflect.set(target, property, value);
    }

    private static _ProxyPushOrUnshift<T>(operation: "push" | "unshift", observable: Observable<INotifyArrayChangeType<T>>, target: Array<T>, ...values: Array<T>): number {
        observable.notifyObservers({ target, values, operation });
        return operation === "push" ? Array.prototype.push.apply(target, values) : Array.prototype.unshift.apply(target, values);
    }

    private static _ProxyDelete<T>(observable: Observable<INotifyArrayChangeType<T>>, target: Array<T>, property: string | symbol) {
        observable.notifyObservers({ target, values: [Reflect.get(target, property)], operation: "delete" });
        return Reflect.deleteProperty(target, property);
    }

    private static _ProxyPopOrShift<T>(operation: "pop" | "shift", observable: Observable<INotifyArrayChangeType<T>>, target: Array<T>) {
        const value = operation === "pop" ? Array.prototype.pop.apply(target) : Array.prototype.shift.apply(target);
        observable.notifyObservers({ target, operation, values: [value] });
        return value;
    }

    private static _ProxySplice<T>(observable: Observable<INotifyArrayChangeType<T>>, target: Array<T>, start: number, deleteNumber: number, ...added: Array<T>) {
        const values = Array.prototype.splice.apply(target, [start, deleteNumber, added]);
        observable.notifyObservers({ target, values, operation: "splice" });
        return values;
    }

    public static MakeObservableArray<T>(observable: Observable<INotifyArrayChangeType<T>>, initialArray: Array<T>) {
        const _proxyObject = {
            set: (target: Array<T>, property: string | symbol, value: T) => ArrayTools._ProxySet(observable, target, property, value),
            push: (target: Array<T>, ...values: Array<T>) => ArrayTools._ProxyPushOrUnshift("push", observable, target, ...values),
            unshift: (target: Array<T>, ...values: Array<T>) => ArrayTools._ProxyPushOrUnshift("unshift", observable, target, ...values),
            delete: (target: Array<T>, property: string | symbol) => ArrayTools._ProxyDelete(observable, target, property),
            pop: (target: Array<T>) => ArrayTools._ProxyPopOrShift("pop", observable, target),
            shift: (target: Array<T>) => ArrayTools._ProxyPopOrShift("shift", observable, target),
            splice: (target: Array<T>, start: number, deleteNumber: number, ...added: Array<T>) => ArrayTools._ProxySplice(observable, target, start, deleteNumber, added),
        };

        return new Proxy(initialArray, _proxyObject);
    }
}
