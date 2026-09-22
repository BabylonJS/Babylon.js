import { type IReadonlyObservable } from "core/index";
import { useCallback, useEffect, useRef, useState } from "react";

/** State published by the latest asynchronous row operation. */
export type LatestAsyncOperationState = Readonly<{
    id?: string;
    pending: boolean;
    error?: string;
}>;

type LatestAsyncOperationOptions<ResultT> = Readonly<{
    id: string;
    operationAsync: () => Promise<ResultT>;
    onSuccess?: (result: ResultT) => void;
    getErrorMessage: (error: unknown) => string;
}>;

/**
 * Runs row operations with instance-local generations and invalidates them when their owner changes.
 * Rejections are always consumed, while only the latest mounted generation may publish state or success effects.
 * @param identity The exact entity represented by the mounted adapter.
 * @param invalidationSources Observables that invalidate snapshots or selection ownership.
 * @param isDisposed Returns whether the owning service has been disposed.
 * @returns The latest operation state and a guarded operation runner.
 */
export function useLatestAsyncOperation(
    identity: object,
    invalidationSources: readonly [IReadonlyObservable<void>, IReadonlyObservable<void>, IReadonlyObservable<void>],
    isDisposed: () => boolean
): readonly [LatestAsyncOperationState, <ResultT>(options: LatestAsyncOperationOptions<ResultT>) => void] {
    const [state, setState] = useState<LatestAsyncOperationState>({ pending: false });
    const generationRef = useRef(0);
    const mountedRef = useRef(false);
    const identityRef = useRef(identity);

    if (identityRef.current !== identity) {
        identityRef.current = identity;
        generationRef.current++;
    }

    const [firstInvalidationSource, secondInvalidationSource, thirdInvalidationSource] = invalidationSources;

    useEffect(() => {
        mountedRef.current = true;
        const invalidate = () => {
            generationRef.current++;
            if (mountedRef.current) {
                setState({ pending: false });
            }
        };
        const sources = [firstInvalidationSource, secondInvalidationSource, thirdInvalidationSource] as const;
        const observers = sources.map((source) => source.add(invalidate));
        invalidate();

        return () => {
            mountedRef.current = false;
            generationRef.current++;
            observers.forEach((observer) => observer.remove());
        };
    }, [identity, firstInvalidationSource, secondInvalidationSource, thirdInvalidationSource]);

    const run = useCallback(
        <ResultT>(options: LatestAsyncOperationOptions<ResultT>) => {
            const { id, operationAsync, onSuccess, getErrorMessage } = options;
            const generation = ++generationRef.current;
            setState({ id, pending: true });

            void (async () => {
                try {
                    const result = await operationAsync();
                    if (mountedRef.current && generationRef.current === generation && identityRef.current === identity && !isDisposed()) {
                        onSuccess?.(result);
                        if (generationRef.current === generation) {
                            setState({ pending: false });
                        }
                    }
                } catch (error) {
                    if (mountedRef.current && generationRef.current === generation && identityRef.current === identity && !isDisposed()) {
                        setState({ id, pending: false, error: getErrorMessage(error) });
                    }
                }
            })();
        },
        [identity, isDisposed]
    );

    return [state, run] as const;
}
