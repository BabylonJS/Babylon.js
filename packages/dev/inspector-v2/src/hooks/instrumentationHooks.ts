// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IReadonlyObservable } from "core/index";

import { useEffect, useMemo } from "react";

import { Observable } from "core/Misc/observable";

import { InterceptFunction } from "../instrumentation/functionInstrumentation";
import { InterceptProperty } from "../instrumentation/propertyInstrumentation";

/**
 * Provides an observable that fires when a specified function/property is called/set.
 * @param type The type of the interceptor, either "function" or "property".
 * @param target The object containing the function/property to intercept.
 * @param propertyKey The key of the function/property to intercept.
 * @returns An observable that fires when the function/property is called/set.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function useInterceptObservable<T extends object>(type: "function" | "property", target: T, propertyKey: keyof T): IReadonlyObservable<void> {
    // Create a cached observable. It effectively has the lifetime of the component that uses this hook.
    const observable = useMemo(() => new Observable<void>(), []);

    // Whenver the type, target, or property key changes, we need to set up a new interceptor.
    useEffect(() => {
        let interceptToken: IDisposable;

        if (type === "function") {
            interceptToken = InterceptFunction(target, propertyKey, {
                afterCall: () => {
                    observable.notifyObservers();
                },
            });
        } else if (type === "property") {
            interceptToken = InterceptProperty(target, propertyKey, {
                afterSet: () => {
                    observable.notifyObservers();
                },
            });
        } else {
            throw new Error(`Unknown interceptor type: ${type}`);
        }

        // When the effect is cleaned up, we need to dispose of the interceptor.
        return () => {
            interceptToken.dispose();
        };
    }, [type, target, propertyKey, observable]);

    return observable;
}
