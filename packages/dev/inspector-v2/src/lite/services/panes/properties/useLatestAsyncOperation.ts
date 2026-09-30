import { type IReadonlyObservable } from "core/index";
import { useCallback, useEffect, useRef, useState } from "react";

/** State published by the latest asynchronous row operation. */
export type LatestAsyncOperationState = Readonly<{
    pending: boolean;
    error?: string;
}>;

/** State published independently for each asynchronous row operation. */
export type LatestAsyncOperationStates = Readonly<Record<string, LatestAsyncOperationState | undefined>>;

type PublishedStates = Readonly<{
    epoch: number;
    rows: LatestAsyncOperationStates;
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
 * @param invalidationSources Disposal and selection changes that invalidate operation ownership.
 * @param isDisposed Returns whether the owning service has been disposed.
 * @returns The latest operation state for each row and a guarded operation runner.
 */
export function useLatestAsyncOperation(
    identity: object,
    invalidationSources: readonly [IReadonlyObservable<void>, IReadonlyObservable<void>],
    isDisposed: () => boolean
): readonly [LatestAsyncOperationStates, <ResultT>(options: LatestAsyncOperationOptions<ResultT>) => void] {
    const [publishedStates, setPublishedStates] = useState<PublishedStates>({ epoch: -1, rows: {} });
    const epochRef = useRef(0);
    const rowGenerationsRef = useRef(new Map<string, number>());
    const mountedRef = useRef(false);
    const identityRef = useRef(identity);

    if (identityRef.current !== identity) {
        identityRef.current = identity;
        epochRef.current++;
        rowGenerationsRef.current.clear();
    }

    const [firstInvalidationSource, secondInvalidationSource] = invalidationSources;

    useEffect(() => {
        mountedRef.current = true;
        const invalidate = () => {
            epochRef.current++;
            rowGenerationsRef.current.clear();
            if (mountedRef.current) {
                setPublishedStates({ epoch: epochRef.current, rows: {} });
            }
        };
        const sources = [firstInvalidationSource, secondInvalidationSource] as const;
        const observers = sources.map((source) => source.add(invalidate));
        invalidate();

        return () => {
            mountedRef.current = false;
            epochRef.current++;
            rowGenerationsRef.current.clear();
            observers.forEach((observer) => observer.remove());
        };
    }, [identity, firstInvalidationSource, secondInvalidationSource]);

    const run = useCallback(
        <ResultT>(options: LatestAsyncOperationOptions<ResultT>) => {
            const { id, operationAsync, onSuccess, getErrorMessage } = options;
            const epoch = epochRef.current;
            const generation = (rowGenerationsRef.current.get(id) ?? 0) + 1;
            rowGenerationsRef.current.set(id, generation);
            setPublishedStates((current) => ({
                epoch,
                rows: { ...(current.epoch === epoch ? current.rows : {}), [id]: { pending: true } },
            }));

            void (async () => {
                try {
                    const result = await operationAsync();
                    if (mountedRef.current && epochRef.current === epoch && rowGenerationsRef.current.get(id) === generation && identityRef.current === identity && !isDisposed()) {
                        onSuccess?.(result);
                        if (epochRef.current === epoch && rowGenerationsRef.current.get(id) === generation) {
                            setPublishedStates((current) => ({
                                epoch,
                                rows: { ...(current.epoch === epoch ? current.rows : {}), [id]: { pending: false } },
                            }));
                        }
                    }
                } catch (error) {
                    if (mountedRef.current && epochRef.current === epoch && rowGenerationsRef.current.get(id) === generation && identityRef.current === identity && !isDisposed()) {
                        setPublishedStates((current) => ({
                            epoch,
                            rows: { ...(current.epoch === epoch ? current.rows : {}), [id]: { pending: false, error: getErrorMessage(error) } },
                        }));
                    }
                }
            })();
        },
        [identity, isDisposed]
    );

    return [publishedStates.epoch === epochRef.current ? publishedStates.rows : {}, run] as const;
}
