import type { WindowOptions } from "./eventHooks";

import { useCallback, useState } from "react";

import { useEventListener } from "./eventHooks";

type KeyCallbacks = {
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
};

export function useKeyListener(callbacks: KeyCallbacks, options?: WindowOptions) {
    const callbackMap = new Map<"keydown" | "keyup", ((e: KeyboardEvent) => void) | undefined>([
        ["keydown", callbacks.onKeyDown],
        ["keyup", callbacks.onKeyUp],
    ]);

    for (const eventType of ["keydown", "keyup"] as const) {
        const handler = callbackMap.get(eventType);
        if (handler) {
            // Ignore repeated events from holding down a key.
            const guardedHandler = (e: KeyboardEvent) => {
                if (!e.repeat) {
                    handler(e);
                }
            };

            useEventListener("document", eventType, guardedHandler, options);
        }
    }
}

type KeyStateOptions = WindowOptions & {
    preventDefault?: boolean;
};

export function useKeyState(key: string, options?: KeyStateOptions): boolean {
    const [isPressed, setIsPressed] = useState(false);

    useKeyListener(
        {
            onKeyDown: useCallback(
                (e: KeyboardEvent) => {
                    if (e.key === key) {
                        if (options?.preventDefault) {
                            e.preventDefault();
                        }
                        setIsPressed(true);
                    }
                },
                [key, options?.preventDefault]
            ),
            onKeyUp: useCallback(
                (e: KeyboardEvent) => {
                    if (e.key === key) {
                        if (options?.preventDefault) {
                            e.preventDefault();
                        }
                        setIsPressed(false);
                    }
                },
                [key, options?.preventDefault]
            ),
        },
        options
    );

    useEventListener(
        "window",
        "blur",
        useCallback(() => setIsPressed(false), []),
        options
    ); // Reset state on window blur to avoid stuck keys

    return isPressed;
}
