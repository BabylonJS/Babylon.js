import { useFluent } from "@fluentui/react-components";
import { useEffect } from "react";

export type WindowOptions = {
    current?: boolean;
    primary?: boolean;
};

export function useEventListener<EventT extends keyof DocumentEventMap>(
    source: "document",
    eventName: EventT,
    handler: (e: DocumentEventMap[EventT]) => void,
    options?: WindowOptions
): void;
export function useEventListener<EventT extends keyof WindowEventMap>(
    source: "window",
    eventName: EventT,
    handler: (e: WindowEventMap[EventT]) => void,
    options?: WindowOptions
): void;
export function useEventListener(source: "document" | "window", eventName: string, handler: (e: Event) => void, options?: WindowOptions): void {
    const watchCurrent = options?.current ?? true;
    const watchPrimary = options?.primary ?? true;

    const { targetDocument: currentDocument } = useFluent();

    const currentSource = !watchCurrent ? null : source === "window" ? currentDocument?.defaultView : currentDocument;
    const primarySource = !watchPrimary ? null : source === "window" ? window : document;

    for (const eventSource of [currentSource, primarySource]) {
        useEffect(() => {
            if (eventSource && handler) {
                eventSource.addEventListener(eventName, handler);
                return () => {
                    eventSource.removeEventListener(eventName, handler);
                };
            }
            return undefined;
        }, [eventSource, eventName, handler]);
    }
}
