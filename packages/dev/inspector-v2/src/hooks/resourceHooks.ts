import type { DependencyList } from "react";
import type { IDisposable } from "core/index";

import { useRef, useEffect, useState } from "react";

/**
 * Custom hook to manage a resource with automatic disposal. The resource is created once initially, and recreated
 * if the factory function or any dependency changes. Whenever the resource is recreated, the previous instance is
 * disposed. The final instance is disposed when the component using this hook unmounts.
 * @param factory A function that creates the resource.
 * @param deps An optional dependency list. When any dependency changes, the resource is disposed and recreated.
 * @returns The created resource.
 */
export function useResource<T extends IDisposable | null | undefined>(factory: () => T, deps?: DependencyList): T {
    const resourceRef = useRef<T>();
    const factoryRef = useRef(factory);
    const depsRef = useRef(deps);
    const initializedRef = useRef(false);

    // Initialize resource synchronously on first call, when factory changes, or when deps change
    if (!initializedRef.current || factoryRef.current !== factory || !DepsEqual(depsRef.current, deps)) {
        // Dispose old resource if it exists
        resourceRef.current?.dispose();

        // Create new resource
        resourceRef.current = factory();
        initializedRef.current = true;
    }

    // Update refs to capture latest values
    factoryRef.current = factory;
    depsRef.current = deps;

    // Cleanup effect for component unmount
    useEffect(() => {
        return () => {
            resourceRef.current?.dispose();
            resourceRef.current = undefined;
        };
    }, []);

    return resourceRef.current as T;
}

/**
 * Custom hook to manage an asynchronous resource with automatic disposal. The resource is created once initially, and recreated
 * if the factory function or any dependency changes. Whenever the resource is recreated, the previous instance is
 * disposed. The final instance is disposed when the component using this hook unmounts.
 * @param factory A function that creates the resource.
 * @param deps An optional dependency list. When any dependency changes, the resource is disposed and recreated.
 * @returns The created resource.
 */
export function useAsyncResource<T extends IDisposable | null | undefined>(factory: (abortSignal: AbortSignal) => Promise<T>, deps?: DependencyList): T | undefined {
    const [resource, setResource] = useState<T | undefined>();
    const factoryRef = useRef(factory);

    // Update refs to capture latest values
    factoryRef.current = factory;

    useEffect(() => {
        const abortController = new AbortController();

        // Dispose old resource if it exists
        resource?.dispose();
        setResource(undefined);

        // Create new resource
        void (async () => {
            try {
                const newVal = await factory(abortController.signal);
                if (!abortController.signal.aborted) {
                    setResource(newVal); // This will trigger a re-render so the new resource is returned to caller
                } else {
                    newVal?.dispose();
                }
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }
            }
        })();

        return () => {
            abortController.abort();
            resource?.dispose();
            setResource(undefined);
        };
    }, [factory, ...(deps ?? [])]);

    return resource;
}

/**
 * Compares two dependency lists for equality.
 * @param a The first dependency list.
 * @param b The second dependency list.
 * @returns True if the dependency lists are equal.
 */
function DepsEqual(a: DependencyList | undefined, b: DependencyList | undefined): boolean {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i])) {
            return false;
        }
    }
    return true;
}
