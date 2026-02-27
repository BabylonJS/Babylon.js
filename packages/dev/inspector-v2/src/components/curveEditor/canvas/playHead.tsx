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
        backgroundColor: tokens.colorBrandForeground1,
        pointerEvents: "auto",
        cursor: "ew-resize",
    },
    handle: {
        position: "absolute",
        top: 0,
        width: "20px",
        height: "20px",
        backgroundColor: tokens.colorBrandBackground,
        borderRadius: "50%",
        border: `2px solid ${tokens.colorNeutralBackground1}`,
        pointerEvents: "auto",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.colorNeutralForegroundOnBrand,
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
 * Uses direct DOM manipulation (like v1) to avoid render cycle flashing during animation
 * @returns The playhead component
 */
export const PlayHead: FunctionComponent<PlayHeadProps> = ({ width, height: _height }) => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();
    const [isDragging, setIsDragging] = useState(false);

    // Use refs for all mutable values to avoid render cycles
    const scaleRef = useRef(1);
    const offsetXRef = useRef(0);
    const currentFrameRef = useRef(state.activeFrame);
    const animationFrameRef = useRef<number | null>(null);
    const isPlayingRef = useRef(state.isPlaying);

    // Cache state values that we need for calculations
    const referenceMinFrameRef = useRef(state.referenceMinFrame);
    const referenceMaxFrameRef = useRef(state.referenceMaxFrame);
    const fromKeyRef = useRef(state.fromKey);
    const toKeyRef = useRef(state.toKey);
    const activeAnimationsRef = useRef(state.activeAnimations);

    // DOM refs for direct manipulation (avoids flash during playback)
    const lineRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    const graphOffsetX = 30;
    const viewWidth = width - graphOffsetX;

    // Update cached refs when state changes (but don't trigger re-renders for playhead position)
    useEffect(() => {
        referenceMinFrameRef.current = state.referenceMinFrame;
        referenceMaxFrameRef.current = state.referenceMaxFrame;
        fromKeyRef.current = state.fromKey;
        toKeyRef.current = state.toKey;
        activeAnimationsRef.current = state.activeAnimations;
    }, [state.referenceMinFrame, state.referenceMaxFrame, state.fromKey, state.toKey, state.activeAnimations]);

    // Calculate and apply playhead position directly to DOM
    const moveHead = useCallback(
        (frame: number) => {
            if (!lineRef.current || !handleRef.current) {
                return;
            }

            const range = referenceMaxFrameRef.current - referenceMinFrameRef.current;
            if (range <= 0) {
                return;
            }

            const x = graphOffsetX + ((frame - referenceMinFrameRef.current) / range) * viewWidth * scaleRef.current + offsetXRef.current;

            // Hide if out of view
            if (x < graphOffsetX || x > width) {
                lineRef.current.style.display = "none";
                handleRef.current.style.display = "none";
            } else {
                lineRef.current.style.display = "";
                handleRef.current.style.display = "";
                lineRef.current.style.left = `${x}px`;
                handleRef.current.style.left = `${x}px`;
                handleRef.current.textContent = Math.round(frame).toString();
            }

            currentFrameRef.current = frame;
        },
        [viewWidth, width]
    );

    // Subscribe to all observables in a single effect
    useEffect(() => {
        const onMoved = observables.onGraphMoved.add((newOffset) => {
            offsetXRef.current = newOffset;
            moveHead(currentFrameRef.current);
        });
        const onScaled = observables.onGraphScaled.add((newScale) => {
            scaleRef.current = newScale;
            moveHead(currentFrameRef.current);
        });
        const onPlayheadMoved = observables.onPlayheadMoved.add((frame) => {
            // Skip during playback - we update ourselves via requestAnimationFrame
            if (!isPlayingRef.current) {
                moveHead(frame);
            }
        });
        const onMoveToFrame = observables.onMoveToFrameRequired.add((frame) => {
            moveHead(frame);
        });

        // Initial position
        moveHead(currentFrameRef.current);

        return () => {
            observables.onGraphMoved.remove(onMoved);
            observables.onGraphScaled.remove(onScaled);
            observables.onPlayheadMoved.remove(onPlayheadMoved);
            observables.onMoveToFrameRequired.remove(onMoveToFrame);
        };
    }, [observables, moveHead]);

    // Track animation playback using requestAnimationFrame - separate from render cycle
    useEffect(() => {
        isPlayingRef.current = state.isPlaying;

        const trackAnimation = () => {
            if (!isPlayingRef.current) {
                return;
            }

            const animations = activeAnimationsRef.current;
            if (animations.length > 0) {
                const animation = animations[0];
                if (animation && animation.runtimeAnimations && animation.runtimeAnimations.length > 0) {
                    const runtimeAnimation = animation.runtimeAnimations[0];
                    if (runtimeAnimation && runtimeAnimation.currentFrame !== undefined) {
                        const frame = runtimeAnimation.currentFrame;
                        moveHead(frame);
                        // Notify other components (like RangeFrameBar) about the playhead position
                        observables.onPlayheadMoved.notifyObservers(frame);
                    }
                }
            }

            animationFrameRef.current = requestAnimationFrame(trackAnimation);
        };

        if (state.isPlaying) {
            animationFrameRef.current = requestAnimationFrame(trackAnimation);
        } else {
            // When playback stops, sync the context's activeFrame
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            // Only update if the frame actually changed
            if (currentFrameRef.current !== state.activeFrame) {
                actions.setActiveFrame(currentFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [state.isPlaying, actions, moveHead, state.activeFrame]);

    // Convert x to frame
    const xToFrame = useCallback(
        (x: number) => {
            const range = referenceMaxFrameRef.current - referenceMinFrameRef.current;
            const frame = referenceMinFrameRef.current + ((x - graphOffsetX - offsetXRef.current) / (viewWidth * scaleRef.current)) * range;
            // Clamp to the active playback range
            return Math.max(fromKeyRef.current, Math.min(toKeyRef.current, Math.round(frame)));
        },
        [viewWidth]
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

            moveHead(frame);
            actions.moveToFrame(frame);
        },
        [isDragging, xToFrame, actions, moveHead]
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, []);

    return (
        <div className={styles.root}>
            <div ref={lineRef} className={styles.line} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
            <div ref={handleRef} className={styles.handle} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} />
        </div>
    );
};
