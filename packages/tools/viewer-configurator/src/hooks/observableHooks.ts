// eslint-disable-next-line import/no-internal-modules
import type { Observable } from "core/index";

import { useEffect, useState } from "react";

/**
 * Returns the current value of the accessor and updates it when the specified event is fired on the specified element.
 * @param accessor A function that returns the current value.
 * @param element The element to listen for the event on.
 * @param eventNames The names of the events to listen for.
 * @returns The current value of the accessor.
 */
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
export function useObservableState<T>(accessor: () => T, ...observables: Array<Observable<any> | null | undefined>): T {
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
