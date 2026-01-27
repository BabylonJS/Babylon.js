import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useRef, useState } from "react";

import { useCurveEditor } from "../curveEditorContext";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        height: "30px",
        backgroundColor: tokens.colorNeutralBackground3,
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        userSelect: "none",
        overflow: "hidden",
        position: "relative",
    },
    tick: {
        position: "absolute",
        height: "8px",
        width: "1px",
        backgroundColor: tokens.colorNeutralStroke1,
        bottom: 0,
    },
    label: {
        position: "absolute",
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        bottom: "10px",
    },
});

type FrameBarProps = {
    /** Width of the frame bar */
    width: number;
};

/**
 * Frame bar showing frame numbers along the top of the graph
 * @param props - The component props
 * @returns The frame bar component
 */
export const FrameBar: FunctionComponent<FrameBarProps> = ({ width }) => {
    const styles = useStyles();
    const { state, observables } = useCurveEditor();
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);

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

        return () => {
            observables.onGraphMoved.remove(onMoved);
            observables.onGraphScaled.remove(onScaled);
        };
    }, [observables]);

    // Generate tick marks - use reference frames for full visible range
    const renderTicks = useCallback(() => {
        const ticks: JSX.Element[] = [];
        const { referenceMinFrame, referenceMaxFrame } = state;

        const range = referenceMaxFrame - referenceMinFrame;
        if (range <= 0 || viewWidth <= 0) {
            return ticks;
        }

        // Determine tick spacing based on zoom level
        let tickSpacing = 10;
        if (range > 500) {
            tickSpacing = 100;
        } else if (range > 200) {
            tickSpacing = 50;
        } else if (range > 100) {
            tickSpacing = 20;
        } else if (range > 50) {
            tickSpacing = 10;
        } else {
            tickSpacing = 5;
        }

        const startFrame = Math.floor(referenceMinFrame / tickSpacing) * tickSpacing;
        const endFrame = Math.ceil(referenceMaxFrame / tickSpacing) * tickSpacing;

        for (let frame = startFrame; frame <= endFrame; frame += tickSpacing) {
            const x = graphOffsetX + ((frame - referenceMinFrame) / range) * viewWidth * scale + offsetX;

            if (x >= graphOffsetX && x <= width) {
                ticks.push(
                    <div key={`tick-${frame}`} className={styles.tick} style={{ left: x }} />,
                    <span key={`label-${frame}`} className={styles.label} style={{ left: x - 10 }}>
                        {frame}
                    </span>
                );
            }
        }

        return ticks;
    }, [state.referenceMinFrame, state.referenceMaxFrame, viewWidth, width, scale, offsetX, styles]);

    return (
        <div className={styles.root} ref={containerRef}>
            {renderTicks()}
        </div>
    );
};
