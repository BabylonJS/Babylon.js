import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCurveEditor } from "../curveEditorContext";

const useStyles = makeStyles({
    root: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
    },
    line: {
        position: "absolute",
        width: "2px",
        height: "100%",
        backgroundColor: tokens.colorNeutralForegroundOnBrand,
        pointerEvents: "auto",
        cursor: "ew-resize",
    },
    handle: {
        position: "absolute",
        top: 0,
        width: "20px",
        height: "20px",
        backgroundColor: tokens.colorNeutralForegroundOnBrand,
        borderRadius: "50%",
        border: `2px solid ${tokens.colorNeutralBackground1}`,
        pointerEvents: "auto",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.colorNeutralBackground1,
        fontSize: "9px",
        fontWeight: "bold",
        userSelect: "none",
        transform: "translateX(-50%)",
    },
});

type PlayHeadProps = {
    width: number;
    height: number;
};

/**
 * Playhead component showing current frame position
 * @returns The playhead component
 */
export const PlayHead: FunctionComponent<PlayHeadProps> = ({ width, height: _height }) => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();
    const [isDragging, setIsDragging] = useState(false);
    const [scale, setScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(state.activeFrame);
    const animationFrameRef = useRef<number | null>(null);

    const graphOffsetX = 30;
    const viewWidth = width - graphOffsetX;

    // Subscribe to graph moved/scaled events
    useEffect(() => {
        const onMoved = observables.onGraphMoved.add((newOffset) => {
            setOffsetX(newOffset);
        });
        const onScaled = observables.onGraphScaled.add((newScale) => {
            setScale(newScale);
        });
        // Note: onPlayheadMoved updates the local frame display.
        // We only update the context's activeFrame if NOT playing (during playback,
        // the PlayHead component notifies observers but doesn't update context state).
        const onPlayheadMoved = observables.onPlayheadMoved.add((frame) => {
            setCurrentFrame(frame);
            lastFrameRef.current = frame; // Keep lastFrameRef in sync to prevent reset on stop
            // Only update context if not playing - during playback, frame updates
            // come from our own RAF loop and shouldn't trigger context re-renders
            if (!state.isPlaying) {
                actions.setActiveFrame(frame);
            }
        });

        return () => {
            observables.onGraphMoved.remove(onMoved);
            observables.onGraphScaled.remove(onScaled);
            observables.onPlayheadMoved.remove(onPlayheadMoved);
        };
    }, [observables, actions, state.isPlaying]);

    // Track animation playback using requestAnimationFrame
    // Note: We only update local state during playback to avoid constant context re-renders.
    // The context's activeFrame is synced when playback stops.
    const lastFrameRef = useRef<number>(state.activeFrame);
    useEffect(() => {
        const trackAnimation = () => {
            if (state.isPlaying && state.activeAnimations.length > 0) {
                const animation = state.activeAnimations[0];
                if (animation && animation.runtimeAnimations && animation.runtimeAnimations.length > 0) {
                    const runtimeAnimation = animation.runtimeAnimations[0];
                    if (runtimeAnimation && runtimeAnimation.currentFrame !== undefined) {
                        const frame = runtimeAnimation.currentFrame;
                        setCurrentFrame(frame);
                        lastFrameRef.current = frame;
                        // Notify observers about frame change (for UI updates) without updating context state
                        observables.onPlayheadMoved.notifyObservers(frame);
                    }
                }
            }
            animationFrameRef.current = requestAnimationFrame(trackAnimation);
        };

        if (state.isPlaying) {
            animationFrameRef.current = requestAnimationFrame(trackAnimation);
        } else {
            // Sync the context's activeFrame when playback stops
            if (lastFrameRef.current !== state.activeFrame) {
                actions.setActiveFrame(lastFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [state.isPlaying, state.activeAnimations, actions, state.activeFrame, observables]);

    // Sync currentFrame with activeFrame when not playing
    useEffect(() => {
        if (!state.isPlaying) {
            setCurrentFrame(state.activeFrame);
        }
    }, [state.activeFrame, state.isPlaying]);

    // Calculate playhead position (uses reference frames for position)
    const getPlayheadX = useCallback(() => {
        const { referenceMinFrame, referenceMaxFrame } = state;
        const range = referenceMaxFrame - referenceMinFrame;
        if (range <= 0) {
            return graphOffsetX;
        }
        return graphOffsetX + ((currentFrame - referenceMinFrame) / range) * viewWidth * scale + offsetX;
    }, [state.referenceMinFrame, state.referenceMaxFrame, currentFrame, viewWidth, scale, offsetX]);

    // Convert x to frame (uses reference frames for conversion, clamps to fromKey/toKey for playback range)
    const xToFrame = useCallback(
        (x: number) => {
            const { referenceMinFrame, referenceMaxFrame, fromKey, toKey } = state;
            const range = referenceMaxFrame - referenceMinFrame;
            const frame = referenceMinFrame + ((x - graphOffsetX - offsetX) / (viewWidth * scale)) * range;
            // Clamp to the active playback range
            return Math.max(fromKey, Math.min(toKey, Math.round(frame)));
        },
        [state.referenceMinFrame, state.referenceMaxFrame, state.fromKey, state.toKey, viewWidth, scale, offsetX]
    );

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) {
                return;
            }

            const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const frame = xToFrame(x);

            actions.moveToFrame(frame);
            observables.onMoveToFrameRequired.notifyObservers(frame);
        },
        [isDragging, xToFrame, actions, observables]
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, []);

    const playheadX = getPlayheadX();

    // Don't render if playhead is out of view
    if (playheadX < graphOffsetX || playheadX > width) {
        return null;
    }

    return (
        <div className={styles.root}>
            <div className={styles.line} style={{ left: playheadX }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div className={styles.handle} style={{ left: playheadX }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
                {Math.round(currentFrame)}
            </div>
        </div>
    );
};
