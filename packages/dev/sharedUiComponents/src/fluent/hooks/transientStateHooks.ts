import { useCallback, useRef, useState } from "react";

/**
 * A hook that provides a transient state value and a "pulse" function to set it.
 * The transient value is meant to be consumed immediately after being set, and will be cleared on the next render.
 * @typeParam T The type of the transient value.
 * @returns A tuple containing the transient value and a function to "pulse" the state.
 */
export function useImpulse<T>(): [T | undefined, (value: T) => void] {
    const impulseRef = useRef<T | undefined>(undefined);
    const [, setVersion] = useState(0);

    const pulse = useCallback((value: T) => {
        impulseRef.current = value;
        setVersion((v) => v + 1);
    }, []);

    // Consume the impulse value and clear it
    const value = impulseRef.current;
    impulseRef.current = undefined;

    return [value, pulse];
}
