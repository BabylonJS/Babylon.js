import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCurveEditor } from "../curveEditorContext";
import { useObservableState } from "../../../hooks/observableHooks";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: tokens.colorNeutralBackground2,
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none",
    },
    svg: {
        width: "100%",
        height: "100%",
    },
    tickLabel: {
        fill: tokens.colorNeutralForeground3,
        fontSize: "12px",
        fontFamily: "acumin-pro-condensed, sans-serif",
        textAnchor: "middle",
    },
    tickLine: {
        stroke: tokens.colorNeutralStroke2,
        strokeWidth: "0.5px",
    },
    keyframeLine: {
        stroke: "#ffc017",
        strokeWidth: "0.5px",
    },
    activeFrameLine: {
        stroke: tokens.colorBrandForeground1,
        strokeWidth: "1px",
    },
});

type RangeFrameBarProps = {
    width: number;
};

const TICK_DISTANCE = 25;
const OFFSET_X = 10;

/**
 * Range frame bar showing frame tick marks and keyframe indicators
 * @returns The range frame bar component
 */
export const RangeFrameBar: FunctionComponent<RangeFrameBarProps> = ({ width }) => {
    const styles = useStyles();
    const { state, observables } = useCurveEditor();
    const svgRef = useRef<SVGSVGElement>(null);
    const [viewWidth, setViewWidth] = useState(width);
    const [displayFrame, setDisplayFrame] = useState(state.activeFrame);

    // Re-render when range updates
    // useCallback stabilizes the accessor to prevent infinite re-render loops
    useObservableState(
        useCallback(() => ({}), []),
        observables.onRangeUpdated
    );

    // Update view width on resize
    useEffect(() => {
        const updateWidth = () => {
            if (svgRef.current) {
                setViewWidth(svgRef.current.clientWidth);
            }
        };

        updateWidth();

        const onResize = observables.onHostWindowResized.add(updateWidth);
        // Track playhead position during playback using local state to avoid full context re-renders
        const onPlayheadMoved = observables.onPlayheadMoved.add((frame) => setDisplayFrame(frame));

        return () => {
            observables.onHostWindowResized.remove(onResize);
            observables.onPlayheadMoved.remove(onPlayheadMoved);
        };
    }, [observables]);

    // Sync display frame with state.activeFrame when not playing
    useEffect(() => {
        if (!state.isPlaying) {
            setDisplayFrame(state.activeFrame);
        }
    }, [state.activeFrame, state.isPlaying]);

    // Compute frame ticks
    const frameTicks = useMemo(() => {
        if (state.activeAnimations.length === 0) {
            return [];
        }

        const { fromKey, toKey } = state;
        const range = toKey - fromKey;
        if (range <= 0) {
            return [];
        }

        const convertRatio = range / viewWidth;
        const offset = Math.max(Math.floor(TICK_DISTANCE * convertRatio), 1);

        const steps: number[] = [];
        const start = fromKey;
        const end = start + range;

        for (let step = start; step <= end; step += offset) {
            steps.push(step);
        }

        // Ensure end is included if not already
        if (steps.length > 0 && steps[steps.length - 1] < end - offset / 2) {
            steps.push(end);
        }

        return steps;
    }, [state.fromKey, state.toKey, state.activeAnimations.length, viewWidth]);

    // Frame to X position
    const frameToX = useCallback(
        (frame: number) => {
            const { fromKey, toKey } = state;
            const range = toKey - fromKey;
            if (range <= 0) {
                return 0;
            }
            return ((frame - fromKey) / range) * viewWidth;
        },
        [state.fromKey, state.toKey, viewWidth]
    );

    // Render keyframe markers for active animations
    const renderKeyframes = useMemo(() => {
        const lines: JSX.Element[] = [];

        for (const animation of state.activeAnimations) {
            const keys = animation.getKeys();
            for (let i = 0; i < keys.length; i++) {
                const x = frameToX(keys[i].frame);
                lines.push(<line key={`keyframe-${animation.uniqueId}-${i}`} className={styles.keyframeLine} x1={x} y1={0} x2={x} y2={40} />);
            }
        }

        return lines;
    }, [state.activeAnimations, frameToX, styles.keyframeLine]);

    // Render active frame marker - uses displayFrame for smooth updates during playback
    const renderActiveFrame = useMemo(() => {
        if (displayFrame === null || displayFrame === undefined) {
            return null;
        }

        const x = frameToX(displayFrame);
        return <line className={styles.activeFrameLine} x1={x} y1={0} x2={x} y2={40} />;
    }, [displayFrame, frameToX, styles.activeFrameLine]);

    const viewBox = `${-OFFSET_X} 0 ${viewWidth + OFFSET_X * 4} 40`;

    return (
        <div className={styles.root}>
            <svg ref={svgRef} className={styles.svg} viewBox={viewBox}>
                {/* Frame tick marks with labels */}
                {frameTicks.map((frame, i) => {
                    const x = frameToX(frame);
                    return (
                        <g key={`tick-${frame}-${i}`}>
                            <line className={styles.tickLine} x1={x} y1={22} x2={x} y2={40} />
                            <text className={styles.tickLabel} x={x} y={14}>
                                {Math.round(frame)}
                            </text>
                        </g>
                    );
                })}

                {renderKeyframes}

                {renderActiveFrame}
            </svg>
        </div>
    );
};
