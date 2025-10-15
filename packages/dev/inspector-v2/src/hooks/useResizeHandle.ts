// NOTE: This is basically a super simplified version of https://github.com/microsoft/fluentui-contrib/blob/main/packages/react-resize-handle/src/hooks
// This version does not support keyboard interactions, absolute values, min/max, accessibility, and various other features.
// We can switch back to Fluent's implementation once some known bugs are fixed, such as https://github.com/microsoft/fluentui-contrib/issues/523.

import { useCallback, useEffect, useState } from "react";

export type GrowDirection = "end" | "start" | "up" | "down";

export type UseResizeHandleParams = {
    /**
     * The direction in which the element is considered growing in size ('end', 'start', 'up', or 'down').
     */
    growDirection: GrowDirection;
    /**
     * The name of the CSS variable that will be set on the wrapper element to reflect the current size of the element.
     */
    variableName: string;
    /**
     * A callback that will be called when the element is resized.
     *
     * @remarks The passed function should be memoized for better performance.
     */
    onChange?: (value: number) => void;
};

/**
 * A custom hook that helps with element resizing.
 * @param params The parameters for the resize handle.
 * @returns An object containing refs and a function to set the value.
 */
export function useResizeHandle(params: UseResizeHandleParams) {
    const { growDirection, variableName, onChange } = params;

    // const [value, setValue] = useState(0);
    const [elementRef, setElementRef] = useState<HTMLElement | null>(null);
    const [handleRef, setHandleRef] = useState<HTMLElement | null>(null);

    const setValue = useCallback(
        (value: number) => {
            if (elementRef) {
                elementRef.style.setProperty(variableName, `${value}px`);
            }
            onChange?.(value);
        },
        [elementRef, variableName, onChange]
    );

    useEffect(() => {
        if (handleRef) {
            let delta = 0;

            const onPointerMove = (event: PointerEvent) => {
                event.preventDefault();
                switch (growDirection) {
                    case "up":
                        delta -= event.movementY;
                        break;
                    case "down":
                        delta += event.movementY;
                        break;
                    case "start":
                        delta -= event.movementX;
                        break;
                    case "end":
                        delta += event.movementX;
                        break;
                }
                setValue(delta);
            };

            const onPointerDown = (event: PointerEvent) => {
                event.preventDefault();
                handleRef.setPointerCapture(event.pointerId);
                handleRef.addEventListener("pointermove", onPointerMove);
            };

            const onPointerUp = (event: PointerEvent) => {
                event.preventDefault();
                handleRef.releasePointerCapture(event.pointerId);
                handleRef.removeEventListener("pointermove", onPointerMove);
            };

            handleRef.addEventListener("pointerdown", onPointerDown);
            handleRef.addEventListener("pointerup", onPointerUp);
        }
    }, [handleRef]);

    return {
        elementRef: setElementRef,
        handleRef: setHandleRef,
        setValue,
    };
}
