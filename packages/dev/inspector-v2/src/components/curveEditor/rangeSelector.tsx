import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCurveEditor } from "./curveEditorContext";

const useStyles = makeStyles({
    root: {
        flex: 1,
        height: "25px",
        backgroundColor: tokens.colorNeutralBackground1,
        position: "relative",
        margin: "5px 0",
        minWidth: "100px",
        touchAction: "none",
    },
    scrollbar: {
        position: "absolute",
        top: "2px",
        bottom: "2px",
        backgroundColor: tokens.colorNeutralBackground3,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        minWidth: "70px",
        cursor: "grab",
        touchAction: "none",
        "&:active": {
            cursor: "grabbing",
        },
    },
    handle: {
        width: "20px",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "ew-resize",
        flexShrink: 0,
        touchAction: "none",
    },
    handleIcon: {
        width: "10px",
        height: "12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "& div": {
            height: "2px",
            width: "100%",
            backgroundColor: tokens.colorNeutralForeground3,
        },
    },
    label: {
        flex: 1,
        textAlign: "center",
        fontSize: "12px",
        fontFamily: "acumin-pro-condensed, sans-serif",
        color: tokens.colorNeutralForeground3,
        userSelect: "none",
        pointerEvents: "none",
    },
});

/**
 * Range selector component - a draggable scrollbar for selecting frame range
 * @returns The range selector component
 */
export const RangeSelector: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const containerRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const [viewWidth, setViewWidth] = useState(200);

    // Use refs to avoid stale closures in pointer handlers
    const dragStateRef = useRef<{
        isPointerDown: boolean;
        dragMode: "left" | "right" | "both" | null;
        startX: number;
        startFrom: number;
        startTo: number;
    }>({
        isPointerDown: false,
        dragMode: null,
        startX: 0,
        startFrom: 0,
        startTo: 0,
    });

    // Store current state values in refs for event handlers
    const stateRef = useRef({ fromKey: state.fromKey, toKey: state.toKey });
    stateRef.current = { fromKey: state.fromKey, toKey: state.toKey };

    // Get frame limits from animations
    const minFrame = state.referenceMinFrame;
    const maxFrame = state.clipLength;

    const minFrameRef = useRef(minFrame);
    const maxFrameRef = useRef(maxFrame);
    const viewWidthRef = useRef(viewWidth);
    minFrameRef.current = minFrame;
    maxFrameRef.current = maxFrame;
    viewWidthRef.current = viewWidth;

    // Update view width on resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setViewWidth(containerRef.current.clientWidth - 4);
            }
        };

        updateWidth();

        const resizeObserver = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        const hostResizeObserver = observables.onHostWindowResized.add(updateWidth);

        return () => {
            resizeObserver.disconnect();
            observables.onHostWindowResized.remove(hostResizeObserver);
        };
    }, [observables]);

    // Calculate scrollbar position
    const range = maxFrame - minFrame;
    const leftPos = range > 0 ? 2 + ((state.fromKey - minFrame) / range) * viewWidth : 2;
    const rightPos = range > 0 ? 2 + ((maxFrame - state.toKey) / range) * viewWidth : 2;

    const handlePointerDown = useCallback((evt: React.PointerEvent<HTMLDivElement>) => {
        // Check if we clicked on a handle
        const target = evt.target as HTMLElement;
        let mode: "left" | "right" | "both" = "both";

        // Check target and its parent (for the nested handleIcon div)
        if (target.id === "left-handle" || target.parentElement?.id === "left-handle") {
            mode = "left";
        } else if (target.id === "right-handle" || target.parentElement?.id === "right-handle") {
            mode = "right";
        }

        dragStateRef.current = {
            isPointerDown: true,
            dragMode: mode,
            startX: evt.clientX,
            startFrom: stateRef.current.fromKey,
            startTo: stateRef.current.toKey,
        };

        evt.currentTarget.setPointerCapture(evt.pointerId);
        evt.preventDefault();
    }, []);

    const handlePointerMove = useCallback(
        (evt: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragStateRef.current;
            if (!drag.isPointerDown || !drag.dragMode) {
                return;
            }

            evt.preventDefault();

            const currentMinFrame = minFrameRef.current;
            const currentMaxFrame = maxFrameRef.current;
            const currentRange = currentMaxFrame - currentMinFrame;
            const currentViewWidth = viewWidthRef.current;

            const dx = evt.clientX - drag.startX;
            const frameOffset = currentRange > 0 ? (dx / currentViewWidth) * currentRange : 0;

            if (drag.dragMode === "both") {
                let newFrom = Math.round(drag.startFrom + frameOffset);
                let newTo = Math.round(drag.startTo + frameOffset);

                // Keep within bounds
                if (newTo > currentMaxFrame) {
                    const adjust = newTo - currentMaxFrame;
                    newTo = currentMaxFrame;
                    newFrom -= adjust;
                }
                if (newFrom < currentMinFrame) {
                    const adjust = currentMinFrame - newFrom;
                    newFrom = currentMinFrame;
                    newTo += adjust;
                }

                // Clamp
                newFrom = Math.max(currentMinFrame, Math.min(currentMaxFrame, newFrom));
                newTo = Math.max(currentMinFrame, Math.min(currentMaxFrame, newTo));

                actions.setFromKey(newFrom);
                actions.setToKey(newTo);
            } else if (drag.dragMode === "left") {
                let newFrom = Math.round(drag.startFrom + frameOffset);
                newFrom = Math.max(currentMinFrame, Math.min(stateRef.current.toKey - 1, newFrom));
                actions.setFromKey(newFrom);
            } else if (drag.dragMode === "right") {
                let newTo = Math.round(drag.startTo + frameOffset);
                newTo = Math.max(stateRef.current.fromKey + 1, Math.min(currentMaxFrame, newTo));
                actions.setToKey(newTo);
            }

            observables.onRangeUpdated.notifyObservers();
            actions.stop();
        },
        [actions, observables]
    );

    const handlePointerUp = useCallback((evt: React.PointerEvent<HTMLDivElement>) => {
        dragStateRef.current.isPointerDown = false;
        dragStateRef.current.dragMode = null;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }, []);

    const handlePointerCancel = useCallback((evt: React.PointerEvent<HTMLDivElement>) => {
        dragStateRef.current.isPointerDown = false;
        dragStateRef.current.dragMode = null;
        evt.currentTarget.releasePointerCapture(evt.pointerId);
    }, []);

    return (
        <div ref={containerRef} className={styles.root}>
            <div
                ref={scrollbarRef}
                className={styles.scrollbar}
                style={{
                    left: `${leftPos}px`,
                    right: `${rightPos}px`,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
            >
                <div id="left-handle" className={styles.handle}>
                    <div className={styles.handleIcon}>
                        <div />
                        <div />
                        <div />
                    </div>
                </div>
                <div className={styles.label}>{Math.floor(state.fromKey)}</div>
                <div className={styles.label}>{Math.floor(state.toKey)}</div>
                <div id="right-handle" className={styles.handle}>
                    <div className={styles.handleIcon}>
                        <div />
                        <div />
                        <div />
                    </div>
                </div>
            </div>
        </div>
    );
};
