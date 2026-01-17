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
        const onPlayheadMoved = observables.onPlayheadMoved.add((frame) => {
            actions.setActiveFrame(frame);
            setCurrentFrame(frame);
        });

        return () => {
            observables.onGraphMoved.remove(onMoved);
            observables.onGraphScaled.remove(onScaled);
            observables.onPlayheadMoved.remove(onPlayheadMoved);
        };
    }, [observables, actions]);

    // Track animation playback using requestAnimationFrame
    useEffect(() => {
        const trackAnimation = () => {
            if (state.isPlaying && state.activeAnimations.length > 0) {
                const animation = state.activeAnimations[0];
                if (animation && animation.runtimeAnimations && animation.runtimeAnimations.length > 0) {
                    const runtimeAnimation = animation.runtimeAnimations[0];
                    if (runtimeAnimation && runtimeAnimation.currentFrame !== undefined) {
                        const frame = runtimeAnimation.currentFrame;
                        setCurrentFrame(frame);
                        actions.setActiveFrame(frame);
                    }
                }
            }
            animationFrameRef.current = requestAnimationFrame(trackAnimation);
        };

        if (state.isPlaying) {
            animationFrameRef.current = requestAnimationFrame(trackAnimation);
        }

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [state.isPlaying, state.activeAnimations, actions]);

    // Sync currentFrame with activeFrame when not playing
    useEffect(() => {
        if (!state.isPlaying) {
            setCurrentFrame(state.activeFrame);
        }
    }, [state.activeFrame, state.isPlaying]);

    // Calculate playhead position
    const getPlayheadX = useCallback(() => {
        const { fromKey, toKey } = state;
        const range = toKey - fromKey;
        if (range <= 0) {
            return graphOffsetX;
        }
        return graphOffsetX + ((currentFrame - fromKey) / range) * viewWidth * scale + offsetX;
    }, [state.fromKey, state.toKey, currentFrame, viewWidth, scale, offsetX]);

    // Convert x to frame
    const xToFrame = useCallback(
        (x: number) => {
            const { fromKey, toKey } = state;
            const range = toKey - fromKey;
            const frame = fromKey + ((x - graphOffsetX - offsetX) / (viewWidth * scale)) * range;
            return Math.max(fromKey, Math.min(toKey, Math.round(frame)));
        },
        [state.fromKey, state.toKey, viewWidth, scale, offsetX]
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
