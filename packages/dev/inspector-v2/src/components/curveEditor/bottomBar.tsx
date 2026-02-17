import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { PlayRegular, PreviousRegular, NextRegular, ArrowPreviousRegular, ArrowNextRegular, RecordStopRegular, TriangleLeftRegular } from "@fluentui/react-icons";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { SpinButton } from "shared-ui-components/fluent/primitives/spinButton";
import { useCurveEditor } from "./curveEditorContext";
import { RangeSelector } from "./rangeSelector";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
        padding: `0 ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground3,
        height: "100%",
        boxSizing: "border-box",
    },
    mediaControls: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXXS,
    },
    frameDisplay: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    frameLabel: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    spinButton: {
        width: "70px",
    },
    rangeSection: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        flex: 1,
    },
    clipLengthSection: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        marginLeft: "auto",
    },
});

/**
 * Props for the MediaControls component
 */
type MediaControlsProps = {
    hasActiveAnimations: boolean;
    isPlaying: boolean;
    forwardAnimation: boolean;
    onPlayForward: () => void;
    onPlayBackward: () => void;
    onStop: () => void;
    onPrevKey: () => void;
    onNextKey: () => void;
    onFirstFrame: () => void;
    onLastFrame: () => void;
};

/**
 * Memoized media controls component to prevent re-renders during playback
 */
const MediaControls = memo<MediaControlsProps>(
    ({ hasActiveAnimations, isPlaying, forwardAnimation, onPlayForward, onPlayBackward, onStop, onPrevKey, onNextKey, onFirstFrame, onLastFrame }) => {
        return (
            <>
                <Button icon={PreviousRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={onFirstFrame} title="First frame" />
                <Button icon={ArrowPreviousRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={onPrevKey} title="Previous key" />
                <Button
                    icon={TriangleLeftRegular}
                    appearance={isPlaying && !forwardAnimation ? "primary" : "subtle"}
                    disabled={!hasActiveAnimations}
                    onClick={onPlayBackward}
                    title="Play backward"
                />
                <Button icon={RecordStopRegular} appearance="subtle" disabled={!hasActiveAnimations || !isPlaying} onClick={onStop} title="Stop" />
                <Button
                    icon={PlayRegular}
                    appearance={isPlaying && forwardAnimation ? "primary" : "subtle"}
                    disabled={!hasActiveAnimations}
                    onClick={onPlayForward}
                    title="Play forward"
                />
                <Button icon={ArrowNextRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={onNextKey} title="Next key" />
                <Button icon={NextRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={onLastFrame} title="Last frame" />
            </>
        );
    }
);

MediaControls.displayName = "MediaControls";

/**
 * Bottom bar component with playback controls and frame navigation.
 * @returns The BottomBar component.
 */
export const BottomBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    // Track display frame separately for smooth updates during playback
    const [displayFrame, setDisplayFrame] = useState(state.activeFrame);

    // Use clipLength from state, with referenceMaxFrame as fallback
    const effectiveClipLength = state.clipLength > 0 ? state.clipLength : state.referenceMaxFrame;
    const [clipLength, setClipLength] = useState(effectiveClipLength);

    // Track whether the clip length input is focused to avoid syncing mid-typing
    const clipLengthFocused = useRef(false);

    // Keep a ref to current toKey for use in observers
    const toKeyRef = useRef(state.toKey);
    toKeyRef.current = state.toKey;

    // Subscribe to playhead moved for display updates during playback
    useEffect(() => {
        const onPlayheadMoved = observables.onPlayheadMoved.add((frame) => {
            setDisplayFrame(frame);
        });

        return () => {
            observables.onPlayheadMoved.remove(onPlayheadMoved);
        };
    }, [observables]);

    // Sync display frame with state.activeFrame when not playing
    useEffect(() => {
        if (!state.isPlaying) {
            setDisplayFrame(state.activeFrame);
        }
    }, [state.activeFrame, state.isPlaying]);

    // Sync clip length with state (but not while the user is typing)
    useEffect(() => {
        if (!clipLengthFocused.current) {
            const newClipLength = state.clipLength > 0 ? state.clipLength : state.referenceMaxFrame;
            setClipLength(newClipLength);
        }
    }, [state.clipLength, state.referenceMaxFrame]);

    // Subscribe to clip length change observables
    useEffect(() => {
        const onClipLengthIncreased = observables.onClipLengthIncreased.add((newLength) => {
            setClipLength(newLength);
            actions.setClipLength(newLength);
            actions.setReferenceMaxFrame(newLength);

            // Move playhead to new clip end (like v1)
            observables.onMoveToFrameRequired.notifyObservers(newLength);

            // Create a key at the boundary if one doesn't exist (like v1's getKeyAtAnyFrameIndex check)
            let keyExists = false;
            for (const animation of state.activeAnimations) {
                const keys = animation.getKeys();
                for (const key of keys) {
                    if (Math.floor(newLength - key.frame) === 0) {
                        keyExists = true;
                        break;
                    }
                }
                if (keyExists) {
                    break;
                }
            }
            if (!keyExists) {
                observables.onCreateOrUpdateKeyPointRequired.notifyObservers();
            }
        });
        const onClipLengthDecreased = observables.onClipLengthDecreased.add((newLength) => {
            setClipLength(newLength);
            actions.setClipLength(newLength);
            actions.setReferenceMaxFrame(newLength);

            // Move playhead to new clip end (like v1)
            observables.onMoveToFrameRequired.notifyObservers(newLength);

            // Create a key at the boundary if one doesn't exist (like v1)
            let keyExists = false;
            for (const animation of state.activeAnimations) {
                const keys = animation.getKeys();
                for (const key of keys) {
                    if (Math.floor(newLength - key.frame) === 0) {
                        keyExists = true;
                        break;
                    }
                }
                if (keyExists) {
                    break;
                }
            }
            if (!keyExists) {
                observables.onCreateOrUpdateKeyPointRequired.notifyObservers();
            }

            // Clamp toKey to new clip length (like v1)
            if (toKeyRef.current > newLength) {
                actions.setToKey(newLength);
            }
            observables.onRangeUpdated.notifyObservers();
        });

        return () => {
            observables.onClipLengthIncreased.remove(onClipLengthIncreased);
            observables.onClipLengthDecreased.remove(onClipLengthDecreased);
        };
    }, [observables, actions, state.activeAnimations]);

    const handlePlayForward = useCallback(() => {
        actions.play(true);
    }, [actions]);

    const handlePlayBackward = useCallback(() => {
        actions.play(false);
    }, [actions]);

    const handleStop = useCallback(() => {
        actions.stop();
    }, [actions]);

    const handlePrevKey = useCallback(() => {
        const prevFrame = actions.getPrevKey();
        if (prevFrame !== null) {
            actions.moveToFrame(prevFrame);
        }
    }, [actions]);

    const handleNextKey = useCallback(() => {
        const nextFrame = actions.getNextKey();
        if (nextFrame !== null) {
            actions.moveToFrame(nextFrame);
        }
    }, [actions]);

    const handleFirstFrame = useCallback(() => {
        actions.moveToFrame(state.fromKey);
    }, [actions, state.fromKey]);

    const handleLastFrame = useCallback(() => {
        actions.moveToFrame(state.toKey);
    }, [actions, state.toKey]);

    /**
     * Handler for frame input change.
     * @param value - The new frame value.
     */
    const handleFrameChange = useCallback(
        (value: number) => {
            actions.moveToFrame(value);
        },
        [actions]
    );

    /**
     * Handler for clip length change.
     * @param value - The new clip length value.
     */
    const handleClipLengthChange = useCallback(
        (value: number) => {
            const newLength = Math.max(1, value);
            if (newLength > state.clipLength) {
                observables.onClipLengthIncreased.notifyObservers(newLength);
            } else if (newLength < state.clipLength) {
                observables.onClipLengthDecreased.notifyObservers(newLength);
            }
        },
        [state.clipLength, observables]
    );

    const hasActiveAnimations = state.activeAnimations.length > 0;

    return (
        <div className={styles.root}>
            <div className={styles.mediaControls}>
                <MediaControls
                    hasActiveAnimations={hasActiveAnimations}
                    isPlaying={state.isPlaying}
                    forwardAnimation={state.forwardAnimation}
                    onPlayForward={handlePlayForward}
                    onPlayBackward={handlePlayBackward}
                    onStop={handleStop}
                    onPrevKey={handlePrevKey}
                    onNextKey={handleNextKey}
                    onFirstFrame={handleFirstFrame}
                    onLastFrame={handleLastFrame}
                />
            </div>

            {/* Current frame display - uses displayFrame for smooth updates during playback */}
            <div className={styles.frameDisplay}>
                <div className={styles.frameLabel}>Frame:</div>
                <SpinButton className={styles.spinButton} value={displayFrame} onChange={handleFrameChange} min={state.fromKey} max={state.toKey} disabled={!hasActiveAnimations} />
            </div>

            <RangeSelector />

            <div className={styles.clipLengthSection}>
                <div className={styles.frameLabel}>Clip Length:</div>
                <div
                    onFocusCapture={() => {
                        clipLengthFocused.current = true;
                    }}
                    onBlurCapture={() => {
                        clipLengthFocused.current = false;
                        // Sync the final value on blur
                        const newClipLength = state.clipLength > 0 ? state.clipLength : state.referenceMaxFrame;
                        setClipLength(newClipLength);
                    }}
                >
                    <SpinButton className={styles.spinButton} value={clipLength} onChange={handleClipLengthChange} min={1} disabled={!hasActiveAnimations} />
                </div>
            </div>
        </div>
    );
};
