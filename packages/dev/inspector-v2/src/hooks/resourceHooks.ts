import type { IDisposable } from "core/index";

import { useRef, useEffect } from "react";

/**
 * Custom hook to manage a resource with automatic disposal. The resource is created once initially, and recreated
 * if the factory function changes. Whenever the resource is recreated, the previous instance is disposed. The final
 * instance is disposed when the component using this hook unmounts.
 * @param factory A function that creates the resource.
 * @returns The created resource.
 */
export function useResource<T extends IDisposable>(factory: () => T): T {
    const resourceRef = useRef<T>();
    const factoryRef = useRef(factory);

    // Initialize resource synchronously on first call or when factory changes
    if (!resourceRef.current || factoryRef.current !== factory) {
        // Dispose old resource if it exists
        resourceRef.current?.dispose();

        // Create new resource
        resourceRef.current = factory();
    }

    // Update refs to capture latest values
    factoryRef.current = factory;

    // Cleanup effect for component unmount
    useEffect(() => {
        return () => {
            resourceRef.current?.dispose();
            resourceRef.current = undefined;
        };
    }, []);

    return resourceRef.current;
}

/**
 * Custom hook to manage an asynchronous resource with automatic disposal. The resource is created once initially, and recreated
 * if the factory function changes. Whenever the resource is recreated, the previous instance is disposed. The final
 * instance is disposed when the component using this hook unmounts.
 * @param factory A function that creates the resource.
 * @returns The created resource.
 */
export function useAsyncResource<T extends IDisposable>(factory: (abortSignal: AbortSignal) => Promise<T>): T | undefined {
    const resourceRef = useRef<T>();
    const factoryRef = useRef(factory);

    // Update refs to capture latest values
    factoryRef.current = factory;

    useEffect(() => {
        const abortController = new AbortController(); // Create AbortController
        const currentResource: T | undefined = resourceRef.current;

        // Dispose old resource if it exists
        currentResource?.dispose();
        resourceRef.current = undefined;

        // Create new resource
        void (async () => {
            try {
                const newVal = await factory(abortController.signal); // Pass the signal
                if (!abortController.signal.aborted) {
                    resourceRef.current = newVal;
                } else {
                    newVal.dispose();
                }
            } catch (error) {
                // Handle abortion gracefully
                if (error instanceof Error && error.name === "AbortError") {
                    // Request was aborted, this is expected
                    return;
                }
                // Optionally handle other errors here
                global.console.error("Failed to create async resource:", error);
            }
        })();

        return () => {
            abortController.abort(); // Abort the operation
            resourceRef.current?.dispose();
            resourceRef.current = undefined;
        };
    }, [factory]);

    return resourceRef.current;
}
