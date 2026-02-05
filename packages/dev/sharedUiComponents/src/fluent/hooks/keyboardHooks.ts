import { useFluent } from "@fluentui/react-components";
import { useEffect, useState } from "react";

type KeyStateOptions = {
    currentDocument?: boolean;
    mainDocument?: boolean;
};

type KeyCallbacks = {
    onKeyDown?: (e: KeyboardEvent) => void;
    onKeyUp?: (e: KeyboardEvent) => void;
};

export function useKeyListener(callbacks: KeyCallbacks, options?: KeyStateOptions) {
    const watchCurrentDocument = options?.currentDocument ?? true;
    const watchMainDocument = options?.mainDocument ?? true;

    const { targetDocument: currentDocument } = useFluent();

    const callbackMap = new Map<"keydown" | "keyup", ((e: KeyboardEvent) => void) | undefined>([
        ["keydown", callbacks.onKeyDown],
        ["keyup", callbacks.onKeyUp],
    ]);

    for (const eventType of ["keydown", "keyup"] as const) {
        for (const doc of [watchCurrentDocument ? currentDocument : null, watchMainDocument ? document : null]) {
            const handler = callbackMap.get(eventType);
            useEffect(() => {
                if (doc && handler) {
                    // Ignore repeated events from holding down a key.
                    const guardedHandler = (e: KeyboardEvent) => {
                        if (!e.repeat) {
                            handler(e);
                        }
                    };

                    doc.addEventListener(eventType, guardedHandler);
                    return () => {
                        doc.removeEventListener(eventType, guardedHandler);
                    };
                }
                return undefined;
            }, [doc, handler]);
        }
    }
}

export function useKeyState(key: string, options?: KeyStateOptions): boolean {
    const [isPressed, setIsPressed] = useState(false);

    useKeyListener(
        {
            onKeyDown: (e) => {
                if (e.key === key) {
                    setIsPressed(true);
                }
            },
            onKeyUp: (e) => {
                if (e.key === key) {
                    setIsPressed(false);
                }
            },
        },
        options
    );

    return isPressed;
}
