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
