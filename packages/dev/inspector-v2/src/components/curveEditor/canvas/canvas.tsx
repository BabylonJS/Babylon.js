import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useEffect, useRef, useState } from "react";

import { useCurveEditor } from "../curveEditorContext";
import { Graph } from "./graph";
import { PlayHead } from "./playHead";
import { FrameBar } from "./frameBar";
import { RangeFrameBar } from "./rangeFrameBar";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        position: "relative",
        backgroundColor: tokens.colorNeutralBackground3,
        overflow: "hidden",
    },
    frameBar: {
        flexShrink: 0,
        height: "30px",
        backgroundColor: tokens.colorNeutralBackground2,
    },
    canvasArea: {
        flex: 1,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
    },
    rangeFrameBar: {
        flexShrink: 0,
        height: "40px",
        backgroundColor: tokens.colorNeutralBackground2,
    },
});

/**
 * Main canvas area containing the graph, playhead, and frame bars
 * @returns The canvas component
 */
export const Canvas: FunctionComponent = () => {
    const styles = useStyles();
    const { observables } = useCurveEditor();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Note: Child components (Graph, PlayHead, etc.) handle their own observable subscriptions
    // No need for canvas to re-render on animation changes

    // Update dimensions on resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        updateDimensions();

        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        const onResize = observables.onHostWindowResized.add(updateDimensions);

        return () => {
            observer.disconnect();
            observables.onHostWindowResized.remove(onResize);
        };
    }, [observables]);

    return (
        <div className={styles.root} ref={containerRef}>
            <div className={styles.frameBar}>
                <FrameBar width={dimensions.width} />
            </div>
            <div className={styles.canvasArea}>
                <Graph width={dimensions.width} height={dimensions.height - 70} />
                <PlayHead width={dimensions.width} height={dimensions.height - 70} />
            </div>
            <div className={styles.rangeFrameBar}>
                <RangeFrameBar width={dimensions.width} />
            </div>
        </div>
    );
};
