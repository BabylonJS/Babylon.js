// eslint-disable-next-line import/no-internal-modules
import type { IReadonlyObservable } from "core/index";

import { Observable } from "core/Misc";
import { useEffect, useMemo } from "react";

/**
 * Creates a polling observable that notifies its observers at a specified interval.
 * @param delay The polling interval in milliseconds.
 * @returns A readonly observable that can be used to subscribe to polling notifications.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function usePollingObservable(delay: number): IReadonlyObservable<void> {
    const observable = useMemo(() => new Observable<void>(), []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            observable.notifyObservers();
        }, delay);

        return () => {
            clearInterval(intervalId);
        };
    }, [delay, observable]);

    return observable;
}
