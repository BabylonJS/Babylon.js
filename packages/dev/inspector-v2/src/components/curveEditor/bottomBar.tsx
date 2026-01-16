import type { FunctionComponent } from "react";

import { makeStyles, tokens, Tooltip, Button as FluentButton } from "@fluentui/react-components";
import { useCallback, useEffect, useState } from "react";
import { PlayRegular, PreviousRegular, NextRegular, ArrowPreviousRegular, ArrowNextRegular, RecordStopRegular } from "@fluentui/react-icons";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { SpinButton } from "shared-ui-components/fluent/primitives/spinButton";
import { useCurveEditor } from "./curveEditorContext";
import { RangeSelector } from "./bottomBar/rangeSelector";

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
 * Bottom bar component with playback controls and frame navigation.
 * @returns The BottomBar component.
 */
export const BottomBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const [clipLength, setClipLength] = useState(state.clipLength);
    const [, forceUpdate] = useState({});

    // Sync clip length with state
    useEffect(() => {
        setClipLength(state.clipLength);
    }, [state.clipLength]);

    // Subscribe to observables
    useEffect(() => {
        const onAnimationsLoaded = observables.onAnimationsLoaded.add(() => {
            forceUpdate({});
        });
        const onActiveAnimationChanged = observables.onActiveAnimationChanged.add(() => {
            forceUpdate({});
        });
        const onClipLengthIncreased = observables.onClipLengthIncreased.add((newLength) => {
            setClipLength(newLength);
            actions.setClipLength(newLength);
        });
        const onClipLengthDecreased = observables.onClipLengthDecreased.add((newLength) => {
            setClipLength(newLength);
            actions.setClipLength(newLength);
        });

        return () => {
            observables.onAnimationsLoaded.remove(onAnimationsLoaded);
            observables.onActiveAnimationChanged.remove(onActiveAnimationChanged);
            observables.onClipLengthIncreased.remove(onClipLengthIncreased);
            observables.onClipLengthDecreased.remove(onClipLengthDecreased);
        };
    }, [observables, actions]);

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
            {/* Media controls */}
            <div className={styles.mediaControls}>
                <Tooltip content="First frame" relationship="label">
                    <Button icon={PreviousRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={handleFirstFrame} />
                </Tooltip>
                <Tooltip content="Previous key" relationship="label">
                    <Button icon={ArrowPreviousRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={handlePrevKey} />
                </Tooltip>
                <Tooltip content="Play backward" relationship="label">
                    <FluentButton
                        icon={<PlayRegular style={{ transform: "scaleX(-1)" }} />}
                        appearance={state.isPlaying && !state.forwardAnimation ? "primary" : "subtle"}
                        size="small"
                        disabled={!hasActiveAnimations}
                        onClick={handlePlayBackward}
                    />
                </Tooltip>
                <Tooltip content="Stop" relationship="label">
                    <Button icon={RecordStopRegular} appearance="subtle" disabled={!hasActiveAnimations || !state.isPlaying} onClick={handleStop} />
                </Tooltip>
                <Tooltip content="Play forward" relationship="label">
                    <Button
                        icon={PlayRegular}
                        appearance={state.isPlaying && state.forwardAnimation ? "primary" : "subtle"}
                        disabled={!hasActiveAnimations}
                        onClick={handlePlayForward}
                    />
                </Tooltip>
                <Tooltip content="Next key" relationship="label">
                    <Button icon={ArrowNextRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={handleNextKey} />
                </Tooltip>
                <Tooltip content="Last frame" relationship="label">
                    <Button icon={NextRegular} appearance="subtle" disabled={!hasActiveAnimations} onClick={handleLastFrame} />
                </Tooltip>
            </div>

            {/* Current frame display */}
            <div className={styles.frameDisplay}>
                <span className={styles.frameLabel}>Frame:</span>
                <SpinButton
                    className={styles.spinButton}
                    value={state.activeFrame}
                    onChange={handleFrameChange}
                    min={state.fromKey}
                    max={state.toKey}
                    disabled={!hasActiveAnimations}
                />
            </div>

            {/* Range selector */}
            <RangeSelector />

            {/* Clip length */}
            <div className={styles.clipLengthSection}>
                <span className={styles.frameLabel}>Clip Length:</span>
                <SpinButton className={styles.spinButton} value={clipLength} onChange={handleClipLengthChange} min={1} disabled={!hasActiveAnimations} />
            </div>
        </div>
    );
};
