import type { Nullable } from "core/index";

import type { OnOpenChangeData, PositioningImperativeRef } from "@fluentui/react-components";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { AsyncLock } from "core/Misc/asyncLock";
import { Deferred } from "core/Misc/deferred";

const SequencerLock = new AsyncLock();

/**
 * Creates a hook for managing teaching moment state.
 * @param name The unique name of the teaching moment.
 * @returns A hook that returns the teaching moment state.
 */
export function MakeTeachingMoment(name: string) {
    return (suppress?: boolean) => {
        const [hasDisplayed, setHasDisplayed, resetDisplayed] = useLocalStorage(`Babylon/TeachingMoments/${name}`, false);
        const [shouldDisplay, setShouldDisplay] = useState(false);

        const deferredRef = useRef<Deferred<void>>();

        useEffect(() => {
            if (!hasDisplayed && !suppress && !deferredRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                SequencerLock.lockAsync(async () => {
                    deferredRef.current = new Deferred<void>();
                    setShouldDisplay(true);
                    // Just hold the lock until the hook cleanup, which is effectively component unmount (e.g. the teaching moment is dismissed).
                    await deferredRef.current.promise;
                });
            }

            return () => {
                deferredRef.current?.resolve();
            };
        }, [hasDisplayed, suppress]);

        const onDismissed = useCallback(() => {
            setHasDisplayed(true);
            deferredRef.current?.resolve();
            deferredRef.current = undefined;
            setShouldDisplay(false);
        }, []);

        return {
            shouldDisplay,
            onDismissed,
            reset: resetDisplayed,
        } as const;
    };
}

/**
 * Creates a hook for managing teaching moment state for a dialog.
 * @param name The unique name of the teaching moment.
 * @returns A hook that returns the teaching moment state for a dialog.
 */
export function MakeDialogTeachingMoment(name: string) {
    const useTeachingMoment = MakeTeachingMoment(name);

    return (suppress?: boolean) => {
        const { shouldDisplay, onDismissed, reset } = useTeachingMoment(suppress);

        const onOpenChange = useCallback((e: unknown, data: OnOpenChangeData) => {
            if (!data.open) {
                onDismissed();
            }
        }, []);

        return {
            shouldDisplay,
            onOpenChange,
            reset,
        } as const;
    };
}

/**
 * Creates a hook for managing teaching moment state for a popover.
 * @param name The unique name of the teaching moment.
 * @returns A hook that returns the teaching moment state for a popover.
 */
export function MakePopoverTeachingMoment(name: string) {
    const useDialogTeachingMoment = MakeDialogTeachingMoment(name);

    return (suppress?: boolean) => {
        const [target, setTarget] = useState<Nullable<HTMLElement>>(null);
        const [positioningRef, setPositioningRef] = useState<Nullable<PositioningImperativeRef>>(null);

        const { shouldDisplay, onOpenChange, reset } = useDialogTeachingMoment(suppress || !target || !positioningRef);

        useEffect(() => {
            if (target && positioningRef) {
                positioningRef.setTarget(target);
            }
        }, [target, positioningRef]);

        return {
            shouldDisplay,
            positioningRef: setPositioningRef,
            targetRef: setTarget,
            onOpenChange,
            reset,
        } as const;
    };
}
