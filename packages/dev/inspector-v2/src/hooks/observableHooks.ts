// eslint-disable-next-line import/no-internal-modules
import type { IReadonlyObservable } from "core/index";

import type { ObservableCollection } from "../misc/observableCollection";

import { useEffect, useMemo, useState } from "react";

/**
 * Returns the current value of the accessor and updates it when the specified event is fired on the specified element.
 * @param accessor A function that returns the current value.
 * @param element The element to listen for the event on.
 * @param eventNames The names of the events to listen for.
 * @returns The current value of the accessor.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useEventfulState<T>(accessor: () => T, element: HTMLElement | null | undefined, ...eventNames: string[]): T {
    const [current, setCurrent] = useState(accessor);

    useEffect(() => {
        setCurrent(accessor);
        if (element) {
            const removers = eventNames.map((eventName) => {
                const handler = () => {
                    setCurrent(accessor());
                };

                element.addEventListener(eventName, handler);

                return () => {
                    element.removeEventListener(eventName, handler);
                };
            });

            return () => {
                removers.forEach((remove) => remove());
            };
        }

        return undefined;
    }, [element]);

    return current;
}

/**
 * Returns the current value of the accessor and updates it when any of the specified observables change.
 * @param accessor A function that returns the current value.
 * @param observables The observables to listen for changes on.
 * @returns The current value of the accessor.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useObservableState<T>(accessor: () => T, ...observables: Array<IReadonlyObservable | null | undefined>): T {
    const [current, setCurrent] = useState(accessor);

    useEffect(() => {
        setCurrent(accessor);
        const observers = observables.map((observable) => {
            if (observable) {
                const observer = observable.add(() => {
                    setCurrent(accessor());
                });

                return observer;
            }
            return null;
        });

        return () => {
            observers.forEach((observer) => observer?.remove());
        };
    }, [...observables]);

    return current;
}

/**
 * Returns a copy of the items in the collection and updates it when the collection changes.
 * @param collection The collection to observe.
 * @returns A copy of the items in the collection.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useObservableCollection<T>(collection: ObservableCollection<T>) {
    return useObservableState(() => [...collection.items], collection.observable);
}

/**
 * Returns a copy of the items in the collection sorted by the order property and updates it when the collection changes.
 * @param collection The collection to observe.
 * @returns A copy of the items in the collection sorted by the order property.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useOrderedObservableCollection<T extends Readonly<{ order?: number }>>(collection: ObservableCollection<T>) {
    const items = useObservableCollection(collection);
    const sortedItems = useMemo(() => items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [items]);
    return sortedItems;
}
